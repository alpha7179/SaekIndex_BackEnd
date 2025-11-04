/**
 * 설문 컨트롤러 - HTTP 요청/응답 처리
 */
const service = require('../services/surveys.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * 새로운 설문 생성
 * POST /api/surveys
 */
exports.createSurvey = asyncHandler(async (req, res) => {
  console.log('[CONTROLLER] 설문 생성 요청 - IP:', req.ip, 'Body:', req.body);
  
  const created = await service.createSurvey(req.body);
  
  console.log('[CONTROLLER] 설문 생성 성공 - ID:', created._id);
  
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
  
  console.log('[CONTROLLER] 설문 목록 조회 요청 - 쿼리:', req.query);
  
  const filters = {
    startDate,
    endDate,
    minAge,
    maxAge,
    isViewed,
    name
  };
  
  const result = await service.getAllSurveys(page, limit, filters);
  
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
  console.log('[CONTROLLER] 설문 통계 조회 요청');
  
  const stats = await service.getSurveyStats();
  
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
  
  console.log(`[CONTROLLER] 설문 업데이트 요청 - ID: ${id}, Body:`, req.body);
  
  const updated = await service.updateSurvey(id, req.body);
  
  console.log('[CONTROLLER] 설문 업데이트 성공');
  
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
  
  console.log(`[CONTROLLER] 감상여부 업데이트 요청 - ID: ${id}, isViewed: ${isViewed}`);
  
  const updated = await service.updateIsViewed(id, isViewed);
  
  console.log('[CONTROLLER] 감상여부 업데이트 성공');
  
  res.json({ 
    success: true,
    data: updated,
    message: '감상여부가 성공적으로 업데이트되었습니다.'
  });
});

/**
 * 설문 삭제
 * DELETE /api/surveys/:id
 */
exports.deleteSurvey = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log(`[CONTROLLER] 설문 삭제 요청 - ID: ${id}`);
  
  const deletedDocument = await service.deleteSurvey(id);
  
  if (!deletedDocument) {
    return res.status(404).json({ 
      success: false,
      error: { 
        message: '삭제할 설문 데이터를 찾을 수 없습니다.',
        code: 'SURVEY_NOT_FOUND'
      } 
    });
  }
  
  console.log('[CONTROLLER] 설문 삭제 성공');
  
  res.status(204).send();
});

/**
 * 특정 설문 조회
 * GET /api/surveys/:id
 */
exports.getSurveyById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log(`[CONTROLLER] 설문 단건 조회 요청 - ID: ${id}`);
  
  if (!service.isValidObjectId(id)) {
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
    return res.status(404).json({
      success: false,
      error: {
        message: '설문을 찾을 수 없습니다.',
        code: 'SURVEY_NOT_FOUND'
      }
    });
  }
  
  res.json({
    success: true,
    data: survey,
    message: '설문을 성공적으로 조회했습니다.'
  });
});