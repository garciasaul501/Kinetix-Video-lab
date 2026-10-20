import React, { useState } from 'react';
import {
  History,
  Save,
  RotateCcw,
  Film,
  Mic,
  Edit3,
  Copy,
  Trash2,
  Star,
  Plus,
  Check,
  Search,
  Clock,
  Sparkles,
  BookOpen,
  FileDown,
  FileText,
} from 'lucide-react';
import {
  SavedTwoMinuteScript,
  GeneratedScriptData,
  ScriptSceneData,
} from '../utils/studioStorage';

interface ScriptHistoryVaultProps {
  historyItems: SavedTwoMinuteScript[];
  activeVersionId: string | null;
  currentScript: GeneratedScriptData;
  currentTopic: string;
  currentTone: string;
  currentAudience: string;
  onSaveNewVersion: (notes?: string) => void;
  onUpdateActiveVersion: (notes?: string) => void;
  onRestoreVersion: (item: SavedTwoMinuteScript, openEditor?: boolean) => void;
  onDuplicateVersion: (item: SavedTwoMinuteScript) => void;
  onDeleteVersion: (id: string) => void;
  onToggleFavoriteVersion: (id: string) => void;
  onGenerateClipsFromVersion: (item: SavedTwoMinuteScript) => void;
  onSendVersionToNarration: (item: SavedTwoMinuteScript) => void;
  onConvertVersionToAudiobook: (item: SavedTwoMinuteScript) => void;
  onExportVersionPdf: (item: SavedTwoMinuteScript) => void;
  onExportVersionTxt: (item: SavedTwoMinuteScript) => void;
}

