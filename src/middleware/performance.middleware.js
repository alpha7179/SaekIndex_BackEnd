/**
 * 성능 모니터링 미들웨어
 * AWS 프리 티어 - 로컬 모니터링 (완전 무료)
 */
const logger = require('../utils/logger');

/**
 * 응답 시간 측정 미들웨어
 */
function measureResponseTime(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // 느린 요청 로깅 (1초 이상)
    if (duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        duration,
        statusCode: res.statusCode,
        ip: req.ip
      });
    }
    
    // 매우 느린 요청 (3초 이상)
    if (duration > 3000) {
      logger.error(`Very slow request: ${req.method} ${req.originalUrl} - ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        duration,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  });
  
  next();
}

/**
 * 메모리 사용량 모니터링
 */
function monitorMemory() {
  const used = process.memoryUsage();
  
  const memoryInfo = {
    rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(used.external / 1024 / 1024)} MB`
  };
  
  logger.debug('Memory usage:', memoryInfo);
  
  // 힙 사용량이 80% 이상이면 경고
  const heapUsagePercent = (used.heapUsed / used.heapTotal) * 100;
  if (heapUsagePercent > 80) {
    logger.warn(`High memory usage: ${heapUsagePercent.toFixed(2)}%`, memoryInfo);
  }
  
  // 힙 사용량이 90% 이상이면 에러
  if (heapUsagePercent > 90) {
    logger.error(`Critical memory usage: ${heapUsagePercent.toFixed(2)}%`, memoryInfo);
  }
  
  return memoryInfo;
}

/**
 * CPU 사용량 모니터링
 */
function monitorCPU() {
  const usage = process.cpuUsage();
  const cpuInfo = {
    user: `${Math.round(usage.user / 1000)}ms`,
    system: `${Math.round(usage.system / 1000)}ms`
  };
  
  logger.debug('CPU usage:', cpuInfo);
  return cpuInfo;
}

/**
 * 시스템 상태 모니터링 (주기적 실행)
 */
function startSystemMonitoring(intervalMinutes = 5) {
  const interval = intervalMinutes * 60 * 1000;
  
  setInterval(() => {
    const memory = monitorMemory();
    const cpu = monitorCPU();
    
    logger.info('System status', {
      memory,
      cpu,
      uptime: `${Math.round(process.uptime() / 60)} minutes`
    });
  }, interval);
  
  logger.info(`System monitoring started (interval: ${intervalMinutes} minutes)`);
}

/**
 * 요청 크기 모니터링
 */
function monitorRequestSize(req, res, next) {
  const contentLength = req.get('content-length');
  
  if (contentLength) {
    const sizeInMB = parseInt(contentLength) / (1024 * 1024);
    
    // 5MB 이상 요청 로깅
    if (sizeInMB > 5) {
      logger.warn(`Large request: ${req.method} ${req.originalUrl} - ${sizeInMB.toFixed(2)}MB`, {
        method: req.method,
        url: req.originalUrl,
        size: `${sizeInMB.toFixed(2)}MB`,
        ip: req.ip
      });
    }
  }
  
  next();
}

module.exports = {
  measureResponseTime,
  monitorMemory,
  monitorCPU,
  startSystemMonitoring,
  monitorRequestSize
};
