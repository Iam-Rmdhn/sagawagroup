// PM2 Ecosystem Configuration for Sagawa Group API
// Using Bun runtime with bash wrapper to avoid interpreter issues

module.exports = {
  apps: [{
    // Application name
    name: "sagawagroup-api",
    
    // Use bash to execute bun command directly
    // This path will be updated by deploy script to match system's bun location
    script: "/snap/bin/bun",
    args: "run /var/www/sagawagroup/api/index.ts",
    cwd: "/var/www/sagawagroup/api",
    
    // Environment variables for production
    env: {
      NODE_ENV: "production",
      PORT: 5000,
      PATH: "/snap/bin:/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 5000,
      PATH: "/snap/bin:/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    },
    
    // Process management
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: "10s",
    restart_delay: 5000,
    
    // Memory management
    max_memory_restart: "1G",
    
    // Logging
    error_file: "/var/www/sagawagroup/logs/api-error.log",
    out_file: "/var/www/sagawagroup/logs/api-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
    
    // Advanced options
    kill_timeout: 5000,
    listen_timeout: 10000,
    wait_ready: false,
    
    // Environment
    env: {
      NODE_ENV: "production",
      PORT: 5000
    }
  }]
};
