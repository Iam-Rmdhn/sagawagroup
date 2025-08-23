#!/bin/bash

# 📊 Monitoring Script for Sagawa Group Production
# Real-time monitoring untuk sagawagroup.id

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Sagawa Group - Production Monitoring Dashboard${NC}"
echo -e "${BLUE}🍜 Website: sagawagroup.id${NC}"
echo -e "${BLUE}📅 $(date)${NC}"
echo "=========================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# System Information
echo -e "\n${BLUE}💻 System Information${NC}"
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime -p)"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo "Memory Usage: $(free -h | awk '/^Mem:/ {print $3 "/" $2 " (" $3/$2*100 "%)"}' | sed 's/,/./g')"
echo "Disk Usage: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"

# Service Status Check
echo -e "\n${BLUE}🔧 Service Status${NC}"

# Check PM2 Backend
if pm2 list | grep -q "sagawagroup-api"; then
    if pm2 list | grep "sagawagroup-api" | grep -q "online"; then
        print_status "Bun API Backend (PM2) - Running"
    else
        print_error "Bun API Backend (PM2) - Not Running"
    fi
else
    print_error "Bun API Backend (PM2) - Not Found"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    print_status "Nginx Web Server - Running"
else
    print_error "Nginx Web Server - Not Running"
fi

# Check Fail2Ban
if systemctl is-active --quiet fail2ban; then
    print_status "Fail2Ban Security - Running"
else
    print_error "Fail2Ban Security - Not Running"
fi

# SSL Certificate Status
echo -e "\n${BLUE}🔐 SSL Certificate Status${NC}"
if [ -f "/etc/letsencrypt/live/sagawagroup.id/fullchain.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/sagawagroup.id/fullchain.pem -noout -enddate | cut -d= -f2)
    CERT_DAYS=$((($(date -d "$CERT_EXPIRY" +%s) - $(date +%s)) / 86400))
    
    if [ $CERT_DAYS -gt 30 ]; then
        print_status "SSL Certificate Valid - Expires in $CERT_DAYS days ($CERT_EXPIRY)"
    elif [ $CERT_DAYS -gt 7 ]; then
        print_warning "SSL Certificate - Expires in $CERT_DAYS days ($CERT_EXPIRY)"
    else
        print_error "SSL Certificate - Expires SOON in $CERT_DAYS days ($CERT_EXPIRY)"
    fi
else
    print_error "SSL Certificate - Not Found"
fi

# Website Connectivity Test
echo -e "\n${BLUE}🌐 Website Connectivity Test${NC}"

# Test HTTP (should redirect to HTTPS)
if curl -s -o /dev/null -w "%{http_code}" http://sagawagroup.id | grep -q "301\|302"; then
    print_status "HTTP Redirect (Port 80) - Working"
else
    print_error "HTTP Redirect (Port 80) - Failed"
fi

# Test HTTPS
if curl -s -o /dev/null -w "%{http_code}" https://sagawagroup.id | grep -q "200"; then
    print_status "HTTPS Website (Port 443) - Working"
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://sagawagroup.id)
    echo "   Response Time: ${RESPONSE_TIME}s"
else
    print_error "HTTPS Website (Port 443) - Failed"
fi

# Test API Backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health | grep -q "200"; then
    print_status "API Backend (Port 4000) - Working"
else
    print_error "API Backend (Port 4000) - Failed"
fi

# Database Connectivity (if health endpoint exists)
if curl -s http://localhost:4000/api/health | grep -q "database.*ok"; then
    print_status "Database Connection - Working"
else
    print_warning "Database Connection - Cannot verify (no health endpoint response)"
fi

# Security Status
echo -e "\n${BLUE}🛡️ Security Status${NC}"

# Firewall Status
if ufw status | grep -q "Status: active"; then
    print_status "UFW Firewall - Active"
    echo "   Open Ports: $(ufw status | grep ALLOW | awk '{print $1}' | tr '\n' ' ')"
else
    print_error "UFW Firewall - Inactive"
fi

# Fail2Ban Jails
if fail2ban-client status 2>/dev/null | grep -q "Jail list"; then
    JAILS=$(fail2ban-client status | grep "Jail list" | cut -d: -f2 | tr -d ' \t')
    print_status "Fail2Ban Jails Active: $JAILS"
    
    # Check banned IPs
    BANNED_COUNT=0
    for jail in $(echo $JAILS | tr ',' ' '); do
        COUNT=$(fail2ban-client status $jail 2>/dev/null | grep "Currently banned" | awk '{print $NF}')
        BANNED_COUNT=$((BANNED_COUNT + COUNT))
    done
    
    if [ $BANNED_COUNT -gt 0 ]; then
        print_warning "Banned IPs: $BANNED_COUNT"
    else
        echo "   No IPs currently banned"
    fi
fi

# Log Analysis
echo -e "\n${BLUE}📋 Recent Logs Summary${NC}"

# Nginx Error Logs
if [ -f "/var/log/nginx/sagawagroup_error.log" ]; then
    ERROR_COUNT=$(tail -n 100 /var/log/nginx/sagawagroup_error.log | wc -l)
    if [ $ERROR_COUNT -gt 0 ]; then
        print_warning "Nginx Errors (Last 100 lines): $ERROR_COUNT"
    else
        print_status "Nginx Errors: None"
    fi
fi

# Backend Logs
if [ -f "/var/www/sagawagroup/logs/api-error.log" ]; then
    API_ERROR_COUNT=$(tail -n 100 /var/www/sagawagroup/logs/api-error.log | wc -l)
    if [ $API_ERROR_COUNT -gt 0 ]; then
        print_warning "API Errors (Last 100 lines): $API_ERROR_COUNT"
    else
        print_status "API Errors: None"
    fi
fi

# Performance Metrics
echo -e "\n${BLUE}⚡ Performance Metrics${NC}"

# Active connections
CONNECTIONS=$(ss -tuln | grep -E ':80|:443|:4000' | wc -l)
echo "Active Connections: $CONNECTIONS"

# Process CPU/Memory usage
if command -v ps >/dev/null; then
    echo "Top Processes by CPU:"
    ps aux --sort=-%cpu | head -n 6 | tail -n 5 | awk '{printf "   %s: %.1f%% CPU, %.1f%% MEM\n", $11, $3, $4}'
fi

# Storage Space
echo -e "\n${BLUE}💾 Storage Status${NC}"
echo "Website Files: $(du -sh /var/www/sagawagroup 2>/dev/null | awk '{print $1}')"
echo "Upload Directory: $(du -sh /var/www/sagawagroup/bun-api/uploads 2>/dev/null | awk '{print $1}')"
echo "Logs Directory: $(du -sh /var/www/sagawagroup/logs 2>/dev/null | awk '{print $1}')"

# Backup Status
if [ -d "/var/backups/sagawagroup" ]; then
    LAST_BACKUP=$(ls -lt /var/backups/sagawagroup/ 2>/dev/null | head -n 2 | tail -n 1 | awk '{print $9}')
    if [ ! -z "$LAST_BACKUP" ]; then
        print_status "Last Backup: $LAST_BACKUP"
    else
        print_warning "No backups found"
    fi
else
    print_warning "Backup directory not configured"
fi

echo -e "\n=========================================="
echo -e "${GREEN}🍜 Sagawa Group Monitoring Complete 🍜${NC}"
echo -e "${BLUE}For detailed logs: journalctl -u nginx -f${NC}"
echo -e "${BLUE}For API logs: pm2 logs sagawagroup-api${NC}"
echo -e "${BLUE}For real-time monitoring: watch -n 5 ./scripts/monitor.sh${NC}"