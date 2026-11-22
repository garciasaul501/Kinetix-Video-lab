/**
 * Shared Studio Audio Unlock & WebAudio Fallback Engine
 * Ensures 24kHz Gemini TTS WAV audio plays reliably inside iframes and across
 * async generation boundaries where HTMLAudioElement.play() may lose user activation.
 */

let sharedAudioCtx: AudioContext | null = null;

export function getOrCreateStudioAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

/**
 * Call synchronously inside any user click handler (Play, Reproducir video, etc.)
 * to permanently unlock Web Audio output for the tab/iframe.
 */
export function unlockStudioAudioContext(): void {
  try {
    const ctx = getOrCreateStudioAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Play a 1-sample silent buffer to satisfy strict Safari/Chrome iframe gesture gates
    const silentBuffer = ctx.createBuffer(1, 1, 24000);
    const src = ctx.createBufferSource();
    src.buffer = silentBuffer;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    // Ignore audio context unlock errors on unsupported browsers
  }
}

export interface WebAudioPlaybackHandle {
  stop: () => void;
  setVolume: (vol: number) => void;
  getCurrentTime: () => number;
  durationSec: number;
}

/**
 * Decodes a WAV or raw 24kHz 16-bit mono PCM base64 string into an AudioBuffer
 * and plays it directly through the unlocked AudioContext.
 */
export async function playBase64AudioViaWebAudio(
  base64Data: string,
  options: {
    startOffsetSec?: number;
    volume?: number;
    muted?: boolean;
    sampleRate?: number;
    onEnded?: () => void;
  } = {}
): Promise<WebAudioPlaybackHandle> {
  const ctx = getOrCreateStudioAudioContext();
  if (!ctx) {
    throw new Error('AudioContext no disponible en este navegador.');
  }
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const cleanB64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const binaryStr = atob(cleanB64);
  const byteLen = binaryStr.length;
  const bytes = new Uint8Array(byteLen);
  for (let i = 0; i < byteLen; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const isWav =
    byteLen > 44 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46;

  let audioBuffer: AudioBuffer;
  if (isWav) {
    // Clone ArrayBuffer because decodeAudioData detaches it
    const copyBuf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    audioBuffer = await ctx.decodeAudioData(copyBuf);
  } else {
    const sampleRate = options.sampleRate || 24000;
    const numSamples = Math.floor(byteLen / 2);
    audioBuffer = ctx.createBuffer(1, Math.max(1, numSamples), sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let i = 0; i < numSamples; i++) {
      channelData[i] = view.getInt16(i * 2, true) / 32768;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;

  const gainNode = ctx.createGain();
  const initialVol = options.muted ? 0 : Math.max(0, Math.min(1, options.volume ?? 1));
  gainNode.gain.setValueAtTime(initialVol, ctx.currentTime);

  source.connect(gainNode);
  gainNode.connect(ctx.destination);

  const offset = Math.max(0, Math.min(audioBuffer.duration - 0.05, options.startOffsetSec || 0));
  const startedAtCtxTime = ctx.currentTime;
  let stoppedManually = false;

  source.onended = () => {
    if (!stoppedManually) {
      options.onEnded?.();
    }
  };

  source.start(0, offset);

  return {
    durationSec: audioBuffer.duration,
    stop: () => {
      stoppedManually = true;
      try {
        source.stop();
        source.disconnect();
        gainNode.disconnect();
      } catch {
        // Ignore already stopped
      }
    },
    setVolume: (vol: number) => {
      try {
        gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), ctx.currentTime);
      } catch {
        // Ignore gain errors
      }
    },
    getCurrentTime: () => {
      const elapsed = ctx.currentTime - startedAtCtxTime;
      return Math.min(audioBuffer.duration, offset + Math.max(0, elapsed));
    },
  };
}
