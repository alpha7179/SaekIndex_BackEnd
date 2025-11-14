/**
 * 이미지 업로드 보안 및 최적화 미들웨어
 * AWS 프리 티어 - Sharp 사용 (완전 무료)
 */
const multer = require('multer');
const sharp = require('sharp');
const logger = require('../utils/logger');

// 허용된 MIME 타입
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

// 최대 파일 크기 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 최대 이미지 해상도
const MAX_WIDTH = 4096;
const MAX_HEIGHT = 4096;

/**
 * Multer 설정
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // MIME 타입 검증
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      logger.warn(`Invalid file type: ${file.mimetype}`, {
        ip: req.ip,
        mimetype: file.mimetype
      });
      return cb(new Error('지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP만 가능)'));
    }
    
    cb(null, true);
  }
});

/**
 * 이미지 메타데이터 검증 미들웨어
 */
async function validateImageMetadata(req, res, next) {
  if (!req.file) {
    return next();
  }
  
  try {
    // Sharp로 이미지 메타데이터 읽기
    const metadata = await sharp(req.file.buffer).metadata();
    
    logger.debug('Image metadata', {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: `${Math.round(req.file.size / 1024)}KB`
    });
    
    // 해상도 검증
    if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
      logger.warn(`Image resolution too large: ${metadata.width}x${metadata.height}`, {
        ip: req.ip,
        width: metadata.width,
        height: metadata.height
      });
      
      return res.status(400).json({
        error: {
          message: `이미지 해상도가 너무 큽니다. (최대: ${MAX_WIDTH}x${MAX_HEIGHT})`,
          code: 'IMAGE_TOO_LARGE'
        }
      });
    }
    
    // 실제 이미지 형식 검증 (MIME 타입 스푸핑 방지)
    const validFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!validFormats.includes(metadata.format)) {
      logger.warn(`Invalid image format: ${metadata.format}`, {
        ip: req.ip,
        format: metadata.format,
        mimetype: req.file.mimetype
      });
      
      return res.status(400).json({
        error: {
          message: '유효하지 않은 이미지 파일입니다.',
          code: 'INVALID_IMAGE_FORMAT'
        }
      });
    }
    
    // 메타데이터를 req에 추가
    req.imageMetadata = metadata;
    
    next();
  } catch (error) {
    logger.error('Image validation error', {
      error: error.message,
      ip: req.ip
    });
    
    return res.status(400).json({
      error: {
        message: '이미지 파일을 읽을 수 없습니다.',
        code: 'IMAGE_READ_ERROR'
      }
    });
  }
}

/**
 * 이미지 최적화 미들웨어
 * S3 저장 공간 절약 및 전송 속도 향상
 */
async function optimizeImage(req, res, next) {
  if (!req.file) {
    return next();
  }
  
  try {
    const originalSize = req.file.size;
    
    // 이미지 최적화 (크기 조정, 압축)
    const optimized = await sharp(req.file.buffer)
      .resize(1024, 1024, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    // 최적화된 버퍼로 교체
    req.file.buffer = optimized;
    req.file.size = optimized.length;
    
    const savedPercent = Math.round(((originalSize - optimized.length) / originalSize) * 100);
    
    logger.info('Image optimized', {
      originalSize: `${Math.round(originalSize / 1024)}KB`,
      optimizedSize: `${Math.round(optimized.length / 1024)}KB`,
      saved: `${savedPercent}%`
    });
    
    next();
  } catch (error) {
    logger.error('Image optimization error', {
      error: error.message,
      ip: req.ip
    });
    
    // 최적화 실패해도 원본 사용
    logger.warn('Using original image due to optimization failure');
    next();
  }
}

/**
 * 이미지 보안 검사 (악성 파일 방지)
 */
async function securityCheck(req, res, next) {
  if (!req.file) {
    return next();
  }
  
  try {
    // Sharp로 이미지 파싱 시도 (악성 파일 감지)
    await sharp(req.file.buffer).metadata();
    
    // 파일 시그니처 검증 (매직 넘버)
    const buffer = req.file.buffer;
    const signature = buffer.slice(0, 4).toString('hex');
    
    // JPEG: ffd8ff
    // PNG: 89504e47
    // WebP: 52494646
    const validSignatures = ['ffd8ff', '89504e47', '52494646'];
    const isValid = validSignatures.some(sig => signature.startsWith(sig));
    
    if (!isValid) {
      logger.warn('Invalid file signature', {
        signature,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: {
          message: '유효하지 않은 이미지 파일입니다.',
          code: 'INVALID_FILE_SIGNATURE'
        }
      });
    }
    
    next();
  } catch (error) {
    logger.error('Security check failed', {
      error: error.message,
      ip: req.ip
    });
    
    return res.status(400).json({
      error: {
        message: '이미지 보안 검사 실패',
        code: 'SECURITY_CHECK_FAILED'
      }
    });
  }
}

module.exports = {
  upload,
  validateImageMetadata,
  optimizeImage,
  securityCheck,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_WIDTH,
  MAX_HEIGHT
};
