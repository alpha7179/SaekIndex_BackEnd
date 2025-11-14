/**
 * Joi 기반 입력 검증
 * AWS 프리 티어 - Joi 사용 (완전 무료)
 */
const Joi = require('joi');

/**
 * 설문 생성 스키마
 */
const createSurveySchema = Joi.object({
  userId: Joi.number().integer().min(0).max(9999).default(0),
  
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': '날짜는 YYYY-MM-DD 형식이어야 합니다.',
      'any.required': '날짜는 필수 입력 항목입니다.'
    }),
  
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': '이름은 필수 입력 항목입니다.',
      'string.max': '이름은 100자를 초과할 수 없습니다.',
      'any.required': '이름은 필수 입력 항목입니다.'
    }),
  
  age: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .required()
    .messages({
      'number.base': '나이는 숫자여야 합니다.',
      'number.min': '나이는 1 이상이어야 합니다.',
      'number.max': '나이는 100 이하여야 합니다.',
      'any.required': '나이는 필수 입력 항목입니다.'
    }),
  
  // 질문 1-8 (1-5 척도)
  question1: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': '질문 1은 필수 입력 항목입니다.' }),
  question2: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': '질문 2는 필수 입력 항목입니다.' }),
  question3: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': '질문 3은 필수 입력 항목입니다.' }),
  question4: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': '질문 4는 필수 입력 항목입니다.' }),
  question5: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': '질문 5는 필수 입력 항목입니다.' }),
  question6: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': '질문 6은 필수 입력 항목입니다.' }),
  question7: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': '질문 7은 필수 입력 항목입니다.' }),
  question8: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': '질문 8은 필수 입력 항목입니다.' }),
  
  // 감정 데이터 (선택사항)
  survey: Joi.object({
    surveyDominantEmotion: Joi.string().valid('angry', 'sad', 'neutral', 'happy', 'surprise'),
    surveyWeight: Joi.number().min(0).max(1),
    angry: Joi.number().min(0).max(1),
    sad: Joi.number().min(0).max(1),
    neutral: Joi.number().min(0).max(1),
    happy: Joi.number().min(0).max(1),
    surprise: Joi.number().min(0).max(1)
  }).optional(),
  
  expression: Joi.object({
    expressionDominantEmotion: Joi.string().valid('angry', 'sad', 'neutral', 'happy', 'surprise'),
    expressionWeight: Joi.number().min(0).max(1),
    angry: Joi.number().min(0).max(1),
    sad: Joi.number().min(0).max(1),
    neutral: Joi.number().min(0).max(1),
    happy: Joi.number().min(0).max(1),
    surprise: Joi.number().min(0).max(1)
  }).optional(),
  
  total: Joi.object({
    dominantEmotion: Joi.string().valid('angry', 'sad', 'neutral', 'happy', 'surprise'),
    angry: Joi.number().min(0).max(1),
    sad: Joi.number().min(0).max(1),
    neutral: Joi.number().min(0).max(1),
    happy: Joi.number().min(0).max(1),
    surprise: Joi.number().min(0).max(1)
  }).optional(),
  
  isViewed: Joi.boolean().default(false)
});

/**
 * 설문 수정 스키마
 */
const updateSurveySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  age: Joi.number().integer().min(1).max(100),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  question1: Joi.number().integer().min(1).max(5),
  question2: Joi.number().integer().min(1).max(5),
  question3: Joi.number().integer().min(1).max(5),
  question4: Joi.number().integer().min(1).max(5),
  question5: Joi.number().integer().min(1).max(5),
  question6: Joi.number().integer().min(1).max(5),
  question7: Joi.number().integer().min(1).max(5),
  question8: Joi.number().integer().min(1).max(5),
  isViewed: Joi.boolean()
}).min(1); // 최소 1개 필드는 있어야 함

/**
 * 쿼리 파라미터 스키마
 */
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  minAge: Joi.number().integer().min(1).max(100),
  maxAge: Joi.number().integer().min(1).max(100),
  isViewed: Joi.boolean(),
  name: Joi.string().trim().max(100)
});

/**
 * 감상 여부 업데이트 스키마
 */
const updateIsViewedSchema = Joi.object({
  isViewed: Joi.boolean().required()
});

/**
 * 검증 미들웨어 생성 함수
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // 모든 에러 반환
      stripUnknown: true, // 스키마에 없는 필드 제거
      convert: true // 자동 타입 변환
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));
      
      return res.status(400).json({
        success: false,
        error: {
          message: '입력 데이터가 유효하지 않습니다.',
          code: 'VALIDATION_ERROR',
          details: errors
        }
      });
    }
    
    // 검증된 값으로 교체
    req[property] = value;
    next();
  };
}

module.exports = {
  validateCreateSurvey: validate(createSurveySchema, 'body'),
  validateUpdateSurvey: validate(updateSurveySchema, 'body'),
  validateQuery: validate(querySchema, 'query'),
  validateIsViewed: validate(updateIsViewedSchema, 'body'),
  
  // 스키마 직접 export (테스트용)
  createSurveySchema,
  updateSurveySchema,
  querySchema,
  updateIsViewedSchema
};
