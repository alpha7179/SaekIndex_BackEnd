/**
 * 기본 설정
 * AWS 프리 티어 최적화
 */
module.exports = {
  server: {
    port: parseInt(process.env.PORT) || 4000,
    host: '0.0.0.0'
  },
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/saekindex',
    name: process.env.DB_NAME || 'saekinDB',
    options: {
      maxPoolSize: 5, // t2.micro 최적화
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
      compressors: ['zlib'] // 네트워크 대역폭 절약
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
    ttl: 3600, // 1시간
    cleanupInterval: 300000 // 5분마다 정리
  },
  
  cache: {
    statsExpiry: 5 * 60, // 5분
    listExpiry: 1 * 60,  // 1분
    enabled: process.env.NODE_ENV === 'production'
  },
  
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxWidth: 4096,
    maxHeight: 4096,
    optimizeQuality: 85
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFiles: '7d', // 7일만 보관
    maxSize: '20m',
    enableFileLogging: process.env.NODE_ENV === 'production'
  },
  
  security: {
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15분
      max: 100 // 15분당 100개 요청
    }
  },
  
  monitoring: {
    enablePerformanceTracking: true,
    slowRequestThreshold: 1000, // 1초
    memoryWarningThreshold: 80, // 80%
    memoryCriticalThreshold: 90, // 90%
    systemMonitoringInterval: 5 // 5분
  }
};
