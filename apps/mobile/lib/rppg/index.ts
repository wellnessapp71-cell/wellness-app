/**
 * rPPG module — barrel export.
 *
 * Provides both real (camera-based) and simulated frame sampling,
 * plus the POS algorithm pipeline for HR + stress estimation.
 */

export { processRppgSignal, posProjection, findPeakFrequency, rmssdToStressIndex } from "./pos-algorithm";
export type { RgbSample, PosResult } from "./pos-algorithm";
export { FrameSampler, SimulatedFrameSampler } from "./frame-sampler";
