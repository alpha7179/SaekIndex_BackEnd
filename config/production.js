/**
 * 프로덕션 환경 설정
 * AWS EC2 t2.micro 최적화
 */
module.exports = {
  database: {
    options: {
      maxPoolSize: 5, // t2.micro 메모리 제한 고려
      minPoolSize: 1
    }
  },
  
  cache: {
    statsExpiry: 10 * 60, // 10분 (프로덕션에서 더 길게)
    listExpiry: 2 * 60,   // 2분
    enabled: true
  },
  
  logging: {
    level: 'info', // 프로덕션에서는 info 이상만
    enableFileLogging: true
  },
  
  security: {
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || [],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 50 // 프로덕션에서는 더 엄격
    }
  },
  
  monitoring: {
    enablePerformanceTracking: true,
    slowRequestThreshold: 1000,
    memoryWarningThreshold: 75, // 프로덕션에서 더 보수적
    memoryCriticalThreshold: 85,
    systemMonitoringInterval: 5
  }
};
