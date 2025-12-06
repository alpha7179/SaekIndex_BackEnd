
module.exports = {
  database: {
    options: {
      maxPoolSize: 5, 
      minPoolSize: 1
    }
  },
  
  cache: {
    statsExpiry: 10 * 60, 
    listExpiry: 2 * 60,
    enabled: true
  },
  
  logging: {
    level: 'info',
    enableFileLogging: true
  },
  
  security: {
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || [],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 50
    }
  },
  
  monitoring: {
    enablePerformanceTracking: true,
    slowRequestThreshold: 1000,
    memoryWarningThreshold: 75,
    memoryCriticalThreshold: 85,
    systemMonitoringInterval: 5
  }
};
