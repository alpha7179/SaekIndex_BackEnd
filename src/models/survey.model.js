// src/models/survey.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SurveySchema = new Schema({

  submissionId: { type: Schema.Types.ObjectId, ref: 'Submission' },
  date: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  question1: [String],
  question2: String,
  question3: String,
  question4: String,
}, { timestamps: true });

module.exports = mongoose.models.Survey || mongoose.model('Survey', SurveySchema);