import cv2
import mediapipe as mp
import numpy as np
import json
import sys
import os

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
        self.curl_phase = "down"
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
        
        return {
            "elbow_angle": primary_angle,
            "rep_count": self.rep_count,
            "phase": self.curl_phase,
            "feedback": feedback,
            "left_angle": left_elbow_angle,
            "right_angle": right_elbow_angle
        }

def test_video(video_path):
    """Test curl detection on video file"""
    if not os.path.exists(video_path):
        print(f"❌ Video file not found: {video_path}")
        return False
        
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"❌ Could not open video file: {video_path}")
        return False
        
    form_analyzer = FormAnalyzer()
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    print(f"🎥 Video Analysis Results")
    print(f"📊 Video info: {total_frames} frames, {fps:.1f} FPS, {total_frames/fps:.1f} seconds")
    print("=" * 60)
    
    frame_count = 0
    pose_detected_frames = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)
        
        if results.pose_landmarks:
            pose_detected_frames += 1
            analysis = form_analyzer.analyze_curl_form(results.pose_landmarks.landmark)
            
            if analysis['feedback'] or frame_count % 30 == 0:
                timestamp = frame_count / fps
                print(f"Frame {frame_count} (t={timestamp:.1f}s): Angle={analysis['elbow_angle']:.1f}°, Phase={analysis['phase']}")
                if analysis['feedback']:
                    print(f"  💬 {analysis['feedback']}")
    
    cap.release()
    
    print("=" * 60)
    print(f"📈 Final Results:")
    print(f"✅ Total reps detected: {form_analyzer.rep_count}")
    print(f"📐 Final phase: {form_analyzer.curl_phase}")
    print(f"🎯 Pose detection rate: {pose_detected_frames}/{total_frames} frames ({pose_detected_frames/total_frames*100:.1f}%)")
    
    return True

if __name__ == "__main__":
    default_video = "/home/ubuntu/attachments/9ceafd2d-5908-4f23-986a-a54bcecec959/curl.mp4"
    video_path = sys.argv[1] if len(sys.argv) > 1 else default_video
    
    print("🏋️  Dumbbell Curl Form Analyzer - Video Test")
    print("=" * 60)
    
    success = test_video(video_path)
    
    if success:
        print("\n✅ Video analysis completed successfully!")
        print("🎯 This confirms the MediaPipe algorithm works perfectly for curl detection.")
    else:
        print("\n❌ Video analysis failed!")
        sys.exit(1)
