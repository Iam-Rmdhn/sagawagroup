#!/bin/bash

# 💾 Backup Script for Sagawa Group Production
# Comprehensive backup untuk sagawagroup.id

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/var/www/sagawagroup"
BACKUP_DIR="/var/backups/sagawagroup"
DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_NAME="sagawagroup_backup_${DATE}"
RETENTION_DAYS=30

echo -e "${BLUE}💾 Sagawa Group Production Backup${NC}"
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

# Create backup directory
echo -e "${BLUE}📁 Setting up backup directory...${NC}"
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/archives"
mkdir -p "$BACKUP_DIR/temp"

# Create temporary backup directory
TEMP_BACKUP_DIR="$BACKUP_DIR/temp/$BACKUP_NAME"
mkdir -p "$TEMP_BACKUP_DIR"

print_status "Backup directories created"

# Backup Website Files
echo -e "${BLUE}📂 Backing up website files...${NC}"
cp -r "$PROJECT_DIR" "$TEMP_BACKUP_DIR/website"
print_status "Website files backed up"

# Backup Nginx Configuration
echo -e "${BLUE}🌐 Backing up Nginx configuration...${NC}"
mkdir -p "$TEMP_BACKUP_DIR/nginx"
cp -r /etc/nginx/sites-available/sagawagroup "$TEMP_BACKUP_DIR/nginx/" 2>/dev/null || true
cp -r /etc/nginx/sites-enabled/sagawagroup "$TEMP_BACKUP_DIR/nginx/" 2>/dev/null || true
print_status "Nginx configuration backed up"

# Backup SSL Certificates
echo -e "${BLUE}🔐 Backing up SSL certificates...${NC}"
mkdir -p "$TEMP_BACKUP_DIR/ssl"
if [ -d "/etc/letsencrypt/live/sagawagroup.id" ]; then
    cp -r /etc/letsencrypt/live/sagawagroup.id "$TEMP_BACKUP_DIR/ssl/" 2>/dev/null || true
    cp -r /etc/letsencrypt/archive/sagawagroup.id "$TEMP_BACKUP_DIR/ssl/" 2>/dev/null || true
    cp /etc/letsencrypt/renewal/sagawagroup.id.conf "$TEMP_BACKUP_DIR/ssl/" 2>/dev/null || true
    print_status "SSL certificates backed up"
else
    print_warning "SSL certificates not found"
fi

# Backup PM2 Configuration
echo -e "${BLUE}⚙️ Backing up PM2 configuration...${NC}"
mkdir -p "$TEMP_BACKUP_DIR/pm2"
cp "$PROJECT_DIR/ecosystem.config.js" "$TEMP_BACKUP_DIR/pm2/" 2>/dev/null || true
pm2 save --force 2>/dev/null || true
cp ~/.pm2/dump.pm2 "$TEMP_BACKUP_DIR/pm2/" 2>/dev/null || true
print_status "PM2 configuration backed up"

# Backup Environment Variables
echo -e "${BLUE}🔑 Backing up environment configuration...${NC}"
mkdir -p "$TEMP_BACKUP_DIR/config"
cp "$PROJECT_DIR/.env" "$TEMP_BACKUP_DIR/config/env.backup" 2>/dev/null || true
cp "$PROJECT_DIR/.env.example" "$TEMP_BACKUP_DIR/config/" 2>/dev/null || true
print_status "Environment configuration backed up"

# Backup Logs (last 7 days)
echo -e "${BLUE}📊 Backing up recent logs...${NC}"
mkdir -p "$TEMP_BACKUP_DIR/logs"
find /var/log -name "*sagawagroup*" -mtime -7 -exec cp {} "$TEMP_BACKUP_DIR/logs/" \; 2>/dev/null || true
find "$PROJECT_DIR/logs" -name "*.log" -mtime -7 -exec cp {} "$TEMP_BACKUP_DIR/logs/" \; 2>/dev/null || true
pm2 logs --raw --lines 1000 > "$TEMP_BACKUP_DIR/logs/pm2-logs.txt" 2>/dev/null || true
print_status "Recent logs backed up"

