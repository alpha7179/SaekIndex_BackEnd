/**
 * 설문 API 테스트
 */
const request = require('supertest');
const createApp = require('../src/app');
const Survey = require('../src/models/survey.model');

const app = createApp();

describe('설문 API 테스트', () => {
  // 테스트용 설문 데이터
  const validSurveyData = {
    userId: 1001,
    date: '2024-01-15',
    name: '테스트 사용자',
    age: 25,
    question1: 4,
    question2: 3,
    question3: 5,
    question4: 2,
    question5: 4,
    question6: 3,
    question7: 5,
    question8: 4
  };

  describe('POST /api/surveys', () => {
    test('유효한 설문 데이터로 설문 생성 성공', async () => {
      const response = await request(app)
        .post('/api/surveys')
        .send(validSurveyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(validSurveyData.name);
      expect(response.body.data.age).toBe(validSurveyData.age);
      expect(response.body.data.isViewed).toBe(false);
    });

    test('필수 필드 누락 시 400 에러', async () => {
      const invalidData = { ...validSurveyData };
      delete invalidData.name;

      const response = await request(app)
        .post('/api/surveys')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('name');
    });

    test('잘못된 나이 범위 시 400 에러', async () => {
      const invalidData = { ...validSurveyData, age: 150 };

      const response = await request(app)
        .post('/api/surveys')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('잘못된 질문 응답 범위 시 400 에러', async () => {
      const invalidData = { ...validSurveyData, question1: 10 };

      const response = await request(app)
        .post('/api/surveys')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('레거시 배열 데이터 호환성 테스트', async () => {
      const legacyData = { 
        ...validSurveyData, 
        question1: [4, 3, 5] // 배열 형태 (레거시)
      };

      const response = await request(app)
        .post('/api/surveys')
        .send(legacyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.question1).toBe(4); // 첫 번째 값으로 변환
    });
  });

  describe('GET /api/surveys', () => {
    beforeEach(async () => {
      // 테스트 데이터 생성
      await Survey.create([
        { ...validSurveyData, name: '사용자1', age: 20 },
        { ...validSurveyData, name: '사용자2', age: 30 },
        { ...validSurveyData, name: '사용자3', age: 40 }
      ]);
    });

    test('설문 목록 조회 성공', async () => {
      const response = await request(app)
        .get('/api/surveys')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.surveys).toHaveLength(3);
      expect(response.body.data.totalSurveys).toBe(3);
      expect(response.body.data.currentPage).toBe(1);
    });

    test('페이지네이션 테스트', async () => {
      const response = await request(app)
        .get('/api/surveys?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.surveys).toHaveLength(2);
      expect(response.body.data.totalPages).toBe(2);
      expect(response.body.data.hasNextPage).toBe(true);
    });

    test('잘못된 페이지 번호 시 400 에러', async () => {
      const response = await request(app)
        .get('/api/surveys?page=0')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/surveys/stats', () => {
    beforeEach(async () => {
      // 통계용 테스트 데이터 생성
      await Survey.create([
        { ...validSurveyData, name: '사용자1', age: 25 },
        { ...validSurveyData, name: '사용자2', age: 35 },
        { ...validSurveyData, name: '사용자3', age: 45 }
      ]);
    });

    test('설문 통계 조회 성공', async () => {
      const response = await request(app)
        .get('/api/surveys/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSurveys');
      expect(response.body.data).toHaveProperty('ageDistribution');
      expect(response.body.data).toHaveProperty('questionDistributions');
      expect(response.body.data.totalSurveys).toBe(3);
    });

    test('빈 데이터베이스에서 통계 조회', async () => {
      // 모든 데이터 삭제
      await Survey.deleteMany({});

      const response = await request(app)
        .get('/api/surveys/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSurveys).toBe(0);
      expect(response.body.data.message).toContain('데이터가 없습니다');
    });
  });

  describe('PUT /api/surveys/:id', () => {
    let surveyId;

    beforeEach(async () => {
      const survey = await Survey.create(validSurveyData);
      surveyId = survey._id.toString();
    });

    test('설문 업데이트 성공', async () => {
      const updateData = { name: '수정된 이름', age: 30 };

      const response = await request(app)
        .put(`/api/surveys/${surveyId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('수정된 이름');
      expect(response.body.data.age).toBe(30);
    });

    test('존재하지 않는 설문 업데이트 시 404 에러', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { name: '수정된 이름' };

      const response = await request(app)
        .put(`/api/surveys/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('잘못된 ID 형식 시 400 에러', async () => {
      const invalidId = 'invalid-id';
      const updateData = { name: '수정된 이름' };

      const response = await request(app)
        .put(`/api/surveys/${invalidId}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/surveys/:id/viewed', () => {
    let surveyId;

    beforeEach(async () => {
      const survey = await Survey.create(validSurveyData);
      surveyId = survey._id.toString();
    });

    test('감상여부 업데이트 성공', async () => {
      const response = await request(app)
        .patch(`/api/surveys/${surveyId}/viewed`)
        .send({ isViewed: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isViewed).toBe(true);
    });

    test('존재하지 않는 설문의 감상여부 업데이트 시 404 에러', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .patch(`/api/surveys/${fakeId}/viewed`)
        .send({ isViewed: true })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/surveys/:id', () => {
    let surveyId;

    beforeEach(async () => {
      const survey = await Survey.create(validSurveyData);
      surveyId = survey._id.toString();
    });

    test('설문 삭제 성공', async () => {
      const response = await request(app)
        .delete(`/api/surveys/${surveyId}`)
        .expect(204);

      // 삭제 확인
      const deletedSurvey = await Survey.findById(surveyId);
      expect(deletedSurvey).toBeNull();
    });

    test('존재하지 않는 설문 삭제 시 404 에러', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/surveys/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/surveys/:id', () => {
    let surveyId;

    beforeEach(async () => {
      const survey = await Survey.create(validSurveyData);
      surveyId = survey._id.toString();
    });

    test('특정 설문 조회 성공', async () => {
      const response = await request(app)
        .get(`/api/surveys/${surveyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(surveyId);
      expect(response.body.data.name).toBe(validSurveyData.name);
    });

    test('존재하지 않는 설문 조회 시 404 에러', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/surveys/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('헬스 체크 API 테스트', () => {
  test('헬스 체크 성공', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('database');
    expect(response.body.status).toBe('ok');
  });
});

describe('기본 정보 API 테스트', () => {
  test('루트 경로 정보 조회', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('endpoints');
  });
});

describe('404 에러 처리 테스트', () => {
  test('존재하지 않는 경로 접근 시 404 에러', async () => {
    const response = await request(app)
      .get('/nonexistent-path')
      .expect(404);

    expect(response.body.error).toHaveProperty('message');
  });
});