/**
 * Winston 기반 로깅 유틸리티
 * AWS 프리 티어 - 로컬 파일 저장 (완전 무료)
 */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// 로그 색상
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// 콘솔 로그 포맷 (색상 포함)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// 파일 로그 포맷 (JSON, 색상 제거)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 트랜스포트 설정
const transports = [
  // 콘솔 출력
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  })
];

// 프로덕션 환경에서만 파일 로깅
if (process.env.NODE_ENV === 'production') {
  // 에러 로그 (일별 로테이션)
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '7d', // 7일만 보관 (디스크 절약)
      zippedArchive: true
    })
  );
  
  // 전체 로그 (일별 로테이션)
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '7d', // 7일만 보관
      zippedArchive: true
    })
  );
}

// Logger 생성
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
  // 예외 처리
  exceptionHandlers: process.env.NODE_ENV === 'production' ? [
    new DailyRotateFile({
      filename: path.join('logs', 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d'
    })
  ] : [],
  // Promise 거부 처리
  rejectionHandlers: process.env.NODE_ENV === 'production' ? [
    new DailyRotateFile({
      filename: path.join('logs', 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d'
    })
  ] : []
});

// HTTP 요청 로깅 미들웨어
logger.httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.http(message);
    }
  });
  
  next();
};

// 성능 측정 헬퍼
logger.measureTime = (label) => {
  const start = Date.now();
  return () => {
    const duration = Date.now() - start;
    logger.debug(`${label}: ${duration}ms`);
    return duration;
  };
};

module.exports = logger;