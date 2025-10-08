# Docker Deployment Guide

This guide explains how to deploy the License Management System using Docker containers.

## 🐳 **Architecture**

The system consists of two main services:
- **FastAPI Backend** - API server with SQLite database
- **React Frontend** - Web interface (served by Nginx)

## 🚀 **Quick Start**

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

### 1. Clone and Setup
```bash
git clone <repository-url>
cd license-management-system
```

### 2. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your settings
nano .env
```

### 3. Build and Start
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs

## 🛠️ **Management Commands**

Use the provided script for easy management:

```bash
# Make script executable (first time only)
chmod +x docker-scripts.sh

# Available commands
./docker-scripts.sh build      # Build all services
./docker-scripts.sh start      # Start all services
./docker-scripts.sh stop       # Stop all services
./docker-scripts.sh restart    # Restart all services
./docker-scripts.sh logs       # View all logs
./docker-scripts.sh logs backend  # View backend logs only
./docker-scripts.sh status     # Show service status
./docker-scripts.sh cleanup    # Remove everything
./docker-scripts.sh help       # Show help
```

## 📋 **Manual Docker Commands**

### Build Services
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Start/Stop Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Service Status
```bash
# Check service status
docker-compose ps

# Check resource usage
docker stats
```

## 🔧 **Configuration**

### Environment Variables
Key environment variables in `.env`:

```env
# Database (SQLite)
DATABASE_URL=sqlite:///./license_management.db

# Security
SECRET_KEY=your-very-secure-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Application
DEBUG=False
ENVIRONMENT=production
```

### Port Configuration
- **Frontend**: 3000
- **Backend**: 8080

To change ports, modify `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Change 3001 to your desired port
```

## 🗄️ **Database Management**

### Access Database
```bash
# Connect to backend container and access SQLite
docker-compose exec backend python -c "
from app.database import SessionLocal
from app.models import User, Customer, Subscription
db = SessionLocal()
users = db.query(User).all()
for user in users:
    print(f'User: {user.email}, Role: {user.role}')
db.close()
"
```

### Database Backup
```bash
# Copy SQLite database file
docker-compose exec backend cp license_management.db /app/data/backup_$(date +%Y%m%d_%H%M%S).db

# Or copy from container to host
docker cp license_management_backend:/app/license_management.db ./backup.db
```

### Reset Database
```bash
# Stop services and remove volumes
docker-compose down -v

# Start services (will recreate database)
docker-compose up -d
```

## 🔍 **Troubleshooting**

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :8080
   
   # Kill process or change ports in docker-compose.yml
   ```

2. **Database Connection Issues**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Check if SQLite database exists
   docker-compose exec backend ls -la license_management.db
   ```

3. **Build Failures**
   ```bash
   # Clean build
   docker-compose build --no-cache
   
   # Check Docker daemon
   docker info
   ```

4. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Health Checks
All services include health checks:
- **Backend**: `GET /health`
- **Frontend**: `GET /`

Check health status:
```bash
docker-compose ps
```

## 🚀 **Production Deployment**

### Security Considerations
1. **Change default passwords** in `.env`
2. **Use strong SECRET_KEY**
3. **Enable HTTPS** with reverse proxy
4. **Restrict database access**
5. **Use Docker secrets** for sensitive data

### Scaling
```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Use load balancer (nginx, traefik)
```

### Monitoring
```bash
# Monitor resource usage
docker stats

# View service logs
docker-compose logs -f
```

## 📦 **Customization**

### Adding New Services
Add to `docker-compose.yml`:
```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Switching to PostgreSQL (Optional)
If you want to use PostgreSQL instead of SQLite:

1. Add PostgreSQL service to `docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: license_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

2. Update backend environment:
```yaml
backend:
  environment:
    DATABASE_URL: postgresql://postgres:postgres123@db:5432/license_management
```

3. Add PostgreSQL driver to `requirements.txt`:
```
psycopg2-binary==2.9.9
```

### Custom Build Arguments
```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      args:
        - BUILD_ENV=production
```

## 🆘 **Support**

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Check service status: `docker-compose ps`
4. Review this documentation

## 📚 **Additional Resources**

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Production Build](https://create-react-app.dev/docs/production-build/)
