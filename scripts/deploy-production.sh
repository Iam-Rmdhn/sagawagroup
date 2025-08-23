#!/bin/bash

# 🚀 Production Deployment Script for Sagawa Group
# Deploy sagawagroup.id without Docker with SSL/TLS Security
# Author: Production Team
# Date: $(date '+%Y-%m-%d')

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="sagawagroup.id"
PROJECT_DIR="/var/www/sagawagroup"
FRONTEND_PORT=3000
BACKEND_PORT=4000
NGINX_SITE_PATH="/etc/nginx/sites-available/sagawagroup"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/sagawagroup"

echo -e "${BLUE}🚀 Starting Production Deployment for Sagawa Group${NC}"
echo -e "${BLUE}📅 $(date)${NC}"
echo ""

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or use sudo"
    exit 1
fi

print_status "Running as root - OK"

# Update system packages
echo -e "${BLUE}📦 Updating system packages...${NC}"
apt update && apt upgrade -y
print_status "System updated"

# Install required packages
echo -e "${BLUE}📦 Installing required packages...${NC}"
apt install -y nginx curl wget unzip software-properties-common ufw fail2ban

# Install Node.js 20
echo -e "${BLUE}📦 Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
print_status "Node.js installed: $(node --version)"

# Install Bun
echo -e "${BLUE}📦 Installing Bun...${NC}"
curl -fsSL https://bun.sh/install | bash
export PATH="$PATH:/root/.bun/bin"
ln -sf /root/.bun/bin/bun /usr/local/bin/bun
print_status "Bun installed: $(bun --version)"

# Install PM2
echo -e "${BLUE}📦 Installing PM2...${NC}"
npm install -g pm2
print_status "PM2 installed"

# Create application directory structure
echo -e "${BLUE}📁 Setting up directory structure...${NC}"
mkdir -p /var/www/sagawagroup/frontend-build
mkdir -p /var/www/sagawagroup/logs
mkdir -p /var/log/sagawagroup
chown -R www-data:www-data /var/www/sagawagroup/frontend-build
print_status "Directory structure created"

# Build frontend
echo -e "${BLUE}🔨 Building Astro frontend...${NC}"
cd $PROJECT_DIR/vue-frontend
npm install
npm run build
print_status "Frontend built successfully"

# Copy built frontend
echo -e "${BLUE}📂 Copying frontend build...${NC}"
cp -r ./dist/* /var/www/sagawagroup/frontend-build/
chown -R www-data:www-data /var/www/sagawagroup/frontend-build
print_status "Frontend copied to production directory"

# Setup backend
echo -e "${BLUE}🔧 Setting up Bun API backend...${NC}"
cd $PROJECT_DIR/bun-api
bun install
print_status "Backend dependencies installed"

# Create environment file if not exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    print_warning "Creating .env file from template"
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env" 2>/dev/null || echo "# Environment variables for Sagawa Group API
DATABASE_URL=https://your-astra-db-url
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-chars-sagawagroup2024
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=info@sagawagroup.id
EMAIL_PASS=your-app-password
PORT=4000
NODE_ENV=production
DOMAIN=sagawagroup.id" > "$PROJECT_DIR/.env"
    print_warning "Please edit $PROJECT_DIR/.env with your actual configuration"
fi

# Configure Nginx
echo -e "${BLUE}🌐 Configuring Nginx...${NC}"
cat > $NGINX_SITE_PATH << 'EOF'
# Sagawa Group - Production Configuration
# Website: sagawagroup.id
# Kuliner Jepang Franchise Network

server {
    listen 80;
    server_name sagawagroup.id www.sagawagroup.id;
    return 301 https://sagawagroup.id$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.sagawagroup.id;
    return 301 https://sagawagroup.id$request_uri;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/sagawagroup.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sagawagroup.id/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/sagawagroup.id/chain.pem;
}

server {
    listen 443 ssl http2;
    server_name sagawagroup.id;
    
    # Root directory for Sagawa Group website
    root /var/www/sagawagroup/frontend-build;
    index index.html;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/sagawagroup.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sagawagroup.id/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/sagawagroup.id/chain.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers for Sagawa Group
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self';" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API Proxy to Bun Backend
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        
        # Rate limiting for API
        limit_req zone=api burst=20 nodelay;
    }

    # Handle file uploads (for mitra registration)
    location /uploads/ {
        alias /var/www/sagawagroup/bun-api/uploads/;
        expires 1d;
        add_header Cache-Control "public";
        access_log off;
    }

    # Main frontend routes
    location / {
        try_files $uri $uri/ /index.html;
        
        # Security for HTML files
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            expires 0;
        }
    }

    # Admin panel security
    location /admin {
        # Additional security for admin routes
        allow 127.0.0.1;
        # Add your admin IP here
        # allow YOUR_ADMIN_IP;
        deny all;
        
        try_files $uri $uri/ /index.html;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ \.(env|log|config)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Logs
    access_log /var/log/nginx/sagawagroup_access.log;
    error_log /var/log/nginx/sagawagroup_error.log;
}

# Rate Limiting Configuration
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;
EOF

# Enable site
ln -sf $NGINX_SITE_PATH $NGINX_ENABLED_PATH
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo -e "${BLUE}🧪 Testing Nginx configuration...${NC}"
nginx -t
print_status "Nginx configuration valid"

# Configure Firewall (UFW)
echo -e "${BLUE}🔒 Configuring firewall...${NC}"
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
print_status "Firewall configured"

# Configure Fail2Ban
echo -e "${BLUE}🛡️ Configuring Fail2Ban...${NC}"
cat > /etc/fail2ban/jail.d/sagawagroup.conf << EOF
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/*error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/*error.log
maxretry = 10

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

systemctl enable fail2ban
systemctl restart fail2ban
print_status "Fail2Ban configured"

# Install Certbot for SSL
echo -e "${BLUE}🔐 Installing Certbot for SSL...${NC}"
apt install -y snapd
snap install core; snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot
print_status "Certbot installed"

# Create PM2 ecosystem file
echo -e "${BLUE}📋 Creating PM2 ecosystem...${NC}"
cat > $PROJECT_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'sagawagroup-api',
    script: 'bun',
    args: 'run index.ts',
    cwd: '/var/www/sagawagroup/bun-api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: '/var/www/sagawagroup/logs/api-error.log',
    out_file: '/var/www/sagawagroup/logs/api-out.log',
    log_file: '/var/www/sagawagroup/logs/api-combined.log',
    time: true
  }]
}
EOF

print_status "PM2 ecosystem created"

echo ""
echo -e "${GREEN}🎉 Base setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Edit environment file: nano $PROJECT_DIR/.env"
echo "2. Get SSL certificate: certbot --nginx -d sagawagroup.id -d www.sagawagroup.id"
echo "3. Start backend: cd $PROJECT_DIR && pm2 start ecosystem.config.js"
echo "4. Start Nginx: systemctl start nginx"
echo "5. Enable services: systemctl enable nginx"
echo ""
echo -e "${BLUE}🌐 After SSL setup, your Sagawa Group website will be available at:${NC}"
echo "   https://sagawagroup.id"
echo ""
echo -e "${GREEN}✨ Sagawa Group - Kuliner Jepang Terbaik! ✨${NC}"