#!/bin/bash
set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
VENV_PYTHON="$PROJECT_ROOT/.venv/bin/python3"
DB_BACKEND="$PROJECT_ROOT/database-backend"
STATS_BACKEND="$PROJECT_ROOT/stats-backend"
FRONTEND="$PROJECT_ROOT/frontend"

# PID files for process management
PID_DIR="$PROJECT_ROOT/.pids"
mkdir -p "$PID_DIR"

# Logs directory
LOGS_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOGS_DIR"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed"
        return 1
    fi
    return 0
}

check_service_running() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

stop_service() {
    local name=$1
    local pid_file="$PID_DIR/$name.pid"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Stopping $name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$pid_file"
    fi
}

# Parse command line arguments
ACTION="${1:-deploy}"
SKIP_DB="${SKIP_DB:-false}"
SKIP_BUILD="${SKIP_BUILD:-false}"
USE_SYSTEMD="${USE_SYSTEMD:-false}"

case "$ACTION" in
    deploy|start)
        ACTION="deploy"
        ;;
    stop)
        ACTION="stop"
        ;;
    restart)
        ACTION="restart"
        ;;
    status)
        ACTION="status"
        ;;
    install-systemd)
        ACTION="install-systemd"
        ;;
    *)
        echo "Usage: $0 {deploy|start|stop|restart|status|install-systemd}"
        echo ""
        echo "Options:"
        echo "  deploy/start    - Full deployment (default)"
        echo "  stop            - Stop all services"
        echo "  restart         - Restart all services"
        echo "  status          - Check service status"
        echo "  install-systemd - Install systemd service files"
        echo ""
        echo "Environment variables:"
        echo "  SKIP_DB=true    - Skip database setup"
        echo "  SKIP_BUILD=true - Skip frontend build"
        exit 1
        ;;
esac

# Install systemd services
if [ "$ACTION" = "install-systemd" ]; then
    log_info "Installing systemd service files..."
    
    if [ ! -d "$PROJECT_ROOT/systemd" ]; then
        log_error "systemd directory not found"
        exit 1
    fi
    
    sudo cp "$PROJECT_ROOT/systemd/product-api.service" /etc/systemd/system/
    sudo cp "$PROJECT_ROOT/systemd/orders-api.service" /etc/systemd/system/
    sudo cp "$PROJECT_ROOT/systemd/stats-api.service" /etc/systemd/system/
    
    sudo systemctl daemon-reload
    
    log_success "Systemd services installed"
    log_info "Enable services with:"
    echo "  sudo systemctl enable product-api"
    echo "  sudo systemctl enable orders-api"
    echo "  sudo systemctl enable stats-api"
    echo ""
    log_info "Start services with:"
    echo "  sudo systemctl start product-api orders-api stats-api"
    
    exit 0
fi

# Stop all services
if [ "$ACTION" = "stop" ] || [ "$ACTION" = "restart" ]; then
    log_info "Stopping all services..."
    stop_service "product_api"
    stop_service "orders_api"
    stop_service "stats_api"
    log_success "All services stopped"
    
    if [ "$ACTION" = "stop" ]; then
        exit 0
    fi
fi

# Status check
if [ "$ACTION" = "status" ]; then
    echo "=== Service Status ==="
    echo ""
    
    # Check systemd services if installed
    if systemctl list-unit-files | grep -q "product-api.service"; then
        echo "=== Systemd Services ==="
        systemctl status product-api --no-pager -l || true
        systemctl status orders-api --no-pager -l || true
        systemctl status stats-api --no-pager -l || true
        echo ""
    fi
    
    echo "=== Port Status ==="
    if check_service_running 8000; then
        log_success "Product API (port 8000): RUNNING"
    else
        log_error "Product API (port 8000): STOPPED"
    fi
    
    if check_service_running 8001; then
        log_success "Stats API (port 8001): RUNNING"
    else
        log_error "Stats API (port 8001): STOPPED"
    fi
    
    if check_service_running 8002; then
        log_success "Orders API (port 8002): RUNNING"
    else
        log_error "Orders API (port 8002): STOPPED"
    fi
    
    if check_service_running 3000; then
        log_success "Frontend (port 3000): RUNNING"
    else
        log_error "Frontend (port 3000): STOPPED"
    fi
    
    echo ""
    echo "=== Health Checks ==="
    curl -s http://localhost:8000/ >/dev/null 2>&1 && log_success "Product API: responding" || log_error "Product API: not responding"
    curl -s http://localhost:8002/ >/dev/null 2>&1 && log_success "Orders API: responding" || log_error "Orders API: not responding"
    curl -s http://localhost:8001/ping >/dev/null 2>&1 && log_success "Stats API: responding" || log_error "Stats API: not responding"
    curl -s http://localhost:3000/ >/dev/null 2>&1 && log_success "Frontend: responding" || log_error "Frontend: not responding"
    
    exit 0
