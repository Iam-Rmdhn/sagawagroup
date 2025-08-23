#!/bin/bash

# SSL Certificate Renewal Script
# This script should be run by cron to auto-renew certificates

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔄 Starting SSL certificate renewal check...${NC}"

# Change to project directory
cd /var/www/sagawagroup

# Attempt renewal
echo -e "${YELLOW}📋 Checking for certificate renewal...${NC}"
docker-compose -f docker-compose.prod.yml run --rm certbot renew --quiet

# If renewal was successful, reload nginx
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Certificate renewal check completed${NC}"
    
    # Reload nginx to use renewed certificates
    echo -e "${GREEN}🔄 Reloading Nginx configuration...${NC}"
    docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
    
    echo -e "${GREEN}🎉 SSL renewal process completed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  No certificate renewal was needed${NC}"
fi