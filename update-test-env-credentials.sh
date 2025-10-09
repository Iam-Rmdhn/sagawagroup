#!/bin/bash

# Script to update test environment credentials
# This script helps you update the database credentials in .env.test

set -e

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

ENV_FILE="bun-api/.env.test"

print_header "Update Test Environment Credentials"
echo ""

# Check if .env.test exists
if [ ! -f "$ENV_FILE" ]; then
    print_error "File $ENV_FILE not found!"
    exit 1
fi

print_info "Current configuration in $ENV_FILE:"
echo ""
grep -E "^(ASTRA_DB_APPLICATION_TOKEN|ASTRA_DB_API_ENDPOINT|PORT|BASE_URL)=" "$ENV_FILE" || true
echo ""

print_warning "The database credentials are currently set to placeholder values."
print_info "You need to update them with actual production credentials."
echo ""

# Ask if user wants to update
read -p "Do you want to update the database credentials now? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Skipping credential update."
    print_warning "Remember to update the credentials before deployment!"
    exit 0
fi

# Get ASTRA_DB_APPLICATION_TOKEN
echo ""
print_info "Enter your AstraDB Application Token:"
print_info "(This should start with 'AstraCS:' and be a long string)"
read -p "Token: " ASTRA_TOKEN

if [ -z "$ASTRA_TOKEN" ]; then
    print_error "Token cannot be empty!"
    exit 1
fi

# Get ASTRA_DB_API_ENDPOINT
echo ""
print_info "Enter your AstraDB API Endpoint:"
print_info "(This should be a URL like: https://xxxxx.apps.astra.datastax.com)"
read -p "Endpoint: " ASTRA_ENDPOINT

if [ -z "$ASTRA_ENDPOINT" ]; then
    print_error "Endpoint cannot be empty!"
    exit 1
fi

# Backup the original file
cp "$ENV_FILE" "$ENV_FILE.backup"
print_success "Backup created: $ENV_FILE.backup"

# Update the credentials
sed -i "s|^ASTRA_DB_APPLICATION_TOKEN=.*|ASTRA_DB_APPLICATION_TOKEN=$ASTRA_TOKEN|" "$ENV_FILE"
sed -i "s|^ASTRA_DB_API_ENDPOINT=.*|ASTRA_DB_API_ENDPOINT=$ASTRA_ENDPOINT|" "$ENV_FILE"

print_success "Credentials updated successfully!"
echo ""

print_info "Updated configuration:"
grep -E "^(ASTRA_DB_APPLICATION_TOKEN|ASTRA_DB_API_ENDPOINT)=" "$ENV_FILE" || true
echo ""

print_success "Test environment is now ready for deployment!"
print_info "Next steps:"
echo "  1. Review the updated .env.test file"
echo "  2. Run: sudo ./deploy-test.sh"
echo "  3. Run: sudo ./setup-ssl-test.sh"
echo ""
print_warning "Security reminder: Never commit .env.test with real credentials to git!"

