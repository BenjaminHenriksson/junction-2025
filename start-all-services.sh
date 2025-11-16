#!/bin/bash
# Unified deployment script for all APIs and services
# This script ensures all services start reliably with proper health checks

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
VENV_PYTHON="${PROJECT_ROOT}/.venv/bin/python3"
DB_BACKEND="${PROJECT_ROOT}/database-backend"
STATS_BACKEND="${PROJECT_ROOT}/stats-backend"
FRONTEND="${PROJECT_ROOT}/frontend"

# Directories
PID_DIR="${PROJECT_ROOT}/.pids"
LOGS_DIR="${PROJECT_ROOT}/logs"
mkdir -p "$PID_DIR" "$LOGS_DIR"

# Service ports
PRODUCT_API_PORT=8000
ORDERS_API_PORT=8002
STATS_API_PORT=8001
FRONTEND_PORT=3000

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

# Check if a port is in use
is_port_in_use() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1
    elif command -v ss >/dev/null 2>&1; then
        ss -tlnp | grep -q ":${port} "
    elif command -v netstat >/dev/null 2>&1; then
        netstat -tlnp 2>/dev/null | grep -q ":${port} "
    else
        # Fallback: try to connect
        timeout 1 bash -c "echo >/dev/tcp/localhost/$port" 2>/dev/null
    fi
}

# Kill process on a port
kill_port() {
    local port=$1
    local pid
    
    if command -v lsof >/dev/null 2>&1; then
        pid=$(lsof -ti :"$port" 2>/dev/null || true)
    elif command -v fuser >/dev/null 2>&1; then
        pid=$(fuser "$port/tcp" 2>/dev/null | awk '{print $1}' || true)
    else
        # Try to find via ss/netstat
        pid=$(ss -tlnp 2>/dev/null | grep ":${port} " | grep -oP 'pid=\K[0-9]+' | head -1 || true)
    fi
    
    if [ -n "$pid" ] && [ "$pid" != "0" ]; then
        log_info "Killing process on port $port (PID: $pid)"
        kill "$pid" 2>/dev/null || true
        sleep 1
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
        fi
    fi
}

# Stop a service by PID file
stop_service_by_pid() {
    local name=$1
    local pid_file="${PID_DIR}/${name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file" 2>/dev/null || echo "")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
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

# Health check for an API
health_check() {
    local url=$1
    local name=$2
    local max_attempts=${3:-10}
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    return 1
}

# Start Product API
start_product_api() {
    log_info "Starting Product API (port $PRODUCT_API_PORT)..."
    
    # Stop existing instance
    kill_port $PRODUCT_API_PORT
    stop_service_by_pid "product_api"
    
    # Start new instance
    cd "$DB_BACKEND"
    if [ ! -f "$VENV_PYTHON" ]; then
        log_error "Virtual environment Python not found at $VENV_PYTHON"
        return 1
    fi
    
    nohup "$VENV_PYTHON" -m uvicorn api_server:app --host 0.0.0.0 --port $PRODUCT_API_PORT > "${LOGS_DIR}/product_api.log" 2>&1 &
    local pid=$!
    echo $pid > "${PID_DIR}/product_api.pid"
    
    # Wait and check
    sleep 3
    if health_check "http://localhost:${PRODUCT_API_PORT}/" "Product API" 5; then
        log_success "Product API started (PID: $pid)"
        return 0
    else
        log_error "Product API failed to start"
        tail -20 "${LOGS_DIR}/product_api.log"
        return 1
    fi
}

# Start Orders API
start_orders_api() {
    log_info "Starting Orders API (port $ORDERS_API_PORT)..."
    
    # Stop existing instance
    kill_port $ORDERS_API_PORT
    stop_service_by_pid "orders_api"
    
    # Start new instance
    cd "$DB_BACKEND"
    if [ ! -f "$VENV_PYTHON" ]; then
        log_error "Virtual environment Python not found at $VENV_PYTHON"
        return 1
    fi
    
    nohup "$VENV_PYTHON" -m uvicorn orders_api:app --host 0.0.0.0 --port $ORDERS_API_PORT > "${LOGS_DIR}/orders_api.log" 2>&1 &
    local pid=$!
    echo $pid > "${PID_DIR}/orders_api.pid"
    
    # Wait and check
    sleep 3
    if health_check "http://localhost:${ORDERS_API_PORT}/" "Orders API" 5; then
        log_success "Orders API started (PID: $pid)"
        return 0
    else
        log_error "Orders API failed to start"
        tail -20 "${LOGS_DIR}/orders_api.log"
        return 1
    fi
}

