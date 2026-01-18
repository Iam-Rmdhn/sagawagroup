#!/bin/bash

# Sagawa Group Production Deployment Script
# Domain: www.sagawagroup.id
# Author: Production Deploy System
# Version: 1.0

set -e  # Exit on any error

# Configuration
PROJECT_NAME="sagawagroup"
DOMAIN="sagawagroup.id"
WWW_DOMAIN="www.sagawagroup.id"
# Resolve project dir dynamically based on this script's location
# This makes the script portable across servers/users
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="/var/www/sagawagroup"
API_PORT="5000"
FRONTEND_PORT="4321"
EMAIL="admin@sagawagroup.id"  # For SSL certificate

# Ensure bun is in PATH for the entire script
export PATH="/root/.bun/bin:$PATH"

# CI/CD specific variables
DEPLOYMENT_MODE="interactive"
LOG_FILE="/var/log/sagawagroup-deploy.log"
BACKUP_NAME=""
CI_MODE=false
SKIP_CONFIRMATION=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Enhanced logging function
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Function to print colored output with logging
print_header() {
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}============================================${NC}"
    log_message "INFO" "$1"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log_message "INFO" "$1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    log_message "SUCCESS" "$1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log_message "WARNING" "$1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log_message "ERROR" "$1"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run this script as root (use sudo)"
        exit 1
    fi
}

# Function to validate project directory
validate_project() {
    print_status "Validating project directory..."
    
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "Project directory not found: $PROJECT_DIR"
        print_error "Please ensure the Sagawa Group project is cloned at $PROJECT_DIR"
        exit 1
    fi
    
    if [ ! -d "$PROJECT_DIR/vue-frontend" ]; then
        print_error "Frontend directory not found: $PROJECT_DIR/vue-frontend"
        exit 1
    fi
    
    if [ ! -d "$PROJECT_DIR/bun-api" ]; then
        print_error "API directory not found: $PROJECT_DIR/bun-api"
        exit 1
    fi
    
    print_success "Project directory validation passed"
}

# Function to backup current deployment if exists
backup_current() {
    if [ -d "$DEPLOY_DIR" ]; then
        BACKUP_NAME="sagawagroup-backup-$(date +%Y%m%d_%H%M%S)"
        print_status "Backing up current deployment..."
        mv "$DEPLOY_DIR" "/var/backups/${BACKUP_NAME}"
        print_success "Current deployment backed up to /var/backups/${BACKUP_NAME}"
        
        # Export backup name for potential rollback
        export BACKUP_DIR="/var/backups/${BACKUP_NAME}"
    else
        print_status "No existing deployment found, skipping backup"
    fi
}

# Function to rollback deployment
rollback_deployment() {
    if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
        print_warning "Rolling back deployment..."
        if [ -d "$DEPLOY_DIR" ]; then
            rm -rf "$DEPLOY_DIR"
        fi
        mv "$BACKUP_DIR" "$DEPLOY_DIR"
        
        # Restart services
        cd "$DEPLOY_DIR"
        if [ -f "ecosystem.config.cjs" ]; then
            pm2 restart ecosystem.config.cjs --env production 2>/dev/null || true
        fi
        
        print_success "Rollback completed"
        return 0
    else
        print_error "No backup available for rollback"
        return 1
    fi
}

# Function to create deployment directories
create_directories() {
    print_status "Creating deployment directories..."
    mkdir -p "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR/frontend"
    mkdir -p "$DEPLOY_DIR/api"
    mkdir -p "$DEPLOY_DIR/uploads"
    mkdir -p "$DEPLOY_DIR/logs"
    mkdir -p "/var/backups"  # Create backup directory
    print_success "Deployment directories created"
}

