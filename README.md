# 색인(SaekIn) 백엔드 API

감정 분석 및 시각화 프로젝트의 백엔드 서버입니다. Node.js와 Express를 기반으로 구축되었으며, MongoDB를 데이터베이스로 사용합니다.

## ✨ 주요 기능

- 📊 **설문 데이터 관리**: 감정 설문조사 데이터의 CRUD 기능 제공
- 📈 **실시간 통계 분석**: 연령대별, 시간대별, 문항별 응답 데이터 집계
- 🔄 **RESTful API**: 표준 REST API 설계로 프론트엔드와 효율적 통신
- 🗄️ **MongoDB 연동**: Mongoose ODM을 통한 안정적인 데이터베이스 관리
- 🛡️ **에러 처리**: 체계적인 에러 핸들링과 로깅 시스템
- 🧪 **테스트 지원**: Jest 기반 단위 테스트 및 통합 테스트
- 📊 **히트맵 데이터**: 날짜/시간대별 설문 제출 패턴 분석
- 🔍 **헬스 체크**: 서버 상태 및 데이터베이스 연결 모니터링

## 🛠️ 기술 스택

### 핵심 프레임워크
- **Node.js** - JavaScript 런타임 환경
- **Express.js v5** - 웹 애플리케이션 프레임워크
- **Mongoose v8** - MongoDB ODM (Object Document Mapping)

### 데이터베이스
- **MongoDB** - NoSQL 문서 데이터베이스
- **MongoDB Atlas** - 클라우드 데이터베이스 서비스 지원

### 개발 도구
- **nodemon** - 개발 시 자동 재시작
- **dotenv** - 환경 변수 관리
- **cors** - Cross-Origin Resource Sharing 설정

### 테스팅
- **Jest** - JavaScript 테스트 프레임워크
- **Supertest** - HTTP 요청 테스트
- **MongoDB Memory Server** - 인메모리 MongoDB 테스트 환경

## 🚀 시작하기

### 전체 개발 환경 구축 가이드

#### 1. 시스템 요구사항

- **Node.js**: v18.0.0 이상 (권장: v20 LTS)
- **npm**: v8.0.0 이상
- **MongoDB**: v6.0 이상 (로컬) 또는 MongoDB Atlas (클라우드)
- **Git**: 최신 버전

#### 2. 프로젝트 클론 및 설정

```bash
# 저장소 클론
git clone <repository-url>
cd BackEnd

# Node.js 버전 확인
node --version  # v18+ 필요

# npm 버전 확인
npm --version   # v8+ 필요
```

### 1. 의존성 설치

```bash
# 패키지 설치
npm install

# 설치 확인
npm list --depth=0
```

### 2. 데이터베이스 설정

#### 🌟 권장: MongoDB Atlas (클라우드) 설정

이 프로젝트는 **MongoDB Atlas**를 기본으로 사용합니다. 안정적이고 확장 가능하며 무료 티어를 제공합니다.

##### 2-1. MongoDB Atlas 계정 생성 및 설정

1. **MongoDB Atlas 계정 생성**
   ```
   https://www.mongodb.com/atlas 접속
   → "Try Free" 클릭
   → Google/GitHub 계정으로 간편 가입 또는 이메일 가입
   ```

2. **무료 클러스터 생성**
   ```
   "Create a deployment" → "M0 FREE" 선택
   → Provider: AWS (권장)
   → Region: Asia Pacific (Seoul) ap-northeast-2 (한국 사용자 권장)
   → Cluster Name: SaekIndex01 (또는 원하는 이름)
   → "Create Deployment" 클릭
   ```

3. **데이터베이스 사용자 생성**
   ```
   Security → Database Access → "Add New Database User"
   → Authentication Method: Password
   → Username: 원하는 사용자명 (예: saekindex_user)
   → Password: 강력한 비밀번호 생성 (자동 생성 권장)
   → Database User Privileges: "Read and write to any database"
   → "Add User" 클릭
   ```

4. **네트워크 접근 허용**
   ```
   Security → Network Access → "Add IP Address"
   
   개발 환경:
   → "Allow Access from Anywhere" (0.0.0.0/0) 선택
   
   프로덕션 환경:
   → "Add Current IP Address" 또는 특정 IP 입력
   → AWS EC2 사용 시 EC2 인스턴스의 퍼블릭 IP 추가
   ```

5. **연결 문자열 획득**
   ```
   Deployment → Database → "Connect"
   → "Drivers" 선택
   → Driver: Node.js, Version: 5.5 or later
   → 연결 문자열 복사:
   
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

##### 2-2. 실제 프로젝트 설정 예시

현재 프로젝트에서 사용 중인 설정:
```
클러스터명: SaekIndex01
데이터베이스명: saekinDB
리전: Asia Pacific (Seoul)
```

#### 🔧 대안: 로컬 MongoDB 설정 (개발용)

로컬 개발 환경에서만 사용하는 경우:

**Windows:**
```bash
# MongoDB Community Server 다운로드 및 설치
# https://www.mongodb.com/try/download/community

# MongoDB 서비스 시작
net start MongoDB

# MongoDB 연결 확인
mongosh
```

**macOS (Homebrew):**
```bash
# MongoDB 설치
brew tap mongodb/brew
brew install mongodb-community

# MongoDB 서비스 시작
brew services start mongodb/brew/mongodb-community

# MongoDB 연결 확인
mongosh
```

**Linux (Ubuntu):**
```bash
# MongoDB 설치
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# MongoDB 서비스 시작
sudo systemctl start mongod
sudo systemctl enable mongod

# MongoDB 연결 확인
mongosh
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 MongoDB Atlas 연결 정보를 설정하세요.

#### 🌟 MongoDB Atlas 환경 변수 (권장)

```bash
# .env 파일 생성
touch .env
```

`.env` 파일 내용:
```env
# MongoDB Atlas 연결 (실제 프로젝트 설정)
MONGODB_URI=mongodb+srv://your_username:your_password@saekindex01.cs8najv.mongodb.net/?retryWrites=true&w=majority&appName=SaekIndex01

# 데이터베이스명 (선택사항 - 명시적 관리용)
DB_NAME=saekinDB

# 서버 설정
PORT=4000
NODE_ENV=development

# 보안 설정 (향후 확장용)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
API_SECRET_KEY=your_api_secret_key_for_future_auth
```

#### 📝 환경 변수 설정 단계별 가이드

1. **MongoDB Atlas 연결 문자열 수정**
   ```env
   # Atlas에서 복사한 연결 문자열에서 다음을 수정:
   # <username> → 실제 데이터베이스 사용자명
   # <password> → 실제 비밀번호
   # <database> → saekinDB (또는 원하는 DB명)
   
   # 예시:
   MONGODB_URI=mongodb+srv://saekindex_user:MySecurePass123@saekindex01.cs8najv.mongodb.net/saekinDB?retryWrites=true&w=majority&appName=SaekIndex01
   ```

