// src/routes/emotion.routes.js
const express = require('express');
const controller = require('../controllers/emotion.controller');
const asyncHandler = require('../utils/asyncHandler');
const { 
  upload, 
  validateImageMetadata, 
  optimizeImage, 
  securityCheck 
} = require('../middleware/imageValidation.middleware');
const router = express.Router();

// 이미지 분석 (보안 및 최적화 적용)
router.post('/analyze', 
  upload.single('image'),
  securityCheck,
  validateImageMetadata,
  optimizeImage,
  asyncHandler(controller.analyzeEmotion)
);

// 세션 관리
router.post('/start-session', asyncHandler(controller.startSession));
router.post('/push-webcam', asyncHandler(controller.pushWebcam));
router.post('/fuse', asyncHandler(controller.fuseEmotionData));

module.exports = router;

