#!/bin/bash

# SSL Certificate Setup for Test Domain
# Domain: tes.bun.tams.my.id
# Uses Let's Encrypt with Certbot

set -e  # Exit on any error

# Configuration
DOMAIN="tes.bun.tams.my.id"
EMAIL="admin@sagawagroup.id"
WEBROOT="/var/www/sagawagroup-test/frontend"
PROJECT_NAME="sagawagroup-test"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_header "SSL Certificate Setup for Test Domain"
print_info "Domain: $DOMAIN"
print_info "Email: $EMAIL"
echo ""

# Step 1: Install Certbot if not already installed
print_header "Step 1: Checking Certbot Installation"
if ! command -v certbot &> /dev/null; then
    print_info "Installing Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    print_success "Certbot installed"
else
    print_success "Certbot is already installed"
fi

# Step 2: Verify domain is accessible
print_header "Step 2: Verifying Domain Accessibility"
print_info "Checking if $DOMAIN is accessible..."

if curl -f -s -o /dev/null "http://$DOMAIN"; then
    print_success "Domain is accessible"
else
    print_warning "Domain may not be accessible yet. Continuing anyway..."
    print_info "Make sure DNS is properly configured for $DOMAIN"
fi

# Step 3: Obtain SSL certificate
print_header "Step 3: Obtaining SSL Certificate"
print_info "Requesting certificate from Let's Encrypt..."

# Use certbot with nginx plugin
if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect; then
    print_success "SSL certificate obtained and configured"
else
    print_error "Failed to obtain SSL certificate"
    print_info "Possible reasons:"
    print_info "  1. Domain DNS not properly configured"
    print_info "  2. Port 80 not accessible from internet"
    print_info "  3. Firewall blocking access"
    print_info ""
    print_info "Manual steps to try:"
    print_info "  1. Check DNS: dig $DOMAIN"
    print_info "  2. Check firewall: sudo ufw status"
    print_info "  3. Test port 80: curl http://$DOMAIN"
    exit 1
fi

# Step 4: Update nginx configuration for HTTPS
print_header "Step 4: Updating Nginx Configuration"

# Backup current config
cp "/etc/nginx/sites-available/$PROJECT_NAME" "/etc/nginx/sites-available/$PROJECT_NAME.backup"

# Create enhanced HTTPS configuration
cat > "/etc/nginx/sites-available/$PROJECT_NAME" << 'EOF'
# Test Domain Configuration for Sagawa Group
# Domain: tes.bun.tams.my.id
# API Port: 5001

# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name tes.bun.tams.my.id;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/sagawagroup-test/frontend;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name tes.bun.tams.my.id;

    # SSL configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/tes.bun.tams.my.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tes.bun.tams.my.id/privkey.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Document root
    root /var/www/sagawagroup-test/frontend;
    index index.html;

    # Logging
    access_log /var/log/nginx/sagawagroup-test-access.log;
    error_log /var/log/nginx/sagawagroup-test-error.log;

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # CORS is handled by the backend API
        # No CORS headers here to avoid duplicates
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:5001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot|otf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # HTML files with minimal caching
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
}
EOF

print_success "Nginx configuration updated for HTTPS"

# Step 5: Test nginx configuration
print_header "Step 5: Testing Nginx Configuration"
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    print_info "Restoring backup configuration..."
    mv "/etc/nginx/sites-available/$PROJECT_NAME.backup" "/etc/nginx/sites-available/$PROJECT_NAME"
    exit 1
fi

# Step 6: Reload nginx
print_header "Step 6: Reloading Nginx"
systemctl reload nginx
print_success "Nginx reloaded"

# Step 7: Test HTTPS
print_header "Step 7: Testing HTTPS"
sleep 2
if curl -f -s -o /dev/null "https://$DOMAIN"; then
    print_success "HTTPS is working correctly"
else
    print_warning "HTTPS test failed, but certificate may still be valid"
fi

# Step 8: Setup auto-renewal
print_header "Step 8: Setting Up Auto-Renewal"
if systemctl is-active --quiet certbot.timer; then
    print_success "Certbot auto-renewal is already configured"
else
    systemctl enable certbot.timer
    systemctl start certbot.timer
    print_success "Certbot auto-renewal configured"
fi

# Final summary
print_header "SSL Setup Complete"
echo -e "${GREEN}✓ SSL certificate successfully configured!${NC}"
echo ""
echo -e "${BLUE}Domain:${NC} https://$DOMAIN"
echo -e "${BLUE}Certificate:${NC} /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo -e "${BLUE}Private Key:${NC} /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo ""
echo -e "${YELLOW}Certificate Information:${NC}"
certbot certificates -d "$DOMAIN" 2>/dev/null || true
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Test HTTPS: curl https://$DOMAIN/health"
echo "2. Test API: curl https://$DOMAIN/api/health"
echo "3. Run CORS tests: node test-cors-fix.js"
echo ""
print_success "Your test domain is now secured with HTTPS!"

