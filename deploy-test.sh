#!/bin/bash

# Sagawa Group Test Domain Deployment Script
# Test Domain: tes.bun.tams.my.id
# Author: Test Deploy System
# Version: 1.0

set -e  # Exit on any error

# Configuration
PROJECT_NAME="sagawagroup-test"
DOMAIN="tes.bun.tams.my.id"
PROJECT_DIR="/root/work/sagawagroup"
DEPLOY_DIR="/var/www/sagawagroup-test"
API_PORT="5001"  # Test port - different from production (5000)
FRONTEND_PORT="4322"  # Different from production (4321)
EMAIL="admin@sagawagroup.id"  # For SSL certificate

# Ensure bun is in PATH
export PATH="/root/.bun/bin:$PATH"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
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

print_header "Sagawa Group Test Deployment"
print_info "Test Domain: $DOMAIN"
print_info "API Port: $API_PORT"
print_info "Deploy Directory: $DEPLOY_DIR"
echo ""

# Step 1: Create deployment directory
print_header "Step 1: Creating Deployment Directory"
mkdir -p "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/frontend"
mkdir -p "$DEPLOY_DIR/api"
print_success "Deployment directory created"

# Step 2: Copy API files
print_header "Step 2: Copying API Files"
rsync -av --exclude=node_modules --exclude=.git --exclude=.env.production "$PROJECT_DIR/bun-api/" "$DEPLOY_DIR/api/"
print_success "API files copied"

# Copy production environment file as .env (configured for test domain)
print_info "Configuring environment variables..."
if [ -f "$PROJECT_DIR/bun-api/.env.production" ]; then
    cp "$PROJECT_DIR/bun-api/.env.production" "$DEPLOY_DIR/api/.env"
    print_success "Environment file configured (using production credentials on test domain)"
else
    print_error "Environment file not found at $PROJECT_DIR/bun-api/.env.production"
    exit 1
fi

# Step 3: Install API dependencies
print_header "Step 3: Installing API Dependencies"
cd "$DEPLOY_DIR/api"
if command -v bun &> /dev/null; then
    bun install
    print_success "API dependencies installed with Bun"
else
    print_error "Bun is not installed. Please install Bun first."
    exit 1
fi

# Step 4: Build frontend (if exists)
print_header "Step 4: Building Frontend"
if [ -d "$PROJECT_DIR/vue-frontend" ]; then
    cd "$PROJECT_DIR/vue-frontend"

    # Create frontend .env file for test domain
    print_info "Creating frontend .env file for test domain..."
    cat > .env << 'EOF'
PUBLIC_API_URL=https://tes.bun.tams.my.id
EOF
    print_success "Frontend .env file created"

    # Install dependencies and build
    if command -v bun &> /dev/null; then
        bun install
        bun run build
        print_success "Frontend built with Bun"
    else
        npm install
        npm run build
        print_success "Frontend built with npm"
    fi
    
    # Copy built files
    if [ -d "dist" ]; then
        cp -r dist/* "$DEPLOY_DIR/frontend/"
        print_success "Frontend files copied to deployment directory"
    else
        print_warning "No dist directory found, skipping frontend deployment"
    fi
else
    print_warning "Frontend directory not found, skipping frontend build"
fi

# Step 5: Create nginx configuration
print_header "Step 5: Creating Nginx Configuration"

cat > "/etc/nginx/sites-available/$PROJECT_NAME" << 'EOF'
# Test Domain Configuration for Sagawa Group
# Domain: tes.bun.tams.my.id
# API Port: 5001

# HTTP server - will redirect to HTTPS after SSL setup
server {
    listen 80;
    server_name tes.bun.tams.my.id;

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

print_success "Nginx configuration created"

# Step 6: Enable nginx site
print_header "Step 6: Enabling Nginx Site"
ln -sf "/etc/nginx/sites-available/$PROJECT_NAME" "/etc/nginx/sites-enabled/$PROJECT_NAME"
print_success "Nginx site enabled"

# Step 7: Test nginx configuration
print_header "Step 7: Testing Nginx Configuration"
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 8: Reload nginx
print_header "Step 8: Reloading Nginx"
systemctl reload nginx
print_success "Nginx reloaded"

# Step 9: Create systemd service for API
print_header "Step 9: Creating Systemd Service"

cat > "/etc/systemd/system/sagawagroup-test-api.service" << EOF
[Unit]
Description=Sagawa Group Test API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$DEPLOY_DIR/api
Environment="NODE_ENV=production"
Environment="PORT=$API_PORT"
ExecStart=/root/.bun/bin/bun run index.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd service created"

# Step 10: Reload systemd and start service
print_header "Step 10: Starting API Service"
systemctl daemon-reload
systemctl enable sagawagroup-test-api.service
systemctl restart sagawagroup-test-api.service
print_success "API service started"

# Step 11: Check service status
print_header "Step 11: Checking Service Status"
sleep 3
if systemctl is-active --quiet sagawagroup-test-api.service; then
    print_success "API service is running"
    systemctl status sagawagroup-test-api.service --no-pager -l | head -20
else
    print_error "API service failed to start"
    print_info "Checking logs..."
    journalctl -u sagawagroup-test-api.service -n 50 --no-pager
    exit 1
fi

# Step 12: Verify API is responding
print_header "Step 12: Verifying API"
sleep 2
if curl -f http://localhost:$API_PORT/health &> /dev/null; then
    print_success "API is responding on port $API_PORT"
else
    print_warning "API health check failed, but service is running. Check logs if needed."
fi

# Final summary
print_header "Deployment Summary"
echo -e "${GREEN}✓ Test deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}Test Domain:${NC} http://$DOMAIN"
echo -e "${BLUE}API Port:${NC} $API_PORT"
echo -e "${BLUE}Deploy Directory:${NC} $DEPLOY_DIR"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure SSL certificate: sudo ./setup-ssl-test.sh"
echo "2. Test the API: curl http://$DOMAIN/api/health"
echo "3. Check service logs: sudo journalctl -u sagawagroup-test-api.service -f"
echo ""
print_warning "Note: SSL certificate not yet configured. The site is currently HTTP only."
print_info "Run the SSL setup script to enable HTTPS."

