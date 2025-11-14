#!/bin/bash

# MongoDB 자동 백업 스크립트 (무료)
# S3 Glacier Instant Retrieval 사용 (저렴한 장기 보관)
# 
# 사용법:
# 1. 실행 권한 부여: chmod +x scripts/backup-database.sh
# 2. Cron 작업 등록: crontab -e
#    0 2 * * * /home/ubuntu/SaekIndex_BackEnd/scripts/backup-database.sh >> /home/ubuntu/logs/backup.log 2>&1

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 설정
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="saekindex_backup_${TIMESTAMP}"
S3_BUCKET="${S3_BACKUP_BUCKET:-saekindex-backups}"  # 환경 변수 또는 기본값
MONGODB_URI="${MONGODB_URI}"  # .env에서 로드
RETENTION_DAYS=7  # 로컬 백업 보관 기간
S3_RETENTION_DAYS=30  # S3 백업 보관 기간

echo -e "${GREEN}🔄 MongoDB 백업 시작: ${TIMESTAMP}${NC}"

# 백업 디렉토리 생성
mkdir -p "${BACKUP_DIR}"

# MongoDB URI 확인
if [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}❌ MONGODB_URI가 설정되지 않았습니다.${NC}"
    echo -e "${YELLOW}💡 .env 파일을 확인하거나 환경 변수를 설정하세요.${NC}"
    exit 1
fi

# mongodump 설치 확인
if ! command -v mongodump &> /dev/null; then
    echo -e "${YELLOW}⚠️  mongodump가 설치되지 않았습니다. 설치 중...${NC}"
    
    # MongoDB Database Tools 설치
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt update
    sudo apt install -y mongodb-database-tools
    
    if ! command -v mongodump &> /dev/null; then
        echo -e "${RED}❌ mongodump 설치 실패${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ mongodump 설치 완료${NC}"
fi

# MongoDB 백업 실행
echo -e "${YELLOW}📦 MongoDB 백업 중...${NC}"
mongodump --uri="${MONGODB_URI}" --out="${BACKUP_DIR}/${BACKUP_NAME}" --gzip

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ MongoDB 백업 완료: ${BACKUP_DIR}/${BACKUP_NAME}${NC}"
    
    # 백업 크기 확인
    BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}" | cut -f1)
    echo -e "${YELLOW}📊 백업 크기: ${BACKUP_SIZE}${NC}"
else
    echo -e "${RED}❌ MongoDB 백업 실패${NC}"
    exit 1
fi

# S3 업로드 (선택사항)
if command -v aws &> /dev/null; then
    echo -e "${YELLOW}☁️  S3 업로드 중...${NC}"
    
    # Glacier Instant Retrieval 사용 (저렴한 장기 보관)
    aws s3 sync "${BACKUP_DIR}/${BACKUP_NAME}" "s3://${S3_BUCKET}/${BACKUP_NAME}/" \
        --storage-class GLACIER_IR \
        --region ap-northeast-2
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ S3 업로드 완료: s3://${S3_BUCKET}/${BACKUP_NAME}/${NC}"
    else
        echo -e "${RED}❌ S3 업로드 실패 (로컬 백업은 유지됨)${NC}"
    fi
    
    # S3 오래된 백업 삭제 (30일 이상)
    echo -e "${YELLOW}🗑️  S3 오래된 백업 삭제 중 (${S3_RETENTION_DAYS}일 이상)...${NC}"
    
    CUTOFF_DATE=$(date -d "${S3_RETENTION_DAYS} days ago" +%Y%m%d)
    
    aws s3 ls "s3://${S3_BUCKET}/" | while read -r line; do
        FOLDER=$(echo $line | awk '{print $2}' | sed 's/\///')
        
        if [[ $FOLDER =~ ^saekindex_backup_([0-9]{8})_ ]]; then
            BACKUP_DATE="${BASH_REMATCH[1]}"
            
            if [ "$BACKUP_DATE" -lt "$CUTOFF_DATE" ]; then
                echo -e "${YELLOW}  삭제: ${FOLDER}${NC}"
                aws s3 rm "s3://${S3_BUCKET}/${FOLDER}/" --recursive
            fi
        fi
    done
    
    echo -e "${GREEN}✅ S3 정리 완료${NC}"
else
    echo -e "${YELLOW}⚠️  AWS CLI가 설치되지 않아 S3 업로드를 건너뜁니다.${NC}"
    echo -e "${YELLOW}💡 설치: sudo apt install awscli${NC}"
fi

# 로컬 오래된 백업 삭제 (7일 이상)
echo -e "${YELLOW}🗑️  로컬 오래된 백업 삭제 중 (${RETENTION_DAYS}일 이상)...${NC}"
find "${BACKUP_DIR}" -type d -name "saekindex_backup_*" -mtime +${RETENTION_DAYS} -exec rm -rf {} + 2>/dev/null || true
echo -e "${GREEN}✅ 로컬 정리 완료${NC}"

# 디스크 사용량 확인
echo -e "${YELLOW}💾 디스크 사용량:${NC}"
df -h / | tail -1

# 백업 목록 출력
echo -e "${YELLOW}📋 최근 백업 목록 (로컬):${NC}"
ls -lht "${BACKUP_DIR}" | head -6

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 백업 완료: ${TIMESTAMP}${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 복원 방법 안내
echo -e "${YELLOW}📖 복원 방법:${NC}"
echo -e "  mongorestore --uri=\"\$MONGODB_URI\" --gzip \"${BACKUP_DIR}/${BACKUP_NAME}\""
echo ""
