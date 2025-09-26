#!/bin/bash

# Deploy Admin Subdomain Configuration
# Script untuk menerapkan konfigurasi subdomain admin

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Deploying Admin Subdomain Configuration ===${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Backup existing configurations
echo -e "${YELLOW}1. Creating backup of existing configurations...${NC}"
BACKUP_DIR="/root/sagawagroup/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup nginx configs
if [ -f "/etc/nginx/sites-available/sagawagroup" ]; then
    cp /etc/nginx/sites-available/sagawagroup "$BACKUP_DIR/nginx-sagawagroup.conf.backup"
    echo "   ✓ Nginx main config backed up"
fi

if [ -f "/etc/nginx/sites-available/admin-sagawagroup" ]; then
    cp /etc/nginx/sites-available/admin-sagawagroup "$BACKUP_DIR/nginx-admin-sagawagroup.conf.backup"
    echo "   ✓ Existing admin config backed up"
fi

echo "   📁 Backups stored in: $BACKUP_DIR"
echo ""

# Deploy nginx admin subdomain configuration (temporary HTTP-only version)
echo -e "${YELLOW}2. Deploying admin subdomain nginx configuration (HTTP-only)...${NC}"
if [ -f "/root/sagawagroup/nginx-admin-subdomain-temp.conf" ]; then
    cp /root/sagawagroup/nginx-admin-subdomain-temp.conf /etc/nginx/sites-available/admin-sagawagroup
    echo "   ✓ Admin subdomain config deployed (HTTP-only for SSL setup)"
else
    echo -e "${RED}   ✗ nginx-admin-subdomain-temp.conf not found${NC}"
    exit 1
fi

# Enable admin subdomain site
echo -e "${YELLOW}3. Enabling admin subdomain site...${NC}"
if [ ! -L "/etc/nginx/sites-enabled/admin-sagawagroup" ]; then
    ln -sf /etc/nginx/sites-available/admin-sagawagroup /etc/nginx/sites-enabled/admin-sagawagroup
    echo "   ✓ Admin subdomain site enabled"
else
    echo "   ✓ Admin subdomain site already enabled"
fi

# Test nginx configuration
echo -e "${YELLOW}4. Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}   ✓ Nginx configuration test passed${NC}"
else
    echo -e "${RED}   ✗ Nginx configuration test failed${NC}"
    echo -e "${RED}   Rolling back changes...${NC}"
    
    # Remove the problematic config
    rm -f /etc/nginx/sites-enabled/admin-sagawagroup
    rm -f /etc/nginx/sites-available/admin-sagawagroup
    
    # Restore backup if exists
    if [ -f "$BACKUP_DIR/nginx-admin-sagawagroup.conf.backup" ]; then
        cp "$BACKUP_DIR/nginx-admin-sagawagroup.conf.backup" /etc/nginx/sites-available/admin-sagawagroup
        ln -sf /etc/nginx/sites-available/admin-sagawagroup /etc/nginx/sites-enabled/admin-sagawagroup
    fi
    
    nginx -t && systemctl reload nginx
    exit 1
fi

# Reload nginx
echo -e "${YELLOW}5. Reloading nginx...${NC}"
systemctl reload nginx
echo -e "${GREEN}   ✓ Nginx reloaded successfully${NC}"
echo ""

# Check if frontend is built
echo -e "${YELLOW}6. Checking frontend build...${NC}"
if [ -d "/var/www/sagawagroup/frontend" ] && [ -f "/var/www/sagawagroup/frontend/index.html" ]; then
    echo -e "${GREEN}   ✓ Frontend build found${NC}"
else
    echo -e "${YELLOW}   ! Frontend build not found in /var/www/sagawagroup/frontend${NC}"
    echo -e "${YELLOW}   ! You may need to run the production build script${NC}"
fi

# Build and deploy frontend with admin subdomain support
echo -e "${YELLOW}7. Building and deploying frontend...${NC}"
cd /root/sagawagroup/vue-frontend

# Check if bun is available, otherwise use npm
if command -v bun &> /dev/null; then
    echo "   Using bun for build..."
    bun run build
else
    echo "   Using npm for build..."
    npm run build
fi

# Create target directory if it doesn't exist
mkdir -p /var/www/sagawagroup/frontend

# Deploy built files
if [ -d "./dist" ]; then
    cp -r ./dist/* /var/www/sagawagroup/frontend/
    echo -e "${GREEN}   ✓ Frontend deployed successfully${NC}"
else
    echo -e "${RED}   ✗ Frontend build directory not found${NC}"
    echo -e "${YELLOW}   ! Check the build process${NC}"
fi

# Set proper permissions
chown -R www-data:www-data /var/www/sagawagroup/frontend
chmod -R 755 /var/www/sagawagroup/frontend
echo -e "${GREEN}   ✓ Permissions set${NC}"

# Restart backend API with production configuration
echo -e "${YELLOW}8. Restarting backend API...${NC}"
if command -v pm2 &> /dev/null; then
    cd /root/sagawagroup
    pm2 restart sagawagroup-api || pm2 start ecosystem.config.js --env production
    echo -e "${GREEN}   ✓ Backend API restarted with PM2 using production configuration${NC}"
else
    # If PM2 is not available, attempt to run using the server script with production environment
    cd /root/sagawagroup/bun-api
    if [ -f "server.sh" ]; then
        NODE_ENV=production ./server.sh restart
        echo -e "${GREEN}   ✓ Backend API restarted with server.sh using production configuration${NC}"
    else
        echo -e "${YELLOW}   ! PM2 not found and server.sh not available. Please manually restart the backend API${NC}"
        echo -e "${YELLOW}   ! Command: cd /root/sagawagroup/bun-api && NODE_ENV=production PORT=5000 bun run index.ts${NC}"
    fi
fi

echo ""
echo -e "${GREEN}=== Admin Subdomain Configuration Deployed Successfully! ===${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. ${YELLOW}Update DNS records:${NC}"
echo -e "   - Add CNAME record: admin -> sagawagroup.id"
echo -e "   - Or A record: admin.sagawagroup.id -> your server IP"
echo ""
echo -e "2. ${YELLOW}Setup SSL certificates:${NC}"
echo -e "   - Run: ${GREEN}sudo ./setup-admin-ssl.sh${NC}"
echo -e "   - This will upgrade to full HTTPS configuration"
echo ""
echo -e "3. ${YELLOW}Test the subdomain:${NC}"
echo -e "   - HTTP: ${BLUE}http://admin.sagawagroup.id${NC} (should redirect to HTTPS)"
echo -e "   - HTTPS: ${BLUE}https://admin.sagawagroup.id${NC} (after SSL setup)"
echo -e "   - HTTPS: ${BLUE}https://www.admin.sagawagroup.id${NC} (after SSL setup)"
echo ""
echo -e "${GREEN}All configurations have been applied successfully!${NC}"

# Show current nginx sites status
echo ""
echo -e "${BLUE}Current nginx sites status:${NC}"
echo -e "${YELLOW}Enabled sites:${NC}"
ls -la /etc/nginx/sites-enabled/
echo ""
echo -e "${YELLOW}Available sites:${NC}"
ls -la /etc/nginx/sites-available/ | grep sagawagroup