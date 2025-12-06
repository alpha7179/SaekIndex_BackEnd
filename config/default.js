
module.exports = {
  server: {
    port: parseInt(process.env.PORT) || 4000,
    host: '0.0.0.0'
  },
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/saekindex',
    name: process.env.DB_NAME || 'saekinDB',
    options: {
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
      compressors: ['zlib']
    }
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || null,
    maxRetriesPerRequest: 3
  },
  
  python: {
    serverPort: parseInt(process.env.EMOTION_SERVER_PORT) || 5001,
    serverUrl: `http://127.0.0.1:${process.env.EMOTION_SERVER_PORT || 5001}`,
    timeout: 10000,
    maxRetries: 3,
    retryDelay: 1000
  },
  
  session: {
    ttl: 3600,
    cleanupInterval: 300000
  },
  
  cache: {
    statsExpiry: 5 * 60,
    listExpiry: 1 * 60,
    enabled: process.env.NODE_ENV === 'production'
  },
  
  upload: {
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxWidth: 4096,
    maxHeight: 4096,
    optimizeQuality: 85
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFiles: '7d',
    maxSize: '20m',
    enableFileLogging: process.env.NODE_ENV === 'production'
  },
  
  security: {
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100
    }
  },
  
  monitoring: {
    enablePerformanceTracking: true,
    slowRequestThreshold: 1000, 
    memoryWarningThreshold: 80,
    memoryCriticalThreshold: 90,
    systemMonitoringInterval: 5
  }
};