2. **연결 문자열 구성 요소 설명**
   ```
   mongodb+srv://     → MongoDB Atlas 프로토콜
   username:password  → 데이터베이스 인증 정보
   @cluster.mongodb.net → Atlas 클러스터 주소
   /database_name     → 사용할 데이터베이스명
   ?retryWrites=true  → 쓰기 재시도 활성화
   &w=majority        → 쓰기 확인 수준
   &appName=SaekIndex01 → 애플리케이션 식별자
   ```

3. **환경별 설정 예시**

   **개발 환경 (.env.development)**
   ```env
   MONGODB_URI=mongodb+srv://dev_user:dev_pass@saekindex01.cs8najv.mongodb.net/saekinDB_dev?retryWrites=true&w=majority
   NODE_ENV=development
   PORT=4000
   ```

   **프로덕션 환경 (.env.production)**
   ```env
   MONGODB_URI=mongodb+srv://prod_user:prod_pass@saekindex01.cs8najv.mongodb.net/saekinDB?retryWrites=true&w=majority
   NODE_ENV=production
   PORT=4000
   ```

   **테스트 환경 (.env.test)**
   ```env
   MONGODB_URI=mongodb+srv://test_user:test_pass@saekindex01.cs8najv.mongodb.net/saekinDB_test?retryWrites=true&w=majority
   NODE_ENV=test
   PORT=4001
   ```

#### 🔧 로컬 MongoDB 환경 변수 (대안)

로컬 개발 시에만 사용:
```env
# 로컬 MongoDB 연결
MONGODB_URI=mongodb://localhost:27017/saekindex

# 서버 설정
PORT=4000
NODE_ENV=development
```

#### 📋 환경 변수 상세 설명

| 변수명 | 설명 | 예시 값 | 필수 여부 |
|--------|------|---------|-----------|
| `MONGODB_URI` | MongoDB 연결 문자열 | `mongodb+srv://user:pass@cluster.net/db` | ✅ 필수 |
| `DB_NAME` | 데이터베이스명 (명시적 관리) | `saekinDB` | ⚪ 선택 |
| `PORT` | 서버 포트 번호 | `4000` | ⚪ 선택 (기본값: 4000) |
| `NODE_ENV` | 실행 환경 | `development`, `production`, `test` | ⚪ 선택 |
| `JWT_SECRET` | JWT 토큰 암호화 키 (향후 사용) | 최소 32자 이상의 랜덤 문자열 | ⚪ 향후 |
| `API_SECRET_KEY` | API 인증 키 (향후 사용) | 랜덤 문자열 | ⚪ 향후 |

#### 🔒 보안 주의사항

> ⚠️ **중요 보안 수칙**:
>
> - ✅ `.env` 파일은 `.gitignore`에 포함되어 Git에 커밋되지 않습니다
> - ✅ 실제 비밀번호를 README나 공개 저장소에 노출하지 마세요
> - ✅ 프로덕션 환경에서는 강력한 비밀번호 사용 (대소문자, 숫자, 특수문자 조합)
> - ✅ 정기적으로 데이터베이스 비밀번호 변경
> - ✅ Atlas에서 IP 화이트리스트 관리

#### 🛠️ 환경 변수 설정 확인

환경 변수가 올바르게 설정되었는지 확인:

```bash
# 서버 시작 후 연결 확인
npm run dev

# 성공 시 다음 메시지 표시:
# [MongoDB] connected: saekinDB
# Server listening on port 4000
```

#### 📄 .env.example 파일 생성

팀원들과 공유할 템플릿 파일:

```bash
# .env.example 파일 생성
cat > .env.example << 'EOF'
# MongoDB Atlas 연결 설정
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database?retryWrites=true&w=majority

# 데이터베이스명
DB_NAME=saekinDB

# 서버 설정
PORT=4000
NODE_ENV=development

# 보안 설정 (향후 사용)
JWT_SECRET=your_jwt_secret_key_here
API_SECRET_KEY=your_api_secret_key_here
EOF
```

팀원은 다음과 같이 사용:
```bash
# .env.example을 복사하여 .env 생성
cp .env.example .env

# .env 파일을 편집하여 실제 값 입력
nano .env
```

### 4. 서버 실행

#### 개발 모드 (nodemon 사용)
```bash
npm run dev
```

#### 프로덕션 모드
```bash
npm start
```

#### 테스트 실행
```bash
# 전체 테스트 실행
npm test

# 테스트 감시 모드 (파일 변경 시 자동 재실행)
npm run test:watch
```

### 5. 서버 연결 확인

서버가 정상적으로 실행되면 다음과 같은 메시지가 표시됩니다:

```bash
[MongoDB] connected: saekindex
Server listening on port 4000
```

#### 헬스 체크 테스트

```bash
# 서버 상태 확인
curl http://localhost:4000/health

# 예상 응답:
# {"status":"ok","db":1}
```

#### API 테스트

```bash
# 설문 목록 조회 (빈 배열 반환 예상)
curl http://localhost:4000/api/surveys

# 설문 생성 테스트
curl -X POST http://localhost:4000/api/surveys \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-15",
    "name": "테스트 사용자",
    "age": 25,
    "question1": ["행복", "기쁨"],
    "question2": "매우 좋음",
    "question3": "긍정적",
    "question4": "만족"
  }'
```

### 6. 연결 테스트 및 확인

#### 6-1. MongoDB Atlas 연결 확인

서버 시작 후 연결 상태 확인:

```bash
# 개발 서버 시작
npm run dev

# 성공적인 연결 시 콘솔 출력:
# [MongoDB] connected: saekinDB
# Server listening on port 4000
```

**연결 실패 시 문제 해결:**

1. **인증 오류**
   ```
   MongoServerError: bad auth : authentication failed
   ```
   - Atlas 사용자명/비밀번호 확인
   - 데이터베이스 사용자 권한 확인 ("Read and write to any database")

2. **네트워크 접근 오류**
   ```
   MongooseServerSelectionError: Could not connect to any servers
   ```
   - Atlas Network Access에서 현재 IP 주소 허용 확인
   - 방화벽 설정 확인

3. **연결 문자열 오류**
   ```
   MongoParseError: Invalid connection string
   ```
   - `.env` 파일의 `MONGODB_URI` 형식 확인
   - 특수문자가 포함된 비밀번호는 URL 인코딩 필요

#### 6-2. API 엔드포인트 테스트

**헬스 체크:**
```bash
# 서버 상태 확인
curl http://localhost:4000/health

# 예상 응답:
{
  "status": "ok",
  "db": 1
}
```

