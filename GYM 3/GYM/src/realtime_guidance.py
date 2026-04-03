"""
Real-Time Workout Guidance (Optional)
 - Live camera feed (OpenCV)
 - Pose estimation (MediaPipe) if available
 - Basic rep counting scaffold
 - Rest countdown and start/stop tones (terminal bell)

This module fails gracefully if dependencies are missing or camera not available.
"""

from typing import Optional, Tuple, Dict, List
from rich.console import Console
from time import sleep, time
import os
import warnings

console = Console()

# Initialize these at module level to avoid "possibly unbound" errors
HAS_CV2 = False
cv2_module = None
HAS_MP = False
mp_module = None
HAS_SR = False
sr_module = None

try:
    # Reduce TensorFlow/MediaPipe logging noise BEFORE import
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")  # 0=all,1=INFO,2=WARNING,3=ERROR
    warnings.filterwarnings("ignore")
    import cv2  # type: ignore
    cv2_module = cv2
    HAS_CV2 = True
except Exception:
    HAS_CV2 = False

try:
    import speech_recognition as sr  # type: ignore
    sr_module = sr
    HAS_SR = True
except Exception:
    HAS_SR = False

try:
    import mediapipe as mp  # type: ignore
    mp_module = mp
    HAS_MP = True
except Exception:
    HAS_MP = False

import threading


class VoiceCommandListener(threading.Thread):
    def __init__(self):
        super().__init__()
        self.recognizer = sr_module.Recognizer() if HAS_SR and sr_module else None
        self.microphone = sr_module.Microphone() if HAS_SR and sr_module else None
        self.command = None
        self.running = True
        self.daemon = True  # Make thread daemon so it dies when main thread dies
        # Tweak recognition to be more resilient
        try:
            if self.recognizer is not None:
                self.recognizer.dynamic_energy_threshold = True
                self.recognizer.pause_threshold = 0.6
                self.recognizer.energy_threshold = 300  # Set a reasonable default
        except Exception:
            pass

    def run(self):
        if not HAS_SR or not sr_module or self.microphone is None or self.recognizer is None:
            return
        try:
            with self.microphone as source:
                try:
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                except Exception:
                    pass
                while self.running:
                    try:
                        # Listen with timeout to avoid blocking indefinitely
                        audio = self.recognizer.listen(source, timeout=1, phrase_time_limit=2.0)
                        text = self.recognizer.recognize_google(audio).lower()
                        if "start" in text:
                            self.command = "start"
                        elif any(k in text for k in ["stop", "quit", "exit"]):
                            self.command = "stop"
                            self.running = False
                            break  # Exit the loop immediately
                    except sr_module.WaitTimeoutError:
                        # Timeout is normal, continue listening
                        continue
                    except sr_module.UnknownValueError:
                        # Could not understand audio, continue listening
                        continue
                    except sr_module.RequestError as e:
                        # API error, but continue trying
                        console.print(f"⚠️  Speech recognition error: {e}", style="yellow")
                        continue
                    except Exception:
                        # Any other error, continue listening
                        continue
        except Exception:
            pass

    def stop(self):
        """Stop the listener thread"""
        self.running = False


