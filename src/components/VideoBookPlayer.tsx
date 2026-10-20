import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX,
  Download,
  FileDown,
  FileText,
  Loader2,
  Wand2,
  RotateCcw,
  CheckCircle2,
  Mic,
  Film,
  Image as ImageIcon,
  UserCheck,
  Upload,
  Eye,
  Headphones,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  Check,
} from 'lucide-react';
import { VideoBook, AudiobookVisualMode } from '../utils/videoRenderer';
import { VoiceoverTake } from './StudioAudioPlayer';
import {
  TalkingAvatarStage,
  NarratorAvatarPreset,
  NARRATOR_AVATAR_PRESETS,
  AVATAR_CATEGORIES,
  AvatarCategory,
} from './TalkingAvatarStage';
import {
  NICHE_SCENE_LIBRARY_1200,
  SCENE_NICHE_CATEGORIES,
  SceneNicheCategory,
  NicheScenePhoto,
  matchBestScenesForBookPages,
} from '../utils/nicheSceneLibrary';
import { NicheSceneGalleryView } from './NicheSceneGalleryView';

interface VideoBookPlayerProps {
  videoBook: VideoBook;
  pageImages: Record<number, string>;
  generatingPageIdx: number | null;
  isGeneratingAllPages: boolean;
  onGeneratePageImage: (pageIdx: number) => void;
  onGenerateAllPageImages: () => void;
  onAssignPageImage?: (pageIdx: number, imageUrl: string) => void;
  onAssignMultiplePageImages?: (imagesMap: Record<number, string>) => void;
  takes: VoiceoverTake[];
  selectedTakeId: string | null;
  onSelectTake: (takeId: string) => void;
  isGeneratingAudio: boolean;
  onGenerateBookAudio: () => void;
  isExportingMp4: boolean;
  mp4Progress: number;
  exportedMp4Url: string | null;
  onExportMp4: () => void;
  onExportMp3: () => void;
  onExportPdf: () => void;
  onExportTxt: () => void;
  activePageIdx: number;
  onPageChange: (idx: number) => void;
  visualMode: AudiobookVisualMode;
  onVisualModeChange: (mode: AudiobookVisualMode) => void;
  selectedAvatar: NarratorAvatarPreset;
  onSelectAvatar: (avatar: NarratorAvatarPreset) => void;
  customAvatarUrl?: string;
  onUploadCustomAvatar: (dataUrl: string) => void;
  onSellWithPayPal?: () => void;
  onAddUnlimitedChapter?: () => void;
  onUpdateChapterDuration?: (pageIdx: number, newDurationSec: number) => void;
}

