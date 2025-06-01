import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-react-native';

export class FormAnalyzer {
  constructor() {
    this.curlPhase = "down";
    this.repCount = 0;
    this.lastElbowAngle = null;
    this.lastFeedbackTime = {};
    this.feedbackCooldown = 3.0; // seconds
  }

  calculateAngle(a, b, c) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  }

  shouldGiveFeedback(feedbackType) {
    const currentTime = Date.now() / 1000;
    const lastTime = this.lastFeedbackTime[feedbackType] || 0;
    
    if (currentTime - lastTime >= this.feedbackCooldown) {
      this.lastFeedbackTime[feedbackType] = currentTime;
      return true;
    }
    return false;
  }

  analyzeCurlForm(keypoints) {
    const feedback = [];
    
    const leftShoulder = keypoints[5];
    const leftElbow = keypoints[7];
    const leftWrist = keypoints[9];
    const rightShoulder = keypoints[6];
    const rightElbow = keypoints[8];
    const rightWrist = keypoints[10];

    const requiredKeypoints = [leftShoulder, leftElbow, leftWrist, rightShoulder, rightElbow, rightWrist];
    const minConfidence = 0.3;
    
    if (!requiredKeypoints.every(kp => kp && kp.score > minConfidence)) {
      return {
        elbowAngle: null,
        repCount: this.repCount,
        phase: this.curlPhase,
        feedback: ["Position yourself so your arms are clearly visible"]
      };
    }

    const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
    const primaryAngle = Math.min(leftElbowAngle, rightElbowAngle);

    if (this.lastElbowAngle !== null) {
      if (this.curlPhase === "down" && primaryAngle < 90) {
        this.curlPhase = "up";
      } else if (this.curlPhase === "up" && primaryAngle > 140) {
        this.curlPhase = "down";
        this.repCount += 1;
        feedback.push(`Rep ${this.repCount} completed!`);
      }
    }

    this.lastElbowAngle = primaryAngle;

    if (primaryAngle < 30 && this.shouldGiveFeedback("top_squeeze")) {
      feedback.push("Great! Full range of motion at the top.");
    } else if (primaryAngle < 60 && this.curlPhase === "up" && this.shouldGiveFeedback("good_curl")) {
      feedback.push("Good curl! Try to squeeze a bit more at the top.");
    } else if (primaryAngle > 160 && this.curlPhase === "down" && this.shouldGiveFeedback("starting_position")) {
      feedback.push("Good starting position. Keep your core tight.");
    }

    const shoulderStability = Math.abs(leftShoulder.y - rightShoulder.y);
    if (shoulderStability > 0.05 && this.shouldGiveFeedback("shoulder_stability")) {
      feedback.push("Keep your shoulders stable. Avoid swinging.");
    }

    if ((Math.abs(leftElbow.x - leftShoulder.x) > 0.15 || Math.abs(rightElbow.x - rightShoulder.x) > 0.15) && this.shouldGiveFeedback("elbow_position")) {
      feedback.push("Keep your elbows close to your body.");
    }

    return {
      elbowAngle: primaryAngle,
      repCount: this.repCount,
      phase: this.curlPhase,
      feedback: feedback
    };
  }

  reset() {
    this.curlPhase = "down";
    this.repCount = 0;
    this.lastElbowAngle = null;
    this.lastFeedbackTime = {};
  }
}
