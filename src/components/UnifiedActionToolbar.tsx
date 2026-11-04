import React, { useState } from 'react';
import {
  Plus,
  Play,
  Upload,
  Trash2,
  Share2,
  RefreshCw,
  Sparkles,
  DollarSign,
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
  language = 'es',
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <div className="w-full space-y-4 mb-8">
      {/* =====================================================================
          1. BARRA SUPERIOR DE MONETIZACIÓN & PAGOS REALES (SIEMPRE AL PRINCIPIO)
         ===================================================================== */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF4E6] to-[#FFFBF0] border-2 border-amber-400/80 p-3.5 sm:p-4 shadow-[0_8px_30px_rgba(217,119,6,0.12)] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Monetization Pitch with Gold Letters */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
            <DollarSign className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                {t('monetizationTitle', language)}
              </span>
              <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h2 className="text-base sm:text-lg font-black bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-600 bg-clip-text text-transparent truncate">
              {t('monetizationSub', language)}
            </h2>
          </div>
        </div>

        {/* Right: Quick Action Buttons for Monetization */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Live Balance Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 shadow-2xs flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-[11px] font-black text-slate-950">
              ⚡
            </span>
            <span className="font-mono text-xs font-black text-amber-900">
              {userTokenBalance.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
              {t('tokensBadge', language)}
            </span>
          </div>

          {/* Test Real Payment Button ($5.00) */}
          <button
            type="button"
            onClick={onTestearPago}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_4px_14px_rgba(245,158,11,0.35)] transition-all transform hover:scale-105 cursor-pointer"
            title="Probar flujo de pago real con PayPal ($5.00 con acreditación de 62,500 tokens)"
          >
            <Zap className="w-3.5 h-3.5 text-slate-950 fill-current" />
            <span>{t('testRealPayment', language)}</span>
          </button>

          {/* Botón Acceso / Empieza Ahora */}
          <button
            type="button"
            onClick={onMonetizar}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_4px_16px_rgba(245,158,11,0.4)] transition-all transform hover:scale-105 cursor-pointer border border-amber-600/40"
            title="Empieza ahora antes de usar o ver - Botón Acceso"
          >
            <Zap className="w-3.5 h-3.5 text-slate-950 fill-current animate-pulse" />
            <span className="uppercase tracking-wide font-black">
              {t('btnAcceso', language) || 'EMPIEZA AHORA · BOTÓN ACCESO'}
            </span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. BARRA UNIFICADA DE ACCIONES: CREAR, REPRODUCIR, CARGAR, ELIMINAR, COMPARTIR, CONVERTIR
         ===================================================================== */}
      <div className="w-full rounded-2xl bg-white border border-amber-300/80 p-4 shadow-[0_8px_25px_rgba(217,119,6,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-amber-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-gradient-to-r from-amber-800 to-yellow-700 bg-clip-text text-transparent">
              {t('toolbarTitle', language)}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {t('actionCompartirDesc', language)}
          </span>
        </div>

        {/* The 6 Buttons Grouped Together */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. CREAR */}
          <button
            type="button"
            onClick={onCrear}
            disabled={isGenerating}
            className="group px-3 py-3 rounded-xl bg-gradient-to-b from-[#FFFDF9] to-[#FEF8E7] hover:from-[#FEF5D6] hover:to-[#FDE8B5] border-2 border-amber-400/90 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            title={t('actionCrearDesc', language)}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="font-display font-black text-xs sm:text-sm bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-600 bg-clip-text text-transparent tracking-wide">
              {t('actionCrear', language)}
            </span>
            <span className="text-[10px] font-bold text-amber-900/70">
              {t('actionCrearSub', language)}
            </span>
          </button>

          {/* 2. REPRODUCIR */}
          <button
            type="button"
            onClick={onReproducir}
            className="group px-3 py-3 rounded-xl bg-gradient-to-b from-[#FFFDF9] to-[#FEF8E7] hover:from-[#FEF5D6] hover:to-[#FDE8B5] border-2 border-amber-400/90 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            title={t('actionReproducirDesc', language)}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <span className="font-display font-black text-xs sm:text-sm bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-600 bg-clip-text text-transparent tracking-wide">
              {t('actionReproducir', language)}
            </span>
            <span className="text-[10px] font-bold text-amber-900/70">
              {t('actionReproducirSub', language)}
            </span>
          </button>

          {/* 3. CARGAR */}
          <button
            type="button"
            onClick={onCargar}
            className="group px-3 py-3 rounded-xl bg-gradient-to-b from-[#FFFDF9] to-[#FEF8E7] hover:from-[#FEF5D6] hover:to-[#FDE8B5] border-2 border-amber-400/90 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            title={t('actionCargarDesc', language)}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Upload className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-display font-black text-xs sm:text-sm bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-600 bg-clip-text text-transparent tracking-wide">
              {t('actionCargar', language)}
            </span>
            <span className="text-[10px] font-bold text-amber-900/70">
              {t('actionCargarSub', language)}
            </span>
          </button>

          {/* 4. ELIMINAR */}
          {showConfirmDelete ? (
            <div className="px-2 py-2 rounded-xl bg-rose-50 border-2 border-rose-400 flex flex-col items-center justify-center gap-1 text-center shadow-sm">
              <span className="text-[10px] font-bold text-rose-800">
                {t('deleteConfirmTitle', language)}
              </span>
              <div className="flex items-center gap-1 w-full justify-center">
                <button
                  type="button"
                  onClick={() => {
                    onEliminar();
                    setShowConfirmDelete(false);
                  }}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] cursor-pointer"
                >
                  {t('deleteConfirmBtn', language)}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] cursor-pointer"
                >
                  {t('cancel', language)}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="group px-3 py-3 rounded-xl bg-gradient-to-b from-[#FFFDF9] to-[#FEF8E7] hover:from-[#FEECEB] hover:to-[#FDD5D5] border-2 border-amber-400/90 hover:border-rose-400 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              title={t('actionEliminarDesc', language)}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 group-hover:bg-rose-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Trash2 className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-display font-black text-xs sm:text-sm bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-600 group-hover:from-rose-700 group-hover:to-rose-600 bg-clip-text text-transparent tracking-wide">
                {t('actionEliminar', language)}
              </span>
              <span className="text-[10px] font-bold text-amber-900/70 group-hover:text-rose-700">
                {t('actionEliminarSub', language)}
              </span>
            </button>
          )}

          {/* 5. COMPARTIR */}
          <button
            type="button"
            onClick={onCompartir}
            className="group px-3 py-3 rounded-xl bg-gradient-to-b from-[#FFFDF9] to-[#FEF8E7] hover:from-[#FEF5D6] hover:to-[#FDE8B5] border-2 border-amber-400/90 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden"
            title={t('actionCompartirDesc', language)}
          >
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Share2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-display font-black text-xs sm:text-sm bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-600 bg-clip-text text-transparent tracking-wide">
              {t('actionCompartir', language)}
            </span>
            <span className="text-[10px] font-bold text-amber-900/70">
              {t('actionCompartirSub', language)}
            </span>
          </button>

          {/* 6. CONVERTIR */}
          <button
            type="button"
            onClick={onConvertir}
            disabled={isGenerating}
            className="group px-3 py-3 rounded-xl bg-gradient-to-b from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 border-2 border-amber-600 shadow-[0_4px_16px_rgba(245,158,11,0.35)] flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            title={t('actionConvertirDesc', language)}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center shadow-xs group-hover:rotate-180 transition-transform duration-500">
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-display font-black text-xs sm:text-sm text-slate-950 tracking-wide">
              {t('actionConvertir', language)}
            </span>
            <span className="text-[10px] font-black text-slate-950/80">
              {t('actionConvertirSub', language)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
