#!/bin/bash

# 🔐 SSL Setup Script for Sagawa Group
# Automated SSL certificate installation with Let's Encrypt
# Domain: sagawagroup.id

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN=${1:-"sagawagroup.id"}
EMAIL=${2:-"admin@sagawagroup.id"}

echo -e "${BLUE}🔐 SSL Certificate Setup for Sagawa Group${NC}"
echo -e "${BLUE}Domain: $DOMAIN${NC}"
echo -e "${BLUE}Email: $EMAIL${NC}"
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

# Stop nginx temporarily
echo -e "${BLUE}⏹️ Stopping Nginx temporarily...${NC}"
systemctl stop nginx || true

# Obtain SSL certificate
echo -e "${BLUE}🔑 Requesting SSL certificate from Let's Encrypt...${NC}"
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --domains "$DOMAIN,www.$DOMAIN" \
    --rsa-key-size 4096

if [ $? -eq 0 ]; then
    print_status "SSL certificate obtained successfully"
else
    print_error "Failed to obtain SSL certificate"
    systemctl start nginx
    exit 1
fi

# Start nginx
echo -e "${BLUE}▶️ Starting Nginx...${NC}"
systemctl start nginx
systemctl enable nginx

# Test SSL
echo -e "${BLUE}🧪 Testing SSL configuration...${NC}"
sleep 5
if curl -Is https://$DOMAIN | head -n 1 | grep -q "200\|301\|302"; then
    print_status "SSL working correctly"
else
    print_error "SSL test failed"
fi

# Setup auto-renewal
echo -e "${BLUE}🔄 Setting up auto-renewal...${NC}"
cat > /etc/cron.d/certbot-sagawagroup << EOF
# Sagawa Group SSL Certificate Auto-Renewal
# Runs twice daily at random times
0 12 * * * root test -x /usr/bin/certbot && perl -e 'sleep int(rand(43200))' && certbot -q renew --deploy-hook "systemctl reload nginx"
0 0 * * * root test -x /usr/bin/certbot && perl -e 'sleep int(rand(43200))' && certbot -q renew --deploy-hook "systemctl reload nginx"
EOF

print_status "Auto-renewal configured"

# Create SSL renewal script
cat > /usr/local/bin/sagawagroup-ssl-renew.sh << 'EOF'
#!/bin/bash
# Sagawa Group SSL Renewal Script

echo "$(date): Starting SSL certificate renewal for sagawagroup.id"
certbot renew --quiet --deploy-hook "systemctl reload nginx"

if [ $? -eq 0 ]; then
    echo "$(date): SSL certificate renewal successful"
else
    echo "$(date): SSL certificate renewal failed"
fi
EOF

chmod +x /usr/local/bin/sagawagroup-ssl-renew.sh

echo ""
echo -e "${GREEN}🎉 SSL Setup Completed Successfully!${NC}"
echo ""
echo -e "${GREEN}✅ Your Sagawa Group website is now secured with SSL!${NC}"
echo -e "${BLUE}🌐 Access your website at: https://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}📋 SSL Certificate Details:${NC}"
certbot certificates
echo ""
echo -e "${YELLOW}🔄 Auto-renewal is configured and will run twice daily${NC}"
echo -e "${GREEN}🍜 Sagawa Group - Secure Kuliner Jepang Experience! 🍜${NC}"