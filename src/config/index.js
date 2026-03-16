const config = {
  // aws: removido
  whatsapp: {
    groupId: process.env.WPP_GROUP_ID || '',
  },
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
