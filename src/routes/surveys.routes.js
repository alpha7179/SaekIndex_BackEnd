/**
 * 설문 라우터 - API 엔드포인트 정의
 */
const express = require('express');
const controller = require('../controllers/surveys.controller');
const asyncHandler = require('../utils/asyncHandler');
const { validateSurveyId, validatePagination, rateLimiter } = require('../middleware/validation.middleware');

const router = express.Router();

// 요청 로깅 미들웨어
router.use((req, res, next) => {
  console.log(`[ROUTER] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// === 설문 CRUD 엔드포인트 ===

/**
 * 설문 목록 조회 (페이지네이션 및 필터링 지원)
 * GET /api/surveys?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31
 */
router.get('/', 
  validatePagination,
  asyncHandler(controller.getSurveys)
);

/**
 * 설문 통계 조회
 * GET /api/surveys/stats
 */
router.get('/stats', 
  asyncHandler(controller.getStats)
);

/**
 * 특정 설문 조회
 * GET /api/surveys/:id
 */
router.get('/:id', 
  validateSurveyId,
  asyncHandler(controller.getSurveyById)
);

/**
 * 새로운 설문 생성
 * POST /api/surveys
 */
router.post('/', 
  rateLimiter,
  asyncHandler(controller.createSurvey)
);

/**
 * 설문 데이터 업데이트
 * PUT /api/surveys/:id
 */
router.put('/:id', 
  validateSurveyId,
  asyncHandler(controller.updateSurvey)
);

/**
 * 감상 여부 업데이트
 * PATCH /api/surveys/:id/viewed
 */
router.patch('/:id/viewed', 
  validateSurveyId,
  asyncHandler(controller.updateIsViewed)
);

/**
 * 활성 큐 상태 업데이트
 * PATCH /api/surveys/:id/active-queue
 */
router.patch('/:id/active-queue', 
  validateSurveyId,
  asyncHandler(controller.updateIsActiveQueue)
);

/**
 * 설문 삭제
 * DELETE /api/surveys/:id
 */
router.delete('/:id', 
  validateSurveyId,
  asyncHandler(controller.deleteSurvey)
);

// === 유틸리티 엔드포인트 ===

/**
 * 감상여부 업데이트 (레거시 호환성)
 * GET /api/surveys/mark-viewed/:id
 * @deprecated 새로운 PATCH /api/surveys/:id/viewed 사용 권장
 */
router.get('/mark-viewed/:id', 
  validateSurveyId,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(`[LEGACY ROUTE] mark-viewed 호출 - ID: ${id}`);
    
    try {
      const mongoose = require('mongoose');
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ 
          success: false,
          error: { message: '유효하지 않은 설문 ID입니다.' } 
        });
      }
      
      const result = await mongoose.connection.db.collection('surveys').updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isViewed: true } }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ 
          success: false,
          error: { message: '설문을 찾을 수 없습니다.' } 
        });
      }
      
      const updated = await mongoose.connection.db.collection('surveys').findOne(
        { _id: new mongoose.Types.ObjectId(id) }
      );
      
      console.log('[LEGACY ROUTE] 감상여부 업데이트 성공');
      res.json({ 
        success: true,
        data: updated,
        message: '감상여부가 업데이트되었습니다. (레거시 엔드포인트)'
      });
      
    } catch (error) {
      console.error('[LEGACY ROUTE] 오류:', error);
      res.status(500).json({ 
        success: false,
        error: { message: '서버 오류가 발생했습니다.' } 
      });
    }
  })
);

/**
 * isViewed 필드 일괄 수정 (관리자용)
 * POST /api/surveys/admin/fix-isviewed
 */
router.post('/admin/fix-isviewed', 
  asyncHandler(async (req, res) => {
    console.log('[ADMIN] isViewed 필드 일괄 수정 시작');
    
    try {
      const mongoose = require('mongoose');
      const result = await mongoose.connection.db.collection('surveys').updateMany(
        { isViewed: { $exists: false } },
        { $set: { isViewed: false } }
      );
      
      console.log(`[ADMIN] ${result.modifiedCount}개의 설문에 isViewed: false 추가`);
      
      res.json({ 
        success: true,
        message: `${result.modifiedCount}개의 설문이 수정되었습니다.`,
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount
        }
      });
      
    } catch (error) {
      console.error('[ADMIN] 오류:', error);
      res.status(500).json({ 
        success: false,
        error: { message: '서버 오류가 발생했습니다.' } 
      });
    }
  })
);

/**
 * 데이터베이스 상태 확인 (관리자용)
 * GET /api/surveys/admin/health
 */
router.get('/admin/health', 
  asyncHandler(async (req, res) => {
    try {
      const Survey = require('../models/survey.model');
      
      const [totalCount, viewedCount, recentSurvey] = await Promise.all([
        Survey.countDocuments(),
        Survey.countDocuments({ isViewed: true }),
        Survey.findOne({}, {}, { sort: { createdAt: -1 } }).lean()
      ]);
      
      res.json({
        success: true,
        data: {
          totalSurveys: totalCount,
          viewedSurveys: viewedCount,
          notViewedSurveys: totalCount - viewedCount,
          viewedPercentage: totalCount > 0 ? Math.round((viewedCount / totalCount) * 100) : 0,
          lastSurveyDate: recentSurvey?.createdAt || null,
          databaseStatus: 'healthy'
        },
        message: '데이터베이스 상태가 정상입니다.'
      });
      
    } catch (error) {
      console.error('[ADMIN HEALTH] 오류:', error);
      res.status(500).json({
        success: false,
        error: { message: '데이터베이스 상태 확인 실패' },
        data: { databaseStatus: 'error' }
      });
    }
  })
);

module.exports = router;