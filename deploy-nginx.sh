#!/bin/bash

# ============================================
# Script Deployment Nginx untuk SPA
# ============================================
# Usage: ./deploy-nginx.sh myproject yourdomain.com

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "Script ini harus dijalankan sebagai root (gunakan sudo)"
   exit 1
fi

# Get parameters
PROJECT_NAME=${1:-myproject}
DOMAIN=${2:-yourdomain.com}
WWW_DOMAIN="www.$DOMAIN"
PROJECT_PATH="/var/www/$PROJECT_NAME/dist"
NGINX_CONFIG="/etc/nginx/sites-available/$PROJECT_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$PROJECT_NAME"

echo ""
echo "============================================"
echo "  🚀 Nginx SPA Deployment Script"
echo "============================================"
echo ""
print_info "Project Name: $PROJECT_NAME"
print_info "Domain: $DOMAIN"
print_info "Web Root: $PROJECT_PATH"
print_info "Nginx Config: $NGINX_CONFIG"
echo ""

# Step 1: Check if nginx is installed
print_info "Checking Nginx installation..."
if ! command -v nginx &> /dev/null; then
    print_error "Nginx not found. Installing..."
    apt update
    apt install nginx -y
    print_success "Nginx installed"
else
    print_success "Nginx is already installed"
fi

# Step 2: Create project directory
print_info "Creating project directory..."
mkdir -p "$PROJECT_PATH"
chown -R www-data:www-data "/var/www/$PROJECT_NAME"
chmod 755 "/var/www/$PROJECT_NAME"
print_success "Project directory created: $PROJECT_PATH"

# Step 3: Create nginx config
print_info "Creating Nginx configuration..."

cat > "$NGINX_CONFIG" << 'EOF'
# Nginx Configuration for SPA
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER WWW_DOMAIN_PLACEHOLDER;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name sagawagroup.id www.sagawagroup.id;
    
    # SSL Configuration (akan diupdate oleh Certbot)
    # ssl_certificate /etc/letsencrypt/live/sagawagroup.id/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/agawagroup.id/privkey.pem;
    
    root /var/www/sagawagroup/dist;
    index index.html;
    
    access_log /var/log/nginx/sagawagroup_access.log;
    error_log /var/log/nginx/sagawagroup_error.log warn;
    
    server_tokens off;
    client_max_body_size 10M;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types application/javascript application/json text/css text/javascript;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # HTML - NO CACHE
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
        add_header Pragma "no-cache" always;
    }
    
    # CSS & JS - Cache 30 days
    location ~* \.(css|js|mjs)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable" always;
        access_log off;
    }
    
    # Images - Cache 30 days
    location ~* \.(jpg|jpeg|png|gif|webp|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000" always;
        access_log off;
    }
    
    # Fonts - Cache 1 year
    location ~* \.(woff|woff2|ttf|otf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        add_header Access-Control-Allow-Origin "*" always;
        access_log off;
    }
    
    # Service Worker - NO CACHE
    location ~* (service-worker\.js|sw\.js)$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    }
    
    # Favicon
    location = /favicon.ico {
        log_not_found off;
        access_log off;
        expires 1y;
    }
    
    # Deny hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
EOF

# Replace placeholders
sed -i "s|DOMAIN_PLACEHOLDER|$DOMAIN|g" "$NGINX_CONFIG"
sed -i "s|WWW_DOMAIN_PLACEHOLDER|$WWW_DOMAIN|g" "$NGINX_CONFIG"
sed -i "s|PROJECT_PATH_PLACEHOLDER|$PROJECT_PATH|g" "$NGINX_CONFIG"
sed -i "s|PROJECT_NAME_PLACEHOLDER|$PROJECT_NAME|g" "$NGINX_CONFIG"

print_success "Nginx configuration created"

# Step 4: Create symlink
print_info "Creating symlink to sites-enabled..."
if [ -L "$NGINX_ENABLED" ]; then
    print_warning "Symlink already exists, removing old one..."
    rm "$NGINX_ENABLED"
fi
ln -s "$NGINX_CONFIG" "$NGINX_ENABLED"
print_success "Symlink created"

# Step 5: Test nginx config
print_info "Testing Nginx configuration..."
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors. Please check manually."
    exit 1
fi

# Step 6: Reload nginx
print_info "Reloading Nginx..."
systemctl reload nginx
print_success "Nginx reloaded successfully"

# Step 7: Check nginx status
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running. Starting..."
    systemctl start nginx
fi

echo ""
echo "============================================"
echo "  ✅ Deployment Complete!"
echo "============================================"
echo ""
print_info "Next Steps:"
echo "  1. Upload your build files to: $PROJECT_PATH"
echo "  2. Install SSL certificate:"
echo "     sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
echo "  3. Test your website: http://$DOMAIN"
echo ""
print_warning "Note: Currently using HTTP. Run Certbot to enable HTTPS."
echo ""

# Step 8: Offer to install SSL
read -p "Do you want to install SSL certificate now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Installing Certbot..."
    apt update
    apt install certbot python3-certbot-nginx -y
    
    print_info "Generating SSL certificate..."
    certbot --nginx -d "$DOMAIN" -d "$WWW_DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || true
    
    print_success "SSL certificate installation attempted"
    print_info "Check Certbot output above for any errors"
fi

echo ""
print_success "All done! 🎉"
echo ""
