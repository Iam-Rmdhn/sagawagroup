#!/bin/bash

# Security Hardening Script for sagawagroup.id
# This script implements various security measures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔒 Starting security hardening setup...${NC}"

# Update system packages
echo -e "${GREEN}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install security tools
echo -e "${GREEN}🛠️  Installing security tools...${NC}"
sudo apt install -y ufw fail2ban unattended-upgrades apt-listchanges

# Configure UFW firewall
echo -e "${GREEN}🔥 Configuring UFW firewall...${NC}"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configure automatic security updates
echo -e "${GREEN}🔄 Configuring automatic security updates...${NC}"
sudo cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

# Configure Fail2Ban
echo -e "${GREEN}🚫 Configuring Fail2Ban...${NC}"
sudo cp ./security/fail2ban/jail.local /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# Set up log monitoring
echo -e "${GREEN}📊 Setting up log monitoring...${NC}"
sudo mkdir -p /var/log/sagawagroup
sudo chown -R $USER:$USER /var/log/sagawagroup

# Create security monitoring script
sudo cat > /usr/local/bin/security-check.sh << 'EOF'
#!/bin/bash
# Daily security check script

LOG_FILE="/var/log/sagawagroup/security-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Running security checks..." >> $LOG_FILE

# Check for failed login attempts
FAILED_SSH=$(grep "Failed password" /var/log/auth.log | wc -l)
if [ $FAILED_SSH -gt 10 ]; then
    echo "[$DATE] WARNING: $FAILED_SSH failed SSH attempts detected" >> $LOG_FILE
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check for running containers
CONTAINERS=$(docker ps -q | wc -l)
echo "[$DATE] Running containers: $CONTAINERS" >> $LOG_FILE

# Check SSL certificate expiry
if [ -f /var/www/sagawagroup/ssl/certbot/conf/live/sagawagroup.id/cert.pem ]; then
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /var/www/sagawagroup/ssl/certbot/conf/live/sagawagroup.id/cert.pem | cut -d= -f2)
    CERT_EXPIRY_DATE=$(date -d "$CERT_EXPIRY" +%s)
    CURRENT_DATE=$(date +%s)
    DAYS_LEFT=$(( (CERT_EXPIRY_DATE - CURRENT_DATE) / 86400 ))
    
    if [ $DAYS_LEFT -lt 30 ]; then
        echo "[$DATE] WARNING: SSL certificate expires in $DAYS_LEFT days" >> $LOG_FILE
    fi
fi

echo "[$DATE] Security check completed" >> $LOG_FILE
EOF

sudo chmod +x /usr/local/bin/security-check.sh

# Add cron job for daily security checks
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/security-check.sh") | crontab -

# Set up Docker security
echo -e "${GREEN}🐳 Configuring Docker security...${NC}"
sudo usermod -aG docker $USER

# Create Docker daemon configuration for security
sudo mkdir -p /etc/docker
sudo cat > /etc/docker/daemon.json << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "live-restore": true,
    "userland-proxy": false,
    "no-new-privileges": true
}
EOF

# Restart Docker with new configuration
sudo systemctl restart docker

# Set up file permissions
echo -e "${GREEN}📁 Setting secure file permissions...${NC}"
sudo chmod 600 /var/www/sagawagroup/.env
sudo chmod -R 644 /var/www/sagawagroup/nginx/
sudo chmod -R 644 /var/www/sagawagroup/ssl/
sudo chmod 755 /var/www/sagawagroup/scripts/

# Create backup directory
echo -e "${GREEN}💾 Setting up backup directory...${NC}"
sudo mkdir -p /var/backups/sagawagroup
sudo chown -R $USER:$USER /var/backups/sagawagroup

echo -e "${GREEN}✅ Security hardening setup completed!${NC}"
echo -e "${YELLOW}📋 Security measures implemented:${NC}"
echo -e "${YELLOW}  • UFW firewall configured${NC}"
echo -e "${YELLOW}  • Fail2Ban configured${NC}"
echo -e "${YELLOW}  • Automatic security updates enabled${NC}"
echo -e "${YELLOW}  • Daily security monitoring enabled${NC}"
echo -e "${YELLOW}  • Docker security hardening applied${NC}"
echo -e "${YELLOW}  • File permissions secured${NC}"

echo -e "${GREEN}🔍 To monitor security:${NC}"
echo -e "${YELLOW}  • Check logs: tail -f /var/log/sagawagroup/security-check.log${NC}"
echo -e "${YELLOW}  • Fail2Ban status: sudo fail2ban-client status${NC}"
echo -e "${YELLOW}  • UFW status: sudo ufw status${NC}"