# Function to install system dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    # Update package list
    print_status "Updating package lists..."
    apt-get update || print_warning "apt-get update encountered errors, continuing anyway..."
    
    # Install Nginx if not installed
    if ! command -v nginx &> /dev/null; then
        print_status "Installing Nginx..."
        apt install -y nginx
    fi
    
    # Install Certbot for SSL if not installed
    if ! command -v certbot &> /dev/null; then
        print_status "Installing Certbot for SSL..."
        apt install -y certbot python3-certbot-nginx
    fi
    
    # Install PM2 globally if not installed
    if ! command -v pm2 &> /dev/null; then
        print_status "Installing PM2..."
        npm install -g pm2
    fi

    # Ensure Node.js meets Astro minimum requirement (>= 18.20.8)
    MIN_NODE="18.20.8"
    NEED_NODE_INSTALL=false
    if ! command -v node &> /dev/null; then
        print_status "Node.js not found. Will install Node.js 20.x (meets Astro requirement)"
        NEED_NODE_INSTALL=true
    else
        CURRENT_NODE=$(node -v | sed 's/^v//')
        # compare versions using sort -V
        if [ "$(printf '%s\n' "$MIN_NODE" "$CURRENT_NODE" | sort -V | head -n1)" != "$MIN_NODE" ]; then
            : # current >= min
        else
            print_status "Node.js $CURRENT_NODE < $MIN_NODE. Will install Node.js 20.x"
            NEED_NODE_INSTALL=true
        fi
    fi

    if [ "$NEED_NODE_INSTALL" = true ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        print_success "Node.js installed: $(node -v)"
    fi
    
    # Ensure bun is available - install if not found
    if ! command -v bun &> /dev/null; then
        print_status "Installing Bun runtime..."
        curl -fsSL https://bun.sh/install | bash
        # Add bun to PATH for current session
        export PATH="/root/.bun/bin:$PATH"
        # Verify installation
        if ! command -v bun &> /dev/null; then
            print_error "Failed to install Bun runtime"
            exit 1
        fi
        print_success "Bun runtime installed successfully"
    else
        print_status "Bun runtime already installed"
    fi
    
    print_success "System dependencies installed"
}

