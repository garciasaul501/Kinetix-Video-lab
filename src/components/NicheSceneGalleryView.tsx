import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Sparkles,
  Check,
  Maximize2,
  X,
  Download,
  BookOpen,
  Film,
  ChevronDown,
  Loader2,
  Eye,
} from 'lucide-react';
import {
  NICHE_SCENE_LIBRARY_1200,
  SCENE_NICHE_CATEGORIES,
  SceneNicheCategory,
  NicheScenePhoto,
} from '../utils/nicheSceneLibrary';

interface NicheSceneGalleryViewProps {
  activeChapterNumber: number;
  activeChapterTitle: string;
  currentChapterImageUrl?: string;
  totalChapters: number;
  onSelectPhotoForChapter: (photo: NicheScenePhoto) => void;
  onAutoFillAllChaptersWithNiche: (niche?: 'Auto' | SceneNicheCategory) => void;
  onUsePhotoInSequenceShot?: (photo: NicheScenePhoto) => void;
  onGenerateAiVariantForPhoto?: (photo: NicheScenePhoto) => void;
  generatingPhotoId?: string | null;
}

export const NicheSceneGalleryView: React.FC<NicheSceneGalleryViewProps> = ({
  activeChapterNumber,
  activeChapterTitle,
  currentChapterImageUrl,
  totalChapters,
  onSelectPhotoForChapter,
  onAutoFillAllChaptersWithNiche,
  onUsePhotoInSequenceShot,
  onGenerateAiVariantForPhoto,
  generatingPhotoId,
}) => {
  const [selectedNiche, setSelectedNiche] = useState<'Todos' | SceneNicheCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(60);
  const [cardSize, setCardSize] = useState<'large' | 'compact'>('large');
  const [lightboxPhoto, setLightboxPhoto] = useState<NicheScenePhoto | null>(null);
  const [assignedFeedbackId, setAssignedFeedbackId] = useState<string | null>(null);

  const filteredPhotos = useMemo(() => {
    return NICHE_SCENE_LIBRARY_1200.filter((photo) => {
      if (selectedNiche !== 'Todos' && photo.niche !== selectedNiche) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          photo.title.toLowerCase().includes(q) ||
          photo.niche.toLowerCase().includes(q) ||
          photo.subNiche.toLowerCase().includes(q) ||
          photo.keywords.some((k) => k.includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [selectedNiche, searchQuery]);

  const visiblePhotos = useMemo(
    () => filteredPhotos.slice(0, visibleCount),
    [filteredPhotos, visibleCount]
  );

  const handleAssignWithFeedback = (photo: NicheScenePhoto) => {
    onSelectPhotoForChapter(photo);
    setAssignedFeedbackId(photo.id);
    setTimeout(() => setAssignedFeedbackId(null), 1600);
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header with High-Contrast Readable Typography */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>BIBLIOTECA VISUAL COMPLETA · 12 NICHOS × 100 FOTOS = 1,200 ESCENAS HD</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Catálogo de +1,200 Imágenes de Nichos para Escenas y Audiolibros
          </h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            Visualiza con total claridad todas las imágenes creadas para los 12 nichos del estudio. Haz clic en cualquier fotografía para asignarla al{' '}
            <strong className="text-slate-950">
              Capítulo {activeChapterNumber} ({activeChapterTitle})
            </strong>
            , enviarla a tus videos MP4 sin límite de tiempo o ampliarla en pantalla completa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              onAutoFillAllChaptersWithNiche(
                selectedNiche === 'Todos' ? 'Auto' : selectedNiche
              )
            }
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {selectedNiche === 'Todos'
                ? `Auto-Asignar Fotos a los ${totalChapters} Capítulos`
                : `Rellenar los ${totalChapters} Capítulos con "${selectedNiche}"`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setVisibleCount(filteredPhotos.length)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Ver Todas ({filteredPhotos.length} Fotos)</span>
          </button>
        </div>
      </div>

      {/* 12 Niche Category Tabs — Large, High-Contrast & Easy to Read */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-bold text-slate-900">
            Selecciona un Nicho Temático (100 Fotos en cada Nicho):
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCardSize('large')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                cardSize === 'large'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              Vista Grande Legible
            </button>
            <button
              type="button"
              onClick={() => setCardSize('compact')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                cardSize === 'compact'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              Vista Mosaico
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedNiche('Todos');
              setVisibleCount(60);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
              selectedNiche === 'Todos'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
            }`}
          >
            Todos los 12 Nichos (1,200 Fotos)
          </button>

          {SCENE_NICHE_CATEGORIES.map((niche) => (
            <button
              key={niche}
              type="button"
              onClick={() => {
                setSelectedNiche(niche);
                setVisibleCount(100);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                selectedNiche === niche
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {niche} (100)
            </button>
          ))}
        </div>
      </div>

      {/* Search & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(100);
            }}
            placeholder="Buscar escenas por palabra clave, sub-nicho o ambiente (ej. finanzas, cerebro, bosque, biblioteca, estudio)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-800">
          <span>
            Mostrando <strong className="text-indigo-700">{visiblePhotos.length}</strong> de{' '}
            <strong className="text-slate-950">{filteredPhotos.length}</strong> escenas
          </span>
          {visibleCount < filteredPhotos.length && (
            <button
              type="button"
              onClick={() => setVisibleCount(filteredPhotos.length)}
              className="text-indigo-600 hover:text-indigo-800 underline font-bold cursor-pointer"
            >
              Mostrar las {filteredPhotos.length} completas
            </button>
          )}
        </div>
      </div>

      {/* High-Visibility Photo Grid — Full Readable Words & Reliable Image Rendering */}
      <div
        className={
          cardSize === 'large'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'
            : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5'
        }
      >
        {visiblePhotos.map((photo) => {
          const isCurrentChapterImg = currentChapterImageUrl === photo.imageUrl;
          const isJustAssigned = assignedFeedbackId === photo.id;
          const isGenerating = generatingPhotoId === photo.id;

          return (
            <article
              key={photo.id}
              className={`group rounded-2xl border transition-all flex flex-col justify-between overflow-hidden bg-white ${
                isCurrentChapterImg || isJustAssigned
                  ? 'border-indigo-600 ring-2 ring-indigo-600/25 shadow-md'
                  : 'border-slate-200 hover:border-slate-400 shadow-2xs hover:shadow-md'
              }`}
            >
              <div>
                {/* Crisp 16:9 Scene Image with Multi-Stage Fallback */}
                <div
                  className={`relative w-full overflow-hidden bg-slate-900 ${
                    cardSize === 'large' ? 'aspect-video' : 'h-32'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${photo.primaryHex} 0%, ${photo.secondaryHex} 100%)`,
                  }}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src !== photo.fallbackUrl && !img.dataset.triedFallback) {
                        img.dataset.triedFallback = 'true';
                        img.src = photo.fallbackUrl;
                      } else if (img.src !== photo.svgBackupUrl) {
                        img.src = photo.svgBackupUrl;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/90 text-white font-mono text-xs font-bold shadow-xs">
                      #{String(photo.number).padStart(4, '0')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {(isCurrentChapterImg || isJustAssigned) && (
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs">
                          <Check className="w-3 h-3" /> Activa Cap. {activeChapterNumber}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setLightboxPhoto(photo)}
                        className="p-1.5 rounded-md bg-slate-950/85 hover:bg-slate-950 text-white transition-colors cursor-pointer"
                        title="Ampliar imagen en pantalla completa"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clear, Uncut Text Details on Crisp White Surface */}
                <div className="p-4 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-indigo-700">
                    <span>{photo.niche}</span>
                    <span>·</span>
                    <span className="text-slate-600 font-semibold">{photo.subNiche}</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-950 leading-snug break-words">
                    {photo.title}
                  </h3>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAssignWithFeedback(photo)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>Usar en Cap. {activeChapterNumber}</span>
                </button>

                {onUsePhotoInSequenceShot && (
                  <button
                    type="button"
                    onClick={() => onUsePhotoInSequenceShot(photo)}
                    className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Usar esta escena en el generador de Videos MP4"
                  >
                    <Film className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Video MP4</span>
                  </button>
                )}

                {onGenerateAiVariantForPhoto && (
                  <button
                    type="button"
                    onClick={() => onGenerateAiVariantForPhoto(photo)}
                    disabled={isGenerating}
                    className="py-2 px-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    title="Generar variante única con IA 3.1"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    )}
                    <span>IA</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Load More / Show All Footer */}
      {visibleCount < filteredPhotos.length && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 100)}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm cursor-pointer transition-all"
          >
            <span>
              Cargar 100 escenas más ({visiblePhotos.length} de {filteredPhotos.length})
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setVisibleCount(filteredPhotos.length)}
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer transition-all"
          >
            Ver las {filteredPhotos.length} fotos completas ahora
          </button>
        </div>
      )}

      {/* Fullscreen HD Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-slate-950">
              <img
                src={lightboxPhoto.imageUrl}
                alt={lightboxPhoto.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = lightboxPhoto.fallbackUrl;
                }}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950/85 hover:bg-slate-950 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-indigo-600 uppercase">
                    ESCENA #{String(lightboxPhoto.number).padStart(4, '0')} · {lightboxPhoto.niche} ·{' '}
                    {lightboxPhoto.subNiche}
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-950">
                    {lightboxPhoto.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-slate-600">
                    Prompt IA: {lightboxPhoto.aiScenePrompt}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleAssignWithFeedback(lightboxPhoto);
                      setLightboxPhoto(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Asignar a Capítulo {activeChapterNumber}</span>
                  </button>

                  <a
                    href={lightboxPhoto.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm flex items-center gap-2 border border-slate-300"
                  >
                    <Download className="w-4 h-4" />
                    <span>Abrir Imagen HD</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
