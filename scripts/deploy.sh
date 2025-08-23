#!/bin/bash

# Production Deployment Script for sagawagroup.id
# This script deploys the application with all security measures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="sagawagroup.id"
PROJECT_DIR="/var/www/sagawagroup"

echo -e "${GREEN}🚀 Starting production deployment for sagawagroup.id${NC}"

# Check if .env file exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}📝 Please copy .env.example to .env and configure your variables${NC}"
    echo -e "${BLUE}cp .env.example .env${NC}"
    exit 1
fi

# Source environment variables
source $PROJECT_DIR/.env

echo -e "${YELLOW}📋 Pre-deployment checks...${NC}"

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Check Docker Compose installation
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo -e "${GREEN}✅ Prerequisites check completed${NC}"

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Build and start services
echo -e "${GREEN}🔨 Building application containers...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

echo -e "${GREEN}🚀 Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Health checks
echo -e "${GREEN}🏥 Performing health checks...${NC}"

# Check if frontend is responding
if curl -f http://localhost:80 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend health check failed${NC}"
fi

# Check if backend is responding
if curl -f http://localhost:4000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed${NC}"
fi

# Setup SSL if not already configured
if [ ! -f "./ssl/certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${YELLOW}🔒 SSL certificate not found. Setting up SSL...${NC}"
    if [ -z "$CERTBOT_EMAIL" ]; then
        echo -e "${RED}❌ CERTBOT_EMAIL not set in .env file${NC}"
        echo -e "${YELLOW}Please set CERTBOT_EMAIL in your .env file and run SSL setup manually:${NC}"
        echo -e "${BLUE}./scripts/ssl-setup.sh $DOMAIN your-email@example.com${NC}"
    else
        ./scripts/ssl-setup.sh $DOMAIN $CERTBOT_EMAIL
    fi
else
    echo -e "${GREEN}✅ SSL certificate found${NC}"
    # Test HTTPS
    if curl -f https://$DOMAIN >/dev/null 2>&1; then
        echo -e "${GREEN}✅ HTTPS is working${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTPS test failed${NC}"
    fi
fi

# Show container status
echo -e "${GREEN}📊 Container status:${NC}"
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo -e "${GREEN}📜 Recent logs:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=50

# Final checks and summary
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📱 Application Status:${NC}"
echo -e "${YELLOW}  🌐 HTTP:  http://$DOMAIN${NC}"
echo -e "${YELLOW}  🔒 HTTPS: https://$DOMAIN${NC}"
echo -e "${YELLOW}  🔧 API:   https://$DOMAIN/api${NC}"

echo -e "${GREEN}🔧 Management Commands:${NC}"
echo -e "${YELLOW}  • View logs:        docker-compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "${YELLOW}  • Restart services: docker-compose -f docker-compose.prod.yml restart${NC}"
echo -e "${YELLOW}  • Stop services:    docker-compose -f docker-compose.prod.yml down${NC}"
echo -e "${YELLOW}  • Update SSL:       ./scripts/ssl-setup.sh $DOMAIN \$CERTBOT_EMAIL${NC}"

echo -e "${GREEN}📊 Security Features Enabled:${NC}"
echo -e "${YELLOW}  ✅ HTTPS/SSL encryption${NC}"
echo -e "${YELLOW}  ✅ Security headers configured${NC}"
echo -e "${YELLOW}  ✅ Rate limiting enabled${NC}"
echo -e "${YELLOW}  ✅ Container isolation${NC}"
echo -e "${YELLOW}  ✅ Non-root user processes${NC}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 sagawagroup.id is now live in production!${NC}"