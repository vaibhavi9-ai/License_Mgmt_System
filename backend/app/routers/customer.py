"""
Customer router for authentication and registration
"""

from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User, Customer, SubscriptionPack, Subscription
from app.schemas import (
    CustomerLoginRequest, CustomerLoginResponse, 
    CustomerSignupRequest, CustomerSignupResponse,
    SubscriptionRequest
)
from app.auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.dependencies import get_customer_user

router = APIRouter()

@router.post("/customer/login", response_model=CustomerLoginResponse)
async def customer_login(request: CustomerLoginRequest, db: Session = Depends(get_db)):
    """Customer login endpoint"""
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

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )

    return CustomerLoginResponse(
        token=access_token,
        name=customer.name,
        phone=customer.phone,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/customer/signup", response_model=CustomerSignupResponse)
async def customer_signup(request: CustomerSignupRequest, db: Session = Depends(get_db)):
    """Customer signup endpoint"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    existing_customer = db.query(Customer).filter(Customer.email == request.email).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user account
    user = User(
        email=request.email,
        password_hash=get_password_hash(request.password),
        role="customer"
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Create customer profile
    customer = Customer(
        user_id=user.id,
        name=request.name,
        email=request.email,
        phone=request.phone
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )

    return CustomerSignupResponse(
        message="Account created successfully",
        token=access_token,
        name=customer.name,
        phone=customer.phone,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

# Customer Subscription Management
@router.get("/v1/customer/subscription-packs")
async def get_customer_subscription_packs(
    current_user: User = Depends(get_customer_user),
    db: Session = Depends(get_db)
):
    """Get available subscription packs for customers"""
    packs = db.query(SubscriptionPack).filter(SubscriptionPack.is_active == True).all()
    
    pack_list = []
    for pack in packs:
        pack_list.append({
            "id": pack.id,
            "name": pack.name,
            "description": pack.description,
            "sku": pack.sku,
            "price": pack.price,
            "validity_months": pack.validity_months
        })
    
    return {
        "success": True,
        "subscription_packs": pack_list
    }

@router.get("/v1/customer/subscription")
async def get_customer_subscription(
    current_user: User = Depends(get_customer_user),
    db: Session = Depends(get_db)
):
    """Get current subscription for customer"""
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found"
        )

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
        "requested_at": subscription.requested_at,
        "approved_at": subscription.approved_at,
        "assigned_at": subscription.assigned_at,
        "expires_at": subscription.expires_at,
        "is_valid": is_valid
    }

    return {
        "success": True,
        "subscription": subscription_data
    }

@router.post("/v1/customer/subscription")
async def request_customer_subscription(
    request: SubscriptionRequest,
    current_user: User = Depends(get_customer_user),
    db: Session = Depends(get_db)
):
    """Request new subscription"""
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found"
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
        SubscriptionPack.sku == request.sku,
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
            "pack_name": pack.name,
            "pack_sku": pack.sku,
            "price": pack.price,
            "status": subscription.status,
            "requested_at": subscription.requested_at
        }
    }

@router.delete("/v1/customer/subscription")
async def deactivate_customer_subscription(
    current_user: User = Depends(get_customer_user),
    db: Session = Depends(get_db)
):
    """Deactivate current subscription"""
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found"
        )

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

@router.get("/v1/customer/subscription-history")
async def get_customer_subscription_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_customer_user),
    db: Session = Depends(get_db)
):
    """Get customer subscription history"""
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found"
        )

    query = db.query(Subscription).join(SubscriptionPack).filter(
        Subscription.customer_id == customer.id
    ).order_by(Subscription.created_at.desc())

    total = query.count()
    subscriptions = query.offset((page - 1) * limit).limit(limit).all()

    history = []
    for sub in subscriptions:
        history.append({
            "id": sub.id,
            "pack_name": sub.pack.name,
            "pack_sku": sub.pack.sku,
            "price": sub.pack.price,
            "status": sub.status,
            "requested_at": sub.requested_at,
            "approved_at": sub.approved_at,
            "assigned_at": sub.assigned_at,
            "expires_at": sub.expires_at,
            "deactivated_at": sub.deactivated_at,
            "created_at": sub.created_at
        })

    return {
        "success": True,
        "history": history,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total
        }
    }