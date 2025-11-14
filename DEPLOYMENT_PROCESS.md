# 배포 프로세스 가이드

## 🚀 로컬 → Git → EC2 배포 흐름

### 1️⃣ 로컬에서 Git에 푸시

```bash
# 변경사항 확인
git status

# 필요한 파일만 추가 (.saekindex는 자동 제외됨)
git add .

# 커밋
git commit -m "Update: 감정 분석 기능 개선"

# 푸시
git push origin main
```

**Git에 포함되는 것**:
- ✅ 소스 코드 (`src/`)
- ✅ `requirements.txt` (Python 패키지 목록)
- ✅ `package.json` (Node.js 패키지 목록)
- ✅ `.env.example` (환경 변수 예시)
- ✅ 모델 파일 (`src/services/emotion_cnn_best.pth`, `model.py`)

**Git에 제외되는 것**:
- ❌ `.venv/`, `.saekindex/` (가상환경)
- ❌ `node_modules/` (Node.js 패키지)
- ❌ `.env` (실제 환경 변수)
- ❌ `logs/` (로그 파일)

---

### 2️⃣ EC2에서 클론 및 설정

```bash
# 1. EC2 접속
ssh -i saekindex-key.pem ubuntu@YOUR_EC2_IP

# 2. 프로젝트 클론
cd ~
git clone https://github.com/YOUR_USERNAME/SaekIndex_BackEnd.git
cd SaekIndex_BackEnd

# 3. Python 가상환경 생성 (새로 만듦!)
python3.11 -m venv .venv
source .venv/bin/activate

# 4. Python 패키지 설치
pip install --upgrade pip
pip install -r requirements.txt

# 5. 가상환경 비활성화
deactivate

# 6. Node.js 패키지 설치
npm install

# 7. 환경 변수 설정
cp .env.example .env
nano .env  # MongoDB URI 등 설정

# 8. PM2로 서버 시작
sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### 3️⃣ 업데이트 배포

로컬에서 코드 수정 후:

```bash
# 로컬
git add .
git commit -m "Update: 기능 개선"
git push origin main
```

EC2에서:

```bash
# EC2
cd ~/SaekIndex_BackEnd
git pull origin main

# Python 패키지 업데이트 (필요 시)
source .venv/bin/activate
pip install -r requirements.txt
deactivate

# Node.js 패키지 업데이트 (필요 시)
npm install

# 서버 재시작
pm2 restart all
```

---

## 📊 비교표

| 항목 | 로컬 (Windows) | EC2 (Linux) |
|------|---------------|-------------|
| **가상환경** | `.saekindex/` | `.venv/` |
| **Python** | 3.9.13 | 3.11.x |
| **경로** | `C:\...` | `/home/ubuntu/...` |
| **패키지** | Windows 바이너리 | Linux 바이너리 |

→ **가상환경은 각 환경에서 새로 생성해야 함!**

---

## ✅ 체크리스트

### Git 푸시 전
- [ ] `.gitignore`에 `.venv/`, `.saekindex/` 포함 확인
- [ ] `.env` 파일이 Git에 포함되지 않는지 확인
- [ ] `requirements.txt` 최신 상태 확인
- [ ] 모델 파일 포함 여부 결정

### EC2 배포 시
- [ ] Python 3.11 설치 확인
- [ ] 새 가상환경 생성 (`.venv`)
- [ ] `requirements.txt`로 패키지 설치
- [ ] `.env` 파일 설정
- [ ] 모델 파일 확인

---

## 🎯 핵심 포인트

1. **가상환경은 Git에 올리지 않음**
   - 용량 큰 (2-3GB)
   - OS별로 다름
   - `requirements.txt`로 재생성

2. **각 환경에서 가상환경 새로 생성**
   - 로컬: `.saekindex/` (이미 있음)
   - EC2: `.venv/` (새로 만듦)

3. **requirements.txt가 핵심**
   - 패키지 목록만 Git에 포함
   - 각 환경에서 설치

4. **모델 파일은 선택**
   - 작으면 Git에 포함 (19MB)
   - 크면 별도 전송 (SCP)

---

## 💡 자동 배포 스크립트

EC2에서 사용할 배포 스크립트:

```bash
#!/bin/bash
# deploy.sh

echo "🚀 배포 시작..."

# 최신 코드 가져오기
git pull origin main

# Python 패키지 업데이트
source .venv/bin/activate
pip install -r requirements.txt
deactivate

# Node.js 패키지 업데이트
npm install

# PM2 재시작
pm2 restart all

echo "✅ 배포 완료!"
pm2 status
```

**사용법**:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🎉 요약

**질문**: `.saekindex`를 Git에 올려서 EC2에서 클론하면 되나요?

**답변**: ❌ **안 됩니다!**

**올바른 방법**:
1. `.gitignore`에 가상환경 제외
2. `requirements.txt`만 Git에 포함
3. EC2에서 새 가상환경 생성
4. `pip install -r requirements.txt`로 패키지 설치

**이유**:
- Windows 가상환경 ≠ Linux 가상환경
- 용량 큰 (2-3GB)
- 경로 문제
- 불필요함 (재생성 가능)
