#!/bin/bash

# 로그 파일 정리 스크립트 (무료)
# 오래된 로그 파일을 자동으로 삭제하여 디스크 공간 절약
# 
# 사용법:
# 1. 실행 권한: chmod +x scripts/cleanup-logs.sh
# 2. 실행: ./scripts/cleanup-logs.sh
# 3. Cron 작업 (매일 새벽 3시): 0 3 * * * /home/ubuntu/SaekIndex_BackEnd/scripts/cleanup-logs.sh >> /home/ubuntu/logs/cleanup.log 2>&1

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 설정
LOG_DIR="/home/ubuntu/SaekIndex_BackEnd/logs"
SYSTEM_LOG_DIR="/home/ubuntu/logs"
RETENTION_DAYS=7  # 보관 기간 (일)

echo -e "${GREEN}🧹 로그 파일 정리 시작: $(date)${NC}\n"

# 디스크 사용량 (정리 전)
echo -e "${YELLOW}📊 디스크 사용량 (정리 전):${NC}"
df -h / | tail -1

# 애플리케이션 로그 정리
if [ -d "$LOG_DIR" ]; then
    echo -e "\n${YELLOW}🗑️  애플리케이션 로그 정리 중 (${RETENTION_DAYS}일 이상)...${NC}"
    
    DELETED_COUNT=0
    DELETED_SIZE=0
    
    # .log 파일 삭제
    while IFS= read -r -d '' file; do
        SIZE=$(du -k "$file" | cut -f1)
        DELETED_SIZE=$((DELETED_SIZE + SIZE))
        DELETED_COUNT=$((DELETED_COUNT + 1))
        echo -e "  삭제: $(basename "$file") ($(du -h "$file" | cut -f1))"
        rm -f "$file"
    done < <(find "$LOG_DIR" -type f -name "*.log" -mtime +${RETENTION_DAYS} -print0)
    
    # .gz 압축 파일 삭제
    while IFS= read -r -d '' file; do
        SIZE=$(du -k "$file" | cut -f1)
        DELETED_SIZE=$((DELETED_SIZE + SIZE))
        DELETED_COUNT=$((DELETED_COUNT + 1))
        echo -e "  삭제: $(basename "$file") ($(du -h "$file" | cut -f1))"
        rm -f "$file"
    done < <(find "$LOG_DIR" -type f -name "*.log.gz" -mtime +${RETENTION_DAYS} -print0)
    
    if [ "$DELETED_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ ${DELETED_COUNT}개 파일 삭제 ($(echo "scale=2; $DELETED_SIZE / 1024" | bc)MB)${NC}"
    else
        echo -e "${GREEN}✅ 삭제할 파일 없음${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  애플리케이션 로그 디렉토리가 없습니다: ${LOG_DIR}${NC}"
fi

# 시스템 로그 정리
if [ -d "$SYSTEM_LOG_DIR" ]; then
    echo -e "\n${YELLOW}🗑️  시스템 로그 정리 중 (${RETENTION_DAYS}일 이상)...${NC}"
    
    DELETED_COUNT=0
    DELETED_SIZE=0
    
    while IFS= read -r -d '' file; do
        SIZE=$(du -k "$file" | cut -f1)
        DELETED_SIZE=$((DELETED_SIZE + SIZE))
        DELETED_COUNT=$((DELETED_COUNT + 1))
        echo -e "  삭제: $(basename "$file") ($(du -h "$file" | cut -f1))"
        rm -f "$file"
    done < <(find "$SYSTEM_LOG_DIR" -type f -name "*.log" -mtime +${RETENTION_DAYS} -print0)
    
    if [ "$DELETED_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ ${DELETED_COUNT}개 파일 삭제 ($(echo "scale=2; $DELETED_SIZE / 1024" | bc)MB)${NC}"
    else
        echo -e "${GREEN}✅ 삭제할 파일 없음${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  시스템 로그 디렉토리가 없습니다: ${SYSTEM_LOG_DIR}${NC}"
fi

# PM2 로그 정리
echo -e "\n${YELLOW}🗑️  PM2 로그 정리 중...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 flush
    echo -e "${GREEN}✅ PM2 로그 정리 완료${NC}"
else
    echo -e "${YELLOW}⚠️  PM2가 설치되지 않았습니다.${NC}"
fi

# Nginx 로그 정리 (선택사항)
if [ -d "/var/log/nginx" ]; then
    echo -e "\n${YELLOW}🗑️  Nginx 로그 정리 중 (${RETENTION_DAYS}일 이상)...${NC}"
    
    DELETED_COUNT=0
    
    sudo find /var/log/nginx -type f -name "*.log.*" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
    
    echo -e "${GREEN}✅ Nginx 로그 정리 완료${NC}"
fi

# 디스크 사용량 (정리 후)
echo -e "\n${YELLOW}📊 디스크 사용량 (정리 후):${NC}"
df -h / | tail -1

# 로그 디렉토리 크기
echo -e "\n${YELLOW}📁 로그 디렉토리 크기:${NC}"
if [ -d "$LOG_DIR" ]; then
    echo -e "  애플리케이션: $(du -sh "$LOG_DIR" 2>/dev/null | cut -f1)"
fi
if [ -d "$SYSTEM_LOG_DIR" ]; then
    echo -e "  시스템: $(du -sh "$SYSTEM_LOG_DIR" 2>/dev/null | cut -f1)"
fi

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 로그 정리 완료: $(date)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