export const ScriptHistoryVault: React.FC<ScriptHistoryVaultProps> = ({
  historyItems,
  activeVersionId,
  currentScript,
  onSaveNewVersion,
  onUpdateActiveVersion,
  onRestoreVersion,
  onDuplicateVersion,
  onDeleteVersion,
  onToggleFavoriteVersion,
  onGenerateClipsFromVersion,
  onSendVersionToNarration,
  onConvertVersionToAudiobook,
  onExportVersionPdf,
  onExportVersionTxt,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [versionNote, setVersionNote] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(
    historyItems[0]?.id || null
  );
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const triggerFeedback = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 2800);
  };

  const filteredHistory = historyItems.filter((item) => {
    if (onlyFavorites && !item.isFavorite) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.script.title.toLowerCase().includes(q);
      const matchTopic = item.topic.toLowerCase().includes(q);
      const matchVer = item.versionLabel.toLowerCase().includes(q);
      const matchVo = item.script.fullNarration.toLowerCase().includes(q);
      if (!matchTitle && !matchTopic && !matchVer && !matchVo) return false;
    }
    return true;
  });

  return (
    <div className="bg-[#111318] border border-amber-500/35 rounded-xl overflow-hidden flex flex-col">
      {/* Top Bar: Save Current 2-Minute Script to History */}
      <div className="p-5 bg-[#0C0E14] border-b border-white/8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <History className="w-4 h-4" />
            <span>HISTORIAL DE GUIONES DE 2 MINUTOS · CONTROL DE VERSIONES</span>
            <span>·</span>
            <span className="text-emerald-400">{historyItems.length} guardados</span>
          </div>
          <h2 className="font-display text-lg font-bold text-white mt-0.5">
            Guarda, Recupera, Edita o Genera Clips de Versiones Anteriores
          </h2>
          <p className="text-xs text-slate-400">
            Cada guion de 2 minutos generado se guarda automáticamente aquí. Puedes restaurar cualquier versión previa para editar sus escenas o enviarla directo al generador de clips MP4.
          </p>
        </div>

        {/* Save Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={versionNote}
            onChange={(e) => setVersionNote(e.target.value)}
            placeholder="Nota de versión (ej. Gancho más rápido)..."
            className="px-3 py-2 rounded-lg bg-[#141822] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 min-w-[210px]"
          />

          <button
            type="button"
            onClick={() => {
              onSaveNewVersion(versionNote.trim() || undefined);
              setVersionNote('');
              triggerFeedback(
                `Guardado "${currentScript.title.slice(0, 28)}…" como nueva versión en el historial.`
              );
            }}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar como Nueva Versión</span>
          </button>

          {activeVersionId && (
            <button
              type="button"
              onClick={() => {
                onUpdateActiveVersion(versionNote.trim() || undefined);
                setVersionNote('');
                triggerFeedback('Versión seleccionada actualizada con tus cambios.');
              }}
              className="px-3 py-2 rounded-lg bg-[#181C26] hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Actualizar Versión Activa</span>
            </button>
          )}
        </div>
      </div>

      {savedFeedback && (
        <div className="px-5 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="px-5 py-3 bg-[#0E1017] border-b border-white/6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyFavorites(false)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              !onlyFavorites
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-[#161922] text-slate-400 hover:text-white'
            }`}
          >
            Todas las Versiones ({historyItems.length})
          </button>
          <button
            type="button"
            onClick={() => setOnlyFavorites(true)}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              onlyFavorites
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-[#161922] text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3 h-3" />
            <span>Favoritos ({historyItems.filter((i) => i.isFavorite).length})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en guiones anteriores por tema o título..."
            className="w-full pl-8 pr-3 py-1.5 rounded bg-[#090B10] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* History Versions List */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto">
        {filteredHistory.map((item) => {
          const isCurrent = item.id === activeVersionId;
          const isExpanded = expandedId === item.id;
          return (
            <article
              key={item.id}
              className={`rounded-lg border p-4 flex flex-col justify-between gap-3 transition-colors ${
                isCurrent
                  ? 'bg-amber-500/10 border-amber-500/60'
                  : 'bg-[#0B0D13] border-white/10 hover:border-amber-500/40'
              }`}
            >
              <div className="space-y-2">
                {/* Top Version Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-amber-400 font-bold">{item.versionLabel}</span>
                    {isCurrent && (
                      <span className="text-emerald-400 font-semibold">· En edición</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-slate-400">
                      {item.updatedAt}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleFavoriteVersion(item.id)}
                      className={`p-1 rounded cursor-pointer ${
                        item.isFavorite
                          ? 'text-amber-400'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Marcar versión como favorita"
                    >
                      <Star
                        className="w-3.5 h-3.5"
                        fill={item.isFavorite ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>
                </div>

                {/* Script Title & Metadata */}
                <div>
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {item.script.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                    Tema: <span className="text-slate-300">{item.topic}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>{item.script.scenes.length} escenas</span>
                  <span>·</span>
                  <span>{item.script.totalDuration}</span>
                  <span>·</span>
                  <span>Tono: {item.tone}</span>
                </div>

                {item.notes && (
                  <div className="text-[11px] text-amber-200/90 bg-[#141824] border border-amber-500/20 rounded px-2.5 py-1.5">
                    Nota: {item.notes}
                  </div>
                )}

                {/* Preview Scenes Toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="text-[11px] text-amber-400 hover:underline font-medium cursor-pointer"
                  >
                    {isExpanded
                      ? 'Ocultar resumen de escenas ▲'
                      : `Ver las ${item.script.scenes.length} escenas y locución ▼`}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-2.5 rounded bg-[#080A0E] border border-white/8 space-y-1.5 max-h-40 overflow-y-auto text-[11px]">
                      <p className="text-slate-300 italic leading-relaxed">
                        “{item.script.fullNarration.slice(0, 180)}…”
                      </p>
                      <div className="border-t border-white/6 pt-1.5 space-y-1">
                        {item.script.scenes.map((sc: ScriptSceneData) => (
                          <div
                            key={sc.sceneNumber}
                            className="flex items-start justify-between gap-2 text-slate-400"
                          >
                            <span className="truncate">
                              <strong className="text-amber-400 font-mono">
                                0{sc.sceneNumber}.
                              </strong>{' '}
                              {sc.title}
                            </span>
                            <span className="font-mono text-[10px] shrink-0">
                              {sc.timecode}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Restore/Edit, Generate Clips, Narrate, Export */}
              <div className="space-y-1.5 pt-2 border-t border-white/8">
                {/* Primary Row: Restore to Edit + Generate Clips from this version */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreVersion(item, true);
                      triggerFeedback(
                        `Versión "${item.versionLabel}" cargada y lista para editar.`
                      );
                    }}
                    className="py-1.5 px-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Recuperar y Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onGenerateClipsFromVersion(item)}
                    className="py-1.5 px-2.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Generar secuencia de clips MP4 a partir de las escenas de esta versión"
                  >
                    <Film className="w-3 h-3" />
                    <span>Generar Clips MP4</span>
                  </button>
                </div>

                {/* Secondary Row: Send to Voiceover, Convert to Audiobook, Duplicate, Export, Delete */}
                <div className="flex flex-wrap items-center justify-between gap-1 pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSendVersionToNarration(item)}
                      className="px-2 py-1 rounded bg-[#161922] hover:bg-slate-800 text-[11px] text-slate-300 hover:text-amber-300 border border-white/8 flex items-center gap-1 cursor-pointer"
                      title="Enviar esta versión al Estudio de Locución IA"
                    >
                      <Mic className="w-3 h-3 text-amber-400" />
                      <span>Locutar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onConvertVersionToAudiobook(item)}
                      className="px-2 py-1 rounded bg-[#161922] hover:bg-slate-800 text-[11px] text-slate-300 hover:text-amber-300 border border-white/8 flex items-center gap-1 cursor-pointer"
                      title="Convertir esta versión de guion en un Audiolibro con Capítulos"
                    >
                      <BookOpen className="w-3 h-3 text-emerald-400" />
                      <span>A Audiolibro</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onDuplicateVersion(item);
                        triggerFeedback(`Copia creada a partir de ${item.versionLabel}.`);
                      }}
                      className="px-2 py-1 rounded bg-[#161922] hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-white/8 flex items-center gap-1 cursor-pointer"
                      title="Duplicar esta versión para crear una variante"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Clonar</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onExportVersionPdf(item)}
                      className="p-1 rounded bg-[#161922] hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-white/8 cursor-pointer"
                      title="Descargar PDF de esta versión"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportVersionTxt(item)}
                      className="p-1 rounded bg-[#161922] hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-white/8 cursor-pointer"
                      title="Descargar TXT de esta versión"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    {historyItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteVersion(item.id)}
                        className="p-1 rounded bg-[#161922] hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/8 cursor-pointer"
                        title="Eliminar esta versión del historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
