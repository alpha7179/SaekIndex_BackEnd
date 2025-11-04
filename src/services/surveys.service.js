/**
 * 설문 서비스 - 비즈니스 로직 처리
 */
const Survey = require('../models/survey.model');
const logger = require('../utils/logger');
const { PAGINATION, SURVEY } = require('../utils/constants');
const {
  isValidObjectId,
  isValidDateFormat,
  normalizeQuestionResponse,
  normalizeAge,
  normalizeUserId,
  sanitizeString,
  normalizePagination
} = require('../utils/helpers');

/**
 * 페이지네이션된 설문 목록 조회
 * @param {number} page - 페이지 번호 (1부터 시작)
 * @param {number} limit - 페이지당 항목 수
 * @param {Object} filters - 필터 조건
 * @returns {Object} 페이지네이션된 설문 데이터
 */
async function getAllSurveys(page = 1, limit = PAGINATION.DEFAULT_LIMIT, filters = {}) {
  try {
    logger.debug('설문 목록 조회 시작', { page, limit, filters });
    
    // 입력값 검증 및 정규화
    const pagination = normalizePagination(page, limit);
    
    // 필터 조건 구성
    const query = buildQueryFilters(filters);
    
    logger.debug('쿼리 조건', { query, pagination });

    // 병렬 실행으로 성능 최적화
    const [surveys, totalSurveys] = await Promise.all([
      Survey.find(query)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .select('-__v') // 버전 필드 제외
        .exec(),
      Survey.countDocuments(query).exec()
    ]);

    const result = {
      surveys,
      totalSurveys,
      totalPages: Math.ceil(totalSurveys / pagination.limit),
      currentPage: pagination.page,
      pageSize: pagination.limit,
      hasNextPage: pagination.page < Math.ceil(totalSurveys / pagination.limit),
      hasPrevPage: pagination.page > 1
    };
    
    logger.info('설문 목록 조회 완료', { 
      totalSurveys, 
      returnedCount: surveys.length,
      currentPage: pagination.page 
    });
    
    return result;
    
  } catch (error) {
    logger.error('설문 목록 조회 실패', { error: error.message, page, limit, filters });
    throw new Error(`설문 목록 조회 실패: ${error.message}`);
  }
}

/**
 * 쿼리 필터 조건 구성
 * @param {Object} filters - 필터 조건
 * @returns {Object} MongoDB 쿼리 객체
 */
function buildQueryFilters(filters) {
  const query = {};

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.createdAt.$lte = new Date(filters.endDate);
    }
  }

  if (filters.minAge || filters.maxAge) {
    query.age = {};
    if (filters.minAge) {
      query.age.$gte = parseInt(filters.minAge);
    }
    if (filters.maxAge) {
      query.age.$lte = parseInt(filters.maxAge);
    }
  }

  if (filters.isViewed !== undefined) {
    query.isViewed = filters.isViewed === 'true' || filters.isViewed === true;
  }

  if (filters.name) {
    query.name = { $regex: filters.name, $options: 'i' };
  }

  return query;
}

/**
 * 새로운 설문 생성
 * @param {Object} payload - 설문 데이터
 * @returns {Object} 생성된 설문 객체
 */
async function createSurvey(payload) {
  try {
    // 입력 데이터 검증
    validateSurveyPayload(payload);
    
    // 데이터 정규화 및 변환
    const processedPayload = normalizeSurveyData(payload);
    
    console.log('[DEBUG] Creating survey with processed data:', processedPayload);
    
    // 설문 생성 및 저장
    const survey = new Survey(processedPayload);
    const savedSurvey = await survey.save();
    
    console.log('[DEBUG] Survey created successfully:', savedSurvey._id);
    return savedSurvey;
    
  } catch (error) {
    console.error('[SERVICE ERROR] createSurvey:', error);
    throw new Error(`설문 생성 실패: ${error.message}`);
  }
}

/**
 * 설문 데이터 유효성 검증
 * @param {Object} payload - 검증할 데이터
 */
