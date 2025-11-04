/**
 * 헬퍼 유틸리티 함수들
 */
const mongoose = require('mongoose');
const { SURVEY, AGE_GROUPS, REGEX } = require('./constants');

/**
 * MongoDB ObjectId 유효성 검증
 * @param {string} id - 검증할 ID
 * @returns {boolean} 유효성 여부
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * 날짜 형식 검증 (YYYY-MM-DD)
 * @param {string} dateString - 검증할 날짜 문자열
 * @returns {boolean} 유효성 여부
 */
const isValidDateFormat = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  
  if (!REGEX.DATE_FORMAT.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * 나이를 연령대로 분류
 * @param {number} age - 나이
 * @returns {string} 연령대
 */
const getAgeGroup = (age) => {
  for (const [group, range] of Object.entries(AGE_GROUPS)) {
    if (age >= range.min && age <= range.max) {
      return group;
    }
  }
  return '기타';
};

/**
 * 숫자 값 정규화 (범위 제한)
 * @param {*} value - 정규화할 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @param {number} defaultValue - 기본값
 * @returns {number} 정규화된 값
 */
const normalizeNumber = (value, min, max, defaultValue = min) => {
  const num = parseInt(value);
  if (isNaN(num)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, num));
};

/**
 * 설문 질문 응답 정규화
 * @param {*} value - 원본 값
 * @returns {number} 정규화된 값 (1-5)
 */
const normalizeQuestionResponse = (value) => {
  // 배열인 경우 첫 번째 값 사용 (레거시 호환성)
  if (Array.isArray(value)) {
    value = value[0];
  }
  
  return normalizeNumber(value, SURVEY.MIN_QUESTION_SCORE, SURVEY.MAX_QUESTION_SCORE, 1);
};

/**
 * 나이 정규화
 * @param {*} age - 원본 나이
 * @returns {number} 정규화된 나이 (1-100)
 */
const normalizeAge = (age) => {
  return normalizeNumber(age, SURVEY.MIN_AGE, SURVEY.MAX_AGE, 25);
};

/**
 * 사용자 ID 정규화
 * @param {*} userId - 원본 사용자 ID
 * @returns {number} 정규화된 사용자 ID (0-9999)
 */
const normalizeUserId = (userId) => {
  return normalizeNumber(userId, SURVEY.MIN_USER_ID, SURVEY.MAX_USER_ID, 0);
};

/**
 * 문자열 정리 (trim, 길이 제한)
 * @param {string} str - 원본 문자열
 * @param {number} maxLength - 최대 길이
 * @returns {string} 정리된 문자열
 */
const sanitizeString = (str, maxLength = SURVEY.MAX_NAME_LENGTH) => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str.trim().substring(0, maxLength);
};

/**
 * 페이지네이션 파라미터 정규화
 * @param {*} page - 페이지 번호
 * @param {*} limit - 페이지 크기
 * @returns {Object} 정규화된 페이지네이션 객체
 */
const normalizePagination = (page, limit) => {
  const normalizedPage = Math.max(1, parseInt(page) || 1);
  const normalizedLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
  
  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit
  };
};

/**
 * 객체에서 빈 값 제거
 * @param {Object} obj - 원본 객체
 * @returns {Object} 정리된 객체
 */
const removeEmptyValues = (obj) => {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      // boolean 값은 항상 포함
      if (typeof value === 'boolean') {
        cleaned[key] = value;
      }
      // 배열은 길이가 0이 아닌 경우만 포함
      else if (Array.isArray(value) && value.length > 0) {
        cleaned[key] = value;
      }
      // 객체는 키가 있는 경우만 포함
      else if (typeof value === 'object' && Object.keys(value).length > 0) {
        cleaned[key] = value;
      }
      // 기타 값들
      else if (typeof value !== 'object') {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
};

/**
 * 배열을 청크 단위로 분할
 * @param {Array} array - 원본 배열
 * @param {number} chunkSize - 청크 크기
 * @returns {Array} 분할된 배열들의 배열
 */
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * 딜레이 함수 (Promise 기반)
 * @param {number} ms - 딜레이 시간 (밀리초)
 * @returns {Promise} 딜레이 Promise
 */
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 재시도 함수
 * @param {Function} fn - 실행할 함수
 * @param {number} maxRetries - 최대 재시도 횟수
 * @param {number} delayMs - 재시도 간격 (밀리초)
 * @returns {Promise} 함수 실행 결과
 */
const retry = async (fn, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        await delay(delayMs * Math.pow(2, i)); // 지수 백오프
      }
    }
  }
  
  throw lastError;
};

/**
 * 안전한 JSON 파싱
 * @param {string} jsonString - JSON 문자열
 * @param {*} defaultValue - 파싱 실패 시 기본값
 * @returns {*} 파싱된 객체 또는 기본값
 */
const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
};

/**
 * 깊은 복사
 * @param {*} obj - 복사할 객체
 * @returns {*} 복사된 객체
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};

/**
 * 랜덤 문자열 생성
 * @param {number} length - 문자열 길이
 * @returns {string} 랜덤 문자열
 */
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

module.exports = {
  isValidObjectId,
  isValidDateFormat,
  getAgeGroup,
  normalizeNumber,
  normalizeQuestionResponse,
  normalizeAge,
  normalizeUserId,
  sanitizeString,
  normalizePagination,
  removeEmptyValues,
  chunkArray,
  delay,
  retry,
  safeJsonParse,
  deepClone,
  generateRandomString
};