class RealtimeCoach:
    """Handles real-time guidance with camera; best-effort if deps missing."""

    def __init__(self):
        self.enabled = HAS_CV2
        self.pose = None
        self.mp_drawing = None
        self.mp_pose = None
        # Lazy import mediapipe right before first camera usage to avoid startup logs

    def available(self) -> bool:
        """Check if real-time guidance is available"""
        try:
            return self.enabled and HAS_CV2
        except Exception:
            return False

    def request_camera_access(self) -> bool:
        """Show a friendly prompt and test camera briefly with improved error handling"""
        if not HAS_CV2 or not cv2_module:
            console.print("❌ OpenCV not installed. Install to enable live camera guidance.")
            return False
            
        cap = None
        try:
            cap = cv2_module.VideoCapture(0)
            if not cap or not cap.isOpened():
                console.print("❌ Cannot access camera. Please grant permissions and try again.")
                return False
            console.print("📷 Camera access OK. Type 'start' to begin when prompted.")
            return True
        except Exception as e:
            console.print(f"❌ Error accessing camera: {str(e)}. Check permissions.", style="red")
            return False
        finally:
            if cap:
                try:
                    cap.release()
                except Exception:
                    pass

    def test_camera_access(self) -> bool:
        """Test if camera is accessible without displaying a message"""
        if not HAS_CV2 or not cv2_module:
            return False
            
        cap = None
        try:
            cap = cv2_module.VideoCapture(0)
            if not cap or not cap.isOpened():
                return False
            # Try to read a frame
            ret, _ = cap.read()
            return ret
        except Exception:
            return False
        finally:
            if cap:
                try:
                    cap.release()
                except Exception:
                    pass

    def _beep(self):
        """Simple terminal bell with error handling"""
        try:
            console.print("\a", end="")
        except Exception:
            pass

    def rest_countdown(self, seconds: int):
        """Countdown timer with error handling"""
        try:
            for remaining in range(seconds, 0, -1):
                console.print(f"⏱️  Rest: {remaining}s", end="\r")
                sleep(1)
            console.print(" " * 20, end="\r")
        except Exception:
            console.print(" ", end="\r")  # Clear line on error

    def perform_set(self, exercise: Dict, target_reps: int) -> Tuple[int, Optional[str], int]:
        """Perform a set with live camera using angle tracking; returns (reps, feedback, elapsed_seconds)."""
        if not self.enabled or not cv2_module:
            console.print("📷 Camera not available. Proceeding without live guidance.")
            return 0, None, 0

        # Check if MediaPipe is actually working before proceeding
        if not HAS_MP or not mp_module:
            console.print("❌ MediaPipe not available. Proceeding without live guidance.")
            return 0, None, 0
            
        # Try to initialize MediaPipe Pose with proper error handling
        pose = None
        try:
            import mediapipe.python.solutions.pose as pose_solution
            pose = pose_solution.Pose(
                static_image_mode=False,
                model_complexity=1,
                enable_segmentation=False,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
        except Exception as e:
            console.print(f"❌ MediaPipe Pose initialization failed: {e}. Proceeding without live guidance.")
            return 0, None, 0

        cap = None
        try:
            cap = cv2_module.VideoCapture(0)
            if not cap or not cap.isOpened():
                console.print("❌ Unable to open camera. Proceeding without live guidance.")
                return 0, None, 0

            # Warm-up camera
            for _ in range(10):
                ret, _ = cap.read()
                if not ret:
                    console.print("❌ Camera read failed. Proceeding without live guidance.")
                    return 0, None, 0

            console.print("🎥 Camera ready. Say 'start' to begin; say 'stop' or press 'x' to end set; 'q' quits window.")
            
            # Get angle configuration for this exercise
            tracked_angles, accuracy_angle = self._get_angle_config(exercise.get('name', ''), exercise)
            
            # Initialize speech recognition if available
            v = VoiceCommandListener() if HAS_SR else None
            if v:
                try:
                    v.start()
                    console.print("🎤 Voice command listener started", style="dim")
                except Exception as e:
                    console.print(f"⚠️  Failed to start voice listener: {e}", style="yellow")
                    v = None

            # Rep counting state with improved state machine
            reps = 0
            # Enhanced 4-state machine: standing -> descending -> bottom -> ascending
            phase = "standing"  # standing, descending, bottom, ascending
            last_rep_ts = time()
            MIN_TIME_BETWEEN_REPS = 1.0  # seconds
            ema_alpha = 0.7
            ema_angle = None
            last_cmd = None
            last_cmd_ts = 0
            
            # State tracking for advanced state machine
            state_durations = {"standing": 0.0, "descending": 0.0, "bottom": 0.0, "ascending": 0.0}
            state_entry_time = time()
            previous_phase = "standing"
            
            # Improved tracking variables
            angle_history = []  # Store recent angles for better noise filtering
            MAX_ANGLE_HISTORY = 5  # Keep last 5 angles
            rep_confidence = 0.0  # Confidence level for rep detection
            visualization_angle = None  # Angle to display on screen
            
            # Temporal buffering for noise reduction
            temporal_buffer = []  # Store recent angle measurements
            TEMPORAL_BUFFER_SIZE = 5  # Buffer size for temporal smoothing
            
            # Timing
            start = time()
            count_start_ts = None
            counting_active = False

            # Main loop
            frame_count = 0
            results = None  # Initialize results to avoid unbound variable error
            while True:
                try:
                    ret, frame = cap.read()
                    if not ret:
                        console.print("⚠️  Camera read failed. Ending set.", style="yellow")
                        break

                    frame_count += 1
                    # Flip frame horizontally for mirror effect
                    frame = cv2_module.flip(frame, 1)
                    h, w, _ = frame.shape

                    # Process frame with MediaPipe every 3 frames to reduce CPU usage
                    if frame_count % 3 == 0:
                        rgb_frame = cv2_module.cvtColor(frame, cv2_module.COLOR_BGR2RGB)
                        results = pose.process(rgb_frame)
                    # Else: reuse previous results to maintain smoothness

                    # Draw landmarks if detected (with proper error handling)
                    # Use try/except to handle attribute access issues
                    pose_landmarks_available = False
                    try:
                        # Check if results has pose_landmarks attribute safely
                        if results is not None:
                            # Use getattr with default None to avoid attribute errors
                            pose_landmarks = getattr(results, 'pose_landmarks', None)
                            pose_landmarks_available = pose_landmarks is not None
                    except:
                        pose_landmarks_available = False
                        
                    if pose_landmarks_available:
                        try:
                            import mediapipe.python.solutions.drawing_utils as drawing_utils
                            import mediapipe.python.solutions.pose as pose_solution
                            # Convert frozenset to list for compatibility
                            connections_list = list(pose_solution.POSE_CONNECTIONS)
                            # Use getattr to safely access pose_landmarks
                            pose_landmarks = getattr(results, 'pose_landmarks', None)
                            if pose_landmarks is not None:
                                drawing_utils.draw_landmarks(
                                    frame, pose_landmarks, connections_list,
                                    drawing_utils.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2),
                                    drawing_utils.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2)
                                )
                        except Exception as e:
                            console.print(f"⚠️  Drawing error: {e}", style="yellow")

                    # Angle tracking and rep counting
                    status_text = "Ready - Press 'S' or say 'start'"
                    color = (0, 255, 0)  # green
                    
                    if counting_active:
                        status_text = f"Counting: {reps}/{target_reps} reps"
                        if reps >= target_reps:
                            status_text = f"✅ Completed {target_reps} reps! Press 'X' or say 'stop'"
                            color = (0, 255, 255)  # yellow
                        else:
                            color = (0, 165, 255)  # orange

                    # Process angles if landmarks detected
                    if pose_landmarks_available and tracked_angles and counting_active:
                        try:
                            # Safely access pose_landmarks and landmark
                            pose_landmarks = getattr(results, 'pose_landmarks', None)
                            if pose_landmarks is not None:
                                landmarks = getattr(pose_landmarks, 'landmark', None)
                                if landmarks is not None:
                            
                                    # Track primary accuracy angle
                                    angle_spec = accuracy_angle["angle"]
                                    import mediapipe.python.solutions.pose as pose_solution
                                    p1 = getattr(pose_solution.PoseLandmark, angle_spec[0]).value
                                    p2 = getattr(pose_solution.PoseLandmark, angle_spec[1]).value
                                    p3 = getattr(pose_solution.PoseLandmark, angle_spec[2]).value
                                
                                    a = landmarks[p1]
                                    b = landmarks[p2]
                                    c = landmarks[p3]
                                
                                    # Calculate angle using improved method
                                    angle = self._calculate_angle(a, b, c)
                                    
                                    # Store angle for visualization
                                    visualization_angle = angle
                                    
                                    # Add to temporal buffer for noise reduction
                                    temporal_buffer.append(angle)
                                    if len(temporal_buffer) > TEMPORAL_BUFFER_SIZE:
                                        temporal_buffer.pop(0)
                                    
                                    # Apply Savitzky-Golay-like smoothing using median of temporal buffer
                                    if len(temporal_buffer) >= 3:
                                        import statistics
                                        smoothed_angle = statistics.median(temporal_buffer)
                                    else:
                                        smoothed_angle = angle
                                    
                                    # Add to history for additional noise filtering
                                    angle_history.append(smoothed_angle)
                                    if len(angle_history) > MAX_ANGLE_HISTORY:
                                        angle_history.pop(0)
                                    
                                    # Use median of recent angles for more stable tracking
                                    if len(angle_history) >= 3:
                                        import statistics
                                        filtered_angle = statistics.median(angle_history)
                                    else:
                                        filtered_angle = smoothed_angle
                                    
                                    # Initialize EMA or update with filtered angle
                                    if ema_angle is None:
                                        ema_angle = filtered_angle
                                    else:
                                        ema_angle = ema_alpha * filtered_angle + (1 - ema_alpha) * ema_angle
                                
                                    # Get ideal range for hysteresis thresholds
                                    try:
                                        low_i, high_i = float(accuracy_angle["min"]), float(accuracy_angle["max"])
                                    except Exception:
                                        low_i, high_i = 60.0, 160.0
                                
                                    # Margins for hysteresis with improved sensitivity
                                    depth_low = max(0.0, low_i - 15.0)  # Increased margin for better detection
                                    depth_high = min(180.0, high_i + 15.0)  # Increased margin for better detection

                                    now_ts = time()
                                    # Update state durations
                                    if phase != previous_phase:
                                        state_durations[previous_phase] += (now_ts - state_entry_time)
                                        state_entry_time = now_ts
                                        previous_phase = phase
                                    else:
                                        state_durations[phase] += (now_ts - state_entry_time)
                                        state_entry_time = now_ts
                                    
                                    # Advanced 4-state machine for robust rep counting
                                    if phase == "standing":
                                        # Look for descent below threshold to start rep
                                        if ema_angle <= low_i and state_durations["standing"] >= 0.3:
                                            phase = "descending"
                                            state_durations = {"standing": 0.0, "descending": 0.0, "bottom": 0.0, "ascending": 0.0}
                                            rep_confidence = min(1.0, rep_confidence + 0.2)
                                    elif phase == "descending":
                                        # Confirm descent with continued movement
                                        if ema_angle <= low_i - 5:  # Additional margin for confirmation
                                            rep_confidence = min(1.0, rep_confidence + 0.1)
                                        # Check if reached bottom position
                                        if ema_angle <= low_i - 10 and state_durations["descending"] >= 0.2:
                                            phase = "bottom"
                                            state_durations = {"standing": 0.0, "descending": 0.0, "bottom": 0.0, "ascending": 0.0}
                                        # Partial return decreases confidence
                                        elif ema_angle > low_i + 10:
                                            rep_confidence = max(0.0, rep_confidence - 0.15)
                                    elif phase == "bottom":
                                        # Confirm bottom position hold
                                        if ema_angle <= low_i + 5 and state_durations["bottom"] >= 0.1:
                                            rep_confidence = min(1.0, rep_confidence + 0.1)
                                        # Look for ascent above threshold
                                        if ema_angle >= low_i + 15 and state_durations["bottom"] >= 0.15:
                                            phase = "ascending"
                                            state_durations = {"standing": 0.0, "descending": 0.0, "bottom": 0.0, "ascending": 0.0}
                                    elif phase == "ascending":
                                        # Confirm ascent with continued movement
                                        if ema_angle >= low_i + 20:
                                            rep_confidence = min(1.0, rep_confidence + 0.1)
                                        # Check if returned to top position
                                        if ema_angle >= high_i and state_durations["ascending"] >= 0.2:
                                            # Only count rep if we have sufficient confidence and time constraints
                                            if rep_confidence >= 0.6 and (now_ts - last_rep_ts) >= MIN_TIME_BETWEEN_REPS:
                                                reps += 1
                                                last_rep_ts = now_ts
                                                phase = "standing"
                                                rep_confidence = 0.0  # Reset confidence
                                                state_durations = {"standing": 0.0, "descending": 0.0, "bottom": 0.0, "ascending": 0.0}
                                                console.print(f"Rep: {reps}", end="\r")
                                                if reps >= target_reps:
                                                    break
                                            else:
                                                # Not confident enough, continue ascending
                                                phase = "ascending"
                                        # Partial descent decreases confidence
                                        elif ema_angle < high_i - 20:
                                            rep_confidence = max(0.0, rep_confidence - 0.2)

                                    # Posture feedback overlay using deviation from ideal window
                                    deviation_text = None
                                    if ema_angle < depth_low:
                                        deviation_text = "Go higher (too deep)"
                                    elif ema_angle > depth_high:
                                        deviation_text = "Go deeper"
                                    if deviation_text:
                                        try:
                                            cv2_module.putText(frame, deviation_text, (30, 90), cv2_module.FONT_HERSHEY_SIMPLEX, 0.9, (0, 165, 255), 2)
                                        except Exception:
                                            pass
                                    
                                    # Display current angle and phase for user feedback
                                    if visualization_angle is not None:
                                        try:
                                            angle_text = f"Angle: {visualization_angle:.1f}° | Phase: {phase}"
                                            cv2_module.putText(frame, angle_text, (30, 120), cv2_module.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                                        except Exception:
                                            pass

                        except Exception as e:
                            console.print(f"⚠️  Angle processing error: {e}", style="yellow")

                    try:
                        # Primary status
                        cv2_module.putText(frame, status_text, (30, 50), cv2_module.FONT_HERSHEY_SIMPLEX, 1.0, color, 3)
                        # Controls hint
                        hint = "🎤 Voice: Say 'start'/'stop' • Keyboard: S=start, X=stop, Q=quit"
                        cv2_module.putText(frame, hint, (30, 80), cv2_module.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)
                    except Exception:
                        pass

                    cv2_module.imshow("Workout Guidance", frame)

                    # Handle keyboard input first (non-blocking)
                    key = cv2_module.waitKey(1) & 0xFF
                    
                    # Check for quit key first
                    if key == ord('q') or key == ord('Q'):
                        console.print("🛑 Quit key pressed", style="yellow")
                        break
                    
                    # Check for start key
                    if key == ord('s') or key == ord('S'):
                        if not counting_active:
                            console.print("▶️  Start key pressed", style="green")
                            counting_active = True
                            count_start_ts = time()
                            last_cmd = "start"
                            last_cmd_ts = time()
                            # Clear any existing voice command
                            if HAS_SR and v:
                                v.command = None
                    
                    # Check for stop key
                    if key == ord('x') or key == ord('X'):
                        if counting_active:
                            console.print("⏹️  Stop key pressed", style="yellow")
                            break
                    
                    # Voice command handling (check after keyboard for priority)
                    cmd = None
                    if HAS_SR and v:
                        cmd = getattr(v, 'command', None)
                    
                    # Process voice commands
                    if cmd in ('start', 'stop'):
                        last_cmd = cmd
                        last_cmd_ts = time()
                    
                    # Handle start command
                    if not counting_active and cmd == 'start':
                        console.print("▶️  'start' voice command received", style="green")
                        counting_active = True
                        count_start_ts = time()
                        # Clear the voice command to prevent re-triggering
                        if HAS_SR and v:
                            v.command = None
                    
                    # Handle stop command
                    if counting_active and cmd == 'stop':
                        console.print("⏹️  'stop' voice command received", style="yellow")
                        break
                    
                    # Auto-skip to rest after completing target reps
                    if reps >= target_reps:
                        console.print("🎉 Target reps completed!", style="green")
                        break
                    
                    # Show last voice command indicator briefly
                    if last_cmd and (time() - last_cmd_ts) < 1.5:
                        try:
                            dot_color = (0, 200, 0) if last_cmd == 'start' else (0, 0, 255)
                            cv2_module.circle(frame, (20, 30), 10, dot_color, -1)
                            cv2_module.putText(frame, f"Voice: {last_cmd}", (40, 35), cv2_module.FONT_HERSHEY_SIMPLEX, 0.6, dot_color, 2)
                        except Exception:
                            pass

                    # Old placeholder rep logic replaced by hysteresis above

                except Exception as e:
                    console.print(f"⚠️  Error during set execution: {e}", style="yellow")
                    break

            elapsed = int(time() - start)
            self._beep()  # stop tone
            feedback = None
            # Stop listener properly
            try:
                if HAS_SR and v:
                    v.stop()  # Use our custom stop method
                    v.join(timeout=2)  # Wait up to 2 seconds for thread to finish
                    console.print("🎤 Voice listener stopped", style="dim")
            except Exception as e:
                console.print(f"⚠️  Error stopping voice listener: {e}", style="yellow")
            # Initialize time_only with a default value
            time_only = 'plank' in exercise.get('name', '') or ('time_only' in exercise and exercise.get('time_only', False))
            return (reps if not time_only else 0), feedback, elapsed
        except Exception as e:
            console.print(f"❌ Live guidance error: {e}", style="red")
            return 0, None, 0
        finally:
            try:
                if cap:
                    cap.release()
                if HAS_CV2 and cv2_module:
                    cv2_module.destroyAllWindows()
                # Close MediaPipe pose safely
                try:
                    if pose is not None:
                        pose.close()
                except Exception:
                    pass
            except Exception:
                pass

    def wait_for_start(self, message: str = "Say 'start' to continue...", timeout_seconds: int = 60) -> bool:
        """Wait for voice 'start' (or returns False on timeout)."""
        console.print(f"{message}", style="italic")
        if not HAS_SR:
            console.print("📣 Voice not available. Proceeding after 3s...")
            sleep(3)
            return True
        
        console.print("🎤 Listening for 'start' command...")
        v = VoiceCommandListener()
        try:
            v.start()
            t0 = time()
            while time() - t0 < timeout_seconds and v.is_alive() and v.running:
                if getattr(v, 'command', None) == 'start':
                    console.print("✅ 'start' command received!", style="green")
                    return True
                sleep(0.1)  # Shorter sleep for more responsive detection
        except Exception as e:
            console.print(f"⚠️  Voice command error: {e}", style="yellow")
        finally:
            try:
                v.stop()
                v.join(timeout=1)
            except Exception:
                pass
        
        # Timeout reached
        console.print("⏰ Timeout reached. Proceeding anyway...", style="yellow")
        return True

    # ===== Helpers =====
    def _get_angle_config(self, name: str, exercise: Dict) -> Tuple[List[Dict], Dict]:
        # Use provided config if present
        if exercise.get('rt_tracked_angles') and exercise.get('rt_accuracy_angle'):
            return exercise['rt_tracked_angles'], exercise['rt_accuracy_angle']
        # Fallback presets per common exercises
        presets: Dict[str, Tuple[List[Dict], Dict]] = {
            'push-ups': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [70, 170]},
                    {"points": ["RIGHT_SHOULDER","RIGHT_ELBOW","RIGHT_WRIST"], "ideal_range": [70, 170]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 70, "max": 170}
            ),
            'incline push-ups': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [70, 170]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 70, "max": 170}
            ),
            'decline push-ups': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [70, 170]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 70, "max": 170}
            ),
            'squats': (
                [
                    {"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [70, 170]},
                    {"points": ["RIGHT_HIP","RIGHT_KNEE","RIGHT_ANKLE"], "ideal_range": [70, 170]},
                ],
                {"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 70, "max": 170}
            ),
            'lunges': (
                [
                    {"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [70, 170]},
                ],
                {"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 70, "max": 170}
            ),
            'bicep curls': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [40, 160]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 40, "max": 160}
            ),
            'shoulder press': (
                [
                    {"points": ["LEFT_ELBOW","LEFT_SHOULDER","LEFT_HIP"], "ideal_range": [50, 120]},
                ],
                {"angle": ["LEFT_ELBOW","LEFT_SHOULDER","LEFT_HIP"], "min": 50, "max": 120}
            ),
            'pull-ups': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [60, 160]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 60, "max": 160}
            ),
            'tricep dips': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [60, 160]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 60, "max": 160}
            ),
            'deadlifts': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "ideal_range": [150, 180]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "min": 150, "max": 180}
            ),
            'plank': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_HIP","LEFT_ANKLE"], "ideal_range": [150, 180]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_HIP","LEFT_ANKLE"], "min": 150, "max": 180}
            ),
            'bench press': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [60, 160]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 60, "max": 160}
            ),
            'dumbbell press': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [60, 160]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 60, "max": 160}
            ),
            'dumbbell flyes': (
                [
                    {"points": ["LEFT_ELBOW","LEFT_SHOULDER","LEFT_HIP"], "ideal_range": [60, 140]},
                ],
                {"angle": ["LEFT_ELBOW","LEFT_SHOULDER","LEFT_HIP"], "min": 60, "max": 140}
            ),
            'cable flyes': (
                [
                    {"points": ["LEFT_ELBOW","LEFT_SHOULDER","LEFT_HIP"], "ideal_range": [60, 140]},
                ],
                {"angle": ["LEFT_ELBOW","LEFT_SHOULDER","LEFT_HIP"], "min": 60, "max": 140}
            ),
            'reverse flyes': (
                [
                    {"points": ["LEFT_ELBOW","LEFT_SHOULDER","LEFT_HIP"], "ideal_range": [60, 140]},
                ],
                {"angle": ["LEFT_ELBOW","LEFT_SHOULDER","LEFT_HIP"], "min": 60, "max": 140}
            ),
            'lat pulldowns': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [60, 150]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 60, "max": 150}
            ),
            'seated rows': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [60, 150]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 60, "max": 150}
            ),
            'bent-over rows': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [60, 150]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 60, "max": 150}
            ),
            'calf raises': (
                [
                    {"points": ["LEFT_KNEE","LEFT_ANKLE","LEFT_FOOT_INDEX"], "ideal_range": [80, 120]},
                ],
                {"angle": ["LEFT_KNEE","LEFT_ANKLE","LEFT_FOOT_INDEX"], "min": 80, "max": 120}
            ),
            'wall sits': (
                [
                    {"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [80, 100]},
                ],
                {"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 80, "max": 100}
            ),
            'step-ups': (
                [
                    {"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [70, 170]},
                ],
                {"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 70, "max": 170}
            ),
            'leg press': (
                [
                    {"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [70, 150]},
                ],
                {"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 70, "max": 150}
            ),
            'bulgarian split squats': (
                [
                    {"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [70, 170]},
                ],
                {"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 70, "max": 170}
            ),
            'hammer curls': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [40, 160]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 40, "max": 160}
            ),
            'overhead tricep extension': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [40, 160]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 40, "max": 160}
            ),
            'resistance band curls': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [40, 160]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 40, "max": 160}
            ),
            'cable tricep pushdowns': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [60, 160]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 60, "max": 160}
            ),
            'mountain climbers': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "ideal_range": [60, 160]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "min": 60, "max": 160}
            ),
            'russian twists': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "ideal_range": [60, 160]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "min": 60, "max": 160}
            ),
            'dead bug': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "ideal_range": [80, 170]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "min": 80, "max": 170}
            ),
            'hanging leg raises': (
                [
                    {"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [40, 160]},
                ],
                {"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 40, "max": 160}
            ),
            'cable woodchops': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "ideal_range": [60, 160]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "min": 60, "max": 160}
            ),
            'jumping jacks': (
                [
                    {"points": ["LEFT_ELBOW","LEFT_SHOULDER","LEFT_HIP"], "ideal_range": [60, 140]},
                ],
                {"angle": ["LEFT_ELBOW","LEFT_SHOULDER","LEFT_HIP"], "min": 60, "max": 140}
            ),
            'burpees': (
                [
                    {"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [60, 170]},
                ],
                {"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 60, "max": 170}
            ),
            'crunches': (
                [
                    {"points": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "ideal_range": [60, 140]},
                ],
                {"angle": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "min": 60, "max": 140}
            ),
        }
        # normalize name key
        key = name.strip()
        if key in presets:
            return presets[key]

        # Generic fallbacks by keywords
        if any(k in key for k in ["push-up", "push-ups", "push ups", "press", "row", "fly"]):
            return (
                [{"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [60, 160]}],
                {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 60, "max": 160}
            )
        if any(k in key for k in ["squat", "lunge", "step", "press", "calf", "leg"]):
            return (
                [{"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [70, 170]}],
                {"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 70, "max": 170}
            )
        if any(k in key for k in ["plank", "crunch", "twist", "bug", "mountain", "raise", "woodchop", "jack"]):
            return (
                [{"points": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "ideal_range": [60, 160]}],
                {"angle": ["LEFT_SHOULDER","LEFT_HIP","LEFT_KNEE"], "min": 60, "max": 160}
            )

        # Lastly, try by body parts
        parts = [p for p in exercise.get('body_parts', [])]
        if any('legs' in str(p) or 'core' in str(p) for p in parts):
            return (
                [{"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [70, 170]}],
                {"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 70, "max": 170}
            )
        # Default upper-limb fallback
        return (
            [{"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [60, 160]}],
            {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 60, "max": 160}
        )

    def _landmarks_from_points(self, lm, points: List[str]):
        try:
            if self.mp_pose is not None:
                idx = [getattr(self.mp_pose.PoseLandmark, p) for p in points]
                a, b, c = lm[idx[0].value], lm[idx[1].value], lm[idx[2].value]
                return (a, b, c)
            else:
                return (None, None, None)
        except Exception:
            return (None, None, None)

    def _calculate_angle(self, a, b, c) -> float:
        """Calculate angle between three points using vector mathematics"""
        # a, b, c are landmarks with x,y
        import math
        ax, ay = a.x, a.y
        bx, by = b.x, b.y
        cx, cy = c.x, c.y
        
        # Calculate vectors
        ab = (ax - bx, ay - by)
        cb = (cx - bx, cy - by)
        
        # Calculate dot product and magnitudes
        dot = ab[0]*cb[0] + ab[1]*cb[1]
        mag_ab = math.hypot(*ab)
        mag_cb = math.hypot(*cb)
        
        # Handle edge case where vectors have zero magnitude
        if mag_ab == 0 or mag_cb == 0:
            return 0.0
            
        # Calculate cosine of angle and clamp to valid range
        cosang = max(-1.0, min(1.0, dot / (mag_ab * mag_cb)))
        
        # Convert to degrees
        ang = math.degrees(math.acos(cosang))
        return ang

    def _calculate_angle_with_atan2(self, a, b, c) -> float:
        """Alternative angle calculation using atan2 for better accuracy"""
        import math
        
        # Calculate angles using atan2
        angle1 = math.degrees(math.atan2(a.y - b.y, a.x - b.x))
        angle2 = math.degrees(math.atan2(c.y - b.y, c.x - b.x))
        
        # Calculate the difference
        angle = abs(angle1 - angle2)
        
        # Ensure we get the acute angle (0-180)
        if angle > 180:
            angle = 360 - angle
            
        return angle

    def _draw_styled_line(self, frame, a, b, c, color=(0, 200, 0), thickness=4):
        try:
            h, w = frame.shape[:2]
            ax, ay = int(a.x * w), int(a.y * h)
            bx, by = int(b.x * w), int(b.y * h)
            cx, cy = int(c.x * w), int(c.y * h)
            # Lines
            import cv2
            cv2.line(frame, (ax, ay), (bx, by), color, thickness)
            cv2.line(frame, (bx, by), (cx, cy), color, thickness)
            # Joints
            cv2.circle(frame, (ax, ay), 6, (255, 255, 255), -1)
            cv2.circle(frame, (bx, by), 6, (255, 255, 255), -1)
            cv2.circle(frame, (cx, cy), 6, (255, 255, 255), -1)
        except Exception:
            pass

    def _color_for_angle(self, angle: float, ideal: list) -> tuple:
        # Returns a BGR color from red (far) to green (good)
        try:
            low, high = float(ideal[0]), float(ideal[1])
            if angle <= low:
                t = max(0.0, min(1.0, (angle - (low-30)) / 30.0))
            elif angle >= high:
                t = max(0.0, min(1.0, ((high+30) - angle) / 30.0))
            else:
                t = 1.0
            # interpolate red->yellow->green: use BGR
            # t=0 -> red (0,0,255), t=0.5 -> yellow (0,255,255), t=1 -> green (0,255,0)
            if t >= 1.0:
                return (0, 255, 0)
            if t <= 0.0:
                return (0, 0, 255)
            if t < 0.5:
                # red -> yellow
                g = int(255 * (t / 0.5))
                return (0, g, 255)
            else:
                # yellow -> green
                r = int(255 * (1 - (t - 0.5) / 0.5))
                return (0, 255, r)
        except Exception:
            return (0, 0, 255)