function validateSurveyPayload(payload) {
  const requiredFields = ['name', 'age', 'date', ...SURVEY.QUESTION_FIELDS];
  
  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      throw new Error(`${field}는 필수 입력 항목입니다.`);
    }
  }
  
  // 날짜 형식 검증
  if (!isValidDateFormat(payload.date)) {
    throw new Error('날짜는 YYYY-MM-DD 형식이어야 합니다.');
  }
  
  // 이름 길이 검증
  if (payload.name && payload.name.length > SURVEY.MAX_NAME_LENGTH) {
    throw new Error(`이름은 ${SURVEY.MAX_NAME_LENGTH}자를 초과할 수 없습니다.`);
  }
}

/**
 * 설문 데이터 정규화
 * @param {Object} payload - 원본 데이터
 * @returns {Object} 정규화된 데이터
 */
function normalizeSurveyData(payload) {
  const processedPayload = { ...payload };
  
  // 이전 버전 호환성: question1이 배열인 경우 처리
  if (Array.isArray(payload.question1)) {
    logger.debug('레거시 배열 데이터 변환', { question1: payload.question1 });
    processedPayload.question1 = payload.question1[0] || 1;
  }
  
  // 숫자 필드 정규화
  processedPayload.userId = normalizeUserId(payload.userId);
  processedPayload.age = normalizeAge(payload.age);
  
  // 질문 응답 정규화
  SURVEY.QUESTION_FIELDS.forEach(field => {
    processedPayload[field] = normalizeQuestionResponse(payload[field]);
  });
  
  // 이름 정규화
  processedPayload.name = sanitizeString(payload.name, SURVEY.MAX_NAME_LENGTH);
  
  return processedPayload;
}



/**
 * 설문 통계 데이터 조회
 * @returns {Object} 통계 데이터 객체
 */
async function getSurveyStats() {
  try {
    console.log('[DEBUG] 설문 통계 조회 시작');
    
    // MongoDB Aggregation을 사용한 효율적인 통계 계산
    const [
      totalCount,
      ageStats,
      timeStats,
      questionStats,
      viewStats
    ] = await Promise.all([
      Survey.countDocuments(),
      getAgeDistributionStats(),
      getTimeDistributionStats(),
      getQuestionDistributionStats(),
      getViewingStats()
    ]);

    if (totalCount === 0) {
      return createEmptyStatsResponse();
    }

    console.log('[DEBUG] 통계 계산 완료 - 총 설문 수:', totalCount);

    return {
      totalSurveys: totalCount,
      ageDistribution: ageStats.distribution,
      averageAge: ageStats.average,
      dailyCount: timeStats.daily,
      hourlyCount: timeStats.hourly,
      heatmapData: timeStats.heatmap,
      questionDistributions: questionStats,
      viewingStats: viewStats,
      summary: {
        mostActiveHour: timeStats.mostActiveHour,
        mostCommonAgeGroup: ageStats.mostCommon,
        averageResponseScore: questionStats.overallAverage,
        viewedPercentage: viewStats.viewedPercentage
      }
    };
    
  } catch (error) {
    console.error('[SERVICE ERROR] getSurveyStats:', error);
    throw new Error(`통계 조회 실패: ${error.message}`);
  }
}

/**
 * 빈 통계 응답 생성
 */
function createEmptyStatsResponse() {
  const emptyDistribution = {};
  SURVEY.QUESTION_FIELDS.forEach(field => {
    emptyDistribution[`${field}Distribution`] = {};
  });

  return {
    totalSurveys: 0,
    ageDistribution: [],
    averageAge: 0,
    dailyCount: [],
    hourlyCount: [],
    heatmapData: [],
    questionDistributions: emptyDistribution,
    viewingStats: { viewed: 0, notViewed: 0, viewedPercentage: 0 },
    summary: {
      mostActiveHour: null,
      mostCommonAgeGroup: null,
      averageResponseScore: 0,
      viewedPercentage: 0
    },
    message: "데이터가 없습니다."
  };
}

/**
 * 연령대별 분포 통계
 */
