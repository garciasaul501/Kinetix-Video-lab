import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Globe,
  Share2,
  Check,
  RotateCcw,
  AlertCircle,
  FileText,
  Tag,
  User,
  Info,
} from 'lucide-react';
import { ProposalSeoMetadata } from '../utils/scriptExporter';

interface ProposalSeoEditorProps {
  initialTitle: string;
  initialDescription: string;
  onSaveSeoMetadata: (seoMeta: ProposalSeoMetadata) => void;
  currentSeoMeta?: ProposalSeoMetadata;
}

export const ProposalSeoEditor: React.FC<ProposalSeoEditorProps> = ({
  initialTitle,
  initialDescription,
  onSaveSeoMetadata,
  currentSeoMeta,
}) => {
  const [seoTitle, setSeoTitle] = useState(
    currentSeoMeta?.seoTitle || initialTitle || 'Propuesta Audiovisual IA · Kinetix Studio'
  );
  const [seoDescription, setSeoDescription] = useState(
    currentSeoMeta?.seoDescription ||
      initialDescription ||
      'Propuesta y escaleta de producción audiovisual adaptada desde documento PDF con storyboard y locución.'
  );
  const [keywords, setKeywords] = useState(
    currentSeoMeta?.keywords ||
      'video IA, storyboard PDF, propuesta audiovisual, prompts Veo, dirección de video'
  );
  const [author, setAuthor] = useState(
    currentSeoMeta?.author || 'Kinetix — Video AI Lab'
  );
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview-google' | 'preview-social'>('editor');

  // Update when prop changes if not manually dirty
  useEffect(() => {
    if (currentSeoMeta) {
      setSeoTitle(currentSeoMeta.seoTitle);
      setSeoDescription(currentSeoMeta.seoDescription);
      if (currentSeoMeta.keywords) setKeywords(currentSeoMeta.keywords);
      if (currentSeoMeta.author) setAuthor(currentSeoMeta.author);
    }
  }, [currentSeoMeta]);

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMeta: ProposalSeoMetadata = {
      seoTitle: seoTitle.trim() || initialTitle,
      seoDescription: seoDescription.trim() || initialDescription,
      keywords: keywords.trim(),
      author: author.trim(),
    };
    onSaveSeoMetadata(cleanMeta);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2400);
  };

  const handleAutoSuggestFromProposal = () => {
    const cleanTitle = (initialTitle || 'Propuesta Audiovisual').replace(/^Propuesta Audiovisual:\s*/i, '');
    const suggestedTitle = `${cleanTitle.slice(0, 42)} — Storyboard & Video IA | Kinetix`;
    const cleanDesc = (initialDescription || '')
      .replace(/\s+/g, ' ')
      .trim();
    const suggestedDesc =
      cleanDesc.length > 25
        ? `${cleanDesc.slice(0, 145)}... Descubre la propuesta audiovisual y storyboard técnico.`
        : 'Propuesta de dirección audiovisual completa con análisis, storyboard escena por escena y prompts de IA listos para producción.';

    setSeoTitle(suggestedTitle);
    setSeoDescription(suggestedDesc);
    const cleanMeta: ProposalSeoMetadata = {
      seoTitle: suggestedTitle,
      seoDescription: suggestedDesc,
      keywords,
      author,
    };
    onSaveSeoMetadata(cleanMeta);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2400);
  };

  const handleResetToDefault = () => {
    const defTitle = initialTitle || 'Propuesta Audiovisual IA · Kinetix';
    const defDesc = initialDescription || 'Propuesta técnica adaptada con inteligencia artificial.';
    setSeoTitle(defTitle);
    setSeoDescription(defDesc);
    const cleanMeta: ProposalSeoMetadata = {
      seoTitle: defTitle,
      seoDescription: defDesc,
      keywords: 'video IA, storyboard, Kinetix',
      author: 'Kinetix — Video AI Lab',
    };
    onSaveSeoMetadata(cleanMeta);
  };

  const titleLength = seoTitle.length;
  const descLength = seoDescription.length;

  return (
    <div className="rounded-2xl bg-[#0F121C] border border-amber-500/30 p-5 sm:p-6 shadow-md space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Search className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-extrabold bg-gradient-to-r from-[#FFF6CC] via-[#FBBF24] to-[#D97706] bg-clip-text text-transparent">
                Editor Manual de Metadatos SEO (Título y Descripción)
              </h3>
              <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 uppercase">
                Director Audiovisual
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Personaliza el título y la descripción meta que se aplican a los documentos PDF y TXT generados y a la vista previa web.
            </p>
          </div>
        </div>

        {/* View switcher tabs */}
        <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Editar Metadatos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview-google')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'preview-google'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview-social')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'preview-social'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Redes Sociales</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Editor Form */}
      {activeTab === 'editor' && (
        <form onSubmit={handleApply} className="space-y-4">
          {/* Título SEO */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-amber-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Título SEO del Documento (&lt;title&gt; y /Info en PDF):</span>
              </label>
              <span
                className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                  titleLength >= 30 && titleLength <= 65
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                }`}
              >
                {titleLength}/60 caracteres {titleLength >= 30 && titleLength <= 65 ? '✓ Óptimo' : ''}
              </span>
            </div>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Ej: Estrategia de IA Audiovisual — Storyboard & Guion Técnico | Kinetix"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141724] border border-amber-500/30 text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
            />
            <p className="text-[11px] text-slate-400">
              Aparece en la pestaña del navegador, en el título oficial del PDF y en el encabezado de los archivos exportados.
            </p>
          </div>

          {/* Descripción Meta SEO */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-amber-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Descripción Meta SEO (&lt;meta name="description"&gt;):</span>
              </label>
              <span
                className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                  descLength >= 110 && descLength <= 165
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                }`}
              >
                {descLength}/160 caracteres {descLength >= 110 && descLength <= 165 ? '✓ Óptimo' : ''}
              </span>
            </div>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Escribe la descripción concisa que resume el documento para buscadores y lectores..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141724] border border-amber-500/30 text-xs sm:text-sm font-medium text-slate-100 focus:outline-none focus:border-amber-400 leading-relaxed"
            />
            <p className="text-[11px] text-slate-400">
              Se graba en el diccionario /Subject del PDF y como meta-descripción en las fichas para redes sociales.
            </p>
          </div>

          {/* Palabras Clave y Autor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-xs text-amber-200 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Palabras Clave (Keywords):</span>
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="video IA, storyboard, propuesta audiovisual"
                className="w-full px-3 py-2 rounded-xl bg-[#141724] border border-amber-500/30 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-xs text-amber-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Autor / Organización:</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Kinetix — Video AI Lab"
                className="w-full px-3 py-2 rounded-xl bg-[#141724] border border-amber-500/30 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>¡Metadatos SEO Guardados y Aplicados!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Aplicar Metadatos a Documentos</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAutoSuggestFromProposal}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Sugerir título y descripción optimizados automáticamente con base en el contenido"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-sugerir con IA</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer</span>
            </button>
          </div>
        </form>
      )}

      {/* Mode 2: Google SERP Preview */}
      {activeTab === 'preview-google' && (
        <div className="space-y-3 p-4 rounded-xl bg-white text-slate-900 border border-slate-300 shadow-inner">
          <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Vista Previa en Resultados de Búsqueda de Google (SERP):</span>
          </div>

          <div className="space-y-1 font-sans">
            <div className="text-xs text-[#202124] flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">kinetix.studio</span>
              <span className="text-slate-400">›</span>
              <span className="text-slate-500">propuesta-audiovisual</span>
            </div>
            <h4 className="text-lg text-[#1a0dab] hover:underline font-medium cursor-pointer leading-tight">
              {seoTitle || 'Propuesta Audiovisual — Kinetix'}
            </h4>
            <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
              <span className="text-slate-500 mr-1">
                {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} —
              </span>
              {seoDescription || 'Descripción del documento audiovisual adaptado con IA.'}
            </p>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200 flex items-center justify-between">
            <span>Formato: HTML5 + PDF indexable con diccionario /Info completo</span>
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className="text-indigo-700 font-bold hover:underline cursor-pointer"
            >
              Editar estos textos →
            </button>
          </div>
        </div>
      )}

      {/* Mode 3: Social Share Card Preview */}
      {activeTab === 'preview-social' && (
        <div className="space-y-3 p-4 rounded-xl bg-[#090B10] border border-white/10">
          <div className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Tarjeta de Previsualización en Redes Sociales (OpenGraph / X / LinkedIn):</span>
          </div>

          <div className="rounded-xl overflow-hidden border border-white/15 bg-[#141724] max-w-lg">
            <div className="relative h-44 bg-gradient-to-br from-amber-600/30 via-slate-900 to-black flex items-center justify-center p-6 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.25)_0%,transparent_70%)]" />
              <div className="relative z-10 space-y-1">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono font-bold text-amber-300">
                  PROPUESTA AUDIOVISUAL IA
                </span>
                <p className="font-display text-lg font-black text-white leading-tight">
                  {seoTitle.slice(0, 56)}
                </p>
              </div>
            </div>

            <div className="p-4 space-y-1 bg-[#10131E]">
              <span className="text-[10px] font-mono text-amber-400/80 uppercase">
                kinetix.studio · {author}
              </span>
              <h4 className="text-sm font-bold text-white leading-snug">
                {seoTitle}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {seoDescription}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
