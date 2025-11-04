/**
 * 서버 진입점
 * SaekIndex 백엔드 API 서버
 */

// 환경 변수 로드
require('dotenv').config();

const { connectDB, closeDB, checkDatabaseHealth } = require('./src/config/db');
const createApp = require('./src/app');

// 서버 설정
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

// Express 앱 생성
const app = createApp();
let server = null;

/**
 * 서버 시작
 */
async function startServer() {
  try {
    console.log('🚀 SaekIndex 백엔드 서버 시작 중...');
    console.log(`📍 환경: ${NODE_ENV}`);
    console.log(`🔌 포트: ${PORT}`);
    
    // 환경 변수 검증
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI 환경 변수가 설정되지 않았습니다.');
    }
    
    // 데이터베이스 연결
    console.log('🗄️  데이터베이스 연결 중...');
    await connectDB(MONGODB_URI, DB_NAME);
    
    // 데이터베이스 상태 확인
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.status !== 'healthy') {
      console.warn('⚠️  데이터베이스 상태 경고:', dbHealth.message);
    } else {
      console.log('✅ 데이터베이스 연결 정상');
    }
    
    // HTTP 서버 시작
    if (require.main === module) {
      server = app.listen(PORT, () => {
        console.log('🎉 서버가 성공적으로 시작되었습니다!');
        console.log(`🌐 서버 주소: http://localhost:${PORT}`);
        console.log(`📊 헬스 체크: http://localhost:${PORT}/health`);
        console.log(`📋 API 문서: http://localhost:${PORT}/api/surveys`);
        console.log('⏹️  종료하려면 Ctrl+C를 누르세요');
      });
      
      // 서버 에러 처리
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ 포트 ${PORT}가 이미 사용 중입니다.`);
          console.error('다른 포트를 사용하거나 실행 중인 프로세스를 종료해주세요.');
        } else {
          console.error('❌ 서버 시작 실패:', error.message);
        }
        process.exit(1);
      });
      
      // 서버 시작 후 추가 설정
      server.on('listening', () => {
        const address = server.address();
        console.log(`📡 서버가 ${address.address}:${address.port}에서 수신 대기 중`);
        
        // 개발 환경에서만 추가 정보 출력
        if (NODE_ENV === 'development') {
          console.log('\n📝 개발 모드 활성화:');
          console.log('   - 상세한 로깅 활성화');
          console.log('   - 모든 도메인에서 CORS 허용');
          console.log('   - 에러 스택 트레이스 포함');
        }
      });
    }
    
  } catch (error) {
    console.error('💥 서버 시작 실패:', error.message);
    
    if (error.message.includes('MONGODB_URI')) {
      console.error('\n🔧 해결 방법:');
      console.error('1. .env 파일에 MONGODB_URI를 설정하세요');
      console.error('2. MongoDB Atlas 연결 문자열을 확인하세요');
      console.error('3. 네트워크 연결을 확인하세요');
    }
    
    process.exit(1);
  }
}

/**
 * 서버 종료 (Graceful Shutdown)
 */
async function stopServer(signal) {
  console.log(`\n🛑 ${signal} 신호를 받았습니다. 서버를 안전하게 종료합니다...`);
  
  try {
    // HTTP 서버 종료
    if (server) {
      console.log('🔌 HTTP 서버 종료 중...');
      await new Promise((resolve) => {
        server.close(resolve);
      });
      console.log('✅ HTTP 서버 종료 완료');
    }
    
    // 데이터베이스 연결 종료
    console.log('🗄️  데이터베이스 연결 종료 중...');
    await closeDB();
    console.log('✅ 데이터베이스 연결 종료 완료');
    
    console.log('👋 서버가 안전하게 종료되었습니다.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 서버 종료 중 오류:', error.message);
    process.exit(1);
  }
}

/**
 * 예외 처리
 */
process.on('uncaughtException', (error) => {
  console.error('💥 처리되지 않은 예외:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 처리되지 않은 Promise 거부:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

/**
 * 시그널 처리 (Graceful Shutdown)
 */
process.on('SIGINT', () => stopServer('SIGINT'));
process.on('SIGTERM', () => stopServer('SIGTERM'));

// Windows에서의 Ctrl+C 처리
if (process.platform === 'win32') {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.on('SIGINT', () => {
    process.emit('SIGINT');
  });
}

/**
 * 개발 환경에서의 추가 설정
 */
if (NODE_ENV === 'development') {
  // 파일 변경 감지 (nodemon 사용 시)
  process.on('SIGUSR2', () => {
    console.log('🔄 파일 변경 감지됨. 서버를 재시작합니다...');
    stopServer('SIGUSR2');
  });
}

// 서버 시작
startServer();

// 모듈로 사용할 때를 위한 export
module.exports = app;