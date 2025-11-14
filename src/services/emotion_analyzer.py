#!/usr/bin/env python3
"""
CNN 기반 감정 분석 스크립트
이미지 파일을 받아서 MediaPipe로 얼굴을 탐지하고, CNN 모델로 감정을 분류합니다.
입력: 이미지 파일 경로
출력: JSON 파일 (label, score, probs 배열)
"""

import sys
import os
import json
import torch
import torch.nn.functional as F
import torchvision.transforms as transforms
import cv2
import numpy as np
# Force MediaPipe to run on CPU (fix macOS NSOpenGLPixelFormat errors)
os.environ["MEDIAPIPE_DISABLE_GPU"] = "1"
import mediapipe as mp
from pathlib import Path

# 프로젝트 루트 경로 설정 (1st_model 폴더 기준)
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

# 감정 순서 정의 (1st_model/integrated_emotion_recognition.py와 동일)
# 0: 'Angry', 1: 'Happy', 2: 'Neutral', 3: 'Sad', 4: 'Surprise'
IDX_TO_LABEL = {
    0: 'Angry',
    1: 'Happy', 
    2: 'Neutral',
    3: 'Sad',
    4: 'Surprise'
}
EMOTIONS = ['Angry', 'Happy', 'Neutral', 'Sad', 'Surprise']

def analyze_emotion(image_path, output_path):
    """
    이미지 파일에서 감정을 분석합니다.
    
    Args:
        image_path: 입력 이미지 파일 경로
        output_path: 결과를 저장할 JSON 파일 경로
    """
    try:
        # 1. 모델 로드
        device = torch.device("cpu")
        model = EmotionCNN().to(device)
        
        if not model_path.exists():
            error_msg = f"Model file not found: {model_path}"
            print(f"Error: {error_msg}", file=sys.stderr)
            result = {
                "error": error_msg,
                "label": "neutral",
                "score": 0.0,
                "probs": [0.0, 0.0, 1.0, 0.0, 0.0]
            }
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            return
        
        model.load_state_dict(torch.load(str(model_path), map_location=device))
        model.eval()
        
        # 2. 이미지 전처리 설정 (A_cam.py와 동일)
        transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Grayscale(),
            transforms.Resize((48, 48)),
            transforms.ToTensor(),
            transforms.Normalize([0.5], [0.5])
        ])
        
        # 3. MediaPipe 얼굴 감지기 초기화
        mp_face_detection = mp.solutions.face_detection
        try:
            face_detection = mp_face_detection.FaceDetection(
                model_selection=0,
                min_detection_confidence=0.5
            )
        except Exception as e:
            error_msg = f"Failed to initialize MediaPipe: {str(e)}"
            print(f"Error: {error_msg}", file=sys.stderr)
            result = {
                "error": error_msg,
                "label": "Neutral",
                "score": 0.0,
                "probs": [0.0, 0.0, 1.0, 0.0, 0.0]
            }
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            return
        
        # 4. 이미지 읽기
        image = cv2.imread(str(image_path))
        if image is None:
            error_msg = f"Cannot read image: {image_path}"
            print(f"Error: {error_msg}", file=sys.stderr)
            result = {
                "error": error_msg,
                "label": "Neutral",
                "score": 0.0,
                "probs": [0.0, 0.0, 1.0, 0.0, 0.0]
            }
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            return
        
        # 5. 얼굴 감지 (1st_model/integrated_emotion_recognition.py 방식)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_detection.process(rgb_image)
        
        # 기본값: 얼굴이 감지되지 않으면 neutral
        webcam_vector = np.array([0.0, 0.0, 1.0, 0.0, 0.0])
        ai_emotion = "Neutral"
        
        if results.detections:
            for detection in results.detections:
                # 얼굴 영역 좌표 계산 (1st_model 방식 - 20% 마진 추가)
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
                    
                    # AI 모델 추론 (1st_model의 Neutral 억제 로직 적용)
                    with torch.no_grad():
                        output = model(face_tensor)
                        probs = F.softmax(output, dim=1).cpu().numpy().squeeze()
                        
                        # Neutral 억제 로직 (Neutral이 너무 자주 나오는 것을 방지)
                        if probs[2] < 0.6:  # Neutral(인덱스 2)의 확률이 0.6 미만이면
                            non_neutral_probs = probs.copy()
                            non_neutral_probs[2] = 0  # Neutral 확률을 0으로 설정
                            pred_idx = np.argmax(non_neutral_probs)
                        else:
                            pred_idx = np.argmax(probs)
                        
                        webcam_vector = probs
                        ai_emotion = IDX_TO_LABEL[pred_idx]
                    
                    break  # 첫 번째 얼굴만 처리
                except Exception as e:
                    print(f"Error processing face: {e}", file=sys.stderr)
                    import traceback
                    traceback.print_exc()
                    continue
        
        # 6. 결과 생성
        probs_list = webcam_vector.tolist()
        max_prob = float(np.max(webcam_vector))
        
        result = {
            "label": ai_emotion,
            "score": round(max_prob, 3),
            "probs": [round(p, 3) for p in probs_list]
        }
        
        # 7. JSON 파일로 저장
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
    except Exception as e:
        error_msg = f"Analysis error: {str(e)}"
        print(f"Error: {error_msg}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        result = {
            "error": error_msg,
            "label": "Neutral",
            "score": 0.0,
            "probs": [0.0, 0.0, 1.0, 0.0, 0.0]
        }
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python emotion_analyzer.py <input_image_path> <output_json_path>", file=sys.stderr)
        sys.exit(1)
    
    image_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    
    analyze_emotion(image_path, output_path)

