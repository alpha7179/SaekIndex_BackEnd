/**
 * 로깅 유틸리티
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[37m', // White
  RESET: '\x1b[0m'   // Reset
};

class Logger {
  constructor(level = 'INFO') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.INFO;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const color = LOG_COLORS[level] || LOG_COLORS.RESET;
    const reset = LOG_COLORS.RESET;
    
    let formatted = `${color}[${timestamp}] ${level}${reset}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      formatted += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return formatted;
  }

  log(level, message, meta = {}) {
    if (LOG_LEVELS[level] <= this.level) {
      const formatted = this.formatMessage(level, message, meta);
      
      if (level === 'ERROR') {
        console.error(formatted);
      } else if (level === 'WARN') {
        console.warn(formatted);
      } else {
        console.log(formatted);
      }
    }
  }

  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }
}

// 싱글톤 인스턴스
const logger = new Logger(process.env.LOG_LEVEL || 'INFO');

module.exports = logger;