# 🚀 License Management System

![Python](https://img.shields.io/badge/Python-3.12-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)
![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightblue.svg)

A comprehensive **full-stack license management system** built with **FastAPI** (Python) backend, **React** frontend, and **SQLite** database. 

## ✨ Features

### 🔐 **Authentication & User Management**
- **Admin Panel**: Complete system administration with dashboard analytics
- **Customer Portal**: Self-service subscription management
- **JWT Authentication**: Secure token-based authentication for web frontend
- **API Key Authentication**: Dedicated authentication for mobile/desktop SDKs
- **Role-based Access Control**: Admin vs Customer permissions

### 📦 **Subscription Pack Management**
- **Create & Manage**: Subscription plans with SKU-based identification
- **Pricing Control**: Flexible pricing and validity period management (1-12 months)
- **Soft Delete**: Safe pack deactivation without data loss
- **Bulk Operations**: Efficient management of multiple subscription plans

### 👥 **Customer Management**
- **Registration & Profiles**: Complete customer lifecycle management
- **Profile Updates**: Customer information management
- **Soft Delete**: Safe customer account deactivation

### 🔄 **Subscription Lifecycle Management**
- **Request → Approve → Active → Inactive/Expired** workflow
- **Single Active Subscription**: One customer, one active subscription rule
- **Admin Approval**: Controlled subscription activation process
- **Automatic Expiry**: Time-based subscription expiration
- **Customer Self-Service**: Request and deactivate subscriptions


## 🏗️ Architecture

### **Technology Stack**
- **Backend**: FastAPI (Python 3.12) with SQLAlchemy ORM
- **Frontend**: React 18 with React Router
- **Database**: SQLite with Alembic migrations
- **Authentication**: JWT tokens + API keys
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (production frontend)

### **API Architecture**
- **Frontend APIs**: RESTful endpoints for web applications (JWT auth)
- **SDK APIs**: Simplified endpoints for mobile/desktop apps (API key auth)
- **Dual Authentication**: Separate auth schemes for security isolation
- **Comprehensive Documentation**: OpenAPI 3.0 specification

## 🚀 Quick Start

### **Prerequisites**
- Docker and Docker Compose
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd License_Mgmt_System
   ```

2. **Start the services**
   ```bash
   docker compose up -d
   ```

3. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8080
   - **API Documentation**: http://localhost:8080/docs

### **Default Login Credentials**

#### **🔐 Admin Account**
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: Admin (Full system access)

#### **👤 Customer Accounts**
- **Customer 1**: `williamh1@example.com` / `5lci7YTx7OY`
- **Customer 2**: `sophiaparker@example.com` / `AfAiCBb44yM`
- **Customer 3**: `afoster@example.com` / `customer_123`
- **Role**: Customer (Self-service access)

### **Creating Default Accounts**

Run the following commands to create default accounts:

```bash
# Connect to the backend container
docker compose exec backend bash

# Create admin user
python -c "
from app.database import SessionLocal
from app.models import User, Customer
from app.auth import get_password_hash

db = SessionLocal()

# Create admin user
admin_user = User(
    email='admin@example.com',
    password_hash=get_password_hash('admin123'),
    role='admin'
)
db.add(admin_user)
db.commit()

# Create customer user
customer_user = User(
    email='customer@example.com',
    password_hash=get_password_hash('customer123'),
    role='customer'
)
db.add(customer_user)
db.commit()

# Create customer profile
customer_profile = Customer(
    user_id=customer_user.id,
    name='John Doe',
    phone='+1234567890'
)
db.add(customer_profile)
db.commit()

print('Default accounts created:')
print('Admin: admin@example.com / admin123')
print('Customer: customer@example.com / customer123')
db.close()
"
```

### **🔑 Login URLs**
- **Admin Login**: http://localhost:3000/admin/login
- **Customer Login**: http://localhost:3000/customer/login

## 📋 Manual Setup (Development)

### **Backend Setup**

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp ../env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

### **Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 🔧 Configuration

### **Environment Variables**

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=sqlite:///./license_management.db

# Security Configuration
SECRET_KEY=your-very-secure-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
API_KEY_PREFIX=sk-sdk-

# Application Configuration
DEBUG=False
ENVIRONMENT=production

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 📊 Database Schema

### **Core Tables**

1. **users** - Authentication and authorization
2. **customers** - Customer profile information  
3. **subscription_packs** - Available subscription plans
4. **subscriptions** - Subscription assignments and lifecycle
5. **api_keys** - SDK authentication keys

### **Key Relationships**
- One user account per customer (1:1)
- One customer can have multiple subscriptions over time (1:many)
- One subscription pack can be assigned to multiple customers (1:many)
- Only one active subscription per customer at any time

## 🔌 API Endpoints

### **Frontend APIs (JWT Authentication)**

#### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/customer/login` - Customer login  
- `POST /api/customer/signup` - Customer signup

#### Admin APIs
- `GET /api/v1/admin/dashboard` - Dashboard statistics
- `GET /api/v1/admin/customers` - List customers
- `POST /api/v1/admin/customers` - Create customer
- `GET /api/v1/admin/subscription-packs` - List subscription packs
- `POST /api/v1/admin/subscription-packs` - Create subscription pack
- `GET /api/v1/admin/subscriptions` - List subscriptions
- `POST /api/v1/admin/subscriptions/{id}/approve` - Approve subscription

#### Customer APIs
- `GET /api/v1/customer/subscription` - Get current subscription
- `POST /api/v1/customer/subscription` - Request subscription
- `DELETE /api/v1/customer/subscription` - Deactivate subscription
- `GET /api/v1/customer/subscription-history` - Get subscription history

### **SDK APIs (API Key Authentication)**

#### Authentication
- `POST /sdk/auth/login` - Get API key

#### Subscription Management
- `GET /sdk/v1/subscription` - Get current subscription
- `POST /sdk/v1/subscription` - Request subscription
- `DELETE /sdk/v1/subscription` - Deactivate subscription
- `GET /sdk/v1/subscription-history` - Get subscription history

## 🐳 Docker Commands

### **Basic Operations**
```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Rebuild specific service
docker compose build backend
docker compose build frontend

# Restart specific service
docker compose restart backend
docker compose restart frontend
```

### **Development Commands**
```bash
# Access backend container
docker compose exec backend bash

# Access frontend container
docker compose exec frontend sh

# Run database migrations
docker compose exec backend alembic upgrade head

# View service status
docker compose ps
```

## 🧪 Testing the API

### **Using curl**

```bash
# Admin login
curl -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Customer signup
curl -X POST http://localhost:8080/api/customer/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","phone":"+1234567890"}'

# Get dashboard (with JWT token)
curl -X GET http://localhost:8080/api/v1/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# SDK authentication
curl -X POST http://localhost:8080/sdk/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get subscription via SDK (with API key)
curl -X GET http://localhost:8080/sdk/v1/subscription \
  -H "X-API-Key: sk-sdk-YOUR_API_KEY"
```

## 🔍 Troubleshooting

### **Common Issues**

1. **Port Already in Use**
   ```bash
   # Check what's using port 8080
   lsof -i :8080
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Docker Daemon Not Running**
   ```bash
   # Start Docker Desktop manually
   # Or restart Docker service
   sudo systemctl restart docker
   ```

3. **Backend Container Unhealthy**
   ```bash
   # Check backend logs
   docker compose logs backend
   
   # Rebuild backend
   docker compose build backend
   docker compose up -d backend
   ```

4. **Frontend Not Loading**
   ```bash
   # Check frontend logs
   docker compose logs frontend
   
   # Rebuild frontend
   docker compose build frontend
   docker compose up -d frontend
   ```

### **Database Issues**

```bash
# Reset database (WARNING: This will delete all data)
docker compose down
docker volume rm license-management-system_sqlite_data
docker compose up -d

# Run migrations manually
docker compose exec backend alembic upgrade head
```

## 📚 Additional Documentation

- **[DOCKER.md](DOCKER.md)** - Detailed Docker deployment guide
- **[README.md](README.md)** - Technical documentation and API specifications
- **API Documentation**: http://localhost:8080/docs (Swagger UI)
- **ReDoc Documentation**: http://localhost:8080/redoc

## 🛠️ Development

### **Project Structure**
```
License_Mgmt_System/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── routers/        # API route handlers
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # Authentication logic
│   │   └── main.py         # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── package.json        # Node.js dependencies
│   ├── nginx.conf          # Nginx configuration
│   └── Dockerfile          # Frontend container
├── docker-compose.yml      # Service orchestration
├── env.example            # Environment template
├── docker-scripts.sh      # Helper scripts
├── PROJECT_README.md      # Project documentation
├── README.md              # Technical documentation
└── DOCKER.md              # Docker deployment guide
```

### **Key Features Implemented**
- ✅ Admin dashboard with analytics
- ✅ Customer management (CRUD operations)
- ✅ Subscription pack management
- ✅ Subscription lifecycle management
- ✅ Customer self-service portal
- ✅ Mobile SDK integration
- ✅ JWT + API key authentication
- ✅ Docker containerization
- ✅ Database migrations
- ✅ Comprehensive API documentation


**A comprehensive license management system for modern applications with web frontend and mobile SDK support.**