**설문 API 테스트:**
```bash
# 빈 설문 목록 조회
curl http://localhost:4000/api/surveys

# 예상 응답:
{
  "data": {
    "surveys": [],
    "totalSurveys": 0,
    "totalPages": 0,
    "currentPage": 1
  }
}
```

**설문 생성 테스트:**
```bash
curl -X POST http://localhost:4000/api/surveys \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-15",
    "name": "테스트 사용자",
    "age": 25,
    "question1": ["행복", "기쁨"],
    "question2": "매우 좋음",
    "question3": "긍정적",
    "question4": "만족"
  }'
```

#### 6-3. 프론트엔드와의 연동 확인

백엔드가 정상적으로 작동하려면 프론트엔드와의 통신이 원활해야 합니다:

1. **CORS 설정 확인**
   - 현재 모든 도메인(`*`) 허용으로 설정됨
   - 프로덕션에서는 특정 도메인만 허용 권장

2. **포트 충돌 확인**
   - 백엔드: `http://localhost:4000`
   - 프론트엔드: `http://localhost:5173`
   - 다른 서비스가 4000번 포트를 사용하지 않는지 확인

3. **API 응답 형식 확인**
   - 모든 성공 응답: `{ data: ... }`
   - 모든 에러 응답: `{ error: { message: "..." } }`

#### 6-4. MongoDB Atlas 대시보드 확인

Atlas 웹 콘솔에서 실시간 모니터링:

1. **연결 확인**
   ```
   Atlas Dashboard → Clusters → Metrics
   → "Connections" 그래프에서 활성 연결 확인
   ```

2. **데이터베이스 생성 확인**
   ```
   Atlas Dashboard → Browse Collections
   → "saekinDB" 데이터베이스 생성 확인
   → "surveys" 컬렉션 자동 생성 확인
   ```

3. **실시간 로그 확인**
   ```
   Atlas Dashboard → Clusters → Real Time
   → 실시간 쿼리 및 연결 상태 모니터링
   ```

## 📁 프로젝트 구조

```
SaekIndex_BackEnd/
├── .env                    # 환경 변수 (Git에서 제외)
├── .env.example           # 환경 변수 템플릿
├── .env.development       # 개발 환경 설정
├── .env.production        # 프로덕션 환경 설정
├── .gitignore             # Git 무시 파일
├── .github/
│   └── workflows/
│       └── ci.yml         # GitHub Actions CI/CD
├── docs/
│   └── api-spec.yaml      # OpenAPI 3.0 스펙
├── jest.config.js         # Jest 테스트 설정
├── nodemon.json           # Nodemon 개발 설정
├── package.json           # 프로젝트 설정 및 의존성
├── scripts/
│   └── deploy.sh          # 배포 스크립트
├── server.js              # 서버 진입점
├── src/
│   ├── app.js             # Express 앱 설정
│   ├── config/
│   │   └── db.js          # MongoDB 연결 설정
│   ├── controllers/
│   │   └── surveys.controller.js  # 설문 컨트롤러
│   ├── data/              # 데이터 파일 (현재 비어있음)
│   ├── middleware/
│   │   ├── error.middleware.js    # 에러 처리 미들웨어
│   │   └── notFound.middleware.js # 404 처리 미들웨어
│   ├── models/
│   │   └── survey.model.js        # 설문 데이터 모델
│   ├── routes/
│   │   └── surveys.routes.js      # 설문 라우터
│   ├── services/
│   │   └── surveys.service.js     # 설문 비즈니스 로직
│   └── utils/
│       └── asyncHandler.js        # 비동기 에러 처리 유틸
└── tests/
    ├── setup.js           # 테스트 환경 설정
    └── surveys.test.js    # 설문 API 테스트
```

## 🔌 API 엔드포인트

### 기본 정보

- **Base URL**: `http://localhost:4000` (개발), `https://your-domain.com` (프로덕션)
- **Content-Type**: `application/json`
- **인증**: 현재 미구현 (향후 JWT 토큰 기반 인증 예정)

### 응답 형식

#### 성공 응답
```json
{
  "data": {
    // 실제 데이터
  }
}
```

#### 에러 응답
```json
{
  "error": {
    "message": "에러 메시지",
    "stack": "스택 트레이스 (개발 환경에서만)"
  }
}
```

### 헬스 체크

```http
GET /health
```

서버 상태와 데이터베이스 연결 상태를 확인합니다.

**응답 예시:**
```json
{
  "status": "ok",
  "db": 1
}
```

**데이터베이스 상태 코드:**
- `0`: 연결 끊김 (disconnected)
- `1`: 연결됨 (connected)
- `2`: 연결 중 (connecting)
- `3`: 연결 해제 중 (disconnecting)

### 설문 관련 API

#### 1. 설문 생성

```http
POST /api/surveys
```

새로운 설문 응답을 생성합니다.

**요청 본문:**
```json
{
  "date": "2025-01-15",
  "name": "홍길동",
  "age": 25,
  "question1": ["행복", "기쁨", "만족"],
  "question2": "매우 좋음",
  "question3": "긍정적",
  "question4": "만족스러움"
}
```

**필수 필드:**
- `date`: 설문 날짜 (YYYY-MM-DD 형식)
- `name`: 응답자 이름 (문자열)
- `age`: 응답자 나이 (숫자)

**선택 필드:**
- `question1`: 감정 키워드 배열
- `question2`: 기분 상태
- `question3`: 전반적 느낌
- `question4`: 추가 의견

**성공 응답 (201):**
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "date": "2025-01-15",
    "name": "홍길동",
    "age": 25,
    "question1": ["행복", "기쁨", "만족"],
    "question2": "매우 좋음",
    "question3": "긍정적",
    "question4": "만족스러움",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**에러 응답 (400):**
```json
{
  "error": {
    "message": "Validation failed: name is required"
  }
}
```

#### 2. 설문 목록 조회

```http
GET /api/surveys?page=1&limit=10
```

페이지네이션을 지원하는 설문 목록을 조회합니다.

**쿼리 파라미터:**
- `page` (선택): 페이지 번호 (기본값: 1)
- `limit` (선택): 페이지당 항목 수 (기본값: 10, 최대: 100)

