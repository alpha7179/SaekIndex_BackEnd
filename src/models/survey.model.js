// src/models/survey.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * 설문 응답 데이터 모델
 * 8개의 심리 평가 질문에 대한 1-5 척도 응답을 저장
 */

// 값 정규화 함수 - 중복 코드 제거
const normalizeQuestionValue = (value) => {
  if (Array.isArray(value)) {
    return Math.max(1, Math.min(5, parseInt(value[0]) || 1));
  }
  return Math.max(1, Math.min(5, parseInt(value) || 1));
};

// 질문 필드 스키마 생성 함수 - DRY 원칙 적용
const createQuestionField = (questionNumber) => ({
  type: Number,
  required: [true, `question${questionNumber} is required`],
  min: [1, `question${questionNumber} must be at least 1`],
  max: [5, `question${questionNumber} must be at most 5`],
  set: normalizeQuestionValue,
  validate: {
    validator: (value) => Number.isInteger(value) && value >= 1 && value <= 5,
    message: (props) => `question${questionNumber} must be an integer between 1 and 5`
  }
});

const SurveySchema = new Schema({
  submissionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Submission',
    index: true
  },
  userId: { 
    type: Number, 
    required: [true, 'userId is required'],
    min: [0, 'userId must be at least 0'], 
    max: [9999, 'userId must be at most 9999'],
    index: true
  },
  date: { 
    type: String, 
    required: [true, 'date is required'],
    validate: {
      validator: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
      message: 'date must be in YYYY-MM-DD format'
    },
    index: true
  },
  name: { 
    type: String, 
    required: [true, 'name is required'],
    trim: true,
    maxlength: [100, 'name cannot exceed 100 characters']
  },
  age: { 
    type: Number, 
    required: [true, 'age is required'],
    min: [1, 'age must be at least 1'], 
    max: [100, 'age must be at most 100'],
    index: true
  },
  
  // 8개 심리 평가 질문 (1-5 척도)
  question1: createQuestionField(1),
  question2: createQuestionField(2),
  question3: createQuestionField(3),
  question4: createQuestionField(4),
  question5: createQuestionField(5),
  question6: createQuestionField(6),
  question7: createQuestionField(7),
  question8: createQuestionField(8),
  
  // 감상 여부 (시각화 확인 여부)
  isViewed: { 
    type: Boolean, 
    default: false,
    index: true
  }
}, { 
  timestamps: true,
  strict: true,
  collection: 'surveys',
  // 성능 최적화를 위한 인덱스 설정
  index: [
    { createdAt: -1 },
    { date: 1, createdAt: -1 },
    { age: 1 },
    { isViewed: 1 }
  ]
});

// 가상 필드: 연령대 계산
SurveySchema.virtual('ageGroup').get(function() {
  const age = this.age;
  if (age <= 19) return '10대 이하';
  if (age <= 29) return '20대';
  if (age <= 39) return '30대';
  if (age <= 49) return '40대';
  if (age <= 59) return '50대';
  if (age <= 69) return '60대';
  if (age <= 79) return '70대';
  return '80대 이상';
});

// 가상 필드: 심리 점수 평균
SurveySchema.virtual('averageScore').get(function() {
  const scores = [
    this.question1, this.question2, this.question3, this.question4,
    this.question5, this.question6, this.question7, this.question8
  ];
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round((sum / scores.length) * 100) / 100; // 소수점 2자리
});

// 인스턴스 메서드: 긍정적 응답 비율 계산
SurveySchema.methods.getPositiveRatio = function() {
  const scores = [
    this.question1, this.question2, this.question3, this.question4,
    this.question5, this.question6, this.question7, this.question8
  ];
  const positiveCount = scores.filter(score => score >= 4).length;
  return Math.round((positiveCount / scores.length) * 100);
};

// 정적 메서드: 연령대별 통계
SurveySchema.statics.getAgeGroupStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $lte: ['$age', 19] }, then: '10대 이하' },
              { case: { $lte: ['$age', 29] }, then: '20대' },
              { case: { $lte: ['$age', 39] }, then: '30대' },
              { case: { $lte: ['$age', 49] }, then: '40대' },
              { case: { $lte: ['$age', 59] }, then: '50대' },
              { case: { $lte: ['$age', 69] }, then: '60대' },
              { case: { $lte: ['$age', 79] }, then: '70대' }
            ],
            default: '80대 이상'
          }
        },
        count: { $sum: 1 },
        averageScore: {
          $avg: {
            $divide: [
              { $add: ['$question1', '$question2', '$question3', '$question4', 
                      '$question5', '$question6', '$question7', '$question8'] },
              8
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// pre-save 미들웨어: 데이터 검증 및 정규화
SurveySchema.pre('save', function(next) {
  // isViewed 기본값 설정
  if (this.isViewed === undefined || this.isViewed === null) {
    this.isViewed = false;
  }
  
  // 이름 정규화
  if (this.name) {
    this.name = this.name.trim();
  }
  
  next();
});

// 모델 캐시 정리 (개발 환경에서만)
if (process.env.NODE_ENV !== 'production') {
  if (mongoose.models.Survey) {
    delete mongoose.models.Survey;
  }
  if (mongoose.modelSchemas && mongoose.modelSchemas.Survey) {
    delete mongoose.modelSchemas.Survey;
  }
}

module.exports = mongoose.model('Survey', SurveySchema, 'surveys');