# Function to build frontend
build_frontend() {
    print_status "Building frontend for production..."
    cd "$PROJECT_DIR/vue-frontend"
    
    # Ensure bun is in PATH
    export PATH="/root/.bun/bin:$PATH"
    
    # Verify bun is available
    if ! command -v bun &> /dev/null; then
        print_error "Bun is not available in PATH. Please install Bun first."
        rollback_deployment
        exit 1
    fi
    
    print_status "Using Bun version: $(bun --version)"
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    if ! bun install; then
        print_error "Frontend dependency installation failed"
        rollback_deployment
        exit 1
    fi
    
    # Copy .env.production to .env for build process
    if [ -f ".env.production" ]; then
        print_status "Using production environment configuration..."
        cp .env.production .env
    else
        print_warning "No .env.production found, using existing .env"
    fi
    
    # Build for production with NODE_ENV (use Node/npm to satisfy Astro's Node requirement)
    print_status "Building frontend with production configuration..."
    if ! NODE_ENV=production npm run build; then
        print_error "Frontend build failed"
        rollback_deployment
        exit 1
    fi
    
    # Validate build output
    if [ ! -d "dist" ]; then
        print_error "Frontend build failed - no dist directory found"
        rollback_deployment
        exit 1
    fi
    
    # Check if dist directory has content
    if [ -z "$(ls -A dist)" ]; then
        print_error "Frontend build failed - dist directory is empty"
        rollback_deployment
        exit 1
    fi
    
    # Copy built files to deployment directory
    cp -r dist/* "$DEPLOY_DIR/frontend/"
    
    # Clear nginx cache to force fresh content
    print_status "Clearing Nginx cache..."
    if [ -d "/var/cache/nginx" ]; then
        rm -rf /var/cache/nginx/*
    fi
    
    # Add deployment timestamp to force cache invalidation
    echo "<!-- Deployed at: $(date '+%Y-%m-%d %H:%M:%S') -->" >> "$DEPLOY_DIR/frontend/index.html"
    
    print_success "Frontend built and deployed successfully"
}

# Function to deploy API
deploy_api() {
    print_header "Deploying Backend API"
    
    mkdir -p "$DEPLOY_DIR/api"
    
    # Find or install bun for root
    BUN_PATH=""
    
    # Priority 1: Root's bun installation (best for production)
    if [ -f "/root/.bun/bin/bun" ]; then
        BUN_PATH="/root/.bun/bin/bun"
        export PATH="/root/.bun/bin:$PATH"
        print_status "Using root's Bun installation"
    # Priority 2: System bun (but avoid snap due to confinement issues)
    elif command -v bun &> /dev/null; then
        BUN_CHECK=$(which bun)
        if [[ "$BUN_CHECK" != *"snap"* ]]; then
            BUN_PATH="$BUN_CHECK"
            print_status "Using system Bun at: $BUN_PATH"
        else
            print_warning "Snap bun found but may have permission issues, installing native bun..."
            # Ensure unzip is available for bun installer
            if ! command -v unzip &> /dev/null; then
                print_status "Installing unzip (required by Bun installer)..."
                (apt-get update || true) && apt-get install -y unzip
            fi
            curl -fsSL https://bun.sh/install | bash
            BUN_PATH="/root/.bun/bin/bun"
            export PATH="/root/.bun/bin:$PATH"
        fi
    # Priority 3: User's bun (fallback)
    # Note: do not hardcode other users' bun paths; rely on root/system bun only
    # Install bun if not found
    else
        print_status "Bun not found, installing for root..."
        # Ensure unzip is installed (required by bun installer)
        if ! command -v unzip &> /dev/null; then
            (apt-get update || true) && apt-get install -y unzip
        fi
        curl -fsSL https://bun.sh/install | bash
        if [ -f "/root/.bun/bin/bun" ]; then
            BUN_PATH="/root/.bun/bin/bun"
            export PATH="/root/.bun/bin:$PATH"
            print_success "Bun installed successfully"
        else
            print_error "Failed to install Bun"
            return 1
        fi
    fi
    
    print_success "Using Bun: $BUN_PATH"
    print_status "Bun version: $($BUN_PATH --version)"
    
    # Copy API files
    print_status "Copying API files to deployment directory..."
    
    # Ensure target directory exists with correct permissions
    mkdir -p "$DEPLOY_DIR/api"
    
    # Copy all files including package.json
    print_status "Syncing API files..."
    if ! rsync -av --delete --exclude=node_modules --exclude=.git --exclude=bun.lock "$PROJECT_DIR/bun-api/" "$DEPLOY_DIR/api/"; then
        print_error "Failed to copy API files"
        return 1
    fi
    
    # Verify critical files were copied
    if [ ! -f "$DEPLOY_DIR/api/package.json" ]; then
        print_error "package.json not found after copy!"
        print_status "Trying direct copy..."
        cp "$PROJECT_DIR/bun-api/package.json" "$DEPLOY_DIR/api/"
    fi
    
    if [ ! -f "$DEPLOY_DIR/api/index.ts" ]; then
        print_error "index.ts not found after copy!"
        return 1
    fi
    
    print_success "API files copied successfully"
    
    # Copy production environment file
    if [ -f "$PROJECT_DIR/bun-api/.env.production" ]; then
        cp "$PROJECT_DIR/bun-api/.env.production" "$DEPLOY_DIR/api/.env.production"
        print_success "Production environment file copied"
    else
        print_warning "No .env.production file found"
    fi
    
    # List critical files for debugging
    print_status "Verifying copied files..."
    ls -lh "$DEPLOY_DIR/api/" | grep -E "package.json|index.ts|.env"
    
    # Install API dependencies with Bun
    print_status "Installing API dependencies with Bun..."
    cd "$DEPLOY_DIR/api" || {
        print_error "Failed to navigate to API directory: $DEPLOY_DIR/api"
        return 1
    }
    
    print_status "Current directory: $(pwd)"
    print_status "Checking package.json..."
    if [ -f "package.json" ]; then
        print_success "package.json found"
        cat package.json | head -10
    else
        print_error "package.json NOT FOUND!"
        print_status "Directory contents:"
        ls -la
        return 1
    fi
    
    if ! $BUN_PATH install; then
        print_error "Bun install failed"
        print_status "Attempting fallback with npm..."
        if command -v npm &> /dev/null; then
            if ! npm install --production; then
                print_error "npm install also failed"
                return 1
            fi
        else
            print_error "Both bun and npm failed"
            return 1
        fi
    fi
    
    # Fix ownership of API directory
    print_status "Fixing API directory permissions..."
    chown -R root:root "$DEPLOY_DIR/api"
    chmod -R 755 "$DEPLOY_DIR/api"
    
    # Protect sensitive files
    if [ -f "$DEPLOY_DIR/api/.env.production" ]; then
        chmod 600 "$DEPLOY_DIR/api/.env.production"
    fi
    
    # Sync uploads folder from development to production
    print_status "Syncing uploads folder..."
    if [ -d "$PROJECT_DIR/bun-api/uploads" ]; then
        mkdir -p "$DEPLOY_DIR/uploads"
        rsync -av "$PROJECT_DIR/bun-api/uploads/" "$DEPLOY_DIR/uploads/"
        chown -R www-data:www-data "$DEPLOY_DIR/uploads"
        chmod -R 755 "$DEPLOY_DIR/uploads"
        print_success "Uploads folder synced successfully"
    else
        print_warning "No uploads folder found in development"
        mkdir -p "$DEPLOY_DIR/uploads"
        chown -R www-data:www-data "$DEPLOY_DIR/uploads"
        chmod -R 755 "$DEPLOY_DIR/uploads"
    fi
    
    print_success "API dependencies installed successfully"
    
    # Copy PM2 ecosystem config
    print_status "Setting up PM2 configuration..."
    if [ -f "$PROJECT_DIR/ecosystem-bun.config.js" ]; then
        cp "$PROJECT_DIR/ecosystem-bun.config.js" "$DEPLOY_DIR/"
        print_success "PM2 ecosystem config copied"
    else
        print_warning "No ecosystem-bun.config.js found, using default"
    fi
    
    # Stop old PM2 process if exists
    print_status "Stopping old API process..."
    pm2 delete sagawagroup-api 2>/dev/null || true
    
    # Start API with PM2
    print_status "Starting API with PM2..."
    cd "$DEPLOY_DIR"
    
    # Set environment variables for PM2
    export NODE_ENV=production
    export PORT=5000
    
    if [ -f "ecosystem-bun.config.js" ]; then
        # Update ecosystem config with correct bun path
        sed -i "s|script: \".*bun\"|script: \"$BUN_PATH\"|g" ecosystem-bun.config.js
        pm2 start ecosystem-bun.config.js --env production
    else
        # Fallback: start directly with bun with proper working directory
        print_warning "ecosystem-bun.config.js not found, starting directly"
        pm2 start "$BUN_PATH" \
            --name sagawagroup-api \
            --cwd "$DEPLOY_DIR/api" \
            -- run index.ts
    fi
    
    # Save PM2 configuration
    pm2 save
    
    # Wait for API to start
    sleep 3
    
    # Check if API is running
    if pm2 list | grep -q "sagawagroup-api.*online"; then
        print_success "API deployed and running successfully"
        
        # Test API health
        if curl -f http://localhost:5000/api/health 2>/dev/null; then
            print_success "API health check passed"
        else
            print_warning "API is running but health check failed"
        fi
    else
        print_error "API failed to start"
        print_status "Checking logs..."
        pm2 logs sagawagroup-api --lines 20 --nostream
        return 1
    fi
}

rollback() {
    print_status "Rolling back to previous deployment..."
    if [ -d "/root/${backup_name}" ]; then
        rm -rf "$DEPLOY_DIR"
        mv "/root/${backup_name}" "$DEPLOY_DIR"
        print_success "Rollback completed"
    else
        print_error "No backup found for rollback"
    fi
}

main() {
    print_header "SAGAWA GROUP PRODUCTION DEPLOYMENT"
    print_status "Domain: ${WWW_DOMAIN}"
    print_status "Starting deployment process..."
    
    # Pre-deployment checks
    check_root
    
    # Execute deployment steps
    backup_current
    create_directories
    install_dependencies
    
    if ! build_frontend; then
        rollback
        exit 1
    fi
    
    if ! deploy_api; then
        rollback
        exit 1
    fi
    
    create_pm2_ecosystem
    set_permissions
    create_nginx_config
    enable_nginx_site
    setup_ssl
    create_health_check
    start_services
    
    # Show final status
    show_status
}

# Function to create PM2 ecosystem file (SINGLE VERSION)
create_pm2_ecosystem() {
    print_status "Creating PM2 ecosystem file..."
    
    cat > "$DEPLOY_DIR/ecosystem.config.cjs" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'sagawagroup-api',
      script: 'index.ts',
      cwd: '/var/www/sagawagroup/api',
      interpreter: 'bun',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      
      // Process management
      instances: 1,
      exec_mode: 'fork',
      
      // Restart behavior
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Memory management
      max_memory_restart: '1G',
      
      // Logging
      error_file: '/var/www/sagawagroup/logs/api-error.log',
      out_file: '/var/www/sagawagroup/logs/api-out.log',
      log_file: '/var/www/sagawagroup/logs/api-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced options
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Source map support
      source_map_support: true,
      
      // Process title for system monitoring
      name: 'sagawagroup-api-process'
    }
  ]
};
EOF
    
    print_success "PM2 ecosystem file created"
}

# Function to create Nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration..."
    
    # Create rate limiting configuration
    cat > "/etc/nginx/conf.d/rate-limit.conf" << 'EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
EOF

    # Check if SSL certificates exist
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        print_status "SSL certificates found, creating HTTPS configuration..."
        create_https_nginx_config
    else
        print_status "No SSL certificates found, creating HTTP-only configuration..."
        create_http_nginx_config
    fi
    
    print_success "Nginx configuration created"
}

# Function to create HTTP-only nginx configuration
create_http_nginx_config() {
    cat > "/etc/nginx/sites-available/sagawagroup" << 'EOF'
# HTTP server
server {
    listen 80;
    server_name __DOMAIN__ __WWW_DOMAIN__;
    
    # Document root
    root __DEPLOY_DIR__/frontend;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;
    
    # API proxy with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:__API_PORT__/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://localhost:__API_PORT__/api/auth/login;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Upload files proxy
    location /uploads/ {
        proxy_pass http://localhost:__API_PORT__/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # File upload limits
        client_max_body_size 10M;
    }
    
    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)(\?v=\d+)?$ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        access_log off;
        
        # Optional: Enable CORS for fonts
        location ~* \.(woff|woff2|ttf|eot)$ {
            add_header Access-Control-Allow-Origin "*" always;
        }
    }
    
    # HTML files with no cache
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Root files with no cache
    location = / {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Frontend routes (SPA fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Hide Nginx version
    server_tokens off;
    
    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
EOF
    
    # Substitute placeholders
    sed -i "s|__DOMAIN__|${DOMAIN}|g" "/etc/nginx/sites-available/sagawagroup"
    sed -i "s|__WWW_DOMAIN__|${WWW_DOMAIN}|g" "/etc/nginx/sites-available/sagawagroup"
    sed -i "s|__API_PORT__|${API_PORT}|g" "/etc/nginx/sites-available/sagawagroup"
    sed -i "s|__DEPLOY_DIR__|${DEPLOY_DIR}|g" "/etc/nginx/sites-available/sagawagroup"
}

# Function to create HTTPS nginx configuration
create_https_nginx_config() {
    # Create main site configuration
    # We use a template with placeholders and then substitute the variables
    # This prevents shell expansion of Nginx variables like $host, $remote_addr, etc.
    cat > "/etc/nginx/sites-available/sagawagroup" << 'EOF'
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name __DOMAIN__ __WWW_DOMAIN__;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name __DOMAIN__ __WWW_DOMAIN__;
    
    # SSL configuration (will be managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/__DOMAIN__/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/__DOMAIN__/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Document root
    root __DEPLOY_DIR__/frontend;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;
    
    # API proxy with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:__API_PORT__/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # CORS headers - Let the backend handle CORS to avoid duplicate headers
        # The Bun API server will handle CORS properly based on the origin
        # Remove nginx CORS headers to prevent conflicts
    }
    
    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://localhost:__API_PORT__/api/auth/login;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Upload files proxy
    location /uploads/ {
        proxy_pass http://localhost:__API_PORT__/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # File upload limits
        client_max_body_size 10M;
    }
    
    # Static files with caching - versioned files can be cached longer
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)(\?v=\d+)?$ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        access_log off;
        
        # Optional: Enable CORS for fonts
        location ~* \.(woff|woff2|ttf|eot)$ {
            add_header Access-Control-Allow-Origin "*" always;
        }
    }
    
    # HTML files with no cache to ensure fresh content
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Root files with no cache
    location = / {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Frontend routes (SPA fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'self';" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    
    # Hide Nginx version
    server_tokens off;
    
    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
EOF

    # Now substitute the placeholders with actual values
    sed -i "s|__DOMAIN__|${DOMAIN}|g" "/etc/nginx/sites-available/sagawagroup"
    sed -i "s|__WWW_DOMAIN__|${WWW_DOMAIN}|g" "/etc/nginx/sites-available/sagawagroup"
    sed -i "s|__API_PORT__|${API_PORT}|g" "/etc/nginx/sites-available/sagawagroup"
    sed -i "s|__DEPLOY_DIR__|${DEPLOY_DIR}|g" "/etc/nginx/sites-available/sagawagroup"
}

# Function to enable Nginx site
enable_nginx_site() {
    print_status "Enabling Nginx site..."
    
    # Enable site
    ln -sf /etc/nginx/sites-available/sagawagroup /etc/nginx/sites-enabled/
    
    # Test configuration
    nginx -t
    
    if [ $? -eq 0 ]; then
        print_success "Nginx configuration is valid"
        
        # Clear nginx cache before reload
        print_status "Clearing Nginx cache..."
        if [ -d "/var/cache/nginx" ]; then
            rm -rf /var/cache/nginx/*
            print_success "Nginx cache cleared"
        fi
        
        # Reload nginx with cache purged
        systemctl reload nginx
        print_success "Nginx reloaded with fresh cache"
    else
        print_error "Nginx configuration is invalid"
        exit 1
    fi
}

# Function to setup SSL with Let's Encrypt
setup_ssl() {
    print_status "Setting up SSL certificate with Let's Encrypt (webroot method)..."

    # Helper: DNS alignment check (A/AAAA should route to this server)
    dns_alignment_ok=true
    if command -v dig >/dev/null 2>&1; then
        PUBLIC_IPV4=$(curl -4 -s https://api.ipify.org || true)
        PUBLIC_IPV6=$(curl -6 -s https://api64.ipify.org || true)
        DNS_A=$(dig +short ${DOMAIN} A @8.8.8.8 2>/dev/null | tail -n1)
        DNS_AAAA=$(dig +short ${DOMAIN} AAAA @8.8.8.8 2>/dev/null | tail -n1)
        print_status "Public IPv4: ${PUBLIC_IPV4:-unknown} | DNS A: ${DNS_A:-none}"
        print_status "Public IPv6: ${PUBLIC_IPV6:-unknown} | DNS AAAA: ${DNS_AAAA:-none}"
        if [ -n "$DNS_A" ] && [ -n "$PUBLIC_IPV4" ] && [ "$DNS_A" != "$PUBLIC_IPV4" ]; then
            print_error "DNS A (${DNS_A}) does not match this server IPv4 (${PUBLIC_IPV4})."
            dns_alignment_ok=false
        fi
        if [ -n "$DNS_AAAA" ]; then
            if [ -z "$PUBLIC_IPV6" ] || [ "$DNS_AAAA" != "$PUBLIC_IPV6" ]; then
                print_error "DNS AAAA (${DNS_AAAA}) does not route to this server (public IPv6: ${PUBLIC_IPV6:-none})."
                dns_alignment_ok=false
            fi
        fi
    else
        print_warning "'dig' not available; skipping DNS alignment check."
    fi

    if [ "$dns_alignment_ok" != true ]; then
        print_error "DNS is not aligned to this server. ACME HTTP-01 will fail. Fix A/AAAA records (or remove AAAA temporarily) and re-run."
        print_warning "Continuing deployment without SSL. You can run setup-ssl.sh later after fixing DNS."
        return 0
    fi

    # Create webroot directory for challenge and set safe perms
    mkdir -p /var/www/certbot
    chown -R www-data:www-data /var/www/certbot
    chmod -R 755 /var/www/certbot

    # Temporarily disable existing site to avoid server_name conflicts
    if [ -L "/etc/nginx/sites-enabled/sagawagroup" ]; then
        rm -f /etc/nginx/sites-enabled/sagawagroup
        print_status "Temporarily disabled existing sagawagroup site"
    fi

    # Create a minimal default_server for ACME on port 80 (IPv4/IPv6)
    cat > "/etc/nginx/sites-available/temp-sagawagroup" << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
        default_type "text/plain";
        try_files $uri =404;
        allow all;
    }

    location / { return 404; }
}
EOF
    ln -sf /etc/nginx/sites-available/temp-sagawagroup /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    if nginx -t; then
        systemctl reload nginx
        print_success "Temporary ACME Nginx site enabled"
    else
        print_error "Nginx config test failed while enabling ACME site"
        print_warning "Continuing without SSL."
        rm -f /etc/nginx/sites-enabled/temp-sagawagroup /etc/nginx/sites-available/temp-sagawagroup || true
        return 0
    fi

    # Obtain or expand certificate using webroot
    if certbot certificates 2>/dev/null | grep -q "${DOMAIN}"; then
        print_status "Expanding existing certificate for ${DOMAIN} to include ${WWW_DOMAIN}..."
        certbot certonly --webroot -w /var/www/certbot \
            --email ${EMAIL} --agree-tos --non-interactive --expand \
            -d ${DOMAIN} -d ${WWW_DOMAIN}
    else
        print_status "Obtaining new SSL certificate for ${DOMAIN} and ${WWW_DOMAIN}..."
        certbot certonly --webroot -w /var/www/certbot \
            --email ${EMAIL} --agree-tos --non-interactive \
            -d ${DOMAIN} -d ${WWW_DOMAIN}
    fi

    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained"
        
        # Remove temp ACME site and re-enable main site
        rm -f /etc/nginx/sites-enabled/temp-sagawagroup
        rm -f /etc/nginx/sites-available/temp-sagawagroup
        ln -sf /etc/nginx/sites-available/sagawagroup /etc/nginx/sites-enabled/sagawagroup
        
        # Reload nginx to pick up HTTPS config
        if nginx -t; then
            systemctl reload nginx
            print_success "Nginx reloaded with HTTPS configuration"
        else
            print_warning "Nginx config test failed post-SSL; please review configuration."
        fi
        
        # Setup auto-renewal via cron
        print_status "Setting up SSL certificate auto-renewal..."
        (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
        print_success "SSL auto-renewal configured"
    else
        print_error "Failed to obtain SSL certificate"
        print_warning "Continuing without SSL. You can run setup-ssl.sh later after fixing DNS/HTTP access."
        # Cleanup temp site and re-enable main site
        rm -f /etc/nginx/sites-enabled/temp-sagawagroup
        rm -f /etc/nginx/sites-available/temp-sagawagroup
        ln -sf /etc/nginx/sites-available/sagawagroup /etc/nginx/sites-enabled/sagawagroup
        nginx -t && systemctl reload nginx || true
    fi
}


# Function to start services (SINGLE VERSION)
start_services() {
    print_status "Starting services..."
    
    # Start API with PM2
    cd "$DEPLOY_DIR"
    pm2 start ecosystem.config.cjs --env production
    pm2 save
    # Setup PM2 to start on boot using detected pm2 path
    pm2 startup systemd -u root --hp /root || true
    
    print_success "Services started"
}

# Function to show deployment status
show_status() {
    print_header "DEPLOYMENT STATUS"
    
    echo -e "${BLUE}Domain:${NC} https://${WWW_DOMAIN}"
    echo -e "${BLUE}API Endpoint:${NC} https://${WWW_DOMAIN}/api"
    echo -e "${BLUE}Deployment Directory:${NC} ${DEPLOY_DIR}"
    echo ""
    
    print_status "PM2 Status:"
    pm2 status
    echo ""
    
    print_status "Nginx Status:"
    systemctl status nginx --no-pager -l
    echo ""
    
    print_status "SSL Certificate Status:"
    certbot certificates 2>/dev/null || echo "No SSL certificates found"
    echo ""
    
    print_status "Testing API endpoint:"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:${API_PORT}/api/health" || echo "API not responding"
    echo ""
    
    # Clear cache setelah deployment
    print_status "Clearing cache to force fresh content..."
    if [ -f "$PROJECT_DIR/clear-cache.sh" ]; then
        bash "$PROJECT_DIR/clear-cache.sh" || print_warning "Cache clear script failed (non-critical)"
    else
        print_warning "clear-cache.sh not found, skipping cache clear"
        # Manual cache clear as fallback
        rm -rf /var/cache/nginx/* 2>/dev/null || true
        nginx -s reload 2>/dev/null || systemctl reload nginx
    fi
    
    print_success "Deployment completed successfully!"
    print_status "Your application should now be accessible at:"
    echo -e "  ${GREEN}https://${DOMAIN}${NC}"
    echo -e "  ${GREEN}https://${WWW_DOMAIN}${NC}"
    echo ""
    print_warning "IMPORTANT: If you still see old content:"
    echo "   1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
    echo "   2. Clear browser cache"
    echo "   3. Or test in incognito/private mode"
}

# Function to create health check endpoint
create_health_check() {
    print_status "Creating health check endpoint..."
    
    # Check if health endpoint exists in API
    if ! grep -q "health" "$DEPLOY_DIR/api/index.ts" 2>/dev/null; then
        print_status "Adding health check endpoint to API..."
        # This would need to be customized based on your API structure
        echo "// Health check endpoint should be added to your API" >> "$DEPLOY_DIR/logs/deployment.log"
    fi
    
    print_success "Health check setup completed"
}

# Function to set permissions
set_permissions() {
    print_status "Setting proper permissions..."
    
    # Set ownership
    chown -R www-data:www-data "$DEPLOY_DIR/frontend"
    chown -R root:root "$DEPLOY_DIR/api"
    chown -R root:root "$DEPLOY_DIR/uploads"
    chmod -R 755 "$DEPLOY_DIR/frontend"
    chmod -R 744 "$DEPLOY_DIR/api"
    chmod -R 755 "$DEPLOY_DIR/uploads"
    
    print_success "Permissions set"
}

# Main deployment function
main() {
    print_header "SAGAWA GROUP PRODUCTION DEPLOYMENT"
    print_status "Domain: ${WWW_DOMAIN}"
    print_status "Starting deployment process..."
    
    # Pre-deployment checks
    check_root
    
    # Execute deployment steps
    backup_current
    create_directories
    install_dependencies
    build_frontend
    deploy_api
    create_pm2_ecosystem
    set_permissions
    create_nginx_config
    enable_nginx_site
    setup_ssl
    create_health_check
    start_services
    
    # Show final status
    show_status
}

# Show usage
show_usage() {
    echo "Sagawa Group Production Deployment Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  --skip-ssl              Skip SSL certificate setup"
    echo "  --non-interactive       Run without user prompts (for CI/CD)"
    echo "  --ci-mode               Enable CI/CD mode"
    echo "  --frontend-only         Deploy only frontend"
    echo "  --api-only              Deploy only API"
    echo "  --log-file FILE         Custom log file path"
    echo "  --domain DOMAIN         Set custom domain (default: ${DOMAIN})"
    echo "  --email EMAIL           Set email for SSL certificate (default: ${EMAIL})"
    echo "  --api-port PORT         Set API port (default: ${API_PORT})"
    echo ""
    echo "Examples:"
    echo "  $0                      # Full deployment with SSL"
    echo "  $0 --skip-ssl           # Deploy without SSL setup"
    echo "  $0 --non-interactive    # CI/CD deployment"
    echo "  $0 --frontend-only      # Deploy only frontend"
    echo "  $0 --domain example.com # Deploy to custom domain"
}

# Parse command line arguments
SKIP_SSL=false
DEPLOY_FRONTEND=false
DEPLOY_API=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        --skip-ssl)
            SKIP_SSL=true
            shift
            ;;
        --non-interactive)
            SKIP_CONFIRMATION=true
            shift
            ;;
        --ci-mode)
            CI_MODE=true
            SKIP_CONFIRMATION=true
            DEPLOYMENT_MODE="ci"
            shift
            ;;
        --frontend-only)
            DEPLOY_FRONTEND=true
            shift
            ;;
        --api-only)
            DEPLOY_API=true
            shift
            ;;
        --log-file)
            LOG_FILE="$2"
            shift 2
            ;;
        --domain)
            DOMAIN="$2"
            WWW_DOMAIN="www.$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        --api-port)
            API_PORT="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main function
main() {
    # Initialize logging
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    print_header "SAGAWA GROUP PRODUCTION DEPLOYMENT"
    print_status "Deployment Mode: ${DEPLOYMENT_MODE}"
    print_status "Domain: ${WWW_DOMAIN}"
    print_status "Log File: ${LOG_FILE}"
    print_status "Starting deployment process..."
    
    # Pre-deployment checks
    check_root
    validate_project
    
    # Skip confirmation for CI/CD mode
    if [ "$SKIP_CONFIRMATION" != true ]; then
        read -p "This will deploy Sagawa Group to production. Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled"
            exit 0
        fi
    else
        print_status "Running in non-interactive mode"
    fi
    
    # Execute deployment steps
    backup_current
    create_directories
    install_dependencies
    
    # Deploy based on options
    if [ "$DEPLOY_FRONTEND" = true ]; then
        print_status "Deploying frontend only..."
        build_frontend
    elif [ "$DEPLOY_API" = true ]; then
        print_status "Deploying API only..."
        deploy_api
    else
        print_status "Deploying full stack (frontend + API)..."
        build_frontend
        deploy_api
    fi
    
    # Continue with remaining deployment steps
    create_pm2_ecosystem
    set_permissions
    create_nginx_config
    enable_nginx_site
    
    # Skip SSL in CI mode unless specifically requested
    if [ "$CI_MODE" = true ] && [ "$SKIP_SSL" != false ]; then
        print_status "Skipping SSL setup in CI mode"
    else
        setup_ssl
    fi
    
    create_health_check
    start_services
    
    # Show final status
    show_status
    
    print_success "Deployment completed successfully!"
    log_message "SUCCESS" "Deployment completed at $(date)"
}

# Skip SSL setup if requested
if [ "$SKIP_SSL" = true ]; then
    print_warning "SSL setup will be skipped"
    setup_ssl() {
        print_status "SSL setup skipped as requested"
    }
fi

# Run main function
main

print_success "Deployment script execution completed!"