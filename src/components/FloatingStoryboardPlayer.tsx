import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  Film,
  Mic,
  Sparkles,
  Loader2,
  SkipBack,
  SkipForward,
  Eye,
} from 'lucide-react';
import { StoryboardSceneRow } from '../utils/scriptExporter';
import { VoiceoverTake } from './StudioAudioPlayer';

interface FloatingStoryboardPlayerProps {
  projectTitle: string;
  targetFormat: string;
  storyboard: StoryboardSceneRow[];
  voiceTakes: VoiceoverTake[];
  activeTakeId: string | null;
  onSelectTake: (takeId: string) => void;
  activeSceneIndex: number;
  onActiveSceneChange: (index: number) => void;
  onSynthesizeFullVoiceover: () => void;
  isSynthesizingVoiceover: boolean;
}

const SCENE_PALETTES = [
  { primary: '#090D16', secondary: '#162035', accent: '#F59E0B' },
  { primary: '#0B1320', secondary: '#1D2D44', accent: '#38BDF8' },
  { primary: '#120E1A', secondary: '#251D3A', accent: '#F59E0B' },
  { primary: '#0A141D', secondary: '#162E3E', accent: '#10B981' },
  { primary: '#17111A', secondary: '#2E1F36', accent: '#FBBF24' },
  { primary: '#0A0F1D', secondary: '#1E293B', accent: '#F59E0B' },
];

