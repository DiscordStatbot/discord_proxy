require('dotenv').config();

module.exports = {
  apps: [{
    name: 'Discord Proxy',
    script: 'dist/server.js',
    node_args: '--max-http-header-size=10000000 --max-old-space-size=2560',
    kill_timeout: 5000,
  }],
};
