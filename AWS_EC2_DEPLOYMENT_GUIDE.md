# AWS EC2 배포 완전 가이드

> **SaekIndex 백엔드를 AWS EC2에 배포하는 통합 가이드**  
> 빠른 배포부터 상세 설정까지 모든 내용을 포함합니다.

---

## 📑 목차

### 🚀 [Part 1: 빠른 시작 (5분)](#part-1-빠른-시작)
- 이미 EC2가 있고 빠르게 배포하고 싶다면 여기서 시작

### 📖 [Part 2: 상세 가이드](#part-2-상세-가이드)
- 처음 배포하거나 자세한 설명이 필요하다면 여기서 시작

### 🔧 [Part 3: 주요 변경사항](#part-3-주요-변경사항)
- 로컬과 EC2 환경의 차이점

### 🔄 [Part 4: 업데이트 및 관리](#part-4-업데이트-및-관리)
- 코드 업데이트 및 서버 관리

### 🐛 [Part 5: 문제 해결](#part-5-문제-해결)
- 자주 발생하는 문제와 해결 방법

---


# Part 1: 빠른 시작

> ⚡ **이미 EC2 인스턴스가 있고 빠르게 배포하고 싶다면 이 섹션만 따라하세요!**

## 1️⃣ EC2 접속

```bash
ssh -i saekindex-key.pem ubuntu@YOUR_EC2_IP
```

## 2️⃣ 시스템 준비 (2분)

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Python 3.11 설치
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 버전 확인
python3.11 --version  # Python 3.11.x
node --version        # v18.x.x
```

## 3️⃣ 프로젝트 배포 (2분)

```bash
# 프로젝트 클론
git clone https://github.com/YOUR_USERNAME/SaekIndex_BackEnd.git
cd SaekIndex_BackEnd

# Python 가상환경 생성 (.venv)
python3.11 -m venv .venv

# 만약 위 명령이 실패하면 아래 명령 시도:
# python3 -m venv .venv

source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt  # 5-10분 소요
deactivate

# Node.js 패키지 설치
npm install
```


## 4️⃣ 환경 변수 설정 (1분)

```bash
# .env 파일 생성
cp .env.example .env
nano .env
```

**필수 설정 항목**:
```bash
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

저장: `Ctrl + O` → `Enter` → `Ctrl + X`

## 5️⃣ 서버 시작 (1분)

```bash
# PM2 전역 설치
sudo npm install -g pm2

# 서버 시작 (프로덕션 모드)
pm2 start ecosystem.config.js --env production

# 자동 시작 설정
pm2 save
pm2 startup  # 출력된 명령어 복사하여 실행

# 상태 확인
pm2 status
pm2 logs
```

## ✅ 배포 확인

```bash
# 헬스 체크
curl http://YOUR_EC2_IP:4000/health

# 브라우저에서 확인
http://YOUR_EC2_IP:4000/health
```

**정상 응답**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T05:00:00.000Z"
}
```

🎉 **배포 완료!** 서버가 정상 작동합니다.

---


# Part 2: 상세 가이드

> 📖 **처음 배포하거나 각 단계를 자세히 이해하고 싶다면 이 섹션을 읽으세요.**

## 1. EC2 인스턴스 생성

### 1-1. AWS 콘솔 설정

**AMI**: Ubuntu Server 22.04 LTS  
**인스턴스 유형**: t2.micro (프리 티어) 또는 t2.small (권장)  
**키 페어**: 새로 생성 후 안전하게 보관  
**보안 그룹**:
- SSH (22): 내 IP
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- Custom TCP (4000): 0.0.0.0/0

**스토리지**: 30 GB gp3

### 1-2. SSH 접속 설정

**Windows**:
```powershell
icacls saekindex-key.pem /inheritance:r
icacls saekindex-key.pem /grant:r "%USERNAME%:R"
ssh -i saekindex-key.pem ubuntu@YOUR_EC2_IP
```

**Mac/Linux**:
```bash
chmod 400 saekindex-key.pem
ssh -i saekindex-key.pem ubuntu@YOUR_EC2_IP
```

## 2. 시스템 초기 설정

```bash
# 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 도구 설치
sudo apt install -y git curl build-essential

# Python 3.11 설치
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```


## 3. 프로젝트 배포 상세

### 3-1. Git 저장소 클론

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/SaekIndex_BackEnd.git
cd SaekIndex_BackEnd
```

### 3-2. Python 가상환경 설정

```bash
# 가상환경 생성 (.venv)
python3.11 -m venv .saekindex

# 만약 위 명령이 실패하면 아래 방법 중 하나를 시도:
# 방법 1: python3 사용
# python3 -m venv .venv

# 방법 2: virtualenv 사용
# sudo apt install -y python3-virtualenv
# virtualenv -p python3.11 .venv

# 활성화
source .saekindex/bin/activate

# pip 업그레이드
pip install --upgrade pip

# 패키지 설치 (5-10분 소요)
pip install -r requirements.txt

# 설치 확인
pip list | grep -E "torch|mediapipe|flask"

# 비활성화
deactivate
```

