#!/bin/bash

# Clear Cache Script for Sagawa Group
# This script clears nginx cache and forces browsers to fetch fresh content

set -e

echo "🧹 Clearing Sagawa Group Cache..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Clear Nginx Cache
print_status "Clearing Nginx cache..."
if [ -d "/var/cache/nginx" ]; then
    sudo rm -rf /var/cache/nginx/*
    print_status "Nginx cache cleared"
else
    print_warning "Nginx cache directory not found (might be using default location)"
fi

# 2. Clear FastCGI cache if exists
if [ -d "/var/cache/nginx/fastcgi" ]; then
    sudo rm -rf /var/cache/nginx/fastcgi/*
    print_status "FastCGI cache cleared"
fi

# 3. Clear proxy cache if exists
if [ -d "/var/cache/nginx/proxy" ]; then
    sudo rm -rf /var/cache/nginx/proxy/*
    print_status "Proxy cache cleared"
fi

# 4. Test Nginx configuration
print_status "Testing Nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors!"
    sudo nginx -t
    exit 1
fi

# 5. Reload Nginx
print_status "Reloading Nginx..."
sudo systemctl reload nginx
print_status "Nginx reloaded successfully"

# 6. Add timestamp to a cache-buster file
CACHE_BUSTER_FILE="/var/www/sagawagroup/frontend/cache-version.txt"
TIMESTAMP=$(date +%s)
echo "$TIMESTAMP" | sudo tee "$CACHE_BUSTER_FILE" > /dev/null
print_status "Cache version updated: $TIMESTAMP"

# 7. Clear PM2 logs (optional)
if command -v pm2 &> /dev/null; then
    print_status "Clearing PM2 logs..."
    pm2 flush sagawagroup-api 2>/dev/null || true
    print_status "PM2 logs cleared"
fi

# 8. Display cache headers test
echo ""
echo "=================================="
echo "Testing cache headers..."
echo "=================================="

# Test HTML caching
echo -e "\n${YELLOW}HTML Cache Headers:${NC}"
curl -s -I https://www.sagawagroup.id/ | grep -i "cache-control\|pragma\|expires" || echo "No cache headers found"

# Test JS/CSS caching
echo -e "\n${YELLOW}Static Asset Cache Headers:${NC}"
curl -s -I https://www.sagawagroup.id/assets/index.js 2>/dev/null | grep -i "cache-control" || echo "Asset not found or no cache headers"

echo ""
echo "=================================="
print_status "Cache clearing completed!"
echo "=================================="
echo ""
echo "📝 NEXT STEPS:"
echo "1. Visit https://www.sagawagroup.id in browser"
echo "2. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
echo "3. Or clear browser cache manually"
echo ""
echo "💡 TIP: Test in incognito/private mode to verify changes"
echo ""