**성공 응답 (200):**
```json
{
  "data": {
    "surveys": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "date": "2025-01-15",
        "name": "홍길동",
        "age": 25,
        "question1": ["행복", "기쁨"],
        "question2": "매우 좋음",
        "question3": "긍정적",
        "question4": "만족",
        "createdAt": "2025-01-15T10:30:00.000Z",
        "updatedAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "totalSurveys": 1,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

#### 3. 설문 통계 조회

```http
GET /api/surveys/stats
```

전체 설문 데이터의 통계 정보를 조회합니다.

**성공 응답 (200):**
```json
{
  "data": {
    "totalSurveys": 150,
    "ageDistribution": [
      { "range": "20대", "count": 45 },
      { "range": "30대", "count": 38 }
    ],
    "dailyCount": [
      { "date": "2025-01-15", "count": 12 },
      { "date": "2025-01-16", "count": 8 }
    ],
    "hourlyCount": [
      { "hour": 9, "count": 5 },
      { "hour": 14, "count": 12 }
    ],
    "question1Distribution": {
      "행복": 45,
      "기쁨": 32,
      "만족": 28
    },
    "question2Distribution": {
      "매우 좋음": 25,
      "좋음": 40,
      "보통": 15
    },
    "question3Distribution": {
      "긍정적": 55,
      "중립적": 20,
      "부정적": 5
    },
    "heatmapData": [
      { "date": "2025-01-15", "hour": 9, "count": 3 },
      { "date": "2025-01-15", "hour": 14, "count": 7 }
    ]
  }
}
```

#### 4. 설문 수정

```http
PUT /api/surveys/:id
```

기존 설문 응답을 수정합니다.

**URL 파라미터:**
- `id`: 설문 ID (MongoDB ObjectId)

**요청 본문:**
```json
{
  "name": "수정된 이름",
  "age": 26,
  "question2": "좋음"
}
```

**성공 응답 (200):**
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "date": "2025-01-15",
    "name": "수정된 이름",
    "age": 26,
    "question1": ["행복", "기쁨"],
    "question2": "좋음",
    "question3": "긍정적",
    "question4": "만족",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T11:45:00.000Z"
  }
}
```

**에러 응답 (404):**
```json
{
  "error": {
    "message": "Survey not found"
  }
}
```

#### 5. 설문 삭제

```http
DELETE /api/surveys/:id
```

설문 응답을 삭제합니다.

**URL 파라미터:**
- `id`: 설문 ID (MongoDB ObjectId)

**성공 응답 (204):**
```
No Content
```

**에러 응답 (404):**
```json
{
  "error": {
    "message": "삭제할 설문 데이터를 찾을 수 없습니다."
  }
}
```

### API 사용 예시

#### JavaScript (Axios)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000'
});

// 설문 생성
const createSurvey = async (data) => {
  try {
    const response = await api.post('/api/surveys', data);
    console.log('설문 생성 성공:', response.data);
  } catch (error) {
    console.error('설문 생성 실패:', error.response.data);
  }
};

// 설문 목록 조회
const getSurveys = async (page = 1) => {
  try {
    const response = await api.get(`/api/surveys?page=${page}`);
    console.log('설문 목록:', response.data);
  } catch (error) {
    console.error('조회 실패:', error.response.data);
  }
};
```

#### cURL
```bash
# 설문 생성
curl -X POST http://localhost:4000/api/surveys \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-15",
    "name": "홍길동",
    "age": 25,
    "question1": ["행복", "기쁨"],
    "question2": "매우 좋음"
  }'

# 설문 목록 조회
curl http://localhost:4000/api/surveys?page=1&limit=5

# 통계 조회
curl http://localhost:4000/api/surveys/stats

# 설문 삭제
curl -X DELETE http://localhost:4000/api/surveys/507f1f77bcf86cd799439011
```

## 📊 데이터 모델

### Survey 스키마

```javascript
{
  submissionId: ObjectId,     // 제출 ID (참조)
  date: String,              // 설문 날짜 (필수)
  name: String,              // 응답자 이름 (필수)
  age: Number,               // 응답자 나이 (필수)
  question1: [String],       // 질문 1 답변 (배열)
  question2: String,         // 질문 2 답변
  question3: String,         // 질문 3 답변
  question4: String,         // 질문 4 답변
  timestamps: true           // 생성/수정 시간 자동 추가
}
```

## 🔧 개발 도구

### 스크립트

- `npm run dev`: 개발 서버 실행 (nodemon)
- `npm start`: 프로덕션 서버 실행
- `npm test`: 테스트 실행
- `npm run test:watch`: 테스트 감시 모드

### 미들웨어

- **CORS**: 모든 도메인에서의 요청 허용
- **JSON Parser**: JSON 요청 본문 파싱
- **Error Handler**: 전역 에러 처리
- **Not Found**: 404 에러 처리
- **Async Handler**: 비동기 함수 에러 처리

## 🌐 배포

### 환경 변수 (프로덕션)

**AWS EC2 배포 시 환경 변수:**
```env
# MongoDB Atlas 프로덕션 연결
MONGODB_URI=mongodb+srv://prod_user:secure_password@saekindex01.cs8najv.mongodb.net/saekinDB?retryWrites=true&w=majority&appName=SaekIndex01

# 프로덕션 서버 설정
PORT=4000
NODE_ENV=production

# 보안 강화
JWT_SECRET=production_jwt_secret_minimum_32_characters_long
API_SECRET_KEY=production_api_secret_key_for_authentication
```

**환경 변수 보안 관리:**
```bash
# EC2에서 환경 변수 설정
sudo nano /etc/environment

# 또는 PM2 ecosystem 파일 사용
# ecosystem.config.js에서 환경 변수 관리
```

### MongoDB 설정

#### 로컬 MongoDB

```bash
# MongoDB 설치 후
mongod --dbpath /path/to/data
```

#### MongoDB Atlas (클라우드)

1. MongoDB Atlas 계정 생성
2. 클러스터 생성
3. 연결 문자열 복사하여 `MONGODB_URI`에 설정

## 🔍 헬스 체크

서버가 정상적으로 실행되고 있는지 확인:

```bash
curl http://localhost:4000/health
```

## 🤝 프론트엔드와의 연동

이 백엔드는 React 기반의 프론트엔드와 연동됩니다:

- **프론트엔드 URL**: `http://localhost:5173`
- **API 통신**: axios를 통한 REST API 호출
- **CORS**: 모든 도메인 허용 설정

---

## 🔧 핵심 컴포넌트

### 1. 서버 진입점

#### 1-1. package.json

```json
{
  "name": "backend",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "test": "jest --runInBand",
    "test:watch": "jest --watch --runInBand"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^17.2.2",
    "express": "^5.1.0",
    "mongoose": "^8.18.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "mongodb-memory-server": "^10.2.1",
    "nodemon": "^3.1.7",
    "supertest": "^7.0.0"
  }
}
```

#### 1-2. server.js

```javascript
// server.js
require("dotenv").config();
const { connectDB, closeDB } = require("./src/config/db");
const createApp = require("./src/app");

const PORT = process.env.PORT || 4000;

const app = createApp();

async function start() {
  try {
    await connectDB(process.env.MONGODB_URI);

    if (require.main === module) {
      app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    }
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

// graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down...");
  await closeDB();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down...");
  await closeDB();
  process.exit(0);
});

module.exports = app;
```

#### 1-3. .gitignore

```gitignore
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
*.env
*.pem
/.env
/secret.txt

node_modules
```

### 2. 애플리케이션 설정

