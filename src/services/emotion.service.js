// src/services/emotion.service.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// 세션 관리 (메모리 기반)
const sessions = new Map(); // sessionId -> { isRecording: boolean, webcamDataBuffer: [] }

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
    const venvPythonPath = path.join(
      backendRoot,
      '.venv',
      'bin',
      process.platform === 'win32' ? 'python.exe' : 'python3'
    );
    const pythonExecutable = fs.existsSync(venvPythonPath) ? venvPythonPath : 'python3';

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
      console.log('[Emotion Service] Python 서버가 실행 중이 아니므로 시작합니다...');
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
      return response.data.data;
    } else {
      throw new Error('Invalid response from Python server');
    }
  } catch (error) {
    if (error.response) {
      // 서버 응답 에러
      const errorMsg = error.response.data?.error?.message || error.message;
      console.error('[Emotion Service] Python 서버 에러:', errorMsg);
      throw new Error(errorMsg);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      // 연결 실패 - 서버 재시작 시도
      console.log('[Emotion Service] 서버 연결 실패, 재시작 시도...');
      pythonServerProcess = null;
      await startPythonServer();
      
      // 재시도
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: 'emotion_image.jpg',
        contentType: 'image/jpeg'
      });
      
      const retryResponse = await axios.post(`${pythonServerUrl}/analyze`, formData, {
        headers: formData.getHeaders(),
        timeout: 10000
      });
      
      if (retryResponse.data && retryResponse.data.data) {
        return retryResponse.data.data;
      }
      throw new Error('재시도 후에도 실패했습니다.');
    } else {
      console.error('[Emotion Service] 감정 분석 실패:', error.message);
      throw error;
    }
  }
}

/**
 * 세션 시작 (녹화 시작)
 * @param {string} sessionId - 세션 ID
 */
function startSession(sessionId) {
  sessions.set(sessionId, {
    isRecording: true,
    webcamDataBuffer: []
  });
  console.log(`[Emotion Service] Session started: ${sessionId}`);
}

/**
 * 세션 종료 (녹화 중지)
 * @param {string} sessionId - 세션 ID
 */
function stopSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    session.isRecording = false;
    console.log(`[Emotion Service] Session stopped: ${sessionId}`);
  }
}

/**
 * 웹캠 감정 벡터 추가
 * @param {string} sessionId - 세션 ID
 * @param {number[]} webcamVector - 웹캠 감정 벡터
 */
function pushWebcamVector(sessionId, webcamVector) {
  let session = sessions.get(sessionId);
  
  // 세션이 없으면 생성
  if (!session) {
    console.warn(`[Emotion Service] 세션이 없어 새로 생성합니다: ${sessionId}`);
    session = {
      isRecording: true, // 자동으로 녹화 상태로 설정
      webcamDataBuffer: []
    };
    sessions.set(sessionId, session);
  }
  
  // 녹화 중이 아니어도 데이터 수집 허용 (경고만 출력)
  if (!session.isRecording) {
    console.warn(`[Emotion Service] 세션이 녹화 중이 아니지만 데이터를 수집합니다: ${sessionId}`);
    // 녹화 상태로 변경
    session.isRecording = true;
  }
  
  // 벡터 추가
  session.webcamDataBuffer.push(webcamVector);
  console.log(`[Emotion Service] 웹캠 벡터 추가됨 (세션: ${sessionId}, 버퍼 크기: ${session.webcamDataBuffer.length}, 녹화 중: ${session.isRecording})`);
}

/**
 * 세션의 웹캠 데이터 가져오기
 * @param {string} sessionId - 세션 ID
 * @returns {number[][]} - 웹캠 감정 벡터 배열
 */
function getWebcamData(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    console.log(`[Emotion Service] 웹캠 데이터 가져옴 (세션: ${sessionId}, 버퍼 크기: ${session.webcamDataBuffer.length})`);
    return session.webcamDataBuffer;
  }
  console.warn(`[Emotion Service] 웹캠 데이터 없음 (세션: ${sessionId})`);
  return [];
}

/**
 * 세션 삭제
 * @param {string} sessionId - 세션 ID
 */
function deleteSession(sessionId) {
  sessions.delete(sessionId);
  console.log(`[Emotion Service] Session deleted: ${sessionId}`);
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

