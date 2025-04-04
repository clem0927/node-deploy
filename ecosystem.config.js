module.exports = {
    apps: [
      {
        name: 'server',
        script: './bin/www',
        env: {
          NODE_ENV: 'production',
          SEQUELIZE_PASSWORD: 'root',
          COOKIE_SECRET: 'cookiesecret',
          REDIS_HOST: 'redis-10489.c99.us-east-1-4.ec2.redns.redis-cloud.com',
          REDIS_PORT: '10489',
          REDIS_PASSWORD: '6wSfUm8h1TGLU3nhZwA4Qf7HBPPrUdmD',
        },
      },
    ],
  };