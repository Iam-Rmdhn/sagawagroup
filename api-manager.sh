#!/bin/bash

# Sagawa Group API Management Script
# Supports both PM2 and systemd service

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_DIR="/var/www/sagawagroup/api"
SERVICE_NAME="sagawagroup-api"
USE_PM2=true  # Change to false to use systemd instead

# Print functions
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Check if Bun is installed
check_bun() {
    if ! command -v bun &> /dev/null; then
        print_error "Bun is not installed!"
        print_info "Install with: curl -fsSL https://bun.sh/install | bash"
        exit 1
    fi
    print_success "Bun $(bun --version) found"
}

# PM2 functions
pm2_start() {
    print_info "Starting API with PM2..."
    cd "$API_DIR"
    pm2 delete $SERVICE_NAME 2>/dev/null || true
    pm2 start /var/www/sagawagroup/ecosystem.config.js --env production
    pm2 save
    print_success "API started with PM2"
}

pm2_stop() {
    print_info "Stopping API from PM2..."
    pm2 delete $SERVICE_NAME 2>/dev/null || true
    print_success "API stopped"
}

pm2_restart() {
    print_info "Restarting API with PM2..."
    pm2 restart $SERVICE_NAME || pm2_start
    print_success "API restarted"
}

pm2_status() {
    pm2 status $SERVICE_NAME
    print_info "Logs: pm2 logs $SERVICE_NAME"
}

pm2_logs() {
    pm2 logs $SERVICE_NAME --lines 100
}

# Systemd functions
systemd_install() {
    print_info "Installing systemd service..."
    cp /var/www/sagawagroup/sagawagroup-api.service /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable sagawagroup-api
    print_success "Systemd service installed"
}

systemd_start() {
    print_info "Starting API with systemd..."
    systemctl start sagawagroup-api
    sleep 2
    systemctl status sagawagroup-api --no-pager
    print_success "API started with systemd"
}

systemd_stop() {
    print_info "Stopping API from systemd..."
    systemctl stop sagawagroup-api
    print_success "API stopped"
}

systemd_restart() {
    print_info "Restarting API with systemd..."
    systemctl restart sagawagroup-api
    sleep 2
    systemctl status sagawagroup-api --no-pager
    print_success "API restarted"
}

systemd_status() {
    systemctl status sagawagroup-api --no-pager
}

systemd_logs() {
    journalctl -u sagawagroup-api -n 100 --no-pager
}

# Main commands
cmd_start() {
    check_bun
    if [ "$USE_PM2" = true ]; then
        pm2_start
    else
        systemd_start
    fi
}

cmd_stop() {
    if [ "$USE_PM2" = true ]; then
        pm2_stop
    else
        systemd_stop
    fi
}

cmd_restart() {
    check_bun
    if [ "$USE_PM2" = true ]; then
        pm2_restart
    else
        systemd_restart
    fi
}

cmd_status() {
    if [ "$USE_PM2" = true ]; then
        pm2_status
    else
        systemd_status
    fi
}

cmd_logs() {
    if [ "$USE_PM2" = true ]; then
        pm2_logs
    else
        systemd_logs
    fi
}

cmd_health() {
    print_info "Checking API health..."
    
    # Check if port 5000 is listening
    if ss -tuln | grep -q ':5000'; then
        print_success "Port 5000 is listening"
    else
        print_error "Port 5000 is NOT listening"
    fi
    
    # Try to curl the API
    if curl -f http://localhost:5000/api/health 2>/dev/null; then
        echo ""
        print_success "API health check passed"
    else
        echo ""
        print_error "API health check failed"
    fi
}

cmd_install_systemd() {
    check_bun
    systemd_install
    print_info "To use systemd, edit this script and set USE_PM2=false"
}

# Show usage
usage() {
    echo "Sagawa Group API Management"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start              Start the API server"
    echo "  stop               Stop the API server"
    echo "  restart            Restart the API server"
    echo "  status             Show API server status"
    echo "  logs               Show API server logs"
    echo "  health             Check API health"
    echo "  install-systemd    Install systemd service (alternative to PM2)"
    echo ""
    echo "Current mode: $([ "$USE_PM2" = true ] && echo "PM2" || echo "systemd")"
    echo ""
}

# Main
case "$1" in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    status)
        cmd_status
        ;;
    logs)
        cmd_logs
        ;;
    health)
        cmd_health
        ;;
    install-systemd)
        cmd_install_systemd
        ;;
    *)
        usage
        exit 1
        ;;
esac