### 3-3. Node.js 패키지 설치

```bash
# 패키지 설치
npm install

# PM2 전역 설치
sudo npm install -g pm2
```

### 3-4. 모델 파일 업로드 (필요 시)

**로컬에서 실행**:
```bash
scp -i saekindex-key.pem -r ../1st_model ubuntu@YOUR_EC2_IP:~/SaekIndex_BackEnd/
```

## 4. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env
nano .env
```

**전체 환경 변수**:
```bash
# 서버 설정
NODE_ENV=production
PORT=4000

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
DB_NAME=saekinDB

# Redis (선택)
REDIS_HOST=localhost
REDIS_PORT=6379

# Python 서버
EMOTION_SERVER_PORT=5001

# CORS
CORS_ORIGINS=https://your-frontend-domain.com

# 로그
LOG_LEVEL=info
```


## 5. PM2로 서버 관리

### 5-1. 서버 시작

```bash
# 프로덕션 모드로 시작
pm2 start ecosystem.config.js --env production

# 상태 확인
pm2 status

# 로그 확인
pm2 logs
pm2 logs saekindex-backend --lines 100
```

### 5-2. 자동 시작 설정

```bash
# 현재 프로세스 저장
pm2 save

# 부팅 시 자동 시작
pm2 startup
# 출력된 명령어 복사하여 실행 (예시):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 5-3. 주요 명령어

```bash
pm2 restart saekindex-backend  # 재시작
pm2 stop saekindex-backend     # 중지
pm2 delete saekindex-backend   # 삭제
pm2 flush                      # 로그 삭제
pm2 monit                      # 실시간 모니터링
```

---


# Part 3: 주요 변경사항

> 🔧 **로컬 개발 환경과 EC2 프로덕션 환경의 차이점**

## 1. Python 가상환경 자동 감지

**코드 (`emotion.service.js`)**:
```javascript
// 가상환경 우선순위
const venvPaths = [
  path.join(backendRoot, '.venv', venvDir, pythonExe),      // EC2 (Linux)
  path.join(backendRoot, '.saekindex', venvDir, pythonExe)  // 로컬 (Windows)
];
```

**동작**:
- EC2에서 `.venv` 발견 → 자동 사용
- 로컬에서 `.saekindex` 발견 → 자동 사용
- 둘 다 없으면 → 시스템 Python 사용

## 2. npm start 프로덕션 모드

**`package.json`**:
```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development nodemon server.js",
    "start": "cross-env NODE_ENV=production node server.js"
  }
}
```

## 3. PM2 환경 변수 분리

**`ecosystem.config.js`**:
```javascript
{
  env_production: {
    NODE_ENV: 'production',
    PORT: 4000
  },
  env_development: {
    NODE_ENV: 'development',
    PORT: 4000
  }
}
```

## 4. 환경별 비교표

| 항목 | 로컬 (Windows) | EC2 (Linux) |
|------|---------------|-------------|
| **가상환경** | `.saekindex/` | `.venv/` |
| **Python 경로** | `.saekindex/Scripts/python.exe` | `.venv/bin/python3` |
| **실행 명령** | `npm run dev` | `pm2 start ecosystem.config.js --env production` |
| **NODE_ENV** | `development` | `production` |
| **자동 재시작** | nodemon | PM2 |
| **로그** | 콘솔 | PM2 로그 + Winston 파일 |

---


# Part 4: 업데이트 및 관리

> 🔄 **코드 업데이트 및 서버 관리 방법**

## 1. 코드 업데이트

### 로컬에서
```bash
git add .
git commit -m "Update: 기능 추가"
git push origin main
```

### EC2에서
```bash
cd ~/SaekIndex_BackEnd

# 최신 코드 가져오기
git pull origin main

# Python 패키지 업데이트 (필요 시)
source .venv/bin/activate
pip install -r requirements.txt
deactivate

# Node.js 패키지 업데이트 (필요 시)
npm install

# 서버 재시작
pm2 restart saekindex-backend

# 로그 확인
pm2 logs --lines 50
```

## 2. 자동 배포 스크립트

**`deploy.sh` 생성**:
```bash
nano deploy.sh
```

**내용**:
```bash
#!/bin/bash
echo "🚀 배포 시작..."

git pull origin main
npm install

source .venv/bin/activate
pip install -r requirements.txt
deactivate

pm2 restart saekindex-backend

echo "✅ 배포 완료!"
pm2 status
```

**실행**:
```bash
chmod +x deploy.sh
./deploy.sh
```

## 3. 서버 모니터링

```bash
# 실시간 모니터링
pm2 monit

# 상태 확인
pm2 status

# 로그 확인
pm2 logs --lines 100

# 시스템 리소스
htop           # CPU, 메모리
df -h          # 디스크
free -h        # 메모리
```

---


# Part 5: 문제 해결

> 🐛 **자주 발생하는 문제와 해결 방법**

## 1. Python 가상환경 생성 실패

**증상**:
```bash
python3.11 -m venv .venv
# Error: No module named venv
# 또는
# The virtual environment was not created successfully
```

