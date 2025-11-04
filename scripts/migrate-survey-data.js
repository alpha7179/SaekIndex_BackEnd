// scripts/migrate-survey-data.js
// 이전 설문 데이터 모델을 새로운 모델로 마이그레이션하는 스크립트

const mongoose = require('mongoose');
require('dotenv').config();

// 기존 Survey 모델 (마이그레이션 전)
const OldSurveySchema = new mongoose.Schema({
  userId: { type: Number },
  date: { type: String },
  name: { type: String },
  age: { type: Number },
  question1: { type: mongoose.Schema.Types.Mixed }, // 배열 또는 숫자
  question2: { type: Number },
  question3: { type: Number },
  question4: { type: Number },
  question5: { type: Number },
  question6: { type: Number },
  question7: { type: Number },
  question8: { type: Number },
}, { timestamps: true });

// 새로운 Survey 모델 (마이그레이션 후)
const NewSurveySchema = new mongoose.Schema({
  userId: { type: Number, required: true, min: 0, max: 9999 },
  date: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 1, max: 100 },
  question1: { type: Number, required: true, min: 1, max: 5 },
  question2: { type: Number, required: true, min: 1, max: 5 },
  question3: { type: Number, required: true, min: 1, max: 5 },
  question4: { type: Number, required: true, min: 1, max: 5 },
  question5: { type: Number, required: true, min: 1, max: 5 },
  question6: { type: Number, required: true, min: 1, max: 5 },
  question7: { type: Number, required: true, min: 1, max: 5 },
  question8: { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });

const OldSurvey = mongoose.model('OldSurvey', OldSurveySchema, 'surveys');
const NewSurvey = mongoose.model('NewSurvey', NewSurveySchema, 'surveys');

async function migrateSurveyData() {
  try {
    console.log('🚀 데이터 마이그레이션을 시작합니다...');
    
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saekindex');
    console.log('✅ MongoDB 연결 성공');

    // 모든 기존 설문 데이터 조회
    const oldSurveys = await OldSurvey.find({});
    console.log(`📊 총 ${oldSurveys.length}개의 설문 데이터를 발견했습니다.`);

    if (oldSurveys.length === 0) {
      console.log('ℹ️  마이그레이션할 데이터가 없습니다.');
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const oldSurvey of oldSurveys) {
      try {
        const migratedData = {
          _id: oldSurvey._id,
          userId: oldSurvey.userId || 0,
          date: oldSurvey.date || new Date().toISOString().split('T')[0],
          name: oldSurvey.name || 'Unknown',
          age: Math.max(1, Math.min(100, oldSurvey.age || 25)),
          createdAt: oldSurvey.createdAt,
          updatedAt: oldSurvey.updatedAt
        };

        // question1 특별 처리 (배열인 경우 첫 번째 값 사용)
        if (Array.isArray(oldSurvey.question1)) {
          migratedData.question1 = Math.max(1, Math.min(5, oldSurvey.question1[0] || 1));
          console.log(`🔄 ID ${oldSurvey._id}: question1 배열 데이터 변환 [${oldSurvey.question1}] → ${migratedData.question1}`);
        } else {
          migratedData.question1 = Math.max(1, Math.min(5, oldSurvey.question1 || 1));
        }

        // 나머지 질문들 처리
        for (let i = 2; i <= 8; i++) {
          const questionField = `question${i}`;
          migratedData[questionField] = Math.max(1, Math.min(5, oldSurvey[questionField] || 1));
        }

        // 기존 문서 업데이트
        await NewSurvey.findByIdAndUpdate(
          oldSurvey._id,
          { $set: migratedData },
          { upsert: true, runValidators: true }
        );

        migratedCount++;
        
        if (migratedCount % 10 === 0) {
          console.log(`📈 진행률: ${migratedCount}/${oldSurveys.length} (${Math.round(migratedCount/oldSurveys.length*100)}%)`);
        }

      } catch (error) {
        console.error(`❌ ID ${oldSurvey._id} 마이그레이션 실패:`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎉 마이그레이션 완료!');
    console.log(`✅ 성공: ${migratedCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);
    
    if (errorCount === 0) {
      console.log('🔍 마이그레이션 검증 중...');
      const verificationCount = await NewSurvey.countDocuments();
      console.log(`📊 마이그레이션 후 총 문서 수: ${verificationCount}`);
    }

  } catch (error) {
    console.error('💥 마이그레이션 중 오류 발생:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateSurveyData()
    .then(() => {
      console.log('✨ 마이그레이션 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateSurveyData };