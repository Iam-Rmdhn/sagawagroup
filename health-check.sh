#!/bin/bash

# Health Check Script for Sagawa Group
# This script checks if all services are running properly after deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:5000"
WEBSITE_URL="https://www.sagawagroup.id"
MAX_RETRIES=12
RETRY_DELAY=10

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if PM2 processes are running
check_pm2_processes() {
    print_status "Checking PM2 processes..."
    
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 is not installed"
        return 1
    fi
    
    local pm2_status=$(pm2 status)
    echo "$pm2_status"
    
    # Check if sagawagroup-api is online
    if echo "$pm2_status" | grep -q "sagawagroup-api.*online"; then
        print_success "PM2 processes are running"
        return 0
    else
        print_error "PM2 processes are not running properly"
        return 1
    fi
}

# Check API health endpoint
check_api_health() {
    print_status "Checking API health endpoint..."
    
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s --connect-timeout 5 --max-time 10 "$API_URL/api/health" > /dev/null 2>&1; then
            print_success "API health check passed (attempt $i/$MAX_RETRIES)"
            return 0
        else
            print_warning "API health check failed (attempt $i/$MAX_RETRIES)"
            if [ $i -eq $MAX_RETRIES ]; then
                print_error "API health check failed after $MAX_RETRIES attempts"
                return 1
            fi
            sleep $RETRY_DELAY
        fi
    done
}

# Check Nginx status
check_nginx() {
    print_status "Checking Nginx status..."
    
    if systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
        return 0
    else
        print_error "Nginx is not running"
        return 1
    fi
}

# Check website accessibility
check_website() {
    print_status "Checking website accessibility..."
    
    # Check HTTP redirect to HTTPS
    if curl -f -s -I --connect-timeout 10 "http://sagawagroup.id" | grep -q "301\|302"; then
        print_success "HTTP to HTTPS redirect is working"
    else
        print_warning "HTTP to HTTPS redirect might not be working"
    fi
    
    # Check HTTPS website
    if curl -f -s --connect-timeout 15 --max-time 30 "$WEBSITE_URL" > /dev/null 2>&1; then
        print_success "Website is accessible"
        return 0
    else
        print_error "Website is not accessible"
        return 1
    fi
}

# Check SSL certificate
check_ssl() {
    print_status "Checking SSL certificate..."
    
    if command -v openssl &> /dev/null; then
        local ssl_info=$(echo | openssl s_client -servername www.sagawagroup.id -connect www.sagawagroup.id:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            print_success "SSL certificate is valid"
            echo "$ssl_info"
            return 0
        else
            print_warning "Could not verify SSL certificate"
            return 1
        fi
    else
        print_warning "OpenSSL not available, skipping SSL check"
        return 0
    fi
}

# Check disk space
check_disk_space() {
    print_status "Checking disk space..."
    
    local disk_usage=$(df -h /var/www | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 90 ]; then
        print_success "Disk space is OK ($disk_usage% used)"
        return 0
    else
        print_warning "Disk space is running low ($disk_usage% used)"
        return 1
    fi
}

# Check memory usage
check_memory() {
    print_status "Checking memory usage..."
    
    local mem_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    
    if (( $(echo "$mem_usage < 90" | bc -l) )); then
        print_success "Memory usage is OK (${mem_usage}% used)"
        return 0
    else
        print_warning "Memory usage is high (${mem_usage}% used)"
        return 1
    fi
}

# Main health check function
main() {
    echo "==========================================="
    echo "  Sagawa Group Health Check"
    echo "  $(date)"
    echo "==========================================="
    
    local failed_checks=0
    
    # Run all health checks
    check_pm2_processes || ((failed_checks++))
    echo
    
    check_api_health || ((failed_checks++))
    echo
    
    check_nginx || ((failed_checks++))
    echo
    
    check_website || ((failed_checks++))
    echo
    
    check_ssl || ((failed_checks++))
    echo
    
    check_disk_space || ((failed_checks++))
    echo
    
    check_memory || ((failed_checks++))
    echo
    
    # Summary
    echo "==========================================="
    if [ $failed_checks -eq 0 ]; then
        print_success "All health checks passed!"
        echo "Sagawa Group is running properly."
        exit 0
    else
        print_error "$failed_checks health check(s) failed!"
        echo "Please check the issues above."
        exit 1
    fi
}

# Run health check
main "$@"