**원인**:
- `python3.11-venv` 패키지가 설치되지 않음
- Python 버전이 올바르게 설치되지 않음

**해결 방법 1 - venv 패키지 설치**:
```bash
# venv 패키지 설치
sudo apt install -y python3.11-venv

# 다시 시도
python3.11 -m venv .venv
```

**해결 방법 2 - python3 명령 사용**:
```bash
# 시스템 기본 python3 사용
python3 -m venv .venv

# Python 버전 확인
python3 --version  # 3.10 이상이면 OK
```

**해결 방법 3 - virtualenv 사용**:
```bash
# virtualenv 설치
sudo apt install -y python3-virtualenv

# virtualenv로 가상환경 생성
virtualenv -p python3.11 .venv

# 또는 시스템 기본 Python 사용
virtualenv .venv
```

**해결 방법 4 - Python 재설치**:
```bash
# Python 3.11 완전 재설치
sudo apt remove -y python3.11
sudo apt autoremove -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# 다시 시도
python3.11 -m venv .venv
```

**가상환경 활성화 확인**:
```bash
source .venv/bin/activate
python --version  # 가상환경의 Python 버전 확인
which python      # 가상환경의 Python 경로 확인
deactivate
```

## 2. Python 서버 시작 실패

**증상**:
```
[Emotion Service] Python 서버 시작 실패
```

**해결**:
```bash
# 가상환경 활성화
source .venv/bin/activate

# Python 서버 수동 테스트
python src/services/emotion_server.py

# 오류 확인 후 패키지 재설치
pip install -r requirements.txt

deactivate
pm2 restart saekindex-backend
```

## 3. 포트 접근 불가

**증상**:
```
curl: (7) Failed to connect to port 4000
```

**해결**:
1. EC2 보안 그룹 확인
   - 인바운드 규칙에 포트 4000 추가
   - 소스: 0.0.0.0/0

2. 서버 상태 확인
```bash
pm2 status
pm2 logs
netstat -tulpn | grep 4000
```

## 4. MongoDB 연결 실패

**증상**:
```
[MongoDB] 연결 실패
```

**해결**:
```bash
# .env 파일 확인
cat .env | grep MONGODB_URI

# MongoDB Atlas 설정:
# 1. Network Access → IP Whitelist
# 2. EC2 퍼블릭 IP 추가 또는 0.0.0.0/0 (모든 IP)
```

## 5. 메모리 부족 (t2.micro)

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

## 6. 모델 파일 없음

**증상**:
```
Error: Cannot import EmotionCNN
```

**해결**:
```bash
# 로컬에서 모델 파일 업로드
scp -i saekindex-key.pem -r ../1st_model ubuntu@YOUR_EC2_IP:~/SaekIndex_BackEnd/
```

---


# 부록

## A. 체크리스트

### 배포 전
- [ ] EC2 인스턴스 생성
- [ ] 보안 그룹 설정 (포트 22, 80, 443, 4000)
- [ ] 키 페어 다운로드 및 보관
- [ ] MongoDB Atlas IP 화이트리스트 설정

### 배포 중
- [ ] SSH 접속 성공
- [ ] Python 3.11 설치
- [ ] Node.js 18 설치
- [ ] 프로젝트 클론
- [ ] `.venv` 가상환경 생성
- [ ] Python 패키지 설치
- [ ] Node.js 패키지 설치
- [ ] `.env` 파일 설정
- [ ] PM2로 서버 시작

### 배포 후
- [ ] 헬스 체크 성공
- [ ] API 테스트 성공
- [ ] Python 서버 정상 작동
- [ ] PM2 자동 시작 설정
- [ ] 로그 확인

## B. 주요 명령어 모음

### SSH 접속
```bash
ssh -i saekindex-key.pem ubuntu@YOUR_EC2_IP
```

### PM2 관리
```bash
pm2 start ecosystem.config.js --env production
pm2 restart saekindex-backend
pm2 stop saekindex-backend
pm2 logs
pm2 monit
pm2 status
```

### 가상환경
```bash
source .venv/bin/activate
deactivate
```

### Git
```bash
git pull origin main
git status
git log --oneline -5
```

## C. 유용한 링크

- **AWS EC2**: https://console.aws.amazon.com/ec2/
- **MongoDB Atlas**: https://cloud.mongodb.com/
- **PM2 문서**: https://pm2.keymetrics.io/docs/
- **Node.js 다운로드**: https://nodejs.org/

---

## 🎉 완료!

배포가 완료되었습니다!

**서버 주소**: `http://YOUR_EC2_IP:4000`

**주요 엔드포인트**:
- 헬스 체크: `/health`
- 설문 목록: `/api/surveys`
- 통계: `/api/surveys/stats`
- 감정 분석: `/api/emotion/analyze`

**문의사항**:
- GitHub Issues: https://github.com/YOUR_USERNAME/SaekIndex_BackEnd/issues

---

**작성일**: 2024-01-15  
**버전**: 2.0 (통합 버전)  
**작성자**: Kiro AI Assistant
