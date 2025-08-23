#!/bin/bash

# 🚀 Service Startup Script for Sagawa Group Production
# Starts all production services for sagawagroup.id

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/var/www/sagawagroup"

echo -e "${BLUE}🚀 Starting Sagawa Group Production Services${NC}"
echo -e "${BLUE}📅 $(date)${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or use sudo"
    exit 1
fi

# Start PM2 backend services
echo -e "${BLUE}🔧 Starting Bun API backend with PM2...${NC}"
cd $PROJECT_DIR
su -c "pm2 start ecosystem.config.js" www-data || pm2 start ecosystem.config.js
print_status "Backend services started"

# Start Nginx
echo -e "${BLUE}🌐 Starting Nginx web server...${NC}"
systemctl start nginx
systemctl enable nginx
print_status "Nginx started and enabled"

# Start Fail2Ban
echo -e "${BLUE}🛡️ Starting Fail2Ban security service...${NC}"
systemctl start fail2ban
systemctl enable fail2ban
print_status "Fail2Ban started and enabled"

# Check service status
echo -e "${BLUE}📊 Checking service status...${NC}"
echo ""

echo -e "${YELLOW}Backend Status:${NC}"
pm2 status || echo "PM2 not running"

echo -e "${YELLOW}Nginx Status:${NC}"
systemctl status nginx --no-pager -l

echo -e "${YELLOW}Fail2Ban Status:${NC}"
systemctl status fail2ban --no-pager -l

echo -e "${YELLOW}SSL Certificate Status:${NC}"
if [ -f "/etc/letsencrypt/live/sagawagroup.id/fullchain.pem" ]; then
    echo -e "${GREEN}✓${NC} SSL certificate found"
    openssl x509 -in /etc/letsencrypt/live/sagawagroup.id/fullchain.pem -noout -subject -dates
else
    echo -e "${YELLOW}⚠${NC} SSL certificate not found. Run: ./scripts/ssl-setup.sh"
fi

# Check if services are responding
echo ""
echo -e "${BLUE}🧪 Testing services...${NC}"

# Test backend
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    print_status "Backend API responding"
else
    print_error "Backend API not responding"
fi

# Test Nginx
if curl -s http://localhost > /dev/null 2>&1; then
    print_status "Nginx responding on port 80"
else
    print_error "Nginx not responding on port 80"
fi

# Test HTTPS (if SSL is configured)
if [ -f "/etc/letsencrypt/live/sagawagroup.id/fullchain.pem" ]; then
    if curl -s https://sagawagroup.id > /dev/null 2>&1; then
        print_status "HTTPS responding"
    else
        print_error "HTTPS not responding"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Sagawa Group Services Started Successfully!${NC}"
echo ""
echo -e "${BLUE}🌐 Your website is now live at:${NC}"
echo "   🔓 HTTP:  http://sagawagroup.id"
if [ -f "/etc/letsencrypt/live/sagawagroup.id/fullchain.pem" ]; then
    echo "   🔐 HTTPS: https://sagawagroup.id"
fi
echo "   🔧 API:   http://sagawagroup.id/api"
echo ""
echo -e "${YELLOW}📋 Management Commands:${NC}"
echo "   pm2 status               - Check backend status"
echo "   pm2 logs                 - View backend logs"
echo "   systemctl status nginx   - Check Nginx status"
echo "   ./scripts/ssl-setup.sh   - Setup SSL certificate"
echo ""
echo -e "${GREEN}🍜 Welcome to Sagawa Group - Kuliner Jepang Terbaik! 🍜${NC}"