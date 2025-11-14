// src/services/emotion.service.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const sessionService = require('./session.service');
const logger = require('../utils/logger');

// 세션 관리는 이제 Redis 기반 (session.service.js)
// const sessions = new Map(); // 제거됨

// Python 서버 관리
let pythonServerProcess = null;
let pythonServerPort = process.env.EMOTION_SERVER_PORT || 5001;
let pythonServerUrl = `http://127.0.0.1:${pythonServerPort}`;
let isServerStarting = false;

/**
 * Python 감정 분석 서버 시작
 */
async function startPythonServer() {
  if (pythonServerProcess || isServerStarting) {
    return;
  }

  isServerStarting = true;
  console.log('[Emotion Service] Python 서버 시작 중...');

  try {
    const backendRoot = path.join(__dirname, '..', '..');
    const pythonScriptPath = path.join(__dirname, 'emotion_server.py');
    
    // Windows와 Linux 가상환경 경로 처리
    const venvDir = process.platform === 'win32' ? 'Scripts' : 'bin';
    const pythonExe = process.platform === 'win32' ? 'python.exe' : 'python3';
    
    // .venv 또는 .saekindex 가상환경 확인
    let venvPythonPath = path.join(backendRoot, '.venv', venvDir, pythonExe);
    if (!fs.existsSync(venvPythonPath)) {
      venvPythonPath = path.join(backendRoot, '.saekindex', venvDir, pythonExe);
    }
    
    const pythonExecutable = fs.existsSync(venvPythonPath) ? venvPythonPath : 'python';

    if (!fs.existsSync(pythonScriptPath)) {
      throw new Error(`Python server script not found: ${pythonScriptPath}`);
    }

    // Python 서버 프로세스 시작
    pythonServerProcess = spawn(pythonExecutable, [
      pythonScriptPath
    ], {
      env: {
        ...process.env,
        EMOTION_SERVER_PORT: pythonServerPort.toString()
      }
    });

    pythonServerProcess.stdout.on('data', (data) => {
      console.log('[Python Server]', data.toString().trim());
    });

    pythonServerProcess.stderr.on('data', (data) => {
      console.error('[Python Server Error]', data.toString().trim());
    });

    pythonServerProcess.on('close', (code) => {
      console.log(`[Emotion Service] Python 서버 종료됨 (코드: ${code})`);
      pythonServerProcess = null;
      isServerStarting = false;
    });

    pythonServerProcess.on('error', (err) => {
      console.error('[Emotion Service] Python 서버 시작 실패:', err);
      pythonServerProcess = null;
      isServerStarting = false;
    });

    // 서버가 준비될 때까지 대기 (최대 30초)
    let attempts = 0;
    const maxAttempts = 60; // 30초 (0.5초 * 60)
    
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${pythonServerUrl}/health`, { timeout: 1000 });
        if (response.status === 200 && response.data.status === 'ready') {
          console.log('[Emotion Service] Python 서버 준비 완료!');
          isServerStarting = false;
          return;
        }
      } catch (err) {
        // 서버가 아직 준비되지 않음
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    throw new Error('Python 서버가 30초 내에 준비되지 않았습니다.');
  } catch (error) {
    console.error('[Emotion Service] Python 서버 시작 실패:', error);
    if (pythonServerProcess) {
      pythonServerProcess.kill();
      pythonServerProcess = null;
    }
    isServerStarting = false;
    throw error;
  }
}

/**
 * Python 서버가 실행 중인지 확인
 */
async function checkServerHealth() {
  try {
    const response = await axios.get(`${pythonServerUrl}/health`, { timeout: 2000 });
    return response.status === 200 && response.data.status === 'ready';
  } catch (err) {
    return false;
  }
}

/**
 * Python CNN 모델을 사용하여 감정 분석 (HTTP 서버 방식)
 * @param {Buffer} imageBuffer - 이미지 버퍼
 * @returns {Promise<{label: string, score: number, probs: number[]}>}
 */
async function analyzeEmotion(imageBuffer) {
  try {
    // 서버가 실행 중인지 확인
    const isHealthy = await checkServerHealth();
    
    if (!isHealthy) {
      logger.info('Python 서버가 실행 중이 아니므로 시작합니다...');
      await startPythonServer();
    }

    // FormData 생성
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'emotion_image.jpg',
      contentType: 'image/jpeg'
    });

    // HTTP 요청으로 감정 분석 수행
    const response = await axios.post(`${pythonServerUrl}/analyze`, formData, {
      headers: formData.getHeaders(),
      timeout: 10000 // 10초 타임아웃
    });

    if (response.data && response.data.data) {
      logger.info('감정 분석 완료', { label: response.data.data.label });
      return response.data.data;
    } else {
      throw new Error('Invalid response from Python server');
    }
  } catch (error) {
    logger.error('감정 분석 실패', { error: error.message });
    throw error;
  }
}

/**
 * 세션 시작 (녹화 시작) - Redis 기반
 * @param {string} sessionId - 세션 ID
 */
async function startSession(sessionId) {
  try {
    await sessionService.startSession(sessionId);
    logger.info(`Session started: ${sessionId}`);
  } catch (error) {
    logger.error(`Failed to start session: ${sessionId}`, { error: error.message });
    throw error;
  }
}

/**
 * 세션 종료 (녹화 중지) - Redis 기반
 * @param {string} sessionId - 세션 ID
 */
async function stopSession(sessionId) {
  try {
    await sessionService.stopSession(sessionId);
    logger.info(`Session stopped: ${sessionId}`);
  } catch (error) {
    logger.error(`Failed to stop session: ${sessionId}`, { error: error.message });
  }
}

/**
 * 웹캠 감정 벡터 추가 - Redis 기반
 * @param {string} sessionId - 세션 ID
 * @param {number[]} webcamVector - 웹캠 감정 벡터
 */
async function pushWebcamVector(sessionId, webcamVector) {
  try {
    await sessionService.pushWebcamVector(sessionId, webcamVector);
    logger.debug(`Webcam vector pushed: ${sessionId}`);
  } catch (error) {
    logger.error(`Failed to push webcam vector: ${sessionId}`, { error: error.message });
    throw error;
  }
}

/**
 * 세션의 웹캠 데이터 가져오기 - Redis 기반
 * @param {string} sessionId - 세션 ID
 * @returns {number[][]} - 웹캠 감정 벡터 배열
 */
async function getWebcamData(sessionId) {
  try {
    const data = await sessionService.getWebcamData(sessionId);
    logger.info(`Webcam data retrieved: ${sessionId} (${data.length} frames)`);
    return data;
  } catch (error) {
    logger.error(`Failed to get webcam data: ${sessionId}`, { error: error.message });
    return [];
  }
}

/**
 * 세션 삭제 - Redis 기반
 * @param {string} sessionId - 세션 ID
 */
async function deleteSession(sessionId) {
  try {
    await sessionService.deleteSession(sessionId);
    logger.info(`Session deleted: ${sessionId}`);
  } catch (error) {
    logger.error(`Failed to delete session: ${sessionId}`, { error: error.message });
  }
}

/**
 * Python 서버 종료 (앱 종료 시 호출)
 */
function stopPythonServer() {
  if (pythonServerProcess) {
    console.log('[Emotion Service] Python 서버 종료 중...');
    pythonServerProcess.kill('SIGTERM');
    pythonServerProcess = null;
  }
}

module.exports = {
  analyzeEmotion,
  startSession,
  stopSession,
  pushWebcamVector,
  getWebcamData,
  deleteSession,
  startPythonServer,
  stopPythonServer
};

