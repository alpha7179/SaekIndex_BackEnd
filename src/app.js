/**
 * Express 애플리케이션 설정
 */
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const compression = require('compression');
const helmet = require('helmet');

// 라우터 및 미들웨어 임포트
const surveysRouter = require('./routes/surveys.routes');
const emotionRouter = require('./routes/emotion.routes');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');
const { sanitizeQuery } = require('./middleware/validation.middleware');
const logger = require('./utils/logger');

/**
 * Express 앱 생성 및 설정
 */
function createApp() {
  const app = express();
  
  // 신뢰할 수 있는 프록시 설정 (배포 환경용)
  app.set('trust proxy', 1);
  
  // === 보안 헤더 설정 (helmet) ===
  app.use(helmet({
    contentSecurityPolicy: false, // API 서버이므로 CSP 비활성화
    crossOriginEmbedderPolicy: false
  }));
  
  // === Gzip 압축 (응답 크기 30-50% 감소) ===
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // 압축 레벨 (1-9, 6이 기본값)
    threshold: 1024 // 1KB 이상만 압축
  }));
  
  // === 보안 및 CORS 설정 ===
  
  // CORS 설정
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CORS_ORIGINS?.split(',') // 프로덕션에서는 특정 도메인만 허용
      : true, // 개발 환경에서는 모든 도메인 허용
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200 // IE11 지원
  };
  
  app.use(cors(corsOptions));
  
  // === 기본 미들웨어 ===
  
  // JSON 파싱 (크기 제한)
  app.use(express.json({ 
    limit: '10mb',
    strict: true
  }));
  
  // URL 인코딩 파싱
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));
  
  // 쿼리 파라미터 정리
  app.use(sanitizeQuery);
  
  // === 요청 로깅 미들웨어 (Winston) ===
  app.use(logger.httpLogger);
  
  // === 헬스 체크 엔드포인트 ===
  
  app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStateMap = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        state: dbState,
        status: dbStateMap[dbState] || 'unknown',
        name: mongoose.connection.name || 'unknown'
      },
      memory: process.memoryUsage(),
      version: {
        node: process.version,
        app: process.env.npm_package_version || '1.0.0'
      }
    };
    
    // 데이터베이스 연결 상태에 따른 HTTP 상태 코드
    const httpStatus = dbState === 1 ? 200 : 503;
    
    res.status(httpStatus).json(healthData);
  });
  
  // === API 라우터 ===
  
  app.use('/api/surveys', surveysRouter);
  app.use('/api/emotion', emotionRouter);
  
  // === 기본 정보 엔드포인트 ===
  
  app.get('/', (req, res) => {
    res.json({
      name: 'SaekIndex Backend API',
      version: '1.0.0',
      description: '감정 분석 및 시각화 프로젝트 백엔드 API',
      endpoints: {
        health: '/health',
        surveys: '/api/surveys',
        stats: '/api/surveys/stats'
      },
      documentation: 'https://github.com/your-repo/docs'
    });
  });
  
  // === 에러 처리 미들웨어 ===
  
  // 404 처리
  app.use(notFound);
  
  // 전역 에러 처리
  app.use(errorHandler);
  
  return app;
}

module.exports = createApp;