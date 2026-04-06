/**
 * Shared audio engine for nature sounds and binaural beats.
 * Uses expo-audio (replacement for deprecated expo-av) for playback of
 * open-source ambient sound loops hosted on the Pixabay CDN
 * (CC0 / Pixabay License — free for commercial use).
 */

import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";

// ── Nature sound URLs (Pixabay — royalty-free, no attribution required) ──────
// These are short ambient loops suitable for wellness apps.

export const NATURE_SOUNDS: Record<
  string,
  { label: string; icon: string; url: string; desc: string }
> = {
  rain: {
    label: "Gentle Rain",
    icon: "🌧️",
    url: "https://cdn.pixabay.com/audio/2022/10/30/audio_42a9eac4b6.mp3",
    desc: "Soft rainfall on leaves",
  },
  ocean: {
    label: "Ocean Waves",
    icon: "🌊",
    url: "https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3",
    desc: "Rhythmic waves on shore",
  },
  forest: {
    label: "Forest Birds",
    icon: "🌲",
    url: "https://cdn.pixabay.com/audio/2022/08/31/audio_419263613c.mp3",
    desc: "Birds and rustling trees",
  },
  wind: {
    label: "Mountain Wind",
    icon: "🏔️",
    url: "https://cdn.pixabay.com/audio/2022/10/30/audio_9a0a1db04a.mp3",
    desc: "Calm breeze through valleys",
  },
  night: {
    label: "Night Crickets",
    icon: "🌙",
    url: "https://cdn.pixabay.com/audio/2024/11/04/audio_87e5e02ff6.mp3",
    desc: "Peaceful evening sounds",
  },
  stream: {
    label: "Mountain Stream",
    icon: "💧",
    url: "https://cdn.pixabay.com/audio/2024/06/05/audio_40d0a2de53.mp3",
    desc: "Flowing water over stones",
  },
  thunder: {
    label: "Distant Thunder",
    icon: "⛈️",
    url: "https://cdn.pixabay.com/audio/2022/03/19/audio_80e7bba036.mp3",
    desc: "Thunder with rain ambience",
  },
  fire: {
    label: "Crackling Fire",
    icon: "🔥",
    url: "https://cdn.pixabay.com/audio/2024/06/12/audio_88aa876f8c.mp3",
    desc: "Warm campfire crackling",
  },
};

// ── Binaural beat presets ────────────────────────────────────────────────────
// Each preset defines the base frequency and the offset (beat frequency).
// The listener hears a perceived "beat" at the difference frequency.

export interface BinauralPreset {
  id: string;
  label: string;
  desc: string;
  beatFrequency: number; // Hz — the frequency difference perceived
  baseFrequency: number; // Hz — the carrier tone
  band: string; // Delta, Theta, Alpha, Beta, Gamma
  color: string;
  icon: string;
}

export const BINAURAL_PRESETS: BinauralPreset[] = [
  // Delta (0.5–4 Hz) — deep sleep, healing
  {
    id: "delta_2",
    label: "Deep Sleep",
    desc: "2 Hz delta waves for deep sleep & recovery",
    beatFrequency: 2,
    baseFrequency: 200,
    band: "Delta",
    color: "#5856D6",
    icon: "😴",
  },
  {
    id: "delta_3",
    label: "Healing Rest",
    desc: "3 Hz delta for physical healing & restoration",
    beatFrequency: 3,
    baseFrequency: 200,
    band: "Delta",
    color: "#5856D6",
    icon: "💜",
  },
  // Theta (4–8 Hz) — meditation, creativity
  {
    id: "theta_4",
    label: "Deep Meditation",
    desc: "4 Hz theta for deep meditative states",
    beatFrequency: 4,
    baseFrequency: 200,
    band: "Theta",
    color: "#AF52DE",
    icon: "🧘",
  },
  {
    id: "theta_6",
    label: "Creative Flow",
    desc: "6 Hz theta for creativity & insight",
    beatFrequency: 6,
    baseFrequency: 200,
    band: "Theta",
    color: "#AF52DE",
    icon: "🎨",
  },
  {
    id: "theta_7",
    label: "Lucid Dreaming",
    desc: "7 Hz theta for lucid dream induction",
    beatFrequency: 7,
    baseFrequency: 200,
    band: "Theta",
    color: "#AF52DE",
    icon: "🌙",
  },
  // Alpha (8–14 Hz) — relaxation, calm focus
  {
    id: "alpha_8",
    label: "Light Relaxation",
    desc: "8 Hz alpha for gentle relaxation",
    beatFrequency: 8,
    baseFrequency: 200,
    band: "Alpha",
    color: "#30B0C7",
    icon: "🌊",
  },
  {
    id: "alpha_10",
    label: "Calm Focus",
    desc: "10 Hz alpha for calm, centered awareness",
    beatFrequency: 10,
    baseFrequency: 200,
    band: "Alpha",
    color: "#30B0C7",
    icon: "🎯",
  },
  {
    id: "alpha_12",
    label: "Mindful Presence",
    desc: "12 Hz alpha for mindful awareness",
    beatFrequency: 12,
    baseFrequency: 200,
    band: "Alpha",
    color: "#30B0C7",
    icon: "✨",
  },
  // Beta (14–30 Hz) — alertness, concentration
  {
    id: "beta_15",
    label: "Active Thinking",
    desc: "15 Hz beta for alert, active cognition",
    beatFrequency: 15,
    baseFrequency: 200,
    band: "Beta",
    color: "#FF9500",
    icon: "💡",
  },
  {
    id: "beta_18",
    label: "Deep Focus",
    desc: "18 Hz beta for intense concentration",
    beatFrequency: 18,
    baseFrequency: 200,
    band: "Beta",
    color: "#FF9500",
    icon: "🔥",
  },
  {
    id: "beta_25",
    label: "Peak Performance",
    desc: "25 Hz beta for high-level problem solving",
    beatFrequency: 25,
    baseFrequency: 200,
    band: "Beta",
    color: "#FF9500",
    icon: "⚡",
  },
  // Gamma (30–100 Hz) — higher cognition, transcendence
  {
    id: "gamma_40",
    label: "Insight & Learning",
    desc: "40 Hz gamma for cognitive enhancement",
    beatFrequency: 40,
    baseFrequency: 200,
    band: "Gamma",
    color: "#FF2D55",
    icon: "🧠",
  },
  {
    id: "gamma_50",
    label: "Transcendence",
    desc: "50 Hz gamma for expanded consciousness",
    beatFrequency: 50,
    baseFrequency: 250,
    band: "Gamma",
    color: "#FF2D55",
    icon: "🌟",
  },
];

