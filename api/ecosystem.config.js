// PM2 Ecosystem Configuration
// Subir al servidor y ejecutar: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'cieniowanie-api',
    script: 'index.js',
    cwd: '/var/www/vhosts/droneagri.pl/cieniowanie.droneagri.pl/api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    restart_delay: 5000,
    exp_backoff_restart_delay: 100,
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/root/.pm2/logs/cieniowanie-api-error.log',
    out_file: '/root/.pm2/logs/cieniowanie-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
