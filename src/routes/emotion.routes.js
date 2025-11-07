// src/routes/emotion.routes.js
const express = require('express');
const multer = require('multer');
const controller = require('../controllers/emotion.controller');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();

// 메모리 스토리지 사용 (파일을 메모리에 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

router.post('/analyze', upload.single('image'), asyncHandler(controller.analyzeEmotion));
router.post('/start-session', asyncHandler(controller.startSession));
router.post('/push-webcam', asyncHandler(controller.pushWebcam));
router.post('/fuse', asyncHandler(controller.fuseEmotionData));

module.exports = router;

