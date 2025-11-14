/**
 * 환경별 설정 관리
 */
const defaultConfig = require('./default');
const productionConfig = require('./production');

const env = process.env.NODE_ENV || 'development';

// 환경별 설정 병합
const config = env === 'production' 
  ? { ...defaultConfig, ...productionConfig }
  : defaultConfig;

// 설정 검증
function validateConfig() {
  const required = ['server.port', 'database.uri'];
  const missing = [];
  
  required.forEach(key => {
    const keys = key.split('.');
    let value = config;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (value === undefined || value === null) {
      missing.push(key);
    }
  });
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing configuration: ${missing.join(', ')}`);
  }
}

// 설정 검증 실행
validateConfig();

module.exports = config;
