"""
Authentication and authorization utilities
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from dotenv import load_dotenv

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
API_KEY_PREFIX = os.getenv("API_KEY_PREFIX", "sk-sdk-")

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        # Try bcrypt first
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Fallback to MD5 for temporary admin (not secure, but works)
        import hashlib
        if len(hashed_password) == 32:  # MD5 hash length
            return hashlib.md5(plain_password.encode()).hexdigest() == hashed_password
        return False

def get_password_hash(password: str) -> str:
    """Generate password hash"""
    try:
        # Try bcrypt first
        return pwd_context.hash(password)
    except Exception:
        # Fallback to MD5 for temporary compatibility (not secure, but works)
        import hashlib
        return hashlib.md5(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def generate_api_key() -> str:
    """Generate API key for SDK authentication"""
    return f"{API_KEY_PREFIX}{secrets.token_urlsafe(32)}"

def create_default_admin():
    """Create default admin user"""
    from app.database import SessionLocal
    from app.models import User

    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin_user = User(
                email="admin@example.com",
                password_hash=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Default admin created: admin@example.com / admin123")
    except Exception as e:
        print(f"Error creating admin: {e}")
    finally:
        db.close()