export const FloatingStoryboardPlayer: React.FC<FloatingStoryboardPlayerProps> = ({
  projectTitle,
  targetFormat,
  storyboard,
  voiceTakes,
  activeTakeId,
  onSelectTake,
  activeSceneIndex,
  onActiveSceneChange,
  onSynthesizeFullVoiceover,
  isSynthesizingVoiceover,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const loadedImagesRef = useRef<Record<string, HTMLImageElement>>({});

  const selectedTake = useMemo(
    () => voiceTakes.find((t) => t.id === activeTakeId) || voiceTakes[0] || null,
    [voiceTakes, activeTakeId]
  );

  const isVerticalFormat =
    targetFormat.includes('9:16') || /reel|tiktok|short/i.test(targetFormat);

  // Compute cumulative timeline intervals for each storyboard scene
  const timelineMeta = useMemo(() => {
    const safeScenes = storyboard.length > 0 ? storyboard : [];
    const rawTotal = safeScenes.reduce(
      (acc, s) => acc + Math.max(2, Number(s.durationSec) || 5),
      0
    );
    // If an audio take is selected, scale scene durations proportionally to match audio length
    const effectiveTotal =
      selectedTake && selectedTake.durationSec > 1.5
        ? selectedTake.durationSec
        : Math.max(6, rawTotal);

    const scale = rawTotal > 0 ? effectiveTotal / rawTotal : 1;
    let cursor = 0;

    const intervals = safeScenes.map((scene, idx) => {
      const baseDur = Math.max(2, Number(scene.durationSec) || 5);
      const scaledDur =
        idx === safeScenes.length - 1
          ? Math.max(0.5, effectiveTotal - cursor)
          : baseDur * scale;
      const start = cursor;
      const end = cursor + scaledDur;
      cursor = end;
      return {
        index: idx,
        scene,
        start,
        end,
        duration: Math.max(0.5, end - start),
      };
    });

    return {
      totalDuration: effectiveTotal,
      intervals,
    };
  }, [storyboard, selectedTake]);

  // Preload any generated or uploaded scene keyframe images
  useEffect(() => {
    storyboard.forEach((row) => {
      if (row.imageUrl && !loadedImagesRef.current[row.imageUrl]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = row.imageUrl;
        img.onload = () => {
          loadedImagesRef.current[row.imageUrl!] = img;
        };
      }
    });
  }, [storyboard]);

  // Keep activeSceneIndex synchronized with currentTime
  useEffect(() => {
    const found = timelineMeta.intervals.find(
      (item) => currentTime >= item.start && currentTime < item.end
    );
    const targetIdx = found
      ? found.index
      : currentTime >= timelineMeta.totalDuration
        ? Math.max(0, timelineMeta.intervals.length - 1)
        : 0;

    if (targetIdx !== activeSceneIndex) {
      onActiveSceneChange(targetIdx);
    }
  }, [currentTime, timelineMeta, activeSceneIndex, onActiveSceneChange]);

  // Sync audio element source when selectedTake changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (selectedTake?.wavUrl) {
      audio.src = selectedTake.wavUrl;
      audio.load();
    } else {
      audio.removeAttribute('src');
    }
    setIsPlaying(false);
    setCurrentTime(0);
  }, [selectedTake?.id, selectedTake?.wavUrl]);

  // Playback loop (locks to <audio> currentTime when a voiceover take is active, or internal studio clock otherwise)
  useEffect(() => {
    if (!isPlaying) {
      lastFrameTimeRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = (now: number) => {
      const audio = audioRef.current;
      if (selectedTake && audio && !audio.paused) {
        setCurrentTime(audio.currentTime);
        if (audio.ended || audio.currentTime >= timelineMeta.totalDuration) {
          setIsPlaying(false);
          setCurrentTime(0);
          audio.currentTime = 0;
          return;
        }
      } else {
        if (lastFrameTimeRef.current === null) {
          lastFrameTimeRef.current = now;
        }
        const delta = (now - lastFrameTimeRef.current) / 1000;
        lastFrameTimeRef.current = now;

        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= timelineMeta.totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, selectedTake, timelineMeta.totalDuration]);

  // Render real-time storyboard frame on HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isMinimized || !isOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const activeInterval =
      timelineMeta.intervals[activeSceneIndex] || timelineMeta.intervals[0];
    if (!activeInterval) return;

    const { scene, start, duration } = activeInterval;
    const localProgress = Math.max(
      0,
      Math.min(1, (currentTime - start) / Math.max(0.1, duration))
    );
    const palette = SCENE_PALETTES[activeSceneIndex % SCENE_PALETTES.length];

    ctx.clearRect(0, 0, w, h);

    // 1. Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, palette.primary);
    bgGrad.addColorStop(0.55, palette.secondary);
    bgGrad.addColorStop(1, '#05070B');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. If scene has an AI Keyframe Image, draw with smooth camera motion (Ken Burns)
    const cachedImg = scene.imageUrl ? loadedImagesRef.current[scene.imageUrl] : null;
    if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
      ctx.save();
      const zoom = 1.02 + localProgress * 0.1;
      const panX = (localProgress - 0.5) * w * 0.04;
      ctx.translate(w * 0.5 + panX, h * 0.5);
      ctx.scale(zoom, zoom);

      const imgRatio = cachedImg.naturalWidth / cachedImg.naturalHeight;
      const canvasRatio = w / h;
      let drawW = w;
      let drawH = h;
      if (imgRatio > canvasRatio) {
        drawH = h;
        drawW = h * imgRatio;
      } else {
        drawW = w;
        drawH = w / imgRatio;
      }
      ctx.drawImage(cachedImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Cinematic dark vignette overlay for text legibility
      const vignette = ctx.createLinearGradient(0, 0, 0, h);
      vignette.addColorStop(0, 'rgba(5, 7, 11, 0.65)');
      vignette.addColorStop(0.45, 'rgba(5, 7, 11, 0.25)');
      vignette.addColorStop(1, 'rgba(5, 7, 11, 0.88)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    } else {
      // Procedural volumetric studio visualization
      const glow = ctx.createRadialGradient(
        w * (0.45 + 0.1 * Math.sin(localProgress * Math.PI)),
        h * 0.42,
        10,
        w * 0.5,
        h * 0.45,
        Math.max(w, h) * 0.58
      );
      glow.addColorStop(0, `${palette.accent}55`);
      glow.addColorStop(0.5, `${palette.secondary}33`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Animated lens rings & perspective horizon
      ctx.save();
      ctx.strokeStyle = `${palette.accent}44`;
      ctx.lineWidth = 1.5;
      const radius1 = Math.min(w, h) * (0.16 + localProgress * 0.04);
      const radius2 = Math.min(w, h) * (0.26 - localProgress * 0.03);
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.42, radius1, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.42, radius2, 0, Math.PI * 2);
      ctx.stroke();

      // Horizon line
      ctx.strokeStyle = `${palette.accent}66`;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.56);
      ctx.lineTo(w * 0.92, h * 0.56);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Scene transition flash on cut (first 150ms of scene)
    if (localProgress < 0.08) {
      const flashAlpha = (1 - localProgress / 0.08) * 0.22;
      ctx.fillStyle = `rgba(245, 158, 11, ${flashAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }

    // 4. Top HUD: Scene Badge + Timestamp + Audio Sync indicator
    ctx.save();
    ctx.fillStyle = 'rgba(10, 11, 14, 0.78)';
    ctx.fillRect(14, 12, 195, 24);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.strokeRect(14, 12, 195, 24);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText(
      `ESCENA #${String(scene.sceneNumber).padStart(2, '0')} · ${scene.timestamp}`,
      22,
      28
    );
    ctx.restore();

    // 5. Center On-Screen Text (Overlay)
    if (scene.onScreenText) {
      ctx.save();
      const overlayText = scene.onScreenText.toUpperCase();
      ctx.font = 'bold 17px "Syne", sans-serif';
      const metrics = ctx.measureText(overlayText);
      const boxW = Math.min(w - 36, metrics.width + 28);
      const boxH = 32;
      const boxX = (w - boxW) / 2;
      const boxY = h * 0.43 - boxH / 2;

      ctx.fillStyle = 'rgba(10, 11, 14, 0.82)';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = '#F9FAFB';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(overlayText, w / 2, boxY + boxH / 2 + 1, w - 48);
      ctx.restore();
    }

    // 6. Visual Staging Caption (subtle director note)
    ctx.save();
    ctx.fillStyle = 'rgba(209, 213, 219, 0.78)';
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const stagingSnippet =
      scene.visualStaging.length > 72
        ? scene.visualStaging.slice(0, 72) + '…'
        : scene.visualStaging;
    ctx.fillText(stagingSnippet, w / 2, h * 0.59, w - 36);
    ctx.restore();

    // 7. Bottom Synchronized Voiceover Subtitle Box
    const subtitle = (scene.narrationOnly || scene.audioVoiceover || '').trim();
    if (subtitle) {
      ctx.save();
      const padX = 16;
      const subBoxY = h - 68;
      const subBoxH = 54;
      ctx.fillStyle = 'rgba(8, 10, 14, 0.88)';
      ctx.fillRect(padX, subBoxY, w - padX * 2, subBoxH);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(padX, subBoxY, w - padX * 2, subBoxH);

      // Wrap subtitle into 2 lines
      ctx.fillStyle = '#FEF3C7';
      ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      const words = subtitle.split(/\s+/);
      let line1 = '';
      let line2 = '';
      for (const word of words) {
        if ((line1 + ' ' + word).trim().length <= 58) {
          line1 = (line1 + ' ' + word).trim();
        } else if ((line2 + ' ' + word).trim().length <= 58) {
          line2 = (line2 + ' ' + word).trim();
        } else {
          line2 += '…';
          break;
        }
      }

      if (line2) {
        ctx.fillText(`“${line1}`, w / 2, subBoxY + 21, w - 48);
        ctx.fillText(`${line2}”`, w / 2, subBoxY + 39, w - 48);
      } else {
        ctx.fillText(`“${line1}”`, w / 2, subBoxY + 30, w - 48);
      }
      ctx.restore();
    }

    // 8. Scene progress bar along bottom edge
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, h - 4, w, 4);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(
      0,
      h - 4,
      w * Math.min(1, currentTime / Math.max(0.1, timelineMeta.totalDuration)),
      4
    );
  }, [
    currentTime,
    activeSceneIndex,
    timelineMeta,
    isMinimized,
    isOpen,
    storyboard,
  ]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      if (audio) audio.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= timelineMeta.totalDuration - 0.15) {
        setCurrentTime(0);
        if (audio) audio.currentTime = 0;
      }
      if (selectedTake && audio) {
        audio.muted = isMuted;
        audio.currentTime = currentTime;
        audio.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  };

  const handleSeekToScene = (sceneIdx: number) => {
    const target = timelineMeta.intervals[sceneIdx];
    if (!target) return;
    setCurrentTime(target.start + 0.02);
    onActiveSceneChange(sceneIdx);
    if (selectedTake && audioRef.current) {
      audioRef.current.currentTime = target.start + 0.02;
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = parseFloat(e.target.value);
    setCurrentTime(nextTime);
    if (selectedTake && audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onActiveSceneChange(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Closed state: compact floating launcher button in bottom-right corner
  if (!isOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shadow-2xl border border-amber-300/40 transition-all cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          Abrir Monitor Flotante de Storyboard ({storyboard.length} escenas)
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Monitor de vista previa de video flotante"
      className={`fixed bottom-5 right-5 z-50 bg-[#111318]/95 backdrop-blur-xl border border-amber-500/35 rounded-2xl shadow-2xl transition-all duration-200 flex flex-col overflow-hidden ${
        isMinimized
          ? 'w-80'
          : isExpanded
            ? 'w-[92vw] sm:w-[520px]'
            : 'w-[92vw] sm:w-[400px]'
      }`}
    >
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        className="hidden"
      />

      {/* Top Studio Monitor Header Bar */}
      <div className="px-3.5 py-2.5 bg-[#0A0B0E] border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="truncate">
            <span className="text-xs font-semibold text-white">
              Vista Previa en Tiempo Real
            </span>
            <span className="mx-1.5 text-slate-600">·</span>
            <span className="text-[11px] font-mono text-amber-300">
              Escena {activeSceneIndex + 1}/{storyboard.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Tamaño estándar' : 'Ampliar monitor'}
            className="p-1.5 rounded hover:bg-white/8 text-slate-400 hover:text-white cursor-pointer"
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Mostrar video' : 'Minimizar panel'}
            className="px-2 py-1 rounded hover:bg-white/8 text-[11px] font-mono text-slate-400 hover:text-white cursor-pointer"
          >
            {isMinimized ? 'Expandir' : '—'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              if (audioRef.current) audioRef.current.pause();
              setIsOpen(false);
            }}
            title="Ocultar monitor flotante"
            className="p-1.5 rounded hover:bg-white/8 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3.5 flex flex-col gap-3">
          {/* Real-Time Canvas Viewport */}
          <div className="relative rounded-xl overflow-hidden bg-[#05070B] border border-white/10 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={isVerticalFormat ? 405 : 640}
              height={isVerticalFormat ? 480 : 360}
              onClick={togglePlay}
              className="w-full h-auto max-h-[270px] object-contain cursor-pointer block"
            />
          </div>

          {/* Segmented Scene Timeline Scrubber */}
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-6 gap-1">
              {timelineMeta.intervals.map((item, idx) => {
                const isActive = idx === activeSceneIndex;
                const isPast = currentTime >= item.end;
                const progressInScene = isActive
                  ? Math.min(
                      100,
                      Math.max(0, ((currentTime - item.start) / item.duration) * 100)
                    )
                  : isPast
                    ? 100
                    : 0;

                return (
                  <button
                    key={item.scene.sceneNumber || idx}
                    type="button"
                    onClick={() => handleSeekToScene(idx)}
                    title={`Saltar a Escena #${item.scene.sceneNumber} (${item.scene.timestamp}): ${item.scene.onScreenText}`}
                    className={`group relative h-6 rounded overflow-hidden border text-[10px] font-mono transition-colors cursor-pointer flex items-center justify-center ${
                      isActive
                        ? 'border-amber-400 text-white bg-[#1A1E29]'
                        : 'border-white/10 text-slate-400 bg-[#0A0B0E] hover:border-white/25'
                    }`}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-amber-500/30 transition-all"
                      style={{ width: `${progressInScene}%` }}
                    />
                    <span className="relative z-10 font-semibold">
                      E0{item.scene.sceneNumber}
                    </span>
                  </button>
                );
              })}
            </div>

            <input
              type="range"
              min={0}
              max={Math.max(0.1, timelineMeta.totalDuration)}
              step={0.05}
              value={Math.min(currentTime, timelineMeta.totalDuration)}
              onChange={handleScrub}
              className="w-full accent-amber-500 h-1 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Playback Controls & Timecode */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={togglePlay}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Reproducir
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSeekToScene(Math.max(0, activeSceneIndex - 1))
                }
                title="Escena anterior"
                className="p-1.5 rounded-lg bg-[#181B22] hover:bg-[#222631] text-slate-300 border border-white/8 cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSeekToScene(
                    Math.min(storyboard.length - 1, activeSceneIndex + 1)
                  )
                }
                title="Siguiente escena"
                className="p-1.5 rounded-lg bg-[#181B22] hover:bg-[#222631] text-slate-300 border border-white/8 cursor-pointer"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Reiniciar vista previa"
                className="p-1.5 rounded-lg bg-[#181B22] hover:bg-[#222631] text-slate-300 border border-white/8 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-300 tabular-nums">
                {formatClock(currentTime)} / {formatClock(timelineMeta.totalDuration)}
              </span>

              <button
                type="button"
                onClick={() => {
                  const nextMute = !isMuted;
                  setIsMuted(nextMute);
                  if (audioRef.current) audioRef.current.muted = nextMute;
                }}
                className="p-1.5 rounded-lg bg-[#181B22] hover:bg-[#222631] text-slate-300 border border-white/8 cursor-pointer"
                title={isMuted ? 'Activar audio' : 'Silenciar audio'}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>
            </div>
          </div>

          {/* Synchronized Narration Audio Selector Bar */}
          <div className="pt-2 border-t border-white/8 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Mic className="w-3 h-3 text-amber-400" />
                Audio de narración sincronizado:
              </span>

              {voiceTakes.length > 0 ? (
                <select
                  value={selectedTake?.id || ''}
                  onChange={(e) => onSelectTake(e.target.value)}
                  className="bg-[#0A0B0E] border border-white/10 rounded px-2 py-1 text-[11px] text-amber-300 font-mono focus:outline-none focus:border-amber-500 max-w-[190px] truncate"
                >
                  {voiceTakes.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} · {t.voiceName} ({t.durationSec.toFixed(1)}s)
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  type="button"
                  onClick={onSynthesizeFullVoiceover}
                  disabled={isSynthesizingVoiceover}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-medium cursor-pointer disabled:opacity-50"
                >
                  {isSynthesizingVoiceover ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Sintetizando voz…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Generar Audio IA para Sincronizar
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 truncate">
              Proyecto: <span className="text-slate-200">{projectTitle}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
