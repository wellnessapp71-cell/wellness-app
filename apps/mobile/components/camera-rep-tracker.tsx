/**
 * CameraRepTracker — Apple-Health-grade live camera rep counter.
 *
 * Features:
 *  - MoveNet pose detection with bilateral angle tracking
 *  - SVG skeleton overlay with tracked-angle highlighting
 *  - 3-2-1 countdown before counting starts
 *  - Haptic feedback on each rep + milestones
 *  - Ring progress indicator (Apple Watch style)
 *  - Per-rep quality dots
 *  - Pose quality indicator (positioning guidance)
 *  - Form feedback with real-time coaching cues
 *  - Camera flip (front ↔ back)
 *  - Voice coaching (calls out rep count + form cues)
 *  - Pause/resume during active set
 *  - Set-complete overlay before returning
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Vibration,
} from "react-native";
import _Svg, { Circle as _Circle, Line as _Line } from "react-native-svg";
// react-native-svg v15 class types are incompatible with React 19
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Svg = _Svg as any,
  SvgLine = _Line as any,
  SvgCircle = _Circle as any;
import { CameraView as _CameraView, useCameraPermissions } from "expo-camera";
// expo-camera class types are incompatible with React 19 (same as react-native-svg)
const CameraView = _CameraView as any;
import * as Speech from "expo-speech";
import * as tf from "@tensorflow/tfjs";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import {
  getAngleConfig,
  createRepCounter,
  startCounting,
  stopCounting,
  processFrame,
  type RepCounterState,
  type FormFeedback,
} from "@/lib/fitness-engine/index";
import {
  initialisePoseDetector,
  detectPose,
  disposePoseDetector,
  isDetectorReady,
  type PoseLandmarkMap,
} from "@/lib/pose-detector";

// ── Props ──

export interface CameraRepTrackerProps {
  exerciseName: string;
  bodyParts?: string[];
  targetReps: number;
  onSetComplete: (reps: number, elapsedSeconds: number) => void;
  onCancel: () => void;
}

// ── Constants ──

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const SKELETON_BONES: [string, string][] = [
  ["LEFT_SHOULDER", "RIGHT_SHOULDER"],
  ["LEFT_SHOULDER", "LEFT_ELBOW"],
  ["LEFT_ELBOW", "LEFT_WRIST"],
  ["RIGHT_SHOULDER", "RIGHT_ELBOW"],
  ["RIGHT_ELBOW", "RIGHT_WRIST"],
  ["LEFT_SHOULDER", "LEFT_HIP"],
  ["RIGHT_SHOULDER", "RIGHT_HIP"],
  ["LEFT_HIP", "RIGHT_HIP"],
  ["LEFT_HIP", "LEFT_KNEE"],
  ["LEFT_KNEE", "LEFT_ANKLE"],
  ["RIGHT_HIP", "RIGHT_KNEE"],
  ["RIGHT_KNEE", "RIGHT_ANKLE"],
];

const FEEDBACK_CONFIG: Record<
  NonNullable<FormFeedback>,
  { label: string; color: string; bg: string; voice: string }
> = {
  good_form: {
    label: "Good Form!",
    color: "#34C759",
    bg: "#34C75926",
    voice: "Good form",
  },
  go_deeper: {
    label: "Go Deeper",
    color: "#FF9500",
    bg: "#FF950026",
    voice: "Go deeper",
  },
  go_higher: {
    label: "Ease Up",
    color: "#FF9500",
    bg: "#FF950026",
    voice: "Ease up",
  },
  partial_rep: {
    label: "Partial Rep",
    color: "#FF3B30",
    bg: "#FF3B3026",
    voice: "Full range",
  },
};

const PHASE_LABELS: Record<string, string> = {
  standing: "Ready",
  descending: "Going down",
  bottom: "Hold",
  ascending: "Coming up",
};

// ── Helpers ──

function getPoseQuality(landmarks: PoseLandmarkMap | null): {
  label: string;
  color: string;
} {
  if (!landmarks) return { label: "No body detected", color: "#FF3B30" };
  const visible = Object.values(landmarks).filter(
    (lm) => (lm.visibility ?? 0) >= 0.3,
  ).length;
  if (visible >= 12) return { label: "Good position", color: "#34C759" };
  if (visible >= 8) return { label: "Step back a little", color: "#FF9500" };
  return { label: "Move into frame", color: "#FF3B30" };
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

/** Speak a coaching cue (non-blocking) */
function speakCue(text: string) {
  try {
    Speech.speak(text, { language: "en", rate: 1.1, pitch: 1.0 });
  } catch {
    // TTS not available — silent fallback
  }
}

