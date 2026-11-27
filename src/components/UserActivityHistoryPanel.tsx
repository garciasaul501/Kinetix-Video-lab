import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  History,
  Headphones,
  FileText,
  Film,
  Download,
  Trash2,
  HardDrive,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import {
  ActivityAssetCategory,
  UserActivityExportRecord,
  SavedAudiobookItem,
  SavedTwoMinuteScript,
  listActivityExportsFromIdb,
  downloadActivityExportFromIdb,
  deleteActivityExportFromIdb,
  getMediaBlobFromIdb,
  buildScriptExportBlob,
} from '../utils/studioStorage';

interface UserActivityHistoryPanelProps {
  refreshTrigger?: number;
  savedAudiobooks?: SavedAudiobookItem[];
  scriptHistory?: SavedTwoMinuteScript[];
  onNotify?: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
}

type CategoryFilter = 'all' | ActivityAssetCategory;

interface UnifiedHistoryItem {
  id: string;
  source: 'idb_activity' | 'vault_audiobook' | 'local_script';
  category: ActivityAssetCategory;
  title: string;
  subtitle: string;
  format: string;
  fileName: string;
  sizeBytes: number;
  createdAtMs: number;
  dateLabel: string;
  moduleLabel: string;
  storedInIdb: boolean;
  idbRecord?: UserActivityExportRecord;
  vaultBlobKey?: string;
  scriptItem?: SavedTwoMinuteScript;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Listo para descargar';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatChronologicalDate(ms: number): string {
  if (!ms || ms <= 0) return 'Reciente';
  const date = new Date(ms);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (isToday) return `Hoy · ${timeStr}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return `Ayer · ${timeStr}`;

  return `${date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} · ${timeStr}`;
}

function slugifyFile(title: string): string {
  return (
    (title || 'archivo-kinetix')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 44) || 'archivo-kinetix'
  );
}

export const UserActivityHistoryPanel: React.FC<UserActivityHistoryPanelProps> = ({
  refreshTrigger = 0,
  savedAudiobooks = [],
  scriptHistory = [],
  onNotify,
}) => {
  const [idbRecords, setIdbRecords] = useState<UserActivityExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inlineNotice, setInlineNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await listActivityExportsFromIdb();
      setIdbRecords(list);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords, refreshTrigger]);

  // Combine dedicated IndexedDB activity_history records + legacy IndexedDB audiobook blobs + saved scripts
  const unifiedItems = useMemo<UnifiedHistoryItem[]>(() => {
    const items: UnifiedHistoryItem[] = [];
    const trackedBlobKeys = new Set<string>();

    for (const rec of idbRecords) {
      trackedBlobKeys.add(rec.blobKey);
      items.push({
        id: rec.id,
        source: 'idb_activity',
        category: rec.category,
        title: rec.title,
        subtitle: rec.subtitle,
        format: rec.format,
        fileName: rec.fileName,
        sizeBytes: rec.sizeBytes,
        createdAtMs: rec.createdAtMs,
        dateLabel: formatChronologicalDate(rec.createdAtMs),
        moduleLabel: rec.moduleLabel,
        storedInIdb: true,
        idbRecord: rec,
      });
    }

    // Bridge any previously saved IndexedDB audiobook vault blobs not yet in activity_history
    savedAudiobooks.forEach((ab, idx) => {
      const baseTs = Number(ab.id.match(/(\d{12,14})/)?.[1] || Date.now() - (idx + 1) * 3600000);
      if (ab.hasMp4Blob && !trackedBlobKeys.has(`${ab.id}:mp4`)) {
        items.push({
          id: `vault-mp4-${ab.id}`,
          source: 'vault_audiobook',
          category: 'video',
          title: ab.title,
          subtitle: `${ab.chaptersCount} capítulos · ${ab.folderName}`,
          format: 'MP4',
          fileName: `${slugifyFile(ab.title)}.mp4`,
          sizeBytes: 0,
          createdAtMs: baseTs,
          dateLabel: ab.createdAt || formatChronologicalDate(baseTs),
          moduleLabel: 'Audiolibros IA (Bóveda)',
          storedInIdb: true,
          vaultBlobKey: `${ab.id}:mp4`,
        });
      }
      if (ab.hasMp3Blob && !trackedBlobKeys.has(`${ab.id}:mp3`)) {
        items.push({
          id: `vault-mp3-${ab.id}`,
          source: 'vault_audiobook',
          category: 'audiobook',
          title: ab.title,
          subtitle: `${ab.chaptersCount} capítulos · ${ab.avatarName}`,
          format: 'MP3',
          fileName: `${slugifyFile(ab.title)}.mp3`,
          sizeBytes: 0,
          createdAtMs: baseTs - 1000,
          dateLabel: ab.createdAt || formatChronologicalDate(baseTs),
          moduleLabel: 'Audiolibros IA (Bóveda)',
          storedInIdb: true,
          vaultBlobKey: `${ab.id}:mp3`,
        });
      }
    });

    // Bridge saved 2-minute script versions that aren't already archived by exact title+script
    const archivedScriptTitles = new Set(
      idbRecords.filter((r) => r.category === 'script').map((r) => r.title.toLowerCase())
    );
    scriptHistory.forEach((sc, idx) => {
      const title = sc.script?.title || sc.versionLabel;
      if (archivedScriptTitles.has(title.toLowerCase())) return;
      const baseTs = Number(sc.id.match(/(\d{12,14})/)?.[1] || Date.now() - (idx + 5) * 600000);
      items.push({
        id: `local-script-${sc.id}`,
        source: 'local_script',
        category: 'script',
        title,
        subtitle: `${sc.versionLabel} · ${sc.script?.scenes?.length || 0} escenas`,
        format: 'TXT',
        fileName: `${slugifyFile(title)}.txt`,
        sizeBytes: 0,
        createdAtMs: baseTs,
        dateLabel: sc.updatedAt || sc.createdAt || formatChronologicalDate(baseTs),
        moduleLabel: 'Guion 2 Minutos',
        storedInIdb: false,
        scriptItem: sc,
      });
    });

    items.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    return items;
  }, [idbRecords, savedAudiobooks, scriptHistory]);

  const counts = useMemo(() => {
    const audiobooks = unifiedItems.filter((i) => i.category === 'audiobook').length;
    const scripts = unifiedItems.filter((i) => i.category === 'script').length;
    const videos = unifiedItems.filter((i) => i.category === 'video').length;
    const totalIdbBytes = idbRecords.reduce((acc, r) => acc + (r.sizeBytes || 0), 0);
    return {
      all: unifiedItems.length,
      audiobook: audiobooks,
      script: scripts,
      video: videos,
      totalIdbBytes,
    };
  }, [unifiedItems, idbRecords]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return unifiedItems.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (q) {
        const hay = `${item.title} ${item.subtitle} ${item.format} ${item.moduleLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [unifiedItems, categoryFilter, searchQuery]);

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleDownloadAgain = async (item: UnifiedHistoryItem) => {
    setDownloadingId(item.id);
    setInlineNotice(null);
    try {
      let ok = false;
      if (item.source === 'idb_activity' && item.idbRecord) {
        ok = await downloadActivityExportFromIdb(item.idbRecord);
      } else if (item.source === 'vault_audiobook' && item.vaultBlobKey) {
        const blob = await getMediaBlobFromIdb(item.vaultBlobKey);
        if (blob) {
          triggerBlobDownload(blob, item.fileName);
          ok = true;
        }
      } else if (item.source === 'local_script' && item.scriptItem) {
        const blob = buildScriptExportBlob(item.scriptItem.script, {
          topic: item.scriptItem.topic,
          tone: item.scriptItem.tone,
          targetAudience: item.scriptItem.targetAudience,
        });
        triggerBlobDownload(blob, item.fileName);
        ok = true;
      }

      if (ok) {
        setDownloadedId(item.id);
        setInlineNotice({
          type: 'success',
          text: `Descarga iniciada: "${item.fileName}" desde el almacenamiento local.`,
        });
        onNotify?.('Archivo descargado', `Se descargó "${item.fileName}" nuevamente.`, 'success');
        setTimeout(() => setDownloadedId((prev) => (prev === item.id ? null : prev)), 2500);
      } else {
        setInlineNotice({
          type: 'error',
          text: 'El archivo binario ya no se encuentra en IndexedDB (el navegador pudo limpiar la caché).',
        });
        onNotify?.(
          'Archivo no disponible',
          'Este archivo ya no está en la caché local de IndexedDB.',
          'error'
        );
      }
    } catch {
      setInlineNotice({
        type: 'error',
        text: 'No se pudo recuperar el archivo desde IndexedDB.',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteRecord = async (item: UnifiedHistoryItem) => {
    if (item.source !== 'idb_activity' || !item.idbRecord) return;
    setDeletingId(item.id);
    try {
      await deleteActivityExportFromIdb(item.idbRecord);
      setIdbRecords((prev) => prev.filter((r) => r.id !== item.id));
      setInlineNotice({
        type: 'success',
        text: `Se eliminó "${item.title}" del historial de IndexedDB.`,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryMeta = (cat: ActivityAssetCategory) => {
    switch (cat) {
      case 'audiobook':
        return {
          label: 'Audiolibro',
          icon: Headphones,
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
          iconBoxClass: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'script':
        return {
          label: 'Guion',
          icon: FileText,
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
          iconBoxClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
      case 'video':
        return {
          label: 'Video',
          icon: Film,
          badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          iconBoxClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Storage Summary Header */}
      <div className="p-3.5 rounded-2xl bg-slate-950 text-white border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-white flex items-center gap-2">
              <span>Bóveda Local IndexedDB</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                {idbRecords.length} archivos en IDB
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Espacio usado: <strong className="text-amber-300 font-mono">{formatBytes(counts.totalIdbBytes)}</strong> · Descarga tus exportaciones sin volver a generar
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadRecords()}
          disabled={isLoading}
          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Actualizar historial desde IndexedDB"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Category Filter Pills + Search */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: `Todos (${counts.all})` },
              { id: 'audiobook', label: `Audiolibros (${counts.audiobook})` },
              { id: 'script', label: `Guiones (${counts.script})` },
              { id: 'video', label: `Videos (${counts.video})` },
            ] as { id: CategoryFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-slate-950 text-amber-300 border-slate-950'
                  : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por título, formato (MP4, MP3, TXT, PDF) o módulo..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {inlineNotice && (
        <div
          className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            inlineNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {inlineNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{inlineNotice.text}</span>
        </div>
      )}

      {/* Chronological Timeline List */}
      <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2.5">
        {isLoading ? (
          <div className="py-10 text-center text-xs text-slate-500 space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600 mx-auto" />
            <p>Leyendo tus archivos exportados desde IndexedDB...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-10 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
            <History className="w-7 h-7 text-slate-400 mx-auto" />
            <div className="text-xs font-extrabold text-slate-800">
              {unifiedItems.length === 0
                ? 'Todavía no tienes archivos exportados en tu historial'
                : 'No hay resultados para este filtro'}
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Cada vez que exportes un audiolibro (MP3/MP4), un guion (TXT/PDF) o un video desde el estudio, se guardará automáticamente en IndexedDB para descargarlo de nuevo cuando quieras.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const meta = getCategoryMeta(item.category);
            const Icon = meta.icon;
            const isDownloading = downloadingId === item.id;
            const isDownloaded = downloadedId === item.id;
            const isDeleting = deletingId === item.id;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.iconBoxClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-extrabold text-slate-950 truncate max-w-[240px]">
                        {item.title}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md border text-[10px] font-extrabold uppercase ${meta.badgeClass}`}
                      >
                        {meta.label} · {item.format}
                      </span>
                      {item.storedInIdb && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          IndexedDB
                        </span>
                      )}
                    </div>

                    {item.subtitle && (
                      <p className="text-[11px] text-slate-600 truncate max-w-[340px]">
                        {item.subtitle}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-mono text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.dateLabel}
                      </span>
                      <span>·</span>
                      <span>{item.moduleLabel}</span>
                      <span>·</span>
                      <span>{formatBytes(item.sizeBytes)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={() => void handleDownloadAgain(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                      isDownloaded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-950 hover:bg-slate-800 text-amber-300'
                    }`}
                    title={`Descargar nuevamente ${item.fileName}`}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isDownloaded ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{isDownloaded ? 'Descargado' : 'Descargar'}</span>
                  </button>

                  {item.source === 'idb_activity' && (
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => void handleDeleteRecord(item)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                      title="Eliminar del historial IndexedDB"
                      aria-label="Eliminar archivo del historial"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
