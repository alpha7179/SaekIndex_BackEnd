# SaekIndex 백엔드

감정 분석 기반 설문 조사 시스템의 백엔드 서버입니다.

---

## 🚀 주요 기능

- **설문 관리**: 설문 생성, 조회, 수정, 삭제
- **감정 분석**: Python CNN 모델을 사용한 실시간 얼굴 감정 분석
- **데이터 융합**: 설문 응답과 웹캠 감정 데이터 통합
- **통계 분석**: 설문 결과 및 감정 데이터 통계
- **세션 관리**: Redis/메모리 기반 세션 관리
- **캐싱**: 성능 최적화를 위한 캐싱 시스템

---

## 📋 기술 스택

### Backend
- **Node.js** 18.x
- **Express** 4.x
- **MongoDB** (Mongoose)
- **Redis** (선택사항)

### Python (감정 분석)
- **Python** 3.11
- **PyTorch** 2.1.0
- **MediaPipe** 0.10.8
- **Flask** 3.0.0

### 배포
- **PM2** (프로세스 관리)
- **AWS EC2** (Ubuntu 22.04)

---

## 🛠️ 로컬 개발 환경 설정

### 필수 요구사항

- Node.js 18.x 이상
- Python 3.11
- MongoDB (Atlas 또는 로컬)
- Git

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/YOUR_USERNAME/SaekIndex_BackEnd.git
cd SaekIndex_BackEnd

# 2. Node.js 패키지 설치
npm install

# 3. Python 가상환경 생성 (Windows)
python -m venv .venv
.\.venv\Scripts\activate

# 3. Python 가상환경 생성 (Mac/Linux)
python3.11 -m venv .venv
source .venv/bin/activate

# 4. Python 패키지 설치
pip install --upgrade pip
pip install -r requirements.txt

# 5. 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 MongoDB URI 등 설정

# 6. Python 서버 테스트
python src/services/emotion_server.py
# Ctrl+C로 종료

# 7. 가상환경 비활성화
deactivate

# 8. 백엔드 서버 시작
npm run dev
```

---

## 🌐 AWS EC2 배포

상세한 배포 가이드는 **[AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)** 를 참고하세요.

### 빠른 배포

```bash
# EC2 인스턴스 접속 후

# 1. 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 2. Python 3.11 설치
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# 3. Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 4. 프로젝트 클론
git clone https://github.com/YOUR_USERNAME/SaekIndex_BackEnd.git
cd SaekIndex_BackEnd

# 5. Python 환경 설정
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate

# 6. Node.js 패키지 설치
npm install

# 7. 환경 변수 설정
cp .env.example .env
nano .env  # 환경 변수 수정

# 8. PM2로 서버 시작
sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 📁 프로젝트 구조

```
SaekIndex_BackEnd/
├── src/
│   ├── config/           # 설정 파일
│   ├── controllers/      # 컨트롤러
│   ├── middleware/       # 미들웨어
│   ├── models/           # MongoDB 모델
│   ├── routes/           # API 라우트
│   ├── services/         # 비즈니스 로직
│   │   ├── emotion_server.py  # Python 감정 분석 서버
│   │   └── ...
│   ├── utils/            # 유틸리티
│   └── validators/       # 입력 검증
├── scripts/              # 유틸리티 스크립트
├── .env.example          # 환경 변수 예시
├── ecosystem.config.js   # PM2 설정
├── package.json
├── requirements.txt      # Python 패키지
└── server.js             # 진입점
```

---

## 🔧 환경 변수

`.env` 파일에 다음 변수들을 설정하세요:

```bash
# 서버 설정
NODE_ENV=development
PORT=4000

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Redis (선택사항)
REDIS_HOST=localhost
REDIS_PORT=6379

# Python 서버
EMOTION_SERVER_PORT=5001

# 로그
LOG_LEVEL=info

# 세션
SESSION_SECRET=your-secret-key
```

---

## 📡 API 엔드포인트

### 헬스 체크
```
GET /health
```

### 설문 관리
```
GET    /api/surveys              # 설문 목록
GET    /api/surveys/:id          # 설문 상세
POST   /api/surveys              # 설문 생성
PUT    /api/surveys/:id          # 설문 수정
DELETE /api/surveys/:id          # 설문 삭제
GET    /api/surveys/statistics   # 통계
```

### 감정 분석
```
POST   /api/emotion/analyze      # 감정 분석
POST   /api/emotion/start-session # 세션 시작
POST   /api/emotion/push-webcam  # 웹캠 데이터 전송
POST   /api/emotion/fuse         # 데이터 융합
```

---

## 🧪 테스트

```bash
# 헬스 체크
curl http://localhost:4000/health

# 설문 목록 조회
curl http://localhost:4000/api/surveys

# 통계 조회
curl http://localhost:4000/api/surveys/statistics
```

---

## 📊 모니터링

### PM2 명령어

```bash
pm2 status          # 상태 확인
pm2 logs            # 로그 확인
pm2 monit           # 실시간 모니터링
pm2 restart all     # 재시작
pm2 stop all        # 중지
```

### 로그 확인

```bash
# 개발 환경
npm run logs:view      # 모든 로그
npm run logs:error     # 에러 로그만

# 프로덕션 환경
pm2 logs
```

---

## 🚨 문제 해결

### Python 서버 시작 실패

```bash
# 가상환경 활성화
source .venv/bin/activate  # Linux/Mac
.\.venv\Scripts\activate   # Windows

# Python 서버 수동 테스트
python src/services/emotion_server.py

# 패키지 재설치
pip install -r requirements.txt
```

### MongoDB 연결 실패

- MongoDB Atlas IP 화이트리스트 확인
- `.env` 파일의 `MONGODB_URI` 확인
- 네트워크 연결 확인

### 포트 충돌

```bash
# 포트 사용 중인 프로세스 확인 (Windows)
netstat -ano | findstr :4000

# 포트 사용 중인 프로세스 확인 (Linux/Mac)
lsof -i :4000

# 프로세스 종료
kill -9 <PID>
```

---

## 📚 문서

- **[AWS 배포 가이드](./AWS_DEPLOYMENT_GUIDE.md)** - EC2 배포 완전 가이드
- **[체크리스트](./CHECKLIST.md)** - 배포 체크리스트

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

SaekIndex Team

---

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
