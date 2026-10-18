import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Download, RotateCcw, Music, Loader2, Check } from 'lucide-react';
import { formatTimecode } from '../utils/audioWav';
import { downloadAudioAsMp3 } from '../utils/videoRenderer';

export interface VoiceoverTake {
  id: string;
  createdAt: string;
  scriptExcerpt: string;
  fullScript: string;
  voiceGender: string;
  voiceName: string;
  accent: string;
  tone: string;
  executedPrompt: string;
  wavUrl: string;
  audioBase64?: string;
  durationSec: number;
  peaks: number[];
}

interface StudioAudioPlayerProps {
  take: VoiceoverTake;
}

export const StudioAudioPlayer: React.FC<StudioAudioPlayerProps> = ({ take }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(take.durationSec || 1);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isExportingMp3, setIsExportingMp3] = useState<boolean>(false);
  const [mp3Ready, setMp3Ready] = useState<boolean>(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(take.durationSec || 1);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [take.id, take.wavUrl, take.durationSec]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.max(0, Math.min(duration, ratio * duration));
    audio.currentTime = target;
    setCurrentTime(target);
  };

  const cycleSpeed = () => {
    const rates = [0.9, 1.0, 1.1, 1.2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const handleDownloadMp3 = async () => {
    if (isExportingMp3) return;
    setIsExportingMp3(true);
    try {
      await downloadAudioAsMp3({
        audioBase64: take.audioBase64,
        scriptText: take.fullScript,
        voiceGender: take.voiceGender,
        durationSec: take.durationSec,
        filename: `locucion-${take.voiceName.toLowerCase()}-${take.id}.mp3`,
      });
      setMp3Ready(true);
      setTimeout(() => setMp3Ready(false), 2200);
    } catch (err) {
      console.error('Error downloading MP3:', err);
    } finally {
      setIsExportingMp3(false);
    }
  };

  const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div className="bg-[#111318] border border-white/10 rounded-lg p-5 flex flex-col gap-4">
      <audio
        ref={audioRef}
        src={take.wavUrl}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (
            audioRef.current &&
            Number.isFinite(audioRef.current.duration) &&
            audioRef.current.duration > 0
          ) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      {/* Top Metadata Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/6 pb-3">
        <div>
          <div className="text-sm font-semibold text-white">
            Máster de Locución · Voz {take.voiceGender} ({take.voiceName})
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>Acento {take.accent}</span>
            <span aria-hidden="true">·</span>
            <span>Tono {take.tone}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">MP3 / WAV 24.0 kHz</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadMp3}
            disabled={isExportingMp3}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isExportingMp3 ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Exportando MP3…
              </>
            ) : mp3Ready ? (
              <>
                <Check className="w-3.5 h-3.5" />
                MP3 Descargado
              </>
            ) : (
              <>
                <Music className="w-3.5 h-3.5" />
                Descargar Audio (.mp3)
              </>
            )}
          </button>

          <a
            href={take.wavUrl}
            download={`locucion-${take.voiceName.toLowerCase()}-${take.id}.wav`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-[#181B22] text-slate-200 border border-white/10 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Descargar (.wav)
          </a>
        </div>
      </div>

      {/* Interactive Waveform Scrubbing Deck */}
      <div
        className="relative h-24 bg-[#0A0B0E] border border-white/8 rounded-md px-3 py-2 flex items-center gap-[3px] cursor-pointer select-none overflow-hidden"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickRatio = (e.clientX - rect.left) / rect.width;
          handleSeek(clickRatio);
        }}
        title="Haz clic en cualquier punto de la onda para saltar en el código de tiempo"
      >
        {take.peaks.map((peak, index) => {
          const barRatio = index / take.peaks.length;
          const isPlayed = barRatio <= progressRatio;
          const heightPct = Math.max(12, Math.round(peak * 88));
          return (
            <div
              key={index}
              className="flex-1 flex items-center justify-center h-full"
            >
              <div
                className={`w-full rounded-xs transition-colors duration-75 ${
                  isPlayed
                    ? 'bg-amber-400'
                    : 'bg-slate-700/70 hover:bg-slate-500'
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Transport & Timecode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSeek(0)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#181B22] text-slate-300 hover:text-white border border-white/8 transition-colors cursor-pointer"
            title="Reiniciar audio"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={cycleSpeed}
            className="px-2.5 py-1.5 rounded-md bg-[#181B22] text-xs font-mono text-slate-300 hover:text-white border border-white/8 transition-colors cursor-pointer tabular-nums"
            title="Cambiar velocidad de reproducción"
          >
            {playbackRate.toFixed(1)}x
          </button>
        </div>

        <div className="font-mono text-xs text-slate-400 tabular-nums">
          <span className="text-slate-100">{formatTimecode(currentTime)}</span>
          <span className="mx-1.5 text-slate-600">/</span>
          <span>{formatTimecode(duration)}</span>
        </div>
      </div>
    </div>
  );
};