# Backup Upload Files
echo -e "${BLUE}📤 Backing up uploaded files...${NC}"
mkdir -p "$TEMP_BACKUP_DIR/uploads"
cp -r "$PROJECT_DIR/bun-api/uploads"/* "$TEMP_BACKUP_DIR/uploads/" 2>/dev/null || true
print_status "Uploaded files backed up"

# Create System Information
echo -e "${BLUE}🖥️ Creating system information...${NC}"
cat > "$TEMP_BACKUP_DIR/system_info.txt" << EOF
Sagawa Group Production Backup Information
==========================================
Backup Date: $(date)
Hostname: $(hostname)
OS Version: $(lsb_release -d | cut -f2)
Kernel: $(uname -r)
Uptime: $(uptime -p)

Backup Contents:
- Website files ($PROJECT_DIR)
- Nginx configuration
- SSL certificates
- PM2 configuration  
- Environment variables
- Recent logs (7 days)
- Uploaded files
- System information

Services Status at Backup Time:
$(systemctl is-active nginx) - Nginx
$(pm2 list 2>/dev/null | grep sagawagroup || echo "PM2 not running")

Disk Usage:
$(df -h /)

Memory Usage:
$(free -h)

Network Configuration:
$(ip addr show | grep -E "inet.*global")
EOF

print_status "System information created"

# Create Archive
echo -e "${BLUE}📦 Creating compressed archive...${NC}"
cd "$BACKUP_DIR/temp"
tar -czf "$BACKUP_DIR/archives/${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
print_status "Archive created: ${BACKUP_NAME}.tar.gz"

# Calculate archive size
ARCHIVE_SIZE=$(du -h "$BACKUP_DIR/archives/${BACKUP_NAME}.tar.gz" | cut -f1)
print_status "Archive size: $ARCHIVE_SIZE"

# Cleanup temporary files
echo -e "${BLUE}🧹 Cleaning up temporary files...${NC}"
rm -rf "$TEMP_BACKUP_DIR"
print_status "Temporary files cleaned"

# Remove old backups
echo -e "${BLUE}🗂️ Cleaning old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR/archives" -name "sagawagroup_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
REMAINING_BACKUPS=$(ls -1 "$BACKUP_DIR/archives"/sagawagroup_backup_*.tar.gz 2>/dev/null | wc -l)
print_status "Old backups cleaned, $REMAINING_BACKUPS backups remaining"

# Create backup info file
cat > "$BACKUP_DIR/latest_backup_info.txt" << EOF
Sagawa Group - Latest Backup Information
========================================
Backup File: ${BACKUP_NAME}.tar.gz
Created: $(date)
Size: $ARCHIVE_SIZE
Location: $BACKUP_DIR/archives/${BACKUP_NAME}.tar.gz

Restoration Instructions:
1. Stop all services:
   sudo ./scripts/stop-services.sh

2. Extract backup:
   cd /var/backups/sagawagroup/archives
   tar -xzf ${BACKUP_NAME}.tar.gz

3. Restore files:
   cp -r ${BACKUP_NAME}/website/* /var/www/
   cp ${BACKUP_NAME}/nginx/* /etc/nginx/sites-available/
   cp ${BACKUP_NAME}/pm2/ecosystem.config.js /var/www/sagawagroup/

4. Restore SSL certificates:
   cp -r ${BACKUP_NAME}/ssl/* /etc/letsencrypt/live/
   
5. Start services:
   sudo ./scripts/start-services.sh

Contact: admin@sagawagroup.id for restoration support
EOF

print_status "Backup information file created"

# Log backup completion
echo "$(date): Backup completed successfully - ${BACKUP_NAME}.tar.gz ($ARCHIVE_SIZE)" >> "$BACKUP_DIR/backup_history.log"

echo ""
echo -e "${GREEN}🎉 Backup Completed Successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Backup Details:${NC}"
echo "   File: ${BACKUP_NAME}.tar.gz"
echo "   Size: $ARCHIVE_SIZE"
echo "   Location: $BACKUP_DIR/archives/"
echo "   Retention: $RETENTION_DAYS days"
echo ""
echo -e "${BLUE}📊 Backup Statistics:${NC}"
echo "   Total Backups: $REMAINING_BACKUPS"
echo "   Disk Usage: $(du -sh $BACKUP_DIR | cut -f1)"
echo ""
echo -e "${GREEN}🍜 Sagawa Group Data Secured! 🍜${NC}"
echo ""
echo -e "${YELLOW}For restoration instructions, see: $BACKUP_DIR/latest_backup_info.txt${NC}"