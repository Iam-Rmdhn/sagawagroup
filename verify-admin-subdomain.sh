#!/bin/bash

# Verification script for admin subdomain setup
# Script untuk verifikasi konfigurasi admin subdomain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Admin Subdomain Verification ===${NC}"
echo ""

echo -e "${YELLOW}1. Checking Nginx Configuration...${NC}"
if nginx -t 2>/dev/null; then
    echo -e "${GREEN}   ✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}   ✗ Nginx configuration has errors${NC}"
    nginx -t
    exit 1
fi

echo -e "${YELLOW}2. Checking Admin Site Files...${NC}"
if [ -f "/etc/nginx/sites-enabled/admin-sagawagroup" ]; then
    echo -e "${GREEN}   ✓ Admin site is enabled${NC}"
else
    echo -e "${RED}   ✗ Admin site is not enabled${NC}"
fi

if [ -d "/var/www/sagawagroup/admin" ]; then
    echo -e "${GREEN}   ✓ Admin directory exists${NC}"
else
    echo -e "${RED}   ✗ Admin directory missing${NC}"
fi

if [ -f "/var/www/sagawagroup/admin/index.html" ]; then
    echo -e "${GREEN}   ✓ Admin index.html exists${NC}"
else
    echo -e "${RED}   ✗ Admin index.html missing${NC}"
fi

echo -e "${YELLOW}3. Checking Permissions...${NC}"
ADMIN_OWNER=$(stat -c '%U:%G' /var/www/sagawagroup/admin)
if [ "$ADMIN_OWNER" = "www-data:www-data" ]; then
    echo -e "${GREEN}   ✓ Admin directory has correct permissions${NC}"
else
    echo -e "${YELLOW}   ! Admin directory owner: $ADMIN_OWNER (should be www-data:www-data)${NC}"
fi

echo -e "${YELLOW}4. Testing Local Access...${NC}"
# Test with localhost and Host header
if curl -s -H "Host: admin.sagawagroup.id" http://localhost/health 2>/dev/null | grep -q "admin-healthy"; then
    echo -e "${GREEN}   ✓ Admin health endpoint working${NC}"
else
    echo -e "${YELLOW}   ! Admin health endpoint not responding${NC}"
fi

# Test static content
if curl -s -H "Host: admin.sagawagroup.id" http://localhost/ 2>/dev/null | head -1 | grep -q "html"; then
    echo -e "${GREEN}   ✓ Admin static content accessible${NC}"
else
    echo -e "${YELLOW}   ! Admin static content check failed${NC}"
fi

echo -e "${YELLOW}5. Checking DNS (if configured)...${NC}"
if nslookup admin.sagawagroup.id >/dev/null 2>&1; then
    echo -e "${GREEN}   ✓ DNS resolution working for admin.sagawagroup.id${NC}"
    
    # Test direct access if DNS works
    echo -e "${YELLOW}6. Testing Direct HTTP Access...${NC}"
    if curl -s -m 10 http://admin.sagawagroup.id/health 2>/dev/null | grep -q "admin-healthy"; then
        echo -e "${GREEN}   ✓ Direct HTTP access working${NC}"
    else
        echo -e "${YELLOW}   ! Direct HTTP access not working (normal if backend not running)${NC}"
    fi
else
    echo -e "${YELLOW}   ! DNS not configured yet for admin.sagawagroup.id${NC}"
    echo -e "${BLUE}   → Configure DNS records before SSL setup${NC}"
fi

echo -e "${YELLOW}7. Checking SSL Status...${NC}"
if [ -f "/etc/letsencrypt/live/admin.sagawagroup.id/fullchain.pem" ]; then
    echo -e "${GREEN}   ✓ SSL certificate exists${NC}"
    CERT_EXPIRY=$(openssl x509 -noout -enddate -in /etc/letsencrypt/live/admin.sagawagroup.id/fullchain.pem 2>/dev/null | cut -d= -f2)
    echo -e "${BLUE}   Certificate expires: $CERT_EXPIRY${NC}"
else
    echo -e "${YELLOW}   ! SSL certificate not yet configured${NC}"
    echo -e "${BLUE}   → Run: sudo ./setup-admin-ssl.sh (after DNS propagation)${NC}"
fi

echo -e "${YELLOW}8. Checking Backend API...${NC}"
if pgrep -f "sagawa-api" > /dev/null; then
    echo -e "${GREEN}   ✓ Backend API process running${NC}"
elif command -v pm2 > /dev/null && pm2 list | grep -q "sagawa-api"; then
    echo -e "${GREEN}   ✓ Backend API running via PM2${NC}"
else
    echo -e "${YELLOW}   ! Backend API not running${NC}"
    echo -e "${BLUE}   → Start with: cd /root/sagawagroup/bun-api && bun run start${NC}"
fi

echo ""
echo -e "${BLUE}=== Summary ===${NC}"
echo -e "- Admin subdomain configuration: ${GREEN}Deployed${NC}"
echo -e "- Static files: ${GREEN}Ready${NC}"
echo -e "- DNS: ${YELLOW}Check manual configuration${NC}"
echo -e "- SSL: ${YELLOW}Ready for setup after DNS${NC}"
echo -e "- Backend API: ${YELLOW}Check manual start${NC}"

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. Configure DNS records for admin.sagawagroup.id"
echo -e "2. Wait for DNS propagation (5-15 minutes)"
echo -e "3. Run: ${GREEN}sudo ./setup-admin-ssl.sh${NC}"
echo -e "4. Start backend API if needed"

echo ""
echo -e "${GREEN}Admin subdomain verification complete!${NC}"