fi

# Deployment starts here
log_info "Starting deployment..."

# Check prerequisites
log_info "Checking prerequisites..."

check_command "python3" || exit 1
check_command "node" || exit 1
check_command "npm" || exit 1
check_command "psql" || exit 1

# Check PostgreSQL
if ! sudo systemctl is-active --quiet postgresql; then
    log_warning "PostgreSQL is not running. Starting..."
    sudo systemctl start postgresql || {
        log_error "Failed to start PostgreSQL"
        exit 1
    }
fi

log_success "Prerequisites check passed"

# Check virtual environment
if [ ! -f "$VENV_PYTHON" ]; then
    log_warning "Virtual environment not found. Creating..."
    cd "$PROJECT_ROOT"
    python3 -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -e .
    log_success "Virtual environment created"
fi

# Check .env file
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    log_error ".env file not found!"
    log_info "Please create .env file with:"
    echo "  DB_NAME=valio_product_catalog"
    echo "  DB_PASSWORD=your_password"
    echo "  GOOGLE_API_KEY=your_key"
    exit 1
fi

# Database setup
if [ "$SKIP_DB" != "true" ]; then
    log_info "Setting up database..."
    
    # Check if database exists
    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw valio_product_catalog; then
        log_info "Creating database..."
        sudo -u postgres psql -c "CREATE DATABASE valio_product_catalog;" || {
            log_warning "Database might already exist, continuing..."
        }
    fi
    
    # Enable pgvector extension
    log_info "Enabling pgvector extension..."
    sudo -u postgres psql -d valio_product_catalog -c "CREATE EXTENSION IF NOT EXISTS vector;" || {
        log_warning "pgvector extension might already exist, continuing..."
    }
    
    # Create embeddings table
    log_info "Creating embeddings table..."
    sudo -u postgres psql -d valio_product_catalog -f "$DB_BACKEND/create_db.sql" || {
        log_warning "Tables might already exist, continuing..."
    }
    
    # Create products table
    log_info "Creating products table..."
    sudo -u postgres psql -d valio_product_catalog -f "$DB_BACKEND/create_products_table.sql" || {
        log_warning "Products table might already exist, continuing..."
    }
    
    # Populate products table
    log_info "Populating products table..."
    PRODUCT_COUNT=$(sudo -u postgres psql -d valio_product_catalog -t -c "SELECT COUNT(*) FROM products;" 2>/dev/null | xargs)
    
    if [ "$PRODUCT_COUNT" = "0" ] || [ -z "$PRODUCT_COUNT" ]; then
        log_info "Products table is empty, populating..."
        sudo -u postgres "$VENV_PYTHON" "$DB_BACKEND/populate_products_table.py" || {
            log_error "Failed to populate products table"
            log_warning "Continuing anyway - API will use JSON fallback"
        }
    else
        log_success "Products table already has $PRODUCT_COUNT products"
    fi
    
    log_success "Database setup complete"
else
    log_info "Skipping database setup (SKIP_DB=true)"
fi

