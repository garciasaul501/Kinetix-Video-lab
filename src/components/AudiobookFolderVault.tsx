import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  FolderOpen,
  Download,
  Play,
  FileAudio,
  FileVideo,
  Trash2,
  CheckCircle2,
  Sparkles,
  Loader2,
  Search,
  Star,
  Edit3,
  BookOpen,
  Volume2,
  Film,
  X,
} from 'lucide-react';
import {
  SavedAudiobookItem,
  getMediaBlobFromIdb,
  saveMediaBlobToIdb,
  deleteMediaBlobsFromIdb,
} from '../utils/studioStorage';
import {
  VideoBook,
  AudiobookVisualMode,
  downloadAudioAsMp3,
  renderVideoBookToMp4Url,
} from '../utils/videoRenderer';
import {
  NarratorAvatarPreset,
  NARRATOR_AVATAR_PRESETS,
} from './TalkingAvatarStage';

interface AudiobookFolderVaultProps {
  savedAudiobooks: SavedAudiobookItem[];
  customFolders: string[];
  onCreateFolder: (folderName: string) => void;
  onSaveCurrentAudiobook: (
    format: 'MP3' | 'MP4' | 'MP4 + MP3',
    folderName: string
  ) => Promise<void>;
  onRestoreAudiobookToStudio: (item: SavedAudiobookItem) => void;
  onMoveToFolder: (itemId: string, newFolder: string) => void;
  onToggleFavorite: (itemId: string) => void;
  onRenameAudiobook: (itemId: string, newTitle: string) => void;
  onDeleteAudiobook: (itemId: string) => void;
  onMarkBlobCached: (itemId: string, type: 'mp3' | 'mp4', sizeLabel?: string) => void;
  onSellWithPayPal?: (item: SavedAudiobookItem) => void;
  currentBookTitle: string;
  isSavingToFolder: 'MP3' | 'MP4' | 'MP4 + MP3' | null;
  saveProgressPct: number;
}

