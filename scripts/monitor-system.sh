#!/bin/bash

# 시스템 모니터링 스크립트 (무료)
# EC2 t2.micro 리소스 사용량 모니터링
# 
# 사용법:
# 1. 실행 권한: chmod +x scripts/monitor-system.sh
# 2. 실행: ./scripts/monitor-system.sh
# 3. Cron 작업 (5분마다): */5 * * * * /home/ubuntu/SaekIndex_BackEnd/scripts/monitor-system.sh >> /home/ubuntu/logs/monitor.log 2>&1

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 임계값 설정
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=85

# 타임스탬프
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 시스템 모니터링: ${TIMESTAMP}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# CPU 사용률
echo -e "\n${YELLOW}🖥️  CPU 사용률:${NC}"
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
CPU_USAGE_INT=${CPU_USAGE%.*}

if [ "$CPU_USAGE_INT" -gt "$CPU_THRESHOLD" ]; then
    echo -e "${RED}  ⚠️  ${CPU_USAGE}% (임계값: ${CPU_THRESHOLD}%)${NC}"
else
    echo -e "${GREEN}  ✅ ${CPU_USAGE}%${NC}"
fi

# 메모리 사용률
echo -e "\n${YELLOW}💾 메모리 사용률:${NC}"
MEMORY_INFO=$(free | grep Mem)
TOTAL_MEM=$(echo $MEMORY_INFO | awk '{print $2}')
USED_MEM=$(echo $MEMORY_INFO | awk '{print $3}')
MEMORY_USAGE=$((USED_MEM * 100 / TOTAL_MEM))

if [ "$MEMORY_USAGE" -gt "$MEMORY_THRESHOLD" ]; then
    echo -e "${RED}  ⚠️  ${MEMORY_USAGE}% (임계값: ${MEMORY_THRESHOLD}%)${NC}"
else
    echo -e "${GREEN}  ✅ ${MEMORY_USAGE}%${NC}"
fi

free -h | grep -E "Mem|Swap"

# 디스크 사용률
echo -e "\n${YELLOW}💿 디스크 사용률:${NC}"
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
    echo -e "${RED}  ⚠️  ${DISK_USAGE}% (임계값: ${DISK_THRESHOLD}%)${NC}"
else
    echo -e "${GREEN}  ✅ ${DISK_USAGE}%${NC}"
fi

df -h /

# 프로세스 상태 (PM2)
echo -e "\n${YELLOW}🔄 PM2 프로세스 상태:${NC}"
if command -v pm2 &> /dev/null; then
    pm2 jlist | jq -r '.[] | "  \(.name): \(.pm2_env.status) (메모리: \(.monit.memory / 1024 / 1024 | floor)MB, CPU: \(.monit.cpu)%)"' 2>/dev/null || pm2 list
else
    echo -e "${YELLOW}  PM2가 설치되지 않았습니다.${NC}"
fi

# Redis 상태
echo -e "\n${YELLOW}🔴 Redis 상태:${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}  ✅ 실행 중${NC}"
        redis-cli info | grep -E "used_memory_human|connected_clients|total_commands_processed"
    else
        echo -e "${RED}  ❌ 실행 중지${NC}"
    fi
else
    echo -e "${YELLOW}  Redis가 설치되지 않았습니다.${NC}"
fi

# MongoDB 연결 상태
echo -e "\n${YELLOW}🍃 MongoDB 연결 상태:${NC}"
if [ -n "$MONGODB_URI" ]; then
    if mongosh "$MONGODB_URI" --quiet --eval "db.adminCommand('ping')" &> /dev/null; then
        echo -e "${GREEN}  ✅ 연결 정상${NC}"
    else
        echo -e "${RED}  ❌ 연결 실패${NC}"
    fi
else
    echo -e "${YELLOW}  MONGODB_URI가 설정되지 않았습니다.${NC}"
fi

# 네트워크 연결 수
echo -e "\n${YELLOW}🌐 네트워크 연결:${NC}"
ESTABLISHED=$(netstat -an | grep ESTABLISHED | wc -l)
LISTEN=$(netstat -an | grep LISTEN | wc -l)
echo -e "  활성 연결: ${ESTABLISHED}"
echo -e "  대기 포트: ${LISTEN}"

# 최근 에러 로그 (있는 경우)
echo -e "\n${YELLOW}📋 최근 에러 로그 (최근 5개):${NC}"
if [ -f "/home/ubuntu/SaekIndex_BackEnd/logs/error-$(date +%Y-%m-%d).log" ]; then
    tail -5 "/home/ubuntu/SaekIndex_BackEnd/logs/error-$(date +%Y-%m-%d).log" 2>/dev/null || echo "  에러 로그 없음"
else
    echo "  에러 로그 파일 없음"
fi

# 경고 알림
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

WARNINGS=0

if [ "$CPU_USAGE_INT" -gt "$CPU_THRESHOLD" ]; then
    echo -e "${RED}⚠️  경고: CPU 사용률이 높습니다 (${CPU_USAGE}%)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if [ "$MEMORY_USAGE" -gt "$MEMORY_THRESHOLD" ]; then
    echo -e "${RED}⚠️  경고: 메모리 사용률이 높습니다 (${MEMORY_USAGE}%)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
    echo -e "${RED}⚠️  경고: 디스크 사용률이 높습니다 (${DISK_USAGE}%)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if [ "$WARNINGS" -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 시스템 정상${NC}"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# 경고가 있으면 종료 코드 1 반환 (알림 트리거용)
exit $WARNINGS