# Start Stats API
start_stats_api() {
    log_info "Starting Stats API (port $STATS_API_PORT)..."
    
    # Stop existing instance
    kill_port $STATS_API_PORT
    stop_service_by_pid "stats_api"
    
    # Check if Rscript is available
    if ! command -v Rscript >/dev/null 2>&1; then
        log_warning "Rscript not found. Skipping Stats API."
        log_warning "Install R: sudo apt-get install -y r-base"
        return 0
    fi
    
    # Start new instance
    cd "$STATS_BACKEND"
    if [ ! -f "server.R" ]; then
        log_error "server.R not found in $STATS_BACKEND"
        return 1
    fi
    
    nohup bash start_stats.sh > "${LOGS_DIR}/stats_api.log" 2>&1 &
    local pid=$!
    echo $pid > "${PID_DIR}/stats_api.pid"
    
    # Wait and check (Stats API takes longer to start)
    sleep 8
    if health_check "http://localhost:${STATS_API_PORT}/ping" "Stats API" 10; then
        log_success "Stats API started (PID: $pid)"
        return 0
    else
        log_warning "Stats API might still be starting (check logs)"
        tail -20 "${LOGS_DIR}/stats_api.log"
        return 0  # Don't fail deployment if stats API is slow
    fi
}

# Start Frontend (optional)
start_frontend() {
    local start_frontend=${1:-false}
    
    if [ "$start_frontend" != "true" ]; then
        log_info "Skipping frontend (set START_FRONTEND=true to start)"
        return 0
    fi
    
    log_info "Starting Frontend (port $FRONTEND_PORT)..."
    
    # Stop existing instance
    kill_port $FRONTEND_PORT
    stop_service_by_pid "frontend"
    
    # Start new instance
    cd "$FRONTEND"
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules not found, installing dependencies..."
        npm install || {
            log_error "Failed to install frontend dependencies"
            return 1
        }
    fi
    
    nohup npm run dev > "${LOGS_DIR}/frontend.log" 2>&1 &
    local pid=$!
    echo $pid > "${PID_DIR}/frontend.pid"
    
    # Wait and check
    sleep 5
    if health_check "http://localhost:${FRONTEND_PORT}/" "Frontend" 10; then
        log_success "Frontend started (PID: $pid)"
        return 0
    else
        log_warning "Frontend might still be starting (check logs)"
        return 0  # Don't fail deployment if frontend is slow
    fi
}

# Stop all services
stop_all() {
    log_info "Stopping all services..."
    kill_port $PRODUCT_API_PORT
    kill_port $ORDERS_API_PORT
    kill_port $STATS_API_PORT
    kill_port $FRONTEND_PORT
    
    stop_service_by_pid "product_api"
    stop_service_by_pid "orders_api"
    stop_service_by_pid "stats_api"
    stop_service_by_pid "frontend"
    
    log_success "All services stopped"
}

# Status check
show_status() {
    echo "=== Service Status ==="
    echo ""
    
    echo "=== Port Status ==="
    if is_port_in_use $PRODUCT_API_PORT; then
        log_success "Product API (port $PRODUCT_API_PORT): RUNNING"
    else
        log_error "Product API (port $PRODUCT_API_PORT): STOPPED"
    fi
    
    if is_port_in_use $ORDERS_API_PORT; then
        log_success "Orders API (port $ORDERS_API_PORT): RUNNING"
    else
        log_error "Orders API (port $ORDERS_API_PORT): STOPPED"
    fi
    
    if is_port_in_use $STATS_API_PORT; then
        log_success "Stats API (port $STATS_API_PORT): RUNNING"
    else
        log_error "Stats API (port $STATS_API_PORT): STOPPED"
    fi
    
    if is_port_in_use $FRONTEND_PORT; then
        log_success "Frontend (port $FRONTEND_PORT): RUNNING"
    else
        log_error "Frontend (port $FRONTEND_PORT): STOPPED"
    fi
    
    echo ""
    echo "=== Health Checks ==="
    curl -sf "http://localhost:${PRODUCT_API_PORT}/" >/dev/null 2>&1 && log_success "Product API: responding" || log_error "Product API: not responding"
    curl -sf "http://localhost:${ORDERS_API_PORT}/" >/dev/null 2>&1 && log_success "Orders API: responding" || log_error "Orders API: not responding"
    curl -sf "http://localhost:${STATS_API_PORT}/ping" >/dev/null 2>&1 && log_success "Stats API: responding" || log_error "Stats API: not responding"
    curl -sf "http://localhost:${FRONTEND_PORT}/" >/dev/null 2>&1 && log_success "Frontend: responding" || log_error "Frontend: not responding"
}

# Main execution
ACTION="${1:-start}"
START_FRONTEND="${START_FRONTEND:-false}"

case "$ACTION" in
    start|deploy)
        log_info "Starting all services..."
        start_product_api || exit 1
        start_orders_api || exit 1
        start_stats_api || true  # Don't fail if stats API has issues
        start_frontend "$START_FRONTEND" || true
        
        echo ""
        log_success "=== Deployment Complete ==="
        echo ""
        show_status
        echo ""
        echo "Logs:"
        echo "  Product API:  ${LOGS_DIR}/product_api.log"
        echo "  Orders API:   ${LOGS_DIR}/orders_api.log"
        echo "  Stats API:    ${LOGS_DIR}/stats_api.log"
        echo "  Frontend:     ${LOGS_DIR}/frontend.log"
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        sleep 2
        "$0" start
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all APIs (default)"
        echo "  stop    - Stop all APIs"
        echo "  restart - Restart all APIs"
        echo "  status  - Show status of all APIs"
        echo ""
        echo "Environment variables:"
        echo "  START_FRONTEND=true  - Also start frontend dev server"
        exit 1
        ;;
esac
