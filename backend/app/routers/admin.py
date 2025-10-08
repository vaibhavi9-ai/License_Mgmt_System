"""
Admin router for authentication and dashboard
"""

from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.database import get_db
from app.models import User, Customer, SubscriptionPack, Subscription
from app.schemas import (
    AdminLoginRequest, AdminLoginResponse, DashboardResponse,
    CustomerCreate, Customer as CustomerSchema, SuccessResponse,
    CustomerUpdate, SubscriptionPackCreate, SubscriptionPack as SubscriptionPackSchema,
    SubscriptionPackUpdate, AssignSubscriptionRequest
)
from app.auth import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.dependencies import get_admin_user

router = APIRouter()

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Admin login endpoint"""
    user = db.query(User).filter(
        User.email == form_data.username,  # OAuth2 sends email in username field
        User.role == "admin"
    ).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": "admin"},
        expires_delta=access_token_expires
    )

    return {
        "token": access_token,
        "email": user.email,
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.get("/v1/admin/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    # Total customers
    total_customers = db.query(Customer).filter(Customer.is_active == True).count()

    # Active subscriptions
    active_subscriptions = db.query(Subscription).filter(
        Subscription.status.in_(["active", "approved"])
    ).count()

    # Pending requests
    pending_requests = db.query(Subscription).filter(
        Subscription.status == "requested"
    ).count()

    # Total revenue - sum of prices from all active and approved subscriptions
    total_revenue = db.query(func.sum(SubscriptionPack.price)).join(
        Subscription, SubscriptionPack.id == Subscription.pack_id
    ).filter(Subscription.status.in_(["active", "approved"])).scalar() or 0.0

    # Recent activities
    recent_subscriptions = db.query(Subscription).join(
        Customer, Subscription.customer_id == Customer.id
    ).join(
        SubscriptionPack, Subscription.pack_id == SubscriptionPack.id
    ).order_by(Subscription.created_at.desc()).limit(5).all()

    recent_activities = []
    for sub in recent_subscriptions:
        recent_activities.append({
            "type": f"subscription_{sub.status}",
            "customer": sub.customer.name,
            "pack": sub.pack.name,
            "timestamp": sub.created_at
        })

    dashboard_data = {
        "total_customers": total_customers,
        "active_subscriptions": active_subscriptions,
        "pending_requests": pending_requests,
        "total_revenue": float(total_revenue),
        "recent_activities": recent_activities
    }

    return DashboardResponse(data=dashboard_data)

@router.get("/v1/admin/customers")
async def list_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """List customers with pagination and search"""
    query = db.query(Customer).filter(Customer.is_active == True)

    if search:
        query = query.filter(
            Customer.name.ilike(f"%{search}%") | 
            Customer.email.ilike(f"%{search}%")
        )

    total = query.count()
    customers = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "customers": customers,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total
        }
    }

@router.post("/v1/admin/customers")
async def create_customer(
    customer_data: CustomerCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create new customer"""
    # Check if email already exists in users table
    existing_user = db.query(User).filter(User.email == customer_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if email already exists in customers table
    existing_customer = db.query(Customer).filter(Customer.email == customer_data.email).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user account first
    from app.auth import get_password_hash
    import secrets
    
    # Generate a temporary password for admin-created customers
    temp_password = secrets.token_urlsafe(8)
    
    user = User(
        email=customer_data.email,
        password_hash=get_password_hash(temp_password),
        role="customer",
        is_active=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Create customer profile
    customer = Customer(
        user_id=user.id,
        name=customer_data.name,
        email=customer_data.email,
        phone=customer_data.phone
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return {
        "success": True,
        "customer": customer,
        "message": f"Customer created successfully. Temporary password: {temp_password}"
    }

@router.get("/v1/admin/customers/{customer_id}")
async def get_customer(
    customer_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get customer details"""
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.is_active == True
    ).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    return {
        "success": True,
        "customer": customer
    }

@router.put("/v1/admin/customers/{customer_id}")
async def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update customer information"""
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.is_active == True
    ).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    # Handle email update
    if customer_data.email and customer_data.email != customer.email:
        # Check if new email already exists in users table
        existing_user = db.query(User).filter(User.email == customer_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Check if new email already exists in customers table
        existing_customer = db.query(Customer).filter(
            Customer.email == customer_data.email,
            Customer.id != customer_id
        ).first()
        if existing_customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Update both User and Customer email
        user = db.query(User).filter(User.id == customer.user_id).first()
        if user:
            user.email = customer_data.email
        customer.email = customer_data.email

    # Handle other field updates
    if customer_data.name:
        customer.name = customer_data.name
    if customer_data.phone:
        customer.phone = customer_data.phone

    db.commit()
    db.refresh(customer)

    return {
        "success": True,
        "customer": customer
    }

@router.delete("/v1/admin/customers/{customer_id}", response_model=SuccessResponse)
async def delete_customer(
    customer_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Soft delete customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    customer.is_active = False
    db.commit()

    return SuccessResponse(message="Customer deleted successfully")

@router.post("/v1/admin/customers/{customer_id}/assign-subscription", response_model=SuccessResponse)
async def assign_subscription(
    customer_id: int,
    request: AssignSubscriptionRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Assign subscription to customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    pack = db.query(SubscriptionPack).filter(SubscriptionPack.id == request.pack_id).first()
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription pack not found"
        )

    # Check for existing active subscription
    existing_sub = db.query(Subscription).filter(
        Subscription.customer_id == customer_id,
        Subscription.status.in_(["active", "approved"])
    ).first()

    if existing_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer already has an active subscription"
        )

    # Create subscription
    expires_at = datetime.utcnow() + timedelta(days=pack.validity_months * 30)
    subscription = Subscription(
        customer_id=customer_id,
        pack_id=request.pack_id,
        status="active",
        assigned_at=datetime.utcnow(),
        expires_at=expires_at
    )

    db.add(subscription)
    db.commit()

    return SuccessResponse(message="Subscription assigned successfully")

# Subscription Pack Management
@router.get("/v1/admin/subscription-packs")
async def list_subscription_packs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """List subscription packs with pagination and search"""
    query = db.query(SubscriptionPack).filter(SubscriptionPack.is_active == True)

    if search:
        query = query.filter(
            SubscriptionPack.name.ilike(f"%{search}%") | 
            SubscriptionPack.sku.ilike(f"%{search}%")
        )

    total = query.count()
    packs = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "subscription_packs": packs,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total
        }
    }

@router.post("/v1/admin/subscription-packs")
async def create_subscription_pack(
    pack_data: SubscriptionPackCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create new subscription pack"""
    # Check if SKU already exists
    existing_pack = db.query(SubscriptionPack).filter(SubscriptionPack.sku == pack_data.sku).first()
    if existing_pack:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SKU already exists"
        )

    pack = SubscriptionPack(
        name=pack_data.name,
        description=pack_data.description,
        sku=pack_data.sku,
        price=pack_data.price,
        validity_months=pack_data.validity_months
    )

    db.add(pack)
    db.commit()
    db.refresh(pack)

    return {
        "success": True,
        "subscription_pack": pack
    }

@router.get("/v1/admin/subscription-packs/{pack_id}")
async def get_subscription_pack(
    pack_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get subscription pack by ID"""
    pack = db.query(SubscriptionPack).filter(
        SubscriptionPack.id == pack_id,
        SubscriptionPack.is_active == True
    ).first()

    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription pack not found"
        )

    return {
        "success": True,
        "subscription_pack": pack
    }

@router.put("/v1/admin/subscription-packs/{pack_id}")
async def update_subscription_pack(
    pack_id: int,
    pack_data: SubscriptionPackUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update subscription pack"""
    pack = db.query(SubscriptionPack).filter(
        SubscriptionPack.id == pack_id,
        SubscriptionPack.is_active == True
    ).first()

    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription pack not found"
        )

    # Check SKU uniqueness if updating SKU
    if pack_data.sku and pack_data.sku != pack.sku:
        existing_pack = db.query(SubscriptionPack).filter(SubscriptionPack.sku == pack_data.sku).first()
        if existing_pack:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU already exists"
            )

    # Update fields
    if pack_data.name:
        pack.name = pack_data.name
    if pack_data.description:
        pack.description = pack_data.description
    if pack_data.sku:
        pack.sku = pack_data.sku
    if pack_data.price is not None:
        pack.price = pack_data.price
    if pack_data.validity_months:
        pack.validity_months = pack_data.validity_months

    db.commit()
    db.refresh(pack)

    return {
        "success": True,
        "subscription_pack": pack
    }

@router.delete("/v1/admin/subscription-packs/{pack_id}", response_model=SuccessResponse)
async def delete_subscription_pack(
    pack_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Soft delete subscription pack"""
    pack = db.query(SubscriptionPack).filter(
        SubscriptionPack.id == pack_id,
        SubscriptionPack.is_active == True
    ).first()

    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription pack not found"
        )

    # Check if pack is being used by active subscriptions
    active_subscriptions = db.query(Subscription).filter(
        Subscription.pack_id == pack_id,
        Subscription.status.in_(["active", "approved"])
    ).count()

    if active_subscriptions > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete pack with active subscriptions"
        )

    pack.is_active = False
    db.commit()

    return SuccessResponse(message="Subscription pack deleted successfully")

# Subscription Management
@router.get("/v1/admin/subscriptions")
async def list_subscriptions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """List subscriptions with pagination and status filter"""
    query = db.query(Subscription).join(Customer).join(SubscriptionPack)

    if status:
        query = query.filter(Subscription.status == status)

    total = query.count()
    subscriptions = query.offset((page - 1) * limit).limit(limit).all()

    subscription_list = []
    for sub in subscriptions:
        subscription_list.append({
            "id": sub.id,
            "customer_name": sub.customer.name,
            "customer_email": sub.customer.email,
            "pack_name": sub.pack.name,
            "pack_sku": sub.pack.sku,
            "price": sub.pack.price,
            "status": sub.status,
            "requested_at": sub.requested_at,
            "approved_at": sub.approved_at,
            "assigned_at": sub.assigned_at,
            "expires_at": sub.expires_at,
            "created_at": sub.created_at
        })

    return {
        "success": True,
        "subscriptions": subscription_list,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total
        }
    }

@router.post("/v1/admin/subscriptions/{subscription_id}/approve", response_model=SuccessResponse)
async def approve_subscription(
    subscription_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Approve subscription request"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )

    if subscription.status != "requested":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only requested subscriptions can be approved"
        )

    # Check if customer already has an active subscription
    existing_sub = db.query(Subscription).filter(
        Subscription.customer_id == subscription.customer_id,
        Subscription.status.in_(["active", "approved"]),
        Subscription.id != subscription_id
    ).first()

    if existing_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer already has an active subscription"
        )

    # Approve subscription
    subscription.status = "approved"
    subscription.approved_at = datetime.utcnow()
    
    # Set expiration date
    expires_at = datetime.utcnow() + timedelta(days=subscription.pack.validity_months * 30)
    subscription.expires_at = expires_at

    db.commit()

    return SuccessResponse(message="Subscription approved successfully")