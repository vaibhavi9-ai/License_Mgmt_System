"""
SDK router for mobile/desktop application integration
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User, Customer, SubscriptionPack, Subscription, ApiKey
from app.schemas import (
    CustomerLoginRequest, SDKAuthResponse, SubscriptionHistoryResponse
)
from app.auth import verify_password, create_access_token, generate_api_key, ACCESS_TOKEN_EXPIRE_MINUTES
from app.dependencies import get_sdk_customer

router = APIRouter()

@router.post("/auth/login", response_model=SDKAuthResponse)
async def sdk_login(request: CustomerLoginRequest, db: Session = Depends(get_db)):
    """SDK authentication - returns API key for subsequent requests"""
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.password_hash) or user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is disabled"
        )

    # Get customer profile
    customer = db.query(Customer).filter(Customer.user_id == user.id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found"
        )

    # Generate or reuse existing API key
    existing_key = db.query(ApiKey).filter(
        ApiKey.customer_id == customer.id,
        ApiKey.is_active == True
    ).first()

    if existing_key:
        api_key_value = existing_key.key
    else:
        api_key_value = generate_api_key()
        api_key = ApiKey(
            customer_id=customer.id,
            key=api_key_value,
            is_active=True
        )
        db.add(api_key)
        db.commit()

    # Also create JWT token for optional use
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )

    return SDKAuthResponse(
        api_key=api_key_value,
        token=access_token,
        name=customer.name,
        phone=customer.phone,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.get("/v1/subscription")
async def get_sdk_subscription(
    customer: Customer = Depends(get_sdk_customer),
    db: Session = Depends(get_db)
):
    """Get current subscription for SDK"""
    subscription = db.query(Subscription).join(SubscriptionPack).filter(
        Subscription.customer_id == customer.id,
        Subscription.status.in_(["active", "approved"])
    ).first()

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )

    # Check if subscription is valid (not expired)
    is_valid = True
    if subscription.expires_at and subscription.expires_at < datetime.utcnow():
        is_valid = False
        subscription.status = "expired"
        db.commit()

    subscription_data = {
        "id": subscription.id,
        "pack_name": subscription.pack.name,
        "pack_sku": subscription.pack.sku,
        "price": subscription.pack.price,
        "status": subscription.status,
        "assigned_at": subscription.assigned_at,
        "expires_at": subscription.expires_at,
        "is_valid": is_valid
    }

    return {
        "success": True,
        "subscription": subscription_data
    }

@router.post("/v1/subscription")
async def request_sdk_subscription(
    request: dict,  # {"pack_sku": "premium-plan"}
    customer: Customer = Depends(get_sdk_customer),
    db: Session = Depends(get_db)
):
    """Request new subscription via SDK"""
    pack_sku = request.get("pack_sku")
    if not pack_sku:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="pack_sku is required"
        )

    # Check if customer already has an active subscription
    existing_sub = db.query(Subscription).filter(
        Subscription.customer_id == customer.id,
        Subscription.status.in_(["active", "approved", "requested"])
    ).first()

    if existing_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active or pending subscription"
        )

    # Find subscription pack by SKU
    pack = db.query(SubscriptionPack).filter(
        SubscriptionPack.sku == pack_sku,
        SubscriptionPack.is_active == True
    ).first()

    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription pack not found"
        )

    # Create subscription request
    subscription = Subscription(
        customer_id=customer.id,
        pack_id=pack.id,
        status="requested",
        requested_at=datetime.utcnow()
    )

    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    return {
        "success": True,
        "message": "Subscription request submitted successfully",
        "subscription": {
            "id": subscription.id,
            "status": subscription.status,
            "requested_at": subscription.requested_at
        }
    }

@router.delete("/v1/subscription")
async def deactivate_sdk_subscription(
    customer: Customer = Depends(get_sdk_customer),
    db: Session = Depends(get_db)
):
    """Deactivate current subscription via SDK"""
    subscription = db.query(Subscription).filter(
        Subscription.customer_id == customer.id,
        Subscription.status.in_(["active", "approved"])
    ).first()

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )

    subscription.status = "inactive"
    subscription.deactivated_at = datetime.utcnow()

    db.commit()

    return {
        "success": True,
        "message": "Subscription deactivated successfully",
        "deactivated_at": subscription.deactivated_at
    }

@router.get("/v1/subscription-history", response_model=SubscriptionHistoryResponse)
async def get_sdk_subscription_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    sort: str = Query("desc", regex="^(asc|desc)$"),
    customer: Customer = Depends(get_sdk_customer),
    db: Session = Depends(get_db)
):
    """Get subscription history via SDK"""
    query = db.query(Subscription).join(SubscriptionPack).filter(
        Subscription.customer_id == customer.id
    )

    if sort == "desc":
        query = query.order_by(Subscription.created_at.desc())
    else:
        query = query.order_by(Subscription.created_at.asc())

    total = query.count()
    subscriptions = query.offset((page - 1) * limit).limit(limit).all()

    history = []
    for sub in subscriptions:
        history.append({
            "id": sub.id,
            "pack_name": sub.pack.name,
            "status": sub.status,
            "assigned_at": sub.assigned_at,
            "expires_at": sub.expires_at
        })

    return SubscriptionHistoryResponse(
        history=history,
        pagination={
            "page": page,
            "limit": limit,
            "total": total
        }
    )