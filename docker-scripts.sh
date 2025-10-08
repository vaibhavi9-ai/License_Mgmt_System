#!/bin/bash

# License Management System Docker Management Scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to build all services
build_all() {
    print_status "Building all Docker services..."
    docker-compose build
    if [ $? -eq 0 ]; then
        print_success "All services built successfully!"
    else
        print_error "Failed to build services"
        exit 1
    fi
}

# Function to start all services
start_all() {
    print_status "Starting all services..."
    docker-compose up -d
    if [ $? -eq 0 ]; then
        print_success "All services started successfully!"
        print_status "Frontend: http://localhost:3000"
        print_status "Backend API: http://localhost:8080"
        print_status "API Docs: http://localhost:8080/docs"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Function to stop all services
stop_all() {
    print_status "Stopping all services..."
    docker-compose down
    print_success "All services stopped!"
}

# Function to restart all services
restart_all() {
    print_status "Restarting all services..."
    docker-compose restart
    print_success "All services restarted!"
}

# Function to view logs
view_logs() {
    print_status "Viewing logs for all services..."
    docker-compose logs -f
}

# Function to view logs for specific service
view_logs_service() {
    if [ -z "$1" ]; then
        print_error "Please specify a service name (backend, frontend, db)"
        exit 1
    fi
    print_status "Viewing logs for $1..."
    docker-compose logs -f "$1"
}

# Function to clean up
cleanup() {
    print_warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up Docker resources..."
        docker-compose down -v --rmi all
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show status
show_status() {
    print_status "Docker services status:"
    docker-compose ps
}

# Function to show help
show_help() {
    echo "License Management System Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build       Build all Docker services"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs        View logs for all services"
    echo "  logs [service] View logs for specific service (backend, frontend, db)"
    echo "  status      Show status of all services"
    echo "  cleanup     Remove all containers, volumes, and images"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 status"
}

# Main script logic
case "$1" in
    build)
        build_all
        ;;
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        restart_all
        ;;
    logs)
        if [ -n "$2" ]; then
            view_logs_service "$2"
        else
            view_logs
        fi
        ;;
    status)
        show_status
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