export const AudiobookFolderVault: React.FC<AudiobookFolderVaultProps> = ({
  savedAudiobooks,
  customFolders,
  onCreateFolder,
  onSaveCurrentAudiobook,
  onRestoreAudiobookToStudio,
  onMoveToFolder,
  onToggleFavorite,
  onRenameAudiobook,
  onDeleteAudiobook,
  onMarkBlobCached,
  onSellWithPayPal,
  currentBookTitle,
  isSavingToFolder,
  saveProgressPct,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('TODAS');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'MP4' | 'MP3'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [targetSaveFolder, setTargetSaveFolder] = useState<string>(
    customFolders[0] || 'Ciencia & Tecnología IA'
  );
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderInput, setNewFolderInput] = useState<string>('');

  // Active inline media preview inside the folder
  const [activeMediaPreview, setActiveMediaPreview] = useState<{
    itemId: string;
    type: 'mp3' | 'mp4';
    url: string;
    title: string;
  } | null>(null);
  const [processingItemState, setProcessingItemState] = useState<{
    itemId: string;
    action: 'play-mp3' | 'play-mp4' | 'dl-mp3' | 'dl-mp4';
    progress: number;
  } | null>(null);

  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(null), 3200);
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFolderInput.trim();
    if (!clean) return;
    onCreateFolder(clean);
    setTargetSaveFolder(clean);
    setSelectedFolder(clean);
    setNewFolderInput('');
    setIsCreatingFolder(false);
    showToast(`Carpeta "${clean}" creada lista para guardar MP3 y MP4.`);
  };

  const ensureMp3UrlForItem = async (
    item: SavedAudiobookItem,
    triggerBrowserDownload: boolean
  ): Promise<string> => {
    const existingBlob = await getMediaBlobFromIdb(`${item.id}:mp3`);
    const slug = (item.title || 'audiolibro')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 35);
    const filename = `${slug || 'audiolibro'}.mp3`;

    if (existingBlob) {
      const url = URL.createObjectURL(existingBlob);
      if (triggerBrowserDownload) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return url;
    }

    // Generate MP3 blob on demand and store in IndexedDB folder
    const avatarPreset =
      NARRATOR_AVATAR_PRESETS.find((a) => a.id === item.avatarId) ||
      NARRATOR_AVATAR_PRESETS[0];

    const { blob, objectUrl } = await downloadAudioAsMp3({
      audioBase64: item.audioBase64 || undefined,
      scriptText: item.videoBook.fullNarration,
      voiceGender: avatarPreset.gender,
      durationSec: item.durationSec || 36,
      filename,
      skipBrowserDownload: !triggerBrowserDownload,
    });

    await saveMediaBlobToIdb(`${item.id}:mp3`, blob);
    const sizeMb = Math.max(0.4, blob.size / (1024 * 1024)).toFixed(1);
    onMarkBlobCached(item.id, 'mp3', `${sizeMb} MB (MP3)`);
    return objectUrl;
  };

  const ensureMp4UrlForItem = async (
    item: SavedAudiobookItem,
    triggerBrowserDownload: boolean,
    onPct?: (pct: number) => void
  ): Promise<string> => {
    const existingBlob = await getMediaBlobFromIdb(`${item.id}:mp4`);
    const slug = (item.title || 'audiolibro')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 35);
    const filename = `${slug || 'audiolibro'}-video.mp4`;

    if (existingBlob) {
      const url = URL.createObjectURL(existingBlob);
      if (triggerBrowserDownload) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return url;
    }

    const avatarPreset: NarratorAvatarPreset =
      NARRATOR_AVATAR_PRESETS.find((a) => a.id === item.avatarId) ||
      NARRATOR_AVATAR_PRESETS[0];

    const mp4ObjectUrl = await renderVideoBookToMp4Url(
      item.videoBook,
      item.pageImages || {},
      item.audioBase64 || null,
      (pct) => onPct?.(pct),
      {
        mode: item.visualMode || 'avatar-and-scenes',
        avatar: avatarPreset,
      }
    );

    try {
      const resp = await fetch(mp4ObjectUrl);
      const mp4Blob = await resp.blob();
      await saveMediaBlobToIdb(`${item.id}:mp4`, mp4Blob);
      const sizeMb = Math.max(1.2, mp4Blob.size / (1024 * 1024)).toFixed(1);
      onMarkBlobCached(item.id, 'mp4', `${sizeMb} MB (MP4)`);
    } catch (_e) {
      // Ignore fetch error
    }

    if (triggerBrowserDownload) {
      const a = document.createElement('a');
      a.href = mp4ObjectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    return mp4ObjectUrl;
  };

  const handlePlayItemMedia = async (item: SavedAudiobookItem, type: 'mp3' | 'mp4') => {
    if (processingItemState) return;
    setProcessingItemState({
      itemId: item.id,
      action: type === 'mp3' ? 'play-mp3' : 'play-mp4',
      progress: 10,
    });
    try {
      const url =
        type === 'mp3'
          ? await ensureMp3UrlForItem(item, false)
          : await ensureMp4UrlForItem(item, false, (pct) =>
              setProcessingItemState({
                itemId: item.id,
                action: 'play-mp4',
                progress: pct,
              })
            );
      setActiveMediaPreview({
        itemId: item.id,
        type,
        url,
        title: item.title,
      });
    } finally {
      setProcessingItemState(null);
    }
  };

  const handleDownloadItemMedia = async (item: SavedAudiobookItem, type: 'mp3' | 'mp4') => {
    if (processingItemState) return;
    setProcessingItemState({
      itemId: item.id,
      action: type === 'mp3' ? 'dl-mp3' : 'dl-mp4',
      progress: 10,
    });
    try {
      if (type === 'mp3') {
        await ensureMp3UrlForItem(item, true);
        showToast(`Descargado "${item.title}.mp3" desde tu carpeta.`);
      } else {
        await ensureMp4UrlForItem(item, true, (pct) =>
          setProcessingItemState({
            itemId: item.id,
            action: 'dl-mp4',
            progress: pct,
          })
        );
        showToast(`Descargado "${item.title}-video.mp4" desde tu carpeta.`);
      }
    } finally {
      setProcessingItemState(null);
    }
  };

  const filteredItems = savedAudiobooks.filter((item) => {
    if (selectedFolder === 'FAVORITOS' && !item.isFavorite) return false;
    if (
      selectedFolder !== 'TODAS' &&
      selectedFolder !== 'FAVORITOS' &&
      item.folderName !== selectedFolder
    ) {
      return false;
    }
    if (formatFilter === 'MP4' && !item.format.includes('MP4')) return false;
    if (formatFilter === 'MP3' && !item.format.includes('MP3')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle.toLowerCase().includes(q);
      const matchAv = item.avatarName.toLowerCase().includes(q);
      const matchFolder = item.folderName.toLowerCase().includes(q);
      if (!matchTitle && !matchSub && !matchAv && !matchFolder) return false;
    }
    return true;
  });

  return (
    <section className="bg-[#11131A] border border-amber-500/35 rounded-md overflow-hidden shadow-xl">
      {/* Top Header & Quick Save Current Audiobook to Folder */}
      <div className="p-5 bg-[#0C0E14] border-b border-slate-800/90 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <FolderOpen className="w-4 h-4" />
            <span>CARPETA DE AUDIOLIBROS GUARDADOS (MP3 & MP4 VAULT)</span>
            <span>·</span>
            <span className="text-emerald-400">
              {savedAudiobooks.length} audiolibros en carpetas
            </span>
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-white">
            Folder para Salvar y Descargar tus Audiolibros en MP3 o MP4
          </h2>
          <p className="text-xs text-slate-400">
            Organiza tus audiolibros hablados por carpetas, escúchalos en MP3, mira el video MP4 con avatar o recupéralos para seguir editando.
          </p>
        </div>

        {/* Save Active Audiobook into Selected Folder Controls */}
        <div className="bg-[#131722] border border-slate-800 rounded-md p-3 flex flex-wrap items-center gap-2.5">
          <div className="flex flex-col gap-1 min-w-[175px]">
            <span className="text-[10px] font-mono uppercase text-slate-400">
              Guardar "{currentBookTitle.slice(0, 24)}…" en carpeta:
            </span>
            <select
              value={targetSaveFolder}
              onChange={(e) => setTargetSaveFolder(e.target.value)}
              className="rounded bg-[#0B0D13] border border-slate-700 px-2.5 py-1.5 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
            >
              {customFolders.map((f) => (
                <option key={f} value={f}>
                  📁 {f}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await onSaveCurrentAudiobook('MP3', targetSaveFolder);
                showToast(`Audiolibro guardado en MP3 dentro de "${targetSaveFolder}".`);
              }}
              disabled={isSavingToFolder !== null}
              className="px-3 py-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Generar y salvar el archivo de audio MP3 de este audiolibro en la carpeta seleccionada"
            >
              {isSavingToFolder === 'MP3' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando MP3…</span>
                </>
              ) : (
                <>
                  <FileAudio className="w-3.5 h-3.5" />
                  <span>Salvar MP3 en Folder</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={async () => {
                await onSaveCurrentAudiobook('MP4', targetSaveFolder);
                showToast(`Audiolibro guardado en MP4 dentro de "${targetSaveFolder}".`);
              }}
              disabled={isSavingToFolder !== null}
              className="px-3 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Renderizar y salvar el video-audiolibro MP4 en la carpeta seleccionada"
            >
              {isSavingToFolder === 'MP4' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando MP4 ({saveProgressPct}%)…</span>
                </>
              ) : (
                <>
                  <FileVideo className="w-3.5 h-3.5" />
                  <span>Salvar MP4 en Folder</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={async () => {
                await onSaveCurrentAudiobook('MP4 + MP3', targetSaveFolder);
                showToast(`Proyecto completo (MP4 + MP3) guardado en "${targetSaveFolder}".`);
              }}
              disabled={isSavingToFolder !== null}
              className="px-3 py-2 rounded bg-[#1B2030] hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Guardar proyecto completo editable con acceso a MP4 y MP3"
            >
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Guardar Ambos (MP4+MP3)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div className="px-5 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Folder Navigation Bar & Filters */}
      <div className="px-5 py-3.5 bg-[#0E1118] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Folder Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedFolder('TODAS')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              selectedFolder === 'TODAS'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-[#161A25] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Todas las Carpetas ({savedAudiobooks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFolder('FAVORITOS')}
            className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              selectedFolder === 'FAVORITOS'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-[#161A25] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Favoritos ({savedAudiobooks.filter((i) => i.isFavorite).length})</span>
          </button>

          {customFolders.map((folder) => {
            const count = savedAudiobooks.filter((i) => i.folderName === folder).length;
            return (
              <button
                key={folder}
                type="button"
                onClick={() => setSelectedFolder(folder)}
                className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedFolder === folder
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-[#161A25] text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{folder}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}

          {isCreatingFolder ? (
            <form onSubmit={handleAddFolder} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newFolderInput}
                onChange={(e) => setNewFolderInput(e.target.value)}
                placeholder="Nombre del nuevo folder..."
                autoFocus
                className="px-2.5 py-1 rounded bg-[#0A0C12] border border-amber-500 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-xs font-semibold cursor-pointer"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingFolder(false)}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingFolder(true)}
              className="px-2.5 py-1.5 rounded bg-[#161A25] hover:bg-slate-800 border border-dashed border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Nuevo Folder</span>
            </button>
          )}
        </div>

        {/* Format & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 bg-[#151822] border border-slate-800 rounded">
            {(['ALL', 'MP4', 'MP3'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormatFilter(fmt)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  formatFilter === fmt
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {fmt === 'ALL' ? 'Todos' : `Solo ${fmt}`}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar audiolibro en folder..."
              className="pl-8 pr-3 py-1.5 rounded bg-[#0A0C12] border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Inline Media Player Modal / Drawer when playing MP3 or MP4 inside the Folder */}
      {activeMediaPreview && (
        <div className="p-4 bg-[#080A0F] border-b border-amber-500/40 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
              {activeMediaPreview.type === 'mp4' ? (
                <Film className="w-4 h-4 text-amber-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>
                REPRODUCIENDO DESDE TU CARPETA ({activeMediaPreview.type.toUpperCase()}):{' '}
                <strong className="text-white">{activeMediaPreview.title}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveMediaPreview(null)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
            >
              Cerrar Reproductor
            </button>
          </div>

          {activeMediaPreview.type === 'mp4' ? (
            <video
              src={activeMediaPreview.url}
              controls
              autoPlay
              className="w-full max-h-[380px] rounded border border-slate-800 bg-black"
            />
          ) : (
            <audio
              src={activeMediaPreview.url}
              controls
              autoPlay
              className="w-full"
            />
          )}
        </div>
      )}

      {/* Saved Audiobooks Grid */}
      <div className="p-5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-[#0C0E14] border border-dashed border-slate-800 rounded-md space-y-2">
            <Folder className="w-8 h-8 text-amber-400/60 mx-auto" />
            <p className="text-sm font-semibold text-white">
              No hay audiolibros en esta carpeta todavía
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Usa los botones superiores <strong>"Salvar MP3 en Folder"</strong> o{' '}
              <strong>"Salvar MP4 en Folder"</strong> para guardar tu audiolibro actual aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isBusy = processingItemState?.itemId === item.id;
              return (
                <article
                  key={item.id}
                  className="bg-[#0B0D13] border border-slate-800/90 hover:border-amber-500/40 rounded-md overflow-hidden flex flex-col justify-between transition-colors"
                >
                  <div>
                    {/* Cover Scene + Avatar Overlay */}
                    <div className="relative h-36 bg-slate-950 overflow-hidden border-b border-slate-800">
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D13] via-black/30 to-transparent" />

                      {/* Top Metadata Row */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                          📁 {item.folderName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-black/85 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                            {item.format}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleFavorite(item.id)}
                            className={`p-1 rounded bg-black/75 border border-white/10 cursor-pointer ${
                              item.isFavorite
                                ? 'text-amber-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Marcar audiolibro como favorito"
                          >
                            <Star
                              className="w-3.5 h-3.5"
                              fill={item.isFavorite ? 'currentColor' : 'none'}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Avatar & Chapters Info */}
                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={item.avatarThumbUrl}
                            alt={item.avatarName}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-amber-400 shrink-0"
                          />
                          <div className="truncate">
                            <div className="text-[11px] font-semibold text-white truncate">
                              {item.avatarName}
                            </div>
                            <div className="text-[10px] font-mono text-slate-300">
                              {item.chaptersCount} cap. · ~{item.durationSec}s
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-300 bg-black/70 px-1.5 py-0.5 rounded">
                          {item.fileSizeLabel}
                        </span>
                      </div>
                    </div>

                    {/* Title, Folder Switcher & Timestamp */}
                    <div className="p-3.5 space-y-2">
                      {editingTitleId === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            className="flex-1 rounded bg-[#141824] border border-amber-500 px-2 py-1 text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (editingTitleValue.trim()) {
                                onRenameAudiobook(item.id, editingTitleValue.trim());
                              }
                              setEditingTitleId(null);
                            }}
                            className="px-2 py-1 rounded bg-amber-500 text-slate-950 text-[11px] font-semibold cursor-pointer"
                          >
                            Guardar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                            {item.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTitleId(item.id);
                              setEditingTitleValue(item.title);
                            }}
                            className="text-slate-400 hover:text-amber-300 shrink-0 cursor-pointer"
                            title="Renombrar audiolibro"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>{item.createdAt}</span>
                        <select
                          value={item.folderName}
                          onChange={(e) => onMoveToFolder(item.id, e.target.value)}
                          className="bg-[#141824] border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-amber-500"
                          title="Mover a otra carpeta"
                        >
                          {customFolders.map((f) => (
                            <option key={f} value={f}>
                              Mover a: {f}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Play MP3/MP4, Download MP3/MP4, Restore to Studio */}
                  <div className="p-3.5 pt-0 space-y-2">
                    {isBusy && (
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        <span>
                          {processingItemState?.action.includes('mp4')
                            ? `Preparando archivo MP4 (${processingItemState.progress}%)…`
                            : 'Preparando audio MP3 de alta calidad…'}
                        </span>
                      </div>
                    )}

                    {/* Row 1: Direct MP3 & MP4 Downloads */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadItemMedia(item, 'mp3')}
                        disabled={isBusy}
                        className="py-1.5 px-2.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Descargar .MP3</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadItemMedia(item, 'mp4')}
                        disabled={isBusy}
                        className="py-1.5 px-2.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Descargar .MP4</span>
                      </button>
                    </div>

                    {/* Row 2: Play in Folder (MP3 or MP4) */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePlayItemMedia(item, 'mp3')}
                        disabled={isBusy}
                        className="py-1.5 px-2 rounded bg-[#161A25] hover:bg-slate-800 border border-slate-800 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-emerald-400" />
                        <span>Oír MP3 aquí</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePlayItemMedia(item, 'mp4')}
                        disabled={isBusy}
                        className="py-1.5 px-2 rounded bg-[#161A25] hover:bg-slate-800 border border-slate-800 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Film className="w-3 h-3 text-amber-400" />
                        <span>Ver MP4 aquí</span>
                      </button>
                    </div>

                    {/* Row 3: Simple Subscribe Now Button */}
                    {onSellWithPayPal && (
                      <button
                        type="button"
                        onClick={() => onSellWithPayPal(item)}
                        className="w-full py-2 px-3 rounded-xl bg-[#FFC439] hover:bg-[#F2B729] text-[#003087] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <span>Suscríbete ahora</span>
                      </button>
                    )}

                    {/* Row 4: Restore to Studio for Editing + Delete */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-300">
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreAudiobookToStudio(item);
                          showToast(`Audiolibro "${item.title}" cargado en el estudio para editar.`);
                        }}
                        className="flex-1 py-2 px-2.5 rounded-md bg-[#0070BA] hover:bg-[#005EA6] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Abrir y Editar Audiolibro</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await deleteMediaBlobsFromIdb(item.id);
                          onDeleteAudiobook(item.id);
                          showToast('Audiolibro eliminado de la carpeta.');
                        }}
                        className="p-2 rounded-md bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 border border-slate-300 transition-colors cursor-pointer"
                        title="Eliminar de la carpeta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
