import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  LanguageOption,
} from '../utils/i18n';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) ||
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-300/40'
            : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
        }`}
        title={`Idioma actual: ${activeOption.nativeName}. Haz clic para cambiar.`}
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none select-none">{activeOption.flag}</span>
        {!compact && (
          <span className="text-xs font-bold text-slate-900 tracking-tight hidden sm:inline">
            {activeOption.code.toUpperCase()}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 backdrop-blur-xl border border-amber-300/80 shadow-[0_12px_40px_rgba(217,119,6,0.18)] z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-800">
              Seleccionar Idioma
            </span>
            <Globe className="w-3.5 h-3.5 text-amber-600" />
          </div>

          <div className="py-1 space-y-0.5">
            {SUPPORTED_LANGUAGES.map((option: LanguageOption) => {
              const isSelected = option.code === currentLanguage;
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => {
                    onLanguageChange(option.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 text-amber-950 border border-amber-400/60 shadow-2xs font-black'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{option.flag}</span>
                    <div className="text-left">
                      <div className="text-xs font-extrabold text-slate-900">
                        {option.nativeName}
                      </div>
                      <div className="text-[10px] text-slate-700 font-medium">
                        {option.name}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
