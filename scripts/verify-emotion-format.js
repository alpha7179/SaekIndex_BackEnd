#!/usr/bin/env node
/**
 * 설문조사 및 감정 분석 결과 포맷 검증 스크립트
 * 제공된 JSON 예시와 실제 데이터베이스의 데이터 구조가 일치하는지 확인합니다.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Survey 모델 임포트
const Survey = require('../src/models/survey.model');

// 예시 JSON 구조 (검증 기준)
const EXPECTED_STRUCTURE = {
  survey: {
    surveyDominantEmotion: 'string',
    surveyWeight: 'number',
    angry: 'number',
    sad: 'number',
    neutral: 'number',
    happy: 'number',
    surprise: 'number'
  },
  expression: {
    expressionDominantEmotion: 'string',
    expressionWeight: 'number',
    angry: 'number',
    sad: 'number',
    neutral: 'number',
    happy: 'number',
    surprise: 'number'
  },
  total: {
    dominantEmotion: 'string',
    angry: 'number',
    sad: 'number',
    neutral: 'number',
    happy: 'number',
    surprise: 'number'
  },
  topLevel: {
    _id: 'object',
    userId: 'number',
    date: 'string',
    name: 'string',
    age: 'number',
    isViewed: 'boolean',
    createdAt: 'object',
    updatedAt: 'object'
  }
};

/**
 * 객체의 필드 타입 검증
 */
function validateFieldType(value, expectedType) {
  if (expectedType === 'object' && value !== null) {
    return typeof value === 'object' && !Array.isArray(value);
  }
  if (expectedType === 'string') {
    return typeof value === 'string';
  }
  if (expectedType === 'number') {
    return typeof value === 'number' && !isNaN(value);
  }
  if (expectedType === 'boolean') {
    return typeof value === 'boolean';
  }
  return false;
}

/**
 * 감정 객체 구조 검증
 */
function validateEmotionObject(obj, expectedFields, objectName) {
  const issues = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push(`${objectName} 객체가 없거나 유효하지 않습니다.`);
    return issues;
  }
  
  for (const [field, expectedType] of Object.entries(expectedFields)) {
    if (!(field in obj)) {
      issues.push(`${objectName}.${field} 필드가 없습니다.`);
    } else if (!validateFieldType(obj[field], expectedType)) {
      issues.push(`${objectName}.${field} 필드의 타입이 올바르지 않습니다. (예상: ${expectedType}, 실제: ${typeof obj[field]})`);
    }
  }
  
  // 예상하지 않은 필드가 있는지 확인
  const unexpectedFields = Object.keys(obj).filter(key => !(key in expectedFields));
  if (unexpectedFields.length > 0) {
    issues.push(`${objectName}에 예상하지 않은 필드가 있습니다: ${unexpectedFields.join(', ')}`);
  }
  
  return issues;
}

/**
 * 설문 문서 검증
 */
function validateSurveyDocument(doc) {
  const issues = [];
  
  // 최상위 필드 검증
  const topLevelIssues = validateEmotionObject(doc, EXPECTED_STRUCTURE.topLevel, '최상위');
  issues.push(...topLevelIssues);
  
  // survey 객체 검증
  const surveyIssues = validateEmotionObject(doc.survey, EXPECTED_STRUCTURE.survey, 'survey');
  issues.push(...surveyIssues);
  
  // expression 객체 검증
  const expressionIssues = validateEmotionObject(doc.expression, EXPECTED_STRUCTURE.expression, 'expression');
  issues.push(...expressionIssues);
  
  // total 객체 검증
  const totalIssues = validateEmotionObject(doc.total, EXPECTED_STRUCTURE.total, 'total');
  issues.push(...totalIssues);
  
  return issues;
}

/**
 * 메인 검증 함수
 */
async function verifyEmotionFormat() {
  try {
    console.log('🔍 설문조사 및 감정 분석 결과 포맷 검증 시작...\n');
    
    // MongoDB 연결
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saekindex';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB 연결 성공\n');
    
    // 감정 데이터가 있는 설문만 조회
    const surveys = await Survey.find({
      $or: [
        { 'survey.surveyDominantEmotion': { $exists: true } },
        { 'expression.expressionDominantEmotion': { $exists: true } },
        { 'total.dominantEmotion': { $exists: true } }
      ]
    })
    .limit(10)
    .lean()
    .exec();
    
    console.log(`📊 감정 데이터가 있는 설문: ${surveys.length}개\n`);
    
    if (surveys.length === 0) {
      console.log('⚠️  감정 데이터가 포함된 설문이 없습니다.');
      console.log('   실제 설문을 생성한 후 다시 검증해주세요.\n');
      return;
    }
    
    let validCount = 0;
    let invalidCount = 0;
    const allIssues = [];
    
    // 각 설문 검증
    surveys.forEach((survey, index) => {
      console.log(`\n📄 설문 ${index + 1} (ID: ${survey._id}):`);
      console.log(`   이름: ${survey.name}, 날짜: ${survey.date}`);
      
      const issues = validateSurveyDocument(survey);
      
      if (issues.length === 0) {
        console.log('   ✅ 포맷 검증 통과');
        validCount++;
        
        // 샘플 데이터 출력
        if (index === 0) {
          console.log('\n   📋 샘플 데이터 구조:');
          console.log('   survey:', JSON.stringify(survey.survey, null, 2).split('\n').map(l => '   ' + l).join('\n'));
          console.log('   expression:', JSON.stringify(survey.expression, null, 2).split('\n').map(l => '   ' + l).join('\n'));
          console.log('   total:', JSON.stringify(survey.total, null, 2).split('\n').map(l => '   ' + l).join('\n'));
        }
      } else {
        console.log('   ❌ 포맷 검증 실패:');
        issues.forEach(issue => {
          console.log(`      - ${issue}`);
        });
        invalidCount++;
        allIssues.push({
          id: survey._id,
          name: survey.name,
          issues
        });
      }
    });
    
    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 검증 결과 요약');
    console.log('='.repeat(60));
    console.log(`✅ 검증 통과: ${validCount}개`);
    console.log(`❌ 검증 실패: ${invalidCount}개`);
    console.log(`📈 통과율: ${surveys.length > 0 ? Math.round((validCount / surveys.length) * 100) : 0}%`);
    
    if (allIssues.length > 0) {
      console.log('\n⚠️  발견된 이슈:');
      allIssues.forEach(({ id, name, issues }) => {
        console.log(`\n   설문 ID: ${id} (${name})`);
        issues.forEach(issue => console.log(`   - ${issue}`));
      });
    }
    
    // 예시 JSON과 비교
    console.log('\n' + '='.repeat(60));
    console.log('📋 예시 JSON 구조 비교');
    console.log('='.repeat(60));
    console.log('예시에서 사용된 감정 값: "calm"');
    console.log('코드에서 사용하는 감정 값: "neutral"');
    console.log('\n⚠️  참고: 예시의 "calm"은 코드의 "neutral"과 동일한 의미로 보입니다.');
    console.log('   실제 데이터베이스에서는 "neutral"이 사용됩니다.\n');
    
  } catch (error) {
    console.error('❌ 검증 중 오류 발생:', error);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  verifyEmotionFormat()
    .then(() => {
      console.log('\n✅ 검증 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 검증 실패:', error);
      process.exit(1);
    });
}

module.exports = { verifyEmotionFormat, validateSurveyDocument };

