// src/services/fusion.service.js
/**
 * 설문 데이터와 웹캠 데이터 융합 서비스
 * A_server.py의 process_survey()와 fuse_data() 함수를 JavaScript로 포팅
 */

// 감정 순서 정의 (A_server.py와 동일)
const EMOTIONS = ['anger', 'sad', 'neutral', 'happy', 'surprise'];

// 감정 이름 매핑 (사용자 요구사항에 맞게)
const EMOTION_MAP = {
  'anger': 'angry',
  'sad': 'sad',
  'neutral': 'neutral',
  'happy': 'happy',
  'surprise': 'surprise'
};

// 설문 질문과 감정 매핑 (A_server.py의 QUESTION_EMOTION_MAP)
const QUESTION_EMOTION_MAP = {
  'question1': 'sad',
  'question2': 'happy',
  'question3': 'anger',
  'question4': 'surprise',
  'question5': 'sad',
  'question6': 'happy',
  'question7': 'anger',
  'question8': 'surprise',
};

// 융합 가중치 (A_server.py와 동일)
const W_SURVEY = 0.3;
const W_WEBCAM = 0.7;

// 최대 점수 정의 (정규화용)
const MAX_SCORES = {
  'happy': 10,
  'sad': 10,
  'anger': 10,
  'surprise': 10,
  'neutral': 8
};

/**
 * 설문 데이터를 감정 벡터로 변환
 * @param {Object} surveyData - 설문 응답 데이터 {question1: 1-5, question2: 1-5, ...}
 * @returns {number[]} - 정규화된 감정 벡터 [anger, sad, neutral, happy, surprise]
 */
function processSurvey(surveyData) {
  // 1. 감정별 원시 점수 계산
  const rawScoresDict = {};
  EMOTIONS.forEach(emotion => {
    rawScoresDict[emotion] = 0;
  });
  
  const allScores = [];
  
  // 각 질문의 점수를 해당 감정에 누적
  for (const [qKey, emotion] of Object.entries(QUESTION_EMOTION_MAP)) {
    if (qKey in surveyData) {
      const score = parseInt(surveyData[qKey], 10);
      rawScoresDict[emotion] += score;
      allScores.push(score);
    }
  }
  
  // 2. 'neutral' 점수 계산 (3점 = "보통" 응답 개수)
  if (allScores.length > 0) {
    const neutralRawScore = allScores.filter(score => score === 3).length;
    rawScoresDict['neutral'] = neutralRawScore;
  }
  
  // 3. 최대값 비례 정규화 (0.0 ~ 1.0 사이의 벡터 생성)
  const maxVector = EMOTIONS.map(emotion => MAX_SCORES[emotion]);
  const rawScoresVector = EMOTIONS.map(emotion => rawScoresDict[emotion]);
  
  // (원시 점수 배열 / 최대 점수 배열) = 정규화된 벡터
  const finalPatternVector = rawScoresVector.map((rawScore, idx) => {
    const maxScore = maxVector[idx];
    return maxScore !== 0 ? rawScore / maxScore : 0;
  });
  
  // 4. 소수점 3자리까지만 반올림
  const roundedVector = finalPatternVector.map(val => Math.round(val * 1000) / 1000);
  
  return roundedVector;
}

/**
 * 설문 벡터와 웹캠 벡터를 융합
 * @param {number[]} surveyVector - 설문 분석 벡터 [anger, sad, neutral, happy, surprise]
 * @param {number[]} webcamVector - 웹캠 감정 벡터 [anger, sad, neutral, happy, surprise]
 * @returns {Object} - {mainEmotion: string, dominanceScores: number[]}
 */
function fuseData(surveyVector, webcamVector) {
  // 가중 평균 계산: (설문 * W_SURVEY) + (웹캠 * W_WEBCAM)
  const dominanceScores = surveyVector.map((surveyScore, idx) => {
    return (W_SURVEY * surveyScore) + (W_WEBCAM * webcamVector[idx]);
  });
  
  // 융합된 점수 중 가장 높은 점수의 인덱스를 찾음
  const maxIdx = dominanceScores.indexOf(Math.max(...dominanceScores));
  const mainEmotion = EMOTIONS[maxIdx];
  
  // 소수점 3자리까지 반올림
  const roundedScores = dominanceScores.map(score => Math.round(score * 1000) / 1000);
  
  return {
    mainEmotion,
    dominanceScores: roundedScores
  };
}

