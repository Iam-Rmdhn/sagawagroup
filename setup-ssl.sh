#!/bin/bash

# SSL Setup Script for Sagawa Group
# Domain: www.sagawagroup.id
# Uses Let's Encrypt with Certbot

set -e  # Exit on any error

# Configuration
DOMAIN="sagawagroup.id"
WWW_DOMAIN="www.sagawagroup.id"
EMAIL="admin@sagawagroup.id"
WEBROOT="/var/www/certbot"

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

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run this script as root (use sudo)"
        exit 1
    fi
}

# Install Certbot if not present
install_certbot() {
    if ! command -v certbot &> /dev/null; then
        print_status "Installing Certbot..."
        apt update
        apt install -y certbot python3-certbot-nginx
        print_success "Certbot installed"
    else
        print_status "Certbot is already installed"
    fi
}

# Create webroot directory
setup_webroot() {
    print_status "Setting up webroot directory..."
    mkdir -p "$WEBROOT"
    chown -R www-data:www-data "$WEBROOT"
    chmod -R 755 "$WEBROOT"
    print_success "Webroot directory created: $WEBROOT"
}

# Create temporary Nginx config for domain verification
create_temp_nginx_config() {
    print_status "Creating temporary Nginx configuration for domain verification..."
    
    cat > "/etc/nginx/sites-available/temp-sagawagroup" << EOF
# Temporary configuration for SSL certificate generation
server {
    listen 80;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    
    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root ${WEBROOT};
        allow all;
    }
    
    # Temporary root for verification
    location / {
        root /var/www/html;
        index index.html index.htm;
    }
}
EOF
    
    # Enable temporary config
    ln -sf /etc/nginx/sites-available/temp-sagawagroup /etc/nginx/sites-enabled/
    
    # Disable default if exists
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    nginx -t && systemctl reload nginx
    print_success "Temporary Nginx configuration created and loaded"
}

# Obtain SSL certificate
obtain_ssl_certificate() {
    print_status "Obtaining SSL certificate for ${DOMAIN} and ${WWW_DOMAIN}..."
    
    # Use webroot plugin for certificate generation
    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --expand \
        -d "$DOMAIN" \
        -d "$WWW_DOMAIN"
    
    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained successfully!"
        
        # Verify certificate
        print_status "Verifying certificate..."
        certbot certificates
        
        # Test certificate
        print_status "Testing certificate..."
        openssl x509 -in "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" -text -noout | grep -E "Subject:|Issuer:|Not After"
        
    else
        print_error "Failed to obtain SSL certificate"
        exit 1
    fi
}

