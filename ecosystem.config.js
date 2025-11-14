module.exports = {
  apps: [
    {
      name: 'saekindex-backend',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      
      // 환경 변수
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      
      // 로그 설정
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 재시작 설정
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,  // 재시작 전 대기 시간 (4초)
      
      // 메모리 관리 (t2.micro 최적화)
      max_memory_restart: '800M',
      
      // 파일 감시 비활성화 (프로덕션)
      watch: false,
      
      // 크론 재시작 (매일 새벽 4시 - 메모리 누수 방지)
      cron_restart: '0 4 * * *',
      
      // 종료 시그널 설정
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // 에러 처리
      exp_backoff_restart_delay: 100,
      
      // 인스턴스 설정
      instance_var: 'INSTANCE_ID'
    }
  ],
  
  // 배포 설정 (선택사항)
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'YOUR_ELASTIC_IP',  // 실제 IP로 변경
      ref: 'origin/main',
      repo: 'https://github.com/YOUR_USERNAME/SaekIndex_BackEnd.git',  // 실제 저장소로 변경
      path: '/home/ubuntu/SaekIndex_BackEnd',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'sudo apt update && sudo apt install -y git nodejs npm'
    }
  }
};
