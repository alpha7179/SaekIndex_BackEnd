// src/services/surveys.service.js
const Survey = require('../models/survey.model');

async function getAllSurveys(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;

    const totalSurveys = await Survey.countDocuments();

    const surveys = await Survey.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      surveys,
      totalSurveys,
      totalPages: Math.ceil(totalSurveys / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error('[SERVICE ERROR] in getAllSurveys:', error);
    throw error;
  }
}

async function createSurvey(payload) {
  const survey = new Survey(payload);
  await survey.save();
  return survey;
}

async function getSurveyStats() {
  const allSurveys = await Survey.find({});
  if (allSurveys.length === 0) {
    return {
      totalSurveys: 0,
      ageDistribution: [],
      heatmapData: [],
      dailyCount: [],
      hourlyCount: [],
      question1Distribution: {},
      question2Distribution: {},
      question3Distribution: {},
      message: "No data available."
    };
  }

  const ageDistribution = {};
  const dailyHourlyCount = {};
  const dailyCounts = {};
  const hourlyCounts = {};
  const question1Distribution = {};
  const question2Distribution = {};
  const question3Distribution = {};

  allSurveys.forEach(survey => {
    // 1. 연령대별 분포 집계
    const age = survey.age;
    if (age <= 19) ageDistribution['10대 이하'] = (ageDistribution['10대 이하'] || 0) + 1;
    else if (age >= 20 && age <= 29) ageDistribution['20대'] = (ageDistribution['20대'] || 0) + 1;
    else if (age >= 30 && age <= 39) ageDistribution['30대'] = (ageDistribution['30대'] || 0) + 1;
    else if (age >= 40 && age <= 49) ageDistribution['40대'] = (ageDistribution['40대'] || 0) + 1;
    else if (age >= 50 && age <= 59) ageDistribution['50대'] = (ageDistribution['50대'] || 0) + 1;
    else if (age >= 60 && age <= 69) ageDistribution['60대'] = (ageDistribution['60대'] || 0) + 1;
    else if (age >= 70 && age <= 79) ageDistribution['70대'] = (ageDistribution['70대'] || 0) + 1;
    else ageDistribution['80대 이상'] = (ageDistribution['80대 이상'] || 0) + 1;

    // 2. 날짜, 시간대별 데이터 집계
    const date = new Date(survey.createdAt).toISOString().split('T')[0];
    const hour = new Date(survey.createdAt).getHours();
    
    if (!dailyHourlyCount[date]) {
      dailyHourlyCount[date] = {};
    }
    dailyHourlyCount[date][hour] = (dailyHourlyCount[date][hour] || 0) + 1;
    
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;

    // 3. 문항별 응답 비율 집계
    if (Array.isArray(survey.question1)) {
      survey.question1.forEach(value => {
        question1Distribution[value] = (question1Distribution[value] || 0) + 1;
      });
    }
    if (survey.question2) {
      question2Distribution[survey.question2] = (question2Distribution[survey.question2] || 0) + 1;
    }
    if (survey.question3) {
      question3Distribution[survey.question3] = (question3Distribution[survey.question3] || 0) + 1;
    }
  });

  // 히트맵 데이터를 위한 배열 변환
  const heatmapData = [];
  Object.keys(dailyHourlyCount).forEach(date => {
    Object.keys(dailyHourlyCount[date]).forEach(hour => {
      heatmapData.push({
        date,
        hour: parseInt(hour),
        count: dailyHourlyCount[date][hour],
      });
    });
  });

  return {
    totalSurveys: allSurveys.length,
    ageDistribution: Object.entries(ageDistribution).map(([range, count]) => ({ range, count })).sort((a,b) => parseInt(a.range) - parseInt(b.range)),
    dailyCount: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })).sort((a, b) => new Date(a.date) - new Date(b.date)),
    hourlyCount: Object.entries(hourlyCounts).map(([hour, count]) => ({ hour: parseInt(hour), count })).sort((a, b) => a.hour - b.hour),
    question1Distribution,
    question2Distribution,
    question3Distribution,
    heatmapData
  };
}

async function updateSurvey(id, payload) {
  const updateData = Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== null && v !== undefined && v !== '')
  );
  return await Survey.findByIdAndUpdate(
    id, { $set: updateData }, { new: true, runValidators: true, lean: true }
  );
}

async function deleteSurvey(id) {
   console.log(`[DELETE SERVICE] ID: ${id}로 DB에서 문서를 찾아서 삭제를 시도합니다.`);
  try {
    const result = await Survey.findByIdAndDelete(id).lean();
    
    if (result) {
      console.log('[DELETE SERVICE] Mongoose가 성공적으로 문서를 찾아 삭제했습니다.');
    } else {
      console.log('[DELETE SERVICE] Mongoose가 해당 ID의 문서를 찾지 못했습니다. null을 반환합니다.');
    }
    return result;
  } catch (error) {
    console.error('[DELETE SERVICE] findByIdAndDelete 함수 실행 중 심각한 오류 발생:', error);
    throw error;
  }
}

module.exports = {
  createSurvey,
  getAllSurveys,
  getSurveyStats,
  updateSurvey,
  deleteSurvey,
};