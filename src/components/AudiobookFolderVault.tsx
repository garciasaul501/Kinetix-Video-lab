import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
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
  Archive,
  CheckSquare,
  Square,
  Package,
  Layers,
  FileText,
  AlertCircle,
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

  // Batch selection and ZIP export state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchExportFormat, setBatchExportFormat] = useState<'BOTH' | 'MP4' | 'MP3'>('BOTH');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    currentIdx: number;
    currentItemTitle: string;
    currentStep: 'mp3' | 'mp4' | 'zip' | 'done';
    stepDescription: string;
    itemProgressPct: number;
    overallPercent: number;
    completedItems: { id: string; title: string; success: boolean; error?: string }[];
  } | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const showToast = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(null), 3500);
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

  // Helper to retrieve cached or generate fresh MP3 Blob for an audiobook
  const getOrGenerateMp3Blob = async (
    item: SavedAudiobookItem,
    onProgressUpdate?: (msg: string) => void
  ): Promise<Blob> => {
    const existingBlob = await getMediaBlobFromIdb(`${item.id}:mp3`);
    if (existingBlob) {
      return existingBlob;
    }

    onProgressUpdate?.(`Generando audio MP3 en alta fidelidad…`);
    const slug = (item.title || 'audiolibro')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 35);
    const filename = `${slug || 'audiolibro'}.mp3`;

    const avatarPreset =
      NARRATOR_AVATAR_PRESETS.find((a) => a.id === item.avatarId) ||
      NARRATOR_AVATAR_PRESETS[0];

    const { blob } = await downloadAudioAsMp3({
      audioBase64: item.audioBase64 || undefined,
      scriptText: item.videoBook.fullNarration,
      voiceGender: avatarPreset.gender,
      durationSec: item.durationSec || 36,
      filename,
      skipBrowserDownload: true,
    });

    await saveMediaBlobToIdb(`${item.id}:mp3`, blob);
    const sizeMb = Math.max(0.4, blob.size / (1024 * 1024)).toFixed(1);
    onMarkBlobCached(item.id, 'mp3', `${sizeMb} MB (MP3)`);
    return blob;
  };

  // Helper to retrieve cached or generate fresh MP4 Blob for an audiobook
  const getOrGenerateMp4Blob = async (
    item: SavedAudiobookItem,
    onPct?: (pct: number, msg: string) => void
  ): Promise<Blob> => {
    const existingBlob = await getMediaBlobFromIdb(`${item.id}:mp4`);
    if (existingBlob) {
      return existingBlob;
    }

    const avatarPreset: NarratorAvatarPreset =
      NARRATOR_AVATAR_PRESETS.find((a) => a.id === item.avatarId) ||
      NARRATOR_AVATAR_PRESETS[0];

    const mp4ObjectUrl = await renderVideoBookToMp4Url(
      item.videoBook,
      item.pageImages || {},
      item.audioBase64 || null,
      (pct) => onPct?.(pct, `Renderizando video MP4 (${pct}%)…`),
      {
        mode: item.visualMode || 'avatar-and-scenes',
        avatar: avatarPreset,
      }
    );

    const resp = await fetch(mp4ObjectUrl);
    const mp4Blob = await resp.blob();
    await saveMediaBlobToIdb(`${item.id}:mp4`, mp4Blob);
    const sizeMb = Math.max(1.2, mp4Blob.size / (1024 * 1024)).toFixed(1);
    onMarkBlobCached(item.id, 'mp4', `${sizeMb} MB (MP4)`);
    return mp4Blob;
  };

  const ensureMp3UrlForItem = async (
    item: SavedAudiobookItem,
    triggerBrowserDownload: boolean
  ): Promise<string> => {
    const slug = (item.title || 'audiolibro')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 35);
    const filename = `${slug || 'audiolibro'}.mp3`;

    const blob = await getOrGenerateMp3Blob(item);
    const url = URL.createObjectURL(blob);

    if (triggerBrowserDownload) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    return url;
  };

  const ensureMp4UrlForItem = async (
    item: SavedAudiobookItem,
    triggerBrowserDownload: boolean,
    onPct?: (pct: number) => void
  ): Promise<string> => {
    const slug = (item.title || 'audiolibro')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 35);
    const filename = `${slug || 'audiolibro'}-video.mp4`;

    const blob = await getOrGenerateMp4Blob(item, (pct) => onPct?.(pct));
    const url = URL.createObjectURL(blob);

    if (triggerBrowserDownload) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    return url;
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

  // Selection handlers
  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Batch Export to single ZIP Archive containing both MP3 and MP4 files
  const executeBatchExportZip = async () => {
    const itemsToExport = savedAudiobooks.filter((item) => selectedIds.includes(item.id));
    if (itemsToExport.length === 0) {
      showToast('Por favor selecciona al menos un audiolibro para exportar.');
      return;
    }

    isCancelledRef.current = false;
    setIsBatchModalOpen(true);

    const total = itemsToExport.length;
    const progressState: {
      total: number;
      currentIdx: number;
      currentItemTitle: string;
      currentStep: 'mp3' | 'mp4' | 'zip' | 'done';
      stepDescription: string;
      itemProgressPct: number;
      overallPercent: number;
      completedItems: { id: string; title: string; success: boolean; error?: string }[];
    } = {
      total,
      currentIdx: 0,
      currentItemTitle: itemsToExport[0]?.title || '',
      currentStep: 'mp3',
      stepDescription: 'Iniciando empaquetado del lote de audiolibros…',
      itemProgressPct: 0,
      overallPercent: 5,
      completedItems: [],
    };
    setBatchProgress({ ...progressState });

    try {
      const zip = new JSZip();
      const includeMp3 = batchExportFormat === 'BOTH' || batchExportFormat === 'MP3';
      const includeMp4 = batchExportFormat === 'BOTH' || batchExportFormat === 'MP4';

      // Summary text manifest inside the ZIP archive
      let batchManifestText = `========================================================================\n`;
      batchManifestText += `KINETIX VIDEO AI LAB - LOTE DE AUDIOLIBROS EXPORTADOS\n`;
      batchManifestText += `Fecha de exportación: ${new Date().toLocaleString()}\n`;
      batchManifestText += `Total de audiolibros en el lote: ${total}\n`;
      batchManifestText += `Formatos empaquetados: ${
        includeMp3 && includeMp4 ? 'MP3 + MP4 (Completo)' : includeMp4 ? 'Solo MP4' : 'Solo MP3'
      }\n`;
      batchManifestText += `========================================================================\n\n`;

      for (let i = 0; i < total; i++) {
        if (isCancelledRef.current) {
          showToast('Exportación del lote cancelada por el usuario.');
          setIsBatchModalOpen(false);
          setBatchProgress(null);
          return;
        }

        const item = itemsToExport[i];
        const itemNumberStr = String(i + 1).padStart(2, '0');
        const safeTitle = (item.title || `audiolibro-${itemNumberStr}`)
          .replace(/[\\/:*?"<>|]/g, '_')
          .trim()
          .slice(0, 48);

        const folderPath = `${itemNumberStr} - ${safeTitle}`;
        const itemFolder = zip.folder(folderPath);

        progressState.currentIdx = i + 1;
        progressState.currentItemTitle = item.title;
        progressState.itemProgressPct = 15;
        progressState.overallPercent = Math.round((i / total) * 82) + 5;
        setBatchProgress({ ...progressState });

        // Step 1: MP3 Audio
        if (includeMp3) {
          progressState.currentStep = 'mp3';
          progressState.stepDescription = `Obteniendo audio MP3 de "${item.title}"…`;
          setBatchProgress({ ...progressState });

          try {
            const mp3Blob = await getOrGenerateMp3Blob(item, (msg) => {
              progressState.stepDescription = msg;
              setBatchProgress({ ...progressState });
            });
            const mp3Filename = `${safeTitle}.mp3`;
            itemFolder?.file(mp3Filename, mp3Blob);
          } catch (err: any) {
            console.error(`Error procesando MP3 para ${item.title}:`, err);
          }
        }

        if (isCancelledRef.current) break;

        // Step 2: MP4 Video
        if (includeMp4) {
          progressState.currentStep = 'mp4';
          progressState.stepDescription = `Renderizando video MP4 de "${item.title}"…`;
          progressState.itemProgressPct = 35;
          setBatchProgress({ ...progressState });

          try {
            const mp4Blob = await getOrGenerateMp4Blob(item, (pct, msg) => {
              progressState.itemProgressPct = 30 + Math.round((pct / 100) * 60);
              progressState.stepDescription = `${msg} · "${item.title}"`;
              setBatchProgress({ ...progressState });
            });
            const mp4Filename = `${safeTitle}-video.mp4`;
            itemFolder?.file(mp4Filename, mp4Blob);
          } catch (err: any) {
            console.error(`Error procesando MP4 para ${item.title}:`, err);
          }
        }

        // Step 3: Info & narration document for this audiobook
        const itemInfo =
          `Audiolibro: ${item.title}\n` +
          `Subtítulo: ${item.subtitle}\n` +
          `Carpeta: ${item.folderName}\n` +
          `Duración estimada: ~${item.durationSec}s\n` +
          `Capítulos: ${item.chaptersCount}\n` +
          `Avatar Narrador: ${item.avatarName}\n` +
          `Fecha de creación: ${item.createdAt}\n\n` +
          `--- NARRACIÓN COMPLETA ---\n${item.videoBook.fullNarration}\n\n` +
          `--- DETALLE DE CAPÍTULOS ---\n` +
          item.videoBook.pages
            .map(
              (p) =>
                `Capítulo ${p.pageNumber}: ${p.chapterTitle} (~${p.durationSec}s)\n` +
                `Cita destacada: "${p.keyQuote}"\n` +
                `Texto del capítulo:\n${p.pageText}\n`
            )
            .join('\n----------------------------------------\n');

        itemFolder?.file('guion-y-capitulos.txt', itemInfo);

        // Update master manifest
        batchManifestText += `[${itemNumberStr}] ${item.title}\n`;
        batchManifestText += `    Subtítulo: ${item.subtitle}\n`;
        batchManifestText += `    Carpeta: ${item.folderName} | Capítulos: ${item.chaptersCount} | Duración: ~${item.durationSec}s\n`;
        batchManifestText += `    Avatar Narrador: ${item.avatarName}\n`;
        batchManifestText += `    Archivos: ${includeMp3 ? `${safeTitle}.mp3, ` : ''}${includeMp4 ? `${safeTitle}-video.mp4, ` : ''}guion-y-capitulos.txt\n\n`;

        progressState.completedItems.push({
          id: item.id,
          title: item.title,
          success: true,
        });
        progressState.overallPercent = Math.round(((i + 1) / total) * 82) + 5;
        setBatchProgress({ ...progressState });
      }

      if (isCancelledRef.current) {
        showToast('Exportación del lote cancelada.');
        setIsBatchModalOpen(false);
        setBatchProgress(null);
        return;
      }

      // Add the master manifest file to the ZIP root
      zip.file('RESUMEN-LOTE-AUDIOLIBROS.txt', batchManifestText);

      // Step 4: Generate the final ZIP file
      progressState.currentStep = 'zip';
      progressState.stepDescription = 'Comprimiendo todos los audiolibros en el archivo ZIP…';
      progressState.itemProgressPct = 85;
      progressState.overallPercent = 90;
      setBatchProgress({ ...progressState });

      const zipBlob = await zip.generateAsync(
        {
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        },
        (metadata) => {
          progressState.itemProgressPct = Math.round(metadata.percent);
          progressState.overallPercent = 88 + Math.round((metadata.percent / 100) * 11);
          progressState.stepDescription = `Comprimiendo archivo ZIP (${Math.round(metadata.percent)}%)…`;
          setBatchProgress({ ...progressState });
        }
      );

      // Step 5: Trigger browser download
      const dateSlug = new Date().toISOString().slice(0, 10);
      const zipFilename = `Kinetix-Audiolibros-Lote-${itemsToExport.length}-libros-${dateSlug}.zip`;
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      progressState.currentStep = 'done';
      progressState.stepDescription = `¡Descarga completa! Se exportaron ${itemsToExport.length} audiolibros con archivos MP3 y MP4.`;
      progressState.overallPercent = 100;
      setBatchProgress({ ...progressState });

      const mbSize = (zipBlob.size / (1024 * 1024)).toFixed(1);
      showToast(`Archivo ZIP "${zipFilename}" descargado con éxito (${mbSize} MB).`);

      setTimeout(() => {
        setIsBatchModalOpen(false);
        setBatchProgress(null);
      }, 2500);
    } catch (err: any) {
      console.error('Error generando archivo ZIP del lote:', err);
      showToast('Ocurrió un error al generar el archivo ZIP del lote.');
      setIsBatchModalOpen(false);
      setBatchProgress(null);
    }
  };

  const handleCancelBatchExport = () => {
    isCancelledRef.current = true;
    showToast('Cancelando exportación del lote…');
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

        {/* Format, Batch Selection & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Select All Toggle */}
          {filteredItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const visibleIds = filteredItems.map((i) => i.id);
                const allSelected = visibleIds.every((id) => selectedIds.includes(id));
                if (allSelected) {
                  setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
                } else {
                  setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
                }
              }}
              className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                filteredItems.length > 0 && filteredItems.every((i) => selectedIds.includes(i.id))
                  ? 'bg-amber-400 text-slate-950 border-amber-400'
                  : 'bg-[#151822] text-slate-300 hover:text-white border-slate-700 hover:border-slate-500'
              }`}
              title="Seleccionar o deseleccionar todos los audiolibros visibles para exportación en lote"
            >
              {filteredItems.length > 0 && filteredItems.every((i) => selectedIds.includes(i.id)) ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-slate-950" />
                  <span>Deseleccionar Visibles</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Seleccionar Visibles ({filteredItems.length})</span>
                </>
              )}
            </button>
          )}

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

      {/* Batch Export Action Bar (Visible when 1 or more audiobooks are selected) */}
      {selectedIds.length > 0 && (
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/20 via-[#182030] to-emerald-500/20 border-b border-amber-500/50 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/30 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {selectedIds.length} {selectedIds.length === 1 ? 'audiolibro seleccionado' : 'audiolibros seleccionados'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wide">
                  Lote para ZIP
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Exporta el lote completo en un solo archivo comprimido <strong>.ZIP</strong> conteniendo archivos <strong>MP3</strong> y <strong>MP4</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Format Selector inside ZIP */}
            <div className="flex items-center gap-1 bg-black/60 border border-slate-700 rounded-lg p-1">
              {(['BOTH', 'MP4', 'MP3'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setBatchExportFormat(fmt)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    batchExportFormat === fmt
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title={
                    fmt === 'BOTH'
                      ? 'Incluir tanto archivos MP3 como MP4 en el ZIP'
                      : fmt === 'MP4'
                      ? 'Incluir solo videos MP4 en el ZIP'
                      : 'Incluir solo pistas de audio MP3 en el ZIP'
                  }
                >
                  {fmt === 'BOTH' ? 'MP3 + MP4 (Completo)' : fmt === 'MP4' ? 'Solo MP4' : 'Solo MP3'}
                </button>
              ))}
            </div>

            {/* Execute ZIP Batch Export Button */}
            <button
              type="button"
              onClick={executeBatchExportZip}
              disabled={batchProgress !== null}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md hover:shadow-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
              title="Comenzar empaquetado y descarga del lote en un único archivo ZIP"
            >
              {batchProgress ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Empaquetando Lote ({batchProgress.overallPercent}%)…</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 text-slate-950" />
                  <span>Exportar Lote en ZIP ({selectedIds.length})</span>
                </>
              )}
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium cursor-pointer transition-colors"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

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
              const isSelected = selectedIds.includes(item.id);
              return (
                <article
                  key={item.id}
                  className={`portada-neon-card rounded-xl overflow-hidden flex flex-col justify-between transition-all bg-black ${
                    isSelected
                      ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-xl shadow-amber-500/20'
                      : 'border border-amber-400/50 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                  }`}
                >
                  <div>
                    {/* Cover Scene + Avatar Overlay */}
                    <div className="relative h-36 bg-black overflow-hidden border-b border-amber-500/30">
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                      {/* Top Metadata Row with Checkbox for Batch Selection */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectItem(item.id);
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 ring-2 ring-white shadow-md'
                                : 'bg-black/80 hover:bg-black text-slate-200 border border-white/20'
                            }`}
                            title={
                              isSelected
                                ? 'Deseleccionar de lote ZIP'
                                : 'Seleccionar para exportación en lote ZIP'
                            }
                          >
                            {isSelected ? (
                              <CheckSquare className="w-3.5 h-3.5 text-slate-950" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="font-mono text-[10px]">
                              {isSelected ? 'LOTE ✓' : 'LOTE'}
                            </span>
                          </button>

                          <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-amber-300 border border-amber-500/30 truncate max-w-[110px]">
                            📁 {item.folderName}
                          </span>
                        </div>

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
                          <h3 className="text-sm font-black text-white leading-snug line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
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

      {/* Batch Export Progress & Status Modal */}
      {isBatchModalOpen && batchProgress && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0F121C] border border-amber-500/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Exportando Lote en Archivo ZIP</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black uppercase">
                      {batchExportFormat === 'BOTH' ? 'MP3 + MP4' : batchExportFormat === 'MP4' ? 'Solo MP4' : 'Solo MP3'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Procesando {batchProgress.total} {batchProgress.total === 1 ? 'audiolibro' : 'audiolibros'} con pistas MP3 y videos MP4
                  </p>
                </div>
              </div>

              {batchProgress.currentStep === 'done' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsBatchModalOpen(false);
                    setBatchProgress(null);
                  }}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-2 bg-[#090B10] p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  {batchProgress.currentStep === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  )}
                  <span>
                    {batchProgress.currentStep === 'done'
                      ? 'Lote Completado al 100%'
                      : `Audiolibro ${batchProgress.currentIdx} de ${batchProgress.total}`}
                  </span>
                </span>
                <span className="text-white font-black text-sm">{batchProgress.overallPercent}%</span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-300 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(5, Math.min(100, batchProgress.overallPercent))}%` }}
                />
              </div>

              <p className="text-xs text-slate-300 truncate font-mono pt-1">
                {batchProgress.stepDescription}
              </p>
            </div>

            {/* Current Item Card Indicator */}
            {batchProgress.currentStep !== 'done' && (
              <div className="bg-[#141824] border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-mono text-amber-300 uppercase tracking-wide flex items-center justify-between">
                  <span>Audiolibro en proceso:</span>
                  <span className="text-slate-400">
                    Paso: {batchProgress.currentStep === 'mp3' ? 'Audio MP3' : batchProgress.currentStep === 'mp4' ? 'Video MP4' : 'Empaquetado ZIP'}
                  </span>
                </div>
                <div className="text-sm font-bold text-white truncate">
                  "{batchProgress.currentItemTitle}"
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                  <div
                    className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                      batchProgress.currentStep === 'mp3'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-black/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <FileAudio className="w-3.5 h-3.5 shrink-0" />
                    <span>Pista de Audio MP3</span>
                  </div>

                  <div
                    className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                      batchProgress.currentStep === 'mp4'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-black/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <FileVideo className="w-3.5 h-3.5 shrink-0" />
                    <span>Video-Libro MP4</span>
                  </div>
                </div>
              </div>
            )}

            {/* Checklist of Items */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {savedAudiobooks
                .filter((item) => selectedIds.includes(item.id))
                .map((item, idx) => {
                  const isDone = batchProgress.completedItems.some((c) => c.id === item.id);
                  const isCurrent = batchProgress.currentIdx === idx + 1 && !isDone;
                  return (
                    <div
                      key={item.id}
                      className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : isCurrent
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                          : 'bg-[#0B0D13] border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] opacity-70">0{idx + 1}</span>
                        <span className="font-medium truncate">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-mono shrink-0">
                        {isDone ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            MP3 + MP4
                          </span>
                        ) : isCurrent ? (
                          <span className="text-amber-300 animate-pulse">Procesando…</span>
                        ) : (
                          <span className="text-slate-500">En cola</span>
                        )}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              {batchProgress.currentStep !== 'done' ? (
                <button
                  type="button"
                  onClick={handleCancelBatchExport}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cancelar Lote
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsBatchModalOpen(false);
                    setBatchProgress(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aceptar y Cerrar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
