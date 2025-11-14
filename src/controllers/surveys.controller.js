/**
 * 설문 컨트롤러 - HTTP 요청/응답 처리
 */
const service = require('../services/surveys.service');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { isValidObjectId } = require('../utils/helpers');

/**
 * 새로운 설문 생성
 * POST /api/surveys
 */
exports.createSurvey = asyncHandler(async (req, res) => {
  logger.info('설문 생성 요청', { 
    ip: req.ip,
    hasSurvey: !!req.body.survey,
    hasExpression: !!req.body.expression,
    hasTotal: !!req.body.total
  });
  
  const created = await service.createSurvey(req.body);
  
  logger.info('설문 생성 성공', { 
    surveyId: created._id,
    hasSurvey: !!created.survey,
    hasExpression: !!created.expression,
    hasTotal: !!created.total
  });
  
  res.status(201).json({ 
    success: true,
    data: created,
    message: '설문이 성공적으로 생성되었습니다.'
  });
});

/**
 * 설문 목록 조회 (페이지네이션)
 * GET /api/surveys?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31
 */
exports.getSurveys = asyncHandler(async (req, res) => {
  const { page, limit, startDate, endDate, minAge, maxAge, isViewed, name } = req.query;
  
  logger.debug('설문 목록 조회 요청', { query: req.query });
  
  const filters = {
    startDate,
    endDate,
    minAge,
    maxAge,
    isViewed,
    name
  };
  
  const result = await service.getAllSurveys(page, limit, filters);
  
  logger.info('설문 목록 조회 완료', { 
    totalSurveys: result.totalSurveys,
    page: result.currentPage 
  });
  
  res.json({ 
    success: true,
    data: result,
    message: `총 ${result.totalSurveys}개의 설문을 조회했습니다.`
  });
});

/**
 * 설문 통계 조회
 * GET /api/surveys/stats
 */
exports.getStats = asyncHandler(async (req, res) => {
  logger.info('설문 통계 조회 요청');
  
  const stats = await service.getSurveyStats();
  
  logger.info('설문 통계 조회 완료', { totalSurveys: stats.totalSurveys });
  
  res.json({ 
    success: true,
    data: stats,
    message: '통계 데이터를 성공적으로 조회했습니다.'
  });
});

/**
 * 설문 데이터 업데이트
 * PUT /api/surveys/:id
 */
exports.updateSurvey = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info('설문 업데이트 요청', { surveyId: id });
  
  const updated = await service.updateSurvey(id, req.body);
  
  logger.info('설문 업데이트 성공', { surveyId: id });
  
  res.json({ 
    success: true,
    data: updated,
    message: '설문이 성공적으로 업데이트되었습니다.'
  });
});

/**
 * 감상 여부 업데이트
 * PATCH /api/surveys/:id/viewed
 */
exports.updateIsViewed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isViewed = true } = req.body;
  
  logger.info('감상여부 업데이트 요청', { surveyId: id, isViewed });
  
  const updated = await service.updateIsViewed(id, isViewed);
  
  logger.info('감상여부 업데이트 성공', { surveyId: id });
  
  res.json({ 
    success: true,
    data: updated,
    message: '감상여부가 성공적으로 업데이트되었습니다.'
  });
});

/**
 * 활성 큐 상태 업데이트
 * PATCH /api/surveys/:id/active-queue
 */
exports.updateIsActiveQueue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActiveQueue = true } = req.body;
  
  logger.info('활성 큐 상태 업데이트 요청', { surveyId: id, isActiveQueue });
  
  const updated = await service.updateIsActiveQueue(id, isActiveQueue);
  
  logger.info('활성 큐 상태 업데이트 성공', { surveyId: id });
  
  res.json({ 
    success: true,
    data: updated,
    message: '활성 큐 상태가 성공적으로 업데이트되었습니다.'
  });
});

/**
 * 설문 삭제
 * DELETE /api/surveys/:id
 */
exports.deleteSurvey = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info('설문 삭제 요청', { surveyId: id });
  
  const deletedDocument = await service.deleteSurvey(id);
  
  if (!deletedDocument) {
    logger.warn('삭제할 설문을 찾을 수 없음', { surveyId: id });
    return res.status(404).json({ 
      success: false,
      error: { 
        message: '삭제할 설문 데이터를 찾을 수 없습니다.',
        code: 'SURVEY_NOT_FOUND'
      } 
    });
  }
  
  logger.info('설문 삭제 성공', { surveyId: id });
  
  res.status(204).send();
});

/**
 * 특정 설문 조회
 * GET /api/surveys/:id
 */
exports.getSurveyById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.debug('설문 단건 조회 요청', { surveyId: id });
  
  if (!isValidObjectId(id)) {
    logger.warn('유효하지 않은 설문 ID', { surveyId: id });
    return res.status(400).json({
      success: false,
      error: {
        message: '유효하지 않은 설문 ID입니다.',
        code: 'INVALID_SURVEY_ID'
      }
    });
  }
  
  const Survey = require('../models/survey.model');
  const survey = await Survey.findById(id).lean();
  
  if (!survey) {
    logger.warn('설문을 찾을 수 없음', { surveyId: id });
    return res.status(404).json({
      success: false,
      error: {
        message: '설문을 찾을 수 없습니다.',
        code: 'SURVEY_NOT_FOUND'
      }
    });
  }
  
  logger.info('설문 단건 조회 성공', { surveyId: id });
  
  res.json({
    success: true,
    data: survey,
    message: '설문을 성공적으로 조회했습니다.'
  });
});