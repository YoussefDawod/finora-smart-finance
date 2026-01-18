// ecosystem.config.js (PM2 Config)
module.exports = {
  apps: [
    {
      name: 'finora-smart-finance-api',
      script: './server.js',
      instances: 'max', // Auto-scaling
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false, // In production false!
      max_memory_restart: '500M',
      ignore_watch: ['node_modules', 'logs'],
      shutdown_with_message: true,
    },
  ],
};