export const VideoBookPlayer: React.FC<VideoBookPlayerProps> = ({
  videoBook,
  pageImages,
  generatingPageIdx,
  isGeneratingAllPages,
  onGeneratePageImage,
  onGenerateAllPageImages,
  onAssignPageImage,
  onAssignMultiplePageImages,
  takes,
  selectedTakeId,
  onSelectTake,
  isGeneratingAudio,
  onGenerateBookAudio,
  isExportingMp4,
  mp4Progress,
  exportedMp4Url,
  onExportMp4,
  onExportMp3,
  onExportPdf,
  onExportTxt,
  activePageIdx,
  onPageChange,
  visualMode,
  onVisualModeChange,
  selectedAvatar,
  onSelectAvatar,
  customAvatarUrl,
  onUploadCustomAvatar,
  onSellWithPayPal,
  onAddUnlimitedChapter,
  onUpdateChapterDuration,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [readingFontSize, setReadingFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');

  // 30 Realistic AI Avatars Gallery State
  const [showAvatarGallery, setShowAvatarGallery] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | AvatarCategory>('Todos');
  const [genderFilter, setGenderFilter] = useState<'todos' | 'femenina' | 'masculina'>('todos');
  const [avatarSearch, setAvatarSearch] = useState<string>('');
  const [aiGeneratedPortraits, setAiGeneratedPortraits] = useState<Record<string, string>>({});
  const [generatingAvatarId, setGeneratingAvatarId] = useState<string | null>(null);
  const [customAiPrompt, setCustomAiPrompt] = useState<string>('');
  const [isGeneratingCustomAiAvatar, setIsGeneratingCustomAiAvatar] = useState<boolean>(false);

  // 1,200+ Niche Scene Photos Library State
  const [showSceneLibrary, setShowSceneLibrary] = useState<boolean>(true);
  const [selectedSceneNiche, setSelectedSceneNiche] = useState<'Todos' | SceneNicheCategory>('Todos');
  const [sceneSearchQuery, setSceneSearchQuery] = useState<string>('');
  const [visibleSceneCount, setVisibleSceneCount] = useState<number>(60);
  const [generatingScenePhotoId, setGeneratingScenePhotoId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const lastSpokenPageRef = useRef<number | null>(null);

  const pages = videoBook.pages || [];
  const currentPage = pages[activePageIdx] || pages[0];

  const activeTake = useMemo(() => {
    if (!takes.length) return null;
    return takes.find((t) => t.id === selectedTakeId) || takes[0];
  }, [takes, selectedTakeId]);

  const filteredAvatars = useMemo(() => {
    return NARRATOR_AVATAR_PRESETS.filter((av) => {
      if (selectedCategory !== 'Todos' && av.category !== selectedCategory) return false;
      if (genderFilter !== 'todos' && av.gender !== genderFilter) return false;
      if (avatarSearch.trim()) {
        const q = avatarSearch.toLowerCase();
        const match =
          av.name.toLowerCase().includes(q) ||
          av.role.toLowerCase().includes(q) ||
          av.accent.toLowerCase().includes(q) ||
          av.category.toLowerCase().includes(q) ||
          av.voiceName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [selectedCategory, genderFilter, avatarSearch]);

  // Filter across all 1,200 Niche Scene Photos
  const filteredNicheScenes = useMemo(() => {
    return NICHE_SCENE_LIBRARY_1200.filter((photo) => {
      if (selectedSceneNiche !== 'Todos' && photo.niche !== selectedSceneNiche) return false;
      if (sceneSearchQuery.trim()) {
        const q = sceneSearchQuery.toLowerCase();
        const match =
          photo.title.toLowerCase().includes(q) ||
          photo.niche.toLowerCase().includes(q) ||
          photo.subNiche.toLowerCase().includes(q) ||
          photo.keywords.some((k) => k.includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [selectedSceneNiche, sceneSearchQuery]);

  const visibleScenes = useMemo(
    () => filteredNicheScenes.slice(0, visibleSceneCount),
    [filteredNicheScenes, visibleSceneCount]
  );

  // Effective photo URL for the currently selected avatar
  const activeAvatarPhotoUrl =
    customAvatarUrl ||
    aiGeneratedPortraits[selectedAvatar.id] ||
    selectedAvatar.customPhotoUrl ||
    selectedAvatar.realPhotoUrl;

  // Assign a single photo from the 1,200+ library to the active chapter
  const handleSelectScenePhotoForActiveChapter = (photo: NicheScenePhoto) => {
    onAssignPageImage?.(activePageIdx, photo.imageUrl);
  };

  // Auto-fill all chapters in the audiobook with matching scenes from the 1,200+ library
  const handleAutoFillBookFrom1200Library = (nicheToUse?: 'Auto' | SceneNicheCategory) => {
    if (!onAssignMultiplePageImages || !pages.length) return;
    const matched = matchBestScenesForBookPages(
      pages,
      nicheToUse || (selectedSceneNiche === 'Todos' ? 'Auto' : selectedSceneNiche)
    );
    const map: Record<number, string> = {};
    Object.entries(matched).forEach(([idxStr, scenePhoto]) => {
      map[Number(idxStr)] = scenePhoto.imageUrl;
    });
    onAssignMultiplePageImages(map);
  };

  // Generate an AI variation of a niche scene photo using Gemini 3.1 Flash Image
  const handleGenerateAiVariantForNichePhoto = async (photo: NicheScenePhoto) => {
    setGeneratingScenePhotoId(photo.id);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: photo.aiScenePrompt,
          headlineText: photo.subNiche.toUpperCase(),
          primaryHex: photo.primaryHex,
          secondaryHex: photo.secondaryHex,
          accentHex: photo.accentHex,
          aspectRatio: '16:9',
          shotNumber: activePageIdx + 1,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        onAssignPageImage?.(activePageIdx, data.imageUrl);
      }
    } catch (_err) {
      onAssignPageImage?.(activePageIdx, photo.imageUrl);
    } finally {
      setGeneratingScenePhotoId(null);
    }
  };

  // Generate or regenerate a photorealistic 1:1 avatar portrait using Gemini 3.1 Flash Image
  const handleGenerateAiPortraitForAvatar = async (
    avatar: NarratorAvatarPreset,
    overridePrompt?: string
  ) => {
    setGeneratingAvatarId(avatar.id);
    try {
      const promptToUse =
        overridePrompt?.trim() ||
        `${avatar.aiPortraitPrompt} Ultra-realistic 8k studio photography, natural skin texture, expressive eyes looking at the camera, cinema broadcast lighting.`;
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          headlineText: avatar.name.toUpperCase(),
          primaryHex: avatar.jacketColor,
          secondaryHex: '#0F172A',
          accentHex: avatar.accentColor,
          aspectRatio: '1:1',
          shotNumber: avatar.number,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setAiGeneratedPortraits((prev) => ({
          ...prev,
          [avatar.id]: data.imageUrl,
        }));
        onSelectAvatar({
          ...avatar,
          customPhotoUrl: data.imageUrl,
        });
        onUploadCustomAvatar(data.imageUrl);
      }
    } catch (_err) {
      // Keep existing realPhotoUrl on network error
    } finally {
      setGeneratingAvatarId(null);
    }
  };

  const handleGenerateCustomPromptAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAiPrompt.trim() || isGeneratingCustomAiAvatar) return;
    setIsGeneratingCustomAiAvatar(true);
    try {
      await handleGenerateAiPortraitForAvatar(
        selectedAvatar,
        `Photorealistic 85mm f/1.4 medium close-up studio portrait of an audiobook narrator: ${customAiPrompt.trim()}. Dark cinema recording studio, warm amber key light, looking directly at camera lens, ultra-detailed skin and eyes.`
      );
      setCustomAiPrompt('');
    } finally {
      setIsGeneratingCustomAiAvatar(false);
    }
  };

  const pageTimings = useMemo(() => {
    let cursor = 0;
    const raw = pages.map((p, idx) => {
      const dur = Math.max(5, p.durationSec || 8);
      const item = { index: idx, start: cursor, end: cursor + dur, duration: dur };
      cursor += dur;
      return item;
    });
    const totalRaw = Math.max(1, cursor);
    const targetTotal = audioDuration && audioDuration > 1 ? audioDuration : totalRaw;
    const scale = targetTotal / totalRaw;

    return {
      totalDuration: targetTotal,
      items: raw.map((r) => ({
        index: r.index,
        start: r.start * scale,
        end: r.end * scale,
        duration: r.duration * scale,
      })),
    };
  }, [pages, audioDuration]);

  // Sync page index from currentTime when playing
  useEffect(() => {
    if (!pageTimings.items.length) return;
    const found = pageTimings.items.find(
      (it) => currentTime >= it.start && currentTime < it.end
    );
    if (found && found.index !== activePageIdx) {
      onPageChange(found.index);
    }
  }, [currentTime, pageTimings, activePageIdx, onPageChange]);

  // Live Browser Speech Synthesis when playing without a recorded WAV take
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (!isPlaying || isMuted) {
      window.speechSynthesis.cancel();
      lastSpokenPageRef.current = null;
      return;
    }

    if (!activeTake && currentPage && lastSpokenPageRef.current !== activePageIdx) {
      lastSpokenPageRef.current = activePageIdx;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          `${currentPage.chapterTitle}. ${currentPage.pageText}`
        );
        utterance.lang = 'es-ES';
        utterance.pitch = selectedAvatar.gender === 'masculina' ? 0.88 : 1.06;
        utterance.rate = 0.98;
        window.speechSynthesis.speak(utterance);
      } catch (_e) {
        // Ignore browser speech errors
      }
    }
  }, [isPlaying, isMuted, activeTake, activePageIdx, currentPage, selectedAvatar.gender]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [activeTake?.id]);

  useEffect(() => {
    if (!isPlaying || activeTake) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
      return;
    }

    const step = (now: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = now;
      }
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= pageTimings.totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, activeTake, pageTimings.totalDuration]);

  const togglePlay = () => {
    if (activeTake && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (audioRef.current.currentTime >= pageTimings.totalDuration - 0.15) {
          audioRef.current.currentTime = 0;
          setCurrentTime(0);
          onPageChange(0);
        }
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      if (!isPlaying && currentTime >= pageTimings.totalDuration - 0.15) {
        setCurrentTime(0);
        onPageChange(0);
        lastSpokenPageRef.current = null;
      }
      setIsPlaying((prev) => !prev);
    }
  };

  const jumpToPage = (idx: number) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, idx));
    lastSpokenPageRef.current = null;
    onPageChange(clamped);
    const targetTiming = pageTimings.items[clamped];
    if (targetTiming) {
      const targetTime = targetTiming.start + 0.05;
      setCurrentTime(targetTime);
      if (activeTake && audioRef.current) {
        audioRef.current.currentTime = targetTime;
      }
    }
  };

  const restartBook = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    lastSpokenPageRef.current = null;
    onPageChange(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleAvatarPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadCustomAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const currentTiming = pageTimings.items[activePageIdx] || {
    start: 0,
    end: 8,
    duration: 8,
  };
  const pageProgress = Math.max(
    0,
    Math.min(1, (currentTime - currentTiming.start) / Math.max(0.1, currentTiming.duration))
  );

  const sentences = useMemo(() => {
    if (!currentPage?.pageText) return [];
    return currentPage.pageText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [currentPage?.pageText]);

  const activeSentenceIdx = useMemo(() => {
    if (!sentences.length) return 0;
    if (!isPlaying && currentTime === 0) return -1;
    return Math.min(
      sentences.length - 1,
      Math.floor(pageProgress * sentences.length)
    );
  }, [sentences.length, pageProgress, isPlaying, currentTime]);

  const formatSec = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  const currentImage = pageImages[activePageIdx];
  const illustratedCount = Object.keys(pageImages).length;

  if (!currentPage) return null;

  return (
    <div className="space-y-6">
      {/* Hidden Audio Element when an AI Voiceover Take exists */}
      {activeTake && (
        <audio
          ref={audioRef}
          src={activeTake.wavUrl}
          muted={isMuted}
          onLoadedMetadata={(e) => {
            const dur = e.currentTarget.duration;
            if (dur && Number.isFinite(dur)) setAudioDuration(dur);
          }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* =====================================================================
          30 REAL AI AVATARS STUDIO CAST SELECTOR & GEMINI 3.1 GENERATOR
         ===================================================================== */}
      <div className="bg-[#11131A] border border-slate-800/90 rounded-md p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-md overflow-hidden border-2 border-amber-500 shrink-0 bg-slate-900">
              <img
                src={activeAvatarPhotoUrl}
                alt={selectedAvatar.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 px-1 bg-amber-500 text-slate-950 font-mono text-[9px] font-bold">
                #{selectedAvatar.number}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[10px] font-mono uppercase tracking-wider text-amber-300 font-semibold">
                  30 AVATARES REALES CON LO MÁS NUEVO IA · GEMINI 3.1 LIVE
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  ● Activo: #{selectedAvatar.number} {selectedAvatar.name} ({selectedAvatar.accent})
                </span>
              </div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white mt-0.5">
                {selectedAvatar.role} · Voz IA {selectedAvatar.voiceName} ({selectedAvatar.ageRange})
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleGenerateAiPortraitForAvatar(selectedAvatar)}
              disabled={generatingAvatarId === selectedAvatar.id}
              className="px-3.5 py-2 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {generatingAvatarId === selectedAvatar.id ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generando Retrato IA 4K...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Regenerar Rostro con IA Nueva (Gemini 3.1)</span>
                </>
              )}
            </button>

            <label className="px-3 py-2 rounded bg-[#171A24] hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>{customAvatarUrl ? 'Cambiar Foto Real' : 'Subir Tu Foto Real'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarPhotoUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowAvatarGallery((prev) => !prev)}
              className="px-3.5 py-2 rounded bg-[#181C26] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>{showAvatarGallery ? 'Ocultar 30 Avatares' : 'Ver los 30 Avatares Reales'}</span>
              {showAvatarGallery ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable 30 Realistic Avatars Cast Grid */}
        {showAvatarGallery && (
          <div className="pt-4 border-t border-slate-800/90 space-y-4">
            {/* Filters Bar: Category + Gender + Search */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('Todos')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === 'Todos'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-[#161923] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  Todos (30)
                </button>
                {AVATAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'bg-[#161923] text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-[#141720] border border-slate-800 rounded p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setGenderFilter('todos')}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      genderFilter === 'todos'
                        ? 'bg-slate-800 text-amber-300 font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('femenina')}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      genderFilter === 'femenina'
                        ? 'bg-slate-800 text-amber-300 font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    15 Femeninas
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('masculina')}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      genderFilter === 'masculina'
                        ? 'bg-slate-800 text-amber-300 font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    15 Masculinos
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={avatarSearch}
                    onChange={(e) => setAvatarSearch(e.target.value)}
                    placeholder="Buscar por nombre, país, voz..."
                    className="pl-8 pr-3 py-1 rounded bg-[#141720] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-52"
                  />
                </div>
              </div>
            </div>

            {/* 30 Real AI Avatars Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {filteredAvatars.map((av) => {
                const isSelected = selectedAvatar.id === av.id;
                const portraitSrc =
                  aiGeneratedPortraits[av.id] || av.customPhotoUrl || av.realPhotoUrl;
                const isGeneratingThis = generatingAvatarId === av.id;

                return (
                  <div
                    key={av.id}
                    onClick={() => onSelectAvatar(av)}
                    className={`group rounded-md border p-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#1A1F2E] border-amber-500 shadow-lg ring-1 ring-amber-500/40'
                        : 'bg-[#0D1017] border-slate-800/90 hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="relative h-24 w-full rounded overflow-hidden bg-slate-900 border border-slate-800">
                        <img
                          src={portraitSrc}
                          alt={av.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/85 border border-slate-700 text-[9px] font-mono font-bold text-amber-400">
                          #{String(av.number).padStart(2, '0')}
                        </span>
                        <span
                          className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-950/85 text-[9px] font-mono text-slate-200"
                          style={{ borderLeft: `2px solid ${av.accentColor}` }}
                        >
                          {av.voiceName}
                        </span>
                        <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between">
                          <span className="text-[9px] font-mono text-emerald-300 truncate">
                            {av.accent.replace('Español ', '')}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-100 truncate">{av.name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{av.role}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateAiPortraitForAvatar(av);
                      }}
                      disabled={isGeneratingThis}
                      className="w-full py-1 px-1.5 rounded bg-[#151924] hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-amber-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Generar nuevo retrato realista con Gemini 3.1 Flash Image"
                    >
                      {isGeneratingThis ? (
                        <>
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          <span>Creando IA...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Foto IA 3.1</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Custom AI Avatar Generator Bar */}
            <form
              onSubmit={handleGenerateCustomPromptAvatar}
              className="bg-[#0B0E15] border border-slate-800/90 rounded p-3 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-white">
                  Diseñar Avatar Real a Medida (Gemini 3.1 IA):
                </span>
              </div>
              <div className="flex-1 min-w-[240px] flex items-center gap-2">
                <input
                  type="text"
                  value={customAiPrompt}
                  onChange={(e) => setCustomAiPrompt(e.target.value)}
                  placeholder="Ej: Narrador de 40 años en estudio de cine con traje oscuro, barba e iluminación cálida..."
                  className="flex-1 rounded bg-[#141824] border border-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={!customAiPrompt.trim() || isGeneratingCustomAiAvatar}
                  className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isGeneratingCustomAiAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generando Avatar Real...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Crear Rostro Real IA</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* =====================================================================
          1,200+ NICHE SCENE PHOTOS LIBRARY (12 NICHOS × 100 FOTOS = 1,200 HD)
         ===================================================================== */}
      <NicheSceneGalleryView
        activeChapterNumber={currentPage.pageNumber}
        activeChapterTitle={currentPage.chapterTitle}
        currentChapterImageUrl={currentImage}
        totalChapters={pages.length}
        onSelectPhotoForChapter={handleSelectScenePhotoForActiveChapter}
        onAutoFillAllChaptersWithNiche={handleAutoFillBookFrom1200Library}
        onGenerateAiVariantForPhoto={handleGenerateAiVariantForNichePhoto}
        generatingPhotoId={generatingScenePhotoId}
      />

      {/* Top Studio Control Bar: Visual Mode Selector + 1-Click Actions */}
      <div className="bg-[#11131A] border border-slate-800/90 rounded-md p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                  AUDIOLIBRO IA COMPLETO EN VIDEO ({pages.length} CAPÍTULOS)
                </span>
                <span className="text-xs font-mono text-slate-600">·</span>
                <span className="text-[11px] font-mono text-emerald-400">
                  Avatar #{selectedAvatar.number}: {selectedAvatar.name} ({selectedAvatar.voiceName})
                </span>
                <span className="text-xs font-mono text-slate-600">·</span>
                <span className="text-[11px] font-mono text-slate-400">
                  {illustratedCount}/{pages.length} escenas activas
                </span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-100 leading-tight">
                {videoBook.bookTitle}
              </h2>
            </div>
          </div>

          {/* 1-Click Audiobook Generation, MP4 Export & PayPal Monetization Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onGenerateAllPageImages}
              disabled={isGeneratingAllPages || generatingPageIdx !== null}
              className="px-4 py-2.5 rounded-lg bg-[#0070BA] hover:bg-[#005EA6] text-white font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingAllPages ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Creando Escenas con IA...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-white" />
                  <span>1. Generar Escenas IA Nuevas</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onGenerateBookAudio}
              disabled={isGeneratingAudio}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Grabando Voz del Audiolibro...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-white" />
                  <span>
                    {activeTake
                      ? 'Regenerar Voz IA Completa'
                      : '2. Hablar Audiolibro Completo (Voz IA)'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onExportMp4}
              disabled={isExportingMp4}
              className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isExportingMp4 ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Renderizando MP4 ({mp4Progress}%)...</span>
                </>
              ) : (
                <>
                  <Film className="w-3.5 h-3.5" />
                  <span>3. Descargar Audiolibro (.MP4)</span>
                </>
              )}
            </button>

            {onSellWithPayPal && (
              <button
                type="button"
                onClick={onSellWithPayPal}
                className="px-4 py-2.5 rounded-xl bg-[#FFC439] hover:bg-[#F2B729] text-[#003087] font-extrabold text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <span>Suscríbete ahora</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual Presentation Mode Switcher */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              VISTA DEL AUDIOLIBRO:
            </span>
            <button
              type="button"
              onClick={() => onVisualModeChange('avatar-and-scenes')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                visualMode === 'avatar-and-scenes'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-[#171A24] text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              Avatar Real Hablando + Escenas del Nicho
            </button>
            <button
              type="button"
              onClick={() => onVisualModeChange('avatar-only')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                visualMode === 'avatar-only'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-[#171A24] text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              Avatar Real en Estudio (Pantalla Completa)
            </button>
            <button
              type="button"
              onClick={() => onVisualModeChange('scenes-only')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                visualMode === 'scenes-only'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-[#171A24] text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              Solo Escenas del Texto
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              30 Avatares Reales · +1,200 Fotos de Nichos
            </span>
          </div>
        </div>
      </div>

      {/* Main Open Video-Audiobook Stage (Left: Scene & Talking Avatar | Right: Synchronized Spoken Book Text) */}
      <div className="bg-[#0D1017] border border-slate-800 rounded-md overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          {/* Left Stage: Either Full Talking Avatar OR Topic Scene + PiP Talking Avatar */}
          <div
            className="lg:col-span-6 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/90 flex flex-col justify-between p-6 min-h-[380px]"
            style={{
              background: `linear-gradient(135deg, ${currentPage.primaryHex || '#0D1322'} 0%, ${
                currentPage.secondaryHex || '#1B2845'
              } 100%)`,
            }}
          >
            {visualMode === 'avatar-only' ? (
              /* Full Studio Talking Narrator Avatar Stage */
              <div className="absolute inset-0">
                <TalkingAvatarStage
                  avatar={selectedAvatar}
                  isSpeaking={isPlaying}
                  customPhotoUrl={activeAvatarPhotoUrl}
                />
              </div>
            ) : (
              /* Topic Scene Illustration Canvas + Optional Picture-in-Picture Talking Avatar */
              <>
                {currentImage ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={currentImage}
                      alt={currentPage.chapterTitle}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out"
                      style={{
                        transform: isPlaying
                          ? `scale(${1.02 + pageProgress * 0.08})`
                          : 'scale(1.02)',
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] via-[#080A0F]/25 to-transparent" />
                  </div>
                ) : (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div
                      className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-25"
                      style={{ backgroundColor: currentPage.accentHex || '#F59E0B' }}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,10,15,0.65)_100%)]" />
                  </div>
                )}
              </>
            )}

            {/* Top Left Overlay: Chapter Badge & Generate Topic Scene Button */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono font-semibold text-amber-400">
                CAPÍTULO {currentPage.pageNumber} DE {pages.length}
              </span>

              {visualMode !== 'avatar-only' && (
                <button
                  type="button"
                  onClick={() => onGeneratePageImage(activePageIdx)}
                  disabled={generatingPageIdx === activePageIdx || isGeneratingAllPages}
                  className="px-3 py-1.5 rounded bg-slate-950/85 hover:bg-slate-900 backdrop-blur-md border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {generatingPageIdx === activePageIdx ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Creando escena...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {currentImage ? 'Generar Nueva con IA 3.1' : 'Generar Escena del Tema'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Center Prompt Preview if no scene image yet and not in avatar-only mode */}
            {!currentImage && visualMode !== 'avatar-only' && (
              <div className="relative z-10 my-auto py-6 text-center max-w-md mx-auto space-y-3">
                <div className="w-11 h-11 rounded-full bg-slate-950/60 border border-slate-700/80 flex items-center justify-center mx-auto text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="font-display text-lg font-bold text-slate-100">
                  Escena del Capítulo: {currentPage.chapterTitle}
                </p>
                <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2 italic">
                  “{currentPage.keyQuote}”
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAutoFillBookFrom1200Library()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Usar Foto del Nicho (+1,200 Fotos)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onGeneratePageImage(activePageIdx)}
                    disabled={generatingPageIdx !== null}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar con IA 3.1</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Area of Left Stage: Key Quote + Picture-in-Picture Talking Avatar */}
            <div className="relative z-10 flex items-end justify-between gap-4 mt-auto pt-4">
              <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded p-3.5 space-y-1 flex-1">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  <span>IDEA CLAVE DEL CAPÍTULO</span>
                  <span>{currentPage.durationSec}s</span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-snug">
                  “{currentPage.keyQuote}”
                </p>
              </div>

              {/* Picture-in-Picture Live Talking Real Avatar */}
              {visualMode === 'avatar-and-scenes' && (
                <div className="w-36 h-40 sm:w-44 sm:h-48 rounded-md overflow-hidden border-2 border-amber-500/80 shadow-2xl bg-[#0B0E17] shrink-0 relative">
                  <TalkingAvatarStage
                    avatar={selectedAvatar}
                    isSpeaking={isPlaying}
                    customPhotoUrl={activeAvatarPhotoUrl}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Page: Spoken Audiobook Text with High-Contrast Reading & Font Size Switcher */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 text-xs font-mono text-slate-700">
                <span className="font-bold uppercase tracking-wider text-slate-900">
                  {videoBook.bookTitle}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-sans font-semibold">Tamaño de letra:</span>
                  {(['normal', 'large', 'xlarge'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setReadingFontSize(sz)}
                      className={`px-2 py-0.5 rounded font-sans font-bold text-xs border cursor-pointer ${
                        readingFontSize === sz
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {sz === 'normal' ? 'A' : sz === 'large' ? 'A+ Grande' : 'A++ Muy Grande'}
                    </button>
                  ))}
                  <span className="text-indigo-700 font-bold ml-1">
                    Cap. {currentPage.pageNumber} / {pages.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-700">
                    CAPÍTULO {currentPage.pageNumber} · NARRADOR: #{selectedAvatar.number}{' '}
                    {selectedAvatar.name.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    {onUpdateChapterDuration && (
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
                        <span>Duración Cap. (Sin límite):</span>
                        <input
                          type="number"
                          min={5}
                          max={3600}
                          value={currentPage.durationSec || 10}
                          onChange={(e) =>
                            onUpdateChapterDuration(
                              activePageIdx,
                              Math.max(5, Number(e.target.value) || 10)
                            )
                          }
                          className="w-16 px-1.5 py-0.5 rounded bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900"
                        />
                        <span>seg</span>
                      </label>
                    )}
                    {isPlaying && (
                      <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                        HABLANDO EN VIVO
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 leading-tight">
                  {currentPage.chapterTitle}
                </h3>
              </div>

              {/* Synchronized Paragraph Text (High-Contrast Easy Reading) */}
              <div
                className={`pt-3 space-y-2 leading-relaxed font-medium text-slate-900 ${
                  readingFontSize === 'xlarge'
                    ? 'text-xl sm:text-2xl leading-loose'
                    : readingFontSize === 'large'
                    ? 'text-lg sm:text-xl leading-relaxed'
                    : 'text-base sm:text-lg leading-relaxed'
                }`}
              >
                {sentences.map((sentence, sIdx) => {
                  const isSentenceActive = sIdx === activeSentenceIdx;
                  return (
                    <span
                      key={sIdx}
                      className={`inline transition-colors duration-300 rounded px-1.5 py-0.5 ${
                        isSentenceActive
                          ? 'bg-amber-200 text-slate-950 font-bold shadow-2xs'
                          : 'text-slate-900'
                      }`}
                    >
                      {sentence}{' '}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Bottom of Right Page: Chapter Progress + Chapter Turn Controls */}
            <div className="pt-8 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>
                    {isPlaying
                      ? `Narrando con ${selectedAvatar.name} (${selectedAvatar.accent})...`
                      : 'Progreso de lectura del capítulo'}
                  </span>
                  <span>{Math.round(pageProgress * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-150"
                    style={{ width: `${Math.round(pageProgress * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => jumpToPage(activePageIdx - 1)}
                  disabled={activePageIdx === 0}
                  className="px-3 py-1.5 rounded bg-[#181C26] hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Capítulo Anterior</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {pages.map((p, idx) => (
                    <button
                      key={p.pageNumber}
                      type="button"
                      onClick={() => jumpToPage(idx)}
                      className={`h-2.5 rounded-sm transition-all cursor-pointer ${
                        idx === activePageIdx
                          ? 'w-7 bg-amber-400'
                          : pageImages[idx]
                          ? 'w-2.5 bg-emerald-400/70 hover:bg-emerald-400'
                          : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                      }`}
                      title={`Ir a Capítulo ${p.pageNumber}: ${p.chapterTitle}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => jumpToPage(activePageIdx + 1)}
                  disabled={activePageIdx >= pages.length - 1}
                  className="px-3 py-1.5 rounded bg-[#181C26] hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <span>Capítulo Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Audiobook Playback & Download Footer Bar */}
        <div className="bg-[#090B10] border-t border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pausar Audiolibro</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Escuchar Audiolibro Hablado</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={restartBook}
              className="p-2 rounded bg-[#141720] hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
              title="Reiniciar desde el capítulo 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className="p-2 rounded bg-[#141720] hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
              title={isMuted ? 'Activar voz' : 'Silenciar voz'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            <span className="text-xs font-mono text-slate-400">
              {formatSec(currentTime)} / {formatSec(pageTimings.totalDuration)}
            </span>

            {takes.length > 1 && (
              <select
                value={activeTake?.id || ''}
                onChange={(e) => onSelectTake(e.target.value)}
                className="bg-[#141720] border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {takes.map((t, i) => (
                  <option key={t.id} value={t.id}>
                    Pista #{takes.length - i}: {t.voiceName} ({t.accent})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Direct Download Links for the Spoken Audiobook (MP4, MP3, PDF, TXT) */}
          <div className="flex flex-wrap items-center gap-2">
            {exportedMp4Url && (
              <a
                href={exportedMp4Url}
                download={`${videoBook.bookTitle
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .slice(0, 35)}-audiolibro-video.mp4`}
                className="px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Descargar MP4 Listo</span>
              </a>
            )}

            <button
              type="button"
              onClick={onExportMp3}
              className="px-3 py-1.5 rounded bg-[#141720] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Descargar Audiolibro (.MP3)</span>
            </button>

            <button
              type="button"
              onClick={onExportPdf}
              className="px-3 py-1.5 rounded bg-[#141720] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Libro (.PDF)</span>
            </button>

            <button
              type="button"
              onClick={onExportTxt}
              className="px-3 py-1.5 rounded bg-[#141720] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Texto (.TXT)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Strip of All Scenes & Chapters in the Spoken Audiobook + Add Unlimited Chapters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-950">
            Capítulos y Escenas del Audiolibro ({pages.length} Capítulos · Duración Total:{' '}
            {formatSec(pageTimings.totalDuration)} · Sin Límite de Tiempo)
          </h3>
          {onAddUnlimitedChapter && (
            <button
              type="button"
              onClick={onAddUnlimitedChapter}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>+ Añadir Nuevo Capítulo / Escena (Sin Límite)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {pages.map((p, idx) => {
            const isCurrent = idx === activePageIdx;
            const img = pageImages[idx];
            return (
              <div
                key={p.pageNumber}
                onClick={() => jumpToPage(idx)}
                className={`group rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between gap-2.5 bg-white ${
                  isCurrent
                    ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-400 shadow-2xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className={isCurrent ? 'text-indigo-700' : 'text-slate-700'}>
                      CAPÍTULO {p.pageNumber}
                    </span>
                    <span className="text-slate-600">{p.durationSec}s</span>
                  </div>

                  {/* Mini Thumbnail Preview */}
                  <div
                    className="h-24 w-full rounded-lg overflow-hidden border border-slate-200 relative flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${p.primaryHex} 0%, ${p.secondaryHex} 100%)`,
                    }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={p.chapterTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-mono text-white px-2 text-center">
                        Escena lista para generar
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-950 leading-snug break-words">
                    {p.chapterTitle}
                  </h4>
                  <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed">
                    {p.pageText}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGeneratePageImage(idx);
                  }}
                  disabled={generatingPageIdx === idx || isGeneratingAllPages}
                  className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {generatingPageIdx === idx ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creando escena...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{img ? 'Cambiar escena IA' : 'Generar escena IA'}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