async function getAgeDistributionStats() {
  const ageStats = await Survey.aggregate([
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
        averageAge: { $avg: '$age' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const overallAverage = await Survey.aggregate([
    { $group: { _id: null, average: { $avg: '$age' } } }
  ]);

  const distribution = ageStats.map(stat => ({
    range: stat._id,
    count: stat.count,
    averageAge: Math.round(stat.averageAge * 10) / 10
  }));

  const mostCommon = ageStats.reduce((max, current) => 
    current.count > (max?.count || 0) ? current : max, null)?._id;

  return {
    distribution,
    average: Math.round((overallAverage[0]?.average || 0) * 10) / 10,
    mostCommon
  };
}

/**
 * 시간대별 분포 통계
 */
async function getTimeDistributionStats() {
  const [dailyStats, hourlyStats, heatmapStats] = await Promise.all([
    // 일별 통계
    Survey.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // 시간별 통계
    Survey.aggregate([
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // 히트맵 데이터
    Survey.aggregate([
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            hour: { $hour: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1, '_id.hour': 1 } }
    ])
  ]);

  const daily = dailyStats.map(stat => ({
    date: stat._id,
    count: stat.count
  }));

  const hourly = hourlyStats.map(stat => ({
    hour: stat._id,
    count: stat.count
  }));

  const heatmap = heatmapStats.map(stat => ({
    date: stat._id.date,
    hour: stat._id.hour,
    count: stat.count
  }));

  const mostActiveHour = hourlyStats.reduce((max, current) => 
    current.count > (max?.count || 0) ? current : max, null)?._id;

  return { daily, hourly, heatmap, mostActiveHour };
}

/**
 * 질문별 응답 분포 통계
 */
async function getQuestionDistributionStats() {
  const questionStats = {};
  let totalScore = 0;
  let totalResponses = 0;

  for (const field of SURVEY.QUESTION_FIELDS) {
    const distribution = await Survey.aggregate([
      {
        $group: {
          _id: `$${field}`,
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const distributionObj = {};
    let fieldTotal = 0;
    let fieldCount = 0;

    distribution.forEach(item => {
      distributionObj[item._id] = item.count;
      fieldTotal += item._id * item.count;
      fieldCount += item.count;
    });

    questionStats[`${field}Distribution`] = distributionObj;
    questionStats[`${field}Average`] = fieldCount > 0 ? 
      Math.round((fieldTotal / fieldCount) * 100) / 100 : 0;

    totalScore += fieldTotal;
    totalResponses += fieldCount;
  }

  questionStats.overallAverage = totalResponses > 0 ? 
    Math.round((totalScore / totalResponses) * 100) / 100 : 0;

  return questionStats;
}

/**
 * 감상 여부 통계
 */
async function getViewingStats() {
  const viewStats = await Survey.aggregate([
    {
      $group: {
        _id: '$isViewed',
        count: { $sum: 1 }
      }
    }
  ]);

  const viewed = viewStats.find(stat => stat._id === true)?.count || 0;
  const notViewed = viewStats.find(stat => stat._id === false)?.count || 0;
  const total = viewed + notViewed;

  return {
    viewed,
    notViewed,
    total,
    viewedPercentage: total > 0 ? Math.round((viewed / total) * 100) : 0
  };
}

/**
 * 설문 데이터 업데이트
 * @param {string} id - 설문 ID
 * @param {Object} payload - 업데이트할 데이터
 * @returns {Object} 업데이트된 설문 객체
 */
async function updateSurvey(id, payload) {
  try {
    // ID 유효성 검증
    if (!isValidObjectId(id)) {
      throw new Error('유효하지 않은 설문 ID입니다.');
    }

    // 업데이트 가능한 필드만 필터링
    const updateData = filterUpdateableFields(payload);
    
    if (Object.keys(updateData).length === 0) {
      throw new Error('업데이트할 데이터가 없습니다.');
    }

    console.log(`[UPDATE SURVEY SERVICE] ID: ${id}, updateData:`, updateData);
    
    const updatedSurvey = await Survey.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { 
        new: true, 
        runValidators: true, 
        lean: true,
        select: '-__v' // 버전 필드 제외
      }
    );

    if (!updatedSurvey) {
      throw new Error('설문을 찾을 수 없습니다.');
    }

    console.log('[UPDATE SURVEY SERVICE] 설문이 성공적으로 업데이트되었습니다.');
    return updatedSurvey;
    
  } catch (error) {
    console.error('[SERVICE ERROR] updateSurvey:', error);
    throw new Error(`설문 업데이트 실패: ${error.message}`);
  }
}

/**
 * 감상 여부 업데이트
 * @param {string} id - 설문 ID
 * @param {boolean} isViewed - 감상 여부
 * @returns {Object} 업데이트된 설문 객체
 */
async function updateIsViewed(id, isViewed = true) {
  try {
    // ID 유효성 검증
    if (!isValidObjectId(id)) {
      throw new Error('유효하지 않은 설문 ID입니다.');
    }

    console.log(`[UPDATE ISVIEWED SERVICE] ID: ${id}, isViewed: ${isViewed}`);
    
    const result = await Survey.findByIdAndUpdate(
      id, 
      { $set: { isViewed: Boolean(isViewed) } }, 
      { new: true, lean: true, select: '-__v' }
    );
    
    if (!result) {
      throw new Error('설문을 찾을 수 없습니다.');
    }

    console.log('[UPDATE ISVIEWED SERVICE] 감상여부가 성공적으로 업데이트되었습니다.');
    return result;
    
  } catch (error) {
    console.error('[SERVICE ERROR] updateIsViewed:', error);
    throw new Error(`감상여부 업데이트 실패: ${error.message}`);
  }
}

/**
 * 설문 삭제
 * @param {string} id - 설문 ID
 * @returns {Object} 삭제된 설문 객체
 */
async function deleteSurvey(id) {
  try {
    // ID 유효성 검증
    if (!isValidObjectId(id)) {
      throw new Error('유효하지 않은 설문 ID입니다.');
    }

    console.log(`[DELETE SERVICE] ID: ${id} 설문 삭제 시도`);
    
    const deletedSurvey = await Survey.findByIdAndDelete(id, { lean: true });
    
    if (!deletedSurvey) {
      console.log('[DELETE SERVICE] 삭제할 설문을 찾지 못했습니다.');
      return null;
    }

    console.log('[DELETE SERVICE] 설문이 성공적으로 삭제되었습니다.');
    return deletedSurvey;
    
  } catch (error) {
    console.error('[SERVICE ERROR] deleteSurvey:', error);
    throw new Error(`설문 삭제 실패: ${error.message}`);
  }
}

/**
 * 업데이트 가능한 필드 필터링
 * @param {Object} payload - 원본 데이터
 * @returns {Object} 필터링된 데이터
 */
function filterUpdateableFields(payload) {
  const allowedFields = [
    'name', 'age', 'date', 'isViewed',
    ...SURVEY.QUESTION_FIELDS
  ];

  const updateData = {};

  for (const [key, value] of Object.entries(payload)) {
    if (!allowedFields.includes(key)) {
      continue; // 허용되지 않은 필드는 무시
    }

    // 값 유효성 검사
    if (value === null || value === undefined) {
      continue; // null/undefined 값은 무시
    }

    // 빈 문자열 처리 (boolean은 예외)
    if (typeof value === 'string' && value.trim() === '') {
      continue;
    }

    // 질문 필드 검증
    if (SURVEY.QUESTION_FIELDS.includes(key)) {
      const normalizedValue = normalizeQuestionResponse(value);
      updateData[key] = normalizedValue;
    } else if (key === 'age') {
      updateData[key] = normalizeAge(value);
    } else if (key === 'name') {
      updateData[key] = value.toString().trim();
    } else {
      updateData[key] = value;
    }
  }

  return updateData;
}



// 서비스 함수 내보내기
module.exports = {
  createSurvey,
  getAllSurveys,
  getSurveyStats,
  updateSurvey,
  updateIsViewed,
  deleteSurvey,
  
  // 유틸리티 함수들 (테스트용)
  validateSurveyPayload,
  normalizeSurveyData
};