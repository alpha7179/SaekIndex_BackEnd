/* src/controllers/emotion.controller.js */
const emotionService = require('../services/emotion.service');
const fusionService = require('../services/fusion.service');
const asyncHandler = require('../utils/asyncHandler');
const { v4: uuidv4 } = require('uuid');

/**
 * 이미지를 받아서 감정 분석 수행
 * POST /api/emotion/analyze
 * Content-Type: multipart/form-data
 * Body: { image: File }
 */
exports.analyzeEmotion = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      error: { message: '이미지 파일이 필요합니다.' } 
    });
  }

  try {
    const result = await emotionService.analyzeEmotion(req.file.buffer);
    
    res.json({
      data: {
        label: result.label,
        score: result.score,
        probs: result.probs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Emotion analysis error:', error);
    res.status(500).json({ 
      error: { message: '감정 분석 중 오류가 발생했습니다.', details: error.message } 
    });
  }
});

/**
 * 세션 시작 (녹화 시작)
 * POST /api/emotion/start-session
 */
exports.startSession = asyncHandler(async (req, res) => {
  const sessionId = uuidv4();
  emotionService.startSession(sessionId);
  
  res.json({
    data: {
      sessionId,
      status: 'recording_started'
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
    return res.status(400).json({
      error: { message: 'sessionId와 webcamVector가 필요합니다.' }
    });
  }
  
  if (!Array.isArray(webcamVector) || webcamVector.length !== 5) {
    return res.status(400).json({
      error: { message: 'webcamVector는 5개 요소의 배열이어야 합니다.' }
    });
  }
  
  emotionService.pushWebcamVector(sessionId, webcamVector);
  
  res.json({
    data: {
      status: 'received'
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
    return res.status(400).json({
      error: { message: 'sessionId와 surveyData가 필요합니다.' }
    });
  }
  
  try {
    console.log('[Emotion Controller] 융합 요청 받음:', {
      sessionId,
      surveyDataKeys: Object.keys(surveyData || {})
    });
    
    // 웹캠 데이터 가져오기
    const webcamVectors = emotionService.getWebcamData(sessionId);
    console.log('[Emotion Controller] 웹캠 데이터 가져옴:', {
      sessionId,
      webcamVectorsCount: webcamVectors.length
    });
    
    if (webcamVectors.length === 0) {
      console.warn('[Emotion Controller] 웹캠 데이터가 없음:', sessionId);
      return res.status(400).json({
        error: { message: '웹캠 데이터가 없습니다.' }
      });
    }
    
    // 세션 종료
    emotionService.stopSession(sessionId);
    
    // 융합 수행
    const fusionResult = fusionService.fuseSurveyAndWebcam(surveyData, webcamVectors);
    console.log('[Emotion Controller] 융합 완료:', {
      frameCount: fusionResult.sessionData?.length || 0,
      survey: fusionResult.survey,
      expression: fusionResult.expression,
      total: fusionResult.total
    });
    
    // 세션 삭제
    emotionService.deleteSession(sessionId);
    
    res.json({
      data: {
        status: 'fusion_complete',
        frameCount: fusionResult.sessionData?.length || 0,
        // 새로운 구조
        survey: fusionResult.survey,
        expression: fusionResult.expression,
        total: fusionResult.total,
        // 하위 호환성을 위한 필드들
        surveyVector: fusionResult.surveyVector,
        sessionData: fusionResult.sessionData,
        finalEmotion: fusionResult.finalEmotion,
        finalEmotionScore: fusionResult.finalEmotionScore,
        finalEmotionProbs: fusionResult.finalEmotionProbs
      }
    });
  } catch (error) {
    console.error('[Emotion Controller] 융합 오류:', error);
    res.status(500).json({
      error: { message: '데이터 융합 중 오류가 발생했습니다.', details: error.message }
    });
  }
});

