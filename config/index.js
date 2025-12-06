
const defaultConfig = require('./default');
const productionConfig = require('./production');

const env = process.env.NODE_ENV || 'development';

const config = env === 'production' 
  ? { ...defaultConfig, ...productionConfig }
  : defaultConfig;

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

validateConfig();

module.exports = config;
