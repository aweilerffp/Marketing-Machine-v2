module.exports = {
  apps: [{
    name: 'marketing-site',
    script: 'npm',
    args: 'start',
    cwd: '/root/marketing-machine/marketing-site',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/root/logs/marketing-site-error.log',
    out_file: '/root/logs/marketing-site-out.log',
    log_file: '/root/logs/marketing-site-combined.log',
    time: true
  }]
};
