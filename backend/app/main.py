"""
FastAPI License Management System
Author: AI Assistant
Description: Complete implementation of License Management System API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app import models
from app.database import engine
from app.routers import admin, customer, subscription, sdk

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="License Management System API",
    description="""
    Comprehensive API for managing licenses, subscriptions, and customers.
    Supports both web frontend and mobile SDK integrations.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(customer.router, prefix="/api", tags=["Customer"])
app.include_router(subscription.router, prefix="/api/v1", tags=["Subscription"])
app.include_router(sdk.router, prefix="/sdk", tags=["SDK"])

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "License Management System is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)