/**
 * 최종 감정 분류 결과 계산
 * 모든 프레임의 감정을 집계하여 최종 감정을 결정
 * @param {Array<{mainEmotion: string, dominanceScores: number[]}>} sessionData - 프레임별 융합 결과
 * @returns {Object} - {finalEmotion: string, finalEmotionScore: number, finalEmotionProbs: number[]}
 */
function calculateFinalEmotion(sessionData) {
  if (!sessionData || sessionData.length === 0) {
    console.log('[Fusion Service] 세션 데이터가 없어 기본값 반환');
    // 기본값 반환
    return {
      finalEmotion: 'neutral',
      finalEmotionScore: 0,
      finalEmotionProbs: [0, 0, 1, 0, 0]
    };
  }

  console.log(`[Fusion Service] 최종 감정 계산 시작 (프레임 수: ${sessionData.length})`);

  // 방법 1: 모든 프레임의 dominanceScores를 평균내어 최종 감정 결정
  const avgDominanceScores = new Array(EMOTIONS.length).fill(0);
  
  sessionData.forEach((frame, frameIdx) => {
    frame.dominanceScores.forEach((score, idx) => {
      avgDominanceScores[idx] += score;
    });
  });
  
  // 평균 계산
  const finalProbs = avgDominanceScores.map(score => score / sessionData.length);
  
  // 가장 높은 점수의 감정 찾기
  const maxIdx = finalProbs.indexOf(Math.max(...finalProbs));
  const finalEmotion = EMOTIONS[maxIdx];
  const finalEmotionScore = finalProbs[maxIdx];
  
  // 소수점 3자리까지 반올림
  const roundedProbs = finalProbs.map(prob => Math.round(prob * 1000) / 1000);
  
  console.log('[Fusion Service] 최종 감정 계산 완료:', {
    finalEmotion,
    finalEmotionScore: Math.round(finalEmotionScore * 1000) / 1000,
    finalEmotionProbs: roundedProbs,
    frameCount: sessionData.length
  });
  
  return {
    finalEmotion,
    finalEmotionScore: Math.round(finalEmotionScore * 1000) / 1000,
    finalEmotionProbs: roundedProbs
  };
}

/**
 * 벡터를 설문 감정 객체 형태로 변환
 * @param {number[]} vector - 감정 벡터 [anger, sad, neutral, happy, surprise]
 * @param {number} weight - 가중치 (기본값: 0.5)
 * @returns {Object} - {surveyDominantEmotion: string, surveyWeight: number, angry: number, sad: number, neutral: number, happy: number, surprise: number}
 */
function vectorToSurveyEmotionObject(vector, weight = 0.5) {
  // 가장 높은 점수의 감정 찾기
  const maxIdx = vector.indexOf(Math.max(...vector));
  const dominantEmotion = EMOTIONS[maxIdx];
  
  // 감정 객체 생성
  const emotionObj = {
    surveyDominantEmotion: EMOTION_MAP[dominantEmotion] || dominantEmotion,
    surveyWeight: Math.round(weight * 100) / 100
  };
  
  // 각 감정별 점수 추가
  EMOTIONS.forEach((emotion, idx) => {
    const emotionKey = EMOTION_MAP[emotion] || emotion;
    emotionObj[emotionKey] = Math.round(vector[idx] * 1000) / 1000;
  });
  
  return emotionObj;
}

/**
 * 벡터를 표현 감정 객체 형태로 변환
 * @param {number[]} vector - 감정 벡터 [anger, sad, neutral, happy, surprise]
 * @param {number} weight - 가중치 (기본값: 0.5)
 * @returns {Object} - {expressionDominantEmotion: string, expressionWeight: number, angry: number, sad: number, neutral: number, happy: number, surprise: number}
 */