# Setup SSL certificate renewal
setup_auto_renewal() {
    print_status "Setting up automatic SSL certificate renewal..."
    
    # Create renewal hook script
    cat > "/etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh" << 'EOF'
#!/bin/bash
# Reload Nginx after certificate renewal
systemctl reload nginx
echo "$(date): Nginx reloaded after certificate renewal" >> /var/log/letsencrypt/renewal.log
EOF
    
    chmod +x "/etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh"
    
    # Test renewal process
    print_status "Testing certificate renewal..."
    certbot renew --dry-run
    
    if [ $? -eq 0 ]; then
        print_success "Certificate renewal test passed"
        
        # Setup cron job for automatic renewal
        (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
        
        # Setup systemd timer (alternative/backup to cron)
        cat > "/etc/systemd/system/certbot-renewal.service" << 'EOF'
[Unit]
Description=Certbot Renewal
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

        cat > "/etc/systemd/system/certbot-renewal.timer" << 'EOF'
[Unit]
Description=Run certbot twice daily
Requires=certbot-renewal.service

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
EOF
        
        systemctl daemon-reload
        systemctl enable --now certbot-renewal.timer
        
        print_success "Automatic renewal configured with both cron and systemd timer"
    else
        print_error "Certificate renewal test failed"
        exit 1
    fi
}

# Create strong Diffie-Hellman parameters
create_dhparam() {
    if [ ! -f "/etc/letsencrypt/ssl-dhparams.pem" ]; then
        print_status "Generating strong Diffie-Hellman parameters (this may take several minutes)..."
        openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
        print_success "Diffie-Hellman parameters generated"
    else
        print_status "Diffie-Hellman parameters already exist"
    fi
}

# Create enhanced SSL configuration
create_ssl_config() {
    print_status "Creating enhanced SSL configuration..."
    
    cat > "/etc/letsencrypt/options-ssl-nginx.conf" << 'EOF'
# Enhanced SSL configuration for Nginx
# Generated for Sagawa Group production deployment

ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/sagawagroup.id/chain.pem;

# DNS resolvers for OCSP
resolver 8.8.8.8 8.8.4.4 208.67.222.222 208.67.220.220 valid=60s;
resolver_timeout 2s;
EOF
    
    print_success "Enhanced SSL configuration created"
}

# Clean up temporary configuration
cleanup_temp_config() {
    print_status "Cleaning up temporary configuration..."
    rm -f /etc/nginx/sites-enabled/temp-sagawagroup
    rm -f /etc/nginx/sites-available/temp-sagawagroup
    print_success "Temporary configuration cleaned up"
}

# Test SSL configuration
test_ssl_config() {
    print_status "Testing SSL configuration..."
    
    # Test SSL Labs rating (external service - optional)
    print_status "SSL certificate information:"
    echo "Certificate files location: /etc/letsencrypt/live/${DOMAIN}/"
    echo "- fullchain.pem: $(ls -la /etc/letsencrypt/live/${DOMAIN}/fullchain.pem | awk '{print $5}') bytes"
    echo "- privkey.pem: $(ls -la /etc/letsencrypt/live/${DOMAIN}/privkey.pem | awk '{print $5}') bytes"
    
    # Test certificate validity
    print_status "Certificate validity check:"
    openssl x509 -in "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" -noout -dates
    
    # Test certificate chain
    print_status "Certificate chain verification:"
    openssl verify -CAfile "/etc/letsencrypt/live/${DOMAIN}/chain.pem" "/etc/letsencrypt/live/${DOMAIN}/cert.pem"
    
    print_success "SSL configuration tests completed"
}

# Show SSL information
show_ssl_info() {
    print_header "SSL CERTIFICATE INFORMATION"
    
    echo -e "${BLUE}Domain:${NC} ${DOMAIN}, ${WWW_DOMAIN}"
    echo -e "${BLUE}Certificate Path:${NC} /etc/letsencrypt/live/${DOMAIN}/"
    echo -e "${BLUE}Renewal Command:${NC} certbot renew"
    echo ""
    
    print_status "Certificate Details:"
    certbot certificates
    echo ""
    
    print_status "Renewal Status:"
    systemctl status certbot-renewal.timer --no-pager -l || echo "Timer not active"
    echo ""
    
    print_status "Next Steps:"
    echo "1. Update your Nginx configuration to use the SSL certificates"
    echo "2. Test your website: https://${WWW_DOMAIN}"
    echo "3. Test SSL rating: https://www.ssllabs.com/ssltest/"
    echo ""
    
    print_success "SSL setup completed successfully!"
}

# Main function
main() {
    print_header "SSL CERTIFICATE SETUP"
    print_status "Domain: ${DOMAIN}, ${WWW_DOMAIN}"
    print_status "Email: ${EMAIL}"
    
    # Confirm setup
    read -p "Setup SSL certificate for ${WWW_DOMAIN}? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "SSL setup cancelled"
        exit 0
    fi
    
    # Execute setup steps
    check_root
    install_certbot
    setup_webroot
    create_temp_nginx_config
    create_dhparam
    obtain_ssl_certificate
    create_ssl_config
    setup_auto_renewal
    cleanup_temp_config
    test_ssl_config
    show_ssl_info
}

# Show usage
show_usage() {
    echo "SSL Setup Script for Sagawa Group"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -d, --domain DOMAIN     Set domain (default: ${DOMAIN})"
    echo "  -e, --email EMAIL       Set email for certificate (default: ${EMAIL})"
    echo "  --test-cert             Use Let's Encrypt staging server for testing"
    echo ""
    echo "Examples:"
    echo "  $0                      # Setup SSL for default domain"
    echo "  $0 --test-cert          # Test with staging certificates"
    echo "  $0 -d example.com       # Setup for custom domain"
}

# Parse command line arguments
TEST_CERT=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -d|--domain)
            DOMAIN="$2"
            WWW_DOMAIN="www.$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        --test-cert)
            TEST_CERT=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Use staging server for testing
if [ "$TEST_CERT" = true ]; then
    print_warning "Using Let's Encrypt staging server (test certificates)"
    # Modify certbot command to use staging server
    obtain_ssl_certificate() {
        print_status "Obtaining TEST SSL certificate for ${DOMAIN} and ${WWW_DOMAIN}..."
        
        certbot certonly \
            --webroot \
            --webroot-path="$WEBROOT" \
            --email "$EMAIL" \
            --agree-tos \
            --non-interactive \
            --expand \
            --staging \
            -d "$DOMAIN" \
            -d "$WWW_DOMAIN"
        
        if [ $? -eq 0 ]; then
            print_success "TEST SSL certificate obtained successfully!"
            print_warning "This is a staging certificate - not trusted by browsers!"
        else
            print_error "Failed to obtain TEST SSL certificate"
            exit 1
        fi
    }
fi

# Run main function
main

print_success "SSL setup script execution completed!"