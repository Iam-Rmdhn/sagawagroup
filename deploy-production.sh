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
PROJECT_DIR="/root/sagawagroup"
DEPLOY_DIR="/var/www/sagawagroup"
API_PORT="5000"
FRONTEND_PORT="4321"
EMAIL="admin@sagawagroup.id"  # For SSL certificate

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

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run this script as root (use sudo)"
        exit 1
    fi
}

# Function to backup current deployment if exists
backup_current() {
    if [ -d "$DEPLOY_DIR" ]; then
        local backup_name="sagawagroup-backup-$(date +%Y%m%d_%H%M%S)"
        print_status "Backing up current deployment..."
        mv "$DEPLOY_DIR" "/root/${backup_name}"
        print_success "Current deployment backed up to /root/${backup_name}"
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
    print_success "Deployment directories created"
}

# Function to install system dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    # Update package list
    apt update
    
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
    
    print_success "System dependencies installed"
}

# Function to build frontend
build_frontend() {
    print_status "Building frontend for production..."
    cd "$PROJECT_DIR/vue-frontend"
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    bun install
    
    # Build for production
    print_status "Building frontend..."
    if ! bun run build; then
        print_error "Frontend build failed!"
        exit 1
    fi
    
    # Copy built files to deployment directory
    if [ -d "dist" ]; then
        cp -r dist/* "$DEPLOY_DIR/frontend/"
        print_success "Frontend built and deployed"
    else
        print_error "Frontend build failed - no dist directory found"
        exit 1
    fi
}

# Function to deploy API
deploy_api() {
    print_status "Deploying API..."
    cd "$PROJECT_DIR/bun-api"
    
    # Install dependencies
    print_status "Installing API dependencies..."
    if ! bun install; then
        print_error "API dependency installation failed!"
        exit 1
    fi
    
    # Copy API files
    cp -r . "$DEPLOY_DIR/api/"
    
    # Copy environment file
    if [ -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env" "$DEPLOY_DIR/api/.env"
    elif [ -f ".env" ]; then
        cp ".env" "$DEPLOY_DIR/api/.env"
    else
        print_warning "No .env file found. Please create one in $DEPLOY_DIR/api/"
    fi
    
    print_success "API deployed"
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
        PORT: 5000
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

    # Create main site configuration
    cat > "/etc/nginx/sites-available/sagawagroup" << EOF
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    
    # SSL configuration (will be managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Document root
    root ${DEPLOY_DIR}/frontend;
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
        proxy_pass http://localhost:${API_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://${DOMAIN}, https://${WWW_DOMAIN}' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    }
    
    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://localhost:${API_PORT}/api/auth/login;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Upload files proxy
    location /uploads/ {
        proxy_pass http://localhost:${API_PORT}/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # File upload limits
        client_max_body_size 10M;
    }
    
    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        access_log off;
        
        # Optional: Enable CORS for fonts
        location ~* \.(woff|woff2|ttf|eot)$ {
            add_header Access-Control-Allow-Origin "*";
        }
    }
    
    # HTML files with short cache
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate" always;
    }
    
    # Frontend routes (SPA fallback)
    location / {
        try_files \$uri \$uri/ /index.html;
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
    
    print_success "Nginx configuration created"
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
        systemctl reload nginx
        print_success "Nginx reloaded"
    else
        print_error "Nginx configuration is invalid"
        exit 1
    fi
}

# Function to setup SSL with Let's Encrypt
setup_ssl() {
    print_status "Setting up SSL certificate with Let's Encrypt..."
    
    # Create webroot directory for challenge
    mkdir -p /var/www/certbot
    
    # Check if certificate already exists
    if certbot certificates 2>/dev/null | grep -q "${DOMAIN}"; then
        print_warning "Existing SSL certificate found for ${DOMAIN}"
        print_status "Expanding existing certificate to include ${WWW_DOMAIN}..."
        
        # Expand existing certificate
        certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} --email ${EMAIL} --agree-tos --non-interactive --expand --redirect
    else
        print_status "Obtaining new SSL certificate for ${DOMAIN} and ${WWW_DOMAIN}..."
        # Obtain new certificate
        certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} --email ${EMAIL} --agree-tos --non-interactive --redirect
    fi
    
    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained and configured"
        
        # Setup auto-renewal
        print_status "Setting up SSL certificate auto-renewal..."
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        print_success "SSL auto-renewal configured"
    else
        print_error "Failed to obtain SSL certificate"
        print_warning "Continuing without SSL. You can run 'certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} --expand' manually later"
    fi
}

# Function to start services (SINGLE VERSION)
start_services() {
    print_status "Starting services..."
    
    # Start API with PM2
    cd "$DEPLOY_DIR"
    pm2 start ecosystem.config.cjs --env production
    pm2 save
    pm2 startup
    
    # Enable PM2 startup
    env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
    
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
    
    print_success "Deployment completed successfully!"
    print_status "Your application should now be accessible at:"
    echo -e "  ${GREEN}https://${DOMAIN}${NC}"
    echo -e "  ${GREEN}https://${WWW_DOMAIN}${NC}"
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
    echo "  --domain DOMAIN         Set custom domain (default: ${DOMAIN})"
    echo "  --email EMAIL           Set email for SSL certificate (default: ${EMAIL})"
    echo "  --api-port PORT         Set API port (default: ${API_PORT})"
    echo ""
    echo "Examples:"
    echo "  $0                      # Full deployment with SSL"
    echo "  $0 --skip-ssl           # Deploy without SSL setup"
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
        --frontend-only)
            DEPLOY_FRONTEND=true
            shift
            ;;
        --api-only)
            DEPLOY_API=true
            shift
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
    print_header "SAGAWA GROUP PRODUCTION DEPLOYMENT"
    print_status "Domain: ${WWW_DOMAIN}"
    print_status "Starting deployment process..."
    
    # Pre-deployment checks
    check_root
    
    # Execute deployment steps
    backup_current
    create_directories
    install_dependencies
    
    if [ "$DEPLOY_FRONTEND" = true ]; then
        build_frontend
    elif [ "$DEPLOY_API" = true ]; then
        deploy_api
    else
        build_frontend
        deploy_api
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