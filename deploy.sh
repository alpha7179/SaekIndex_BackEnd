#!/bin/bash

# SaekIndex AWS 배포 스크립트
# 사용법: ./deploy.sh

set -e  # 에러 발생 시 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 설정 (여기를 수정하세요)
EC2_HOST="YOUR_ELASTIC_IP"
EC2_USER="ubuntu"
EC2_KEY="saekindex-key.pem"
S3_BUCKET="saekindex-frontend"
CLOUDFRONT_ID="YOUR_DISTRIBUTION_ID"
BACKEND_DIR="/home/ubuntu/SaekIndex_BackEnd"

echo -e "${GREEN}🚀 SaekIndex 배포 시작...${NC}"

# 1. 프론트엔드 빌드
echo -e "${YELLOW}📦 프론트엔드 빌드 중...${NC}"
cd ../SaekIndex_FrontEnd || exit
npm run build

if [ ! -d "dist" ]; then
  echo -e "${RED}❌ 빌드 실패: dist 폴더가 없습니다.${NC}"
  exit 1
fi

# 2. S3 업로드
echo -e "${YELLOW}☁️  S3 업로드 중...${NC}"
aws s3 sync dist/ s3://${S3_BUCKET}/ --delete --cache-control "max-age=31536000,public"

# index.html은 캐시 안 함
aws s3 cp dist/index.html s3://${S3_BUCKET}/index.html --cache-control "no-cache,no-store,must-revalidate"

# 3. CloudFront 캐시 무효화
echo -e "${YELLOW}🔄 CloudFront 캐시 무효화 중...${NC}"
aws cloudfront create-invalidation \
  --distribution-id ${CLOUDFRONT_ID} \
  --paths "/*" \
  --no-cli-pager

# 4. 백엔드 배포
echo -e "${YELLOW}🖥️  백엔드 배포 중...${NC}"
cd ../SaekIndex_BackEnd || exit

# Git 변경사항 확인
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  커밋되지 않은 변경사항이 있습니다. 계속하시겠습니까? (y/n)${NC}"
  read -r response
  if [ "$response" != "y" ]; then
    echo -e "${RED}배포 취소${NC}"
    exit 1
  fi
fi

# EC2 서버에 배포
ssh -i "${EC2_KEY}" ${EC2_USER}@${EC2_HOST} << 'EOF'
  set -e
  cd /home/ubuntu/SaekIndex_BackEnd
  
  echo "📥 Git Pull..."
  git pull origin main
  
  echo "📦 의존성 설치..."
  npm install --production
  
  echo "🔄 서버 재시작..."
  pm2 restart saekindex-backend
  pm2 save
  
  echo "✅ 백엔드 배포 완료"
EOF

# 5. 배포 확인
echo -e "${YELLOW}🔍 배포 확인 중...${NC}"
sleep 5

# 백엔드 헬스체크
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST}/health)
if [ "$BACKEND_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✅ 백엔드 정상 작동 중${NC}"
else
  echo -e "${RED}❌ 백엔드 헬스체크 실패 (HTTP ${BACKEND_STATUS})${NC}"
fi

# 프론트엔드 확인
FRONTEND_URL="https://$(aws cloudfront get-distribution --id ${CLOUDFRONT_ID} --query 'Distribution.DomainName' --output text)"
echo -e "${GREEN}✅ 프론트엔드 URL: ${FRONTEND_URL}${NC}"

echo -e "${GREEN}🎉 배포 완료!${NC}"
echo ""
echo "📊 배포 정보:"
echo "  - 백엔드: http://${EC2_HOST}"
echo "  - 프론트엔드: ${FRONTEND_URL}"
echo "  - 배포 시간: $(date)"
