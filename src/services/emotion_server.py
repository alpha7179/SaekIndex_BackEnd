#!/usr/bin/env python3
"""
감정 분석 Python 서버
모델을 한 번만 로드하고 HTTP 요청으로 감정 분석을 수행합니다.
"""

import sys
import os
import json
import torch
import torch.nn.functional as F
import torchvision.transforms as transforms
import cv2
import numpy as np
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# Force MediaPipe to run on CPU (fix macOS NSOpenGLPixelFormat errors)
os.environ["MEDIAPIPE_DISABLE_GPU"] = "1"
import mediapipe as mp

# 프로젝트 루트 경로 설정
script_dir = Path(__file__).parent
project_root = script_dir.parent.parent.parent
model_dir = project_root / '1st_model'

# 모델 경로
model_path = model_dir / 'emotion_cnn_best.pth'
model_py_path = model_dir / 'model.py'

# sys.path에 모델 디렉토리 추가
sys.path.insert(0, str(model_dir))

# 모델 클래스 임포트
try:
    from model import EmotionCNN
except ImportError:
    print(f"Error: Cannot import EmotionCNN from {model_py_path}", file=sys.stderr)
    sys.exit(1)

# Flask 앱 초기화
app = Flask(__name__)
CORS(app)

# 전역 변수로 모델과 MediaPipe 유지
emotion_model = None
face_detection = None
device = None
transform = None

# 감정 라벨 매핑
IDX_TO_LABEL = {
    0: 'Angry',
    1: 'Happy',
    2: 'Neutral',
    3: 'Sad',
    4: 'Surprise'
}

def initialize_model():
    """모델과 MediaPipe를 초기화합니다."""
    global emotion_model, face_detection, device, transform
    
    print("[Emotion Server] 모델 초기화 시작...")
    
    # 디바이스 설정
    device = torch.device("cpu")
    
    # 모델 로드
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    
    emotion_model = EmotionCNN().to(device)
    emotion_model.load_state_dict(torch.load(str(model_path), map_location=device, weights_only=False))
    emotion_model.eval()
    print("[Emotion Server] 모델 로드 완료")
    
    # 이미지 전처리 설정
    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Grayscale(),
        transforms.Resize((48, 48)),
        transforms.ToTensor(),
        transforms.Normalize([0.5], [0.5])
    ])
    print("[Emotion Server] 전처리 파이프라인 설정 완료")
    
    # MediaPipe 얼굴 감지기 초기화
    mp_face_detection = mp.solutions.face_detection
    face_detection = mp_face_detection.FaceDetection(
        model_selection=0,
        min_detection_confidence=0.5
    )
    print("[Emotion Server] MediaPipe 초기화 완료")
    print("[Emotion Server] 모든 초기화 완료!")

def analyze_emotion_from_image(image_bytes):
    """
    이미지 바이트에서 감정을 분석합니다.
    
    Args:
        image_bytes: 이미지 바이트 데이터
        
    Returns:
        dict: {label: str, score: float, probs: list}
    """
    try:
        # 이미지 디코딩
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError("Failed to decode image")
        
        # 얼굴 감지
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_detection.process(rgb_image)
        
        # 기본값: 얼굴이 감지되지 않으면 neutral
        webcam_vector = np.array([0.0, 0.0, 1.0, 0.0, 0.0])
        ai_emotion = "Neutral"
        
        if results.detections:
            for detection in results.detections:
                # 얼굴 영역 좌표 계산 (20% 마진 추가)
                bbox = detection.location_data.relative_bounding_box
                h, w, _ = image.shape
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                width = int(bbox.width * w)
                height = int(bbox.height * h)
                
                # 얼굴 영역을 20% 더 여유있게 확장
                margin_x = int(width * 0.2)
                margin_y = int(height * 0.2)
                
                x = max(0, x - margin_x)
                y = max(0, y - margin_y)
                width = min(w - x, width + 2 * margin_x)
                height = min(h - y, height + 2 * margin_y)
                
                if width == 0 or height == 0:
                    continue
                
                # 얼굴 영역 자르기
                face = image[y:y+height, x:x+width]
                
                try:
                    # 얼굴 이미지 전처리
                    face_tensor = transform(face).unsqueeze(0).to(device)
                    
                    # AI 모델 추론 (Neutral 억제 로직 적용)
                    with torch.no_grad():
                        output = emotion_model(face_tensor)
                        probs = F.softmax(output, dim=1).cpu().numpy().squeeze()
                        
                        # Neutral 억제 로직
                        if probs[2] < 0.6:  # Neutral(인덱스 2)의 확률이 0.6 미만이면
                            non_neutral_probs = probs.copy()
                            non_neutral_probs[2] = 0
                            pred_idx = np.argmax(non_neutral_probs)
                        else:
                            pred_idx = np.argmax(probs)
                        
                        webcam_vector = probs
                        ai_emotion = IDX_TO_LABEL[pred_idx]
                    
                    break  # 첫 번째 얼굴만 처리
                except Exception as e:
                    print(f"[Emotion Server] Error processing face: {e}", file=sys.stderr)
                    continue
        
        # 결과 생성
        probs_list = webcam_vector.tolist()
        max_prob = float(np.max(webcam_vector))
        
        return {
            "label": ai_emotion,
            "score": round(max_prob, 3),
            "probs": [round(p, 3) for p in probs_list]
        }
        
    except Exception as e:
        print(f"[Emotion Server] Analysis error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        # 에러 발생 시 기본값 반환
        return {
            "error": str(e),
            "label": "Neutral",
            "score": 0.0,
            "probs": [0.0, 0.0, 1.0, 0.0, 0.0]
        }

@app.route('/health', methods=['GET'])
def health_check():
    """헬스체크 엔드포인트"""
    if emotion_model is None or face_detection is None:
        return jsonify({"status": "not_ready"}), 503
    return jsonify({"status": "ready"}), 200

@app.route('/analyze', methods=['POST'])
def analyze():
    """이미지를 받아서 감정 분석 수행"""
    try:
        if 'image' not in request.files:
            return jsonify({
                "error": {
                    "message": "이미지 파일이 필요합니다."
                }
            }), 400
        
        image_file = request.files['image']
        image_bytes = image_file.read()
        
        if len(image_bytes) == 0:
            return jsonify({
                "error": {
                    "message": "이미지 파일이 비어있습니다."
                }
            }), 400
        
        # 감정 분석 수행
        result = analyze_emotion_from_image(image_bytes)
        
        return jsonify({
            "data": {
                "label": result["label"],
                "score": result["score"],
                "probs": result["probs"],
                "timestamp": None  # 필요시 추가
            }
        }), 200
        
    except Exception as e:
        print(f"[Emotion Server] Request error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return jsonify({
            "error": {
                "message": "감정 분석 중 오류가 발생했습니다.",
                "details": str(e)
            }
        }), 500

if __name__ == '__main__':
    # 모델 초기화
    try:
        initialize_model()
    except Exception as e:
        print(f"[Emotion Server] 초기화 실패: {e}", file=sys.stderr)
        sys.exit(1)
    
    # 서버 시작
    port = int(os.environ.get('EMOTION_SERVER_PORT', 5001))
    print(f"[Emotion Server] 서버 시작: http://localhost:{port}")
    app.run(host='127.0.0.1', port=port, debug=False, threaded=True)

