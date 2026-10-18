import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Film,
  Music,
  Loader2,
  Check,
} from 'lucide-react';
import {
  drawCoverImage,
  renderSequenceToVideoUrl,
  downloadAudioAsMp3,
} from '../utils/videoRenderer';

export interface SequenceShot {
  shotNumber: number;
  durationSec: number;
  shotType: string;
  cameraMotion: string;
  visualMotif: string;
  headlineText: string;
  actionDescription: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  focalLens: string;
  imageUrl?: string;
}

export interface SequencePlan {
  title: string;
  emotionSummary: string;
  visualStyleApplied: string;
  veoEnhancedPrompt: string;
  suggestedVoiceover: string;
  ambientEffect: string;
  bpmTempo: number;
  shots: SequenceShot[];
}

interface CinemaSequenceCanvasProps {
  sequence: SequencePlan;
  audioUrl?: string | null;
  audioBase64?: string | null;
  aspectRatio?: '16:9' | '9:16';
  activeShotIndex?: number;
  onActiveShotChange?: (index: number) => void;
  onMp4Created?: (mp4Url: string) => void;
}

function hexToRgb(hex: string, fallback = [245, 158, 11]): [number, number, number] {
  const clean = (hex || '').replace('#', '').trim();
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return [r, g, b];
    }
  }
  return fallback as [number, number, number];
}

