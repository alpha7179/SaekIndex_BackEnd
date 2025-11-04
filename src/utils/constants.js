/**
 * 애플리케이션 상수 정의
 */

// HTTP 상태 코드
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// 에러 코드
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SURVEY_NOT_FOUND: 'SURVEY_NOT_FOUND',
  INVALID_SURVEY_ID: 'INVALID_SURVEY_ID',
  MISSING_SURVEY_ID: 'MISSING_SURVEY_ID',
  INVALID_PAGE_NUMBER: 'INVALID_PAGE_NUMBER',
  INVALID_PAGE_LIMIT: 'INVALID_PAGE_LIMIT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// 페이지네이션 설정
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
};

// 설문 관련 상수
const SURVEY = {
  MIN_AGE: 1,
  MAX_AGE: 100,
  MIN_USER_ID: 0,
  MAX_USER_ID: 9999,
  MIN_QUESTION_SCORE: 1,
  MAX_QUESTION_SCORE: 5,
  MAX_NAME_LENGTH: 100,
  QUESTION_FIELDS: [
    'question1', 'question2', 'question3', 'question4',
    'question5', 'question6', 'question7', 'question8'
  ]
};

// 연령대 분류
const AGE_GROUPS = {
  '10대 이하': { min: 0, max: 19 },
  '20대': { min: 20, max: 29 },
  '30대': { min: 30, max: 39 },
  '40대': { min: 40, max: 49 },
  '50대': { min: 50, max: 59 },
  '60대': { min: 60, max: 69 },
  '70대': { min: 70, max: 79 },
  '80대 이상': { min: 80, max: 150 }
};

// 데이터베이스 연결 상태
const DB_STATES = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3
};

// Rate Limiting 설정
const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000, // 1분
  MAX_REQUESTS: 30,     // 분당 최대 30개 요청
  CLEANUP_PROBABILITY: 0.01 // 1% 확률로 정리
};

// 환경 설정
const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
};

// 로그 레벨
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// 정규 표현식
const REGEX = {
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
  OBJECT_ID: /^[0-9a-fA-F]{24}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// 기본 응답 메시지
const MESSAGES = {
  SUCCESS: {
    SURVEY_CREATED: '설문이 성공적으로 생성되었습니다.',
    SURVEY_UPDATED: '설문이 성공적으로 업데이트되었습니다.',
    SURVEY_DELETED: '설문이 성공적으로 삭제되었습니다.',
    SURVEYS_RETRIEVED: '설문 목록을 성공적으로 조회했습니다.',
    STATS_RETRIEVED: '통계 데이터를 성공적으로 조회했습니다.',
    VIEWED_UPDATED: '감상여부가 성공적으로 업데이트되었습니다.'
  },
  ERROR: {
    SURVEY_NOT_FOUND: '설문을 찾을 수 없습니다.',
    INVALID_SURVEY_ID: '유효하지 않은 설문 ID입니다.',
    VALIDATION_FAILED: '입력 데이터가 유효하지 않습니다.',
    DATABASE_ERROR: '데이터베이스 오류가 발생했습니다.',
    INTERNAL_ERROR: '서버 내부 오류가 발생했습니다.',
    RATE_LIMIT_EXCEEDED: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
    UNAUTHORIZED: '인증이 필요합니다.',
    FORBIDDEN: '접근 권한이 없습니다.'
  }
};

module.exports = {
  HTTP_STATUS,
  ERROR_CODES,
  PAGINATION,
  SURVEY,
  AGE_GROUPS,
  DB_STATES,
  RATE_LIMIT,
  ENVIRONMENTS,
  LOG_LEVELS,
  REGEX,
  MESSAGES
};