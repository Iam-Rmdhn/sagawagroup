export default {
  apps: [{
    name: 'sagawagroup-api',
    script: 'bun',
    args: 'run index.ts',
    cwd: '/var/www/sagawagroup/bun-api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: '/var/www/sagawagroup/logs/api-error.log',
    out_file: '/var/www/sagawagroup/logs/api-out.log',
    log_file: '/var/www/sagawagroup/logs/api-combined.log',
    time: true
  }]
}