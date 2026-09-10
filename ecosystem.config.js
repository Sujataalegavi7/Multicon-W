module.exports = {
  apps: [
    {
      name: 'crr-backend',
      script: './backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
