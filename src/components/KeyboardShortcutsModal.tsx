import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  X,
  Save,
  Sparkles,
  Navigation,
  Wrench,
  Search,
  Play,
  ArrowRight,
  Command,
} from 'lucide-react';
import { StudioModuleId } from '../utils/seoMetadata';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: StudioModuleId;
  isAdmin: boolean;
  onTriggerSave?: () => void;
  onTriggerGenerate?: () => void;
  onNavigateModule?: (moduleId: StudioModuleId) => void;
}

interface ShortcutItem {
  id: string;
  keys: string[];
  label: string;
  description: string;
  category: 'primary' | 'navigation' | 'tools';
  targetModule?: StudioModuleId;
  highlight?: boolean;
}

const isMacPlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    '';
  return /mac|iphone|ipad|ipod/i.test(platform);
};

interface ModuleContextualSummary {
  moduleName: string;
  saveAction: string;
  generateAction: string;
  canGenerate: boolean;
}

const getModuleContext = (moduleId: StudioModuleId): ModuleContextualSummary => {
  switch (moduleId) {
    case 'script':
      return {
        moduleName: 'Guion 2 Minutos',
        saveAction: 'Guarda una nueva versión del guion en tu historial',
        generateAction: 'Genera un nuevo guion viral de 2 minutos con IA',
        canGenerate: true,
      };
    case 'videobook':
      return {
        moduleName: 'Audiolibros IA',
        saveAction: 'Guarda el audiolibro actual en Mi Biblioteca',
        generateAction: 'Convierte tu texto o PDF en audiolibro con voz y escenas IA',
        canGenerate: true,
      };
    case 'ai-pdf-creator':
      return {
        moduleName: 'Crear PDF Completo con IA',
        saveAction: 'Descarga y guarda el documento PDF completo generado',
        generateAction: 'Genera el documento PDF completo con capítulos e ilustraciones IA',
        canGenerate: true,
      };
    case 'pdf-director':
      return {
        moduleName: 'Director PDF',
        saveAction: 'Exporta y guarda la propuesta audiovisual en PDF',
        generateAction: 'Analiza tu documento y genera la propuesta audiovisual con IA',
        canGenerate: true,
      };
    case 'narration':
      return {
        moduleName: 'Locución Neuronal',
        saveAction: 'Guarda una copia del guion actual en tu historial',
        generateAction: 'Sintetiza la locución neuronal profesional con la voz elegida',
        canGenerate: true,
      };
    case 'sequence':
      return {
        moduleName: 'Clips y Storyboard',
        saveAction: 'Guarda una copia del guion actual en tu historial',
        generateAction: 'Genera la secuencia cinematográfica y storyboard con IA',
        canGenerate: true,
      };
    case 'niche-gallery':
      return {
        moduleName: 'Galería de Escenas',
        saveAction: 'Guarda una copia de seguridad del guion activo',
        generateAction: 'Cambia a un módulo de creación para generar contenido IA',
        canGenerate: false,
      };
    case 'admin-dashboard':
      return {
        moduleName: 'Panel de Administración',
        saveAction: 'Guarda una copia de seguridad del guion activo',
        generateAction: 'Cambia a un módulo de creación para generar contenido IA',
        canGenerate: false,
      };
    default:
      return {
        moduleName: 'Estudio Kinetix IA',
        saveAction: 'Guarda el guion o proyecto activo',
        generateAction: 'Genera contenido IA en el módulo activo',
        canGenerate: false,
      };
  }
};

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  activeModule,
  isAdmin,
  onTriggerSave,
  onTriggerGenerate,
  onNavigateModule,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isMac = useMemo(() => isMacPlatform(), []);
  const modKey = isMac ? '⌘' : 'Ctrl';
  const altKey = isMac ? '⌥' : 'Alt';

  const moduleContext = useMemo(() => getModuleContext(activeModule), [activeModule]);

  const allShortcuts = useMemo<ShortcutItem[]>(() => {
    const items: ShortcutItem[] = [
      // Primary workflow actions
      {
        id: 'save',
        keys: [modKey, 'S'],
        label: 'Guardar guion o proyecto actual',
        description:
          'Guarda nueva versión en Guion 2 Min, guarda el audiolibro en Mi Biblioteca o exporta el PDF activo.',
        category: 'primary',
        highlight: true,
      },
      {
        id: 'generate',
        keys: [modKey, 'Enter'],
        label: 'Generar contenido con IA',
        description:
          'Dispara la generación IA dentro del módulo activo (Guion, Audiolibro, PDF IA, Locución, Director PDF o Clips).',
        category: 'primary',
        highlight: true,
      },
      {
        id: 'upload',
        keys: [modKey, 'U'],
        label: 'Cargar archivo PDF, TXT o MD',
        description: 'Abre el selector de archivos del dispositivo para importar un documento al estudio.',
        category: 'primary',
      },
      {
        id: 'player',
        keys: [modKey, 'P'],
        label: 'Abrir reproductor de audiolibro',
        description: 'Inicia la pantalla de reproducción de video y voz de tu audiolibro generado.',
        category: 'primary',
      },
      {
        id: 'export-mp3',
        keys: [modKey, 'Shift', 'E'],
        label: 'Exportar audio en MP3',
        description: 'Descarga el archivo MP3 maestro del audiolibro creado.',
        category: 'primary',
      },
      {
        id: 'share',
        keys: [modKey, 'Shift', 'K'],
        label: 'Compartir proyecto',
        description: 'Abre el panel de enlace y difusión para redes sociales.',
        category: 'primary',
      },

      // Module navigation
      {
        id: 'nav-videobook',
        keys: [altKey, '1'],
        label: 'Ir a Audiolibros IA',
        description: 'Creador de audiolibros desde PDF y Mi Biblioteca.',
        category: 'navigation',
        targetModule: 'videobook',
      },
      {
        id: 'nav-ai-pdf',
        keys: [altKey, '2'],
        label: 'Ir a Crear PDF Completo con IA',
        description: 'Editor de ebooks, guías e informes PDF ilustrados con IA.',
        category: 'navigation',
        targetModule: 'ai-pdf-creator',
      },
      {
        id: 'nav-gallery',
        keys: [altKey, '3'],
        label: 'Ir a Galería de Escenas',
        description: 'Catálogo de 1,200+ escenas visuales listas para tus proyectos.',
        category: 'navigation',
        targetModule: 'niche-gallery',
      },
      {
        id: 'nav-script',
        keys: [altKey, '4'],
        label: 'Ir a Guion 2 Minutos',
        description: 'Generador de guiones virales e historial de versiones.',
        category: 'navigation',
        targetModule: 'script',
      },
      {
        id: 'nav-pdf-director',
        keys: [altKey, '5'],
        label: 'Ir a Director PDF',
        description: 'Propuesta audiovisual estructurada a partir de documentos.',
        category: 'navigation',
        targetModule: 'pdf-director',
      },
      {
        id: 'nav-narration',
        keys: [altKey, '6'],
        label: 'Ir a Locución Neuronal',
        description: 'Estudio de voces neuronales 24 kHz y tomas de audio.',
        category: 'navigation',
        targetModule: 'narration',
      },
      {
        id: 'nav-sequence',
        keys: [altKey, '7'],
        label: 'Ir a Clips y Storyboard',
        description: 'Plan de planos cinematográficos y exportación MP4.',
        category: 'navigation',
        targetModule: 'sequence',
      },
    ];

    if (isAdmin) {
      items.push({
        id: 'nav-admin',
        keys: [altKey, '8'],
        label: 'Ir a Panel de Administración',
        description: 'Suscriptores, métricas de conversión y configuración de tarifas.',
        category: 'navigation',
        targetModule: 'admin-dashboard',
      });
    }

    // Studio utilities
    items.push(
      {
        id: 'open-shortcuts',
        keys: [modKey, '/'],
        label: 'Abrir o cerrar lista de atajos',
        description: 'También puedes pulsar la tecla ? cuando no estés escribiendo en un campo de texto.',
        category: 'tools',
      },
      {
        id: 'escape',
        keys: ['Esc'],
        label: 'Cerrar ventana o panel activo',
        description: 'Cierra rápidamente el modal, reproductor o menú abierto en pantalla.',
        category: 'tools',
      }
    );

    return items;
  }, [modKey, altKey, isAdmin]);

  const filteredShortcuts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allShortcuts;
    return allShortcuts.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keys.join(' ').toLowerCase().includes(q)
    );
  }, [allShortcuts, searchQuery]);

  if (!isOpen) return null;

  const primaryList = filteredShortcuts.filter((i) => i.category === 'primary');
  const navigationList = filteredShortcuts.filter((i) => i.category === 'navigation');
  const toolsList = filteredShortcuts.filter((i) => i.category === 'tools');

  const renderKeycaps = (keys: string[]) => (
    <div className="flex items-center gap-1 shrink-0">
      {keys.map((k, idx) => (
        <React.Fragment key={`${k}-${idx}`}>
          <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md border border-slate-300 bg-slate-100 text-slate-900 font-mono text-xs font-bold shadow-[0_1px_0_0_rgba(15,23,42,0.18)]">
            {k}
          </kbd>
          {idx < keys.length - 1 && (
            <span className="text-[11px] font-semibold text-slate-400">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between gap-4 border-b border-amber-500/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Keyboard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="keyboard-shortcuts-title"
                className="text-base sm:text-lg font-extrabold tracking-tight text-white truncate"
              >
                Atajos de Teclado Globales
              </h2>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <Command className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Acelera tu flujo de trabajo en Kinetix Estudio IA ({isMac ? 'macOS ⌘' : 'Windows / Linux Ctrl'})
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar lista de atajos"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Context Banner for Current Module */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
              Módulo activo: {moduleContext.moduleName}
            </span>
            <span className="text-[11px] text-amber-800 font-medium">
              Los atajos principales se adaptan automáticamente al módulo abierto
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center justify-between gap-3 bg-white border border-amber-200/90 rounded-xl px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Save className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="text-xs font-extrabold text-slate-900">
                    {modKey}+S · Guardar
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {moduleContext.saveAction}
                </p>
              </div>
              {onTriggerSave && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTriggerSave();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-[11px] font-bold shrink-0 cursor-pointer flex items-center gap-1"
                  title="Ejecutar guardado ahora"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Usar</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 bg-white border border-amber-200/90 rounded-xl px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="text-xs font-extrabold text-slate-900">
                    {modKey}+Enter · Generar IA
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {moduleContext.generateAction}
                </p>
              </div>
              {onTriggerGenerate && moduleContext.canGenerate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTriggerGenerate();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold shrink-0 cursor-pointer flex items-center gap-1"
                  title="Ejecutar generación IA ahora"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar atajo (ej. guardar, generar, PDF, MP3, guion)..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Shortcut Groups */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {filteredShortcuts.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">
              No se encontraron atajos para &ldquo;{searchQuery}&rdquo;.
            </div>
          )}

          {primaryList.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Acciones Principales del Flujo de Trabajo
                </h3>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {primaryList.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-4 px-4 py-3 ${
                      item.highlight ? 'bg-amber-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">{item.label}</div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                    {renderKeycaps(item.keys)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {navigationList.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <Navigation className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Navegación Rápida entre Módulos
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {navigationList.map((item) => {
                  const isCurrent = item.targetModule === activeModule;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.targetModule && onNavigateModule) {
                          onNavigateModule(item.targetModule);
                          onClose();
                        }
                      }}
                      className={`text-left flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span className="truncate">{item.label}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-amber-800 uppercase">
                              · Actual
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {renderKeycaps(item.keys)}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {toolsList.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <Wrench className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Control del Estudio
                </h3>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {toolsList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">{item.label}</div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                    {renderKeycaps(item.keys)}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Consejo: <strong className="text-slate-800">{modKey}+S</strong> y{' '}
            <strong className="text-slate-800">{modKey}+Enter</strong> funcionan incluso mientras
            escribes dentro de un editor de guion o tema.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
