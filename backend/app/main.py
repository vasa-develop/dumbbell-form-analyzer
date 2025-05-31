from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import mediapipe as mp
import numpy as np
import json
import base64
from typing import Dict, List
import asyncio
import math

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    enable_segmentation=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

class FormAnalyzer:
    def __init__(self):
        self.curl_phase = "down"  # "up" or "down"
        self.rep_count = 0
        self.last_elbow_angle = None
        self.feedback_messages = []
        
    def calculate_angle(self, a, b, c):
        """Calculate angle between three points"""
        a = np.array(a)
        b = np.array(b)
        c = np.array(c)
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
            
        return angle
    
    def analyze_curl_form(self, landmarks):
        """Analyze dumbbell curl form and provide feedback"""
        feedback = []
        
        left_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                        landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
        left_elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
        left_wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
        
        right_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                         landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
        right_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                      landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
        right_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                      landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
        
        left_elbow_angle = self.calculate_angle(left_shoulder, left_elbow, left_wrist)
        right_elbow_angle = self.calculate_angle(right_shoulder, right_elbow, right_wrist)
        
        primary_angle = min(left_elbow_angle, right_elbow_angle)
        
        if self.last_elbow_angle is not None:
            if self.curl_phase == "down" and primary_angle < 90:
                self.curl_phase = "up"
            elif self.curl_phase == "up" and primary_angle > 140:
                self.curl_phase = "down"
                self.rep_count += 1
                feedback.append(f"Rep {self.rep_count} completed!")
        
        self.last_elbow_angle = primary_angle
        
        if primary_angle < 30:
            feedback.append("Great! Full range of motion at the top.")
        elif primary_angle < 60:
            feedback.append("Good curl! Try to squeeze a bit more at the top.")
        elif primary_angle > 160:
            feedback.append("Good starting position. Keep your core tight.")
        
        shoulder_stability = abs(left_shoulder[1] - right_shoulder[1])
        if shoulder_stability > 0.05:
            feedback.append("Keep your shoulders stable. Avoid swinging.")
        
        if abs(left_elbow[0] - left_shoulder[0]) > 0.15 or abs(right_elbow[0] - right_shoulder[0]) > 0.15:
            feedback.append("Keep your elbows close to your body.")
        
        return {
            "elbow_angle": primary_angle,
            "rep_count": self.rep_count,
            "phase": self.curl_phase,
            "feedback": feedback
        }

form_analyzer = FormAnalyzer()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.websocket("/ws/analyze")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "frame":
                image_data = base64.b64decode(message["data"].split(",")[1])
                nparr = np.frombuffer(image_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                results = pose.process(rgb_frame)
                
                response = {
                    "type": "analysis",
                    "pose_detected": False,
                    "feedback": []
                }
                
                if results.pose_landmarks:
                    response["pose_detected"] = True
                    
                    analysis = form_analyzer.analyze_curl_form(results.pose_landmarks.landmark)
                    response.update(analysis)
                    
                    landmarks = []
                    for landmark in results.pose_landmarks.landmark:
                        landmarks.append({
                            "x": landmark.x,
                            "y": landmark.y,
                            "z": landmark.z,
                            "visibility": landmark.visibility
                        })
                    response["landmarks"] = landmarks
                
                await websocket.send_text(json.dumps(response))
                
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

@app.post("/reset")
async def reset_analyzer():
    """Reset the form analyzer state"""
    global form_analyzer
    form_analyzer = FormAnalyzer()
    return {"status": "reset", "message": "Form analyzer has been reset"}
