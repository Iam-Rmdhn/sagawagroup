#!/bin/bash

# Sagawa Group Production Build Script
# Builds both frontend and API for production deployment

set -e  # Exit on any error

# Configuration
PROJECT_DIR="/root/sagawagroup"
BUILD_DIR="/tmp/sagawagroup-build"
DEPLOY_DIR="/var/www/sagawagroup"

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

# Clean previous build
clean_build() {
    print_status "Cleaning previous build..."
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    mkdir -p "$BUILD_DIR/frontend"
    mkdir -p "$BUILD_DIR/api"
    print_success "Build directory cleaned"
}

# Build frontend
build_frontend() {
    print_status "Building frontend for production..."
    cd "$PROJECT_DIR/vue-frontend"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "Frontend package.json not found"
        exit 1
    fi
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    if command -v bun &> /dev/null; then
        bun install
    else
        npm ci --only=production
    fi
    
    # Build for production
    print_status "Building frontend..."
    if command -v bun &> /dev/null; then
        bun run build
    else
        npm run build
    fi
    
    # Check if build was successful
    if [ -d "dist" ]; then
        cp -r dist/* "$BUILD_DIR/frontend/"
        print_success "Frontend built successfully"
        
        # Show build stats
        print_status "Frontend build statistics:"
        du -sh "$BUILD_DIR/frontend"
        find "$BUILD_DIR/frontend" -name "*.js" -o -name "*.css" -o -name "*.html" | wc -l | xargs echo "Total files:"
    else
        print_error "Frontend build failed - no dist directory found"
        exit 1
    fi
}

# Prepare API
prepare_api() {
    print_status "Preparing API for production..."
    cd "$PROJECT_DIR/bun-api"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "API package.json not found"
        exit 1
    fi
    
    # Copy API files
    print_status "Copying API files..."
    cp -r . "$BUILD_DIR/api/"
    
    # Remove development files from API build
    cd "$BUILD_DIR/api"
    rm -rf node_modules
    rm -rf .git
    rm -rf test*
    rm -rf uploads  # Will be created during deployment
    
    # Install production dependencies
    print_status "Installing API production dependencies..."
    if command -v bun &> /dev/null; then
        bun install --production
    else
        npm ci --only=production
    fi
    
    print_success "API prepared for production"
}

# Create production environment file
create_production_env() {
    print_status "Creating production environment file..."
    
    if [ -f "$PROJECT_DIR/.env" ]; then
        # Copy base environment file
        cp "$PROJECT_DIR/.env" "$BUILD_DIR/api/.env.production"
        
        # Update environment for production
        sed -i 's/NODE_ENV=development/NODE_ENV=production/g' "$BUILD_DIR/api/.env.production"
        sed -i 's/PORT=.*/PORT=5000/g' "$BUILD_DIR/api/.env.production"
        sed -i 's|BASE_URL=http://localhost:5000|BASE_URL=https://www.sagawagroup.id|g' "$BUILD_DIR/api/.env.production"
        
        print_success "Production environment file created"
        print_warning "Please review and update the production environment variables"
    else
        print_warning "No base .env file found. Creating template..."
        cat > "$BUILD_DIR/api/.env.production" << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=5000
BASE_URL=https://www.sagawagroup.id

# Database Configuration
ASTRA_DB_APPLICATION_TOKEN=AstraCS:GcAHBNyZJEGUYJkYkEiJRXbr:c5a57f749b2bd125acb835fa98b1bcf8af879b8dad1876778696b5a2788d4407
ASTRA_DB_API_ENDPOINT=https://a1971aa5-5930-4854-82ef-747bd405cc0a-us-east-2.apps.astra.datastax.com


# Security Configuration
JWT_SECRET=$JWT_SECRET

# Email Configuration
EMAIL_USER=admin@sagawagroup.id
EMAIL_PASS=your_email_password
EOF
        print_warning "Template .env file created. Please update with actual production values!"
    fi
}

# Create PM2 ecosystem file
create_pm2_config() {
    print_status "Creating PM2 ecosystem configuration..."
    
    cat > "$BUILD_DIR/ecosystem.config.js" << 'EOF'
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
      restart_delay: 5000,
      
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
    
    print_success "PM2 ecosystem configuration created"
}

# Create deployment structure
create_deployment_structure() {
    print_status "Creating deployment structure..."
    
    # Create necessary directories
    mkdir -p "$BUILD_DIR/logs"
    mkdir -p "$BUILD_DIR/uploads"
    mkdir -p "$BUILD_DIR/nginx"
    
    # Copy nginx configuration
    if [ -f "$PROJECT_DIR/nginx-sagawagroup.conf" ]; then
        cp "$PROJECT_DIR/nginx-sagawagroup.conf" "$BUILD_DIR/nginx/"
    fi
    
    # Create deployment info
    cat > "$BUILD_DIR/deployment-info.txt" << EOF
Sagawa Group Production Build
============================

Build Date: $(date)
Build Directory: $BUILD_DIR
Target Directory: $DEPLOY_DIR

Components:
- Frontend: Built and ready
- API: Production dependencies installed
- PM2 Config: Created
- Nginx Config: $([ -f "$BUILD_DIR/nginx/nginx-sagawagroup.conf" ] && echo "Included" || echo "Not found")
- Environment: Template created (needs configuration)

Next Steps:
1. Review and update .env.production file
2. Run deployment script: ./deploy-production.sh
3. Test the application
4. Setup SSL certificate
EOF
    
    print_success "Deployment structure created"
}

