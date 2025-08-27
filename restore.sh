#!/bin/bash

# Sagawa Group Project Restore Script
# Author: Backup System
# Version: 1.0

set -e  # Exit on any error

# Configuration
PROJECT_NAME="sagawagroup"
BACKUP_DIR="/root/backups"
RESTORE_DIR="/root/sagawagroup-restored"
DEFAULT_SOURCE_DIR="/root/sagawagroup"

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

# Function to list available backups
list_backups() {
    print_status "Available backups in $BACKUP_DIR:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi
    
    local backups=($(ls -1t "$BACKUP_DIR"/${PROJECT_NAME}_backup_*.tar.gz 2>/dev/null))
    
    if [ ${#backups[@]} -eq 0 ]; then
        print_error "No backups found in $BACKUP_DIR"
        exit 1
    fi
    
    local i=1
    for backup in "${backups[@]}"; do
        local backup_name=$(basename "$backup")
        local backup_size=$(du -h "$backup" | cut -f1)
        local backup_date=$(stat -c %y "$backup" | cut -d' ' -f1,2)
        printf "  %d) %s (%s) - %s\n" "$i" "$backup_name" "$backup_size" "$backup_date"
        ((i++))
    done
    echo ""
}

# Function to select backup
select_backup() {
    local backups=($(ls -1t "$BACKUP_DIR"/${PROJECT_NAME}_backup_*.tar.gz 2>/dev/null))
    
    if [ "$AUTO_SELECT" = "latest" ]; then
        SELECTED_BACKUP="${backups[0]}"
        print_status "Auto-selected latest backup: $(basename "$SELECTED_BACKUP")"
        return
    fi
    
    list_backups
    
    while true; do
        read -p "Select backup number (1-${#backups[@]}): " selection
        
        if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le ${#backups[@]} ]; then
            SELECTED_BACKUP="${backups[$((selection-1))]}"
            break
        else
            print_error "Invalid selection. Please enter a number between 1 and ${#backups[@]}"
        fi
    done
    
    print_success "Selected backup: $(basename "$SELECTED_BACKUP")"
}

# Function to extract backup
extract_backup() {
    local backup_file="$1"
    local extract_dir="$2"
    
    print_status "Extracting backup..."
    
    # Create temporary extraction directory
    local temp_dir=$(mktemp -d)
    
    # Extract backup
    cd "$temp_dir"
    tar -xzf "$backup_file"
    
    # Find the extracted folder
    local extracted_folder=$(find "$temp_dir" -maxdepth 1 -type d -name "${PROJECT_NAME}_backup_*" | head -1)
    
    if [ -z "$extracted_folder" ]; then
        print_error "Could not find extracted backup folder"
        rm -rf "$temp_dir"
        exit 1
    fi
    
    # Move to target directory
    if [ -d "$extract_dir" ]; then
        if [ "$FORCE_RESTORE" = "true" ]; then
            print_warning "Removing existing directory: $extract_dir"
            rm -rf "$extract_dir"
        else
            print_error "Target directory already exists: $extract_dir"
            print_error "Use --force to overwrite or choose a different directory"
            rm -rf "$temp_dir"
            exit 1
        fi
    fi
    
    mv "$extracted_folder" "$extract_dir"
    rm -rf "$temp_dir"
    
    print_success "Backup extracted to: $extract_dir"
}

# Function to restore source code
restore_source() {
    local backup_path="$1"
    local target_path="$2"
    
    print_status "Restoring source code..."
    
    # Create target directory
    mkdir -p "$target_path"
    
    # Restore bun-api
    if [ -d "$backup_path/bun-api" ]; then
        print_status "Restoring API source code..."
        cp -r "$backup_path/bun-api" "$target_path/"
        print_success "API source code restored"
    fi
    
    # Restore vue-frontend
    if [ -d "$backup_path/vue-frontend" ]; then
        print_status "Restoring frontend source code..."
        cp -r "$backup_path/vue-frontend" "$target_path/"
        print_success "Frontend source code restored"
    fi
    
    # Restore root files
    if [ -f "$backup_path/README.md" ]; then
        cp "$backup_path/README.md" "$target_path/"
    fi
    
    if [ -f "$backup_path/package-lock.json" ]; then
        cp "$backup_path/package-lock.json" "$target_path/"
    fi
    
    print_success "Source code restoration completed"
}

# Function to restore credentials
restore_credentials() {
    local backup_path="$1"
    local target_path="$2"
    
    if [ -f "$backup_path/credentials/.env" ]; then
        print_status "Restoring environment variables..."
        cp "$backup_path/credentials/.env" "$target_path/"
        print_success "Environment variables restored"
        print_warning "Please review and update credentials if necessary"
    else
        print_warning "No credentials found in backup"
    fi
}

# Function to install dependencies
install_dependencies() {
    local target_path="$1"
    
    if [ "$SKIP_DEPS" = "true" ]; then
        print_status "Skipping dependency installation"
        return
    fi
    
    print_status "Installing dependencies..."
    
    # Install bun-api dependencies
    if [ -f "$target_path/bun-api/package.json" ]; then
        print_status "Installing API dependencies..."
        cd "$target_path/bun-api"
        if command -v bun &> /dev/null; then
            bun install
        elif command -v npm &> /dev/null; then
            npm install
        else
            print_warning "Neither bun nor npm found. Please install dependencies manually."
        fi
    fi
    
    # Install vue-frontend dependencies
    if [ -f "$target_path/vue-frontend/package.json" ]; then
        print_status "Installing frontend dependencies..."
        cd "$target_path/vue-frontend"
        if command -v bun &> /dev/null; then
            bun install
        elif command -v npm &> /dev/null; then
            npm install
        else
            print_warning "Neither bun nor npm found. Please install dependencies manually."
        fi
    fi
    
    print_success "Dependencies installation completed"
}

# Function to show system info
show_system_info() {
    local backup_path="$1"
    
    if [ -f "$backup_path/system-info/backup-info.txt" ]; then
        print_status "Backup system information:"
        echo ""
        cat "$backup_path/system-info/backup-info.txt"
        echo ""
    fi
}

# Function to create restoration report
create_restoration_report() {
    local target_path="$1"
    local backup_file="$2"
    
    local report_file="$target_path/RESTORATION_REPORT.txt"
    
    print_status "Creating restoration report..."
    
    cat > "$report_file" << EOF
SAGAWA GROUP PROJECT RESTORATION REPORT
=======================================

Restoration Date: $(date)
Backup Source: $(basename "$backup_file")
Backup Size: $(du -h "$backup_file" | cut -f1)
Restoration Target: $target_path

System Information:
- System: $(uname -a)
- Node Version: $(node --version 2>/dev/null || echo 'Not installed')
- Bun Version: $(bun --version 2>/dev/null || echo 'Not installed')

Restoration Status:
- Source Code: Restored
- Credentials: $([ -f "$target_path/.env" ] && echo "Restored" || echo "Not found in backup")
- Dependencies: $([ "$SKIP_DEPS" = "true" ] && echo "Skipped" || echo "Installed")

Next Steps:
1. Review and update environment variables in .env file
2. Install dependencies if they were skipped
3. Start the development servers
4. Test the application functionality

Commands to start the application:
- API: cd bun-api && bun run dev
- Frontend: cd vue-frontend && bun run dev

EOF
    
    print_success "Restoration report created: $report_file"
}

# Main restore function
main() {
    print_status "Starting restore process for $PROJECT_NAME"
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi
    
    # Select backup to restore
    select_backup
    
    # Set target directory
    local target_dir="$RESTORE_DIR"
    if [ -n "$CUSTOM_TARGET" ]; then
        target_dir="$CUSTOM_TARGET"
    fi
    
    print_status "Target directory: $target_dir"
    
    # Extract backup
    extract_backup "$SELECTED_BACKUP" "$target_dir"
    
    # Show system info from backup
    show_system_info "$target_dir"
    
    # Create final target directory for restored project
    local project_target="$target_dir-project"
    if [ -n "$CUSTOM_TARGET" ]; then
        project_target="$CUSTOM_TARGET"
    fi
    
    # Restore components
    restore_source "$target_dir" "$project_target"
    restore_credentials "$target_dir" "$project_target"
    
    # Install dependencies
    install_dependencies "$project_target"
    
    # Create restoration report
    create_restoration_report "$project_target" "$SELECTED_BACKUP"
    
    # Cleanup extraction directory if it's different from project target
    if [ "$target_dir" != "$project_target" ]; then
        rm -rf "$target_dir"
    fi
    
    print_success "Restoration completed successfully!"
    print_status "Restored project location: $project_target"
    print_status "Please review the restoration report for next steps"
}

# Show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -l, --list              List available backups and exit"
    echo "  -b, --backup-dir DIR    Specify backup directory (default: /root/backups)"
    echo "  -t, --target DIR        Specify target directory for restoration"
    echo "  -f, --force             Force overwrite existing target directory"
    echo "  -s, --skip-deps         Skip dependency installation"
    echo "  --latest                Auto-select latest backup"
    echo ""
    echo "Examples:"
    echo "  $0                      # Interactive restore with default settings"
    echo "  $0 -l                   # List available backups"
    echo "  $0 --latest -t /tmp/restore  # Restore latest backup to /tmp/restore"
    echo "  $0 -f --skip-deps       # Force restore and skip dependencies"
}

# Initialize variables
FORCE_RESTORE="false"
SKIP_DEPS="false"
AUTO_SELECT=""
CUSTOM_TARGET=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -l|--list)
            list_backups
            exit 0
            ;;
        -b|--backup-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -t|--target)
            CUSTOM_TARGET="$2"
            shift 2
            ;;
        -f|--force)
            FORCE_RESTORE="true"
            shift
            ;;
        -s|--skip-deps)
            SKIP_DEPS="true"
            shift
            ;;
        --latest)
            AUTO_SELECT="latest"
            shift
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

print_success "Restore script execution completed!"