#### 2-1. src/app.js

```javascript
// src/app.js
const express = require("express");
const cors = require("cors");
const surveysRouter = require("./routes/surveys.routes");
const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");
const mongoose = require("mongoose");

function createApp() {
  const app = express();

  app.use(cors({ origin: "*" }));
  app.use(express.json());

  app.get("/health", (req, res) => {
    const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    res.json({ status: "ok", db: state });
  });

  app.use("/api/surveys", surveysRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
```

### 3. 데이터베이스 설정

#### 3-1. src/config/db.js

```javascript
// src/config/db.js
const mongoose = require("mongoose");

async function connectDB(uri, dbName) {
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Set it in environment variables.");
  }
  await mongoose.connect(uri, {
    dbName,
    autoIndex: process.env.NODE_ENV !== "production",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });
  mongoose.connection.on("connected", () => {
    console.log(`[MongoDB] connected: ${mongoose.connection.name}`);
  });
  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] connection error:", err);
  });
}

async function closeDB() {
  try {
    await mongoose.connection.close(false);
    console.log("[MongoDB] connection closed");
  } catch (err) {
    console.error("[MongoDB] error on close:", err);
  }
}

module.exports = { connectDB, closeDB };
```

### 4. 데이터 모델

#### 4-1. src/models/survey.model.js

```javascript
// src/models/survey.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const SurveySchema = new Schema(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: "Submission" },
    date: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    question1: [String],
    question2: String,
    question3: String,
    question4: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Survey || mongoose.model("Survey", SurveySchema);
```

### 5. 라우터

#### 5-1. src/routes/surveys.routes.js

```javascript
// src/routes/surveys.routes.js
const express = require("express");
const controller = require("../controllers/surveys.controller");
const asyncHandler = require("../utils/asyncHandler");
const router = express.Router();

router.post("/", asyncHandler(controller.createSurvey));
router.get("/", asyncHandler(controller.getSurveys));
router.get("/stats", asyncHandler(controller.getStats));
router.put("/:id", asyncHandler(controller.updateSurvey));
router.delete("/:id", asyncHandler(controller.deleteSurvey));

module.exports = router;
```

### 6. 컨트롤러

#### 6-1. src/controllers/surveys.controller.js

```javascript
/* src/controllers/surveys.controller.js */
const service = require("../services/surveys.service");
const asyncHandler = require("../utils/asyncHandler");

exports.createSurvey = asyncHandler(async (req, res) => {
  const created = await service.createSurvey(req.body);
  res.status(201).json({ data: created });
});

exports.getSurveys = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await service.getAllSurveys(page, limit);
  res.json({ data: result });
});

exports.getStats = asyncHandler(async (req, res) => {
  const stats = await service.getSurveyStats();
  res.json({ data: stats });
});

exports.updateSurvey = asyncHandler(async (req, res) => {
  /* ... */
});

exports.deleteSurvey = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`[DELETE CONTROLLER] ID: ${id}에 대한 삭제 요청을 받았습니다.`);

  const deletedDocument = await service.deleteSurvey(id);

  if (!deletedDocument) {
    console.log(
      `[DELETE CONTROLLER] 서비스에서 ID: ${id}에 해당하는 문서를 찾지 못했다고 보고했습니다.`
    );
    return res
      .status(404)
      .json({ error: { message: "삭제할 설문 데이터를 찾을 수 없습니다." } });
  }

  console.log(
    "[DELETE CONTROLLER] 성공적으로 문서를 삭제했습니다. 204 응답을 보냅니다."
  );
  res.status(204).send();
});
```

### 7. 서비스 레이어

#### 7-1. src/services/surveys.service.js

```javascript
// src/services/surveys.service.js
const Survey = require("../models/survey.model");

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
    console.error("[SERVICE ERROR] in getAllSurveys:", error);
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
      message: "No data available.",
    };
  }

  const ageDistribution = {};
  const dailyHourlyCount = {};
  const dailyCounts = {};
  const hourlyCounts = {};
  const question1Distribution = {};
  const question2Distribution = {};
  const question3Distribution = {};

  allSurveys.forEach((survey) => {
    // 1. 연령대별 분포 집계
    const age = survey.age;
    if (age <= 19)
      ageDistribution["10대 이하"] = (ageDistribution["10대 이하"] || 0) + 1;
    else if (age >= 20 && age <= 29)
      ageDistribution["20대"] = (ageDistribution["20대"] || 0) + 1;
    else if (age >= 30 && age <= 39)
      ageDistribution["30대"] = (ageDistribution["30대"] || 0) + 1;
    else if (age >= 40 && age <= 49)
      ageDistribution["40대"] = (ageDistribution["40대"] || 0) + 1;
    else if (age >= 50 && age <= 59)
      ageDistribution["50대"] = (ageDistribution["50대"] || 0) + 1;
    else if (age >= 60 && age <= 69)
      ageDistribution["60대"] = (ageDistribution["60대"] || 0) + 1;
    else if (age >= 70 && age <= 79)
      ageDistribution["70대"] = (ageDistribution["70대"] || 0) + 1;
    else ageDistribution["80대 이상"] = (ageDistribution["80대 이상"] || 0) + 1;

    // 2. 날짜, 시간대별 데이터 집계
    const date = new Date(survey.createdAt).toISOString().split("T")[0];
    const hour = new Date(survey.createdAt).getHours();

    if (!dailyHourlyCount[date]) {
      dailyHourlyCount[date] = {};
    }
    dailyHourlyCount[date][hour] = (dailyHourlyCount[date][hour] || 0) + 1;

    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;

    // 3. 문항별 응답 비율 집계
    if (Array.isArray(survey.question1)) {
      survey.question1.forEach((value) => {
        question1Distribution[value] = (question1Distribution[value] || 0) + 1;
      });
    }
    if (survey.question2) {
      question2Distribution[survey.question2] =
        (question2Distribution[survey.question2] || 0) + 1;
    }
    if (survey.question3) {
      question3Distribution[survey.question3] =
        (question3Distribution[survey.question3] || 0) + 1;
    }
  });

  // 히트맵 데이터를 위한 배열 변환
  const heatmapData = [];
  Object.keys(dailyHourlyCount).forEach((date) => {
    Object.keys(dailyHourlyCount[date]).forEach((hour) => {
      heatmapData.push({
        date,
        hour: parseInt(hour),
        count: dailyHourlyCount[date][hour],
      });
    });
  });

  return {
    totalSurveys: allSurveys.length,
    ageDistribution: Object.entries(ageDistribution)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => parseInt(a.range) - parseInt(b.range)),
    dailyCount: Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    hourlyCount: Object.entries(hourlyCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour),
    question1Distribution,
    question2Distribution,
    question3Distribution,
    heatmapData,
  };
}

async function updateSurvey(id, payload) {
  const updateData = Object.fromEntries(
    Object.entries(payload).filter(
      ([_, v]) => v !== null && v !== undefined && v !== ""
    )
  );
  return await Survey.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true, lean: true }
  );
}

async function deleteSurvey(id) {
  console.log(
    `[DELETE SERVICE] ID: ${id}로 DB에서 문서를 찾아서 삭제를 시도합니다.`
  );
  try {
    const result = await Survey.findByIdAndDelete(id).lean();

    if (result) {
      console.log(
        "[DELETE SERVICE] Mongoose가 성공적으로 문서를 찾아 삭제했습니다."
      );
    } else {
      console.log(
        "[DELETE SERVICE] Mongoose가 해당 ID의 문서를 찾지 못했습니다. null을 반환합니다."
      );
    }
    return result;
  } catch (error) {
    console.error(
      "[DELETE SERVICE] findByIdAndDelete 함수 실행 중 심각한 오류 발생:",
      error
    );
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
```

