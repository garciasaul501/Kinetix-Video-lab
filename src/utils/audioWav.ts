/**
 * Converts base64-encoded PCM (16-bit signed little-endian mono, 24000Hz)
 * returned by Gemini TTS models into a standard playable WAV Blob URL,
 * plus normalized waveform peaks for studio visualization.
 */
export interface ProcessedAudioResult {
  wavUrl: string;
  wavBlob: Blob;
  durationSec: number;
  peaks: number[];
}

export function pcmBase64ToWav(
  base64Data: string,
  sampleRate = 24000,
  numBars = 72
): ProcessedAudioResult {
  const binaryString = atob(base64Data);
  const rawLength = binaryString.length;
  const pcmBytes = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i);
  }

  // Check if already a RIFF WAV file
  const isAlreadyWav =
    rawLength > 44 &&
    pcmBytes[0] === 0x52 && // 'R'
    pcmBytes[1] === 0x49 && // 'I'
    pcmBytes[2] === 0x46 && // 'F'
    pcmBytes[3] === 0x46;   // 'F'

  const audioDataBytes = isAlreadyWav ? pcmBytes.subarray(44) : pcmBytes;
  const numSamples = Math.floor(audioDataBytes.byteLength / 2);
  const durationSec = Math.max(0.5, numSamples / sampleRate);

  // Extract 16-bit signed samples to compute visual waveform peaks
  const dataView = new DataView(
    audioDataBytes.buffer,
    audioDataBytes.byteOffset,
    audioDataBytes.byteLength
  );

  const peaks: number[] = [];
  const samplesPerBar = Math.max(1, Math.floor(numSamples / numBars));

  for (let b = 0; b < numBars; b++) {
    const startSample = b * samplesPerBar;
    const endSample = Math.min(numSamples, startSample + samplesPerBar);
    let maxAmp = 0;
    const step = Math.max(1, Math.floor((endSample - startSample) / 32));
    for (let s = startSample; s < endSample; s += step) {
      const sampleIndex = s * 2;
      if (sampleIndex + 1 < audioDataBytes.byteLength) {
        const val = Math.abs(dataView.getInt16(sampleIndex, true)) / 32768;
        if (val > maxAmp) maxAmp = val;
      }
    }
    peaks.push(Math.min(1, Math.max(0.08, maxAmp * 1.35)));
  }

  if (isAlreadyWav) {
    const wavBlob = new Blob([pcmBytes], { type: 'audio/wav' });
    return {
      wavUrl: URL.createObjectURL(wavBlob),
      wavBlob,
      durationSec,
      peaks,
    };
  }

  // Build standard 44-byte RIFF WAVE header for 16-bit mono PCM
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const wavBuffer = new ArrayBuffer(44 + audioDataBytes.byteLength);
  const view = new DataView(wavBuffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + audioDataBytes.byteLength, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, audioDataBytes.byteLength, true);

  const wavUint8 = new Uint8Array(wavBuffer);
  wavUint8.set(audioDataBytes, 44);

  const wavBlob = new Blob([wavUint8], { type: 'audio/wav' });
  const wavUrl = URL.createObjectURL(wavBlob);

  return {
    wavUrl,
    wavBlob,
    durationSec,
    peaks,
  };
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

export function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}
