/**
 * POS (Plane Orthogonal to Skin) rPPG Algorithm — JavaScript implementation.
 *
 * Pipeline:
 *   Camera frames (30fps) → face ROI → average RGB per frame →
 *   POS temporal filtering → bandpass (0.7–4.0 Hz) → FFT → peak BPM →
 *   HRV (RMSSD from IBI) → stress index (0–100)
 *
 * This is a pure-JS implementation for Expo managed workflow.
 * For production, replace with native C++ frame processor via
 * react-native-vision-camera (requires bare workflow / dev client).
 *
 * Reference: Wang, W., den Brinker, A. C., Stuijk, S., & de Haan, G. (2017).
 * "Algorithmic Principles of Remote PPG." IEEE TBME.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RgbSample {
  r: number;  // mean red channel (0–255)
  g: number;  // mean green channel (0–255)
  b: number;  // mean blue channel (0–255)
  t: number;  // timestamp (ms)
}

export interface PosResult {
  heartRateBpm: number;
  stressIndex: number;        // 0–100
  signalQuality: number;      // 0.0–1.0
  hrvRmssd: number;           // ms
  ibiMs: number[];            // inter-beat intervals
  bpmHistory: number[];       // per-window BPM estimates
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TARGET_FPS = 30;
const MIN_SAMPLES = 128;       // ~4 seconds at 30fps
const WINDOW_SIZE = 256;       // FFT window (power of 2)
const BANDPASS_LOW = 0.7;      // Hz → 42 BPM
const BANDPASS_HIGH = 4.0;     // Hz → 240 BPM
const OVERLAP = 0.5;           // 50% window overlap for rolling estimates

// ─── POS Core ───────────────────────────────────────────────────────────────

/**
 * Apply POS algorithm to RGB signal buffer.
 * Returns the pulse signal (BVP) after projection onto the plane orthogonal
 * to the skin tone direction.
 */
export function posProjection(samples: RgbSample[]): number[] {
  const n = samples.length;
  if (n < MIN_SAMPLES) return [];

  // Temporal normalization: divide each channel by its running mean
  const meanR = samples.reduce((s, v) => s + v.r, 0) / n;
  const meanG = samples.reduce((s, v) => s + v.g, 0) / n;
  const meanB = samples.reduce((s, v) => s + v.b, 0) / n;

  if (meanR < 1 || meanG < 1 || meanB < 1) return [];

  const normR = samples.map((s) => s.r / meanR);
  const normG = samples.map((s) => s.g / meanG);
  const normB = samples.map((s) => s.b / meanB);

  // POS projection: S1 = G - B, S2 = G + B - 2R
  // h = S1 + (std(S1) / std(S2)) * S2
  const s1 = normG.map((g, i) => g - normB[i]);
  const s2 = normG.map((g, i) => g + normB[i] - 2 * normR[i]);

  const stdS1 = std(s1);
  const stdS2 = std(s2);
  const alpha = stdS2 > 1e-6 ? stdS1 / stdS2 : 1;

  return s1.map((v, i) => v + alpha * s2[i]);
}

// ─── Bandpass Filter ────────────────────────────────────────────────────────

/**
 * Simple FIR bandpass filter using windowed sinc.
 */
export function bandpassFilter(
  signal: number[],
  sampleRate: number,
  lowHz: number = BANDPASS_LOW,
  highHz: number = BANDPASS_HIGH,
): number[] {
  const n = signal.length;
  if (n < 8) return signal;

  // Apply 2nd-order Butterworth approximation via cascaded biquad
  // For simplicity, use frequency-domain filtering
  const fft = realFFT(signal);
  const freqRes = sampleRate / n;

  for (let i = 0; i < fft.length; i++) {
    const freq = i * freqRes;
    if (freq < lowHz || freq > highHz) {
      fft[i] = 0;
    }
  }

  return inverseRealFFT(fft, n);
}

// ─── FFT Utilities ──────────────────────────────────────────────────────────