### 8. 미들웨어

#### 8-1. src/middleware/error.middleware.js

```javascript
// src/middleware/error.middleware.js
module.exports = function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const payload = {
    error: {
      message: err.message || "Internal Server Error",
    },
  };

  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.error.stack = err.stack;
  }

  res.status(status).json(payload);
};
```

#### 8-2. src/middleware/notFound.middleware.js

```javascript
// src/middleware/notFound.middleware.js
module.exports = function notFound(req, res) {
  res.status(404).json({ error: { message: "Resource not found" } });
};
```

### 9. 유틸리티

#### 9-1. src/utils/asyncHandler.js

```javascript
// src/utils/asyncHandler.js
module.exports = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
```

## 🐛 문제 해결

### 자주 발생하는 문제

#### 1. MongoDB 연결 실패

**에러 메시지:**
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**원인 및 해결 방법:**

- **MongoDB 서비스가 실행되지 않음**
  ```bash
  # Windows
  net start MongoDB
  
  # macOS
  brew services start mongodb/brew/mongodb-community
  
  # Linux
  sudo systemctl start mongod
  ```

- **잘못된 연결 문자열**
  - `.env` 파일의 `MONGODB_URI` 확인
  - Atlas 사용 시 사용자명/비밀번호 확인
  - 네트워크 접근 권한 확인

- **방화벽 문제**
  ```bash
  # MongoDB 기본 포트 확인
  telnet localhost 27017
  ```

#### 2. 환경 변수 인식 안됨

**에러 메시지:**
```
MONGODB_URI is missing. Set it in environment variables.
```

**해결 방법:**

- `.env` 파일이 프로젝트 루트에 있는지 확인
- 파일명이 정확한지 확인 (`.env.txt` 아님)
- 환경 변수 형식 확인:
  ```env
  MONGODB_URI=mongodb://localhost:27017/saekindex
  PORT=4000
  ```
- 서버 재시작: `npm run dev`

#### 3. 포트 충돌

**에러 메시지:**
```
Error: listen EADDRINUSE: address already in use :::4000
```

**해결 방법:**

- 다른 프로세스가 4000번 포트를 사용 중인지 확인:
  ```bash
  # Windows
  netstat -ano | findstr :4000
  
  # macOS/Linux
  lsof -i :4000
  ```

- 프로세스 종료 또는 다른 포트 사용:
  ```env
  PORT=4001
  ```

#### 4. CORS 에러

**에러 메시지:**
```
Access to fetch at 'http://localhost:4000/api/surveys' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**해결 방법:**

- 현재 설정은 모든 도메인 허용 (`origin: '*'`)
- 특정 도메인만 허용하려면 `src/app.js` 수정:
  ```javascript
  app.use(cors({ 
    origin: ['http://localhost:5173', 'https://yourdomain.com'] 
  }));
  ```

#### 5. 데이터 유효성 검사 실패

**에러 메시지:**
```
ValidationError: Survey validation failed: name: Path `name` is required.
```

**해결 방법:**

- 필수 필드 확인: `date`, `name`, `age`
- 데이터 타입 확인:
  - `age`: 숫자형
  - `question1`: 문자열 배열
  - 나머지: 문자열

#### 6. 메모리 부족 (대용량 데이터)

**에러 메시지:**
```
JavaScript heap out of memory
```

**해결 방법:**

- Node.js 메모리 제한 증가:
  ```bash
  node --max-old-space-size=4096 server.js
  ```

- 통계 쿼리 최적화 (페이지네이션 적용)
- 인덱스 추가로 쿼리 성능 향상

### 디버깅 팁

#### 로그 확인
```javascript
// 개발 환경에서 상세 로그 활성화
console.log('[DEBUG]', '디버그 메시지');
console.error('[ERROR]', error);
```

#### MongoDB 직접 접근
```bash
# MongoDB 쉘 접속
mongosh

# 데이터베이스 선택
use saekindex

# 컬렉션 확인
show collections

# 데이터 조회
db.surveys.find().limit(5)

# 데이터 개수 확인
db.surveys.countDocuments()
```

#### API 테스트 도구
- **Postman**: GUI 기반 API 테스트
- **Insomnia**: 가벼운 API 클라이언트
- **Thunder Client**: VS Code 확장

## 🚀 배포 (AWS 기반)

### AWS 배포 아키텍처

```
Internet → ALB → EC2 Instance → MongoDB Atlas
                    ↓
                CloudWatch (로깅/모니터링)
```

### 1. AWS EC2 배포

#### 1-1. EC2 인스턴스 생성

1. **AWS 콘솔 접속**
   - EC2 서비스 선택
   - "Launch Instance" 클릭

2. **인스턴스 설정**
   - **AMI**: Amazon Linux 2 또는 Ubuntu 20.04 LTS
   - **Instance Type**: t3.micro (프리티어) 또는 t3.small
   - **Key Pair**: 새로 생성하거나 기존 키 사용
   - **Security Group**: HTTP(80), HTTPS(443), SSH(22), Custom(4000) 포트 허용

3. **보안 그룹 설정**
   ```
   Type        Protocol    Port Range    Source
   SSH         TCP         22           My IP
   HTTP        TCP         80           0.0.0.0/0
   HTTPS       TCP         443          0.0.0.0/0
   Custom TCP  TCP         4000         0.0.0.0/0
   ```

#### 1-2. 서버 환경 설정

```bash
# EC2 인스턴스 접속
ssh -i your-key.pem ec2-user@your-ec2-ip

# 시스템 업데이트
sudo yum update -y  # Amazon Linux
# 또는
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Node.js 설치 (NodeSource 저장소 사용)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs  # Amazon Linux
# 또는
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs  # Ubuntu

# Git 설치
sudo yum install -y git  # Amazon Linux
# 또는
sudo apt install -y git  # Ubuntu