// ── Component ──

export default function CameraRepTracker({
  exerciseName,
  bodyParts,
  targetReps,
  onSetComplete,
  onCancel,
}: CameraRepTrackerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [modelReady, setModelReady] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Initialising...");
  const [counterState, setCounterState] =
    useState<RepCounterState>(createRepCounter());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastLandmarks, setLastLandmarks] = useState<PoseLandmarkMap | null>(
    null,
  );
  const [countdown, setCountdown] = useState<number | null>(null);

  // ── NEW: camera facing, pause, set-complete overlay ──
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [isPaused, setIsPaused] = useState(false);
  const [setCompleteOverlay, setSetCompleteOverlay] = useState(false);
  const [cameraTransitioning, setCameraTransitioning] = useState(false);

  const counterRef = useRef<RepCounterState>(createRepCounter());
  const startTimeRef = useRef<number>(0);
  const processingRef = useRef(false);
  const activeRef = useRef(true);
  const completedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<any>(null);
  const photoDimsRef = useRef({ width: SCREEN_W, height: SCREEN_H });
  const prevRepsRef = useRef(0);
  const countdownTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastVoiceFeedback = useRef<string | null>(null);
  const pausedRef = useRef(false);
  const cameraTransitionRef = useRef(false);

  const angleConfig = getAngleConfig(exerciseName, bodyParts);

  // Build set of tracked landmark names (both sides) for skeleton highlighting
  const trackedSet = new Set<string>();
  angleConfig.accuracyAngle.angle.forEach((n) => trackedSet.add(n));
  angleConfig.accuracyAngle.angle.forEach((n) => {
    if (n.startsWith("LEFT_")) trackedSet.add(n.replace("LEFT_", "RIGHT_"));
    else if (n.startsWith("RIGHT_"))
      trackedSet.add(n.replace("RIGHT_", "LEFT_"));
  });

  // ── Load model on mount ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingStatus("Loading TensorFlow.js...");
      await tf.ready();
      if (cancelled) return;
      setLoadingStatus("Loading pose model...");
      const ok = await initialisePoseDetector();
      if (cancelled) return;
      if (ok) {
        setModelReady(true);
        setLoadingStatus("Ready");
      } else {
        setLoadingStatus("Failed to load pose model");
      }
    })();
    return () => {
      cancelled = true;
      disposePoseDetector();
    };
  }, []);

  // ── Cleanup countdown timers ──
  useEffect(() => () => countdownTimers.current.forEach(clearTimeout), []);

  // ── Elapsed timer ──
  useEffect(() => {
    if (counterRef.current.active && !timerRef.current) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (!pausedRef.current) {
          setElapsedSeconds(
            Math.floor((Date.now() - startTimeRef.current) / 1000),
          );
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [counterState.active]);

  // ── Voice coaching on rep count change ──
  useEffect(() => {
    if (counterState.reps > prevRepsRef.current) {
      const isMilestone = counterState.reps % 5 === 0;
      Vibration.vibrate(isMilestone ? [0, 50, 80, 50] : 50);

      // Voice: call out rep count
      if (counterState.reps >= targetReps) {
        speakCue(`Set complete! ${counterState.reps} reps`);
      } else if (isMilestone) {
        speakCue(`${counterState.reps} reps, keep going!`);
      } else {
        speakCue(`${counterState.reps}`);
      }

      prevRepsRef.current = counterState.reps;
    }
  }, [counterState.reps, targetReps]);

  // ── Voice form feedback (throttled) ──
  useEffect(() => {
    if (
      counterState.formFeedback &&
      counterState.active &&
      counterState.formFeedback !== "good_form" &&
      counterState.formFeedback !== lastVoiceFeedback.current
    ) {
      const fb = FEEDBACK_CONFIG[counterState.formFeedback];
      speakCue(fb.voice);
      lastVoiceFeedback.current = counterState.formFeedback;
      // Reset after 3s so it can repeat
      setTimeout(() => {
        lastVoiceFeedback.current = null;
      }, 3000);
    }
  }, [counterState.formFeedback, counterState.active]);

  // ── Frame processing loop ──
  const processFrameTick = useCallback(async () => {
    if (processingRef.current || !activeRef.current || !isDetectorReady())
      return;
    if (!cameraRef.current) return;
    if (pausedRef.current) return;
    if (cameraTransitionRef.current) return;

    processingRef.current = true;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.3,
      });

      if (!photo?.base64 || !activeRef.current) {
        processingRef.current = false;
        return;
      }

      if (photo.width && photo.height) {
        photoDimsRef.current = { width: photo.width, height: photo.height };
      }

      const raw = tf.util.encodeString(photo.base64, "base64");
      const imageTensor = decodeJpeg(new Uint8Array(raw));
      const landmarks = await detectPose(imageTensor);
      imageTensor.dispose();

      if (landmarks) {
        setLastLandmarks(landmarks);

        if (counterRef.current.active) {
          const next = processFrame(
            counterRef.current,
            landmarks,
            angleConfig.accuracyAngle,
            targetReps,
          );
          counterRef.current = next;
          setCounterState({ ...next });

          if (next.reps >= targetReps || !next.active) {
            handleComplete();
          }
        }
      }
    } catch {
      // Frame processing errors are expected — continue
    }

    processingRef.current = false;
  }, [angleConfig, targetReps]);

  // Run frame processing whenever model is ready (not just when counting)
  useEffect(() => {
    if (!modelReady) return;
    const interval = setInterval(processFrameTick, 200);
    return () => clearInterval(interval);
  }, [modelReady, processFrameTick]);

  // ── Actions ──

  function handleStart() {
    countdownTimers.current.forEach(clearTimeout);
    countdownTimers.current = [];

    setCountdown(3);
    Vibration.vibrate(30);
    speakCue("3");

    countdownTimers.current.push(
      setTimeout(() => {
        setCountdown(2);
        Vibration.vibrate(30);
        speakCue("2");
      }, 1000),
      setTimeout(() => {
        setCountdown(1);
        Vibration.vibrate(30);
        speakCue("1");
      }, 2000),
      setTimeout(() => {
        setCountdown(null);
        Vibration.vibrate([0, 40, 60, 40]);
        speakCue("Go!");
        const next = startCounting(counterRef.current);
        counterRef.current = next;
        setCounterState({ ...next });
        startTimeRef.current = Date.now();
      }, 3000),
    );
  }

  function handleComplete() {
    if (completedRef.current) return;
    completedRef.current = true;
    activeRef.current = false;
    const next = stopCounting(counterRef.current);
    counterRef.current = next;
    setCounterState({ ...next });
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    Vibration.vibrate([0, 60, 100, 60, 100, 60]);
    Speech.stop();

    // Show set-complete overlay for 2s before returning
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setSetCompleteOverlay(true);
    speakCue(`Set complete! ${next.reps} reps`);

    setTimeout(() => {
      setSetCompleteOverlay(false);
      onSetComplete(next.reps, elapsed);
    }, 2000);
  }

  function handleStop() {
    if (completedRef.current) return;
    completedRef.current = true;
    activeRef.current = false;
    countdownTimers.current.forEach(clearTimeout);
    setCountdown(null);
    const next = stopCounting(counterRef.current);
    counterRef.current = next;
    setCounterState({ ...next });
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    Speech.stop();
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

    setSetCompleteOverlay(true);
    speakCue(`Done. ${next.reps} reps`);

    setTimeout(() => {
      setSetCompleteOverlay(false);
      onSetComplete(next.reps, elapsed);
    }, 2000);
  }

  function handlePauseResume() {
    if (isPaused) {
      pausedRef.current = false;
      setIsPaused(false);
      speakCue("Resumed");
    } else {
      pausedRef.current = true;
      setIsPaused(true);
      speakCue("Paused");
    }
  }

  function handleFlipCamera() {
    // Guard against capturing stale frames during transition
    cameraTransitionRef.current = true;
    setCameraTransitioning(true);
    setLastLandmarks(null);
    setCameraFacing((prev) => (prev === "front" ? "back" : "front"));
    // Allow camera to reinitialize before resuming frame capture
    setTimeout(() => {
      cameraTransitionRef.current = false;
      setCameraTransitioning(false);
    }, 800);
  }

  // ── Permission handling ──

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera access is required for rep tracking
        </Text>
        <Pressable onPress={requestPermission} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Grant Camera Access</Text>
        </Pressable>
        <Pressable onPress={onCancel} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Use Manual Input</Text>
        </Pressable>
      </View>
    );
  }

  // ── Loading state ──

  if (!modelReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{loadingStatus}</Text>
        <Text style={styles.loadingSub}>
          First load downloads the pose model (~5 MB)
        </Text>
        <Pressable
          onPress={onCancel}
          style={[styles.secondaryBtn, { marginTop: 24 }]}
        >
          <Text style={styles.secondaryBtnText}>Use Manual Input Instead</Text>
        </Pressable>
      </View>
    );
  }

  // ── Derived values ──

  const fb = counterState.formFeedback
    ? FEEDBACK_CONFIG[counterState.formFeedback]
    : null;
  const phaseLabel = PHASE_LABELS[counterState.phase] ?? counterState.phase;
  const progress =
    targetReps > 0 ? Math.min(1, counterState.reps / targetReps) : 0;
  const ringR = 68;
  const ringC = 2 * Math.PI * ringR;
  const poseQ = getPoseQuality(lastLandmarks);
  const isFront = cameraFacing === "front";

  // ── Skeleton coordinate mapping ──
  // Front camera is mirrored: flip X so the skeleton aligns with the user's body
  function mapX(rawX: number, photoWidth: number): number {
    const normalized = rawX / photoWidth;
    const mapped = isFront ? 1 - normalized : normalized;
    return mapped * SCREEN_W;
  }
  function mapY(rawY: number, photoHeight: number): number {
    return (rawY / photoHeight) * SCREEN_H;
  }

  // ── Main camera view ──

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        key={cameraFacing}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={cameraFacing}
        mode="picture"
      />

      {/* ── Camera transitioning overlay ── */}
      {cameraTransitioning && (
        <View style={styles.setCompleteOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={[styles.pausedSub, { marginTop: 12 }]}>
            Switching camera...
          </Text>
        </View>
      )}

      {/* ── Set Complete overlay ── */}
      {setCompleteOverlay && (
        <View style={styles.setCompleteOverlay}>
          <Text style={{ fontSize: 60 }}>🎯</Text>
          <Text style={styles.setCompleteTitle}>Set Complete!</Text>
          <Text style={styles.setCompleteReps}>
            {counterState.reps} / {targetReps} reps
          </Text>
          <Text style={styles.setCompleteTime}>
            {formatTime(elapsedSeconds)}
          </Text>
        </View>
      )}

      {/* ── Paused overlay ── */}
      {isPaused && (
        <View style={styles.pausedOverlay}>
          <Text style={{ fontSize: 48 }}>⏸</Text>
          <Text style={styles.pausedTitle}>Paused</Text>
          <Text style={styles.pausedSub}>Adjust camera or position</Text>
          <Pressable onPress={handlePauseResume} style={styles.resumeBtn}>
            <Text style={styles.resumeBtnText}>Resume</Text>
          </Pressable>
        </View>
      )}

      {/* ── Skeleton overlay ── */}
      {lastLandmarks && !isPaused && !setCompleteOverlay && (
        <Svg
          style={StyleSheet.absoluteFill}
          width={SCREEN_W}
          height={SCREEN_H}
          pointerEvents="none"
        >
          {/* Bones */}
          {SKELETON_BONES.map(([nameA, nameB], i) => {
            const lmA = lastLandmarks[nameA];
            const lmB = lastLandmarks[nameB];
            if (!lmA || !lmB) return null;
            if ((lmA.visibility ?? 0) < 0.2 || (lmB.visibility ?? 0) < 0.2)
              return null;
            const pw = photoDimsRef.current.width;
            const ph = photoDimsRef.current.height;
            const x1 = mapX(lmA.x, pw);
            const y1 = mapY(lmA.y, ph);
            const x2 = mapX(lmB.x, pw);
            const y2 = mapY(lmB.y, ph);
            const isTracked = trackedSet.has(nameA) && trackedSet.has(nameB);
            return (
              <SvgLine
                key={`b${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isTracked ? "#FF6B00" : "#00FFC8"}
                strokeWidth={isTracked ? 4 : 2.5}
                strokeOpacity={0.85}
              />
            );
          })}
          {/* Keypoints */}
          {Object.entries(lastLandmarks).map(([name, lm]) => {
            if ((lm.visibility ?? 0) < 0.2) return null;
            const pw = photoDimsRef.current.width;
            const ph = photoDimsRef.current.height;
            const cx = mapX(lm.x, pw);
            const cy = mapY(lm.y, ph);
            const isTracked = trackedSet.has(name);
            return (
              <SvgCircle
                key={`k${name}`}
                cx={cx}
                cy={cy}
                r={isTracked ? 7 : 4}
                fill={isTracked ? "#FF6B00" : "#FFD700"}
                fillOpacity={0.9}
                stroke={isTracked ? "#fff" : "#000"}
                strokeWidth={isTracked ? 2 : 1}
                strokeOpacity={0.6}
              />
            );
          })}
        </Svg>
      )}

      {/* ── 3-2-1 Countdown overlay ── */}
      {countdown !== null && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownNum}>{countdown}</Text>
          <Text style={styles.countdownLabel}>Get in position</Text>
        </View>
      )}

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Pressable onPress={onCancel} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          <Text style={styles.exerciseTarget}>Target: {targetReps} reps</Text>
        </View>

        {/* Flip camera button */}
        <Pressable onPress={handleFlipCamera} style={styles.flipBtn}>
          <Text style={styles.flipBtnText}>🔄</Text>
        </Pressable>

        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </View>
      </View>

      {/* ── Pose quality indicator ── */}
      {!counterState.active && countdown === null && (
        <View style={[styles.poseQualityBadge, { borderColor: poseQ.color }]}>
          <View
            style={[styles.poseQualityDot, { backgroundColor: poseQ.color }]}
          />
          <Text style={[styles.poseQualityText, { color: poseQ.color }]}>
            {poseQ.label}
          </Text>
        </View>
      )}

      {/* ── Center — ring + rep count ── */}
      <View style={styles.centerOverlay}>
        {/* Ring progress */}
        <Svg width={160} height={160}>
          {/* Background ring */}
          <SvgCircle
            cx={80}
            cy={80}
            r={ringR}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={7}
          />
          {/* Progress arc */}
          {counterState.active && (
            <SvgCircle
              cx={80}
              cy={80}
              r={ringR}
              fill="none"
              stroke={progress >= 1 ? "#34C759" : "#00D4AA"}
              strokeWidth={7}
              strokeDasharray={`${ringC}`}
              strokeDashoffset={`${ringC * (1 - progress)}`}
              strokeLinecap="round"
              rotation={-90}
              origin="80, 80"
            />
          )}
        </Svg>

        {/* Rep count inside ring */}
        <View style={styles.ringCenter}>
          <Text style={styles.repCount}>{counterState.reps}</Text>
          <Text style={styles.repLabel}>/ {targetReps}</Text>
        </View>

        {/* Phase badge */}
        <View
          style={[
            styles.phaseBadge,
            {
              backgroundColor:
                counterState.phase === "bottom"
                  ? "rgba(255,149,0,0.85)"
                  : counterState.phase === "ascending"
                    ? "rgba(52,199,89,0.85)"
                    : "rgba(0,122,255,0.8)",
            },
          ]}
        >
          <Text style={styles.phaseText}>{phaseLabel}</Text>
        </View>

        {/* Current angle */}
        {counterState.currentAngle !== null && counterState.active && (
          <Text style={styles.angleText}>
            {Math.round(counterState.currentAngle)}°
          </Text>
        )}
      </View>

      {/* ── Form feedback ── */}
      {fb && counterState.active && (
        <View style={[styles.feedbackBadge, { backgroundColor: fb.bg }]}>
          <Text style={[styles.feedbackText, { color: fb.color }]}>
            {fb.label}
          </Text>
        </View>
      )}

      {/* ── Rep quality dots ── */}
      {counterState.repHistory.length > 0 && (
        <View style={styles.repDotsRow}>
          {counterState.repHistory.map((q, i) => (
            <View
              key={i}
              style={[
                styles.repDot,
                {
                  backgroundColor:
                    q.depthScore >= 0.8
                      ? "#34C759"
                      : q.depthScore >= 0.5
                        ? "#FF9500"
                        : "#FF3B30",
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* ── Bottom controls ── */}
      <View style={styles.bottomOverlay}>
        {!counterState.active && countdown === null ? (
          <View>
            {/* Exercise tips before starting */}
            <View style={styles.tipsBanner}>
              <Text style={styles.tipsText}>
                📐 Position your full body in frame ·{" "}
                {isFront ? "Front" : "Back"} camera
              </Text>
            </View>
            <Pressable onPress={handleStart} style={styles.startBtn}>
              <Text style={styles.startBtnText}>Start Counting</Text>
            </Pressable>
          </View>
        ) : countdown === null ? (
          <View style={styles.activeControls}>
            {/* Pause button */}
            <Pressable onPress={handlePauseResume} style={styles.pauseBtn}>
              <Text style={styles.pauseBtnText}>{isPaused ? "▶" : "⏸"}</Text>
            </Pressable>

            {/* Finish button */}
            <Pressable onPress={handleStop} style={styles.stopBtn}>
              <Text style={styles.stopBtnText}>
                Finish Set ({counterState.reps} reps)
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionText: {
    color: "#fff",
    fontSize: 17,
    textAlign: "center",
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secondaryBtn: { paddingHorizontal: 24, paddingVertical: 14 },
  secondaryBtnText: { color: "#007AFF", fontSize: 15, fontWeight: "600" },
  loadingText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    marginTop: 16,
  },
  loadingSub: { color: "#8A8A8E", fontSize: 13, marginTop: 4 },

  // ── Set Complete Overlay ──
  setCompleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  setCompleteTitle: {
    color: "#34C759",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 12,
  },
  setCompleteReps: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
  },
  setCompleteTime: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },

  // ── Paused Overlay ──
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 90,
  },
  pausedTitle: {
    color: "#FF9500",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
  },
  pausedSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 4,
  },
  resumeBtn: {
    backgroundColor: "#34C759",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 24,
  },
  resumeBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },

  // ── Countdown ──
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  countdownNum: {
    color: "#fff",
    fontSize: 120,
    fontWeight: "900",
    textShadowColor: "rgba(0,122,255,0.4)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  countdownLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },

  // ── Top bar ──
  topBar: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  exerciseInfo: { flex: 1, marginHorizontal: 12 },
  exerciseName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  exerciseTarget: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
  },
  flipBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  flipBtnText: { fontSize: 20 },
  timerBadge: {
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // ── Pose quality ──
  poseQualityBadge: {
    position: "absolute",
    top: 104,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
  },
  poseQualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  poseQualityText: { fontSize: 13, fontWeight: "700" },

  // ── Center overlay ──
  centerOverlay: {
    position: "absolute",
    top: "28%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  ringCenter: {
    position: "absolute",
    top: 0,
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  repCount: {
    color: "#fff",
    fontSize: 56,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  repLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "700",
    marginTop: -4,
  },
  phaseBadge: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },
  phaseText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  angleText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },

  // ── Feedback ──
  feedbackBadge: {
    position: "absolute",
    top: "62%",
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    zIndex: 10,
  },
  feedbackText: { fontSize: 17, fontWeight: "800" },

  // ── Tips banner ──
  tipsBanner: {
    backgroundColor: "rgba(0,122,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: "center",
  },
  tipsText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  // ── Active controls ──
  activeControls: {
    flexDirection: "row",
    gap: 12,
  },
  pauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,149,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  pauseBtnText: { color: "#fff", fontSize: 24, fontWeight: "800" },

  // ── Rep quality dots ──
  repDotsRow: {
    position: "absolute",
    top: "69%",
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
    zIndex: 10,
  },
  repDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  // ── Bottom ──
  bottomOverlay: {
    position: "absolute",
    bottom: 44,
    left: 24,
    right: 24,
    zIndex: 10,
  },
  startBtn: {
    backgroundColor: "#34C759",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  startBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  stopBtn: {
    flex: 1,
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  stopBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
