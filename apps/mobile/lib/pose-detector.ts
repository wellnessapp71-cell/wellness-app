/**
 * Pose detection abstraction using TensorFlow.js + MoveNet.
 *
 * Initialises the MoveNet SinglePose Lightning model (fastest, ~30ms/frame)
 * and exposes a simple `detect(imageTensor)` → landmarks API.
 *
 * Landmarks are returned keyed by MediaPipe-compatible names so they
 * plug directly into the rep-counter engine.
 */

import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as poseDetection from "@tensorflow-models/pose-detection";

// MoveNet keypoint indices → MediaPipe-compatible landmark names
const KEYPOINT_MAP: Record<string, string> = {
  nose: "NOSE",
  left_eye: "LEFT_EYE",
  right_eye: "RIGHT_EYE",
  left_ear: "LEFT_EAR",
  right_ear: "RIGHT_EAR",
  left_shoulder: "LEFT_SHOULDER",
  right_shoulder: "RIGHT_SHOULDER",
  left_elbow: "LEFT_ELBOW",
  right_elbow: "RIGHT_ELBOW",
  left_wrist: "LEFT_WRIST",
  right_wrist: "RIGHT_WRIST",
  left_hip: "LEFT_HIP",
  right_hip: "RIGHT_HIP",
  left_knee: "LEFT_KNEE",
  right_knee: "RIGHT_KNEE",
  left_ankle: "LEFT_ANKLE",
  right_ankle: "RIGHT_ANKLE",
};

export interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export type PoseLandmarkMap = Record<string, PoseLandmark>;

let detector: poseDetection.PoseDetector | null = null;
let tfReady = false;

/**
 * Initialise TensorFlow.js and load the MoveNet model.
 * Call once at app/screen mount. Subsequent calls are no-ops.
 */
export async function initialisePoseDetector(): Promise<boolean> {
  try {
    if (!tfReady) {
      await tf.ready();
      tfReady = true;
    }

    if (!detector) {
      detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        },
      );
    }

    return true;
  } catch (err) {
    console.warn("Pose detector init failed:", err);
    return false;
  }
}

/**
 * Detect pose from a camera frame tensor.
 * Returns null if no pose detected or detector not ready.
 *
 * @param imageTensor — 3D tensor [height, width, 3] (RGB uint8)
 */
export async function detectPose(
  imageTensor: tf.Tensor3D,
): Promise<PoseLandmarkMap | null> {
  if (!detector) return null;

  try {
    const poses = await detector.estimatePoses(imageTensor);
    if (!poses.length || !poses[0].keypoints?.length) return null;

    const keypoints = poses[0].keypoints;
    const landmarks: PoseLandmarkMap = {};

    for (const kp of keypoints) {
      const name = kp.name ? KEYPOINT_MAP[kp.name] : undefined;
      if (name) {
        landmarks[name] = {
          x: kp.x,
          y: kp.y,
          visibility: kp.score ?? 0,
        };
      }
    }

    return Object.keys(landmarks).length > 0 ? landmarks : null;
  } catch (err) {
    console.warn("Pose detection error:", err);
    return null;
  }
}

/**
 * Clean up detector resources.
 */
export async function disposePoseDetector(): Promise<void> {
  if (detector) {
    detector.dispose();
    detector = null;
  }
}

/**
 * Check if detector is loaded and ready.
 */
export function isDetectorReady(): boolean {
  return detector !== null && tfReady;
}