// ── Audio Engine ─────────────────────────────────────────────────────────────

let _currentPlayer: AudioPlayer | null = null;
let _binauralPlayer: AudioPlayer | null = null;

export async function configureAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: "duckOthers",
  });
}

/**
 * Play a nature sound by key. Loops automatically.
 * Returns the AudioPlayer instance so the caller can monitor it.
 */
export async function playNatureSound(
  soundKey: string,
): Promise<AudioPlayer | null> {
  await stopCurrentSound();
  const soundDef = NATURE_SOUNDS[soundKey];
  if (!soundDef) return null;

  await configureAudioSession();

  const player = createAudioPlayer({ uri: soundDef.url });
  player.loop = true;
  player.volume = 0.8;
  player.play();

  _currentPlayer = player;
  return player;
}

/**
 * Generate a stereo WAV file as a base64 data URI containing a binaural beat.
 * Left channel = baseFrequency, Right channel = baseFrequency + beatFrequency.
 * This creates the binaural illusion when played through headphones.
 */
function generateBinauralWavDataUri(
  baseFreq: number,
  beatFreq: number,
  durationSec: number = 10,
  sampleRate: number = 44100,
): string {
  const numChannels = 2; // stereo
  const bitsPerSample = 16;
  const numSamples = sampleRate * durationSec;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  // Build WAV header + data into a Uint8Array
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, fileSize, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const leftFreq = baseFreq;
  const rightFreq = baseFreq + beatFreq;
  const amplitude = 0.4 * 32767; // ~40% volume to avoid clipping

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const leftSample = Math.round(amplitude * Math.sin(2 * Math.PI * leftFreq * t));
    const rightSample = Math.round(amplitude * Math.sin(2 * Math.PI * rightFreq * t));
    view.setInt16(offset, leftSample, true);
    view.setInt16(offset + 2, rightSample, true);
    offset += 4;
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:audio/wav;base64,${base64}`;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Play binaural beats by generating a stereo WAV in memory.
 * Left ear = base frequency, Right ear = base + beat frequency.
 * Requires stereo headphones for the binaural effect.
 */
export async function playBinauralBeat(
  preset: BinauralPreset,
): Promise<void> {
  await stopCurrentSound();
  await configureAudioSession();

  try {
    // Generate a 10-second stereo WAV that loops seamlessly
    const dataUri = generateBinauralWavDataUri(
      preset.baseFrequency,
      preset.beatFrequency,
      10,
    );

    const player = createAudioPlayer({ uri: dataUri });
    player.loop = true;
    player.volume = 0.5;
    player.play();

    _binauralPlayer = player;
  } catch (err) {
    console.warn("Binaural beat generation failed:", err);
  }
}

export async function stopCurrentSound(): Promise<void> {
  if (_currentPlayer) {
    try {
      _currentPlayer.pause();
      _currentPlayer.remove();
    } catch { /* already removed */ }
    _currentPlayer = null;
  }
  if (_binauralPlayer) {
    try {
      _binauralPlayer.pause();
      _binauralPlayer.remove();
    } catch { /* already removed */ }
    _binauralPlayer = null;
  }
}

export async function setVolume(volume: number): Promise<void> {
  const v = Math.max(0, Math.min(1, volume));
  if (_currentPlayer) _currentPlayer.volume = v;
  if (_binauralPlayer) _binauralPlayer.volume = v;
}