function vectorToExpressionEmotionObject(vector, weight = 0.5) {
  // 가장 높은 점수의 감정 찾기
  const maxIdx = vector.indexOf(Math.max(...vector));
  const dominantEmotion = EMOTIONS[maxIdx];
  
  // 감정 객체 생성
  const emotionObj = {
    expressionDominantEmotion: EMOTION_MAP[dominantEmotion] || dominantEmotion,
    expressionWeight: Math.round(weight * 100) / 100
  };
  
  // 각 감정별 점수 추가
  EMOTIONS.forEach((emotion, idx) => {
    const emotionKey = EMOTION_MAP[emotion] || emotion;
    emotionObj[emotionKey] = Math.round(vector[idx] * 1000) / 1000;
  });
  
  return emotionObj;
}

/**
 * 설문 데이터와 웹캠 데이터 배열을 융합 (새로운 구조)
 * @param {Object} surveyData - 설문 응답 데이터
 * @param {number[][]} webcamVectors - 웹캠 감정 벡터 배열
 * @returns {Object} - {survey: Object, expression: Object, total: Object}
 */
function fuseSurveyAndWebcam(surveyData, webcamVectors) {
  console.log('[Fusion Service] 융합 시작:', {
    surveyDataKeys: Object.keys(surveyData),
    webcamVectorsCount: webcamVectors.length
  });
  
  // 설문 데이터를 벡터로 변환
  const surveyVector = processSurvey(surveyData);
  console.log('[Fusion Service] 설문 벡터 변환 완료:', surveyVector);
  
  // 설문 결과를 객체 형태로 변환
  const surveyEmotion = vectorToSurveyEmotionObject(surveyVector, W_SURVEY);
  
  // 웹캠 벡터들의 평균 계산
  const avgWebcamVector = new Array(EMOTIONS.length).fill(0);
  webcamVectors.forEach(vector => {
    vector.forEach((score, idx) => {
      avgWebcamVector[idx] += score;
    });
  });
  const normalizedWebcamVector = avgWebcamVector.map(score => 
    webcamVectors.length > 0 ? score / webcamVectors.length : 0
  );
  
  // 웹캠 결과를 객체 형태로 변환
  const expressionEmotion = vectorToExpressionEmotionObject(normalizedWebcamVector, W_WEBCAM);
  
  // 각 웹캠 벡터와 융합 (세션 데이터용)
  const sessionData = webcamVectors.map((webcamVector, idx) => {
    const fused = fuseData(surveyVector, webcamVector);
    if (idx < 3) { // 처음 3개만 로깅
      console.log(`[Fusion Service] 프레임 ${idx + 1} 융합 완료:`, fused);
    }
    return fused;
  });
  
  console.log(`[Fusion Service] 총 ${sessionData.length}개 프레임 융합 완료`);
  
  // 최종 감정 계산
  const finalEmotionResult = calculateFinalEmotion(sessionData);
  
  // 최종 결과를 객체 형태로 변환
  const totalEmotion = {
    dominantEmotion: EMOTION_MAP[finalEmotionResult.finalEmotion] || finalEmotionResult.finalEmotion
  };
  
  // 각 감정별 점수 추가
  finalEmotionResult.finalEmotionProbs.forEach((prob, idx) => {
    const emotionKey = EMOTION_MAP[EMOTIONS[idx]] || EMOTIONS[idx];
    totalEmotion[emotionKey] = prob;
  });
  
  return {
    survey: surveyEmotion,
    expression: expressionEmotion,
    total: totalEmotion,
    // 하위 호환성을 위한 필드들
    surveyVector,
    sessionData,
    finalEmotion: finalEmotionResult.finalEmotion,
    finalEmotionScore: finalEmotionResult.finalEmotionScore,
    finalEmotionProbs: finalEmotionResult.finalEmotionProbs
  };
}

module.exports = {
  processSurvey,
  fuseData,
  fuseSurveyAndWebcam,
  calculateFinalEmotion,
  vectorToSurveyEmotionObject,
  vectorToExpressionEmotionObject,
  EMOTIONS,
  EMOTION_MAP,
  QUESTION_EMOTION_MAP,
  W_SURVEY,
  W_WEBCAM
};

