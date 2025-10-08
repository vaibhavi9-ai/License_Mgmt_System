"""
Pydantic schemas for request/response models
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# Base schemas
class SuccessResponse(BaseModel):
    success: bool = True
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    message: str

# Auth schemas
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminLoginResponse(BaseModel):
    success: bool = True
    token: str
    email: str
    expires_in: int

class CustomerLoginRequest(BaseModel):
    email: EmailStr
    password: str

class CustomerLoginResponse(BaseModel):
    success: bool = True
    token: str
    name: str
    phone: str
    expires_in: int

class CustomerSignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: str = Field(..., min_length=10, max_length=20)

class CustomerSignupResponse(BaseModel):
    success: bool = True
    message: str
    token: str
    name: str
    phone: str
    expires_in: int

# Customer schemas
class CustomerBase(BaseModel):
    name: str
    email: str
    phone: str

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class Customer(CustomerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Subscription Pack schemas
class SubscriptionPackBase(BaseModel):
    name: str
    description: str
    sku: str
    price: float = Field(..., ge=0)
    validity_months: int = Field(..., ge=1, le=12)

class SubscriptionPackCreate(SubscriptionPackBase):
    pass

class SubscriptionPackUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    validity_months: Optional[int] = Field(None, ge=1, le=12)

class SubscriptionPack(SubscriptionPackBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Subscription schemas
class SubscriptionRequest(BaseModel):
    sku: str

class SubscriptionBase(BaseModel):
    customer_id: int
    pack_id: int
    status: str

class Subscription(SubscriptionBase):
    id: int
    pack_name: Optional[str]
    pack_sku: Optional[str]
    price: Optional[float]
    validity_months: Optional[int]
    requested_at: datetime
    approved_at: Optional[datetime]
    assigned_at: Optional[datetime]
    expires_at: Optional[datetime]
    deactivated_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class CustomerSubscriptionResponse(BaseModel):
    success: bool = True
    subscription: dict

class SubscriptionHistoryResponse(BaseModel):
    success: bool = True
    history: List[dict]
    pagination: dict

class AssignSubscriptionRequest(BaseModel):
    pack_id: int

class SubscriptionCreateResponse(BaseModel):
    success: bool = True
    message: str
    subscription: dict

class DeactivateResponse(BaseModel):
    success: bool = True
    message: str
    deactivated_at: datetime

# Dashboard schemas
class DashboardData(BaseModel):
    total_customers: int
    active_subscriptions: int
    pending_requests: int
    total_revenue: float
    recent_activities: List[dict]

class DashboardResponse(BaseModel):
    success: bool = True
    data: DashboardData

# SDK schemas
class SDKAuthResponse(BaseModel):
    success: bool = True
    api_key: str
    token: str
    name: str
    phone: str
    expires_in: int

# Pagination
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)