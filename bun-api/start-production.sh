#!/bin/bash

# Sagawa Group API Production Starter
# Runs Bun API server in production mode

# Set working directory
cd /var/www/sagawagroup/api || {
    echo "Error: API directory not found"
    exit 1
}

# Ensure bun is in PATH
export PATH="/root/.bun/bin:$PATH"

# Set production environment
export NODE_ENV="production"
export PORT="5000"

# Start the API server with Bun
exec bun run index.ts
