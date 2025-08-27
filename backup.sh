#!/bin/bash

# Sagawa Group Project Backup Script
# Author: Backup System
# Version: 1.0

set -e  # Exit on any error

# Configuration
PROJECT_NAME="sagawagroup"
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${PROJECT_NAME}_backup_${DATE}"
SOURCE_DIR="/root/sagawagroup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        print_status "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Function to backup database credentials
backup_credentials() {
    local backup_path="$1/credentials"
    mkdir -p "$backup_path"
    
    if [ -f "$SOURCE_DIR/.env" ]; then
        print_status "Backing up environment variables..."
        cp "$SOURCE_DIR/.env" "$backup_path/.env"
        print_success "Environment variables backed up"
    else
        print_warning "No .env file found"
    fi
}

# Function to backup source code
backup_source() {
    local backup_path="$1"
    
    print_status "Backing up source code..."
    
    # Create directories
    mkdir -p "$backup_path/bun-api"
    mkdir -p "$backup_path/vue-frontend"
    
    # Backup bun-api (excluding node_modules and uploads for security)
    print_status "Backing up API source code..."
    rsync -av --exclude='node_modules' --exclude='uploads' "$SOURCE_DIR/bun-api/" "$backup_path/bun-api/"
    
    # Backup vue-frontend (excluding node_modules and dist)
    print_status "Backing up frontend source code..."
    rsync -av --exclude='node_modules' --exclude='dist' "$SOURCE_DIR/vue-frontend/" "$backup_path/vue-frontend/"
    
    # Backup root files
    if [ -f "$SOURCE_DIR/README.md" ]; then
        cp "$SOURCE_DIR/README.md" "$backup_path/"
    fi
    
    if [ -f "$SOURCE_DIR/package-lock.json" ]; then
        cp "$SOURCE_DIR/package-lock.json" "$backup_path/"
    fi
    
    print_success "Source code backup completed"
}

# Function to backup dependencies info

backup_dependencies() {
    local backup_path="$1/dependencies"
    mkdir -p "$backup_path"
    
    print_status "Backing up dependency information..."
    
    # Backup package.json files
    if [ -f "$SOURCE_DIR/bun-api/package.json" ]; then
        cp "$SOURCE_DIR/bun-api/package.json" "$backup_path/bun-api-package.json"
    fi
    
    if [ -f "$SOURCE_DIR/vue-frontend/package.json" ]; then
        cp "$SOURCE_DIR/vue-frontend/package.json" "$backup_path/vue-frontend-package.json"
    fi
    
    # Backup lock files
    if [ -f "$SOURCE_DIR/bun-api/bun.lock" ]; then
        cp "$SOURCE_DIR/bun-api/bun.lock" "$backup_path/bun-api-bun.lock"
    fi
    
    if [ -f "$SOURCE_DIR/vue-frontend/bun.lock" ]; then
        cp "$SOURCE_DIR/vue-frontend/bun.lock" "$backup_path/vue-frontend-bun.lock"
    fi
    
    print_success "Dependencies information backed up"
}

# Function to create system info
create_system_info() {
    local backup_path="$1/system-info"
    mkdir -p "$backup_path"
    
    print_status "Creating system information..."
    
    # System information
    echo "Backup created on: $(date)" > "$backup_path/backup-info.txt"
    echo "System: $(uname -a)" >> "$backup_path/backup-info.txt"
    echo "Node version: $(node --version 2>/dev/null || echo 'Not installed')" >> "$backup_path/backup-info.txt"
    echo "Bun version: $(bun --version 2>/dev/null || echo 'Not installed')" >> "$backup_path/backup-info.txt"
    echo "Git status:" >> "$backup_path/backup-info.txt"
    cd "$SOURCE_DIR" && git status >> "$backup_path/backup-info.txt" 2>/dev/null || echo "Not a git repository" >> "$backup_path/backup-info.txt"
    
    print_success "System information created"
}

# Function to compress backup
compress_backup() {
    local backup_path="$1"
    local compressed_file="${backup_path}.tar.gz"
    
    print_status "Compressing backup..."
    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    
    if [ $? -eq 0 ]; then
        print_success "Backup compressed: ${compressed_file}"
        rm -rf "$backup_path"  # Remove uncompressed backup
        print_status "Uncompressed backup folder removed"
    else
        print_error "Failed to compress backup"
        return 1
    fi
}

# Function to cleanup old backups (keep last 5)
cleanup_old_backups() {
    print_status "Cleaning up old backups..."
    cd "$BACKUP_DIR"
    
    # Count backup files
    backup_count=$(ls -1 ${PROJECT_NAME}_backup_*.tar.gz 2>/dev/null | wc -l)
    
    if [ "$backup_count" -gt 5 ]; then
        print_status "Found $backup_count backups, keeping last 5..."
        ls -1t ${PROJECT_NAME}_backup_*.tar.gz | tail -n +6 | xargs rm -f
        print_success "Old backups cleaned up"
    else
        print_status "Only $backup_count backups found, no cleanup needed"
    fi
}

# Main backup function
main() {
    print_status "Starting backup process for $PROJECT_NAME"
    print_status "Backup name: $BACKUP_NAME"
    
    # Check if source directory exists
    if [ ! -d "$SOURCE_DIR" ]; then
        print_error "Source directory not found: $SOURCE_DIR"
        exit 1
    fi
    
    # Create backup directory
    create_backup_dir
    
    # Create main backup folder
    local backup_path="$BACKUP_DIR/$BACKUP_NAME"
    mkdir -p "$backup_path"
    
    # Perform backup operations
    backup_credentials "$backup_path"
    backup_source "$backup_path"
    backup_dependencies "$backup_path"
    create_system_info "$backup_path"
    
    # Compress backup
    compress_backup "$backup_path"
    
    # Cleanup old backups
    cleanup_old_backups
    
    print_success "Backup completed successfully!"
    print_status "Backup location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
    
    # Show backup size
    local backup_size=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)
    print_status "Backup size: $backup_size"
}

# Show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -d, --dir      Specify backup directory (default: /root/backups)"
    echo ""
    echo "Examples:"
    echo "  $0              # Create backup with default settings"
    echo "  $0 -d /tmp      # Create backup in /tmp directory"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -d|--dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Run main function
main

print_success "Backup script execution completed!"