/**
 * Redis 캐시 서비스
 * 통계 API 등 자주 조회되는 데이터 캐싱
 */
const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.useRedis = false;
    this.memoryCache = new Map(); // 메모리 기반 캐시
    
    // Redis 연결 설정
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis 캐시 연결 재시도 중단 - 메모리 캐시 사용');
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true
    };
    
    // 비밀번호가 설정되어 있으면 추가
    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }
    
    this.redis = new Redis(redisConfig);
    
    this.redis.on('error', (err) => {
      logger.warn('Redis 캐시 연결 오류 - 메모리 캐시 사용', { error: err.message });
      this.useRedis = false;
    });
    
    this.redis.on('connect', () => {
      logger.info('Redis 캐시 연결 성공');
      this.useRedis = true;
    });
    
    // 초기 연결 시도
    this.connect();
  }
  
  /**
   * Redis 연결
   */
  async connect() {
    try {
      await this.redis.connect();
      this.useRedis = true;
    } catch (error) {
      logger.warn('Redis 캐시 연결 실패 - 메모리 캐시 사용', { error: error.message });
      this.useRedis = false;
    }
  }
  
  /**
   * 캐시 조회
   * @param {string} key - 캐시 키
   * @returns {Object|null} 캐시된 데이터 또는 null
   */
  async get(key) {
    try {
      if (this.useRedis) {
        const cached = await this.redis.get(key);
        if (cached) {
          logger.debug('캐시 히트', { key });
          return JSON.parse(cached);
        }
      } else {
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          logger.debug('캐시 히트 (메모리)', { key });
          return cached.value;
        }
        if (cached) {
          this.memoryCache.delete(key); // 만료된 캐시 삭제
        }
      }
      logger.debug('캐시 미스', { key });
      return null;
    } catch (error) {
      logger.error('캐시 조회 실패', { key, error: error.message });
      return null;
    }
  }
  
  /**
   * 캐시 저장
   * @param {string} key - 캐시 키
   * @param {Object} value - 저장할 데이터
   * @param {number} ttl - 만료 시간 (초)
   */
  async set(key, value, ttl = 300) {
    try {
      if (this.useRedis) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
        logger.debug('캐시 저장 성공', { key, ttl });
      } else {
        this.memoryCache.set(key, {
          value,
          expiry: Date.now() + (ttl * 1000)
        });
        logger.debug('캐시 저장 성공 (메모리)', { key, ttl });
      }
    } catch (error) {
      logger.error('캐시 저장 실패', { key, error: error.message });
    }
  }
  
  /**
   * 캐시 삭제
   * @param {string} key - 캐시 키
   */
  async del(key) {
    try {
      if (this.useRedis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      logger.debug('캐시 삭제 성공', { key });
    } catch (error) {
      logger.error('캐시 삭제 실패', { key, error: error.message });
    }
  }
  
  /**
   * 패턴으로 캐시 삭제
   * @param {string} pattern - 캐시 키 패턴 (예: 'survey:*')
   */
  async delPattern(pattern) {
    try {
      if (this.useRedis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          logger.debug('패턴 캐시 삭제 성공', { pattern, count: keys.length });
        }
      } else {
        // 메모리 캐시에서 패턴 매칭
        const regex = new RegExp(pattern.replace('*', '.*'));
        let count = 0;
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            count++;
          }
        }
        logger.debug('패턴 캐시 삭제 성공 (메모리)', { pattern, count });
      }
    } catch (error) {
      logger.error('패턴 캐시 삭제 실패', { pattern, error: error.message });
    }
  }
  
  /**
   * 캐시 무효화 (설문 생성/수정/삭제 시)
   */
  async invalidateSurveyCache() {
    try {
      await Promise.all([
        this.del('survey:stats'),
        this.delPattern('survey:list:*')
      ]);
      logger.info('설문 캐시 무효화 완료');
    } catch (error) {
      logger.error('설문 캐시 무효화 실패', { error: error.message });
    }
  }
  
  /**
   * Redis 연결 종료
   */
  async disconnect() {
    try {
      await this.redis.quit();
      logger.info('Redis 캐시 연결 종료');
    } catch (error) {
      logger.error('Redis 캐시 연결 종료 실패', { error: error.message });
    }
  }
  
  /**
   * Redis 상태 확인
   */
  async isConnected() {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch (error) {
      return false;
    }
  }
}

// 싱글톤 인스턴스
const cacheService = new CacheService();

module.exports = cacheService;