# PM2 설치 (프로세스 관리자)
sudo npm install -g pm2
```

#### 1-3. 애플리케이션 배포

```bash
# 프로젝트 클론
git clone <your-repository-url>
cd BackEnd

# 의존성 설치
npm install --production

# 환경 변수 설정
sudo nano .env
```

**.env 파일 (프로덕션):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saekindex
PORT=4000
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key_here
API_SECRET_KEY=your_api_secret_key_here
```

```bash
# PM2로 애플리케이션 시작
pm2 start server.js --name "saekindex-api"

# PM2 프로세스 확인
pm2 list

# PM2 로그 확인
pm2 logs saekindex-api

# 시스템 재부팅 시 자동 시작 설정
pm2 startup
pm2 save
```

### 2. Application Load Balancer (ALB) 설정

#### 2-1. ALB 생성

1. **EC2 콘솔 → Load Balancers → Create Load Balancer**
2. **Application Load Balancer 선택**
3. **기본 설정**
   - Name: `saekindex-alb`
   - Scheme: Internet-facing
   - IP address type: IPv4

4. **네트워크 매핑**
   - VPC: 기본 VPC 선택
   - Availability Zones: 최소 2개 선택

5. **보안 그룹**
   - HTTP(80), HTTPS(443) 허용하는 보안 그룹 생성/선택

#### 2-2. 타겟 그룹 설정

1. **타겟 그룹 생성**
   - Target type: Instances
   - Protocol: HTTP
   - Port: 4000
   - Health check path: `/health`

2. **타겟 등록**
   - EC2 인스턴스 선택하여 타겟 그룹에 추가

#### 2-3. 리스너 설정

```
HTTP:80 → Redirect to HTTPS:443
HTTPS:443 → Forward to Target Group
```

### 3. SSL/TLS 인증서 (AWS Certificate Manager)

#### 3-1. 도메인 준비

1. **도메인 구매** (Route 53 또는 외부 도메인 등록업체)
2. **Route 53 호스팅 영역 생성** (선택사항)

#### 3-2. SSL 인증서 발급

1. **Certificate Manager 콘솔 접속**
2. **Request a certificate**
   - Domain name: `api.yourdomain.com`
   - Validation method: DNS validation (권장)

3. **DNS 검증**
   - Route 53 사용 시 자동으로 CNAME 레코드 추가
   - 외부 DNS 사용 시 수동으로 CNAME 레코드 추가

#### 3-3. ALB에 인증서 연결

1. **ALB 리스너 편집**
2. **HTTPS:443 리스너에 SSL 인증서 연결**

### 4. 도메인 설정 (Route 53)

```bash
# A 레코드 생성
Name: api.yourdomain.com
Type: A
Alias: Yes
Alias Target: ALB DNS name
```

### 5. 환경별 배포 스크립트

#### 5-1. 배포 스크립트 (`deploy.sh`)

```bash
#!/bin/bash

# 배포 스크립트
set -e

echo "🚀 Starting deployment..."

# Git 최신 코드 가져오기
git pull origin main

# 의존성 설치
npm install --production

# 애플리케이션 재시작
pm2 restart saekindex-api

# 헬스 체크
sleep 5
curl -f http://localhost:4000/health || exit 1

echo "✅ Deployment completed successfully!"
```

#### 5-2. GitHub Actions 워크플로우 (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to AWS EC2

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to EC2
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ec2-user
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          cd /home/ec2-user/BackEnd
          git pull origin main
          npm install --production
          pm2 restart saekindex-api
          sleep 5
          curl -f http://localhost:4000/health
```

### 6. 모니터링 및 로깅

#### 6-1. CloudWatch 설정

```bash
# CloudWatch 에이전트 설치
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# 설정 파일 생성
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

#### 6-2. PM2 모니터링

```bash
# PM2 모니터링 대시보드
pm2 monit

# 메모리/CPU 사용량 확인
pm2 show saekindex-api

# 로그 실시간 확인
pm2 logs saekindex-api --lines 100
```

### 7. 보안 강화

#### 7-1. 환경 변수 보안

**AWS Systems Manager Parameter Store 사용 (권장):**
```bash
# MongoDB Atlas 연결 문자열을 안전하게 저장
aws ssm put-parameter \
  --name "/saekindex/mongodb-uri" \
  --value "mongodb+srv://prod_user:secure_pass@saekindex01.cs8najv.mongodb.net/saekinDB?retryWrites=true&w=majority" \
  --type "SecureString" \
  --description "SaekIndex MongoDB Atlas connection string"

# JWT 시크릿 저장
aws ssm put-parameter \
  --name "/saekindex/jwt-secret" \
  --value "your_production_jwt_secret_key" \
  --type "SecureString"
```

**애플리케이션에서 Parameter Store 사용:**
```javascript
// src/config/aws-params.js
const AWS = require('aws-sdk');
const ssm = new AWS.SSM({ region: 'ap-northeast-2' });

const getParameter = async (name) => {
  try {
    const result = await ssm.getParameter({
      Name: name,
      WithDecryption: true
    }).promise();
    return result.Parameter.Value;
  } catch (error) {
    console.error(`Failed to get parameter ${name}:`, error);
    throw error;
  }
};

// 사용 예시
const mongoUri = await getParameter('/saekindex/mongodb-uri');
const jwtSecret = await getParameter('/saekindex/jwt-secret');
```

**EC2 환경 변수 직접 설정:**
```bash
# /etc/environment 파일에 추가
sudo nano /etc/environment

# 내용 추가:
MONGODB_URI="mongodb+srv://prod_user:secure_pass@saekindex01.cs8najv.mongodb.net/saekinDB?retryWrites=true&w=majority"
NODE_ENV="production"
PORT="4000"
```

#### 7-2. 보안 그룹 최적화

```bash
# SSH 접근을 특정 IP로 제한
Source: My IP (현재 IP만 허용)

# API 포트는 ALB에서만 접근 허용
Source: ALB Security Group ID
```

### 8. 성능 최적화

#### 8-1. MongoDB 인덱스 생성

```javascript
// 자주 사용되는 쿼리에 대한 인덱스 생성
db.surveys.createIndex({ "createdAt": -1 })
db.surveys.createIndex({ "age": 1 })
db.surveys.createIndex({ "date": 1 })
```

#### 8-2. 캐싱 전략

```javascript
// Redis 캐싱 (선택사항)
const redis = require('redis');
const client = redis.createClient();

// 통계 데이터 캐싱 (5분)
const getCachedStats = async () => {
  const cached = await client.get('survey-stats');
  if (cached) return JSON.parse(cached);
  
  const stats = await getSurveyStats();
  await client.setex('survey-stats', 300, JSON.stringify(stats));
  return stats;
};
```

### 9. 백업 및 복구

#### 9-1. MongoDB Atlas 자동 백업

