#!/usr/bin/env node
/**
 * 설문 저장 테스트 스크립트
 * 실제로 설문 데이터가 저장되는지 테스트합니다.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Survey 모델 임포트
const Survey = require('../src/models/survey.model');

async function testSurveySave() {
  try {
    console.log('🧪 설문 저장 테스트 시작...\n');
    
    // MongoDB 연결
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saekindex';
    console.log('📡 MongoDB 연결 시도:', mongoUri.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB 연결 성공\n');
    
    // 테스트 데이터 생성 (감정 데이터 포함)
    const testSurvey = {
      userId: 9999,
      date: new Date().toISOString().split('T')[0],
      name: '테스트 사용자',
      age: 25,
      question1: 1,
      question2: 2,
      question3: 3,
      question4: 4,
      question5: 5,
      question6: 1,
      question7: 2,
      question8: 3,
      isViewed: false,
      survey: {
        surveyDominantEmotion: 'neutral',
        surveyWeight: 0.5,
        angry: 0.2,
        sad: 0.2,
        neutral: 0.2,
        happy: 0.2,
        surprise: 0.2
      },
      expression: {
        expressionDominantEmotion: 'neutral',
        expressionWeight: 0.5,
        angry: 0.2,
        sad: 0.2,
        neutral: 0.2,
        happy: 0.2,
        surprise: 0.2
      },
      total: {
        dominantEmotion: 'neutral',
        angry: 0.2,
        sad: 0.2,
        neutral: 0.2,
        happy: 0.2,
        surprise: 0.2
      }
    };
    
    console.log('📝 테스트 데이터:', JSON.stringify(testSurvey, null, 2));
    console.log('\n💾 설문 저장 시도...\n');
    
    // 설문 저장
    const survey = new Survey(testSurvey);
    const savedSurvey = await survey.save();
    
    console.log('✅ 설문 저장 성공!');
    console.log('📋 저장된 설문 ID:', savedSurvey._id);
    console.log('📊 감정 데이터 포함 여부:', {
      hasSurvey: !!savedSurvey.survey,
      hasExpression: !!savedSurvey.expression,
      hasTotal: !!savedSurvey.total
    });
    
    // 저장된 데이터 확인
    const retrievedSurvey = await Survey.findById(savedSurvey._id).lean();
    console.log('\n📖 데이터베이스에서 조회한 설문:');
    console.log('  ID:', retrievedSurvey._id);
    console.log('  이름:', retrievedSurvey.name);
    console.log('  감정 데이터:', {
      survey: retrievedSurvey.survey,
      expression: retrievedSurvey.expression,
      total: retrievedSurvey.total
    });
    
    // 테스트 데이터 삭제
    await Survey.findByIdAndDelete(savedSurvey._id);
    console.log('\n🗑️  테스트 데이터 삭제 완료');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.name === 'ValidationError') {
      console.error('📋 Validation 에러 상세:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    if (error.stack) {
      console.error('\n스택 트레이스:');
      console.error(error.stack);
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  testSurveySave()
    .then(() => {
      console.log('\n✅ 테스트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 테스트 실패:', error);
      process.exit(1);
    });
}

module.exports = { testSurveySave };

