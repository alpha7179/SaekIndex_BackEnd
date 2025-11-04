/**
 * 검증 미들웨어 - 요청 데이터 유효성 검사
 */
const mongoose = require('mongoose');

/**
 * 설문 ID 유효성 검증
 */
const validateSurveyId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      error: {
        message: '설문 ID가 필요합니다.',
        code: 'MISSING_SURVEY_ID'
      }
    });
  }
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: {
        message: '유효하지 않은 설문 ID 형식입니다.',
        code: 'INVALID_SURVEY_ID'
      }
    });
  }
  
  next();
};

/**
 * 페이지네이션 파라미터 검증
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  
  // 페이지 번호 검증
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: {
          message: '페이지 번호는 1 이상의 숫자여야 합니다.',
          code: 'INVALID_PAGE_NUMBER'
        }
      });
    }
    req.query.page = pageNum;
  }
  
  // 페이지 크기 검증
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: {
          message: '페이지 크기는 1-100 사이의 숫자여야 합니다.',
          code: 'INVALID_PAGE_LIMIT'
        }
      });
    }
    req.query.limit = limitNum;
  }
  
  next();
};

/**
 * 날짜 형식 검증
 */
const validateDateFormat = (dateString, fieldName) => {
  if (!dateString) return true;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return `${fieldName}은 YYYY-MM-DD 형식이어야 합니다.`;
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return `${fieldName}이 유효하지 않은 날짜입니다.`;
  }
  
  return true;
};

/**
 * 설문 생성 데이터 검증
 */
const validateSurveyCreation = (req, res, next) => {
  const { name, age, date, question1, question2, question3, question4, 
          question5, question6, question7, question8 } = req.body;
  
  const errors = [];
  
  // 필수 필드 검증
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('이름은 필수 입력 항목입니다.');
  } else if (name.length > 100) {
    errors.push('이름은 100자를 초과할 수 없습니다.');
  }
  
  if (!age || typeof age !== 'number' || age < 1 || age > 100) {
    errors.push('나이는 1-100 사이의 숫자여야 합니다.');
  }
  
  if (!date) {
    errors.push('날짜는 필수 입력 항목입니다.');
  } else {
    const dateValidation = validateDateFormat(date, '날짜');
    if (dateValidation !== true) {
      errors.push(dateValidation);
    }
  }
  
  // 질문 응답 검증
  const questions = [question1, question2, question3, question4, 
                    question5, question6, question7, question8];
  
  questions.forEach((question, index) => {
    const questionNum = index + 1;
    if (question === undefined || question === null) {
      errors.push(`질문 ${questionNum}은 필수 입력 항목입니다.`);
    } else {
      const value = parseInt(question);
      if (isNaN(value) || value < 1 || value > 5) {
        errors.push(`질문 ${questionNum}은 1-5 사이의 숫자여야 합니다.`);
      }
    }
  });
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: '입력 데이터가 유효하지 않습니다.',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  
  next();
};

/**
 * 간단한 Rate Limiting (메모리 기반)
 */
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1분
const MAX_REQUESTS = 30; // 분당 최대 30개 요청

const rateLimiter = (req, res, next) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  // 클라이언트별 요청 기록 가져오기
  const clientRequests = requestCounts.get(clientId) || [];
  
  // 시간 윈도우 밖의 요청들 제거
  const recentRequests = clientRequests.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  // 요청 제한 확인
  if (recentRequests.length >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: {
        message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
      }
    });
  }
  
  // 현재 요청 기록
  recentRequests.push(now);
  requestCounts.set(clientId, recentRequests);
  
  // 주기적으로 오래된 기록 정리 (메모리 누수 방지)
  if (Math.random() < 0.01) { // 1% 확률로 정리
    cleanupOldRequests();
  }
  
  next();
};

/**
 * 오래된 요청 기록 정리
 */
const cleanupOldRequests = () => {
  const now = Date.now();
  for (const [clientId, requests] of requestCounts.entries()) {
    const recentRequests = requests.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW
    );
    
    if (recentRequests.length === 0) {
      requestCounts.delete(clientId);
    } else {
      requestCounts.set(clientId, recentRequests);
    }
  }
};

/**
 * 쿼리 파라미터 정리
 */
const sanitizeQuery = (req, res, next) => {
  // 빈 문자열을 undefined로 변환
  Object.keys(req.query).forEach(key => {
    if (req.query[key] === '') {
      req.query[key] = undefined;
    }
  });
  
  next();
};

module.exports = {
  validateSurveyId,
  validatePagination,
  validateSurveyCreation,
  validateDateFormat,
  rateLimiter,
  sanitizeQuery
};