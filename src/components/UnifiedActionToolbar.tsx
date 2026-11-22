import React, { useState } from 'react';
import {
  Plus,
  Play,
  Upload,
  Trash2,
  Share2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { SupportedLanguage, t } from '../utils/i18n';

export interface UnifiedActionToolbarProps {
  onCrear: () => void;
  onReproducir: () => void;
  onCargar: () => void;
  onEliminar: () => void;
  onCompartir: () => void;
  onConvertir: () => void;
  onMonetizar: () => void;
  onTestearPago: () => void;
  userTokenBalance: number;
  isGenerating?: boolean;
  isPlayingBg?: boolean;
  canPlay?: boolean;
  language?: SupportedLanguage;
}

export const UnifiedActionToolbar: React.FC<UnifiedActionToolbarProps> = ({
  onCrear,
  onReproducir,
  onCargar,
  onEliminar,
  onCompartir,
  onConvertir,
  onMonetizar,
  onTestearPago,
  userTokenBalance,
  isGenerating = false,
  isPlayingBg = false,
  canPlay = true,
  language = 'es',
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <div className="w-full bg-white border border-amber-200/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
      {/* Left: 6 Core Studio Actions in a clean single-row bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onCrear}
          disabled={isGenerating}
          className="px-3 py-2 rounded-lg text-xs font-bold text-amber-900 bg-amber-50/70 hover:bg-amber-100 border border-amber-200/80 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          title={t('actionCrearDesc', language)}
        >
          <Plus className="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
          <span>{t('actionCrear', language)}</span>
        </button>

        <button
          type="button"
          onClick={onReproducir}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
            isPlayingBg
              ? 'bg-amber-500 text-slate-950 border-amber-600'
              : canPlay
                ? 'text-amber-900 hover:bg-amber-50 border-transparent hover:border-amber-200/80'
                : 'text-slate-400 border-transparent hover:bg-slate-50'
          }`}
          title={
            canPlay
              ? 'Abrir la pantalla de reproducción de tu audiolibro creado'
              : 'Primero crea un audiolibro desde PDF o carga uno en Mi Biblioteca'
          }
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isPlayingBg ? 'text-slate-950' : canPlay ? 'text-amber-700' : 'text-slate-400'}`} />
          <span>{t('actionReproducir', language)}</span>
        </button>

        <button
          type="button"
          onClick={onCargar}
          className="px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:text-amber-900 hover:bg-amber-50 border border-transparent hover:border-amber-200/80 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title={t('actionCargarDesc', language)}
        >
          <Upload className="w-3.5 h-3.5 text-amber-700" />
          <span>{t('actionCargar', language)}</span>
        </button>

        <button
          type="button"
          onClick={onConvertir}
          disabled={isGenerating}
          className="px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:text-amber-900 hover:bg-amber-50 border border-transparent hover:border-amber-200/80 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          title={t('actionConvertirDesc', language)}
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{t('actionConvertir', language)}</span>
        </button>

        <button
          type="button"
          onClick={onCompartir}
          className="px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:text-amber-900 hover:bg-amber-50 border border-transparent hover:border-amber-200/80 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title={t('actionCompartirDesc', language)}
        >
          <Share2 className="w-3.5 h-3.5 text-amber-700" />
          <span>{t('actionCompartir', language)}</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {showConfirmDelete ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200">
            <span className="text-xs font-semibold text-rose-800 whitespace-nowrap">
              {t('deleteConfirmTitle', language)}
            </span>
            <button
              type="button"
              onClick={() => {
                onEliminar();
                setShowConfirmDelete(false);
              }}
              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer whitespace-nowrap"
            >
              {t('deleteConfirmBtn', language)}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs cursor-pointer whitespace-nowrap"
            >
              {t('cancel', language)}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title={t('actionEliminarDesc', language)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('actionEliminar', language)}</span>
          </button>
        )}
      </div>

      {/* Right: Token balance + Quick Access / Test Payment */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-mono tabular-nums font-bold text-amber-800 pr-2 border-r border-slate-200">
          <span>{userTokenBalance.toLocaleString()}</span>
          <span className="font-sans font-medium text-slate-500">{t('tokensBadge', language)}</span>
        </span>

        <button
          type="button"
          onClick={onTestearPago}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-900 bg-white hover:bg-amber-50 border border-amber-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Probar flujo de pago real con PayPal ($5.00)"
        >
          {t('testRealPayment', language)}
        </button>

        <button
          type="button"
          onClick={onMonetizar}
          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Empieza ahora antes de usar o ver - Botón Acceso"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{t('btnAcceso', language) || 'EMPIEZA AHORA · BOTÓN ACCESO'}</span>
        </button>
      </div>
    </div>
  );
};
