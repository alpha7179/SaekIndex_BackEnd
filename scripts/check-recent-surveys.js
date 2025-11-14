#!/usr/bin/env node
/**
 * 최근 설문 데이터 확인 스크립트
 * 데이터베이스에 저장된 최근 설문과 감정 데이터를 확인합니다.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Survey 모델 임포트
const Survey = require('../src/models/survey.model');

async function checkRecentSurveys() {
  try {
    console.log('🔍 최근 설문 데이터 확인 중...\n');
    
    // MongoDB 연결
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saekindex';
    console.log('📡 MongoDB 연결 시도:', mongoUri.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB 연결 성공\n');
    
    // 최근 5개 설문 조회
    const recentSurveys = await Survey.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .exec();
    
    console.log(`📊 총 설문 수: ${await Survey.countDocuments({})}개`);
    console.log(`📋 최근 설문: ${recentSurveys.length}개\n`);
    
    if (recentSurveys.length === 0) {
      console.log('⚠️  데이터베이스에 설문 데이터가 없습니다.\n');
      return;
    }
    
    // 각 설문 상세 확인
    recentSurveys.forEach((survey, index) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📄 설문 ${index + 1} (ID: ${survey._id})`);
      console.log('='.repeat(60));
      console.log(`이름: ${survey.name}`);
      console.log(`나이: ${survey.age}`);
      console.log(`날짜: ${survey.date}`);
      console.log(`생성일: ${survey.createdAt}`);
      console.log(`감상여부: ${survey.isViewed ? '✅' : '❌'}`);
      
      // 감정 데이터 확인
      console.log('\n📊 감정 데이터:');
      
      if (survey.survey && survey.survey.surveyDominantEmotion) {
        console.log('  ✅ survey 객체 존재');
        console.log(`     - 주 감정: ${survey.survey.surveyDominantEmotion}`);
        console.log(`     - 가중치: ${survey.survey.surveyWeight}`);
        console.log(`     - 감정 점수: angry=${survey.survey.angry}, sad=${survey.survey.sad}, neutral=${survey.survey.neutral}, happy=${survey.survey.happy}, surprise=${survey.survey.surprise}`);
      } else {
        console.log('  ❌ survey 객체 없음 또는 불완전');
        console.log('     survey:', JSON.stringify(survey.survey, null, 2));
      }
      
      if (survey.expression && survey.expression.expressionDominantEmotion) {
        console.log('  ✅ expression 객체 존재');
        console.log(`     - 주 감정: ${survey.expression.expressionDominantEmotion}`);
        console.log(`     - 가중치: ${survey.expression.expressionWeight}`);
        console.log(`     - 감정 점수: angry=${survey.expression.angry}, sad=${survey.expression.sad}, neutral=${survey.expression.neutral}, happy=${survey.expression.happy}, surprise=${survey.expression.surprise}`);
      } else {
        console.log('  ❌ expression 객체 없음 또는 불완전');
        console.log('     expression:', JSON.stringify(survey.expression, null, 2));
      }
      
      if (survey.total && survey.total.dominantEmotion) {
        console.log('  ✅ total 객체 존재');
        console.log(`     - 주 감정: ${survey.total.dominantEmotion}`);
        console.log(`     - 감정 점수: angry=${survey.total.angry}, sad=${survey.total.sad}, neutral=${survey.total.neutral}, happy=${survey.total.happy}, surprise=${survey.total.surprise}`);
      } else {
        console.log('  ❌ total 객체 없음 또는 불완전');
        console.log('     total:', JSON.stringify(survey.total, null, 2));
      }
      
      // 질문 응답 확인
      console.log('\n📝 질문 응답:');
      for (let i = 1; i <= 8; i++) {
        const q = `question${i}`;
        if (survey[q] !== undefined) {
          console.log(`   ${q}: ${survey[q]}`);
        }
      }
    });
    
    // 감정 데이터가 없는 설문 개수 확인
    const surveysWithoutEmotion = await Survey.countDocuments({
      $or: [
        { 'survey.surveyDominantEmotion': { $exists: false } },
        { 'survey.surveyDominantEmotion': null },
        { 'expression.expressionDominantEmotion': { $exists: false } },
        { 'expression.expressionDominantEmotion': null },
        { 'total.dominantEmotion': { $exists: false } },
        { 'total.dominantEmotion': null }
      ]
    });
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 통계');
    console.log('='.repeat(60));
    console.log(`전체 설문: ${await Survey.countDocuments({})}개`);
    console.log(`감정 데이터 없는 설문: ${surveysWithoutEmotion}개`);
    console.log(`감정 데이터 있는 설문: ${await Survey.countDocuments({}) - surveysWithoutEmotion}개`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  checkRecentSurveys()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { checkRecentSurveys };

