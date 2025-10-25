/* src/controllers/surveys.controller.js */
const service = require('../services/surveys.service');
const asyncHandler = require('../utils/asyncHandler');

exports.createSurvey = asyncHandler(async (req, res) => {
  const created = await service.createSurvey(req.body);
  res.status(201).json({ data: created });
});

exports.getSurveys = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const result = await service.getAllSurveys(page, limit);
  res.json({ data: result });
});
exports.getStats = asyncHandler(async (req, res) => {
  const stats = await service.getSurveyStats();
  res.json({ data: stats });
});
exports.updateSurvey = asyncHandler(async (req, res) => { /* ... */ });
exports.deleteSurvey = asyncHandler(async (req, res) => {
   const { id } = req.params;
  console.log(`[DELETE CONTROLLER] ID: ${id}에 대한 삭제 요청을 받았습니다.`);
  
  const deletedDocument = await service.deleteSurvey(id);
  
  if (!deletedDocument) {
    console.log(`[DELETE CONTROLLER] 서비스에서 ID: ${id}에 해당하는 문서를 찾지 못했다고 보고했습니다.`);
    return res.status(404).json({ error: { message: '삭제할 설문 데이터를 찾을 수 없습니다.' } });
  }
  
  console.log('[DELETE CONTROLLER] 성공적으로 문서를 삭제했습니다. 204 응답을 보냅니다.');
  res.status(204).send();
});