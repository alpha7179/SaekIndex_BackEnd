#!/bin/bash

# MongoDB 복원 스크립트
# 
# 사용법:
# 1. 로컬 백업에서 복원: ./scripts/restore-database.sh local saekindex_backup_20241114_020000
# 2. S3 백업에서 복원: ./scripts/restore-database.sh s3 saekindex_backup_20241114_020000

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
BACKUP_DIR="/home/ubuntu/backups"
S3_BUCKET="${S3_BACKUP_BUCKET:-saekindex-backups}"
MONGODB_URI="${MONGODB_URI}"

# 인자 확인
if [ $# -lt 2 ]; then
    echo -e "${RED}❌ 사용법: $0 <source> <backup_name>${NC}"
    echo -e "${YELLOW}예시:${NC}"
    echo -e "  $0 local saekindex_backup_20241114_020000"
    echo -e "  $0 s3 saekindex_backup_20241114_020000"
    exit 1
fi

SOURCE=$1
BACKUP_NAME=$2

echo -e "${GREEN}🔄 MongoDB 복원 시작${NC}"
echo -e "${YELLOW}소스: ${SOURCE}${NC}"
echo -e "${YELLOW}백업: ${BACKUP_NAME}${NC}"

# MongoDB URI 확인
if [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}❌ MONGODB_URI가 설정되지 않았습니다.${NC}"
    exit 1
fi

# mongorestore 설치 확인
if ! command -v mongorestore &> /dev/null; then
    echo -e "${RED}❌ mongorestore가 설치되지 않았습니다.${NC}"
    echo -e "${YELLOW}💡 설치: sudo apt install mongodb-database-tools${NC}"
    exit 1
fi

# 복원 경로 설정
RESTORE_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# S3에서 다운로드
if [ "$SOURCE" == "s3" ]; then
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI가 설치되지 않았습니다.${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}☁️  S3에서 백업 다운로드 중...${NC}"
    aws s3 sync "s3://${S3_BUCKET}/${BACKUP_NAME}/" "${RESTORE_PATH}/" --region ap-northeast-2
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ S3 다운로드 실패${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ S3 다운로드 완료${NC}"
fi

# 백업 파일 존재 확인
if [ ! -d "$RESTORE_PATH" ]; then
    echo -e "${RED}❌ 백업 파일을 찾을 수 없습니다: ${RESTORE_PATH}${NC}"
    echo -e "${YELLOW}📋 사용 가능한 백업 목록:${NC}"
    ls -lht "${BACKUP_DIR}" | grep "saekindex_backup_"
    exit 1
fi

# 확인 메시지
echo -e "${RED}⚠️  경고: 현재 데이터베이스가 복원된 데이터로 대체됩니다!${NC}"
echo -e "${YELLOW}계속하시겠습니까? (yes/no)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}복원이 취소되었습니다.${NC}"
    exit 0
fi

# MongoDB 복원 실행
echo -e "${YELLOW}📦 MongoDB 복원 중...${NC}"
mongorestore --uri="${MONGODB_URI}" --gzip --drop "${RESTORE_PATH}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ MongoDB 복원 완료${NC}"
else
    echo -e "${RED}❌ MongoDB 복원 실패${NC}"
    exit 1
fi

# S3에서 다운로드한 경우 로컬 파일 삭제 (선택사항)
if [ "$SOURCE" == "s3" ]; then
    echo -e "${YELLOW}🗑️  다운로드한 백업 파일을 삭제하시겠습니까? (yes/no)${NC}"
    read -r DELETE_CONFIRM
    
    if [ "$DELETE_CONFIRM" == "yes" ]; then
        rm -rf "${RESTORE_PATH}"
        echo -e "${GREEN}✅ 로컬 백업 파일 삭제 완료${NC}"
    fi
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 복원 완료${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
