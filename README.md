# SaekIndex 백엔드 API

> 감정 분석 기반 설문 조사 시스템의 백엔드 서버  
> Node.js + Express + MongoDB + Python CNN 감정 분석

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [로컬 개발 환경](#-로컬-개발-환경-설정)
- [API 문서](#-api-엔드포인트)
- [배포](#-aws-ec2-배포)
- [문제 해결](#-문제-해결)

---

## 🚀 주요 기능

### 1. 설문 관리 시스템
- ✅ CRUD 작업 (생성, 조회, 수정, 삭제)
- ✅ 페이지네이션 및 필터링
- ✅ 감상 여부 (isViewed) 관리
- ✅ 활성 큐 상태 (isActiveQueue) 관리
- ✅ 실시간 통계 분석

### 2. 감정 분석 시스템
- 🎭 Python CNN 모델 기반 실시간 얼굴 감정 분석
- 📹 웹캠 프레임 캡처 및 분석
- 🔄 설문 응답 + 웹캠 감정 데이터 융합
- � 5가지  감정 분류 (Angry, Sad, Neutral, Happy, Surprise)

### 3. 세션 관리
- 🔐 Redis 기반 세션 저장
- ⏱️ 실시간 웹캠 데이터 수집
- 🔄 세션 생명주기 관리

### 4. 성능 최적화
- ⚡ Redis 캐싱 (통계 데이터 5분 캐싱)
- 🗜️ Gzip 압축 (응답 크기 30-50% 감소)
- 📈 MongoDB 인덱싱
- 🔄 연결 풀 관리

### 5. 보안 및 안정성
- 🛡️ Helmet 보안 헤더
- 🌐 CORS 설정
- ✅ Joi 입력 검증
- 📝 Winston 로깅
- 🔄 Graceful Shutdown

---


## 🛠️ 기술 스택

### Backend Framework
- **Node.js** 18.x - JavaScript 런타임
- **Express** 5.1.0 - 웹 프레임워크
- **Mongoose** 8.18.2 - MongoDB ODM

### Database & Cache
- **MongoDB** - 메인 데이터베이스
- **Redis** (ioredis 5.3.2) - 세션 및 캐싱

### AI/ML (Python)
- **Python** 3.11
- **PyTorch** 2.1.0 - 딥러닝 프레임워크
- **MediaPipe** 0.10.8 - 얼굴 감지
- **Flask** 3.0.0 - Python 웹 서버
- **OpenCV** 4.8.1 - 이미지 처리

### 주요 라이브러리
- **Joi** 17.11.0 - 입력 검증
- **Winston** 3.11.0 - 로깅
- **Helmet** 7.2.0 - 보안
- **Multer** 2.0.2 - 파일 업로드
- **Sharp** 0.33.1 - 이미지 최적화
- **Axios** 1.7.9 - HTTP 클라이언트

### 개발 도구
- **Nodemon** 3.1.7 - 자동 재시작
- **PM2** - 프로세스 관리 (프로덕션)
- **Jest** 29.7.0 - 테스팅

---

## 📁 프로젝트 구조

```
SaekIndex_BackEnd/
├── src/
│   ├── config/
│   │   └── db.js                    # MongoDB 연결 설정
│   │
│   ├── controllers/
│   │   ├── surveys.controller.js   # 설문 컨트롤러
│   │   └── emotion.controller.js   # 감정 분석 컨트롤러
│   │
│   ├── middleware/
│   │   ├── error.middleware.js     # 에러 처리
│   │   ├── validation.middleware.js # 입력 검증
│   │   ├── imageValidation.middleware.js # 이미지 검증
│   │   ├── notFound.middleware.js  # 404 처리
│   │   └── performance.middleware.js # 성능 모니터링
│   │
│   ├── models/
│   │   └── survey.model.js         # 설문 스키마
│   │
│   ├── routes/
│   │   ├── surveys.routes.js       # 설문 라우트
│   │   └── emotion.routes.js       # 감정 분석 라우트
│   │
│   ├── services/
│   │   ├── surveys.service.js      # 설문 비즈니스 로직
│   │   ├── emotion.service.js      # 감정 분석 서비스
│   │   ├── fusion.service.js       # 데이터 융합
│   │   ├── session.service.js      # 세션 관리 (Redis)
│   │   ├── cache.service.js        # 캐싱 서비스
│   │   ├── emotion_server.py       # Python Flask 서버
│   │   ├── emotion_analyzer.py     # 감정 분석 로직
│   │   ├── model.py                # CNN 모델 정의
│   │   └── emotion_cnn_best.pth    # 학습된 모델 파일
│   │
│   ├── utils/
│   │   ├── asyncHandler.js         # 비동기 에러 핸들러
│   │   ├── constants.js            # 상수 정의
│   │   ├── helpers.js              # 헬퍼 함수
│   │   └── logger.js               # Winston 로거
│   │
│   ├── validators/
│   │   └── survey.validator.js     # 설문 검증 스키마
│   │
│   └── app.js                       # Express 앱 설정
│
├── scripts/                         # 유틸리티 스크립트
├── logs/                            # 로그 파일 (자동 생성)
├── .env.example                     # 환경 변수 예시
├── .gitignore
├── ecosystem.config.js              # PM2 설정
├── package.json
├── requirements.txt                 # Python 패키지
└── server.js                        # 서버 진입점
```

---


## 💻 로컬 개발 환경 설정

### 필수 요구사항

- **Node.js** 18.x 이상
- **Python** 3.11
- **MongoDB** (Atlas 또는 로컬)
- **Redis** (선택사항, 없으면 메모리 기반 세션 사용)
- **Git**

### 1. 저장소 클론

```bash
git clone https://github.com/YOUR_USERNAME/SaekIndex_BackEnd.git
cd SaekIndex_BackEnd
```

### 2. Node.js 패키지 설치

```bash
npm install
```

### 3. Python 가상환경 설정

**Windows**:
```bash
python -m venv .saekindex
.\.saekindex\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
```

**Mac/Linux**:
```bash
python3.11 -m venv .saekindex
source .saekindex/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
```

### 4. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env
```

`.env` 파일 편집:
```bash
# 서버 설정
NODE_ENV=development
PORT=4000

# MongoDB (필수)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=saekinDB

# Redis (선택사항)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Python 서버
EMOTION_SERVER_PORT=5001
MEDIAPIPE_DISABLE_GPU=1

# 로그
LOG_LEVEL=info

# CORS (프로덕션)
CORS_ORIGINS=https://your-frontend-domain.com
```

### 5. 서버 시작

```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

서버가 정상적으로 시작되면:
```
🚀 SaekIndex 백엔드 서버 시작 중...
📍 환경: development
🔌 포트: 4000
🗄️  데이터베이스 연결 중...
✅ 데이터베이스 연결 정상
🐍 Python 서버 시작 중...
✅ Python 서버 준비 완료!
🎉 서버가 성공적으로 시작되었습니다!
🌐 서버 주소: http://localhost:4000
```

### 6. 헬스 체크

```bash
curl http://localhost:4000/health
```

---


## 📡 API 엔드포인트

### 헬스 체크

```http
GET /health
```

**응답**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 3600,
  "database": {
    "state": 1,
    "status": "connected",
    "name": "saekinDB"
  }
}
```

### 설문 관리

#### 설문 목록 조회
```http
GET /api/surveys?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31
```

**쿼리 파라미터**:
- `page` (number): 페이지 번호 (기본값: 1)
- `limit` (number): 페이지당 항목 수 (기본값: 10)
- `startDate` (string): 시작 날짜 (YYYY-MM-DD)
- `endDate` (string): 종료 날짜 (YYYY-MM-DD)
- `minAge` (number): 최소 나이
- `maxAge` (number): 최대 나이
- `isViewed` (boolean): 감상 여부
- `name` (string): 이름 검색

#### 설문 생성
```http
POST /api/surveys
Content-Type: application/json

{
  "userId": 1234,
  "name": "홍길동",
  "age": 25,
  "date": "2024-01-15",
  "question1": 3,
  "question2": 4,
  "question3": 2,
  "question4": 5,
  "question5": 3,
  "question6": 4,
  "question7": 2,
  "question8": 5,
  "survey": {
    "surveyDominantEmotion": "happy",
    "angry": 0.1,
    "sad": 0.2,
    "neutral": 0.1,
    "happy": 0.5,
    "surprise": 0.1
  },
  "expression": {
    "expressionDominantEmotion": "neutral",
    "angry": 0.1,
    "sad": 0.2,
    "neutral": 0.4,
    "happy": 0.2,
    "surprise": 0.1
  },
  "total": {
    "dominantEmotion": "happy",
    "angry": 0.1,
    "sad": 0.2,
    "neutral": 0.25,
    "happy": 0.35,
    "surprise": 0.1
  }
}
```

#### 설문 수정
```http
PUT /api/surveys/:id
```

#### 감상 여부 업데이트
```http
PATCH /api/surveys/:id/viewed
Content-Type: application/json

{
  "isViewed": true
}
```

#### 활성 큐 상태 업데이트
```http
PATCH /api/surveys/:id/active-queue
Content-Type: application/json

{
  "isActiveQueue": true
}
```

#### 설문 삭제
```http
DELETE /api/surveys/:id
```

#### 통계 조회
```http
GET /api/surveys/stats
```

**응답**:
```json
{
  "success": true,
  "data": {
    "totalSurveys": 100,
    "ageDistribution": [...],
    "dailyCount": [...],
    "hourlyCount": [...],
    "heatmapData": [...],
    "questionDistributions": {...},
    "viewingStats": {
      "viewed": 50,
      "notViewed": 50,
      "viewedPercentage": 50
    }
  }
}
```

### 감정 분석

#### 세션 시작
```http
POST /api/emotion/start-session
```

**응답**:
```json
{
  "status": "success",
  "data": {
    "sessionId": "uuid-v4",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### 이미지 감정 분석
```http
POST /api/emotion/analyze
Content-Type: multipart/form-data

image: [File]
```

**응답**:
```json
{
  "status": "success",
  "data": {
    "label": "happy",
    "score": 0.85,
    "probs": [0.05, 0.10, 0.15, 0.65, 0.05],
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

#### 웹캠 벡터 전송
```http
POST /api/emotion/push-webcam
Content-Type: application/json

{
  "sessionId": "uuid-v4",
  "webcamVector": [0.1, 0.2, 0.3, 0.3, 0.1]
}
```

#### 데이터 융합
```http
POST /api/emotion/fuse
Content-Type: application/json

{
  "sessionId": "uuid-v4",
  "surveyData": {
    "question1": 3,
    "question2": 4,
    ...
  }
}
```

---


## 🌐 AWS EC2 배포

상세한 배포 가이드는 **[AWS_EC2_DEPLOYMENT_GUIDE.md](./AWS_EC2_DEPLOYMENT_GUIDE.md)** 참고

### 빠른 배포 (5분)

```bash
# 1. EC2 접속
ssh -i saekindex-key.pem ubuntu@YOUR_EC2_IP

# 2. 시스템 준비
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3.11-venv python3.11-dev
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. 프로젝트 배포
git clone https://github.com/YOUR_USERNAME/SaekIndex_BackEnd.git
cd SaekIndex_BackEnd

# Python 가상환경 (.venv)
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate

# Node.js 패키지
npm install

# 환경 변수
cp .env.example .env
nano .env  # MongoDB URI 등 설정

# 4. 서버 시작
sudo npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## 🔧 환경 변수

### 필수 환경 변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `NODE_ENV` | 실행 환경 | `development`, `production` |
| `PORT` | 서버 포트 | `4000` |
| `MONGODB_URI` | MongoDB 연결 문자열 | `mongodb+srv://...` |
| `DB_NAME` | 데이터베이스 이름 | `saekinDB` |

### 선택 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `REDIS_HOST` | Redis 호스트 | `localhost` |
| `REDIS_PORT` | Redis 포트 | `6379` |
| `REDIS_PASSWORD` | Redis 비밀번호 | - |
| `EMOTION_SERVER_PORT` | Python 서버 포트 | `5001` |
| `LOG_LEVEL` | 로그 레벨 | `info` |
| `CORS_ORIGINS` | CORS 허용 도메인 | - |
| `DB_MAX_POOL_SIZE` | MongoDB 최대 연결 수 | `5` |

---

## 📊 데이터 모델

### Survey 스키마

```javascript
{
  userId: Number,           // 사용자 ID (0-9999)
  name: String,             // 이름 (최대 100자)
  age: Number,              // 나이 (1-100)
  date: String,             // 날짜 (YYYY-MM-DD)
  
  // 8개 심리 평가 질문 (1-5 척도)
  question1: Number,
  question2: Number,
  question3: Number,
  question4: Number,
  question5: Number,
  question6: Number,
  question7: Number,
  question8: Number,
  
  // 감상 여부
  isViewed: Boolean,        // 기본값: false
  
  // 활성 큐 상태
  isActiveQueue: Boolean,   // 기본값: false
  
  // 설문 기반 감정 분석
  survey: {
    surveyDominantEmotion: String,
    surveyWeight: Number,
    angry: Number,
    sad: Number,
    neutral: Number,
    happy: Number,
    surprise: Number
  },
  
  // 표정 기반 감정 분석 (CNN)
  expression: {
    expressionDominantEmotion: String,
    expressionWeight: Number,
    angry: Number,
    sad: Number,
    neutral: Number,
    happy: Number,
    surprise: Number
  },
  
  // 최종 융합 감정
  total: {
    dominantEmotion: String,
    angry: Number,
    sad: Number,
    neutral: Number,
    happy: Number,
    surprise: Number
  },
  
  // 타임스탬프
  createdAt: Date,
  updatedAt: Date
}
```

---


## 🧪 테스트

### API 테스트

```bash
# 헬스 체크
curl http://localhost:4000/health

# 설문 목록 조회
curl http://localhost:4000/api/surveys

# 통계 조회
curl http://localhost:4000/api/surveys/stats

# 설문 생성
curl -X POST http://localhost:4000/api/surveys \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1234,
    "name": "테스트",
    "age": 25,
    "date": "2024-01-15",
    "question1": 3,
    "question2": 4,
    "question3": 2,
    "question4": 5,
    "question5": 3,
    "question6": 4,
    "question7": 2,
    "question8": 5
  }'
```

### Jest 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 특정 테스트 파일 실행
npm test -- surveys.test.js

# 커버리지 확인
npm run test:coverage
```

---

## 📝 로깅

### Winston 로거

로그는 자동으로 `logs/` 디렉토리에 저장됩니다:

- `combined-YYYY-MM-DD.log` - 모든 로그
- `error-YYYY-MM-DD.log` - 에러 로그만
- 로그는 14일 후 자동 삭제

### 로그 레벨

- `error` - 에러만
- `warn` - 경고 이상
- `info` - 정보 이상 (기본값)
- `debug` - 디버그 정보 포함
- `verbose` - 모든 로그

### 로그 확인

```bash
# 개발 환경
npm run logs:view      # 모든 로그
npm run logs:error     # 에러 로그만

# 프로덕션 환경 (PM2)
pm2 logs
pm2 logs saekindex-backend --lines 100
```

---

## 📊 모니터링

### PM2 명령어

```bash
# 상태 확인
pm2 status

# 로그 확인
pm2 logs
pm2 logs saekindex-backend

# 실시간 모니터링
pm2 monit

# 재시작
pm2 restart saekindex-backend

# 중지
pm2 stop saekindex-backend

# 삭제
pm2 delete saekindex-backend

# 로그 삭제
pm2 flush
```

### 시스템 리소스

```bash
# CPU, 메모리 사용량
htop

# 디스크 사용량
df -h

# 메모리 상태
free -h

# 네트워크 연결
netstat -tulpn | grep 4000
```

---


## 🚨 문제 해결

### Python 서버 시작 실패

**증상**:
```
[Emotion Service] Python 서버 시작 실패
```

**해결**:
```bash
# 가상환경 활성화
source .venv/bin/activate  # Linux/Mac
.\.venv\Scripts\activate   # Windows

# Python 서버 수동 테스트
python src/services/emotion_server.py

# 오류 확인 후 패키지 재설치
pip install -r requirements.txt

# 가상환경 비활성화
deactivate

# PM2 재시작
pm2 restart saekindex-backend
```

### MongoDB 연결 실패

**증상**:
```
[MongoDB] 연결 실패
```

**해결**:
1. `.env` 파일의 `MONGODB_URI` 확인
2. MongoDB Atlas IP 화이트리스트 확인
   - EC2 퍼블릭 IP 추가
   - 또는 `0.0.0.0/0` (모든 IP 허용)
3. 네트워크 연결 확인

### 포트 충돌

**증상**:
```
Error: listen EADDRINUSE: address already in use :::4000
```

**해결**:
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :4000
kill -9 <PID>
```

### 메모리 부족 (t2.micro)

**증상**:
```
Killed
npm ERR! errno 137
```

**해결 - Swap 메모리 추가**:
```bash
sudo dd if=/dev/zero of=/swapfile bs=128M count=16
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 설정
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 확인
free -h
```

### Redis 연결 실패

**증상**:
```
Redis connection failed
```

**해결**:
- Redis가 설치되지 않았거나 실행 중이 아니면 메모리 기반 세션으로 자동 전환됨
- Redis 사용을 원하면:
```bash
# Redis 설치 (Ubuntu)
sudo apt install redis-server

# Redis 시작
sudo systemctl start redis-server

# Redis 상태 확인
sudo systemctl status redis-server
```

---

## 🔐 보안

### 보안 기능

- ✅ Helmet 보안 헤더
- ✅ CORS 설정
- ✅ Rate Limiting
- ✅ 입력 검증 (Joi)
- ✅ 이미지 파일 검증
- ✅ SQL Injection 방지 (Mongoose)
- ✅ XSS 방지

### 권장 사항

1. **환경 변수 보호**
   - `.env` 파일을 Git에 커밋하지 마세요
   - 프로덕션에서는 강력한 비밀키 사용

2. **MongoDB 보안**
   - IP 화이트리스트 설정
   - 강력한 비밀번호 사용
   - 읽기 전용 사용자 생성 (필요시)

3. **CORS 설정**
   - 프로덕션에서는 특정 도메인만 허용
   - `CORS_ORIGINS` 환경 변수 설정

4. **Rate Limiting**
   - 설문 생성 API에 Rate Limiting 적용됨
   - 필요시 다른 엔드포인트에도 추가

---

## 📚 추가 문서

- **[AWS EC2 배포 가이드](./AWS_EC2_DEPLOYMENT_GUIDE.md)** - 완전한 배포 가이드
- **[배포 문서 통합](./DEPLOYMENT_README.md)** - 배포 문서 안내
- **[isActiveQueue 기능](./ISACTIVEQUEUE_FEATURE.md)** - 활성 큐 기능 설명

---

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

This project is licensed under the MIT License.

---

## 👥 팀

**SaekIndex Team**

---

## 📞 문의

프로젝트 관련 문의사항이 있으시면 GitHub Issues를 등록해주세요.

---

**마지막 업데이트**: 2024-01-15  
**버전**: 2.0.0
