// src/models/survey.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SurveySchema = new Schema({
  submissionId: { type: Schema.Types.ObjectId, ref: 'Submission' },
  userId: { type: Number, required: true, min: 0, max: 9999 },
  date: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  
  // 새로운 8개 심리 평가 질문들
  question1: String,  // 사람들과 함께 있을 때, 오히려 혼자라고 느낀 적이 있나요?
  question2: String,  // 사소한 순간이 좋게 느껴진 적이 있나요?
  question3: String,  // 최근에 소리지르고 싶었던 적이 있나요?
  question4: String,  // 최근에 멈칫했던 순간이 있었나요?
  question5: String,  // 괜히 조용해지고 싶은 날이 있었나요?
  question6: String,  // 최근에 시간이 빨리 가나요?
  question7: String,  // 똑같은 일이 반복돼서 답답했던 적이 있나요?
  question8: String,  // 별일 아닌데 순간적으로 심장이 빨리 뛴 적이 있나요?
}, { timestamps: true });

module.exports = mongoose.models.Survey || mongoose.model('Survey', SurveySchema);