- Atlas 클러스터는 자동으로 백업됨
- Point-in-time recovery 지원
- 수동 스냅샷 생성 가능

#### 9-2. 애플리케이션 코드 백업

```bash
# Git 저장소가 백업 역할
# 정기적으로 원격 저장소에 푸시
git push origin main

# EC2 인스턴스 AMI 생성 (주기적)
aws ec2 create-image \
  --instance-id i-1234567890abcdef0 \
  --name "saekindex-backup-$(date +%Y%m%d)"
```

### 10. 비용 최적화

#### 10-1. EC2 인스턴스 최적화

- **t3.micro**: 개발/테스트 환경
- **t3.small**: 소규모 프로덕션
- **t3.medium**: 중간 규모 트래픽

#### 10-2. 모니터링 및 알림

```bash
# CloudWatch 알람 설정
aws cloudwatch put-metric-alarm \
  --alarm-name "High-CPU-Usage" \
  --alarm-description "Alarm when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

---

## 🔧 개발 도구

### 개발 워크플로우

#### 1. 코드 작성

```bash
# 기능 브랜치 생성
git checkout -b feature/new-api-endpoint

# 개발 서버 실행
npm run dev

# 코드 작성 및 테스트
```

#### 2. 코드 품질 검사

```bash
# ESLint 검사 (설정 시)
npm run lint

# 테스트 실행
npm test

# 코드 커버리지 확인
npm run test:coverage
```

#### 3. 커밋 및 푸시

```bash
git add .
git commit -m "feat: add new survey statistics endpoint"
git push origin feature/new-api-endpoint
```

### 코딩 규칙

#### 파일 명명 규칙

- **모델**: `survey.model.js` (소문자, 점 구분)
- **컨트롤러**: `surveys.controller.js` (복수형)
- **서비스**: `surveys.service.js` (복수형)
- **라우터**: `surveys.routes.js` (복수형)
- **미들웨어**: `error.middleware.js` (기능명)

#### 코드 스타일

```javascript
// 함수명: camelCase
const getUserById = async (id) => {
  // 구현
};

// 상수: UPPER_SNAKE_CASE
const MAX_PAGE_SIZE = 100;

// 에러 처리: 항상 try-catch 또는 asyncHandler 사용
exports.createSurvey = asyncHandler(async (req, res) => {
  const survey = await surveyService.createSurvey(req.body);
  res.status(201).json({ data: survey });
});
```

### 테스트 작성 가이드

#### 단위 테스트 예시

```javascript
// tests/services/surveys.service.test.js
const { createSurvey } = require('../../src/services/surveys.service');
const Survey = require('../../src/models/survey.model');

describe('Survey Service', () => {
  test('should create a new survey', async () => {
    const surveyData = {
      date: '2025-01-15',
      name: '테스트 사용자',
      age: 25
    };

    const result = await createSurvey(surveyData);
    
    expect(result).toHaveProperty('_id');
    expect(result.name).toBe('테스트 사용자');
    expect(result.age).toBe(25);
  });
});
```

#### 통합 테스트 예시

```javascript
// tests/routes/surveys.routes.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/surveys', () => {
  test('should create a new survey', async () => {
    const surveyData = {
      date: '2025-01-15',
      name: '테스트 사용자',
      age: 25,
      question1: ['행복', '기쁨']
    };

    const response = await request(app)
      .post('/api/surveys')
      .send(surveyData)
      .expect(201);

    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data.name).toBe('테스트 사용자');
  });
});
```

---

## 🔒 보안 파일 관리

### 중요 보안 파일들

프로젝트에는 다음과 같은 보안 관련 파일들이 있습니다:

#### 1. 환경 변수 파일
```bash
.env                    # 환경 변수 (Git에서 제외됨)
.env.example           # 환경 변수 템플릿 (Git에 포함)
```

#### 2. AWS 관련 파일
```bash
saekindex.pem          # AWS EC2 접속용 키 파일 (Git에서 제외됨)
```

### 보안 파일 관리 규칙

> ⚠️ **절대 Git에 커밋하지 말아야 할 파일들**:
>
> - ✅ `.env` - 데이터베이스 연결 정보 포함
> - ✅ `*.pem` - AWS EC2 SSH 키 파일
> - ✅ `*.key` - 모든 종류의 개인키 파일
> - ✅ `config/secrets.js` - 하드코딩된 비밀 정보

### .gitignore 확인

현재 프로젝트의 `.gitignore`에 다음 항목들이 포함되어 있는지 확인:

```gitignore
# 환경 변수
*.env
/.env
/secret.txt

# AWS 키 파일
*.pem
*.key

# 로그 파일
logs
*.log

# 의존성
node_modules
```

### 보안 파일 백업 및 공유

#### 안전한 공유 방법:
1. **AWS Systems Manager Parameter Store** (권장)
2. **팀 전용 비밀번호 관리자** (1Password, Bitwarden 등)
3. **암호화된 파일 공유** (GPG 암호화)

#### 절대 하지 말아야 할 것:
- ❌ 이메일로 비밀번호 전송
- ❌ Slack/Discord에 키 파일 업로드
- ❌ 스크린샷에 비밀 정보 포함
- ❌ 공개 저장소에 실제 연결 정보 커밋

---

## 📝 참고사항

### 개발 가이드라인

- 모든 API 응답은 JSON 형태입니다
- 에러 발생 시 적절한 HTTP 상태 코드와 에러 메시지를 반환합니다
- **MongoDB Atlas 클라우드 데이터베이스**를 기본으로 사용합니다
- 개발 시에는 nodemon을 사용하여 파일 변경 시 자동 재시작됩니다
- 모든 비동기 함수는 asyncHandler로 래핑되어 에러 처리가 자동화됩니다
- 통계 API는 실시간으로 데이터를 집계하여 다양한 분석 정보를 제공합니다

### 보안 고려사항

- **MongoDB Atlas 사용**: 클라우드 기반 보안 및 백업 자동화
- **환경 변수 관리**: 모든 민감한 정보는 `.env` 파일로 관리
- **CORS 설정**: 프로덕션에서는 특정 도메인만 허용
- **입력 데이터 검증**: Mongoose 스키마를 통한 데이터 유효성 검사
- **정기적 보안 업데이트**: 의존성 패키지 정기 업데이트
- **AWS 보안**: EC2 보안 그룹 및 키 파일 관리

### 성능 최적화

- **MongoDB Atlas 인덱스**: 자주 사용되는 쿼리에 대한 인덱스 설정
- **페이지네이션**: 대용량 데이터 처리를 위한 페이지 분할
- **연결 풀링**: Mongoose 연결 풀 최적화
- **캐싱 전략**: 통계 데이터 캐싱 (향후 Redis 도입 고려)
- **압축 미들웨어**: gzip 압축으로 응답 크기 최적화