/** Radix-2 DIT FFT — returns magnitude spectrum */
export function realFFT(signal: number[]): number[] {
  const n = nextPow2(signal.length);
  const padded = new Array(n).fill(0);
  for (let i = 0; i < signal.length; i++) padded[i] = signal[i];

  // Bit-reversal permutation
  const re = [...padded];
  const im = new Array(n).fill(0);
  bitReversePermute(re, im);

  // Cooley-Tukey butterfly
  for (let size = 2; size <= n; size *= 2) {
    const half = size / 2;
    const angle = (-2 * Math.PI) / size;
    for (let i = 0; i < n; i += size) {
      for (let j = 0; j < half; j++) {
        const wr = Math.cos(angle * j);
        const wi = Math.sin(angle * j);
        const tr = re[i + j + half] * wr - im[i + j + half] * wi;
        const ti = re[i + j + half] * wi + im[i + j + half] * wr;
        re[i + j + half] = re[i + j] - tr;
        im[i + j + half] = im[i + j] - ti;
        re[i + j] += tr;
        im[i + j] += ti;
      }
    }
  }

  // Magnitude spectrum (only positive frequencies)
  const mag = new Array(n / 2).fill(0);
  for (let i = 0; i < n / 2; i++) {
    mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
  }
  return mag;
}

/** Inverse FFT (simplified — reconstruct from magnitude with zero phase) */
function inverseRealFFT(magnitude: number[], originalLength: number): number[] {
  const n = magnitude.length * 2;
  const re = new Array(n).fill(0);
  const im = new Array(n).fill(0);

  // Mirror spectrum
  for (let i = 0; i < magnitude.length; i++) {
    re[i] = magnitude[i];
    if (i > 0 && i < magnitude.length) {
      re[n - i] = magnitude[i];
    }
  }

  bitReversePermute(re, im);

  for (let size = 2; size <= n; size *= 2) {
    const half = size / 2;
    const angle = (2 * Math.PI) / size; // positive for inverse
    for (let i = 0; i < n; i += size) {
      for (let j = 0; j < half; j++) {
        const wr = Math.cos(angle * j);
        const wi = Math.sin(angle * j);
        const tr = re[i + j + half] * wr - im[i + j + half] * wi;
        const ti = re[i + j + half] * wi + im[i + j + half] * wr;
        re[i + j + half] = re[i + j] - tr;
        im[i + j + half] = im[i + j] - ti;
        re[i + j] += tr;
        im[i + j] += ti;
      }
    }
  }

  return re.slice(0, originalLength).map((v) => v / n);
}

