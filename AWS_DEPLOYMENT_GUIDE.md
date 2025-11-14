# AWS EC2 배포 가이드

SaekIndex 백엔드를 AWS EC2에 배포하는 완전한 가이드입니다.

---

## 📋 목차

1. [EC2 인스턴스 생성](#1-ec2-인스턴스-생성)
2. [서버 접속 및 초기 설정](#2-서버-접속-및-초기-설정)
3. [Python 환경 설정](#3-python-환경-설정)
4. [프로젝트 배포](#4-프로젝트-배포)
5. [환경 변수 설정](#5-환경-변수-설정)
6. [서버 시작 및 관리](#6-서버-시작-및-관리)
7. [문제 해결](#7-문제-해결)

---

## 1. EC2 인스턴스 생성

### 1-1. AWS 콘솔 접속
1. AWS Management Console 로그인
2. EC2 서비스 선택
3. "인스턴스 시작" 클릭

### 1-2. 인스턴스 설정

**이름 및 태그**:
```
이름: SaekIndex-Backend
```

**AMI 선택**:
```
Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
```

**인스턴스 유형**:
```
t2.micro (프리 티어)
또는
t2.small (권장 - 2GB RAM)
```

**키 페어**:
```
새 키 페어 생성
- 이름: saekindex-key
- 유형: RSA
- 형식: .pem
- 다운로드 후 안전한 곳에 보관
```

**네트워크 설정**:
```
보안 그룹 생성:
- SSH (22): 내 IP
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- Custom TCP (4000): 0.0.0.0/0  # 백엔드 포트
```

**스토리지 구성**:
```
30 GB gp3 (프리 티어 최대)
```

### 1-3. 인스턴스 시작
- "인스턴스 시작" 클릭
- 인스턴스 ID 및 퍼블릭 IP 확인

---

## 2. 서버 접속 및 초기 설정

### 2-1. SSH 접속

**Windows (PowerShell)**:
```powershell
# 키 파일 권한 설정 (처음 한 번만)
icacls saekindex-key.pem /inheritance:r
icacls saekindex-key.pem /grant:r "%USERNAME%:R"

# SSH 접속
ssh -i saekindex-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**Mac/Linux**:
```bash
# 키 파일 권한 설정
chmod 400 saekindex-key.pem

# SSH 접속
ssh -i saekindex-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### 2-2. 시스템 업데이트

```bash
# 패키지 목록 업데이트
sudo apt update

# 설치된 패키지 업그레이드
sudo apt upgrade -y
```

### 2-3. 필수 도구 설치

```bash
# Git 설치
sudo apt install -y git

# Curl 설치
sudo apt install -y curl

# Build tools 설치
sudo apt install -y build-essential
```

---

## 3. Python 환경 설정

### 3-1. Python 3.11 설치

```bash
# Python 3.11 및 관련 패키지 설치
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Python 버전 확인
python3.11 --version
# 출력: Python 3.11.x
```

### 3-2. Node.js 설치

```bash
# Node.js 18.x 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 버전 확인
node --version  # v18.x.x
npm --version   # 9.x.x
```

---

## 4. 프로젝트 배포

### 4-1. 프로젝트 클론

```bash
# 홈 디렉토리로 이동
cd ~

# Git 저장소 클론
git clone https://github.com/YOUR_USERNAME/SaekIndex_BackEnd.git

# 프로젝트 디렉토리로 이동
cd SaekIndex_BackEnd
```

### 4-2. Python 가상환경 생성

```bash
# 가상환경 생성
python3.11 -m venv .venv

# 가상환경 활성화
source .venv/bin/activate

# pip 업그레이드
pip install --upgrade pip

# Python 패키지 설치 (5-10분 소요)
pip install -r requirements.txt

# 설치 확인
pip list | grep -E "torch|mediapipe|flask"

# 가상환경 비활성화
deactivate
```

### 4-3. Node.js 패키지 설치

```bash
# Node.js 패키지 설치
npm install

# PM2 전역 설치
sudo npm install -g pm2
```

### 4-4. 모델 파일 업로드 (필요 시)

**로컬에서 실행** (모델 파일이 있는 경우):
```bash
# SCP로 모델 파일 전송
scp -i saekindex-key.pem -r ../1st_model ubuntu@YOUR_EC2_IP:~/SaekIndex_BackEnd/
```

---

## 5. 환경 변수 설정

### 5-1. .env 파일 생성

```bash
# .env.example 복사
cp .env.example .env

# .env 파일 편집
nano .env
```

### 5-2. 환경 변수 설정

```bash
# .env 파일 내용

# 서버 설정
NODE_ENV=production
PORT=4000

# MongoDB 설정
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# Redis 설정 (선택사항)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Python 서버 설정
EMOTION_SERVER_PORT=5001

# 로그 설정
LOG_LEVEL=info

# CORS 설정
CORS_ORIGIN=https://your-frontend-domain.com

# 세션 설정
SESSION_SECRET=your-super-secret-session-key-change-this

# JWT 설정 (필요 시)
JWT_SECRET=your-super-secret-jwt-key-change-this
```

**저장 및 종료**:
- `Ctrl + O` (저장)
- `Enter` (확인)
- `Ctrl + X` (종료)

### 5-3. 환경 변수 확인

```bash
# .env 파일 확인 (비밀번호 제외)
cat .env | grep -v PASSWORD | grep -v SECRET
```

---

## 6. 서버 시작 및 관리

### 6-1. PM2로 서버 시작

```bash
# PM2로 서버 시작
pm2 start ecosystem.config.js

# 서버 상태 확인
pm2 status

# 로그 확인
pm2 logs

# 특정 앱 로그만 보기
pm2 logs saekindex-backend
```

### 6-2. PM2 자동 시작 설정

```bash
# 현재 PM2 프로세스 저장
pm2 save

# 부팅 시 자동 시작 설정
pm2 startup

# 출력된 명령어 복사하여 실행 (예시)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 6-3. 서버 관리 명령어

```bash
# 서버 재시작
pm2 restart saekindex-backend

# 서버 중지
pm2 stop saekindex-backend

# 서버 삭제
pm2 delete saekindex-backend

# 모든 로그 삭제
pm2 flush

# PM2 모니터링
pm2 monit
```

---

## 7. 배포 확인

### 7-1. 헬스 체크

```bash
# 로컬에서 확인
curl http://YOUR_EC2_IP:4000/health

# 또는 브라우저에서
http://YOUR_EC2_IP:4000/health
```

**정상 응답**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T05:00:00.000Z"
}
```

### 7-2. API 테스트

```bash
# 설문 목록 조회
curl http://YOUR_EC2_IP:4000/api/surveys

# 통계 조회
curl http://YOUR_EC2_IP:4000/api/surveys/statistics
```

### 7-3. Python 서버 확인

```bash
# PM2 로그에서 확인
pm2 logs | grep "Python"

# 정상 출력:
# [Emotion Service] Python 서버 시작 중...
# [Python Server] 모델 초기화 시작...
# [Python Server] 모델 로드 완료
# [Emotion Service] Python 서버 준비 완료!
```

---

## 8. 문제 해결

### 8-1. Python 서버 시작 실패

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

# 가상환경 비활성화
deactivate

# PM2 재시작
pm2 restart saekindex-backend
```

### 8-2. 모델 파일 없음

**증상**:
```
Error: Cannot import EmotionCNN from model.py
```

**해결**:
```bash
# 모델 파일 경로 확인
ls -la ../1st_model/

# 모델 파일이 없으면 로컬에서 업로드
# (로컬에서 실행)
scp -i saekindex-key.pem -r ../1st_model ubuntu@YOUR_EC2_IP:~/
```

### 8-3. 포트 접근 불가

**증상**:
```
curl: (7) Failed to connect to YOUR_EC2_IP port 4000
```

**해결**:
1. EC2 보안 그룹 확인
   - 포트 4000이 열려있는지 확인
   - 인바운드 규칙에 추가

2. 서버 상태 확인
```bash
pm2 status
pm2 logs
```

### 8-4. MongoDB 연결 실패

**증상**:
```
[MongoDB] 연결 실패
```

**해결**:
```bash
# .env 파일 확인
cat .env | grep MONGODB_URI

# MongoDB Atlas에서 IP 화이트리스트 확인
# EC2 퍼블릭 IP 추가 필요
```

### 8-5. 메모리 부족 (t2.micro)

**증상**:
```
Killed
npm ERR! errno 137
```

**해결**:
```bash
# Swap 메모리 추가
sudo dd if=/dev/zero of=/swapfile bs=128M count=16
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 설정
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 확인
free -h
```

---

## 9. 업데이트 및 재배포

### 9-1. 코드 업데이트

```bash
# 프로젝트 디렉토리로 이동
cd ~/SaekIndex_BackEnd

# 최신 코드 가져오기
git pull origin main

# 패키지 업데이트 (필요 시)
npm install

# Python 패키지 업데이트 (필요 시)
source .venv/bin/activate
pip install -r requirements.txt
deactivate

# PM2 재시작
pm2 restart saekindex-backend
```

### 9-2. 자동 배포 스크립트

```bash
# deploy.sh 생성
nano deploy.sh
```

**deploy.sh 내용**:
```bash
#!/bin/bash

echo "🚀 배포 시작..."

# 최신 코드 가져오기
git pull origin main

# Node.js 패키지 업데이트
npm install

# Python 패키지 업데이트
source .venv/bin/activate
pip install -r requirements.txt
deactivate

# PM2 재시작
pm2 restart saekindex-backend

echo "✅ 배포 완료!"
pm2 status
```

**실행 권한 부여 및 실행**:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 10. 보안 설정 (선택사항)

### 10-1. 방화벽 설정

```bash
# UFW 활성화
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4000/tcp
sudo ufw enable

# 상태 확인
sudo ufw status
```

### 10-2. Nginx 리버스 프록시 (선택)

```bash
# Nginx 설치
sudo apt install -y nginx

# 설정 파일 생성
sudo nano /etc/nginx/sites-available/saekindex
```

**Nginx 설정**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Nginx 활성화**:
```bash
sudo ln -s /etc/nginx/sites-available/saekindex /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 11. 모니터링

### 11-1. PM2 모니터링

```bash
# 실시간 모니터링
pm2 monit

# 상태 확인
pm2 status

# 로그 확인
pm2 logs --lines 100
```

### 11-2. 시스템 리소스 확인

```bash
# CPU, 메모리 사용량
htop

# 디스크 사용량
df -h

# 네트워크 연결
netstat -tulpn | grep 4000
```

---

## 📝 체크리스트

### 배포 전
- [ ] EC2 인스턴스 생성
- [ ] 보안 그룹 설정 (포트 22, 80, 443, 4000)
- [ ] 키 페어 다운로드 및 보관
- [ ] MongoDB Atlas IP 화이트리스트 설정

### 배포 중
- [ ] SSH 접속 성공
- [ ] 시스템 업데이트 완료
- [ ] Python 3.11 설치 확인
- [ ] Node.js 18 설치 확인
- [ ] 프로젝트 클론 완료
- [ ] Python 가상환경 생성 및 패키지 설치
- [ ] Node.js 패키지 설치
- [ ] .env 파일 설정
- [ ] PM2로 서버 시작

### 배포 후
- [ ] 헬스 체크 성공 (http://YOUR_EC2_IP:4000/health)
- [ ] API 테스트 성공
- [ ] Python 서버 정상 작동 확인
- [ ] PM2 자동 시작 설정
- [ ] 로그 확인

---

## 🎉 완료!

배포가 완료되었습니다!

**서버 주소**: `http://YOUR_EC2_IP:4000`

**주요 엔드포인트**:
- 헬스 체크: `/health`
- 설문 목록: `/api/surveys`
- 통계: `/api/surveys/statistics`
- 감정 분석: `/api/emotion/analyze`

**관리 명령어**:
```bash
pm2 status          # 상태 확인
pm2 logs            # 로그 확인
pm2 restart all     # 재시작
pm2 monit           # 모니터링
```