# Validate build
validate_build() {
    print_status "Validating build..."
    
    local errors=0
    
    # Check frontend build
    if [ ! -d "$BUILD_DIR/frontend" ] || [ -z "$(ls -A "$BUILD_DIR/frontend")" ]; then
        print_error "Frontend build is empty or missing"
        errors=$((errors + 1))
    else
        print_success "Frontend build validation passed"
    fi
    
    # Check API build
    if [ ! -f "$BUILD_DIR/api/index.ts" ]; then
        print_error "API main file (index.ts) is missing"
        errors=$((errors + 1))
    else
        print_success "API build validation passed"
    fi
    
    # Check dependencies
    if [ ! -d "$BUILD_DIR/api/node_modules" ]; then
        print_error "API dependencies are missing"
        errors=$((errors + 1))
    else
        print_success "API dependencies validation passed"
    fi
    
    # Check PM2 config
    if [ ! -f "$BUILD_DIR/ecosystem.config.js" ]; then
        print_error "PM2 ecosystem config is missing"
        errors=$((errors + 1))
    else
        print_success "PM2 config validation passed"
    fi
    
    if [ $errors -eq 0 ]; then
        print_success "Build validation completed successfully"
        return 0
    else
        print_error "Build validation failed with $errors errors"
        return 1
    fi
}

# Show build summary
show_build_summary() {
    print_header "BUILD SUMMARY"
    
    echo -e "${BLUE}Build Directory:${NC} $BUILD_DIR"
    echo -e "${BLUE}Total Size:${NC} $(du -sh "$BUILD_DIR" | cut -f1)"
    echo ""
    
    print_status "Frontend:"
    echo "  Size: $(du -sh "$BUILD_DIR/frontend" | cut -f1)"
    echo "  Files: $(find "$BUILD_DIR/frontend" -type f | wc -l)"
    echo ""
    
    print_status "API:"
    echo "  Size: $(du -sh "$BUILD_DIR/api" | cut -f1)"
    echo "  Dependencies: $([ -d "$BUILD_DIR/api/node_modules" ] && echo "Installed" || echo "Missing")"
    echo ""
    
    print_status "Configuration:"
    echo "  PM2 Config: $([ -f "$BUILD_DIR/ecosystem.config.js" ] && echo "✓" || echo "✗")"
    echo "  Environment: $([ -f "$BUILD_DIR/api/.env.production" ] && echo "✓" || echo "✗")"
    echo "  Nginx Config: $([ -f "$BUILD_DIR/nginx/nginx-sagawagroup.conf" ] && echo "✓" || echo "✗")"
    echo ""
    
    print_success "Build completed successfully!"
    print_status "Next step: Run './deploy-production.sh' to deploy to production"
}

# Main function
main() {
    print_header "PRODUCTION BUILD"
    print_status "Building Sagawa Group for production deployment..."
    
    # Change to project directory
    cd "$PROJECT_DIR"
    
    # Execute build steps
    clean_build
    build_frontend
    prepare_api
    create_production_env
    create_pm2_config
    create_deployment_structure
    
    # Validate and summarize
    if validate_build; then
        show_build_summary
    else
        print_error "Build failed validation"
        exit 1
    fi
}

# Show usage
show_usage() {
    echo "Sagawa Group Production Build Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -c, --clean-only        Only clean build directory"
    echo "  -f, --frontend-only     Build frontend only"
    echo "  -a, --api-only          Prepare API only"
    echo ""
    echo "Examples:"
    echo "  $0                      # Full production build"
    echo "  $0 --frontend-only      # Build only frontend"
    echo "  $0 --clean-only         # Clean build directory"
}

# Parse command line arguments
CLEAN_ONLY=false
FRONTEND_ONLY=false
API_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -c|--clean-only)
            CLEAN_ONLY=true
            shift
            ;;
        -f|--frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        -a|--api-only)
            API_ONLY=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Handle specific build options
if [ "$CLEAN_ONLY" = true ]; then
    clean_build
    print_success "Build directory cleaned"
    exit 0
elif [ "$FRONTEND_ONLY" = true ]; then
    clean_build
    build_frontend
    print_success "Frontend build completed"
    exit 0
elif [ "$API_ONLY" = true ]; then
    clean_build
    prepare_api
    create_production_env
    print_success "API preparation completed"
    exit 0
fi

# Run main function
main

print_success "Production build script execution completed!"