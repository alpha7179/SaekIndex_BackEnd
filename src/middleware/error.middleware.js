/**
 * 전역 에러 처리 미들웨어
 */

/**
 * 에러 타입별 상태 코드 매핑
 */
const ERROR_STATUS_MAP = {
  ValidationError: 400,
  CastError: 400,
  MongoError: 500,
  MongooseError: 500,
  JsonWebTokenError: 401,
  TokenExpiredError: 401,
  MulterError: 400
};

/**
 * MongoDB 에러 메시지 정리
 */
const formatMongoError = (err) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return `${field} 값이 이미 존재합니다.`;
  }
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return errors.join(', ');
  }
  
  if (err.name === 'CastError') {
    return `유효하지 않은 ${err.path} 값입니다.`;
  }
  
  return err.message;
};

/**
 * 에러 로깅
 */
const logError = (err, req) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip;
  const userAgent = req.get('User-Agent');
  
  console.error(`[ERROR ${timestamp}] ${method} ${url}`);
  console.error(`IP: ${ip}, User-Agent: ${userAgent}`);
  console.error(`Error: ${err.name} - ${err.message}`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(`Stack: ${err.stack}`);
  }
};

/**
 * 메인 에러 핸들러
 */
module.exports = function errorHandler(err, req, res, next) {
  // 에러 로깅
  logError(err, req);
  
  // 응답이 이미 전송된 경우 Express 기본 핸들러로 위임
  if (res.headersSent) {
    return next(err);
  }
  
  // 상태 코드 결정
  let statusCode = err.statusCode || err.status || ERROR_STATUS_MAP[err.name] || 500;
  
  // 에러 메시지 정리
  let message = err.message || 'Internal Server Error';
  
  // MongoDB 관련 에러 처리
  if (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000) {
    message = formatMongoError(err);
    statusCode = 400;
  }
  
  // 개발 환경에서의 상세 정보
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // 응답 페이로드 구성
  const payload = {
    success: false,
    error: {
      message,
      code: err.code || err.name || 'INTERNAL_ERROR',
      statusCode
    }
  };
  
  // 개발 환경에서만 스택 트레이스 포함
  if (isDevelopment) {
    payload.error.stack = err.stack;
    payload.error.details = {
      name: err.name,
      originalMessage: err.message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    };
  }
  
  // 특정 에러에 대한 추가 정보
  if (err.name === 'ValidationError' && err.errors) {
    payload.error.validationErrors = Object.keys(err.errors).map(field => ({
      field,
      message: err.errors[field].message,
      value: err.errors[field].value
    }));
  }
  
  // 클라이언트에게 응답 전송
  res.status(statusCode).json(payload);
};