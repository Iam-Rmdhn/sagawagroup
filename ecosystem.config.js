module.exports = {
  apps: [
    {
      name: "sagawagroup-api-production",
      script: "bun-api/index.ts",
      cwd: "/var/www/sagawagroup",
      interpreter: "bun",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        BASE_URL: "https://www.sagawagroup.id"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
        BASE_URL: "https://www.sagawagroup.id"
      },
      // Process management
      instances: 1,
      exec_mode: 'fork',
      
      // Restart behavior
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Memory management
      max_memory_restart: '1G',
      
      // Logging
      error_file: '/var/www/sagawagroup/logs/api-error.log',
      out_file: '/var/www/sagawagroup/logs/api-out.log',
      log_file: '/var/www/sagawagroup/logs/api-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced options
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Source map support
      source_map_support: true,
      
      // Process title for system monitoring
      name: 'sagawagroup-api-process'
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'https://github.com/your-repo/sagawagroup.git',
      path: '/var/www/sagawagroup',
      'pre-deploy-local': '',
      'post-deploy': 'cd /var/www/sagawagroup/api && bun install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};