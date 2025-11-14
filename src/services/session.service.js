/**
 * 세션 관리 서비스
 * Redis 사용 가능 시 Redis, 불가능 시 메모리 기반
 */
const Redis = require('ioredis');

class SessionService {
  constructor() {
    this.useRedis = false;
    this.memoryStore = new Map(); // 메모리 기반 저장소
    
    // Redis 연결 설정
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('[Redis] 연결 재시도 중단 - 메모리 모드로 전환');
          return null; // 재시도 중단
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
      console.warn('[Redis] 연결 오류 - 메모리 모드 사용:', err.message);
      this.useRedis = false;
    });
    
    this.redis.on('connect', () => {
      console.log('[Redis] 연결 성공');
      this.useRedis = true;
    });
    
    this.redis.on('ready', () => {
      console.log('[Redis] 준비 완료');
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
      console.warn('[Redis] 연결 실패 - 메모리 기반 세션 사용:', error.message);
      this.useRedis = false;
    }
  }
  
  /**
   * 세션 시작
   */
  async startSession(sessionId) {
    try {
      if (this.useRedis) {
        const sessionKey = `session:${sessionId}`;
        await this.redis.hset(sessionKey, {
          isRecording: 'true',
          createdAt: Date.now(),
          frameCount: 0
        });
        await this.redis.expire(sessionKey, 3600);
      } else {
        // 메모리 기반
        this.memoryStore.set(sessionId, {
          isRecording: true,
          createdAt: Date.now(),
          frameCount: 0,
          vectors: []
        });
      }
      console.log(`[Session] 세션 시작: ${sessionId} (${this.useRedis ? 'Redis' : 'Memory'})`);
    } catch (error) {
      console.error(`[Session] 세션 시작 실패: ${sessionId}`, error.message);
      throw error;
    }
  }
  
  /**
   * 웹캠 벡터 추가
   */
  async pushWebcamVector(sessionId, webcamVector) {
    try {
      if (this.useRedis) {
        const sessionKey = `session:${sessionId}`;
        const vectorKey = `vectors:${sessionId}`;
        
        const exists = await this.redis.exists(sessionKey);
        if (!exists) {
          console.warn(`[Session] 세션이 없어 자동 생성: ${sessionId}`);
          await this.startSession(sessionId);
        }
        
        await this.redis.rpush(vectorKey, JSON.stringify(webcamVector));
        await this.redis.hincrby(sessionKey, 'frameCount', 1);
        await this.redis.expire(vectorKey, 3600);
        
        const frameCount = await this.redis.hget(sessionKey, 'frameCount');
        console.log(`[Session] 벡터 추가: ${sessionId} (프레임: ${frameCount})`);
      } else {
        // 메모리 기반
        let session = this.memoryStore.get(sessionId);
        if (!session) {
          console.warn(`[Session] 세션이 없어 자동 생성: ${sessionId}`);
          await this.startSession(sessionId);
          session = this.memoryStore.get(sessionId);
        }
        
        session.vectors.push(webcamVector);
        session.frameCount = session.vectors.length;
        console.log(`[Session] 벡터 추가: ${sessionId} (프레임: ${session.frameCount})`);
      }
    } catch (error) {
      console.error(`[Session] 벡터 추가 실패: ${sessionId}`, error.message);
      throw error;
    }
  }
  
  /**
   * 세션 종료
   */
  async stopSession(sessionId) {
    try {
      if (this.useRedis) {
        const sessionKey = `session:${sessionId}`;
        await this.redis.hset(sessionKey, 'isRecording', 'false');
      } else {
        const session = this.memoryStore.get(sessionId);
        if (session) {
          session.isRecording = false;
        }
      }
      console.log(`[Session] 세션 종료: ${sessionId}`);
    } catch (error) {
      console.error(`[Session] 세션 종료 실패: ${sessionId}`, error.message);
    }
  }
  
  /**
   * 웹캠 데이터 가져오기
   */
  async getWebcamData(sessionId) {
    try {
      if (this.useRedis) {
        const vectorKey = `vectors:${sessionId}`;
        const vectors = await this.redis.lrange(vectorKey, 0, -1);
        console.log(`[Session] 웹캠 데이터 조회: ${sessionId} (${vectors.length}개 프레임)`);
        return vectors.map(v => JSON.parse(v));
      } else {
        const session = this.memoryStore.get(sessionId);
        const vectors = session ? session.vectors : [];
        console.log(`[Session] 웹캠 데이터 조회: ${sessionId} (${vectors.length}개 프레임)`);
        return vectors;
      }
    } catch (error) {
      console.error(`[Session] 웹캠 데이터 조회 실패: ${sessionId}`, error.message);
      return [];
    }
  }
  
  /**
   * 세션 삭제
   */
  async deleteSession(sessionId) {
    try {
      if (this.useRedis) {
        const sessionKey = `session:${sessionId}`;
        const vectorKey = `vectors:${sessionId}`;
        await this.redis.del(sessionKey);
        await this.redis.del(vectorKey);
      } else {
        this.memoryStore.delete(sessionId);
      }
      console.log(`[Session] 세션 삭제: ${sessionId}`);
    } catch (error) {
      console.error(`[Session] 세션 삭제 실패: ${sessionId}`, error.message);
    }
  }
  
  /**
   * 세션 정보 조회
   */
  async getSessionInfo(sessionId) {
    try {
      if (this.useRedis) {
        const sessionKey = `session:${sessionId}`;
        const info = await this.redis.hgetall(sessionKey);
        
        if (!info || Object.keys(info).length === 0) {
          return null;
        }
        
        return {
          isRecording: info.isRecording === 'true',
          createdAt: parseInt(info.createdAt),
          frameCount: parseInt(info.frameCount)
        };
      } else {
        const session = this.memoryStore.get(sessionId);
        return session || null;
      }
    } catch (error) {
      console.error(`[Session] 세션 정보 조회 실패: ${sessionId}`, error.message);
      return null;
    }
  }
  
  /**
   * 만료된 세션 정리 (크론 작업용)
   */
  async cleanupExpiredSessions() {
    try {
      const pattern = 'session:*';
      const keys = await this.redis.keys(pattern);
      
      let cleanedCount = 0;
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) {
          // TTL이 없는 세션 삭제
          const sessionId = key.replace('session:', '');
          await this.deleteSession(sessionId);
          cleanedCount++;
        }
      }
      
      console.log(`[Session] 만료된 세션 정리: ${cleanedCount}개`);
      return cleanedCount;
    } catch (error) {
      console.error('[Session] 세션 정리 실패:', error.message);
      return 0;
    }
  }
  
  /**
   * Redis 연결 종료
   */
  async disconnect() {
    try {
      await this.redis.quit();
      console.log('[Redis] 연결 종료');
    } catch (error) {
      console.error('[Redis] 연결 종료 실패:', error.message);
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
const sessionService = new SessionService();

module.exports = sessionService;