# Install Python dependencies
log_info "Installing Python dependencies..."
cd "$PROJECT_ROOT"
if [ -f "pyproject.toml" ]; then
    "$VENV_PYTHON" -m pip install --quiet --upgrade pip
    "$VENV_PYTHON" -m pip install --quiet -e . || {
        log_error "Failed to install Python dependencies"
        exit 1
    }
fi

# Install frontend dependencies
log_info "Installing frontend dependencies..."
cd "$FRONTEND"
if [ ! -d "node_modules" ]; then
    npm install || {
        log_error "Failed to install frontend dependencies"
        exit 1
    }
fi

# Build frontend
if [ "$SKIP_BUILD" != "true" ]; then
    log_info "Building frontend..."
    npm run build || {
        log_error "Failed to build frontend"
        exit 1
    }
    log_success "Frontend built successfully"
else
    log_info "Skipping frontend build (SKIP_BUILD=true)"
fi

# Start Product API
log_info "Starting Product API (port 8000)..."
stop_service "product_api"
cd "$DB_BACKEND"
nohup "$VENV_PYTHON" -m uvicorn api_server:app --host 0.0.0.0 --port 8000 > "$LOGS_DIR/product_api.log" 2>&1 &
echo $! > "$PID_DIR/product_api.pid"
sleep 2
if check_service_running 8000; then
    log_success "Product API started (PID: $(cat $PID_DIR/product_api.pid))"
else
    log_error "Product API failed to start"
    cat "$LOGS_DIR/product_api.log"
    exit 1
fi

# Start Orders API
log_info "Starting Orders API (port 8002)..."
stop_service "orders_api"
cd "$DB_BACKEND"
nohup "$VENV_PYTHON" -m uvicorn orders_api:app --host 0.0.0.0 --port 8002 > "$LOGS_DIR/orders_api.log" 2>&1 &
echo $! > "$PID_DIR/orders_api.pid"
sleep 2
if check_service_running 8002; then
    log_success "Orders API started (PID: $(cat $PID_DIR/orders_api.pid))"
else
    log_error "Orders API failed to start"
    cat "$LOGS_DIR/orders_api.log"
    exit 1
fi

# Start Stats API
log_info "Starting Stats API (port 8001)..."
stop_service "stats_api"
cd "$STATS_BACKEND"
if ! command -v Rscript &> /dev/null; then
    log_warning "Rscript not found. Stats API will not start."
    log_warning "Install R: sudo apt-get install -y r-base"
else
    nohup Rscript -e "library(plumber); pr <- plumb('server.R'); pr\$run(host='0.0.0.0', port=8001)" > "$LOGS_DIR/stats_api.log" 2>&1 &
    echo $! > "$PID_DIR/stats_api.pid"
    sleep 3
    if check_service_running 8001; then
        log_success "Stats API started (PID: $(cat $PID_DIR/stats_api.pid))"
    else
        log_warning "Stats API might have failed to start (check logs)"
    fi
fi

# Start Frontend (development mode)
log_info "Starting Frontend (port 3000)..."
cd "$FRONTEND"
# Check if already running
if check_service_running 3000; then
    log_warning "Frontend already running on port 3000"
else
    nohup npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"
    sleep 3
    if check_service_running 3000; then
        log_success "Frontend started (PID: $(cat $PID_DIR/frontend.pid))"
    else
        log_warning "Frontend might still be starting (check logs)"
    fi
fi

# Final status
echo ""
log_success "=== Deployment Complete ==="
echo ""
echo "Services:"
echo "  Product API:  http://localhost:8000"
echo "  Orders API:   http://localhost:8002"
echo "  Stats API:    http://localhost:8001"
echo "  Frontend:     http://localhost:3000"
echo ""
echo "Logs:"
echo "  Product API:  $LOGS_DIR/product_api.log"
echo "  Orders API:   $LOGS_DIR/orders_api.log"
echo "  Stats API:    $LOGS_DIR/stats_api.log"
echo "  Frontend:     $LOGS_DIR/frontend.log"
echo ""
echo "Manage services:"
echo "  Status:  $0 status"
echo "  Stop:    $0 stop"
echo "  Restart: $0 restart"
echo ""
