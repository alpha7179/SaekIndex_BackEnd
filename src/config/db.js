/**
 * MongoDB 데이터베이스 연결 설정
 */
const mongoose = require('mongoose');

// 연결 상태 추적
let isConnected = false;

/**
 * MongoDB 연결 옵션
 */
const getConnectionOptions = () => ({
  // 인덱스 관리
  autoIndex: process.env.NODE_ENV !== 'production',
  
  // 연결 풀 설정
  maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
  minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
  
  // 타임아웃 설정
  serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_TIMEOUT) || 10000,
  socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
  connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
  
  // 재연결 설정
  maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 30000,
  
  // 네트워크 설정
  family: 4, // IPv4 사용
  
  // 버퍼링 설정
  bufferMaxEntries: 0,
  bufferCommands: false,
  
  // 기타 설정
  retryWrites: true,
  w: 'majority'
});

/**
 * MongoDB 연결
 * @param {string} uri - MongoDB 연결 문자열
 * @param {string} dbName - 데이터베이스 이름 (선택사항)
 */
async function connectDB(uri, dbName) {
  try {
    // 환경 변수 검증
    if (!uri) {
      throw new Error('MONGODB_URI가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
    }
    
    // 이미 연결된 경우 스킵
    if (isConnected && mongoose.connection.readyState === 1) {
      console.log('[MongoDB] 이미 연결되어 있습니다.');
      return;
    }
    
    console.log('[MongoDB] 연결 시도 중...');
    
    // 연결 옵션 설정
    const options = getConnectionOptions();
    if (dbName) {
      options.dbName = dbName;
    }
    
    // MongoDB 연결
    await mongoose.connect(uri, options);
    
    isConnected = true;
    console.log(`[MongoDB] 연결 성공: ${mongoose.connection.name || 'default'}`);
    console.log(`[MongoDB] 호스트: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
  } catch (error) {
    console.error('[MongoDB] 연결 실패:', error.message);
    isConnected = false;
    throw error;
  }
}

/**
 * MongoDB 연결 해제
 * @param {boolean} force - 강제 종료 여부
 */
async function closeDB(force = false) {
  try {
    if (!isConnected || mongoose.connection.readyState === 0) {
      console.log('[MongoDB] 이미 연결이 해제되어 있습니다.');
      return;
    }
    
    console.log('[MongoDB] 연결 해제 중...');
    
    await mongoose.connection.close(force);
    isConnected = false;
    
    console.log('[MongoDB] 연결이 정상적으로 해제되었습니다.');
    
  } catch (error) {
    console.error('[MongoDB] 연결 해제 중 오류:', error.message);
    throw error;
  }
}

/**
 * 연결 상태 확인
 */
function getConnectionStatus() {
  const state = mongoose.connection.readyState;
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    isConnected,
    state,
    status: stateMap[state] || 'unknown',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
}

/**
 * 연결 이벤트 리스너 설정
 */
function setupConnectionListeners() {
  // 연결 성공
  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log(`[MongoDB] 연결됨: ${mongoose.connection.name}`);
  });
  
  // 연결 해제
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.log('[MongoDB] 연결 해제됨');
  });
  
  // 연결 오류
  mongoose.connection.on('error', (error) => {
    isConnected = false;
    console.error('[MongoDB] 연결 오류:', error.message);
  });
  
  // 재연결 시도
  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('[MongoDB] 재연결됨');
  });
  
  // 연결 끊김 (네트워크 문제 등)
  mongoose.connection.on('close', () => {
    isConnected = false;
    console.log('[MongoDB] 연결 종료됨');
  });
  
  // 전체 연결 끊김
  mongoose.connection.on('fullsetup', () => {
    console.log('[MongoDB] 전체 연결 설정 완료');
  });
}

/**
 * 데이터베이스 상태 모니터링
 */
async function checkDatabaseHealth() {
  try {
    if (mongoose.connection.readyState !== 1) {
      return {
        status: 'unhealthy',
        message: '데이터베이스에 연결되지 않음',
        details: getConnectionStatus()
      };
    }
    
    // 간단한 ping 테스트
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      message: '데이터베이스 연결 정상',
      details: getConnectionStatus()
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `데이터베이스 상태 확인 실패: ${error.message}`,
      details: getConnectionStatus()
    };
  }
}

// 연결 이벤트 리스너 설정
setupConnectionListeners();

module.exports = {
  connectDB,
  closeDB,
  getConnectionStatus,
  checkDatabaseHealth,
  isConnected: () => isConnected
};