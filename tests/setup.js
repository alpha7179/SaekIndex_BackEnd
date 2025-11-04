/**
 * Jest 테스트 환경 설정
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// 테스트 시작 전 설정
beforeAll(async () => {
  // 인메모리 MongoDB 서버 시작
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Mongoose 연결
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('🧪 테스트 데이터베이스 연결 완료');
});

// 각 테스트 후 데이터 정리
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// 테스트 완료 후 정리
afterAll(async () => {
  // Mongoose 연결 해제
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // 인메모리 MongoDB 서버 종료
  await mongoServer.stop();
  
  console.log('🧪 테스트 데이터베이스 정리 완료');
});

// 테스트 타임아웃 설정
jest.setTimeout(30000);