export const CinemaSequenceCanvas: React.FC<CinemaSequenceCanvasProps> = ({
  sequence,
  audioUrl,
  audioBase64,
  aspectRatio = '16:9',
  onActiveShotChange,
  onMp4Created,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedImagesRef = useRef<Record<string, HTMLImageElement>>({});

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isExportingMp4, setIsExportingMp4] = useState<boolean>(false);
  const [exportProgressText, setExportProgressText] = useState<string | null>(null);
  const [recordedMp4Url, setRecordedMp4Url] = useState<string | null>(null);
  const [isExportingMp3, setIsExportingMp3] = useState<boolean>(false);
  const [mp3Downloaded, setMp3Downloaded] = useState<boolean>(false);

  const shots = sequence.shots && sequence.shots.length > 0 ? sequence.shots : [];
  const totalDuration =
    shots.reduce((acc, s) => acc + (Number(s.durationSec) || 3.5), 0) || 14;

  const startTimeRef = useRef<number>(performance.now());
  const pausedAtRef = useRef<number>(0);
  const lastReportedShotRef = useRef<number>(-1);

  // Preload shot images whenever shot.imageUrl changes
  useEffect(() => {
    shots.forEach((shot) => {
      const url = shot.imageUrl;
      if (url && !loadedImagesRef.current[url]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          loadedImagesRef.current[url] = img;
        };
        img.src = url;
      }
    });
  }, [shots]);

  const resetPlayback = useCallback(() => {
    pausedAtRef.current = 0;
    startTimeRef.current = performance.now();
    setCurrentTime(0);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    resetPlayback();
    setRecordedMp4Url(null);
  }, [sequence.title, resetPlayback]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
  }, [isMuted]);

  const togglePlay = () => {
    if (isPlaying) {
      pausedAtRef.current = currentTime;
      setIsPlaying(false);
      audioRef.current?.pause();
    } else {
      startTimeRef.current = performance.now() - pausedAtRef.current * 1000;
      setIsPlaying(true);
      audioRef.current?.play().catch(() => {});
    }
  };

  const handleCreateAndDownloadMp4 = async () => {
    if (isExportingMp4) return;
    setIsExportingMp4(true);
    setExportProgressText('Renderizando planos e imágenes a MP4…');

    try {
      const mp4Url = await renderSequenceToVideoUrl(
        sequence,
        aspectRatio,
        '720p',
        (msg) => setExportProgressText(msg),
        audioBase64
      );
      setRecordedMp4Url(mp4Url);
      onMp4Created?.(mp4Url);

      const slug = (sequence.title || 'video-secuencia')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const link = document.createElement('a');
      link.href = mp4Url;
      link.download = `${slug || 'kinetix-video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting MP4:', err);
    } finally {
      setIsExportingMp4(false);
      setExportProgressText(null);
    }
  };

  const handleDownloadMp3 = async () => {
    if (isExportingMp3) return;
    setIsExportingMp3(true);
    try {
      const slug = (sequence.title || 'audio-secuencia')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      await downloadAudioAsMp3({
        audioBase64,
        scriptText: sequence.suggestedVoiceover || sequence.emotionSummary,
        durationSec: totalDuration,
        filename: `${slug || 'kinetix-audio'}.mp3`,
      });
      setMp3Downloaded(true);
      setTimeout(() => setMp3Downloaded(false), 2200);
    } catch (err) {
      console.error('Error exporting MP3:', err);
    } finally {
      setIsExportingMp3(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderFrame = (now: number) => {
      let elapsed = isPlaying
        ? (now - startTimeRef.current) / 1000
        : pausedAtRef.current;

      if (elapsed >= totalDuration) {
        elapsed = elapsed % totalDuration;
        startTimeRef.current = now - elapsed * 1000;
      }

      setCurrentTime(elapsed);

      let accumulated = 0;
      let currentShotIndex = 0;
      let shotProgress = 0;

      for (let i = 0; i < shots.length; i++) {
        const dur = Number(shots[i].durationSec) || 3.5;
        if (elapsed < accumulated + dur || i === shots.length - 1) {
          currentShotIndex = i;
          shotProgress = Math.min(1, Math.max(0, (elapsed - accumulated) / dur));
          break;
        }
        accumulated += dur;
      }

      if (lastReportedShotRef.current !== currentShotIndex) {
        lastReportedShotRef.current = currentShotIndex;
        onActiveShotChange?.(currentShotIndex);
      }

      const shot = shots[currentShotIndex] || {
        shotNumber: 1,
        durationSec: 4,
        shotType: 'Plano General',
        cameraMotion: 'dolly-in',
        visualMotif: 'horizon',
        headlineText: sequence.title || 'Secuencia IA',
        actionDescription: sequence.emotionSummary || '',
        primaryHex: '#0A0E1A',
        secondaryHex: '#18243E',
        accentHex: '#F59E0B',
        focalLens: '35mm Anamorphic',
      };

      const w = canvas.width;
      const h = canvas.height;
      const [r1, g1, b1] = hexToRgb(shot.primaryHex, [10, 14, 26]);
      const [r2, g2, b2] = hexToRgb(shot.secondaryHex, [24, 36, 62]);
      const [ra, ga, ba] = hexToRgb(shot.accentHex, [245, 158, 11]);

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Camera motion transform
      let scale = 1;
      let offsetX = 0;
      let offsetY = 0;
      const motion = (shot.cameraMotion || '').toLowerCase();
      if (motion.includes('dolly') || motion.includes('zoom-in')) {
        scale = 1 + shotProgress * 0.18;
      } else if (motion.includes('zoom-out')) {
        scale = 1.18 - shotProgress * 0.16;
      } else if (motion.includes('pan-right')) {
        scale = 1.12;
        offsetX = (0.5 - shotProgress) * w * 0.08;
      } else if (motion.includes('pan-left')) {
        scale = 1.12;
        offsetX = (shotProgress - 0.5) * w * 0.08;
      } else if (motion.includes('crane')) {
        scale = 1.1;
        offsetY = (0.5 - shotProgress) * h * 0.08;
      } else {
        scale = 1.05 + Math.sin(shotProgress * Math.PI) * 0.06;
        offsetX = Math.cos(shotProgress * Math.PI) * 18;
      }

      ctx.translate(w / 2 + offsetX, h / 2 + offsetY);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2, -h / 2);

      const loadedShotImg =
        shot.imageUrl && loadedImagesRef.current[shot.imageUrl]
          ? loadedImagesRef.current[shot.imageUrl]
          : null;

      const glowX = w * (0.5 + Math.sin(elapsed * 0.7 + currentShotIndex) * 0.12);
      const glowY = h * (0.45 + Math.cos(elapsed * 0.5) * 0.08);

      if (loadedShotImg) {
        // Render AI-generated or uploaded image for this shot with Ken Burns motion
        drawCoverImage(ctx, loadedShotImg, 0, 0, w, h);

        // Cinema color LUT glaze
        const lutGrad = ctx.createLinearGradient(0, 0, 0, h);
        lutGrad.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, 0.25)`);
        lutGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.08)');
        lutGrad.addColorStop(1, `rgba(${r1}, ${g1}, ${b1}, 0.68)`);
        ctx.fillStyle = lutGrad;
        ctx.fillRect(0, 0, w, h);
      } else {
        // Procedural atmospheric cinematography
        const bgGrad = ctx.createLinearGradient(0, 0, w * 0.3, h);
        bgGrad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
        bgGrad.addColorStop(0.6, `rgb(${r2}, ${g2}, ${b2})`);
        bgGrad.addColorStop(
          1,
          `rgb(${Math.floor(r1 * 0.6)}, ${Math.floor(g1 * 0.6)}, ${Math.floor(b1 * 0.7)})`
        );
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-w * 0.2, -h * 0.2, w * 1.4, h * 1.4);

        const radGrad = ctx.createRadialGradient(
          glowX,
          glowY,
          10,
          glowX,
          glowY,
          Math.max(w, h) * 0.55
        );
        radGrad.addColorStop(0, `rgba(${ra}, ${ga}, ${ba}, 0.42)`);
        radGrad.addColorStop(0.45, `rgba(${r2}, ${g2}, ${b2}, 0.22)`);
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, w, h);

        const motif = (shot.visualMotif || '').toLowerCase();
        if (motif.includes('city') || motif.includes('monolith')) {
          const count = 16;
          for (let i = 0; i < count; i++) {
            const bx = (w / count) * i + ((i * 19) % 14);
            const bw = (w / count) * 0.68;
            const bh = h * (0.22 + ((i * 37) % 45) / 100);
            ctx.fillStyle = `rgba(${Math.floor(r1 * 0.45)}, ${Math.floor(g1 * 0.45)}, ${Math.floor(b1 * 0.55)}, 0.88)`;
            ctx.fillRect(bx, h - bh, bw, bh);
            ctx.fillStyle = `rgba(${ra}, ${ga}, ${ba}, ${0.25 + 0.2 * Math.sin(elapsed * 2 + i)})`;
            ctx.fillRect(bx, h - bh, 2, bh);
          }
        } else if (motif.includes('portal') || motif.includes('prism') || motif.includes('pulse')) {
          for (let r = 1; r <= 5; r++) {
            const radius = Math.min(w, h) * 0.07 * r + ((shotProgress * 28) % 28);
            ctx.beginPath();
            ctx.arc(glowX, glowY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${ra}, ${ga}, ${ba}, ${0.55 - r * 0.09})`;
            ctx.lineWidth = r === 2 ? 2.5 : 1.2;
            ctx.stroke();
          }
        } else if (motif.includes('wave')) {
          for (let l = 0; l < 6; l++) {
            ctx.beginPath();
            for (let x = 0; x <= w; x += 16) {
              const y =
                h * 0.55 +
                Math.sin(x * 0.008 + elapsed * 1.8 + l * 0.6) * (28 + l * 10) +
                l * 14;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(${ra}, ${ga}, ${ba}, ${0.48 - l * 0.06})`;
            ctx.lineWidth = 1.8;
            ctx.stroke();
          }
        } else {
          const horizonY = h * 0.62;
          ctx.beginPath();
          ctx.arc(glowX, horizonY - 18, Math.min(w, h) * 0.16, 0, Math.PI * 2);
          const sunGrad = ctx.createLinearGradient(0, horizonY - 120, 0, horizonY + 40);
          sunGrad.addColorStop(0, `rgba(${ra}, ${ga}, ${ba}, 0.85)`);
          sunGrad.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, 0.05)`);
          ctx.fillStyle = sunGrad;
          ctx.fill();

          ctx.strokeStyle = `rgba(${ra}, ${ga}, ${ba}, 0.65)`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, horizonY);
          ctx.lineTo(w, horizonY);
          ctx.stroke();
        }
      }

      // Ambient particles / rain
      const effect = (sequence.ambientEffect || 'particles').toLowerCase();
      if (effect.includes('rain')) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 42; i++) {
          const rx = (i * 97 + elapsed * 140) % w;
          const ry = (i * 61 + elapsed * 520) % h;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 6, ry + 24);
          ctx.stroke();
        }
      } else {
        for (let i = 0; i < 28; i++) {
          const px = (i * 83 + elapsed * (14 + (i % 5) * 6)) % w;
          const py = h - ((i * 53 + elapsed * (18 + (i % 4) * 5)) % h);
          const pr = (i % 4 === 0 ? 4 : 2) + Math.sin(elapsed * 2 + i) * 0.8;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.8, pr), 0, Math.PI * 2);
          ctx.fillStyle =
            i % 3 === 0
              ? `rgba(${ra}, ${ga}, ${ba}, ${0.28 + (i % 5) * 0.06})`
              : `rgba(255, 255, 255, ${0.15 + (i % 4) * 0.05})`;
          ctx.fill();
        }
      }

      ctx.restore();

      // Cinema letterbox bars
      const barHeight =
        aspectRatio === '16:9' ? Math.round(h * 0.085) : Math.round(h * 0.04);
      ctx.fillStyle = '#050608';
      ctx.fillRect(0, 0, w, barHeight);
      ctx.fillRect(0, h - barHeight, w, barHeight);

      // Shot cross-dissolve transition
      if (shotProgress < 0.08) {
        ctx.fillStyle = `rgba(5, 6, 8, ${(1 - shotProgress / 0.08) * 0.55})`;
        ctx.fillRect(0, 0, w, h);
      } else if (shotProgress > 0.92) {
        ctx.fillStyle = `rgba(5, 6, 8, ${((shotProgress - 0.92) / 0.08) * 0.55})`;
        ctx.fillRect(0, 0, w, h);
      }

      if (shot.headlineText) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = `700 ${aspectRatio === '16:9' ? '26px' : '22px'} "Syne", sans-serif`;
        ctx.fillStyle = 'rgba(243, 244, 246, 0.96)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 16;
        ctx.fillText(shot.headlineText, w / 2, h - barHeight - 46);

        if (shot.actionDescription) {
          ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = 'rgba(229, 231, 235, 0.88)';
          const trimmedDesc =
            shot.actionDescription.length > 84
              ? shot.actionDescription.slice(0, 82) + '…'
              : shot.actionDescription;
          ctx.fillText(trimmedDesc, w / 2, h - barHeight - 22);
        }
        ctx.restore();
      }

      // Top Cinema HUD
      ctx.save();
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(243, 244, 246, 0.75)';
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(Math.floor(elapsed % 60)).padStart(2, '0');
      const frames = String(Math.floor((elapsed % 1) * 24)).padStart(2, '0');
      ctx.fillText(`TC 00:${mins}:${secs}:${frames}`, 20, Math.max(18, barHeight * 0.65));

      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.fillText(
        `PLANO 0${shot.shotNumber} · ${loadedShotImg ? 'IMAGEN ACTIVA · ' : ''}${shot.focalLens}`,
        w - 20,
        Math.max(18, barHeight * 0.65)
      );
      ctx.restore();

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, sequence, shots, totalDuration, aspectRatio, onActiveShotChange]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative bg-[#050608] border border-white/10 rounded-lg overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={aspectRatio === '16:9' ? 960 : 540}
          height={aspectRatio === '16:9' ? 540 : 960}
          className={
            aspectRatio === '16:9'
              ? 'w-full aspect-video object-contain'
              : 'h-[460px] aspect-[9/16] object-contain mx-auto'
          }
        />

        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} autoPlay loop className="hidden" />
        )}
      </div>

      {/* Transport Deck & Direct MP4 / MP3 Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#111318] border border-white/8 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
            title={isPlaying ? 'Pausar secuencia' : 'Reproducir secuencia'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button
            type="button"
            onClick={resetPlayback}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#181B22] text-slate-300 hover:text-white border border-white/8 transition-colors cursor-pointer"
            title="Reiniciar al cuadro 00:00"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {audioUrl && (
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#181B22] text-slate-300 hover:text-white border border-white/8 transition-colors cursor-pointer"
              title={isMuted ? 'Activar audio' : 'Silenciar audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          <div className="pl-2 font-mono text-xs text-slate-400 tabular-nums">
            {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s · 24 fps
          </div>
        </div>

        {/* MP4 & MP3 Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadMp3}
            disabled={isExportingMp3}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-[#181B22] text-slate-200 border border-white/10 hover:border-amber-500/40 hover:text-amber-300 disabled:opacity-50 transition-colors cursor-pointer"
            title="Crear y descargar pista de audio de la secuencia en formato MP3 (.mp3)"
          >
            {isExportingMp3 ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                Codificando MP3…
              </>
            ) : mp3Downloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                MP3 Descargado
              </>
            ) : (
              <>
                <Music className="w-3.5 h-3.5 text-amber-400" />
                Descargar Audio (.mp3)
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCreateAndDownloadMp4}
            disabled={isExportingMp4}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-colors cursor-pointer"
            title="Crear y descargar video en formato MP4 (.mp4) con las imágenes y el audio"
          >
            {isExportingMp4 ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {exportProgressText || 'Creando MP4…'}
              </>
            ) : (
              <>
                <Film className="w-3.5 h-3.5" />
                Crear y Descargar Video (.mp4)
              </>
            )}
          </button>

          {recordedMp4Url && !isExportingMp4 && (
            <a
              href={recordedMp4Url}
              download={`${(sequence.title || 'video-ia').toLowerCase().replace(/\s+/g, '-')}.mp4`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Guardar .mp4
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
