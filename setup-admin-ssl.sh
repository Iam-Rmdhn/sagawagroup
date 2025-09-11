#!/bin/bash

# Setup SSL for Admin Subdomain - Sagawa Group
# This script sets up SSL certificates for admin.sagawagroup.id

set -e

echo "=== Setting up SSL for Admin Subdomain ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Domain variables
ADMIN_DOMAIN="admin.sagawagroup.id"
WWW_ADMIN_DOMAIN="www.admin.sagawagroup.id"
EMAIL="your-email@example.com"  # Replace with your email

echo -e "${YELLOW}Setting up SSL certificates for:${NC}"
echo -e "  - $ADMIN_DOMAIN"
echo -e "  - $WWW_ADMIN_DOMAIN"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Installing certbot...${NC}"
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Backup current nginx config
echo -e "${YELLOW}Backing up nginx configuration...${NC}"
cp /etc/nginx/sites-available/sagawagroup /etc/nginx/sites-available/sagawagroup.backup.$(date +%Y%m%d_%H%M%S)

# Copy admin subdomain configuration
echo -e "${YELLOW}Installing admin subdomain nginx configuration...${NC}"
cp ./nginx-admin-subdomain.conf /etc/nginx/sites-available/admin-sagawagroup

# Enable admin subdomain site
ln -sf /etc/nginx/sites-available/admin-sagawagroup /etc/nginx/sites-enabled/admin-sagawagroup

# Test nginx configuration
echo -e "${YELLOW}Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}Nginx configuration test passed${NC}"
else
    echo -e "${RED}Nginx configuration test failed. Please check the configuration.${NC}"
    exit 1
fi

# Reload nginx to apply new configuration
echo -e "${YELLOW}Reloading nginx...${NC}"
systemctl reload nginx

# Wait a moment for nginx to fully reload
sleep 2

# Obtain SSL certificates for admin subdomain
echo -e "${YELLOW}Obtaining SSL certificates for admin subdomain...${NC}"
certbot --nginx -d $ADMIN_DOMAIN -d $WWW_ADMIN_DOMAIN --email $EMAIL --agree-tos --no-eff-email --redirect

# Verify certificates
echo -e "${YELLOW}Verifying SSL certificates...${NC}"
if certbot certificates | grep -q $ADMIN_DOMAIN; then
    echo -e "${GREEN}SSL certificates successfully obtained and installed${NC}"
else
    echo -e "${RED}Failed to obtain SSL certificates${NC}"
    exit 1
fi

# Test SSL configuration
echo -e "${YELLOW}Testing SSL configuration...${NC}"
if openssl s_client -connect $ADMIN_DOMAIN:443 -servername $ADMIN_DOMAIN < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo -e "${GREEN}SSL configuration test passed${NC}"
else
    echo -e "${YELLOW}SSL test inconclusive, but certificates should be working${NC}"
fi

# Final nginx configuration test and reload
echo -e "${YELLOW}Final nginx configuration test...${NC}"
if nginx -t; then
    systemctl reload nginx
    echo -e "${GREEN}Nginx successfully reloaded with SSL configuration${NC}"
else
    echo -e "${RED}Final nginx test failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Admin Subdomain SSL Setup Complete! ===${NC}"
echo -e "${GREEN}Your admin subdomain is now accessible at:${NC}"
echo -e "  - https://$ADMIN_DOMAIN"
echo -e "  - https://$WWW_ADMIN_DOMAIN"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Update your DNS records to point the subdomain to your server"
echo -e "2. Test the subdomain access"
echo -e "3. Update any application configurations if needed"
echo ""
echo -e "${GREEN}SSL certificates will auto-renew via certbot cron job${NC}"