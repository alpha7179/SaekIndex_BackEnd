/* src/controllers/emotion.controller.js */
const emotionService = require('../services/emotion.service');
const fusionService = require('../services/fusion.service');
const sessionService = require('../services/session.service');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * 이미지를 받아서 감정 분석 수행
 * POST /api/emotion/analyze
 * Content-Type: multipart/form-data
 * Body: { image: File }
 */
exports.analyzeEmotion = asyncHandler(async (req, res) => {
  if (!req.file) {
    logger.warn('감정 분석 실패 - 이미지 파일 없음');
    return res.status(400).json({
      status: 'error',
      error: {
        code: 'INVALID_IMAGE',
        message: '이미지 파일이 필요합니다.'
      }
    });
  }

  try {
    logger.debug('감정 분석 시작', { 
      fileSize: req.file.size,
      mimeType: req.file.mimetype 
    });
    
    const result = await emotionService.analyzeEmotion(req.file.buffer);
    
    logger.info('감정 분석 완료', { 
      label: result.label,
      score: result.score 
    });
    
    res.json({
      status: 'success',
      message: '감정 분석 완료!',
      data: {
        label: result.label,
        score: result.score,
        probs: result.probs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('감정 분석 오류', { error: error.message });
    res.status(500).json({
      status: 'error',
      error: {
        code: 'ANALYSIS_FAILED',
        message: '감정 분석 중 오류가 발생했습니다.',
        details: error.message
      }
    });
  }
});

/**
 * 세션 시작 (녹화 시작)
 * POST /api/emotion/start-session
 */
exports.startSession = asyncHandler(async (req, res) => {
  const sessionId = uuidv4();
  await sessionService.startSession(sessionId);
  
  logger.info('세션 시작', { sessionId });
  
  res.json({
    status: 'success',
    data: {
      sessionId,
      createdAt: new Date().toISOString()
    }
  });
});

/**
 * 웹캠 감정 벡터 수신
 * POST /api/emotion/push-webcam
 * Body: { sessionId: string, webcamVector: number[] }
 */
exports.pushWebcam = asyncHandler(async (req, res) => {
  const { sessionId, webcamVector } = req.body;
  
  if (!sessionId || !webcamVector) {
    logger.warn('웹캠 벡터 전송 실패 - 필수 파라미터 누락');
    return res.status(400).json({
      status: 'error',
      error: {
        code: 'INVALID_REQUEST',
        message: 'sessionId와 webcamVector가 필요합니다.'
      }
    });
  }
  
  if (!Array.isArray(webcamVector) || webcamVector.length !== 5) {
    logger.warn('웹캠 벡터 전송 실패 - 잘못된 벡터 형식', { vectorLength: webcamVector?.length });
    return res.status(400).json({
      status: 'error',
      error: {
        code: 'INVALID_VECTOR',
        message: 'webcamVector는 5개 요소의 배열이어야 합니다.'
      }
    });
  }
  
  await sessionService.pushWebcamVector(sessionId, webcamVector);
  const sessionInfo = await sessionService.getSessionInfo(sessionId);
  
  logger.debug('웹캠 벡터 저장 완료', { 
    sessionId, 
    vectorCount: sessionInfo?.frameCount || 0 
  });
  
  res.json({
    status: 'success',
    data: {
      sessionId,
      vectorCount: sessionInfo?.frameCount || 0,
      message: '웹캠 벡터가 저장되었습니다.'
    }
  });
});

/**
 * 설문 데이터와 웹캠 데이터 융합
 * POST /api/emotion/fuse
 * Body: { sessionId: string, surveyData: Object }
 */
exports.fuseEmotionData = asyncHandler(async (req, res) => {
  const { sessionId, surveyData } = req.body;
  
  if (!sessionId || !surveyData) {
    logger.warn('융합 요청 실패 - 필수 파라미터 누락');
    return res.status(400).json({
      status: 'error',
      error: {
        code: 'INVALID_REQUEST',
        message: 'sessionId와 surveyData가 필요합니다.'
      }
    });
  }
  
  try {
    logger.info('융합 요청 받음', { sessionId });
    
    // 웹캠 데이터 가져오기
    const webcamVectors = await sessionService.getWebcamData(sessionId);
    logger.debug('웹캠 데이터 조회', { 
      sessionId, 
      vectorCount: webcamVectors.length 
    });
    
    if (webcamVectors.length === 0) {
      logger.warn('웹캠 데이터 없음', { sessionId });
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'NO_WEBCAM_DATA',
          message: '웹캠 데이터가 없습니다. 최소 1개 이상의 프레임이 필요합니다.',
          details: {
            frameCount: 0
          }
        }
      });
    }
    
    // 세션 종료
    await sessionService.stopSession(sessionId);
    
    // 융합 수행
    const fusionResult = fusionService.fuseSurveyAndWebcam(surveyData, webcamVectors);
    logger.info('융합 완료', {
      sessionId,
      frameCount: fusionResult.sessionData?.length || 0,
      dominantEmotion: fusionResult.total?.dominantEmotion
    });
    
    // 세션 삭제
    await sessionService.deleteSession(sessionId);
    
    res.json({
      status: 'success',
      data: {
        sessionId,
        frameCount: fusionResult.sessionData?.length || 0,
        survey: fusionResult.survey,
        expression: fusionResult.expression,
        total: fusionResult.total
      }
    });
  } catch (error) {
    logger.error('융합 오류', { sessionId, error: error.message });
    res.status(500).json({
      status: 'error',
      error: {
        code: 'FUSION_FAILED',
        message: '데이터 융합 중 오류가 발생했습니다.',
        details: error.message
      }
    });
  }
});

