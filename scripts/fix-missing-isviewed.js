// scripts/fix-missing-isviewed.js
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saekindex';

async function fixMissingIsViewed() {
  try {
    console.log('MongoDB에 연결 중...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB 연결 성공');

    const db = mongoose.connection.db;
    const collection = db.collection('surveys');

    // isViewed 필드가 없는 모든 문서에 isViewed: false 추가
    const result = await collection.updateMany(
      { isViewed: { $exists: false } }, // isViewed 필드가 없는 문서들만
      { $set: { isViewed: false } }     // isViewed를 false로 설정
    );

    console.log(`${result.matchedCount}개의 문서를 찾았습니다.`);
    console.log(`${result.modifiedCount}개의 문서에 isViewed: false를 추가했습니다.`);

    // 결과 확인
    const totalCount = await collection.countDocuments();
    const viewedCount = await collection.countDocuments({ isViewed: true });
    const notViewedCount = await collection.countDocuments({ isViewed: false });

    console.log('\n=== 수정 결과 ===');
    console.log(`전체 설문: ${totalCount}개`);
    console.log(`감상 완료: ${viewedCount}개`);
    console.log(`감상 미완료: ${notViewedCount}개`);

    // 최근 설문들 확인
    console.log('\n=== 최근 설문 3개 확인 ===');
    const recentSurveys = await collection.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();
    
    recentSurveys.forEach((survey, index) => {
      console.log(`${index + 1}. ID: ${survey._id}, 이름: ${survey.name}, 감상여부: ${survey.isViewed}`);
    });

  } catch (error) {
    console.error('스크립트 실행 중 오류:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  fixMissingIsViewed();
}

module.exports = fixMissingIsViewed;