function bitReversePermute(re: number[], im: number[]) {
  const n = re.length;
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

// ─── Peak Detection & HR ────────────────────────────────────────────────────

/**
 * Find dominant frequency from magnitude spectrum within BPM range.
 */
export function findPeakFrequency(
  magnitude: number[],
  sampleRate: number,
): { freqHz: number; snr: number } {
  const n = magnitude.length * 2; // original FFT length
  const freqRes = sampleRate / n;

  const lowBin = Math.ceil(BANDPASS_LOW / freqRes);
  const highBin = Math.floor(BANDPASS_HIGH / freqRes);

  let peakMag = 0;
  let peakBin = lowBin;
  let totalMag = 0;

  for (let i = lowBin; i <= highBin && i < magnitude.length; i++) {
    totalMag += magnitude[i];
    if (magnitude[i] > peakMag) {
      peakMag = magnitude[i];
      peakBin = i;
    }
  }

  const avgMag = totalMag / Math.max(1, highBin - lowBin + 1);
  const snr = avgMag > 1e-6 ? peakMag / avgMag : 0;

  return { freqHz: peakBin * freqRes, snr };
}

// ─── HRV & Stress ───────────────────────────────────────────────────────────

/**
 * Extract inter-beat intervals from the filtered BVP signal using zero-crossing detection.
 */
export function extractIBI(bvpSignal: number[], sampleRate: number): number[] {
  const ibis: number[] = [];
  let lastCrossing = -1;

  for (let i = 1; i < bvpSignal.length; i++) {
    // Detect positive zero-crossings
    if (bvpSignal[i - 1] <= 0 && bvpSignal[i] > 0) {
      if (lastCrossing >= 0) {
        const ibiMs = ((i - lastCrossing) / sampleRate) * 1000;
        // Filter physiological range: 300ms (200 BPM) to 1500ms (40 BPM)
        if (ibiMs >= 300 && ibiMs <= 1500) {
          ibis.push(ibiMs);
        }
      }
      lastCrossing = i;
    }
  }

  return ibis;
}

/**
 * Compute RMSSD (Root Mean Square of Successive Differences) from IBIs.
 * Higher RMSSD = higher HRV = lower stress.
 */
export function computeRMSSD(ibis: number[]): number {
  if (ibis.length < 2) return 0;

  let sumSqDiff = 0;
  for (let i = 1; i < ibis.length; i++) {
    const diff = ibis[i] - ibis[i - 1];
    sumSqDiff += diff * diff;
  }

  return Math.sqrt(sumSqDiff / (ibis.length - 1));
}

/**
 * Convert RMSSD to stress index (0–100).
 * Low RMSSD (low HRV) → high stress. High RMSSD (high HRV) → low stress.
 *
 * Based on Baevsky stress index approximation:
 *   stress ≈ 100 - clamp(rmssd, 10, 100) mapped to 0–100
 */
export function rmssdToStressIndex(rmssd: number): number {
  // Typical RMSSD range: 10ms (very stressed) to 100ms+ (very relaxed)
  const clamped = Math.max(10, Math.min(100, rmssd));
  // Linear mapping: 10ms → stress 100, 100ms → stress 0
  return Math.round(100 - ((clamped - 10) / 90) * 100);
}

// ─── Full Pipeline ──────────────────────────────────────────────────────────

/**
 * Run the complete POS rPPG pipeline on a buffer of RGB samples.
 */
export function processRppgSignal(samples: RgbSample[]): PosResult | null {
  if (samples.length < MIN_SAMPLES) return null;

  // Estimate sample rate from timestamps
  const dt = (samples[samples.length - 1].t - samples[0].t) / (samples.length - 1);
  const sampleRate = dt > 0 ? 1000 / dt : TARGET_FPS;

  // 1. POS projection → pulse signal
  const bvp = posProjection(samples);
  if (bvp.length === 0) return null;

  // 2. Bandpass filter
  const filtered = bandpassFilter(bvp, sampleRate);

  // 3. FFT → peak frequency → BPM
  const spectrum = realFFT(filtered);
  const { freqHz, snr } = findPeakFrequency(spectrum, sampleRate);
  const bpm = Math.round(freqHz * 60);

  // 4. Signal quality from SNR (normalize to 0–1)
  const signalQuality = Math.min(1, Math.max(0, (snr - 1) / 4));

  // 5. IBI extraction → HRV → stress index
  const ibis = extractIBI(filtered, sampleRate);
  const rmssd = computeRMSSD(ibis);
  const stressIndex = rmssdToStressIndex(rmssd);

  // 6. Rolling BPM history from overlapping windows
  const bpmHistory: number[] = [];
  const windowSamples = Math.min(WINDOW_SIZE, samples.length);
  const step = Math.floor(windowSamples * (1 - OVERLAP));
  for (let start = 0; start + windowSamples <= samples.length; start += step) {
    const windowSlice = samples.slice(start, start + windowSamples);
    const wBvp = posProjection(windowSlice);
    if (wBvp.length > 0) {
      const wSpec = realFFT(bandpassFilter(wBvp, sampleRate));
      const wPeak = findPeakFrequency(wSpec, sampleRate);
      bpmHistory.push(Math.round(wPeak.freqHz * 60));
    }
  }

  return {
    heartRateBpm: bpm,
    stressIndex,
    signalQuality,
    hrvRmssd: Math.round(rmssd * 10) / 10,
    ibiMs: ibis,
    bpmHistory,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function std(arr: number[]): number {
  const n = arr.length;
  if (n < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const variance = arr.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (n - 1);
  return Math.sqrt(variance);
}
