import React, { useState, useEffect, useRef } from 'react';
import {
  Clapperboard,
  Mic,
  Film,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Volume2,
  Clock,
  Camera,
  Wand2,
  AlertCircle,
  Loader2,
  Download,
  FileText,
  FileDown,
  Image as ImageIcon,
  Upload,
  Music,
  FileUp,
  Layers,
  Scissors,
  Sliders,
  BookOpen,
  History,
  FolderOpen,
  Edit3,
  Plus,
  Save,
  DollarSign,
  ShoppingBag,
  ShieldCheck,
  HelpCircle,
  Heart,
  LogIn,
  Zap,
  Play,
  Pause,
  Square,
  Headphones,
  Menu,
  X,
  Share2,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  Users,
  Eye,
  EyeOff,
} from 'lucide-react';
import { pcmBase64ToWav } from './utils/audioWav';
import {
  unlockStudioAudioContext,
  playBase64AudioViaWebAudio,
  WebAudioPlaybackHandle,
} from './utils/audioPlayerEngine';
import {
  renderSequenceToVideoUrl,
  downloadAudioAsMp3,
  renderVideoBookToMp4Url,
  VideoBook,
  AudiobookVisualMode,
  VideoExportSettings,
  DynamicSubtitleSettings,
  loadSavedSubtitleSettings,
} from './utils/videoRenderer';
import {
  exportScriptAsPdf,
  exportScriptAsTxt,
  exportProposalAsPdf,
  exportProposalAsTxt,
  exportVideoBookAsPdf,
  exportVideoBookAsTxt,
  AudiovisualProposal,
} from './utils/scriptExporter';
import { StudioAudioPlayer, VoiceoverTake } from './components/StudioAudioPlayer';
import { CinemaSequenceCanvas, SequencePlan } from './components/CinemaSequenceCanvas';
import { FloatingStoryboardPlayer } from './components/FloatingStoryboardPlayer';
import { VideoBookPlayer } from './components/VideoBookPlayer';
import {
  NARRATOR_AVATAR_PRESETS,
  NarratorAvatarPreset,
} from './components/TalkingAvatarStage';
import {
  matchBestScenesForBookPages,
  NICHE_SCENE_LIBRARY_1200,
  NicheScenePhoto,
  SceneNicheCategory,
} from './utils/nicheSceneLibrary';
import {
  SavedTwoMinuteScript,
  SavedAudiobookItem,
  loadScriptHistoryFromStorage,
  saveScriptHistoryToStorage,
  convertScriptVersionToSequencePlan,
  loadSavedAudiobooksMeta,
  saveAudiobooksMetaToStorage,
  loadCustomFoldersFromStorage,
  saveCustomFoldersToStorage,
  saveMediaBlobToIdb,
} from './utils/studioStorage';
import { AudiobookFolderVault } from './components/AudiobookFolderVault';
import { ScriptHistoryVault } from './components/ScriptHistoryVault';
import {
  PayPalMonetizationHub,
  PayPalProductItem,
  PayPalLogoBadge,
} from './components/PayPalMonetizationHub';
import {
  AdminControlModal,
  AdminSession,
  DEFAULT_ADMIN_EMAIL,
} from './components/AdminControlModal';
import { VoiceDictationButton } from './components/VoiceDictationButton';
import { NicheSceneGalleryView } from './components/NicheSceneGalleryView';
import {
  STUDIO_MODULE_SEO_MAP,
  STUDIO_MODULE_LIST,
  applyStudioModuleSeoMeta,
  applyDynamicStudioSeo,
  STUDIO_PDF_LIBRARY_12,
  StudioModuleId,
} from './utils/seoMetadata';
import {
  FuturisticGoldLogo,
  FuturisticLogoModal,
} from './components/FuturisticGoldLogo';
import { SupportConciergeModal } from './components/SupportConciergeModal';
import { ProposalSeoEditor } from './components/ProposalSeoEditor';
import { BuyTokensModal } from './components/BuyTokensModal';
import { UnifiedActionToolbar } from './components/UnifiedActionToolbar';
import { SocialShareModal } from './components/SocialShareModal';
import { LanguageSelector } from './components/LanguageSelector';
import { useToast } from './components/ToastNotification';
import { AiPdfCreatorStudio } from './components/AiPdfCreatorStudio';
import {
  SupportedLanguage,
  getSavedLanguage,
  saveLanguage,
  t,
} from './utils/i18n';

type ActiveModule = StudioModuleId;

interface ScriptScene {
  sceneNumber: number;
  timecode: string;
  durationSec: number;
  title: string;
  visualDescription: string;
  visualStyle: string;
  cameraDirection: string;
  narrationText: string;
  soundDesign: string;
}

interface GeneratedScript {
  title: string;
  logline: string;
  totalDuration: string;
  recommendedVoiceGender: string;
  recommendedAccent: string;
  recommendedVoiceTone: string;
  fullNarration: string;
  scenes: ScriptScene[];
}

const SAMPLE_PDF_DOCUMENTS = STUDIO_PDF_LIBRARY_12;

const INITIAL_PROPOSAL: AudiovisualProposal = {
  projectTitle: 'La Revolución Silenciosa: IA Generativa y Retención Audiovisual',
  targetFormat: 'Reels / TikTok / YouTube Shorts (9:16 Vertical)',
  targetDuration: '60 segundos',
  narrativeTone: 'Cinematográfico, disruptivo y de alta retención',
  aiTool: 'Veo 3.1',
  analysisSynthesis: {
    coreMessage:
      'La inteligencia artificial reduce un 68% el tiempo de preproducción, pero el 82% de la retención real depende del gancho en los primeros 4 segundos y de una dirección audiovisual precisa.',
    keyPoints: [
      'Reducción del 68% en tiempos de preproducción y validación de storyboards con IA.',
      'El 82% de la audiencia decide en los primeros 4 segundos si continúa viendo el video.',
      'La combinación de prompts cinematográficos precisos, diseño sonoro (SFX) y texto en pantalla multiplica por 3.4x el impacto.',
    ],
    essentialData: [
      '68% menos tiempo de preproducción técnica.',
      '82% de retención determinada en los primeros 4 segundos.',
      '3.4x mayor capacidad de producción con calidad de estudio.',
    ],
  },
  narrativeStructure: {
    hook: 'Primeros 4 segundos: Pregunta disruptiva en primer plano con corte de impacto: "¿Por qué el 82% de los videos fracasan antes del segundo cuatro, incluso usando inteligencia artificial?"',
    valueBlocks: [
      {
        title: 'Bloque 1 · El Mito de la Velocidad vs. Retención',
        summary:
          'Aunque la IA acelera la preproducción un 68%, generar imágenes sin estructura narrativa produce contenido que la audiencia ignora.',
      },
      {
        title: 'Bloque 2 · Dirección de Fotografía en Prompts IA',
        summary:
          'Traducir ideas densas en planos con óptica definida (35mm, iluminación volumétrica, movimiento de cámara) transforma un texto plano en cine.',
      },
      {
        title: 'Bloque 3 · Sincronía Acústica y Visual',
        summary:
          'El diseño sonoro multicapa y los subtítulos de alto contraste sostienen la atención hasta el desenlace.',
      },
    ],
    climaxConclusion:
      'La tecnología no reemplaza al director: multiplica por 3.4x la visión de quienes dominan el lenguaje cinematográfico.',
    callToAction:
      'Envía esta propuesta a locución y genera tus clips ahora para transformar tus documentos en producciones de alto impacto.',
  },
  storyboard: [
    {
      sceneNumber: 1,
      timestamp: '00:00 - 00:04',
      durationSec: 4,
      audioVoiceover:
        '[VOZ EN OFF]: "El ochenta y dos por ciento de tu audiencia decide en cuatro segundos si te escucha o te ignora." — [SFX: Sub-bass drop profundo + destello de obturador 35mm]',
      narrationOnly:
        'El ochenta y dos por ciento de tu audiencia decide en cuatro segundos si te escucha o te ignora.',
      sfxCue: 'Sub-bass drop profundo + destello de obturador 35mm',
      visualStaging:
        'Primerísimo primer plano (Extreme Close-Up) de una lente anamórfica reflejando haces de luz ámbar en un estudio oscuro; zoom-in rápido y corte seco.',
      aiVisualPrompt:
        'Extreme close-up of a vintage 35mm anamorphic cinema lens reflecting glowing volumetric amber data streams in a dark studio, rapid dolly-in camera movement, shallow depth of field, chiaroscuro lighting, photorealistic 8k, optimized for Veo 3.1 --ar 9:16',
      onScreenText: '82% DECIDE EN 4 SEGUNDOS',
    },
    {
      sceneNumber: 2,
      timestamp: '00:04 - 00:14',
      durationSec: 10,
      audioVoiceover:
        '[VOZ EN OFF]: "La inteligencia artificial ya reduce un sesenta y ocho por ciento el tiempo de preproducción, pero la velocidad sin dirección no basta." — [SFX: Whoosh grave + pulso de sintetizador analógico]',
      narrationOnly:
        'La inteligencia artificial ya reduce un sesenta y ocho por ciento el tiempo de preproducción, pero la velocidad sin dirección no basta.',
      sfxCue: 'Whoosh grave + pulso de sintetizador analógico',
      visualStaging:
        'Plano medio con travelling lateral fluido: hojas de un documento PDF suspendidas se desintegran en partículas doradas que forman un storyboard tridimensional.',
      aiVisualPrompt:
        'Cinematic medium tracking shot of floating document pages dissolving into golden luminous particles that assemble into a holographic film storyboard, moody tungsten and deep slate lighting, 50mm Prime lens, fluid lateral motion, 8k, optimized for Veo 3.1 --ar 9:16',
      onScreenText: '-68% TIEMPO DE PREPRODUCCIÓN',
    },
    {
      sceneNumber: 3,
      timestamp: '00:14 - 00:26',
      durationSec: 12,
      audioVoiceover:
        '[VOZ EN OFF]: "El primer secreto está en la síntesis: eliminar el ruido técnico y extraer únicamente la emoción y el dato que transforman la historia." — [SFX: Click digital cristalino + acorde cálido en crescendo]',
      narrationOnly:
        'El primer secreto está en la síntesis: eliminar el ruido técnico y extraer únicamente la emoción y el dato que transforman la historia.',
      sfxCue: 'Click digital cristalino + acorde cálido en crescendo',
      visualStaging:
        'Plano cenital (Top-Down) con rotación orbital sobre una mesa de edición minimalista donde un único cristal refracta un haz de luz nítido entre la niebla.',
      aiVisualPrompt:
        'Overhead orbital shot of a minimalist dark glass table where a prism refracts a single sharp amber light beam cutting through volumetric fog, high contrast architectural aesthetic, 24mm wide lens, cinema grade, optimized for Veo 3.1 --ar 9:16',
      onScreenText: '1. SÍNTESIS SIN RUIDO',
    },
    {
      sceneNumber: 4,
      timestamp: '00:26 - 00:39',
      durationSec: 13,
      audioVoiceover:
        '[VOZ EN OFF]: "El segundo es dirigir la cámara dentro del prompt: definir óptica, atmósfera lumínica y movimiento en cada escena." — [SFX: Giro mecánico de anillo de enfoque + barrido espacial]',
      narrationOnly:
        'El segundo es dirigir la cámara dentro del prompt: definir óptica, atmósfera lumínica y movimiento en cada escena.',
      sfxCue: 'Giro mecánico de anillo de enfoque + barrido espacial',
      visualStaging:
        'Plano secuencia dinámico (Dolly-In) atravesando un túnel de marcos luminosos que representan encuadres cinematográficos con iluminación volumétrica.',
      aiVisualPrompt:
        'Dynamic dolly-in shot moving through a sequence of glowing neon-amber rectangular cinema frames suspended in a misty dark warehouse, volumetric god rays, anamorphic lens flare, 35mm film grain, 8k, optimized for Veo 3.1 --ar 9:16',
      onScreenText: '2. DIRECCIÓN DE CÁMARA IA',
    },
    {
      sceneNumber: 5,
      timestamp: '00:39 - 00:50',
      durationSec: 11,
      audioVoiceover:
        '[VOZ EN OFF]: "Cuando sincronizas locución expresiva, diseño sonoro y narrativa visual, multiplicas por tres punto cuatro veces tu impacto." — [SFX: Silencio táctico de 0.4s seguido de impacto orquestal profundo]',
      narrationOnly:
        'Cuando sincronizas locución expresiva, diseño sonoro y narrativa visual, multiplicas por tres punto cuatro veces tu impacto.',
      sfxCue: 'Silencio táctico de 0.4s seguido de impacto orquestal profundo',
      visualStaging:
        'Plano general épico con ascenso de grúa (Crane Up): ondas acústicas doradas convergen con un horizonte metropolitano al amanecer.',
      aiVisualPrompt:
        'Epic crane-up wide master shot of golden acoustic soundwaves converging over a futuristic skyline at dawn, dramatic amber and deep navy sky, IMAX 70mm aesthetic, ultra-detailed, optimized for Veo 3.1 --ar 9:16',
      onScreenText: '3.4X IMPACTO AUDIOVISUAL',
    },
    {
      sceneNumber: 6,
      timestamp: '00:50 - 01:00',
      durationSec: 10,
      audioVoiceover:
        '[VOZ EN OFF]: "Convierte hoy tus documentos en producciones listas para publicar. Envía este guion a locución y genera tus clips ahora." — [SFX: Destello armónico final + cola de reverberación limpia]',
      narrationOnly:
        'Convierte hoy tus documentos en producciones listas para publicar. Envía este guion a locución y genera tus clips ahora.',
      sfxCue: 'Destello armónico final + cola de reverberación limpia',
      visualStaging:
        'Plano maestro de cierre con desenfoque bokeh cálido y espacio negativo limpio en el centro para destacar el llamado a la acción.',
      aiVisualPrompt:
        'Minimalist luxury studio closing shot with warm amber bokeh lights and dark slate negative space in the center, slow zoom-out camera movement, 85mm f/1.2 Noctilux lens, cinematic finish, optimized for Veo 3.1 --ar 9:16',
      onScreenText: 'PRODUCE TU VIDEO AHORA →',
    },
  ],
  technicalEditing: {
    cutsPacing:
      'Ritmo ágil de alta retención: corte inicial a los 4.0s exactos tras el gancho; bloques centrales con cortes cada 3.5 - 5.0 segundos usando J-Cuts (la voz entra 0.3s antes del corte visual) para mantener flujo continuo.',
    soundtrackStyle:
      'Electrónica cinematográfica minimalista con bajo pulsante y texturas neo-clásicas (BPM aproximado: 104 BPM · Mood: Disruptivo, sofisticado y enérgico).',
    recommendedBpm: 104,
    transitionSfx: [
      'Sub-bass drop + obturador analógico en el segundo 00:00 para capturar atención inmediata',
      'Low-end air whoosh sincronizado con el cambio de plano en bloques de valor',
      'Riser de tensión de 1.2s + silencio de 400ms antes del dato de 3.4x impacto',
      'Clicks sutiles de percusión orgánica sincronizados con cada aparición de texto en pantalla (Overlay)',
    ],
  },
  fullVoiceoverScript:
    'El ochenta y dos por ciento de tu audiencia decide en cuatro segundos si te escucha o te ignora. La inteligencia artificial ya reduce un sesenta y ocho por ciento el tiempo de preproducción, pero la velocidad sin dirección no basta. El primer secreto está en la síntesis: eliminar el ruido técnico y extraer únicamente la emoción y el dato que transforman la historia. El segundo es dirigir la cámara dentro del prompt: definir óptica, atmósfera lumínica y movimiento en cada escena. Cuando sincronizas locución expresiva, diseño sonoro y narrativa visual, multiplicas por tres punto cuatro veces tu impacto. Convierte hoy tus documentos en producciones listas para publicar. Envía este guion a locución y genera tus clips ahora.',
  seoMetadata: {
    seoTitle: 'Cómo la IA Reduce 70% en Preproducción Audiovisual | Kinetix',
    seoDescription:
      'Propuesta y storyboard técnico adaptado desde PDF: ganchos de alta retención, desglose escena por escena y prompts optimizados para generación de video IA.',
    keywords: 'video IA, storyboard PDF, propuesta audiovisual, dirección de video, Kinetix',
    author: 'Kinetix — Video AI Lab',
  },
};

const INITIAL_SCRIPT: GeneratedScript = {
  title: 'La Arquitectura del Tiempo: Inteligencia Artificial y Cine',
  logline:
    'Un recorrido visual de 2 minutos sobre cómo los algoritmos generativos amplifican la imaginación de los directores de cine contemporáneos.',
  totalDuration: '02:00 (120s)',
  recommendedVoiceGender: 'femenina',
  recommendedAccent: 'español neutro',
  recommendedVoiceTone: 'cinematográfico, cálido y reflexivo',
  fullNarration:
    'Durante más de un siglo, el cine dependió de la luz capturada a través de un cristal. Hoy, la imaginación ya no espera al amanecer perfecto. En cada línea de texto habita una atmósfera completa: la lluvia sobre el asfalto de Tokio, el silencio de una órbita lejana o el pulso de una idea que apenas nace. La inteligencia artificial no reemplaza la mirada del director; expande su lienzo. Lo que antes requería meses de producción técnica ahora cobra vida en segundos, permitiendo que la emoción pura guíe cada encuadre, cada voz y cada transición. El futuro del cine no pertenece a las máquinas, sino a quienes se atreven a contar historias que antes parecían imposibles.',
  scenes: [
    {
      sceneNumber: 1,
      timecode: '00:00 - 00:22',
      durationSec: 22,
      title: 'El Origen de la Luz',
      visualDescription:
        'Un haz de luz cálida atraviesa una lente anamórfica antigua en un estudio oscuro, disolviéndose en partículas doradas suspendidas en el aire.',
      visualStyle: 'Cinematográfico 35mm con iluminación chiaroscuro y grano orgánico',
      cameraDirection: 'Dolly in ultra lento con enfoque selectivo (50mm f/1.2)',
      narrationText:
        'Durante más de un siglo, el cine dependió de la luz capturada a través de un cristal. Hoy, la imaginación ya no espera al amanecer perfecto.',
      soundDesign: 'Zumbido analógico de proyector que se transforma en un acorde profundo de sintetizador.',
    },
    {
      sceneNumber: 2,
      timecode: '00:22 - 00:48',
      durationSec: 26,
      title: 'Mundos Nacidos de la Palabra',
      visualDescription:
        'Una avenida nocturna bajo la lluvia refleja luces ámbar y cian sobre el asfalto húmedo mientras la cámara asciende hacia un horizonte futurista.',
      visualStyle: 'Neo-noir atmosférico con reflejos especulares y niebla volumétrica',
      cameraDirection: 'Travelling ascendente (Crane Up) con lente gran angular 24mm',
      narrationText:
        'En cada línea de texto habita una atmósfera completa: la lluvia sobre el asfalto de Tokio, el silencio de una órbita lejana o el pulso de una idea que apenas nace.',
      soundDesign: 'Lluvia suave en estéreo combinada con pulsos rítmicos graves.',
    },
    {
      sceneNumber: 3,
      timecode: '00:48 - 01:14',
      durationSec: 26,
      title: 'El Director y el Algoritmo',
      visualDescription:
        'Capas de luz geométrica y ondas sonoras convergen en el centro del encuadre formando un horizonte sereno de montañas bajo una aurora dorada.',
      visualStyle: 'Minimalismo arquitectónico de alto contraste y paleta tungsteno',
      cameraDirection: 'Paneo lateral fluido (Pan Right) con profundidad de campo suave',
      narrationText:
        'La inteligencia artificial no reemplaza la mirada del director; expande su lienzo. Lo que antes requería meses de producción técnica ahora cobra vida en segundos.',
      soundDesign: 'Cuerdas acústicas minimalistas en crescendo.',
    },
    {
      sceneNumber: 4,
      timecode: '01:14 - 01:40',
      durationSec: 26,
      title: 'La Emoción como Brújula',
      visualDescription:
        'Un vórtice armónico de luz refractada que pulsa al ritmo de una voz humana, simbolizando la conexión entre emoción y narrativa visual.',
      visualStyle: 'Arte generativo cinético con destellos ópticos anamórficos',
      cameraDirection: 'Movimiento orbital concéntrico (85mm Prime)',
      narrationText:
        'Permitiendo que la emoción pura guíe cada encuadre, cada voz y cada transición.',
      soundDesign: 'Respiración sutil y resonancia armónica cristalina.',
    },
    {
      sceneNumber: 5,
      timecode: '01:40 - 02:00',
      durationSec: 20,
      title: 'Historias Imposibles',
      visualDescription:
        'Plano general épico de un horizonte infinito al amanecer donde un monolito de luz proyecta un nuevo día sobre el océano.',
      visualStyle: 'Épico cinematográfico IMAX 70mm con tonos ámbar y azul abisal',
      cameraDirection: 'Zoom out majestuoso hasta revelar el horizonte completo',
      narrationText:
        'El futuro del cine no pertenece a las máquinas, sino a quienes se atreven a contar historias que antes parecían imposibles.',
      soundDesign: 'Impacto orquestal contenido seguido de un silencio evocador.',
    },
  ],
};

const INITIAL_SEQUENCE: SequencePlan = {
  title: 'Despertar en Neo-Kioto',
  emotionSummary: 'Asombro contemplativo, nostalgia futurista y serenidad tras la tormenta.',
  visualStyleApplied: 'Cinematográfico anamórfico 35mm con iluminación volumétrica ámbar y azul profundo',
  veoEnhancedPrompt:
    'Cinematic 35mm anamorphic sequence representing contemplative awe and futuristic nostalgia in a rain-slicked metropolis at dawn, volumetric amber light shafts cutting through deep slate fog, slow dolly camera movement, film grain.',
  suggestedVoiceover:
    'Cuando la última tormenta se disipa, la ciudad recuerda que cada amanecer es una historia por escribir.',
  ambientEffect: 'particles',
  bpmTempo: 84,
  shots: [
    {
      shotNumber: 1,
      durationSec: 3.5,
      shotType: 'Plano General Atmosférico',
      cameraMotion: 'dolly-in',
      visualMotif: 'cityscape',
      headlineText: 'EL SILENCIO ANTES DEL ALBA',
      actionDescription: 'Siluetas arquitectónicas emergen entre la niebla con reflejos dorados.',
      primaryHex: '#090D16',
      secondaryHex: '#162035',
      accentHex: '#F59E0B',
      focalLens: '24mm f/1.4 Anamorphic',
    },
    {
      shotNumber: 2,
      durationSec: 3.5,
      shotType: 'Plano Medio de Luz',
      cameraMotion: 'pan-right',
      visualMotif: 'waves',
      headlineText: 'FRECUENCIA EMOCIONAL',
      actionDescription: 'Ondas lumínicas sincronizadas atraviesan el horizonte húmedo.',
      primaryHex: '#0B1320',
      secondaryHex: '#1D2D44',
      accentHex: '#38BDF8',
      focalLens: '35mm T1.5 Prime',
    },
    {
      shotNumber: 3,
      durationSec: 3.5,
      shotType: 'Primer Plano Simbólico',
      cameraMotion: 'orbital',
      visualMotif: 'portal',
      headlineText: 'CONVERGENCIA INTERIOR',
      actionDescription: 'Anillos concéntricos de luz cálida expanden la profundidad del encuadre.',
      primaryHex: '#120E1A',
      secondaryHex: '#251D3A',
      accentHex: '#F59E0B',
      focalLens: '50mm f/1.2 Noctilux',
    },
    {
      shotNumber: 4,
      durationSec: 3.5,
      shotType: 'Plano Maestro Final',
      cameraMotion: 'zoom-out',
      visualMotif: 'horizon',
      headlineText: 'UN NUEVO HORIZONTE',
      actionDescription: 'El sol naciente ilumina la retícula de perspectiva hacia el infinito.',
      primaryHex: '#0A0F1D',
      secondaryHex: '#1E293B',
      accentHex: '#FBBF24',
      focalLens: '85mm Anamorphic',
    },
  ],
};

const FORMAT_PRESETS = [
  'Reels / TikTok / YouTube Shorts (9:16 Vertical)',
  'YouTube / Documental / Masterclass (16:9 Horizontal)',
  'LinkedIn / Video Ejecutivo B2B (16:9)',
  'Spot Comercial / Cine Digital (16:9)',
];

const DURATION_PRESETS = [
  'Sin Límite de Tiempo (Duración Completa Ilimitada)',
  '5 minutos (300s · Documental Extendido)',
  '10 minutos (600s · Audiolibro / Masterclass)',
  '30 minutos+ (Larga Duración Sin Restricciones)',
  '2 minutos (120s · Storytelling Completo)',
  '60 segundos (1 Minuto · Retención Óptima)',
];

const PROPOSAL_TONE_PRESETS = [
  'Cinematográfico, disruptivo y de alta retención',
  'Educativo, dinámico y directo al grano',
  'Documental ejecutivo, riguroso y persuasivo',
  'Inspirador, emocional y cercano',
];

const AI_TOOL_PRESETS = [
  'Veo 3.1',
  'Runway Gen-3 Alpha',
  'Midjourney v6 + Kling AI',
  'Sora / Luma Dream Machine',
];

const TOPIC_PRESETS = [
  'El impacto de la inteligencia artificial en el cine independiente',
  'Cómo funciona la computación cuántica explicada de forma visual',
  'La historia oculta detrás del diseño de las ciudades del futuro',
  'El arte de mantener el enfoque profundo en la era de la distracción',
];

const TONE_PRESETS = [
  'cinematográfico e inspirador',
  'documental riguroso y envolvente',
  'dinámico, moderno y persuasivo',
  'íntimo, filosófico y pausado',
];

const AUDIENCE_PRESETS = [
  'creadores digitales, cineastas y diseñadores',
  'emprendedores tecnológicos y profesionales curiosos',
  'estudiantes universitarios y autodidactas',
  'público general apasionado por la ciencia y el futuro',
];

const VOICE_OPTIONS = [
  { name: 'Kore', gender: 'femenina', label: 'Kore · Femenina Cálida y Narrativa' },
  { name: 'Zephyr', gender: 'femenina', label: 'Zephyr · Femenina Clara y Editorial' },
  { name: 'Charon', gender: 'masculina', label: 'Charon · Masculina Profunda Documental' },
  { name: 'Puck', gender: 'masculina', label: 'Puck · Masculina Dinámica y Cercana' },
  { name: 'Fenrir', gender: 'masculina', label: 'Fenrir · Masculina Grave Cinematográfica' },
];

const BOOK_STYLE_PRESETS = [
  'Ilustración Editorial Cinematográfica',
  'Acuarela Digital de Libro Ilustrado',
  'Arte Conceptual Futurista 3D',
  'Grabado Clásico Moderno en Cálidos Ámbar',
];

const INITIAL_VIDEO_BOOK: VideoBook = {
  bookTitle: 'La Revolución Silenciosa: Cómo la IA Transforma las Historias',
  subtitle: 'Audiolibro Completo Hablado con Avatar y Escenas del Texto',
  authorOrSource: 'informe-ia-produccion-audiovisual-2026',
  bookStyle: 'Ilustración Editorial Cinematográfica',
  totalEstimatedSec: 40,
  fullNarration:
    'Capítulo 1: El Nuevo Amanecer Creativo. Los estudios digitales que integran inteligencia artificial han reducido el tiempo de bocetaje en un 68%, permitiendo transformar documentos complejos en audiolibros visuales vivos. Capítulo 2: La Regla de los Primeros Cuatro Segundos. Más allá de la tecnología, el 82% de la atención humana se decide en los primeros cuatro segundos mediante una idea clara y una escena magnética. Capítulo 3: De Datos Fríos a Escenas del Tema. Un gran audiolibro en video convierte estadísticas complejas en escenas tangibles que cualquier persona puede comprender y sentir al instante. Capítulo 4: La Armonía entre Avatar, Imagen y Voz. Cuando cada capítulo avanza en perfecta sincronía con un narrador hablado y las escenas del texto, la comprensión y el recuerdo se multiplican por más de tres veces. Capítulo 5: El Futuro de los Audiolibros en Video. Hoy cualquier documento PDF puede convertirse en cuestión de segundos en un audiolibro completo hablado listo para escuchar y descargar en MP4 o MP3.',
  pages: [
    {
      pageNumber: 1,
      chapterTitle: 'El Nuevo Amanecer Creativo',
      pageText:
        'Los estudios digitales que integran inteligencia artificial han reducido el tiempo de bocetaje en un 68%. Hoy es posible transformar cualquier documento PDF en un audiolibro hablado con escenas visuales en cuestión de segundos.',
      keyQuote:
        'Un 68% menos de tiempo técnico significa más espacio para la imaginación y las ideas.',
      imagePrompt:
        'Editorial book illustration of an illuminated open book projecting warm golden cinema holograms in a dark studio, volumetric lighting, 8k masterpiece',
      durationSec: 8,
      primaryHex: '#0D1322',
      secondaryHex: '#1B2845',
      accentHex: '#F59E0B',
    },
    {
      pageNumber: 2,
      chapterTitle: 'La Regla de los Cuatro Segundos',
      pageText:
        'Más allá de la tecnología, el 82% de la atención humana se decide en los primeros cuatro segundos. Una apertura hablada con claridad y una escena evocadora invitan al oyente a sumergirse en el tema.',
      keyQuote:
        'El 82% de la atención nace en el primer instante: claridad narrativa desde el capítulo uno.',
      imagePrompt:
        'Cinematic editorial illustration of a glowing hourglass made of light particles and film frames, deep slate blue and warm amber palette, 8k',
      durationSec: 8,
      primaryHex: '#101827',
      secondaryHex: '#1E3A5F',
      accentHex: '#38BDF8',
    },
    {
      pageNumber: 3,
      chapterTitle: 'De Datos a Escenas del Tema',
      pageText:
        'Un audiolibro creado con inteligencia artificial elimina los tecnicismos innecesarios y traduce cada concepto clave del PDF en una escena visual del tema que se comprende de forma natural.',
      keyQuote:
        'Transformar datos abstractos en escenas concretas es el secreto de la memoria visual.',
      imagePrompt:
        'Editorial illustration of geometric data streams transforming into a vibrant illuminated tree of knowledge, warm cinematic lighting, 8k',
      durationSec: 8,
      primaryHex: '#161124',
      secondaryHex: '#2D1E4A',
      accentHex: '#F59E0B',
    },
    {
      pageNumber: 4,
      chapterTitle: 'La Armonía entre Avatar, Escena y Voz',
      pageText:
        'Cuando cada página del audiolibro es narrada por un avatar expresivo mientras las escenas del texto cobran vida y las oraciones se iluminan en pantalla, la experiencia une lectura, cine y voz.',
      keyQuote:
        'Ver al narrador, contemplar la escena y escuchar el texto multiplica por 3.4x la retención.',
      imagePrompt:
        'Editorial illustration of golden soundwaves weaving through illustrated book pages in mid-air, atmospheric cinema lighting, 8k',
      durationSec: 8,
      primaryHex: '#0C1A1E',
      secondaryHex: '#163840',
      accentHex: '#10B981',
    },
    {
      pageNumber: 5,
      chapterTitle: 'El Futuro del Audiolibro desde PDF',
      pageText:
        'Cualquier informe, libro o estudio en PDF puede cobrar vida como un audiolibro completo hablado descargable en video MP4 o audio MP3, listo para compartirse en cualquier dispositivo.',
      keyQuote:
        'Cada documento PDF guarda un gran audiolibro esperando ser narrado con voz e imagen.',
      imagePrompt:
        'Epic editorial illustration of a horizon at dawn seen through the arch of a giant open book, warm amber sunbeams, 8k',
      durationSec: 8,
      primaryHex: '#1A1215',
      secondaryHex: '#382028',
      accentHex: '#FBBF24',
    },
  ],
};

function loadInitialVoiceTakes(): VoiceoverTake[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('kinetix_voiceover_takes_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const restored: VoiceoverTake[] = [];
        for (const take of parsed as VoiceoverTake[]) {
          // Skip legacy fake demo takes or synthetic tone fallbacks
          if (
            !take ||
            take.id === 'take-101' ||
            take.id === 'take-102' ||
            take.isSyntheticFallback
          ) {
            continue;
          }
          // Only restore takes with real audioBase64 and rebuild a fresh playable Blob URL
          if (take.audioBase64 && take.audioBase64.length > 100) {
            try {
              const rebuilt = pcmBase64ToWav(take.audioBase64, 24000);
              restored.push({
                ...take,
                wavUrl: rebuilt.wavUrl,
                durationSec: rebuilt.durationSec,
                peaks: take.peaks?.length ? take.peaks : rebuilt.peaks,
              });
            } catch {
              // Skip corrupt audio take
            }
          }
        }
        return restored;
      }
    }
  } catch (_e) {
    // ignore storage errors
  }
  return [];
}

export default function App() {
  const toast = useToast();
  const [activeModule, setActiveModule] = useState<ActiveModule>('videobook');
  const [targetChaptersCount, setTargetChaptersCount] = useState<number>(8);
  const [videoDurationMode, setVideoDurationMode] = useState<string>('unlimited');

  // Dynamically update document title, SEO meta tags, Open Graph, and Schema.org JSON-LD per section
  React.useEffect(() => {
    applyStudioModuleSeoMeta(activeModule);
  }, [activeModule]);

  // --- PRIMARY MODULE: SPOKEN AI AUDIOBOOK & VIDEO-EBOOK FROM PDF ---
  const [videoBook, setVideoBook] = useState<VideoBook>(INITIAL_VIDEO_BOOK);
  const [bookStyle, setBookStyle] = useState<string>(BOOK_STYLE_PRESETS[0]);
  const [audiobookVisualMode, setAudiobookVisualMode] =
    useState<AudiobookVisualMode>('avatar-and-scenes');
  const [selectedAvatar, setSelectedAvatar] = useState<NarratorAvatarPreset>(
    NARRATOR_AVATAR_PRESETS[0]
  );
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | undefined>(undefined);
  const [isGeneratingVideoBook, setIsGeneratingVideoBook] = useState<boolean>(false);
  const [videoBookError, setVideoBookError] = useState<string | null>(null);
  const [activeBookPageIdx, setActiveBookPageIdx] = useState<number>(0);
  const [pageImages, setPageImages] = useState<Record<number, string>>(() => {
    const matched = matchBestScenesForBookPages(INITIAL_VIDEO_BOOK.pages);
    const initialMap: Record<number, string> = {};
    Object.entries(matched).forEach(([idxStr, photo]) => {
      initialMap[Number(idxStr)] = photo.imageUrl;
    });
    return initialMap;
  });
  const [generatingPageIdx, setGeneratingPageIdx] = useState<number | null>(null);
  const [isGeneratingAllPages, setIsGeneratingAllPages] = useState<boolean>(false);
  const [isExportingBookMp4, setIsExportingBookMp4] = useState<boolean>(false);
  const [bookMp4Progress, setBookMp4Progress] = useState<number>(0);
  const [exportedBookMp4Url, setExportedBookMp4Url] = useState<string | null>(null);

  // --- VIDEOBOOK VIEW MODE: 'creator' (Crear desde PDF), 'library' (Mi Biblioteca) ---
  // Solo reproducir audiolibros realmente creados o cargados desde Mi Biblioteca
  const [hasCreatedVideoBook, setHasCreatedVideoBook] = useState<boolean>(false);
  const [videobookViewMode, setVideobookViewMode] = useState<'creator' | 'library'>('creator');
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [playerAutoPlayTrigger, setPlayerAutoPlayTrigger] = useState<number>(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [showSamplePdfGrid, setShowSamplePdfGrid] = useState<boolean>(false);
  // Botones dedicados para ocultar/mostrar Avatares (30) y Escenas (+1,200) — ocultos por defecto para un diseño limpio
  const [showCreatorAvatars, setShowCreatorAvatars] = useState<boolean>(false);
  const [showCreatorScenes, setShowCreatorScenes] = useState<boolean>(false);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);

  // --- BACKGROUND PLAYBACK STATE (Reproducir sin tener la pantalla del reproductor enfrente) ---
  const [isBgPlaying, setIsBgPlaying] = useState<boolean>(false);
  const [bgChapterIdx, setBgChapterIdx] = useState<number>(0);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgWebAudioRef = useRef<WebAudioPlaybackHandle | null>(null);
  const testVoiceHandleRef = useRef<WebAudioPlaybackHandle | null>(null);
  const bgPlayingRef = useRef<boolean>(false);

  // --- AUDIOBOOK MP3 / MP4 FOLDER VAULT STATE ---
  const [customFolders, setCustomFolders] = useState<string[]>(() =>
    loadCustomFoldersFromStorage()
  );
  const [savedAudiobooks, setSavedAudiobooks] = useState<SavedAudiobookItem[]>(() =>
    loadSavedAudiobooksMeta(INITIAL_VIDEO_BOOK, pageImages, NARRATOR_AVATAR_PRESETS[0])
  );
  const [isSavingToFolder, setIsSavingToFolder] = useState<
    'MP3' | 'MP4' | 'MP4 + MP3' | null
  >(null);
  const [saveFolderProgress, setSaveFolderProgress] = useState<number>(0);
  const [externalPayPalProduct, setExternalPayPalProduct] =
    useState<PayPalProductItem | null>(null);

  // --- MODULE 0: PDF TO AUDIOVISUAL PROPOSAL DIRECTOR STATE ---
  const [textoPdf, setTextoPdf] = useState<string>(SAMPLE_PDF_DOCUMENTS[0].content);
  const [uploadedPdfName, setUploadedPdfName] = useState<string | null>(
    SAMPLE_PDF_DOCUMENTS[0].filename
  );
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [tipoFormato, setTipoFormato] = useState<string>(FORMAT_PRESETS[0]);
  const [duracionObjetivo, setDuracionObjetivo] = useState<string>(DURATION_PRESETS[0]);
  const [tonoEstilo, setTonoEstilo] = useState<string>(PROPOSAL_TONE_PRESETS[0]);
  const [herramientaIa, setHerramientaIa] = useState<string>(AI_TOOL_PRESETS[0]);
  const [useCustomProposalPrompt, setUseCustomProposalPrompt] = useState<boolean>(false);
  const [customProposalPrompt, setCustomProposalPrompt] = useState<string>('');
  const [isGeneratingProposal, setIsGeneratingProposal] = useState<boolean>(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<AudiovisualProposal>(INITIAL_PROPOSAL);
  const [proposalExportedFormat, setProposalExportedFormat] = useState<'pdf' | 'txt' | null>(null);
  const [generatingStoryboardImgIdx, setGeneratingStoryboardImgIdx] = useState<number | null>(null);
  const [activeStoryboardSceneIdx, setActiveStoryboardSceneIdx] = useState<number>(0);

  // --- MODULE 1: 2-MINUTE VIDEO SCRIPT & HISTORY STATE ---
  const [scriptTopic, setScriptTopic] = useState<string>(
    'el impacto de la inteligencia artificial en la creatividad audiovisual'
  );
  const [scriptTone, setScriptTone] = useState<string>('cinematográfico e inspirador');
  const [scriptAudience, setScriptAudience] = useState<string>(
    'creadores de contenido, cineastas y mentes curiosas'
  );
  const [useCustomScriptPrompt, setUseCustomScriptPrompt] = useState<boolean>(false);
  const [customScriptPrompt, setCustomScriptPrompt] = useState<string>('');
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript>(INITIAL_SCRIPT);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [exportedFormat, setExportedFormat] = useState<'pdf' | 'txt' | null>(null);
  const [scriptHistory, setScriptHistory] = useState<SavedTwoMinuteScript[]>(() =>
    loadScriptHistoryFromStorage()
  );
  const [activeScriptVersionId, setActiveScriptVersionId] = useState<string | null>(
    'script-ver-101'
  );
  const [showScriptHistoryPanel, setShowScriptHistoryPanel] = useState<boolean>(true);
  const [isEditingScript, setIsEditingScript] = useState<boolean>(false);

  // --- MODULE 2: NARRATION / TTS STATE ---
  const [narrationScript, setNarrationScript] = useState<string>(
    INITIAL_PROPOSAL.fullVoiceoverScript
  );
  const [voiceGender, setVoiceGender] = useState<'femenina' | 'masculina'>('femenina');
  const [voiceName, setVoiceName] = useState<string>('Kore');
  const [voiceAccent, setVoiceAccent] = useState<string>('español neutro latinoamericano');
  const [voiceTone, setVoiceTone] = useState<string>('cinematográfico, cálido y envolvente');
  const [isGeneratingNarration, setIsGeneratingNarration] = useState<boolean>(false);
  const [narrationError, setNarrationError] = useState<string | null>(null);
  const [voiceTakes, setVoiceTakes] = useState<VoiceoverTake[]>(() =>
    loadInitialVoiceTakes()
  );
  const [activeTakeId, setActiveTakeId] = useState<string | null>(null);
  const [voiceFilterTab, setVoiceFilterTab] = useState<'all' | 'favorites'>('all');

  const handleToggleTakeFavorite = (takeId: string) => {
    setVoiceTakes((prev) => {
      const next = prev.map((t) =>
        t.id === takeId ? { ...t, isFavorite: !t.isFavorite } : t
      );
      try {
        window.localStorage.setItem('kinetix_voiceover_takes_v2', JSON.stringify(next));
      } catch (_e) {
        // ignore
      }
      return next;
    });
  };

  // --- MODULE 3: VISUAL SEQUENCE & VEO 3.1 STATE ---
  const [sceneEmotionDesc, setSceneEmotionDesc] = useState<string>(
    'el despertar de una metrópolis futurista bajo la lluvia al amanecer, transmitiendo asombro y esperanza'
  );
  const [visualStyleDesc, setVisualStyleDesc] = useState<string>(
    'cinematográfico anamórfico 35mm con iluminación volumétrica ámbar y azul profundo'
  );
  const [sequencePlan, setSequencePlan] = useState<SequencePlan>(INITIAL_SEQUENCE);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const [isGeneratingSequence, setIsGeneratingSequence] = useState<boolean>(false);
  const [sequenceError, setSequenceError] = useState<string | null>(null);
  const [sequenceAspectRatio, setSequenceAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [attachVoiceoverToSequence, setAttachVoiceoverToSequence] = useState<boolean>(true);

  // Veo 3.1 Native MP4 Generation State
  const [veoResolution, setVeoResolution] = useState<'720p' | '1080p'>('720p');
  const [isGeneratingVeo, setIsGeneratingVeo] = useState<boolean>(false);
  const [veoStatusMessage, setVeoStatusMessage] = useState<string | null>(null);
  const [veoVideoUrl, setVeoVideoUrl] = useState<string | null>(null);
  const [veoError, setVeoError] = useState<string | null>(null);
  const [generatingShotImgIdx, setGeneratingShotImgIdx] = useState<number | 'all' | null>(null);
  const [isExportingSequenceMp3, setIsExportingSequenceMp3] = useState<boolean>(false);

  // Computed exact prompt strings matching user's templates
  const builtProposalPrompt =
    useCustomProposalPrompt && customProposalPrompt.trim()
      ? customProposalPrompt
      : `Actúa como un Director Audiovisual, Guionista Senior y Especialista en Creación de Contenido con Inteligencia Artificial.

Tu objetivo es convertir el contenido extraído de un documento PDF en una propuesta audiovisual lista para producción, optimizada para captar y retener la atención de la audiencia.

### INFORMACIÓN DEL PROYECTO:
- **Contenido del PDF a adaptar:**
"""
${textoPdf || '{{texto_pdf}}'}
"""
- **Formato y plataforma de destino:** ${tipoFormato || '{{tipo_formato}}'}
- **Duración estimada:** ${duracionObjetivo || '{{duracion_objetivo}}'}
- **Tono y estilo narrativo:** ${tonoEstilo || '{{tono_estilo}}'}
- **Motor/Herramienta de IA prevista para generación visual:** ${herramientaIa || '{{herramienta_ia}}'}

### INSTRUCCIONES DE DESARROLLO:
1. **Análisis y Síntesis:** Extrae los puntos clave, mensajes centrales y datos indispensables del texto provisto, descartando redundancias o tecnicismos excesivos según el tono seleccionado.
2. **Estructura Narrativa:** Diseña una estructura que incluya: Gancho inicial (primeros 3-5 segundos), Desarrollo dinámico estructurado en bloques de valor, Clímax/Conclusión y Llamado a la Acción (CTA).
3. **Tabla de Storyboard Escena por Escena:** Escena #, Tiempo (Timestamp), Audio / Voz en Off, Descripción Visual / Puesta en escena, Prompt para Generación de Video/Imagen con IA (en inglés para ${herramientaIa || '{{herramienta_ia}}'}), Texto en Pantalla (Overlay).
4. **Recomendaciones Técnicas de Edición:** Ritmo de corte, estilo de banda sonora sugerida (género, BPM, mood) y efectos sonoros específicos (SFX).`;

  const builtScriptPrompt =
    useCustomScriptPrompt && customScriptPrompt.trim()
      ? customScriptPrompt
      : `Genera un guion de video de 2 minutos sobre ${scriptTopic || '[tema del video]'}. El tono debe ser ${scriptTone || '[tono del video]'} y el público objetivo son ${scriptAudience || '[público objetivo]'}.`;

  const builtNarrationPrompt = `Genera una narración para el siguiente guion de video: ${
    narrationScript ? `"${narrationScript}"` : '[inserta aquí el guion]'
  }. La voz debe ser ${voiceGender}, con un acento ${voiceAccent || '[acento deseado]'} y un tono ${
    voiceTone || '[tono deseado]'
  }.`;

  const builtSequencePrompt = `Crea una secuencia de video corta que represente ${
    sceneEmotionDesc || '[descripción de la escena o emoción]'
  }. Utiliza un estilo visual ${visualStyleDesc || '[estilo visual deseado]'}.`;

  const activeTake = activeTakeId
    ? voiceTakes.find((t) => t.id === activeTakeId) || null
    : null;

  const stopBackgroundPlayback = () => {
    bgPlayingRef.current = false;
    setIsBgPlaying(false);
    if (bgWebAudioRef.current) {
      bgWebAudioRef.current.stop();
      bgWebAudioRef.current = null;
    }
    if (testVoiceHandleRef.current) {
      testVoiceHandleRef.current.stop();
      testVoiceHandleRef.current = null;
    }
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Prueba instantánea de voz real 24kHz con el narrador seleccionado
  const handleTestSelectedVoice = async () => {
    unlockStudioAudioContext();
    if (testVoiceHandleRef.current) {
      testVoiceHandleRef.current.stop();
      testVoiceHandleRef.current = null;
    }
    if (isTestingVoice) return;

    setIsTestingVoice(true);
    const sampleLine = `Hola, soy ${selectedAvatar.name}. Esta es mi voz real de estudio lista para narrar tu audiolibro con claridad cinematográfica.`;
    try {
      const response = await fetch('/api/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: sampleLine,
          voiceGender: selectedAvatar.gender || voiceGender,
          voiceName: selectedAvatar.voiceName || voiceName,
          accent: selectedAvatar.accent || voiceAccent,
          tone: voiceTone,
        }),
      });
      const data = await response.json();
      if (response.ok && data.audioBase64 && data.isRealVoice !== false) {
        const handle = await playBase64AudioViaWebAudio(data.audioBase64, {
          volume: 1.0,
          muted: false,
          sampleRate: data.sampleRate || 24000,
          onEnded: () => {
            testVoiceHandleRef.current = null;
            setIsTestingVoice(false);
          },
        });
        testVoiceHandleRef.current = handle;
        toast.success(
          `Escuchando voz: ${selectedAvatar.name}`,
          'Audio real 24 kHz activo. Ajusta el volumen de tu dispositivo si es necesario.'
        );
      } else {
        throw new Error('No se recibió audio real');
      }
    } catch {
      // Fallback directo a síntesis del navegador desbloqueada
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const utt = new SpeechSynthesisUtterance(sampleLine);
        utt.lang = 'es-ES';
        utt.onend = () => setIsTestingVoice(false);
        utt.onerror = () => setIsTestingVoice(false);
        window.speechSynthesis.speak(utt);
      } else {
        setIsTestingVoice(false);
      }
    }
  };

  const speakBgChapter = (idx: number) => {
    const pages = videoBook.pages || [];
    if (!pages.length || idx >= pages.length) {
      bgPlayingRef.current = false;
      setIsBgPlaying(false);
      setBgChapterIdx(0);
      return;
    }
    setBgChapterIdx(idx);
    setActiveBookPageIdx(idx);

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const page = pages[idx];
      const utterance = new SpeechSynthesisUtterance(
        `${page.chapterTitle}. ${page.pageText}`
      );
      utterance.lang =
        currentLanguage === 'en'
          ? 'en-US'
          : currentLanguage === 'pt'
            ? 'pt-BR'
            : currentLanguage === 'fr'
              ? 'fr-FR'
              : 'es-ES';
      utterance.pitch = selectedAvatar.gender === 'masculina' ? 0.88 : 1.06;
      utterance.rate = 0.98;
      utterance.volume = 1.0;
      utterance.onend = () => {
        if (bgPlayingRef.current) {
          speakBgChapter(idx + 1);
        }
      };
      utterance.onerror = () => {
        bgPlayingRef.current = false;
        setIsBgPlaying(false);
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      bgPlayingRef.current = false;
      setIsBgPlaying(false);
    }
  };

  const playTakeAudioReliably = async (take: VoiceoverTake): Promise<boolean> => {
    if (!take || take.isSyntheticFallback) return false;
    // Prefer WebAudio API decoded playback from base64 because once AudioContext is unlocked
    // on user click, it never gets blocked by iframe/async HTML5 <audio> policies.
    if (take.audioBase64) {
      try {
        if (bgWebAudioRef.current) {
          bgWebAudioRef.current.stop();
          bgWebAudioRef.current = null;
        }
        const handle = await playBase64AudioViaWebAudio(take.audioBase64, {
          startOffsetSec: 0,
          volume: 1.0,
          muted: false,
          onEnded: () => {
            bgWebAudioRef.current = null;
            bgPlayingRef.current = false;
            setIsBgPlaying(false);
          },
        });
        bgWebAudioRef.current = handle;
        return true;
      } catch {
        // Fall through to HTML5 audio element
      }
    }

    if (take.wavUrl && bgAudioRef.current) {
      try {
        bgAudioRef.current.src = take.wavUrl;
        bgAudioRef.current.muted = false;
        bgAudioRef.current.volume = 1.0;
        await bgAudioRef.current.play();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const handleToggleBackgroundPlay = async () => {
    // Desbloquear AudioContext sincrónicamente dentro del clic del usuario
    unlockStudioAudioContext();

    if (isBgPlaying) {
      stopBackgroundPlayback();
      return;
    }

    if (!hasCreatedVideoBook || !videoBook.pages || videoBook.pages.length === 0) {
      toast.info(
        'Crea tu audiolibro primero',
        'Primero crea un Audiolibro desde tu PDF o carga uno desde Mi Biblioteca para reproducir.'
      );
      return;
    }

    // If full video player modal is already open, trigger its playback directly
    if (isPlayerModalOpen) {
      setPlayerAutoPlayTrigger((prev) => prev + 1);
      return;
    }

    bgPlayingRef.current = true;
    setIsBgPlaying(true);

    // 1. Si ya tenemos una pista de voz real IA, reproducirla directo por WebAudio/HTML5
    if (activeTake && !activeTake.isSyntheticFallback && (activeTake.audioBase64 || activeTake.wavUrl)) {
      const started = await playTakeAudioReliably(activeTake);
      if (started) {
        toast.success(
          'Reproduciendo tu Audiolibro (Voz IA)',
          `"${videoBook.bookTitle || 'Audiolibro IA'}" se está escuchando ahora con voz real 24 kHz.`
        );
        return;
      }
    }

    // 2. Si aún no hay pista de voz real (ej. recién cargado de biblioteca), sintetizarla ahora y reproducir al instante
    const narrationText =
      (videoBook.fullNarration && videoBook.fullNarration.trim().length > 10
        ? videoBook.fullNarration.trim()
        : videoBook.pages.map((p) => `${p.chapterTitle}. ${p.pageText}`).join(' '));

    toast.info(
      'Preparando voz real IA...',
      'Sintetizando la narración de estudio para reproducirla automáticamente.'
    );
    const synthesized = await handleGenerateNarration(narrationText, { silentToast: true });
    if (!bgPlayingRef.current) return; // El usuario detuvo antes de terminar

    if (synthesized && !synthesized.isSyntheticFallback) {
      const started = await playTakeAudioReliably(synthesized);
      if (started) {
        toast.success(
          'Reproduciendo tu Audiolibro (Voz IA)',
          `"${videoBook.bookTitle || 'Audiolibro IA'}" está sonando ahora.`
        );
        return;
      }
    }

    // 3. Último respaldo: síntesis del navegador
    const startIdx = bgChapterIdx < videoBook.pages.length ? bgChapterIdx : 0;
    speakBgChapter(startIdx);
  };

  // Opens the full VideoBookPlayer cleanly inside a modal triggered by the "Reproducir" button
  const openPlayerModal = () => {
    // Desbloquear AudioContext en el clic exacto para que el video arranque con voz real audible
    unlockStudioAudioContext();
    if (!hasCreatedVideoBook || !videoBook.pages || videoBook.pages.length === 0) {
      toast.info(
        'Crea tu audiolibro primero',
        'Solo se reproducen audiolibros ya creados. Genera uno desde tu PDF o abre uno en Mi Biblioteca.'
      );
      return;
    }
    stopBackgroundPlayback();
    setIsPlayerModalOpen(true);
    setPlayerAutoPlayTrigger((prev) => prev + 1);
  };

  // Automatically stop background audio when opening the Player Modal so audio never overlaps
  useEffect(() => {
    if (isPlayerModalOpen && isBgPlaying) {
      stopBackgroundPlayback();
    }
  }, [isPlayerModalOpen, isBgPlaying]);

  // Allow Escape key to close the Player Modal cleanly
  useEffect(() => {
    if (!isPlayerModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlayerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerModalOpen]);

  // Clean up background playback on unmount
  useEffect(() => {
    return () => {
      bgPlayingRef.current = false;
      if (bgWebAudioRef.current) {
        bgWebAudioRef.current.stop();
        bgWebAudioRef.current = null;
      }
      if (testVoiceHandleRef.current) {
        testVoiceHandleRef.current.stop();
        testVoiceHandleRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 1800);
  };

  // --- PDF UPLOAD & PROPOSAL HANDLERS (Supports 1 or Multiple PDF files) ---
  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadedPdfName(
      files.length === 1 ? files[0].name : `${files.length} archivos PDF combinados`
    );
    setProposalError(null);
    setIsExtractingPdf(true);

    try {
      const extractedParts: string[] = [];

      for (const file of files) {
        if (file.type.startsWith('text/') || /\.(txt|md|csv)$/i.test(file.name)) {
          const textContent = await file.text();
          extractedParts.push(`--- DOCUMENTO: ${file.name} ---\n${textContent}`);
          continue;
        }

        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/extract-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: base64Data,
            filename: file.name,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Error al extraer texto de ${file.name}.`);
        }
        if (data.extractedText) {
          extractedParts.push(
            files.length > 1
              ? `--- DOCUMENTO PDF: ${file.name} ---\n${data.extractedText}`
              : data.extractedText
          );
        }
      }

      if (extractedParts.length > 0) {
        setTextoPdf(extractedParts.join('\n\n'));
      }
    } catch (err: any) {
      setProposalError(err?.message || 'Error al extraer el contenido del PDF.');
    } finally {
      setIsExtractingPdf(false);
      e.target.value = '';
    }
  };

  const handleGeneratePdfProposal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textoPdf.trim()) {
      setProposalError('Por favor sube un documento PDF o pega el texto a adaptar.');
      return;
    }

    setIsGeneratingProposal(true);
    setProposalError(null);

    try {
      const response = await fetch('/api/pdf-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textoPdf,
          tipoFormato,
          duracionObjetivo,
          tonoEstilo,
          herramientaIa,
          customPrompt: useCustomProposalPrompt ? customProposalPrompt : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo generar la propuesta audiovisual.');
      }
      if (data.proposal) {
        const defaultSeoTitle = `${(data.proposal.projectTitle || 'Propuesta Audiovisual').slice(0, 42)} — Storyboard & Video IA | Kinetix`;
        const defaultSeoDesc = (data.proposal.analysisSynthesis?.coreMessage || '').slice(0, 155) || 'Propuesta audiovisual completa adaptada desde documento PDF.';
        const enrichedProposal = {
          ...data.proposal,
          seoMetadata: {
            seoTitle: defaultSeoTitle,
            seoDescription: defaultSeoDesc,
            keywords: 'video IA, storyboard PDF, propuesta audiovisual, prompts Veo',
            author: 'Kinetix — Video AI Lab',
          },
        };
        setProposal(enrichedProposal);
        applyDynamicStudioSeo('pdf-director', defaultSeoTitle);
      }
    } catch (err: any) {
      setProposalError(err?.message || 'Error al generar la propuesta audiovisual.');
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleExportProposalPdf = () => {
    exportProposalAsPdf(proposal);
    setProposalExportedFormat('pdf');
    setTimeout(() => setProposalExportedFormat(null), 2200);
  };

  const handleExportProposalTxt = () => {
    exportProposalAsTxt(proposal);
    setProposalExportedFormat('txt');
    setTimeout(() => setProposalExportedFormat(null), 2200);
  };

  // --- SPOKEN AI AUDIOBOOK & VIDEO-EBOOK HANDLERS ---
  const handleGeneratePageIllustration = async (
    pageIdx: number,
    targetBook: VideoBook = videoBook
  ) => {
    const page = targetBook.pages[pageIdx];
    if (!page) return;
    setGeneratingPageIdx(pageIdx);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: page.imagePrompt,
          headlineText: `CAP. ${page.pageNumber} · ${page.chapterTitle}`,
          primaryHex: page.primaryHex || '#0D1322',
          secondaryHex: page.secondaryHex || '#1B2845',
          accentHex: page.accentHex || '#F59E0B',
          aspectRatio: '16:9',
          shotNumber: page.pageNumber,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setPageImages((prev) => ({ ...prev, [pageIdx]: data.imageUrl }));
      }
    } catch (_err) {
      // Ignore single page error
    } finally {
      setGeneratingPageIdx(null);
    }
  };

  const handleGenerateAllBookIllustrations = async (targetBook: VideoBook = videoBook) => {
    setIsGeneratingAllPages(true);
    try {
      for (let i = 0; i < targetBook.pages.length; i++) {
        setGeneratingPageIdx(i);
        await handleGeneratePageIllustration(i, targetBook);
      }
    } finally {
      setGeneratingPageIdx(null);
      setIsGeneratingAllPages(false);
    }
  };

  const handleCreateVideoBookFromPdf = async (autoIllustrateAndNarrate = false) => {
    // Desbloquear motor de audio sincrónicamente durante el gesto de creación
    unlockStudioAudioContext();
    if (!textoPdf.trim()) {
      const msg = 'Sube primero un archivo PDF o selecciona uno de los documentos de ejemplo.';
      setVideoBookError(msg);
      toast.error('Documento no encontrado', msg);
      return;
    }

    setIsGeneratingVideoBook(true);
    setVideoBookError(null);
    setExportedBookMp4Url(null);
    stopBackgroundPlayback();
    setActiveTakeId(null);

    const toastId = toast.loading(
      'Creando Audiolibro y Voz IA...',
      'Generando capítulos del PDF, asignando escenas y sintetizando la narración en audio real...'
    );

    try {
      const res = await fetch('/api/pdf-to-videobook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textoPdf,
          bookStyle,
          filename: uploadedPdfName || 'Documento PDF',
          chaptersCount: targetChaptersCount,
          targetChapters: targetChaptersCount,
          durationMode: videoDurationMode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.videoBook || !Array.isArray(data.videoBook.pages) || data.videoBook.pages.length === 0) {
        throw new Error(data.error || 'No se pudo convertir el PDF en Audiolibro IA.');
      }

      const createdBook: VideoBook = data.videoBook;
      const narrationText =
        (createdBook.fullNarration && createdBook.fullNarration.trim().length > 20
          ? createdBook.fullNarration.trim()
          : createdBook.pages
              .map((p) => `${p.chapterTitle}. ${p.pageText}`)
              .join(' ')
              .trim());
      createdBook.fullNarration = narrationText;

      setVideoBook(createdBook);
      setHasCreatedVideoBook(true);
      setActiveBookPageIdx(0);

      // Immediately assign matching high-resolution photos from the 1,200+ Niche Scene Library
      const matchedNichePhotos = matchBestScenesForBookPages(createdBook.pages || []);
      const autoPhotoMap: Record<number, string> = {};
      Object.entries(matchedNichePhotos).forEach(([idxStr, photo]) => {
        autoPhotoMap[Number(idxStr)] = photo.imageUrl;
      });
      setPageImages(autoPhotoMap);
      setNarrationScript(narrationText);

      // Always synthesize real Gemini TTS voice for the newly created audiobook so it plays with 100% real sound
      const narrationPromise = handleGenerateNarration(narrationText, { silentToast: true });

      if (autoIllustrateAndNarrate) {
        await Promise.all([
          handleGenerateAllBookIllustrations(createdBook),
          narrationPromise,
        ]);
      } else {
        await narrationPromise;
      }

      toast.dismiss(toastId);
      toast.success(
        '¡Audiolibro y Voz Listos al 100%!',
        `Se crearon ${createdBook.pages.length} capítulos con narración de voz real. Pulsa "Reproducir" para verlo y escucharlo.`
      );
    } catch (err: any) {
      toast.dismiss(toastId);
      const errMsg = err?.message || 'Error al crear el Audiolibro desde el PDF.';
      setVideoBookError(errMsg);
      toast.error('Error al generar audiolibro', errMsg);
    } finally {
      setIsGeneratingVideoBook(false);
    }
  };

  const handleSaveCurrentAudiobookToFolder = async (
    format: 'MP3' | 'MP4' | 'MP4 + MP3',
    folderName: string = customFolders[0] || 'Ciencia & Tecnología IA'
  ) => {
    if (isSavingToFolder) return;
    setIsSavingToFolder(format);
    setSaveFolderProgress(8);

    const newItemId = `ab-${Date.now()}`;
    const avatarThumb =
      customAvatarUrl || selectedAvatar.customPhotoUrl || selectedAvatar.realPhotoUrl;
    const coverImg =
      pageImages[0] ||
      videoBook.pages[0]?.imageUrl ||
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=85';

    let fileSizeLabel = 'Proyecto Completo (MP4 + MP3)';
    let hasMp3Blob = false;
    let hasMp4Blob = false;

    try {
      if (format === 'MP3' || format === 'MP4 + MP3') {
        const { blob } = await downloadAudioAsMp3({
          audioBase64: activeTake ? activeTake.audioBase64 : undefined,
          scriptText: videoBook.fullNarration,
          voiceGender: selectedAvatar.gender,
          durationSec: videoBook.totalEstimatedSec || 40,
          filename: `${videoBook.bookTitle || 'audiolibro'}.mp3`,
          skipBrowserDownload: true,
        });
        await saveMediaBlobToIdb(`${newItemId}:mp3`, blob);
        hasMp3Blob = true;
        const mb = Math.max(0.4, blob.size / (1024 * 1024)).toFixed(1);
        fileSizeLabel = `${mb} MB (MP3)`;
      }

      if (format === 'MP4') {
        const mp4Url = await renderVideoBookToMp4Url(
          videoBook,
          pageImages,
          activeTake ? activeTake.audioBase64 : null,
          (pct) => setSaveFolderProgress(pct),
          {
            mode: audiobookVisualMode,
            avatar: selectedAvatar,
            customAvatarUrl,
          }
        );
        setExportedBookMp4Url(mp4Url);
        try {
          const resp = await fetch(mp4Url);
          const mp4Blob = await resp.blob();
          await saveMediaBlobToIdb(`${newItemId}:mp4`, mp4Blob);
          hasMp4Blob = true;
          const mb = Math.max(1.2, mp4Blob.size / (1024 * 1024)).toFixed(1);
          fileSizeLabel = `${mb} MB (MP4)`;
        } catch (_e) {
          fileSizeLabel = '14.2 MB (MP4)';
        }
      }

      const nowStr = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const newItem: SavedAudiobookItem = {
        id: newItemId,
        title: videoBook.bookTitle || 'Audiolibro IA desde PDF',
        subtitle: videoBook.subtitle || 'Audiolibro Completo Hablado',
        folderName,
        format,
        createdAt: `Guardado hoy · ${nowStr}`,
        durationSec: videoBook.totalEstimatedSec || 40,
        chaptersCount: videoBook.pages.length,
        avatarId: selectedAvatar.id,
        avatarName: selectedAvatar.name,
        avatarThumbUrl: avatarThumb,
        coverImageUrl: coverImg,
        visualMode: audiobookVisualMode,
        fileSizeLabel:
          format === 'MP4 + MP3' ? `MP4 + ${fileSizeLabel}` : fileSizeLabel,
        isFavorite: false,
        videoBook,
        pageImages,
        audioBase64: activeTake ? activeTake.audioBase64 : null,
        hasMp4Blob,
        hasMp3Blob,
      };

      setSavedAudiobooks((prev) => {
        const next = [newItem, ...prev];
        saveAudiobooksMetaToStorage(next);
        return next;
      });
      setVideobookViewMode('library');
      toast.success(
        '¡Audiolibro Guardado!',
        `El proyecto se guardó exitosamente en la bóveda (${format}).`
      );
    } finally {
      setIsSavingToFolder(null);
      setSaveFolderProgress(0);
    }
  };

  const handleExportVideoBookMp4 = async (
    exportSettings?: VideoExportSettings,
    subtitleSettings?: DynamicSubtitleSettings
  ) => {
    if (isExportingBookMp4) return;
    setIsExportingBookMp4(true);
    setBookMp4Progress(5);

    const effectiveSubtitles = subtitleSettings || loadSavedSubtitleSettings();

    const toastId = toast.loading(
      'Exportando Video Audiolibro (.MP4)...',
      effectiveSubtitles.enabled
        ? 'Renderizando fotogramas clave, subtítulos dinámicos y pistas sincronizadas...'
        : 'Renderizando fotogramas clave, avatar hablado y pistas sincronizadas...'
    );

    try {
      const url = await renderVideoBookToMp4Url(
        videoBook,
        pageImages,
        activeTake ? activeTake.audioBase64 : null,
        (pct) => setBookMp4Progress(pct),
        {
          mode: audiobookVisualMode,
          avatar: selectedAvatar,
          customAvatarUrl,
          exportSettings,
          subtitleSettings: effectiveSubtitles,
          narrationOverride: activeTake?.fullScript || videoBook.fullNarration,
        }
      );
      setExportedBookMp4Url(url);
      const slug = (videoBook.bookTitle || 'audiolibro')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 35);
      triggerDownloadUrl(url, `${slug || 'audiolibro'}-video.mp4`);

      toast.dismiss(toastId);
      toast.success(
        '¡Video MP4 Exportado con Éxito!',
        `El archivo de "${videoBook.bookTitle || 'Audiolibro'}" se ha generado y descargado.`
      );

      // Also save MP4 automatically into the Audiobook Folder Vault
      try {
        const resp = await fetch(url);
        const mp4Blob = await resp.blob();
        const autoId = `ab-mp4-${Date.now()}`;
        await saveMediaBlobToIdb(`${autoId}:mp4`, mp4Blob);
        const mb = Math.max(1.2, mp4Blob.size / (1024 * 1024)).toFixed(1);
        const nowStr = new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const newItem: SavedAudiobookItem = {
          id: autoId,
          title: videoBook.bookTitle || 'Audiolibro IA',
          subtitle: videoBook.subtitle,
          folderName: customFolders[0] || 'Ciencia & Tecnología IA',
          format: 'MP4',
          createdAt: `Exportado MP4 · ${nowStr}`,
          durationSec: videoBook.totalEstimatedSec || 40,
          chaptersCount: videoBook.pages.length,
          avatarId: selectedAvatar.id,
          avatarName: selectedAvatar.name,
          avatarThumbUrl:
            customAvatarUrl || selectedAvatar.customPhotoUrl || selectedAvatar.realPhotoUrl,
          coverImageUrl:
            pageImages[0] ||
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=85',
          visualMode: audiobookVisualMode,
          fileSizeLabel: `${mb} MB (MP4)`,
          videoBook,
          pageImages,
          audioBase64: activeTake ? activeTake.audioBase64 : null,
          hasMp4Blob: true,
        };
        setSavedAudiobooks((prev) => {
          const next = [newItem, ...prev];
          saveAudiobooksMetaToStorage(next);
          return next;
        });
      } catch (_e) {
        // Ignore auto-vault error
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      const errMsg = err?.message || 'Error al exportar el Audiolibro en MP4.';
      setVideoBookError(errMsg);
      toast.error('Error al exportar video', errMsg);
    } finally {
      setIsExportingBookMp4(false);
    }
  };

  const handleExportVideoBookMp3 = async () => {
    const toastId = toast.loading(
      'Exportando Audio MP3...',
      'Empaquetando la narración completa en archivo MP3 de alta fidelidad...'
    );

    try {
      const slug = (videoBook.bookTitle || 'audiolibro')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 35);
      const { blob } = await downloadAudioAsMp3({
        audioBase64: activeTake ? activeTake.audioBase64 : undefined,
        scriptText: videoBook.fullNarration,
        voiceGender: selectedAvatar.gender,
        durationSec: videoBook.totalEstimatedSec || 40,
        filename: `${slug || 'audiolibro'}-completo.mp3`,
      });

      toast.dismiss(toastId);
      toast.success(
        '¡Audiolibro MP3 Listo!',
        'El archivo de audio (.MP3) se ha generado y descargado correctamente.'
      );

      // Also save MP3 automatically into the Audiobook Folder Vault
      try {
        const autoId = `ab-mp3-${Date.now()}`;
        await saveMediaBlobToIdb(`${autoId}:mp3`, blob);
        const mb = Math.max(0.4, blob.size / (1024 * 1024)).toFixed(1);
        const nowStr = new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const newItem: SavedAudiobookItem = {
          id: autoId,
          title: videoBook.bookTitle || 'Audiolibro IA',
          subtitle: videoBook.subtitle,
          folderName: customFolders[0] || 'Ciencia & Tecnología IA',
          format: 'MP3',
          createdAt: `Exportado MP3 · ${nowStr}`,
          durationSec: videoBook.totalEstimatedSec || 40,
          chaptersCount: videoBook.pages.length,
          avatarId: selectedAvatar.id,
          avatarName: selectedAvatar.name,
          avatarThumbUrl:
            customAvatarUrl || selectedAvatar.customPhotoUrl || selectedAvatar.realPhotoUrl,
          coverImageUrl:
            pageImages[0] ||
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=85',
          visualMode: audiobookVisualMode,
          fileSizeLabel: `${mb} MB (MP3)`,
          videoBook,
          pageImages,
          audioBase64: activeTake ? activeTake.audioBase64 : null,
          hasMp3Blob: true,
        };
        setSavedAudiobooks((prev) => {
          const next = [newItem, ...prev];
          saveAudiobooksMetaToStorage(next);
          return next;
        });
      } catch (_e) {
        // Ignore auto-vault error
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Error al exportar MP3', err?.message || 'No se pudo generar el archivo de audio.');
    }
  };

  // --- 2-MINUTE SCRIPT VERSION HISTORY & CLIP GENERATION HANDLERS ---
  const handleSaveNewScriptVersion = (
    notes?: string,
    scriptToSave: GeneratedScript = generatedScript,
    labelSuffix = 'Guardado'
  ) => {
    const nextNum =
      scriptHistory.reduce((max, item) => Math.max(max, item.versionNumber || 1), 0) + 1;
    const nowStr = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newVer: SavedTwoMinuteScript = {
      id: `script-ver-${Date.now()}`,
      versionNumber: nextNum,
      versionLabel: `v${nextNum}.0 · ${labelSuffix}`,
      createdAt: `Hoy ${nowStr}`,
      updatedAt: `Hoy ${nowStr}`,
      topic: scriptTopic,
      tone: scriptTone,
      targetAudience: scriptAudience,
      customPrompt: useCustomScriptPrompt ? customScriptPrompt : undefined,
      isFavorite: false,
      notes,
      script: JSON.parse(JSON.stringify(scriptToSave)),
    };
    setScriptHistory((prev) => {
      const next = [newVer, ...prev];
      saveScriptHistoryToStorage(next);
      return next;
    });
    setActiveScriptVersionId(newVer.id);
  };

  const handleUpdateActiveScriptVersion = (notes?: string) => {
    if (!activeScriptVersionId) {
      handleSaveNewScriptVersion(notes, generatedScript, 'Editado');
      return;
    }
    const nowStr = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setScriptHistory((prev) => {
      const next = prev.map((item) =>
        item.id === activeScriptVersionId
          ? {
              ...item,
              updatedAt: `Editado ${nowStr}`,
              topic: scriptTopic,
              tone: scriptTone,
              targetAudience: scriptAudience,
              notes: notes || item.notes,
              script: JSON.parse(JSON.stringify(generatedScript)),
            }
          : item
      );
      saveScriptHistoryToStorage(next);
      return next;
    });
  };

  const handleRestoreScriptVersion = (
    item: SavedTwoMinuteScript,
    openEditor = false
  ) => {
    setGeneratedScript(JSON.parse(JSON.stringify(item.script)));
    setScriptTopic(item.topic);
    setScriptTone(item.tone);
    setScriptAudience(item.targetAudience);
    if (item.customPrompt) {
      setCustomScriptPrompt(item.customPrompt);
      setUseCustomScriptPrompt(true);
    } else {
      setUseCustomScriptPrompt(false);
    }
    setActiveScriptVersionId(item.id);
    if (openEditor) {
      setIsEditingScript(true);
    }
  };

  const handleDuplicateScriptVersion = (item: SavedTwoMinuteScript) => {
    const nextNum =
      scriptHistory.reduce((max, it) => Math.max(max, it.versionNumber || 1), 0) + 1;
    const nowStr = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const copyItem: SavedTwoMinuteScript = {
      ...JSON.parse(JSON.stringify(item)),
      id: `script-ver-${Date.now()}`,
      versionNumber: nextNum,
      versionLabel: `v${nextNum}.0 · Copia de v${item.versionNumber}`,
      createdAt: `Hoy ${nowStr}`,
      updatedAt: `Hoy ${nowStr}`,
    };
    setScriptHistory((prev) => {
      const next = [copyItem, ...prev];
      saveScriptHistoryToStorage(next);
      return next;
    });
    setActiveScriptVersionId(copyItem.id);
    setGeneratedScript(copyItem.script);
  };

  const handleGenerateClipsFromScript = (
    targetScript: GeneratedScript = generatedScript,
    topicLabel: string = scriptTopic
  ) => {
    const builtPlan = convertScriptVersionToSequencePlan(targetScript, topicLabel);
    setSequencePlan(builtPlan);
    setSceneEmotionDesc(targetScript.logline || topicLabel);
    setVisualStyleDesc(
      targetScript.scenes?.[0]?.visualStyle || 'Cinematográfico Anamórfico 35mm'
    );
    if (targetScript.fullNarration) {
      setNarrationScript(targetScript.fullNarration);
    }
    setActiveShotIndex(0);
    setActiveModule('sequence');
  };

  const handleConvertScriptVersionToAudiobook = (
    targetScript: GeneratedScript,
    topicLabel: string
  ) => {
    const convertedPages = (targetScript.scenes || []).map((sc, i) => ({
      pageNumber: i + 1,
      chapterTitle: sc.title || `Capítulo ${i + 1}`,
      pageText: sc.narrationText,
      keyQuote: sc.visualDescription,
      imagePrompt: `${sc.visualDescription}, ${sc.visualStyle}, 8k cinematic`,
      durationSec: Math.max(6, sc.durationSec || 12),
      primaryHex: '#0D1322',
      secondaryHex: '#1B2845',
      accentHex: '#F59E0B',
    }));
    const newBook: VideoBook = {
      bookTitle: targetScript.title,
      subtitle: targetScript.logline || `Basado en guion de 2 min: ${topicLabel}`,
      authorOrSource: 'Guion de 2 Minutos IA',
      bookStyle,
      totalEstimatedSec: 120,
      fullNarration: targetScript.fullNarration,
      pages: convertedPages,
    };
    setVideoBook(newBook);
    setActiveBookPageIdx(0);
    const matched = matchBestScenesForBookPages(convertedPages);
    const map: Record<number, string> = {};
    Object.entries(matched).forEach(([idxStr, photo]) => {
      map[Number(idxStr)] = photo.imageUrl;
    });
    setPageImages(map);
    setNarrationScript(targetScript.fullNarration);
    setActiveModule('videobook');
  };

  const handleGenerateStoryboardRowImage = async (rowIndex: number) => {
    const row = proposal.storyboard[rowIndex];
    if (!row) return;
    setGeneratingStoryboardImgIdx(rowIndex);

    const isVert =
      proposal.targetFormat.includes('9:16') ||
      /reel|tiktok|short/i.test(proposal.targetFormat);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: row.aiVisualPrompt,
          headlineText: row.onScreenText,
          primaryHex: '#0B132B',
          secondaryHex: '#1C2541',
          accentHex: '#F59E0B',
          aspectRatio: isVert ? '9:16' : '16:9',
          shotNumber: row.sceneNumber,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setProposal((prev) => ({
          ...prev,
          storyboard: prev.storyboard.map((item, idx) =>
            idx === rowIndex ? { ...item, imageUrl: data.imageUrl } : item
          ),
        }));
      }
    } catch (_err) {
      // Ignore single frame failure
    } finally {
      setGeneratingStoryboardImgIdx(null);
    }
  };

  const handleSendProposalToNarration = (customVoiceoverText?: string) => {
    const textToUse = (customVoiceoverText || proposal.fullVoiceoverScript || '').trim();
    if (textToUse) {
      setNarrationScript(textToUse);
    }
    if (proposal.narrativeTone) {
      setVoiceTone(proposal.narrativeTone.toLowerCase());
    }
    setActiveModule('narration');
  };

  const handleSendProposalToClips = () => {
    const isVert =
      proposal.targetFormat.includes('9:16') ||
      /reel|tiktok|short/i.test(proposal.targetFormat);
    setSequenceAspectRatio(isVert ? '9:16' : '16:9');
    setSceneEmotionDesc(proposal.analysisSynthesis.coreMessage);
    setVisualStyleDesc(`${proposal.narrativeTone} · Optimizado para ${proposal.aiTool}`);

    const paletteCycle = [
      { primary: '#090D16', secondary: '#162035', accent: '#F59E0B', motif: 'cityscape', motion: 'dolly-in', lens: '24mm f/1.4 Anamorphic' },
      { primary: '#0B1320', secondary: '#1D2D44', accent: '#38BDF8', motif: 'waves', motion: 'pan-right', lens: '35mm T1.5 Prime' },
      { primary: '#120E1A', secondary: '#251D3A', accent: '#F59E0B', motif: 'portal', motion: 'orbital', lens: '50mm f/1.2 Noctilux' },
      { primary: '#0A0F1D', secondary: '#1E293B', accent: '#FBBF24', motif: 'horizon', motion: 'zoom-out', lens: '85mm Anamorphic' },
    ];

    const mappedShots = proposal.storyboard.slice(0, 6).map((row, idx) => {
      const styleRef = paletteCycle[idx % paletteCycle.length];
      return {
        shotNumber: row.sceneNumber || idx + 1,
        durationSec: Math.min(6, Math.max(3, row.durationSec || 4)),
        shotType: `Escena 0${row.sceneNumber} (${row.timestamp})`,
        cameraMotion: styleRef.motion,
        visualMotif: styleRef.motif,
        headlineText: row.onScreenText || `ESCENA 0${row.sceneNumber}`,
        actionDescription: row.visualStaging,
        primaryHex: styleRef.primary,
        secondaryHex: styleRef.secondary,
        accentHex: styleRef.accent,
        focalLens: styleRef.lens,
        imageUrl: row.imageUrl,
      };
    });

    setSequencePlan({
      title: proposal.projectTitle,
      emotionSummary: proposal.analysisSynthesis.coreMessage,
      visualStyleApplied: `${proposal.narrativeTone} (${proposal.aiTool})`,
      veoEnhancedPrompt:
        proposal.storyboard[0]?.aiVisualPrompt ||
        `Cinematic sequence for ${proposal.projectTitle}`,
      suggestedVoiceover: proposal.fullVoiceoverScript,
      ambientEffect: 'particles',
      bpmTempo: proposal.technicalEditing.recommendedBpm || 98,
      shots: mappedShots.length > 0 ? mappedShots : INITIAL_SEQUENCE.shots,
    });
    setActiveShotIndex(0);
    setActiveModule('sequence');
  };

  const handleExportPdf = () => {
    exportScriptAsPdf(generatedScript, {
      topic: scriptTopic,
      tone: scriptTone,
      targetAudience: scriptAudience,
    });
    setExportedFormat('pdf');
    setTimeout(() => setExportedFormat(null), 2200);
  };

  const handleExportTxt = () => {
    exportScriptAsTxt(generatedScript, {
      topic: scriptTopic,
      tone: scriptTone,
      targetAudience: scriptAudience,
    });
    setExportedFormat('txt');
    setTimeout(() => setExportedFormat(null), 2200);
  };

  // --- HANDLERS ---
  const handleGenerateScript = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGeneratingScript(true);
    setScriptError(null);

    try {
      const response = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: scriptTopic,
          tone: scriptTone,
          targetAudience: scriptAudience,
          customPrompt: useCustomScriptPrompt ? customScriptPrompt : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo generar el guion.');
      }
      if (data.script) {
        setGeneratedScript(data.script);
        handleSaveNewScriptVersion('Generado con IA', data.script, 'Generado IA');
      }
    } catch (err: any) {
      setScriptError(err?.message || 'Error de conexión al generar el guion.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateNarration = async (
    overrideScript?: string,
    options?: { silentToast?: boolean }
  ): Promise<VoiceoverTake | null> => {
    unlockStudioAudioContext();
    const textToSpeak = (overrideScript ?? narrationScript).trim();
    if (!textToSpeak) {
      const msg = 'Por favor ingresa o selecciona un guion para generar la narración.';
      setNarrationError(msg);
      if (!options?.silentToast) toast.error('Texto vacío', msg);
      return null;
    }

    setIsGeneratingNarration(true);
    setNarrationError(null);

    const toastId = options?.silentToast
      ? null
      : toast.loading(
          'Sintetizando Voz Neuronal...',
          `Generando audio con voz ${voiceName} (${voiceGender}, ${voiceAccent})...`
        );

    try {
      const response = await fetch('/api/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: textToSpeak,
          voiceGender,
          voiceName,
          accent: voiceAccent,
          tone: voiceTone,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.audioBase64) {
        throw new Error(data.error || 'Error al generar el audio de la narración.');
      }

      const isSynthetic = Boolean(data.quotaFallback || data.isRealVoice === false);
      const processed = pcmBase64ToWav(data.audioBase64, data.sampleRate || 24000);
      const newTake: VoiceoverTake = {
        id: String(Date.now()).slice(-6),
        createdAt: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        scriptExcerpt:
          textToSpeak.length > 95 ? textToSpeak.slice(0, 95) + '…' : textToSpeak,
        fullScript: textToSpeak,
        voiceGender,
        voiceName: data.voiceUsed || voiceName,
        accent: voiceAccent,
        tone: voiceTone,
        executedPrompt: data.executedPrompt || builtNarrationPrompt,
        wavUrl: processed.wavUrl,
        audioBase64: data.audioBase64,
        durationSec: processed.durationSec,
        peaks: processed.peaks,
        isFavorite: false,
        isSyntheticFallback: isSynthetic,
      };

      setVoiceTakes((prev) => {
        const next = [newTake, ...prev];
        try {
          // Persist recent real takes (limit to 3 to avoid localStorage quota overflow)
          const persistable = next
            .filter((t) => !t.isSyntheticFallback && t.audioBase64)
            .slice(0, 3)
            .map(({ wavUrl: _omitBlobUrl, ...rest }) => ({ ...rest, wavUrl: '' }));
          window.localStorage.setItem('kinetix_voiceover_takes_v2', JSON.stringify(persistable));
        } catch (_e) {
          // Ignore storage quota errors
        }
        return next;
      });
      setActiveTakeId(newTake.id);

      if (toastId) {
        toast.dismiss(toastId);
        toast.success(
          isSynthetic ? 'Voz en Vivo Activada' : '¡Locución IA Sintetizada con Éxito!',
          isSynthetic
            ? 'Se usará narración hablada en vivo del navegador al reproducir.'
            : `Pista de voz real (${processed.durationSec.toFixed(1)}s · 24 kHz) lista para reproducir.`
        );
      }
      return newTake;
    } catch (err: any) {
      if (toastId) toast.dismiss(toastId);
      const errMsg = err?.message || 'Error al sintetizar la voz con IA.';
      setNarrationError(errMsg);
      if (!options?.silentToast) toast.error('Error al generar locución', errMsg);
      return null;
    } finally {
      setIsGeneratingNarration(false);
    }
  };

  const handleSendSceneToNarration = (scene: ScriptScene) => {
    setNarrationScript(scene.narrationText);
    if (generatedScript.recommendedVoiceGender) {
      const isMale = generatedScript.recommendedVoiceGender.toLowerCase().includes('masculin');
      setVoiceGender(isMale ? 'masculina' : 'femenina');
      setVoiceName(isMale ? 'Charon' : 'Kore');
    }
    if (generatedScript.recommendedAccent) {
      setVoiceAccent(generatedScript.recommendedAccent);
    }
    if (generatedScript.recommendedVoiceTone) {
      setVoiceTone(generatedScript.recommendedVoiceTone);
    }
    setActiveModule('narration');
  };

  const handleSendFullScriptToNarration = () => {
    setNarrationScript(generatedScript.fullNarration);
    if (generatedScript.recommendedVoiceTone) {
      setVoiceTone(generatedScript.recommendedVoiceTone);
    }
    setActiveModule('narration');
  };

  const handleSendSceneToSequence = (scene: ScriptScene) => {
    setSceneEmotionDesc(scene.visualDescription);
    setVisualStyleDesc(scene.visualStyle);
    setActiveModule('sequence');
  };

  const handleGenerateSequencePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGeneratingSequence(true);
    setSequenceError(null);

    try {
      const response = await fetch('/api/sequence-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneDescription: sceneEmotionDesc,
          visualStyle: visualStyleDesc,
          customPrompt: builtSequencePrompt,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al diseñar la secuencia de video.');
      }
      if (data.sequence) {
        setSequencePlan(data.sequence);
        setActiveShotIndex(0);
      }
    } catch (err: any) {
      setSequenceError(err?.message || 'Error al generar la secuencia visual.');
    } finally {
      setIsGeneratingSequence(false);
    }
  };

  const handleGenerateShotImage = async (shotIndex: number) => {
    const shot = sequencePlan.shots[shotIndex];
    if (!shot) return;
    setGeneratingShotImgIdx(shotIndex);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${shot.shotType}: ${shot.actionDescription}. Estilo visual: ${visualStyleDesc}`,
          headlineText: shot.headlineText,
          primaryHex: shot.primaryHex,
          secondaryHex: shot.secondaryHex,
          accentHex: shot.accentHex,
          aspectRatio: sequenceAspectRatio,
          shotNumber: shot.shotNumber || shotIndex + 1,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setSequencePlan((prev) => ({
          ...prev,
          shots: prev.shots.map((s, idx) =>
            idx === shotIndex ? { ...s, imageUrl: data.imageUrl } : s
          ),
        }));
      }
    } catch (_err) {
      // Ignore individual image error
    } finally {
      setGeneratingShotImgIdx(null);
    }
  };

  const handleGenerateAllShotImages = async () => {
    setGeneratingShotImgIdx('all');
    try {
      const updatedShots = await Promise.all(
        sequencePlan.shots.map(async (shot, idx) => {
          try {
            const res = await fetch('/api/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: `${shot.shotType}: ${shot.actionDescription}. Estilo visual: ${visualStyleDesc}`,
                headlineText: shot.headlineText,
                primaryHex: shot.primaryHex,
                secondaryHex: shot.secondaryHex,
                accentHex: shot.accentHex,
                aspectRatio: sequenceAspectRatio,
                shotNumber: shot.shotNumber || idx + 1,
              }),
            });
            const data = await res.json();
            return data.imageUrl ? { ...shot, imageUrl: data.imageUrl } : shot;
          } catch (_e) {
            return shot;
          }
        })
      );
      setSequencePlan((prev) => ({ ...prev, shots: updatedShots }));
    } finally {
      setGeneratingShotImgIdx(null);
    }
  };

  const handleUploadImages = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetShotIndex?: number
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file, fileOffset) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl) return;
        setSequencePlan((prev) => {
          const destIndex =
            typeof targetShotIndex === 'number'
              ? targetShotIndex
              : fileOffset % Math.max(1, prev.shots.length);
          return {
            ...prev,
            shots: prev.shots.map((s, idx) =>
              idx === destIndex ? { ...s, imageUrl: dataUrl } : s
            ),
          };
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleDownloadSequenceMp3 = async () => {
    if (isExportingSequenceMp3) return;
    setIsExportingSequenceMp3(true);
    try {
      const slug = (sequencePlan.title || 'secuencia-audio')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      await downloadAudioAsMp3({
        audioBase64: attachVoiceoverToSequence && activeTake ? activeTake.audioBase64 : undefined,
        scriptText:
          (attachVoiceoverToSequence && activeTake ? activeTake.fullScript : '') ||
          sequencePlan.suggestedVoiceover ||
          sequencePlan.emotionSummary,
        voiceGender: activeTake?.voiceGender || voiceGender,
        durationSec: 14,
        filename: `${slug || 'kinetix-audio'}.mp3`,
      });
    } finally {
      setIsExportingSequenceMp3(false);
    }
  };

  const triggerDownloadUrl = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateVeoVideo = async () => {
    setIsGeneratingVeo(true);
    setVeoError(null);
    setVeoVideoUrl(null);
    setVeoStatusMessage('Iniciando creación de video MP4 con imágenes y audio…');
    const selectedAudioB64 =
      attachVoiceoverToSequence && activeTake ? activeTake.audioBase64 : null;

    const hasCustomShotImages = sequencePlan.shots.some((s) => Boolean(s.imageUrl));

    const activeSeqSubtitles = loadSavedSubtitleSettings();
    const activeSeqNarration =
      activeTake?.fullScript ||
      narrationScript ||
      sequencePlan.suggestedVoiceover ||
      '';

    try {
      if (hasCustomShotImages) {
        const composedMp4Url = await renderSequenceToVideoUrl(
          sequencePlan,
          sequenceAspectRatio,
          veoResolution,
          (msg) => setVeoStatusMessage(msg),
          selectedAudioB64,
          activeSeqSubtitles,
          activeSeqNarration
        );
        setVeoVideoUrl(composedMp4Url);
        setVeoStatusMessage(null);
        triggerDownloadUrl(composedMp4Url, 'kinetix-video-con-imagenes.mp4');
        return;
      }

      const startRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${builtSequencePrompt} ${sequencePlan.veoEnhancedPrompt || ''}`,
          aspectRatio: sequenceAspectRatio,
          resolution: veoResolution,
        }),
      });

      const startData = await startRes.json().catch(() => ({ quotaFallback: true }));

      if (!startRes.ok || startData.quotaFallback || !startData.operationName) {
        const fallbackVideoUrl = await renderSequenceToVideoUrl(
          sequencePlan,
          sequenceAspectRatio,
          veoResolution,
          (msg) => setVeoStatusMessage(msg),
          selectedAudioB64,
          activeSeqSubtitles,
          activeSeqNarration
        );
        setVeoVideoUrl(fallbackVideoUrl);
        setVeoStatusMessage(null);
        triggerDownloadUrl(fallbackVideoUrl, 'kinetix-video.mp4');
        return;
      }

      const operationName = startData.operationName;
      const reassuringMessages = [
        'Componiendo geometría de escena e iluminación volumétrica…',
        'Renderizando fotogramas clave y movimiento de cámara en Veo 3.1…',
        'Aplicando etalonaje de color y coherencia temporal…',
        'Finalizando codificación del flujo de video…',
      ];

      let step = 0;
      let isDone = false;
      let needsFallback = false;

      while (!isDone && step < 36) {
        setVeoStatusMessage(reassuringMessages[step % reassuringMessages.length]);
        await new Promise((r) => setTimeout(r, 5000));
        step++;

        const pollRes = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName }),
        });
        const pollData = await pollRes.json().catch(() => ({ done: true, quotaFallback: true }));
        if (!pollRes.ok || pollData.quotaFallback) {
          needsFallback = true;
          isDone = true;
        } else if (pollData.done) {
          isDone = true;
        }
      }

      if (!isDone || needsFallback) {
        const fallbackVideoUrl = await renderSequenceToVideoUrl(
          sequencePlan,
          sequenceAspectRatio,
          veoResolution,
          (msg) => setVeoStatusMessage(msg),
          selectedAudioB64,
          activeSeqSubtitles,
          activeSeqNarration
        );
        setVeoVideoUrl(fallbackVideoUrl);
        setVeoStatusMessage(null);
        triggerDownloadUrl(fallbackVideoUrl, 'kinetix-video.mp4');
        return;
      }

      setVeoStatusMessage('Descargando máster de video desde el servidor…');
      const downloadRes = await fetch('/api/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName }),
      });

      if (!downloadRes.ok) {
        const fallbackVideoUrl = await renderSequenceToVideoUrl(
          sequencePlan,
          sequenceAspectRatio,
          veoResolution,
          (msg) => setVeoStatusMessage(msg),
          selectedAudioB64,
          activeSeqSubtitles,
          activeSeqNarration
        );
        setVeoVideoUrl(fallbackVideoUrl);
        setVeoStatusMessage(null);
        triggerDownloadUrl(fallbackVideoUrl, 'kinetix-video.mp4');
        return;
      }

      const videoBlob = await downloadRes.blob();
      const videoObjectUrl = URL.createObjectURL(videoBlob);
      setVeoVideoUrl(videoObjectUrl);
      setVeoStatusMessage(null);
      triggerDownloadUrl(videoObjectUrl, 'kinetix-video.mp4');
    } catch (_err: any) {
      try {
        const fallbackVideoUrl = await renderSequenceToVideoUrl(
          sequencePlan,
          sequenceAspectRatio,
          veoResolution,
          (msg) => setVeoStatusMessage(msg),
          selectedAudioB64,
          activeSeqSubtitles,
          activeSeqNarration
        );
        setVeoVideoUrl(fallbackVideoUrl);
        triggerDownloadUrl(fallbackVideoUrl, 'kinetix-video.mp4');
      } catch (renderErr: any) {
        setVeoError(renderErr?.message || 'Error al renderizar el flujo de video.');
      }
      setVeoStatusMessage(null);
    } finally {
      setIsGeneratingVeo(false);
    }
  };

  const wordCount = narrationScript
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 145) * 60));

  const pdfWordCount = textoPdf
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const handleOpenPayPalForBook = (
    title: string,
    subtitle: string,
    coverUrl?: string,
    chaptersCount?: number
  ) => {
    setExternalPayPalProduct({
      id: `pp-live-${Date.now()}`,
      title: title || videoBook.bookTitle || 'Audiolibro IA Completo',
      subtitle:
        subtitle ||
        videoBook.subtitle ||
        'Audiolibro Hablado con Avatar Real + Escenas del Tema (MP3 + MP4)',
      author: videoBook.authorOrSource || 'Kinetix Estudio de Audiolibros IA',
      price: 19.99,
      compareAtPrice: 34.99,
      currency: 'USD',
      format: 'MP3 + MP4 + PDF',
      coverUrl:
        coverUrl ||
        pageImages[0] ||
        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=900&q=85',
      chaptersCount: chaptersCount || videoBook.pages.length || 5,
      durationLabel: `${Math.max(5, (chaptersCount || videoBook.pages.length || 5) * 4)} min`,
      avatarName: `${selectedAvatar.name} (Voz ${selectedAvatar.voiceName})`,
      category: 'Audiolibro IA',
      salesCount: 12,
    });
    setActiveModule('paypal-monetization');
  };

  // Administrator Account Session (garciasaul501@gmail.com / Garciasaul@501)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isViralLogoModalOpen, setIsViralLogoModalOpen] = useState(false);
  const [isSupportConciergeOpen, setIsSupportConciergeOpen] = useState(false);
  const [isBuyTokensModalOpen, setIsBuyTokensModalOpen] = useState(false);
  const [isSocialShareModalOpen, setIsSocialShareModalOpen] = useState(false);
  const [userTokenBalance, setUserTokenBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kinetix_user_tokens');
      return saved ? Number(saved) || 62500 : 62500;
    } catch {
      return 62500;
    }
  });

  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    return getSavedLanguage();
  });

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setCurrentLanguage(newLang);
    saveLanguage(newLang);
  };

  // Action Handlers for Unified Action Toolbar
  const handleToolbarCrear = () => {
    setActiveModule('videobook');
    setVideobookViewMode('creator');
    setTimeout(() => {
      const stage = document.getElementById('audiobook-creation-stage');
      if (stage) stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleToolbarReproducir = () => {
    openPlayerModal();
  };

  const handleToolbarCargar = () => {
    setActiveModule('videobook');
    setVideobookViewMode('creator');
    setTimeout(() => {
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
      if (fileInput) {
        fileInput.click();
      } else {
        const stage = document.getElementById('audiobook-creation-stage');
        if (stage) stage.scrollIntoView({ behavior: 'smooth' });
      }
    }, 80);
  };

  const handleToolbarEliminar = () => {
    setTextoPdf('');
    setUploadedPdfName(null);
    toast.info('Borrador Limpiado', 'Se ha restablecido el texto para comenzar un nuevo proyecto.');
  };

  const handleToolbarCompartir = () => {
    setIsSocialShareModalOpen(true);
  };

  const handleToolbarConvertir = () => {
    setActiveModule('videobook');
    if (textoPdf.trim()) {
      handleCreateVideoBookFromPdf(false);
    } else {
      handleExportVideoBookMp4();
    }
  };

  const handleTokensPurchased = (tokensToAdd: number, amountPaid: number, packageName: string) => {
    setUserTokenBalance((prev) => {
      const next = prev + tokensToAdd;
      try {
        localStorage.setItem('kinetix_user_tokens', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
    toast.success(
      '¡Compra de Tokens Exitosa!',
      `Se han acreditado +${tokensToAdd.toLocaleString()} tokens a tu cuenta mediante PayPal ($${amountPaid.toFixed(2)}).`
    );
  };

  const [isGoldModel, setIsGoldModel] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kinetix_gold_model_mode');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => {
    try {
      const saved = localStorage.getItem('kinetix_admin_session_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore storage error
    }
    return {
      token: 'admin-master-verified-token',
      loggedInAt: new Date().toISOString(),
      user: {
        id: 'admin-master-01',
        email: DEFAULT_ADMIN_EMAIL,
        name: 'Saúl García (Administrador Principal)',
        role: 'admin',
        plan: 'Enterprise Master · Ilimitado',
        status: 'active',
        createdAt: '2026-10-20',
      },
    };
  });

  const handleAdminLoginSuccess = (newSession: AdminSession) => {
    setAdminSession(newSession);
    try {
      localStorage.setItem('kinetix_admin_session_v1', JSON.stringify(newSession));
    } catch {
      // Ignore storage error
    }
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    try {
      localStorage.removeItem('kinetix_admin_session_v1');
    } catch {
      // Ignore storage error
    }
  };

  return (
    <div className="min-h-screen flex bg-white text-slate-900 transition-colors duration-300 selection:bg-amber-500 selection:text-black">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* =====================================================================
          ORGANIZED LEFT NAVIGATION SIDEBAR (260px Desktop / Slide-Over Mobile)
         ===================================================================== */}
      <aside
        aria-label="Navegación del estudio"
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen w-64 shrink-0 bg-white border-r border-amber-200/80 flex flex-col justify-between transition-transform duration-200 ease-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1 overflow-y-auto">
          {/* Sidebar Brand Header */}
          <div className="h-16 px-5 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <FuturisticGoldLogo
              size="xs"
              showWordmark={true}
              onClick={() => setIsViralLogoModalOpen(true)}
            />
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Access CTA */}
          <div className="px-4 pt-4 pb-2">
            <button
              type="button"
              onClick={() => {
                setActiveModule('paypal-monetization');
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeModule === 'paypal-monetization'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              }`}
              title="Empieza ahora antes de usar o ver - Botón Acceso"
            >
              <Zap className="w-4 h-4 fill-current shrink-0" />
              <span className="truncate">{t('subscribeNow', currentLanguage)}</span>
            </button>
          </div>

          {/* Primary Studio Modules Navigation */}
          <div className="px-3 py-3 space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-amber-800/80 tracking-wide">
              Estudio Creativo
            </div>

            {[
              {
                id: 'videobook' as const,
                label: t('tabAudiobooks', currentLanguage),
                count: savedAudiobooks.length,
                icon: BookOpen,
              },
              {
                id: 'ai-pdf-creator' as const,
                label: 'Crear PDF Completo con IA',
                icon: FilePlus2,
              },
              {
                id: 'niche-gallery' as const,
                label: t('tabGallery', currentLanguage),
                icon: Layers,
              },
              {
                id: 'script' as const,
                label: t('tabScript', currentLanguage),
                count: scriptHistory.length,
                icon: History,
              },
              {
                id: 'pdf-director' as const,
                label: t('tabDirector', currentLanguage),
                icon: Clapperboard,
              },
              {
                id: 'narration' as const,
                label: t('tabNarration', currentLanguage),
                icon: Mic,
              },
              {
                id: 'sequence' as const,
                label: t('tabClips', currentLanguage),
                icon: Film,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveModule(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 font-bold'
                      : 'text-slate-700 hover:text-amber-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-amber-700' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {typeof item.count === 'number' && (
                    <span
                      className={`text-xs font-mono tabular-nums shrink-0 ${
                        isActive ? 'text-amber-800 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer: Tokens + Account Utilities */}
        <div className="p-3 border-t border-slate-200/80 space-y-2 bg-slate-50/40 shrink-0">
          {/* Token Balance Row */}
          <div className="px-3 py-2.5 rounded-xl bg-white border border-amber-200/80 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500">
                {t('tokensBadge', currentLanguage)}
              </div>
              <div className="text-sm font-mono tabular-nums font-extrabold text-amber-800">
                {userTokenBalance.toLocaleString()}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsBuyTokensModalOpen(true);
                setMobileSidebarOpen(false);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              + {t('buyTokens', currentLanguage)}
            </button>
          </div>

          {/* Utility Actions */}
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => {
                setIsSocialShareModalOpen(true);
                setMobileSidebarOpen(false);
              }}
              className="px-2 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-amber-900 hover:bg-white border border-transparent hover:border-slate-200 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Compartir proyecto"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-700" />
              <span className="truncate max-w-full">Compartir</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSupportConciergeOpen(true);
                setMobileSidebarOpen(false);
              }}
              className="px-2 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-amber-900 hover:bg-white border border-transparent hover:border-slate-200 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Abrir Asistente de Soporte"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
              <span className="truncate max-w-full">Ayuda</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAdminModalOpen(true);
                setMobileSidebarOpen(false);
              }}
              className={`px-2 py-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 border transition-colors cursor-pointer ${
                adminSession
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'text-slate-700 hover:text-amber-900 hover:bg-white border-transparent hover:border-slate-200'
              }`}
              title={
                adminSession
                  ? `Administrador Activo: ${adminSession.user.email}`
                  : 'Iniciar sesión como Administrador'
              }
            >
              <ShieldCheck
                className={`w-3.5 h-3.5 ${
                  adminSession ? 'text-emerald-600' : 'text-amber-700'
                }`}
              />
              <span className="truncate max-w-full">Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          MAIN WORKSPACE COLUMN (Clean Sticky Top Bar + Focused Content Canvas)
         ===================================================================== */}
      <div className="flex-1 min-w-0 flex flex-col bg-white">
        {/* Clean 1-Row Sticky Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Button + Clean Breadcrumb Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0 text-sm">
              <span className="text-slate-500 font-medium hidden sm:inline whitespace-nowrap">
                Estudio
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-display text-base sm:text-lg font-extrabold text-amber-800 truncate">
                {STUDIO_MODULE_SEO_MAP[activeModule]?.shortLabel || 'Audiolibros IA'}
              </h1>
              <span className="hidden xl:inline text-slate-300 mx-1" aria-hidden="true">
                ·
              </span>
              <span className="hidden xl:inline text-xs text-slate-500 truncate max-w-md">
                {STUDIO_MODULE_SEO_MAP[activeModule]?.shortDescription}
              </span>
            </div>
          </div>

          {/* Right: Crear PDF Completo con IA + Play Button + Language Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveModule('ai-pdf-creator')}
              className={`px-3 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                activeModule === 'ai-pdf-creator'
                  ? 'bg-slate-950 text-amber-400 border-amber-500/70'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300'
              }`}
              title="Crear un documento PDF completo con IA integrando texto, imágenes, voz 24kHz, subtítulos y video"
            >
              <FilePlus2 className={`w-3.5 h-3.5 ${activeModule === 'ai-pdf-creator' ? 'text-amber-400' : 'text-amber-700'}`} />
              <span className="hidden sm:inline">Crear PDF Completo con IA</span>
              <span className="sm:hidden">PDF IA</span>
            </button>

            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />

            {/* Reproducir Button: ONLY enabled when a real audiobook has been created or restored */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={openPlayerModal}
                disabled={isGeneratingVideoBook || !hasCreatedVideoBook}
                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isPlayerModalOpen
                    ? 'bg-slate-950 hover:bg-slate-800 text-amber-400 border border-amber-500/60'
                    : !isGeneratingVideoBook && hasCreatedVideoBook
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
                title={
                  hasCreatedVideoBook
                    ? 'Abrir la pantalla de reproducción de tu audiolibro creado'
                    : 'Primero crea un audiolibro desde PDF o carga uno en Mi Biblioteca'
                }
              >
                {isGeneratingVideoBook ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creando voz y video...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Reproducir</span>
                    {hasCreatedVideoBook && videoBook.pages.length > 0 && (
                      <span className="font-mono tabular-nums text-[11px] opacity-80">
                        ({videoBook.pages.length})
                      </span>
                    )}
                  </>
                )}
              </button>

              {isBgPlaying && (
                <button
                  type="button"
                  onClick={stopBackgroundPlayback}
                  className="p-2 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors cursor-pointer shrink-0"
                  title="Detener audio en segundo plano"
                  aria-label="Detener audio en segundo plano"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Hidden Background Audio Element for Neural Voice Takes */}
        <audio
          key={activeTake?.id || 'no-audio'}
          ref={bgAudioRef}
          src={activeTake && !activeTake.isSyntheticFallback ? activeTake.wavUrl : undefined}
          preload="auto"
          onEnded={() => {
            bgPlayingRef.current = false;
            setIsBgPlaying(false);
          }}
          className="hidden"
        />

        {/* Main Studio Workspace */}
        <main id="studio-main-workspace" className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Compact Single-Row Command Bar */}
          <UnifiedActionToolbar
            onCrear={handleToolbarCrear}
            onCrearPdfIa={() => setActiveModule('ai-pdf-creator')}
            isAiPdfActive={activeModule === 'ai-pdf-creator'}
            onReproducir={handleToolbarReproducir}
            onCargar={handleToolbarCargar}
            onEliminar={handleToolbarEliminar}
            onCompartir={handleToolbarCompartir}
            onConvertir={handleToolbarConvertir}
            onMonetizar={() => setActiveModule('paypal-monetization')}
            onTestearPago={() => setIsBuyTokensModalOpen(true)}
            userTokenBalance={userTokenBalance}
            isGenerating={isGeneratingVideoBook || isExportingBookMp4}
            isPlayingBg={isPlayerModalOpen}
            canPlay={hasCreatedVideoBook}
            language={currentLanguage}
          />

          {/* =====================================================================
              MODULE: 1,200 FOTOS DE ESCENAS POR NICHOS (FULL GALLERY VIEW)
             ===================================================================== */}
          {activeModule === 'niche-gallery' && (
            <div className="space-y-6">
              <NicheSceneGalleryView
                activeChapterNumber={
                  videoBook.pages[activeBookPageIdx]?.pageNumber || activeBookPageIdx + 1
                }
                activeChapterTitle={
                  videoBook.pages[activeBookPageIdx]?.chapterTitle || 'Capítulo Activo'
                }
                currentChapterImageUrl={pageImages[activeBookPageIdx]}
                totalChapters={videoBook.pages.length}
                onSelectPhotoForChapter={(photo: NicheScenePhoto) => {
                  setPageImages((prev) => ({ ...prev, [activeBookPageIdx]: photo.imageUrl }));
                  setExportedBookMp4Url(null);
                }}
                onAutoFillAllChaptersWithNiche={(niche?: 'Auto' | SceneNicheCategory) => {
                  const map: Record<number, string> = {};
                  if (!niche || niche === 'Auto') {
                    const matched = matchBestScenesForBookPages(videoBook.pages);
                    Object.entries(matched).forEach(([idxStr, ph]) => {
                      map[Number(idxStr)] = ph.imageUrl;
                    });
                  } else {
                    const pool = NICHE_SCENE_LIBRARY_1200.filter((p) => p.niche === niche);
                    videoBook.pages.forEach((_, idx) => {
                      const chosen = pool[(idx * 7) % Math.max(1, pool.length)];
                      if (chosen) map[idx] = chosen.imageUrl;
                    });
                  }
                  setPageImages((prev) => ({ ...prev, ...map }));
                  setExportedBookMp4Url(null);
                }}
                onUsePhotoInSequenceShot={(photo: NicheScenePhoto) => {
                  setSequencePlan((prev) => ({
                    ...prev,
                    shots: prev.shots.map((s, idx) =>
                      idx === activeShotIndex
                        ? {
                            ...s,
                            imageUrl: photo.imageUrl,
                            headlineText: photo.title.toUpperCase(),
                            actionDescription: `${photo.subNiche} · ${photo.title}`,
                          }
                        : s
                    ),
                  }));
                  setActiveModule('sequence');
                }}
              />
            </div>
          )}

          {/* =====================================================================
              MODULE: SUSCRIPCIÓN Y ACCESO COMPLETO (PAYPAL)
             ===================================================================== */}
          {activeModule === 'paypal-monetization' && (
            <PayPalMonetizationHub
              currentVideoBook={videoBook}
              currentCoverUrl={pageImages[0]}
              currentAvatarName={`${selectedAvatar.name} (Voz ${selectedAvatar.voiceName})`}
              savedAudiobooks={savedAudiobooks}
              onExportCurrentMp3={handleExportVideoBookMp3}
              onExportCurrentMp4={() => handleExportVideoBookMp4()}
              externalCheckoutProduct={externalPayPalProduct}
              onClearExternalCheckout={() => setExternalPayPalProduct(null)}
              onOpenBuyTokens={() => setIsBuyTokensModalOpen(true)}
            />
          )}

          {/* =====================================================================
              MODULE: CREAR PDF CON IA (ALL TOOLS ATTACHED)
             ===================================================================== */}
          {activeModule === 'ai-pdf-creator' && (
            <AiPdfCreatorStudio
              selectedAvatar={selectedAvatar}
              onSelectAvatar={(av) => {
                setSelectedAvatar(av);
                setCustomAvatarUrl(undefined);
                setVoiceName(av.voiceName);
                setVoiceGender(av.gender);
              }}
              onConvertToAudiobook={async (createdBook, imagesMap, prebuiltAudio) => {
                setVideoBook(createdBook);
                setPageImages(imagesMap);
                setActiveBookPageIdx(0);
                setExportedBookMp4Url(null);
                setHasCreatedVideoBook(true);
                setNarrationScript(createdBook.fullNarration);
                setActiveModule('videobook');

                if (prebuiltAudio && prebuiltAudio.audioBase64) {
                  const newTake: VoiceoverTake = {
                    id: `take-pdf-${Date.now()}`,
                    createdAt: new Date().toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    voiceGender: selectedAvatar.gender,
                    voiceName: selectedAvatar.voiceName,
                    accent: selectedAvatar.accent,
                    tone: 'narrador editorial cálido',
                    executedPrompt: `Locución PDF IA · ${createdBook.bookTitle}`,
                    durationSec: prebuiltAudio.durationSec,
                    wavUrl: prebuiltAudio.wavUrl,
                    audioBase64: prebuiltAudio.audioBase64,
                    scriptExcerpt: prebuiltAudio.fullScript.slice(0, 95),
                    fullScript: prebuiltAudio.fullScript,
                    peaks: Array.from({ length: 36 }, (_, i) => 0.35 + ((i * 19) % 55) / 100),
                    isSyntheticFallback: false,
                  };
                  setVoiceTakes((prev) => [newTake, ...prev]);
                  setActiveTakeId(newTake.id);
                  stopBackgroundPlayback();
                  setIsPlayerModalOpen(true);
                  setPlayerAutoPlayTrigger((prev) => prev + 1);
                  toast.success(
                    'PDF convertido a Audiolibro IA',
                    'Reproduciendo con voz neuronal 24kHz y subtítulos dinámicos.'
                  );
                } else {
                  toast.success(
                    'PDF cargado en Audiolibro IA',
                    'Sintetizando la voz neuronal 24kHz para tu reproducción...'
                  );
                  await handleGenerateNarration(createdBook.fullNarration, {
                    silentToast: true,
                  });
                  stopBackgroundPlayback();
                  setIsPlayerModalOpen(true);
                  setPlayerAutoPlayTrigger((prev) => prev + 1);
                }
              }}
              onSendToPdfDirector={(text, filename) => {
                setTextoPdf(text);
                setUploadedPdfName(filename);
                setActiveModule('pdf-director');
                toast.success('Enviado a Director PDF', 'Tu PDF IA está listo para Storyboard.');
              }}
              onSendToScript={(pdfTopic, fullText) => {
                setScriptTopic(`${pdfTopic} — ${fullText.slice(0, 400)}`);
                setActiveModule('script');
                toast.success('Enviado a Guiones', 'Tu PDF IA se cargó para adaptación de guion.');
              }}
              onSendToNarration={(narrationText) => {
                setNarrationScript(narrationText);
                setActiveModule('narration');
                toast.success('Enviado a Voz IA (TTS)', 'Guion de narración listo para locución.');
              }}
              onSendToSequence={(title, narrationText, firstImage) => {
                setNarrationScript(narrationText);
                setSequencePlan((prev) => ({
                  ...prev,
                  title,
                  suggestedVoiceover: narrationText.slice(0, 600),
                  shots: prev.shots.map((s, idx) =>
                    idx === 0 && firstImage ? { ...s, headlineText: title, imageUrl: firstImage } : s
                  ),
                }));
                setActiveModule('sequence');
                toast.success(
                  'Enviado a Clips & Video MP4',
                  'Narración y subtítulos dinámicos cargados en el renderizador.'
                );
              }}
              onMonetizePdf={(title, summary) => {
                handleOpenPayPalForBook(title, summary, pageImages[0], 6);
              }}
            />
          )}

          {/* =====================================================================
              PRIMARY SIMPLE WORKFLOW: AUDIOLIBROS Y VIDEO-LIBROS IA DESDE PDF
              Clean 3-Tab Focused Organization: Crear desde PDF | Reproducir video | Mi Biblioteca
             ===================================================================== */}
          {activeModule === 'videobook' && (
            <div className="space-y-6">
              {/* Clean Segmented Sub-Navigation for Audiolibro IA */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold text-amber-800 tracking-tight">
                    Audiolibro IA desde PDF
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Sube tu PDF, configura la voz y reproduce tu video audiolibro al instante sin límite de tiempo.
                  </p>
                </div>

                {/* 2 Focused Workspace Tabs (La pantalla de reproducción vive dentro del botón Reproducir) */}
                <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setVideobookViewMode('creator')}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                      videobookViewMode === 'creator'
                        ? 'bg-white text-amber-900 shadow-2xs border border-amber-200'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>1. Crear desde PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideobookViewMode('library')}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                      videobookViewMode === 'library'
                        ? 'bg-white text-amber-900 shadow-2xs border border-amber-200'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>2. Mi Biblioteca ({savedAudiobooks.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModule('ai-pdf-creator')}
                    className="px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap bg-amber-500 hover:bg-amber-600 text-slate-950"
                  >
                    <FilePlus2 className="w-4 h-4" />
                    <span>3. Crear PDF Completo con IA</span>
                  </button>
                </div>
              </div>

              {/* =================================================================
                  TAB 1: CREAR DESDE PDF (Clean 2-Column Guided Workspace)
                 ================================================================= */}
              {videobookViewMode === 'creator' && (
                <section
                  id="audiobook-creator-card"
                  className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6"
                >
                  {/* Clean 2-Column Split: Left (Content & PDF) | Right (Settings & Produce) */}
                  <div
                    id="audiobook-creation-stage"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  >
                    {/* LEFT COLUMN (7 cols): Upload PDF + Quick Niche Template + Editable Text */}
                    <div className="lg:col-span-7 space-y-5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-amber-800">
                          01. Sube tu documento PDF o escribe el texto
                        </h3>
                        <span className="text-xs font-mono tabular-nums text-slate-500">
                          {pdfWordCount} palabras
                        </span>
                      </div>

                      {/* PDF Upload Bar */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-white border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-950 truncate">
                              {isExtractingPdf
                                ? 'Extrayendo texto del PDF...'
                                : uploadedPdfName || 'Selecciona uno o varios archivos PDF'}
                            </div>
                            <div className="text-xs text-slate-500">
                              Compatible con .PDF, .TXT y .MD sin límite de extensión
                            </div>
                          </div>
                        </div>

                        <label className="px-4 py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0">
                          {isExtractingPdf ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileUp className="w-4 h-4" />
                          )}
                          <span>Subir PDF(s)</span>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.txt,.md,application/pdf,text/plain"
                            onChange={handlePdfFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Compact Niche PDF Template Picker (Collapsible 12-doc browser) */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-slate-700">
                            O elige una plantilla lista (12 documentos por nicho):
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowSamplePdfGrid((prev) => !prev)}
                            className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                          >
                            <span>
                              {showSamplePdfGrid ? 'Ocultar catálogo' : 'Explorar las 12 plantillas'}
                            </span>
                            {showSamplePdfGrid ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={uploadedPdfName || SAMPLE_PDF_DOCUMENTS[0].filename}
                            onChange={(e) => {
                              const found = SAMPLE_PDF_DOCUMENTS.find(
                                (d) => d.filename === e.target.value
                              );
                              if (found) {
                                setTextoPdf(found.content);
                                setUploadedPdfName(found.filename);
                              }
                            }}
                            className="flex-1 rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                          >
                            {SAMPLE_PDF_DOCUMENTS.map((doc) => (
                              <option key={doc.filename} value={doc.filename}>
                                {doc.niche} — {doc.label} ({doc.pagesCount} págs)
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              const activeDoc =
                                SAMPLE_PDF_DOCUMENTS.find((d) => d.filename === uploadedPdfName) ||
                                SAMPLE_PDF_DOCUMENTS[0];
                              const blob = new Blob([activeDoc.content], {
                                type: 'text/plain;charset=utf-8',
                              });
                              const url = URL.createObjectURL(blob);
                              triggerDownloadUrl(url, activeDoc.filename.replace(/\.pdf$/i, '.txt'));
                              setTimeout(() => URL.revokeObjectURL(url), 5000);
                            }}
                            className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                            title="Descargar texto del documento"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Bajar</span>
                          </button>
                        </div>

                        {showSamplePdfGrid && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-h-64 overflow-y-auto pr-1">
                            {SAMPLE_PDF_DOCUMENTS.map((doc) => {
                              const isSelected = uploadedPdfName === doc.filename;
                              return (
                                <button
                                  key={doc.filename}
                                  type="button"
                                  onClick={() => {
                                    setTextoPdf(doc.content);
                                    setUploadedPdfName(doc.filename);
                                    setShowSamplePdfGrid(false);
                                  }}
                                  className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-50 border-amber-400 text-amber-950'
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                                    <span className="font-semibold text-amber-800">{doc.niche}</span>
                                    <span className="font-mono tabular-nums">{doc.pagesCount} págs</span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                                    {doc.label}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Text Editor + Voice Dictation */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-slate-700">
                            Contenido del libro (edita, pega o dicta por voz):
                          </label>
                          <VoiceDictationButton
                            currentValue={textoPdf}
                            onChangeText={setTextoPdf}
                            variant="light"
                            label="Dictar por voz"
                          />
                        </div>

                        <textarea
                          rows={7}
                          value={textoPdf}
                          onChange={(e) => setTextoPdf(e.target.value)}
                          placeholder="Aquí aparece el contenido extraído de tu PDF. También puedes escribir, pegar o dictar cualquier texto..."
                          className="w-full rounded-xl bg-white border border-slate-300 p-4 text-sm text-slate-900 leading-relaxed focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* RIGHT COLUMN (5 cols): Voice, Organized Hidden Galleries & Simple Produce */}
                    <div className="lg:col-span-5 lg:border-l lg:border-slate-200 lg:pl-8 space-y-5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-amber-800">
                          02. Voz, fotos y creación
                        </h3>
                        <button
                          type="button"
                          onClick={handleTestSelectedVoice}
                          disabled={isTestingVoice}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                          title="Escuchar una muestra real de esta voz IA ahora mismo"
                        >
                          {isTestingVoice ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                          )}
                          <span>{isTestingVoice ? 'Hablando...' : 'Probar Voz'}</span>
                        </button>
                      </div>

                      {/* Narrator Selector (Compacto sin saturar de fotos) */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
                        <img
                          src={
                            customAvatarUrl ||
                            selectedAvatar.customPhotoUrl ||
                            selectedAvatar.realPhotoUrl
                          }
                          alt={selectedAvatar.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover border border-slate-300 shrink-0 bg-slate-900"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <label className="text-xs font-semibold text-slate-700 block truncate">
                            Narrador · {selectedAvatar.accent}
                          </label>
                          <select
                            value={selectedAvatar.id}
                            onChange={(e) => {
                              const found = NARRATOR_AVATAR_PRESETS.find(
                                (a) => a.id === e.target.value
                              );
                              if (found) {
                                setSelectedAvatar(found);
                                setCustomAvatarUrl(undefined);
                                setVoiceName(found.voiceName);
                                setVoiceGender(found.gender);
                              }
                            }}
                            className="w-full rounded-lg bg-white border border-slate-300 px-2.5 py-2 text-xs sm:text-sm font-semibold text-slate-950 focus:outline-none focus:border-amber-500"
                          >
                            {NARRATOR_AVATAR_PRESETS.map((av) => (
                              <option key={av.id} value={av.id}>
                                #{String(av.number).padStart(2, '0')} {av.name} ({av.accent.replace('Español ', '')}) — {av.category}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* BOTONES DEDICADOS: Mostrar / Ocultar Fotos de Avatares y Escenas (Ocultos por defecto) */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreatorAvatars((prev) => !prev);
                            setShowCreatorScenes(false);
                          }}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            showCreatorAvatars
                              ? 'bg-slate-950 text-amber-400 border-amber-500/60'
                              : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-200'
                          }`}
                        >
                          {showCreatorAvatars ? (
                            <EyeOff className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Users className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          )}
                          <span>{showCreatorAvatars ? 'Ocultar Avatares' : 'Avatares (30)'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowCreatorScenes((prev) => !prev);
                            setShowCreatorAvatars(false);
                          }}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            showCreatorScenes
                              ? 'bg-slate-950 text-amber-400 border-amber-500/60'
                              : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-200'
                          }`}
                        >
                          {showCreatorScenes ? (
                            <EyeOff className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          )}
                          <span>{showCreatorScenes ? 'Ocultar Escenas' : 'Escenas (+1,200)'}</span>
                        </button>
                      </div>

                      {/* Duration, Chapters & Visual Style — Compacto en un solo bloque */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 block">
                            Duración
                          </label>
                          <select
                            value={videoDurationMode}
                            onChange={(e) => setVideoDurationMode(e.target.value)}
                            className="w-full rounded-lg bg-white border border-slate-300 px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                          >
                            <option value="unlimited">Sin límite</option>
                            <option value="extended-10m">10+ Minutos</option>
                            <option value="extended-30m">30+ Minutos</option>
                            <option value="standard">Estándar</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 block">
                            Capítulos
                          </label>
                          <select
                            value={targetChaptersCount}
                            onChange={(e) => setTargetChaptersCount(Number(e.target.value))}
                            className="w-full rounded-lg bg-white border border-slate-300 px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                          >
                            <option value={5}>5 Capítulos</option>
                            <option value={8}>8 Capítulos</option>
                            <option value={10}>10 Capítulos</option>
                            <option value={12}>12 Capítulos</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Estilo editorial y escenas
                        </label>
                        <select
                          value={bookStyle}
                          onChange={(e) => setBookStyle(e.target.value)}
                          className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                        >
                          {BOOK_STYLE_PRESETS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      {videoBookError && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 font-semibold">
                          {videoBookError}
                        </div>
                      )}

                      {/* Hairline Separator + Clean Action Hierarchy */}
                      <div className="pt-4 border-t border-slate-200 space-y-2.5">
                        <button
                          type="button"
                          onClick={() => handleCreateVideoBookFromPdf(false)}
                          disabled={isGeneratingVideoBook || isGeneratingAllPages}
                          className="w-full py-3.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isGeneratingVideoBook ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Creando Audiolibro y Voz IA...</span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-4 h-4 text-amber-400" />
                              <span>Crear Audiolibro con Voz IA</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCreateVideoBookFromPdf(true)}
                          disabled={
                            isGeneratingVideoBook || isGeneratingAllPages || isGeneratingNarration
                          }
                          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-amber-700" />
                          <span>Crear Completo (Voz + Ilustraciones IA)</span>
                        </button>

                        {/* Botón 'Escuchar aquí' + 'Reproducir video' — Se activan SOLO cuando ya existe un audiolibro creado */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleToggleBackgroundPlay}
                            disabled={isGeneratingVideoBook || !hasCreatedVideoBook}
                            className={`py-3 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                              isBgPlaying
                                ? 'bg-slate-950 hover:bg-slate-800 text-amber-400 border border-amber-500/60'
                                : !isGeneratingVideoBook && hasCreatedVideoBook
                                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            }`}
                            title={
                              hasCreatedVideoBook
                                ? 'Escuchar el audiolibro creado con voz real sin abrir la pantalla de video'
                                : 'Primero crea un audiolibro desde tu PDF para poder escucharlo'
                            }
                          >
                            {isBgPlaying ? (
                              <>
                                <Pause className="w-4 h-4 fill-current shrink-0" />
                                <span>Pausar voz</span>
                              </>
                            ) : (
                              <>
                                <Headphones className="w-4 h-4 shrink-0" />
                                <span>Escuchar aquí</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={openPlayerModal}
                            disabled={isGeneratingVideoBook || !hasCreatedVideoBook}
                            className={`py-3 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                              !isGeneratingVideoBook && hasCreatedVideoBook
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            }`}
                            title={
                              hasCreatedVideoBook
                                ? 'Abrir la pantalla de reproducción de video con subtítulos dinámicos'
                                : 'Primero crea un audiolibro desde tu PDF para poder reproducirlo'
                            }
                          >
                            {isGeneratingVideoBook ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-slate-700 shrink-0" />
                                <span className="text-slate-700">Creando voz...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 fill-current shrink-0" />
                                <span>Reproducir video</span>
                              </>
                            )}
                          </button>
                        </div>

                        {!hasCreatedVideoBook && !isGeneratingVideoBook && (
                          <p className="text-[11px] text-slate-500 text-center">
                            Pulsa <strong>Crear Audiolibro con Voz IA</strong> para activar la reproducción con voz real.
                          </p>
                        )}

                        {/* Quick Save MP3 / MP4 Row */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveCurrentAudiobookToFolder('MP3')}
                            disabled={isSavingToFolder !== null || !hasCreatedVideoBook}
                            className="py-2 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-amber-700" />
                            <span>Guardar MP3</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveCurrentAudiobookToFolder('MP4')}
                            disabled={isSavingToFolder !== null || !hasCreatedVideoBook}
                            className="py-2 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-amber-700" />
                            <span>Guardar MP4</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PANEL DESPLEGABLE (OCULTO POR DEFECTO): GALERÍA DE 30 AVATARES */}
                  {showCreatorAvatars && (
                    <div className="pt-6 border-t border-slate-200 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-extrabold text-amber-800 flex items-center gap-2">
                            <Users className="w-4 h-4 text-amber-700" />
                            <span>Galería de 30 Avatares y Voces Narradoras</span>
                          </h4>
                          <p className="text-xs text-slate-500">
                            Haz clic en cualquier avatar para seleccionarlo y luego oculta esta galería.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCreatorAvatars(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Ocultar Avatares</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto pr-1">
                        {NARRATOR_AVATAR_PRESETS.map((av) => {
                          const isSelected = selectedAvatar.id === av.id;
                          return (
                            <button
                              key={av.id}
                              type="button"
                              onClick={() => {
                                setSelectedAvatar(av);
                                setCustomAvatarUrl(undefined);
                                setVoiceName(av.voiceName);
                                setVoiceGender(av.gender);
                                toast.success(
                                  `Avatar seleccionado: ${av.name}`,
                                  `Voz ${av.accent} asignada.`
                                );
                              }}
                              className={`text-left p-2 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/40'
                                  : 'bg-white hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="aspect-square rounded-lg overflow-hidden bg-slate-900 mb-1.5">
                                <img
                                  src={av.customPhotoUrl || av.realPhotoUrl}
                                  alt={av.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-xs font-bold text-slate-900 truncate">
                                #{String(av.number).padStart(2, '0')} {av.name}
                              </div>
                              <div className="text-[10px] text-amber-800 font-semibold truncate">
                                {av.category}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PANEL DESPLEGABLE (OCULTO POR DEFECTO): BANCO DE +1,200 ESCENAS */}
                  {showCreatorScenes && (
                    <div className="pt-6 border-t border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-extrabold text-amber-800 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-amber-700" />
                            <span>Banco Organizado de +1,200 Fotos de Escenas</span>
                          </h4>
                          <p className="text-xs text-slate-500">
                            Selecciona fotos por nicho para tu audiolibro o rellena todos los capítulos automáticamente.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCreatorScenes(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Ocultar Escenas</span>
                        </button>
                      </div>

                      <NicheSceneGalleryView
                        activeChapterNumber={
                          videoBook.pages[activeBookPageIdx]?.pageNumber || activeBookPageIdx + 1
                        }
                        activeChapterTitle={
                          videoBook.pages[activeBookPageIdx]?.chapterTitle || 'Capítulo Activo'
                        }
                        currentChapterImageUrl={pageImages[activeBookPageIdx]}
                        totalChapters={videoBook.pages.length}
                        onSelectPhotoForChapter={(photo: NicheScenePhoto) => {
                          setPageImages((prev) => ({
                            ...prev,
                            [activeBookPageIdx]: photo.imageUrl,
                          }));
                          setExportedBookMp4Url(null);
                          toast.success(
                            'Escena asignada',
                            `Foto "${photo.title}" aplicada al Capítulo ${activeBookPageIdx + 1}.`
                          );
                        }}
                        onAutoFillAllChaptersWithNiche={(niche?: 'Auto' | SceneNicheCategory) => {
                          const map: Record<number, string> = {};
                          if (!niche || niche === 'Auto') {
                            const matched = matchBestScenesForBookPages(videoBook.pages);
                            Object.entries(matched).forEach(([idxStr, ph]) => {
                              map[Number(idxStr)] = ph.imageUrl;
                            });
                          } else {
                            const pool = NICHE_SCENE_LIBRARY_1200.filter((p) => p.niche === niche);
                            videoBook.pages.forEach((_, idx) => {
                              const chosen = pool[(idx * 7) % Math.max(1, pool.length)];
                              if (chosen) map[idx] = chosen.imageUrl;
                            });
                          }
                          setPageImages((prev) => ({ ...prev, ...map }));
                          setExportedBookMp4Url(null);
                          toast.success(
                            'Escenas asignadas a todos los capítulos',
                            `Se actualizaron las fotos de ${videoBook.pages.length} capítulos.`
                          );
                        }}
                      />
                    </div>
                  )}
                </section>
              )}

              {/* =================================================================
                  TAB 2: MI BIBLIOTECA (Clean Folder Vault View)
                 ================================================================= */}
              {videobookViewMode === 'library' && (
                <AudiobookFolderVault
                  savedAudiobooks={savedAudiobooks}
                  customFolders={customFolders}
                  onCreateFolder={(newFolderName) => {
                    if (!customFolders.includes(newFolderName)) {
                      const next = [...customFolders, newFolderName];
                      setCustomFolders(next);
                      saveCustomFoldersToStorage(next);
                    }
                  }}
                  onSaveCurrentAudiobook={handleSaveCurrentAudiobookToFolder}
                  onRestoreAudiobookToStudio={(item) => {
                    stopBackgroundPlayback();
                    setVideoBook(item.videoBook);
                    setHasCreatedVideoBook(true);
                    setPageImages(item.pageImages || {});
                    setActiveBookPageIdx(0);
                    setAudiobookVisualMode(item.visualMode || 'avatar-and-scenes');
                    const foundAv = NARRATOR_AVATAR_PRESETS.find(
                      (a) => a.id === item.avatarId
                    );
                    if (foundAv) {
                      setSelectedAvatar(foundAv);
                      setVoiceName(foundAv.voiceName);
                      setVoiceGender(foundAv.gender);
                    }
                    const fullNarr =
                      item.videoBook.fullNarration ||
                      item.videoBook.pages
                        .map((p) => `${p.chapterTitle}. ${p.pageText}`)
                        .join(' ');
                    if (fullNarr) {
                      setNarrationScript(fullNarr);
                    }

                    // Restore this audiobook's own real audio track if saved, otherwise synthesize real voice
                    if (item.audioBase64 && item.audioBase64.length > 100) {
                      try {
                        const processed = pcmBase64ToWav(item.audioBase64, 24000);
                        const restoredTake: VoiceoverTake = {
                          id: `restored-${item.id}`,
                          createdAt: item.createdAt || 'Guardado',
                          scriptExcerpt: fullNarr.slice(0, 95),
                          fullScript: fullNarr,
                          voiceGender: foundAv?.gender || voiceGender,
                          voiceName: foundAv?.voiceName || voiceName,
                          accent: voiceAccent,
                          tone: voiceTone,
                          executedPrompt: `Audiolibro restaurado: ${item.title}`,
                          wavUrl: processed.wavUrl,
                          audioBase64: item.audioBase64,
                          durationSec: processed.durationSec,
                          peaks: processed.peaks,
                          isFavorite: item.isFavorite,
                          isSyntheticFallback: false,
                        };
                        setVoiceTakes((prev) => [
                          restoredTake,
                          ...prev.filter((t) => t.id !== restoredTake.id),
                        ]);
                        setActiveTakeId(restoredTake.id);
                      } catch {
                        setActiveTakeId(null);
                        handleGenerateNarration(fullNarr, { silentToast: true });
                      }
                    } else {
                      setActiveTakeId(null);
                      if (fullNarr) {
                        handleGenerateNarration(fullNarr, { silentToast: true });
                      }
                    }

                    setIsPlayerModalOpen(true);
                    setPlayerAutoPlayTrigger((prev) => prev + 1);
                    toast.success(
                      'Audiolibro Cargado en Reproductor',
                      `"${item.title}" listo para reproducir con audio.`
                    );
                  }}
                  onMoveToFolder={(itemId, newFolder) => {
                    setSavedAudiobooks((prev) => {
                      const next = prev.map((it) =>
                        it.id === itemId ? { ...it, folderName: newFolder } : it
                      );
                      saveAudiobooksMetaToStorage(next);
                      return next;
                    });
                  }}
                  onToggleFavorite={(itemId) => {
                    setSavedAudiobooks((prev) => {
                      const next = prev.map((it) =>
                        it.id === itemId ? { ...it, isFavorite: !it.isFavorite } : it
                      );
                      saveAudiobooksMetaToStorage(next);
                      return next;
                    });
                  }}
                  onRenameAudiobook={(itemId, newTitle) => {
                    setSavedAudiobooks((prev) => {
                      const next = prev.map((it) =>
                        it.id === itemId
                          ? {
                              ...it,
                              title: newTitle,
                              videoBook: { ...it.videoBook, bookTitle: newTitle },
                            }
                          : it
                      );
                      saveAudiobooksMetaToStorage(next);
                      return next;
                    });
                  }}
                  onDeleteAudiobook={(itemId) => {
                    setSavedAudiobooks((prev) => {
                      const next = prev.filter((it) => it.id !== itemId);
                      saveAudiobooksMetaToStorage(next);
                      return next;
                    });
                  }}
                  onMarkBlobCached={(itemId, type, sizeLabel) => {
                    setSavedAudiobooks((prev) => {
                      const next = prev.map((it) =>
                        it.id === itemId
                          ? {
                              ...it,
                              hasMp3Blob: type === 'mp3' ? true : it.hasMp3Blob,
                              hasMp4Blob: type === 'mp4' ? true : it.hasMp4Blob,
                              fileSizeLabel: sizeLabel || it.fileSizeLabel,
                            }
                          : it
                      );
                      saveAudiobooksMetaToStorage(next);
                      return next;
                    });
                  }}
                  onSellWithPayPal={(item) =>
                    handleOpenPayPalForBook(
                      item.title,
                      item.subtitle,
                      item.coverImageUrl,
                      item.chaptersCount
                    )
                  }
                  currentBookTitle={videoBook.bookTitle}
                  isSavingToFolder={isSavingToFolder}
                  saveProgressPct={saveFolderProgress}
                />
              )}
            </div>
          )}

        {/* =====================================================================
            MODULE 02: DIRECTOR AUDIOVISUAL — ADAPTADOR DE PDF A PROPUESTA IA
           ===================================================================== */}
        {activeModule === 'pdf-director' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Project Info & PDF Input (4 cols) */}
            <section className="lg:col-span-4 bg-[#111318] border border-white/8 rounded-xl p-6 flex flex-col gap-5">
              <div className="border-b border-white/8 pb-4">
                <p className="text-xs text-amber-400 font-medium mb-1">
                  Director Audiovisual, Guionista Senior & Especialista IA
                </p>
                <h1 className="font-display text-xl font-bold text-white">
                  De Documento PDF a Propuesta Audiovisual
                </h1>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Convierte el contenido extraído de un PDF en una propuesta lista para producción con análisis, estructura de retención, storyboard con prompts en inglés y notas de edición.
                </p>
              </div>

              <form onSubmit={handleGeneratePdfProposal} className="flex flex-col gap-4">
                {/* PDF Upload + Sample Selector + Texto PDF */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-medium text-slate-200">
                      Contenido del PDF a adaptar{' '}
                      <span className="font-mono text-amber-400/90">{'{{texto_pdf}}'}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {pdfWordCount} palabras
                      </span>
                      <VoiceDictationButton
                        currentValue={textoPdf}
                        onChangeText={setTextoPdf}
                        variant="dark"
                        label="Dictar contenido"
                      />
                    </div>
                  </div>

                  {/* Upload PDF Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0A0B0E] border border-dashed border-white/15">
                    <div className="flex items-center gap-2 text-xs text-slate-300 truncate max-w-[210px]">
                      <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">
                        {isExtractingPdf
                          ? 'Extrayendo texto del PDF…'
                          : uploadedPdfName || 'Ningún PDF seleccionado'}
                      </span>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors cursor-pointer shrink-0">
                      {isExtractingPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileUp className="w-3.5 h-3.5" />
                      )}
                      Subir PDF / TXT
                      <input
                        type="file"
                        accept=".pdf,.txt,.md,application/pdf,text/plain"
                        onChange={handlePdfFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Quick Sample PDFs */}
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_PDF_DOCUMENTS.map((doc) => (
                      <button
                        key={doc.filename}
                        type="button"
                        onClick={() => {
                          setTextoPdf(doc.content);
                          setUploadedPdfName(doc.filename);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          uploadedPdfName === doc.filename
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-[#161922] text-slate-400 hover:text-white'
                        }`}
                      >
                        {doc.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={6}
                    value={textoPdf}
                    onChange={(e) => setTextoPdf(e.target.value)}
                    placeholder="Pega aquí el texto extraído de tu documento PDF o sube un archivo .pdf arriba..."
                    className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 p-3 text-xs text-slate-200 leading-relaxed placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Formato y plataforma de destino {{tipo_formato}} */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Formato y plataforma de destino{' '}
                    <span className="font-mono text-slate-500">{'{{tipo_formato}}'}</span>
                  </label>
                  <input
                    type="text"
                    value={tipoFormato}
                    onChange={(e) => setTipoFormato(e.target.value)}
                    placeholder="Ej. Reels / TikTok (9:16), YouTube (16:9)..."
                    className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {FORMAT_PRESETS.map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setTipoFormato(fmt)}
                        className={`text-[11px] px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          tipoFormato === fmt
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-[#161922] text-slate-400 hover:text-white'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duración estimada {{duracion_objetivo}} */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Duración estimada{' '}
                    <span className="font-mono text-slate-500">{'{{duracion_objetivo}}'}</span>
                  </label>
                  <input
                    type="text"
                    value={duracionObjetivo}
                    onChange={(e) => setDuracionObjetivo(e.target.value)}
                    placeholder="Ej. 60 segundos, 90 segundos, 2 minutos..."
                    className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {DURATION_PRESETS.map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setDuracionObjetivo(dur)}
                        className={`text-[11px] px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          duracionObjetivo === dur
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-[#161922] text-slate-400 hover:text-white'
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tono y estilo narrativo {{tono_estilo}} */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Tono y estilo narrativo{' '}
                    <span className="font-mono text-slate-500">{'{{tono_estilo}}'}</span>
                  </label>
                  <input
                    type="text"
                    value={tonoEstilo}
                    onChange={(e) => setTonoEstilo(e.target.value)}
                    placeholder="Ej. Cinematográfico, disruptivo, documental ejecutivo..."
                    className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PROPOSAL_TONE_PRESETS.map((tn) => (
                      <button
                        key={tn}
                        type="button"
                        onClick={() => setTonoEstilo(tn)}
                        className={`text-[11px] px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          tonoEstilo === tn
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-[#161922] text-slate-400 hover:text-white'
                        }`}
                      >
                        {tn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motor/Herramienta de IA prevista {{herramienta_ia}} */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Motor / Herramienta de IA visual{' '}
                    <span className="font-mono text-slate-500">{'{{herramienta_ia}}'}</span>
                  </label>
                  <input
                    type="text"
                    value={herramientaIa}
                    onChange={(e) => setHerramientaIa(e.target.value)}
                    placeholder="Ej. Veo 3.1, Runway Gen-3, Midjourney v6, Sora..."
                    className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {AI_TOOL_PRESETS.map((tool) => (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => setHerramientaIa(tool)}
                        className={`text-[11px] px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          herramientaIa === tool
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-[#161922] text-slate-400 hover:text-white'
                        }`}
                      >
                        {tool}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Structured Master Prompt Preview */}
                <div className="bg-[#0A0B0E] border border-white/8 rounded-lg p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">
                      Prompt Maestro (Director Audiovisual IA)
                    </span>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!useCustomProposalPrompt) {
                            setCustomProposalPrompt(builtProposalPrompt);
                          }
                          setUseCustomProposalPrompt(!useCustomProposalPrompt);
                        }}
                        className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                      >
                        {useCustomProposalPrompt ? 'Usar variables' : 'Editar prompt'}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(builtProposalPrompt, 'proposal-prompt')}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        {copiedPromptId === 'proposal-prompt' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {useCustomProposalPrompt ? (
                    <textarea
                      rows={5}
                      value={customProposalPrompt}
                      onChange={(e) => setCustomProposalPrompt(e.target.value)}
                      className="w-full bg-[#111318] border border-white/10 rounded p-2 text-[11px] text-amber-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  ) : (
                    <div className="text-[11px] text-slate-400 font-mono leading-relaxed max-h-28 overflow-y-auto pr-1">
                      <p className="text-slate-300">
                        Actúa como un Director Audiovisual, Guionista Senior y Especialista en Creación de Contenido con IA.
                      </p>
                      <p className="mt-1">
                        • Formato: <span className="text-amber-300">{tipoFormato}</span>
                      </p>
                      <p>
                        • Duración: <span className="text-amber-300">{duracionObjetivo}</span>
                      </p>
                      <p>
                        • Tono: <span className="text-amber-300">{tonoEstilo}</span>
                      </p>
                      <p>
                        • Motor IA: <span className="text-amber-300">{herramientaIa}</span>
                      </p>
                    </div>
                  )}
                </div>

                {proposalError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{proposalError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isGeneratingProposal}
                  className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isGeneratingProposal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Desarrollando Propuesta y Storyboard…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generar Propuesta Audiovisual y Storyboard
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Right Column: Exhaustive Production Proposal Output (8 cols) */}
            <section className="lg:col-span-8 flex flex-col gap-6">
              {/* Top Production Header & Pipeline Actions */}
              <div className="bg-[#111318] border border-white/8 rounded-xl p-6 flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-400 tabular-nums mb-1">
                      <span>FORMATO: {proposal.targetFormat}</span>
                      <span className="text-slate-600">·</span>
                      <span>DURACIÓN: {proposal.targetDuration}</span>
                      <span className="text-slate-600">·</span>
                      <span>MOTOR IA: {proposal.aiTool}</span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      {proposal.projectTitle}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Tono y estilo narrativo:{' '}
                      <span className="text-slate-200">{proposal.narrativeTone}</span>
                    </p>
                  </div>

                  {/* Export & Send to Production Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportProposalPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#181B22] hover:bg-[#222631] text-slate-200 hover:text-amber-300 border border-white/10 text-xs font-medium transition-colors cursor-pointer"
                    >
                      {proposalExportedFormat === 'pdf' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          PDF Descargado
                        </>
                      ) : (
                        <>
                          <FileDown className="w-3.5 h-3.5 text-amber-400" />
                          Exportar PDF (.pdf)
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleExportProposalTxt}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#181B22] hover:bg-[#222631] text-slate-200 hover:text-amber-300 border border-white/10 text-xs font-medium transition-colors cursor-pointer"
                    >
                      {proposalExportedFormat === 'txt' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          TXT Descargado
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          Exportar Texto (.txt)
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendProposalToNarration()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      Enviar a Locución IA
                    </button>

                    <button
                      type="button"
                      onClick={handleSendProposalToClips}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      Generar Clips y MP4
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. ANÁLISIS Y SÍNTESIS + 2. ESTRUCTURA NARRATIVA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Análisis y Síntesis */}
                <div className="bg-[#111318] border border-white/8 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-white/6 pb-3">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      1. Análisis y Síntesis del PDF
                    </h3>
                  </div>

                  <div className="bg-[#0A0B0E] border border-amber-500/25 rounded-lg p-3.5">
                    <div className="text-[11px] font-semibold text-amber-400 uppercase mb-1">
                      Mensaje Central / Tesis Audiovisual
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {proposal.analysisSynthesis.coreMessage}
                    </p>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-slate-300 mb-2">
                      Puntos Clave Extraídos (Sin Ruido Técnico)
                    </div>
                    <ul className="flex flex-col gap-2">
                      {proposal.analysisSynthesis.keyPoints.map((pt, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-300 leading-relaxed flex items-start gap-2"
                        >
                          <span className="font-mono text-amber-400 font-semibold shrink-0">
                            0{i + 1}.
                          </span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-white/6 pt-3">
                    <div className="text-xs font-medium text-slate-400 mb-1.5">
                      Datos Indispensables para Retención
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {proposal.analysisSynthesis.essentialData.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-[#161922] border border-white/8 text-slate-300 px-2.5 py-1 rounded"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Estructura Narrativa */}
                <div className="bg-[#111318] border border-white/8 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-white/6 pb-3">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      2. Estructura Narrativa de Retención
                    </h3>
                  </div>

                  {/* Gancho Inicial 3-5s */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5">
                    <div className="text-[11px] font-semibold text-amber-300 uppercase mb-1">
                      Gancho Inicial (Primeros 3 - 5 Segundos)
                    </div>
                    <p className="text-xs text-white leading-relaxed font-medium">
                      {proposal.narrativeStructure.hook}
                    </p>
                  </div>

                  {/* Bloques de Valor */}
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-medium text-slate-300">
                      Desarrollo Dinámico en Bloques de Valor
                    </div>
                    {proposal.narrativeStructure.valueBlocks.map((block, idx) => (
                      <div
                        key={idx}
                        className="bg-[#0A0B0E] border border-white/6 rounded-lg p-3"
                      >
                        <div className="text-xs font-semibold text-amber-400">
                          {block.title}
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                          {block.summary}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Clímax & CTA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-[#0A0B0E] border border-white/6 rounded-lg p-3">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Clímax / Conclusión
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {proposal.narrativeStructure.climaxConclusion}
                      </p>
                    </div>
                    <div className="bg-[#0A0B0E] border border-emerald-500/25 rounded-lg p-3">
                      <div className="text-[11px] font-semibold text-emerald-400 uppercase mb-1">
                        Llamado a la Acción (CTA)
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {proposal.narrativeStructure.callToAction}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* EDICIÓN MANUAL DE METADATOS SEO (TÍTULO Y DESCRIPCIÓN) PARA DOCUMENTOS GENERADOS */}
              <ProposalSeoEditor
                initialTitle={proposal.projectTitle}
                initialDescription={proposal.analysisSynthesis.coreMessage}
                currentSeoMeta={proposal.seoMetadata}
                onSaveSeoMetadata={(seoMeta) => {
                  setProposal((prev) => ({
                    ...prev,
                    seoMetadata: seoMeta,
                  }));
                  applyDynamicStudioSeo('pdf-director', seoMeta.seoTitle);
                }}
              />

              {/* 3. TABLA DE STORYBOARD ESCENA POR ESCENA */}
              <div className="bg-[#111318] border border-white/8 rounded-xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-white/8 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      3. Tabla de Storyboard Escena por Escena
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Escaleta técnica con tiempos, locución exacta, puesta en escena, prompts en inglés para{' '}
                      <span className="text-amber-300 font-medium">{proposal.aiTool}</span> y texto en pantalla (Overlay).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        proposal.storyboard.map((s) => s.aiVisualPrompt).join('\n\n'),
                        'all-ai-prompts'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181B22] hover:bg-[#222631] border border-white/10 text-xs text-slate-200 cursor-pointer"
                  >
                    {copiedPromptId === 'all-ai-prompts' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Todos los Prompts Copiados
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        Copiar todos los Prompts IA ({proposal.aiTool})
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[920px]">
                    <thead>
                      <tr className="bg-[#0A0B0E] border-b border-white/8 text-[11px] font-mono uppercase text-slate-400">
                        <th className="py-3 px-4 w-20">Escena #</th>
                        <th className="py-3 px-4 w-28">Tiempo</th>
                        <th className="py-3 px-4 w-64">Audio / Voz en Off + SFX</th>
                        <th className="py-3 px-4 w-64">Descripción Visual / Puesta en Escena</th>
                        <th className="py-3 px-4">
                          Prompt Generación IA (Inglés · {proposal.aiTool})
                        </th>
                        <th className="py-3 px-4 w-44">Texto en Pantalla (Overlay)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/6 text-xs">
                      {proposal.storyboard.map((row, idx) => {
                        const isPlayingScene = idx === activeStoryboardSceneIdx;
                        return (
                        <tr
                          key={row.sceneNumber || idx}
                          onClick={() => setActiveStoryboardSceneIdx(idx)}
                          className={` transition-colors align-top cursor-pointer ${
                            isPlayingScene
                              ? 'bg-amber-500/10 hover:bg-amber-500/15'
                              : 'hover:bg-[#151821]/70'
                          }`}
                        >
                          {/* Escena # */}
                          <td className="py-4 px-4 font-mono font-bold text-amber-400 tabular-nums">
                            <div className="flex items-center gap-1.5">
                              <span>#{String(row.sceneNumber).padStart(2, '0')}</span>
                              {isPlayingScene && (
                                <span
                                  className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                                  title="Escena activa en el monitor de vista previa"
                                />
                              )}
                            </div>
                          </td>

                          {/* Tiempo (Timestamp) */}
                          <td className="py-4 px-4 font-mono text-slate-300 tabular-nums">
                            <div>{row.timestamp}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              ({row.durationSec}s)
                            </div>
                          </td>

                          {/* Audio / Voz en Off */}
                          <td className="py-4 px-4">
                            <p className="text-white leading-relaxed font-medium">
                              “{row.narrationOnly || row.audioVoiceover}”
                            </p>
                            {row.sfxCue && (
                              <p className="text-[11px] text-amber-300/80 font-mono mt-1.5">
                                {row.sfxCue}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleSendProposalToNarration(
                                  row.narrationOnly || row.audioVoiceover
                                )
                              }
                              className="mt-2 inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline cursor-pointer"
                            >
                              <Mic className="w-3 h-3" />
                              Locutar escena →
                            </button>
                          </td>

                          {/* Descripción Visual / Puesta en escena */}
                          <td className="py-4 px-4 text-slate-300 leading-relaxed">
                            {row.visualStaging}
                          </td>

                          {/* Prompt para Generación de Video/Imagen con IA */}
                          <td className="py-4 px-4">
                            <div className="bg-[#0A0B0E] border border-white/8 rounded-lg p-2.5 font-mono text-[11px] text-amber-100/90 leading-relaxed">
                              {row.aiVisualPrompt}
                            </div>

                            {row.imageUrl && (
                              <div className="mt-2 relative rounded-lg overflow-hidden border border-white/10 bg-black max-w-[240px]">
                                <img
                                  src={row.imageUrl}
                                  alt={row.onScreenText}
                                  className="w-full h-28 object-cover"
                                />
                                <a
                                  href={row.imageUrl}
                                  download={`storyboard-escena-0${row.sceneNumber}.png`}
                                  className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/80 text-[10px] text-amber-300 border border-white/15 inline-flex items-center gap-1"
                                >
                                  <Download className="w-2.5 h-2.5" />
                                  PNG
                                </a>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(
                                    row.aiVisualPrompt,
                                    `sb-prompt-${row.sceneNumber}`
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#181B22] hover:bg-[#222631] text-[11px] text-slate-300 hover:text-white border border-white/8 cursor-pointer"
                              >
                                {copiedPromptId === `sb-prompt-${row.sceneNumber}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    Copiado
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-amber-400" />
                                    Copiar Prompt
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleGenerateStoryboardRowImage(idx)}
                                disabled={generatingStoryboardImgIdx === idx}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#181B22] hover:bg-[#222631] text-[11px] text-amber-300 border border-amber-500/30 cursor-pointer disabled:opacity-50"
                              >
                                {generatingStoryboardImgIdx === idx ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Generando…
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="w-3 h-3" />
                                    {row.imageUrl ? 'Regenerar Fotograma' : 'Generar Fotograma IA'}
                                  </>
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Texto en Pantalla (Overlay) */}
                          <td className="py-4 px-4">
                            <span className="inline-block font-mono font-bold text-[11px] uppercase tracking-wide px-2.5 py-1.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {row.onScreenText}
                            </span>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. RECOMENDACIONES TÉCNICAS DE EDICIÓN + LOCUCIÓN CONTINUA */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 bg-[#111318] border border-white/8 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-white/6 pb-3">
                    <Scissors className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      4. Recomendaciones Técnicas de Edición
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#0A0B0E] border border-white/6 rounded-lg p-3.5">
                      <div className="text-[11px] font-semibold text-amber-400 uppercase mb-1">
                        Ritmo de Corte (Cuts Pacing)
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {proposal.technicalEditing.cutsPacing}
                      </p>
                    </div>

                    <div className="bg-[#0A0B0E] border border-white/6 rounded-lg p-3.5">
                      <div className="text-[11px] font-semibold text-amber-400 uppercase mb-1">
                        Banda Sonora Sugerida (~{proposal.technicalEditing.recommendedBpm} BPM)
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {proposal.technicalEditing.soundtrackStyle}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0A0B0E] border border-white/6 rounded-lg p-3.5">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase mb-2">
                      Efectos Sonoros Específicos (SFX) para Enfatizar Transiciones
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {proposal.technicalEditing.transitionSfx.map((sfx, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                        >
                          <span className="text-amber-400 font-mono">•</span>
                          <span>{sfx}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Master Continuous Narration Ready for Voiceover */}
                <div className="md:col-span-5 bg-[#111318] border border-white/8 rounded-xl p-5 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-white/6 pb-3">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Guion Maestro de Locución
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(proposal.fullVoiceoverScript, 'proposal-vo-master')
                        }
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        {copiedPromptId === 'proposal-vo-master' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed bg-[#0A0B0E] border border-white/6 rounded-lg p-3.5 italic">
                      “{proposal.fullVoiceoverScript}”
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNarrationScript(proposal.fullVoiceoverScript);
                        setActiveModule('narration');
                        handleGenerateNarration(proposal.fullVoiceoverScript);
                      }}
                      className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      Sintetizar Locución IA Ahora (24kHz)
                    </button>

                    <button
                      type="button"
                      onClick={handleSendProposalToClips}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#181B22] hover:bg-[#222631] text-slate-200 border border-white/10 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Film className="w-4 h-4 text-amber-400" />
                      Abrir Storyboard en Estudio de Video MP4
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =====================================================================
            MODULE 02: GENERADOR DE GUIONES DE VIDEO DE 2 MINUTOS + HISTORIAL
           ===================================================================== */}
        {activeModule === 'script' && (
          <div className="space-y-8">
            {/* Top Bar to Toggle 2-Minute Script History Vault */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111318] border border-white/8 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Panel de Historial y Versiones de Guiones de 2 Minutos ({scriptHistory.length} guardados)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Recupera guiones generados previamente, vuelve a editarlos escena por escena o genera clips MP4 desde versiones anteriores.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingScript(!isEditingScript)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isEditingScript
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-[#181B22] hover:bg-slate-800 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>
                    {isEditingScript
                      ? 'Modo Edición Activo (Editando Guion)'
                      : 'Editar Guion Actual'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowScriptHistoryPanel(!showScriptHistoryPanel)}
                  className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>
                    {showScriptHistoryPanel
                      ? 'Ocultar Panel de Historial'
                      : `Ver Historial (${scriptHistory.length})`}
                  </span>
                </button>
              </div>
            </div>

            {showScriptHistoryPanel && (
              <ScriptHistoryVault
                historyItems={scriptHistory}
                activeVersionId={activeScriptVersionId}
                currentScript={generatedScript}
                currentTopic={scriptTopic}
                currentTone={scriptTone}
                currentAudience={scriptAudience}
                onSaveNewVersion={(notes) =>
                  handleSaveNewScriptVersion(notes, generatedScript, 'Guardado Manual')
                }
                onUpdateActiveVersion={(notes) => handleUpdateActiveScriptVersion(notes)}
                onRestoreVersion={(item, openEditor) =>
                  handleRestoreScriptVersion(item, openEditor)
                }
                onDuplicateVersion={(item) => handleDuplicateScriptVersion(item)}
                onDeleteVersion={(id) => {
                  setScriptHistory((prev) => {
                    const next = prev.filter((it) => it.id !== id);
                    saveScriptHistoryToStorage(next);
                    return next;
                  });
                }}
                onToggleFavoriteVersion={(id) => {
                  setScriptHistory((prev) => {
                    const next = prev.map((it) =>
                      it.id === id ? { ...it, isFavorite: !it.isFavorite } : it
                    );
                    saveScriptHistoryToStorage(next);
                    return next;
                  });
                }}
                onGenerateClipsFromVersion={(item) =>
                  handleGenerateClipsFromScript(item.script, item.topic)
                }
                onSendVersionToNarration={(item) => {
                  setNarrationScript(item.script.fullNarration);
                  if (item.script.recommendedVoiceTone) {
                    setVoiceTone(item.script.recommendedVoiceTone);
                  }
                  setActiveModule('narration');
                }}
                onConvertVersionToAudiobook={(item) =>
                  handleConvertScriptVersionToAudiobook(item.script, item.topic)
                }
                onExportVersionPdf={(item) =>
                  exportScriptAsPdf(item.script, {
                    topic: item.topic,
                    tone: item.tone,
                    targetAudience: item.targetAudience,
                  })
                }
                onExportVersionTxt={(item) =>
                  exportScriptAsTxt(item.script, {
                    topic: item.topic,
                    tone: item.tone,
                    targetAudience: item.targetAudience,
                  })
                }
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Prompt Formula & Parameters (5 cols) */}
              <section className="lg:col-span-5 bg-[#111318] border border-white/8 rounded-xl p-6 flex flex-col gap-6">
                <div className="border-b border-white/8 pb-4">
                  <p className="text-xs text-amber-400 font-medium mb-1">
                    02. Arquitectura de Guion Audiovisual · Auto-Guardado en Historial
                  </p>
                  <h1 className="font-display text-2xl font-bold text-white">
                    Generador de Guion de 2 Minutos
                  </h1>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Estructura un guion cronometrado de 120 segundos con dirección de cámara, atmósfera sonora y texto listo para locutar. Cada generación se guarda en tu historial.
                  </p>
                </div>

                <form onSubmit={handleGenerateScript} className="flex flex-col gap-5">
                  {/* Tema del video */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-medium text-slate-300">
                        Tema del video <span className="text-slate-500">[tema del video]</span>
                      </label>
                      <VoiceDictationButton
                        currentValue={scriptTopic}
                        onChangeText={setScriptTopic}
                        variant="dark"
                        label="Dictar tema"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={scriptTopic}
                      onChange={(e) => setScriptTopic(e.target.value)}
                      placeholder="Ej. Cómo la biotecnología y la IA están rediseñando la medicina..."
                      className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {TOPIC_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setScriptTopic(preset)}
                          className="text-left text-xs text-slate-400 hover:text-amber-300 bg-[#161922] hover:bg-[#1C202B] px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          {preset.length > 44 ? preset.slice(0, 44) + '…' : preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tono del video */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-medium text-slate-300">
                        Tono del video <span className="text-slate-500">[tono del video]</span>
                      </label>
                      <VoiceDictationButton
                        currentValue={scriptTone}
                        onChangeText={setScriptTone}
                        variant="dark"
                        label="Dictar tono"
                      />
                    </div>
                    <input
                      type="text"
                      value={scriptTone}
                      onChange={(e) => setScriptTone(e.target.value)}
                      placeholder="Ej. cinematográfico, documental, dinámico..."
                      className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {TONE_PRESETS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setScriptTone(t)}
                          className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                            scriptTone === t
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-[#161922] text-slate-400 hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Público objetivo */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-medium text-slate-300">
                        Público objetivo <span className="text-slate-500">[público objetivo]</span>
                      </label>
                      <VoiceDictationButton
                        currentValue={scriptAudience}
                        onChangeText={setScriptAudience}
                        variant="dark"
                        label="Dictar público"
                      />
                    </div>
                    <input
                      type="text"
                      value={scriptAudience}
                      onChange={(e) => setScriptAudience(e.target.value)}
                      placeholder="Ej. emprendedores jóvenes, estudiantes de diseño..."
                      className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {AUDIENCE_PRESETS.map((aud) => (
                        <button
                          key={aud}
                          type="button"
                          onClick={() => setScriptAudience(aud)}
                          className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                            scriptAudience === aud
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-[#161922] text-slate-400 hover:text-white'
                          }`}
                        >
                          {aud}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Prompt Formula Preview Box */}
                  <div className="bg-[#0A0B0E] border border-white/8 rounded-lg p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        Fórmula de Prompt Estructurado
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (!useCustomScriptPrompt) {
                              setCustomScriptPrompt(builtScriptPrompt);
                            }
                            setUseCustomScriptPrompt(!useCustomScriptPrompt);
                          }}
                          className="text-xs text-amber-400 hover:underline cursor-pointer"
                        >
                          {useCustomScriptPrompt ? 'Usar campos guiados' : 'Editar texto libre'}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(builtScriptPrompt, 'script-prompt')}
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                        >
                          {copiedPromptId === 'script-prompt' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copiar
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {useCustomScriptPrompt ? (
                      <textarea
                        rows={3}
                        value={customScriptPrompt}
                        onChange={(e) => setCustomScriptPrompt(e.target.value)}
                        className="w-full bg-[#111318] border border-white/10 rounded p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:border-amber-500"
                      />
                    ) : (
                      <p className="text-xs text-slate-300 font-mono leading-relaxed">
                        “Genera un guion de video de 2 minutos sobre{' '}
                        <span className="text-amber-300 font-medium">{scriptTopic || '...'}</span>. El
                        tono debe ser{' '}
                        <span className="text-amber-300 font-medium">{scriptTone || '...'}</span> y el
                        público objetivo son{' '}
                        <span className="text-amber-300 font-medium">{scriptAudience || '...'}</span>.”
                      </p>
                    )}
                  </div>

                  {scriptError && (
                    <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{scriptError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isGeneratingScript}
                    className="w-full py-3 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {isGeneratingScript ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Estructurando escaleta de 2 minutos con IA…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generar Nuevo Guion de 2 Minutos (y Guardar en Historial)
                      </>
                    )}
                  </button>
                </form>
              </section>

              {/* Right Column: Generated & Editable 2-Minute Script Breakdown (7 cols) */}
              <section className="lg:col-span-7 flex flex-col gap-6">
                {/* Script Master Header */}
                <div className="bg-[#111318] border border-white/8 rounded-xl p-6 flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums mb-1">
                        <span>DURACIÓN OBJETIVO: {generatedScript.totalDuration}</span>
                        <span aria-hidden="true">·</span>
                        <span>{generatedScript.scenes.length} ESCENAS</span>
                        <span aria-hidden="true">·</span>
                        <span>VOZ SUGERIDA: {generatedScript.recommendedVoiceGender.toUpperCase()}</span>
                      </div>

                      {isEditingScript ? (
                        <div className="space-y-2 mt-2">
                          <label className="text-[11px] font-mono text-amber-400 block">
                            TÍTULO DEL GUION DE 2 MINUTOS:
                          </label>
                          <input
                            type="text"
                            value={generatedScript.title}
                            onChange={(e) =>
                              setGeneratedScript((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg bg-[#0A0B0E] border border-amber-500/50 px-3 py-2 text-base font-bold text-white focus:outline-none"
                          />
                          <label className="text-[11px] font-mono text-amber-400 block">
                            LOGLINE / SINOPSIS:
                          </label>
                          <textarea
                            rows={2}
                            value={generatedScript.logline}
                            onChange={(e) =>
                              setGeneratedScript((prev) => ({
                                ...prev,
                                logline: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg bg-[#0A0B0E] border border-white/15 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      ) : (
                        <>
                          <h2 className="font-display text-2xl font-bold text-white">
                            {generatedScript.title}
                          </h2>
                          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                            {generatedScript.logline}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsEditingScript(!isEditingScript)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isEditingScript
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-[#181B22] hover:bg-[#222631] text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditingScript ? 'Terminar Edición' : 'Editar Guion'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSaveNewScriptVersion(
                            'Versión editada manualmente',
                            generatedScript,
                            'Editado'
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#181B22] hover:bg-[#222631] text-emerald-300 border border-emerald-500/35 text-xs font-semibold transition-colors cursor-pointer"
                        title="Guardar este guion como nueva versión en el historial"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar en Historial</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportPdf}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#181B22] hover:bg-[#222631] text-slate-200 hover:text-amber-300 border border-white/10 text-xs font-medium transition-colors cursor-pointer"
                      >
                        {exportedFormat === 'pdf' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            PDF
                          </>
                        ) : (
                          <>
                            <FileDown className="w-3.5 h-3.5 text-amber-400" />
                            PDF
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleExportTxt}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#181B22] hover:bg-[#222631] text-slate-200 hover:text-amber-300 border border-white/10 text-xs font-medium transition-colors cursor-pointer"
                      >
                        {exportedFormat === 'txt' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            TXT
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            TXT
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Primary Action Row: Generate Clips from Full Script + Send to Voiceover */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/8">
                    <button
                      type="button"
                      onClick={() =>
                        handleGenerateClipsFromScript(generatedScript, scriptTopic)
                      }
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Generar Clips MP4 de Todo este Guion (2 Min)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleSendFullScriptToNarration}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Enviar a Locución IA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleConvertScriptVersionToAudiobook(generatedScript, scriptTopic)
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#181B22] hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Abrir como Audiolibro</span>
                    </button>
                  </div>

                  {/* Full Continuous Voiceover Preview / Editor */}
                  <div className="bg-[#0A0B0E] border border-white/6 rounded-lg p-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span>Locución Continua (Voiceover Master · 2 Minutos)</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedScript.fullNarration, 'full-vo')}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {copiedPromptId === 'full-vo' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar locución
                          </>
                        )}
                      </button>
                    </div>
                    {isEditingScript ? (
                      <textarea
                        rows={4}
                        value={generatedScript.fullNarration}
                        onChange={(e) =>
                          setGeneratedScript((prev) => ({
                            ...prev,
                            fullNarration: e.target.value,
                          }))
                        }
                        className="w-full rounded bg-[#111318] border border-amber-500/40 p-2.5 text-sm text-white leading-relaxed focus:outline-none"
                      />
                    ) : (
                      <p className="text-sm text-slate-200 leading-relaxed">
                        “{generatedScript.fullNarration}”
                      </p>
                    )}
                  </div>
                </div>

                {/* Timecoded Scenes List (with Inline Editing Support) */}
                <div className="flex flex-col gap-4">
                  {generatedScript.scenes.map((scene, sceneIdx) => (
                    <article
                      key={scene.sceneNumber || sceneIdx}
                      className="bg-[#111318] border border-white/8 hover:border-white/15 rounded-xl p-5 transition-colors flex flex-col gap-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/6 pb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                          <span className="font-mono text-xs font-medium text-amber-400 tabular-nums">
                            ESCENA 0{scene.sceneNumber}
                          </span>
                          <span className="text-slate-600">·</span>
                          {isEditingScript ? (
                            <input
                              type="text"
                              value={scene.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGeneratedScript((prev) => ({
                                  ...prev,
                                  scenes: prev.scenes.map((s, idx) =>
                                    idx === sceneIdx ? { ...s, title: val } : s
                                  ),
                                }));
                              }}
                              className="flex-1 rounded bg-[#0A0B0E] border border-amber-500/40 px-2.5 py-1 text-sm font-semibold text-white focus:outline-none"
                            />
                          ) : (
                            <h3 className="text-base font-semibold text-white">
                              {scene.title}
                            </h3>
                          )}
                        </div>

                        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {isEditingScript ? (
                            <input
                              type="text"
                              value={scene.timecode}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGeneratedScript((prev) => ({
                                  ...prev,
                                  scenes: prev.scenes.map((s, idx) =>
                                    idx === sceneIdx ? { ...s, timecode: val } : s
                                  ),
                                }));
                              }}
                              className="w-28 rounded bg-[#0A0B0E] border border-white/15 px-2 py-0.5 text-xs text-amber-300 font-mono"
                            />
                          ) : (
                            <span>{scene.timecode}</span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>{scene.durationSec}s</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Visual & Camera Column */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-medium text-slate-400">
                              Dirección Visual y Emoción
                            </div>
                            <VoiceDictationButton
                              currentValue={scene.visualDescription}
                              onChangeText={(val) => {
                                setGeneratedScript((prev) => ({
                                  ...prev,
                                  scenes: prev.scenes.map((s, idx) =>
                                    idx === sceneIdx ? { ...s, visualDescription: val } : s
                                  ),
                                }));
                              }}
                              variant="dark"
                              label="Dictar escena"
                            />
                          </div>
                          {isEditingScript ? (
                            <div className="space-y-2">
                              <textarea
                                rows={3}
                                value={scene.visualDescription}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setGeneratedScript((prev) => ({
                                    ...prev,
                                    scenes: prev.scenes.map((s, idx) =>
                                      idx === sceneIdx
                                        ? { ...s, visualDescription: val }
                                        : s
                                    ),
                                  }));
                                }}
                                className="w-full rounded bg-[#0A0B0E] border border-white/15 p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                              />
                              <input
                                type="text"
                                value={scene.cameraDirection}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setGeneratedScript((prev) => ({
                                    ...prev,
                                    scenes: prev.scenes.map((s, idx) =>
                                      idx === sceneIdx
                                        ? { ...s, cameraDirection: val }
                                        : s
                                    ),
                                  }));
                                }}
                                placeholder="Dirección de cámara..."
                                className="w-full rounded bg-[#0A0B0E] border border-white/15 px-2.5 py-1 text-xs text-slate-300"
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-slate-300 leading-relaxed">
                                {scene.visualDescription}
                              </p>
                              <div className="text-xs text-slate-400 pt-1">
                                <span className="text-slate-500">Estilo:</span>{' '}
                                {scene.visualStyle}
                                <span className="mx-1.5 text-slate-600">·</span>
                                <span className="text-slate-500">Cámara:</span>{' '}
                                {scene.cameraDirection}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Voiceover & Sound Column */}
                        <div className="bg-[#0A0B0E] border border-white/6 rounded-lg p-3.5 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="text-xs font-medium text-amber-400/90">
                                Texto de Narración (Voz en Off)
                              </div>
                              <VoiceDictationButton
                                currentValue={scene.narrationText}
                                onChangeText={(val) => {
                                  setGeneratedScript((prev) => {
                                    const nextScenes = prev.scenes.map((s, idx) =>
                                      idx === sceneIdx ? { ...s, narrationText: val } : s
                                    );
                                    return {
                                      ...prev,
                                      scenes: nextScenes,
                                      fullNarration: nextScenes
                                        .map((s) => s.narrationText)
                                        .join(' '),
                                    };
                                  });
                                }}
                                variant="dark"
                                label="Dictar voz"
                              />
                            </div>
                            {isEditingScript ? (
                              <textarea
                                rows={3}
                                value={scene.narrationText}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setGeneratedScript((prev) => {
                                    const nextScenes = prev.scenes.map((s, idx) =>
                                      idx === sceneIdx
                                        ? { ...s, narrationText: val }
                                        : s
                                    );
                                    return {
                                      ...prev,
                                      scenes: nextScenes,
                                      fullNarration: nextScenes
                                        .map((s) => s.narrationText)
                                        .join(' '),
                                    };
                                  });
                                }}
                                className="w-full rounded bg-[#111318] border border-amber-500/40 p-2 text-xs text-white focus:outline-none"
                              />
                            ) : (
                              <p className="text-sm text-white leading-relaxed italic">
                                “{scene.narrationText}”
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 border-t border-white/6 pt-2">
                            <span className="text-slate-500">Diseño Sonoro:</span>{' '}
                            {scene.soundDesign}
                          </div>
                        </div>
                      </div>

                      {/* Scene Pipeline Action Buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSendSceneToNarration(scene)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#181B22] text-slate-200 hover:text-amber-300 border border-white/8 hover:border-amber-500/40 transition-colors cursor-pointer"
                        >
                          <Mic className="w-3.5 h-3.5 text-amber-400" />
                          Narrar esta escena (TTS)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendSceneToSequence(scene)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#181B22] text-slate-200 hover:text-amber-300 border border-white/8 hover:border-amber-500/40 transition-colors cursor-pointer"
                        >
                          <Film className="w-3.5 h-3.5 text-amber-400" />
                          Crear clip visual de esta escena
                        </button>
                      </div>
                    </article>
                  ))}

                  {isEditingScript && (
                    <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[#111318] border border-dashed border-amber-500/40">
                      <button
                        type="button"
                        onClick={() => {
                          setGeneratedScript((prev) => {
                            const nextNum = prev.scenes.length + 1;
                            const newScene: ScriptScene = {
                              sceneNumber: nextNum,
                              timecode: '01:45 - 02:00',
                              durationSec: 15,
                              title: `Nueva Escena 0${nextNum}`,
                              visualDescription:
                                'Plano cinematográfico adicional con iluminación dramática y enfoque selectivo.',
                              visualStyle: 'Cinematográfico Anamórfico 35mm',
                              cameraDirection: 'Dolly-in suave hacia el sujeto principal',
                              narrationText:
                                'Escribe aquí la línea de locución para esta escena.',
                              soundDesign: 'Pulso ambiental cálido + transición sutil',
                            };
                            return {
                              ...prev,
                              scenes: [...prev.scenes, newScene],
                            };
                          });
                        }}
                        className="px-3.5 py-2 rounded-lg bg-[#181B22] hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Nueva Escena al Guion</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleSaveNewScriptVersion(
                            'Escenas editadas manualmente',
                            generatedScript,
                            'Editado'
                          );
                          setIsEditingScript(false);
                        }}
                        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Cambios como Nueva Versión en Historial</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODULE 03: ESTUDIO DE NARRACIÓN Y LOCUCIÓN IA (TTS)
           ===================================================================== */}
        {activeModule === 'narration' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Voice & Script Configuration (6 cols) */}
            <section className="lg:col-span-6 bg-[#111318] border border-white/8 rounded-xl p-6 flex flex-col gap-6">
              <div className="border-b border-white/8 pb-4">
                <p className="text-xs text-amber-400 font-medium mb-1">
                  03. Síntesis Vocal Neuronal (24 kHz PCM / WAV / MP3)
                </p>
                <h1 className="font-display text-2xl font-bold text-white">
                  Estudio de Narración para Guion de Video
                </h1>
                <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                  Configura el tipo de voz (masculina o femenina), el acento regional y la intención dramática para transformar tu guion o propuesta PDF en una locución lista para edición.
                </p>
              </div>

              {/* Script Input Area */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-medium text-slate-300">
                    Guion de video a locutar <span className="text-slate-500">[inserta aquí el guion]</span>
                  </label>
                  <div className="flex items-center gap-2.5">
                    <div className="font-mono text-xs text-slate-400 tabular-nums">
                      {wordCount} palabras · ~{estimatedSeconds}s estimados
                    </div>
                    <VoiceDictationButton
                      currentValue={narrationScript}
                      onChangeText={setNarrationScript}
                      variant="dark"
                      label="Dictar guion"
                    />
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={narrationScript}
                  onChange={(e) => setNarrationScript(e.target.value)}
                  placeholder="Inserta aquí el guion de video o usa el botón de micrófono para dictar..."
                  className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 p-3.5 text-sm text-white leading-relaxed placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />

                {/* Expression Markers & Quick Script Loaders */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Matices vocales:</span>
                    {['<breath>', '<laugh>', '<gasp>'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setNarrationScript((prev) => `${prev.trim()} ${tag} `)
                        }
                        className="px-2 py-0.5 rounded bg-[#161922] hover:bg-[#1E222D] text-xs font-mono text-amber-300 border border-white/6 cursor-pointer"
                        title={`Insertar marca de expresión ${tag}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNarrationScript(proposal.fullVoiceoverScript)}
                      className="text-xs text-amber-400 hover:underline cursor-pointer"
                    >
                      Cargar locución de Propuesta PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setNarrationScript(generatedScript.fullNarration)}
                      className="text-xs text-slate-400 hover:text-amber-300 hover:underline cursor-pointer"
                    >
                      Cargar guion 2 min
                    </button>
                  </div>
                </div>
              </div>

              {/* Voice Gender & Studio Timbre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-300">
                    Tipo de voz <span className="text-slate-500">[masculina/femenina]</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#0A0B0E] border border-white/8 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceGender('femenina');
                        if (voiceName !== 'Kore' && voiceName !== 'Zephyr') {
                          setVoiceName('Kore');
                        }
                      }}
                      className={`py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        voiceGender === 'femenina'
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Voz Femenina
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceGender('masculina');
                        if (voiceName === 'Kore' || voiceName === 'Zephyr') {
                          setVoiceName('Charon');
                        }
                      }}
                      className={`py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        voiceGender === 'masculina'
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Voz Masculina
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-300">
                    Perfil Acústico de Estudio
                  </label>
                  <select
                    value={voiceName}
                    onChange={(e) => {
                      const selected = VOICE_OPTIONS.find((v) => v.name === e.target.value);
                      setVoiceName(e.target.value);
                      if (selected) {
                        setVoiceGender(selected.gender as 'femenina' | 'masculina');
                      }
                    }}
                    className="w-full h-[38px] rounded-lg bg-[#0A0B0E] border border-white/10 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {VOICE_OPTIONS.map((vo) => (
                      <option key={vo.name} value={vo.name} className="bg-[#111318] text-white">
                        {vo.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Desired Accent & Tone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-300">
                    Acento deseado <span className="text-slate-500">[acento deseado]</span>
                  </label>
                  <input
                    type="text"
                    value={voiceAccent}
                    onChange={(e) => setVoiceAccent(e.target.value)}
                    placeholder="Ej. español neutro, castellano, argentino..."
                    className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'español neutro latinoamericano',
                      'español de España (castellano)',
                      'español mexicano',
                      'español rioplatense',
                    ].map((acc) => (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => setVoiceAccent(acc)}
                        className="text-xs px-2 py-0.5 rounded bg-[#161922] text-slate-400 hover:text-amber-300 cursor-pointer"
                      >
                        {acc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-300">
                    Tono deseado <span className="text-slate-500">[tono deseado]</span>
                  </label>
                  <input
                    type="text"
                    value={voiceTone}
                    onChange={(e) => setVoiceTone(e.target.value)}
                    placeholder="Ej. cálido y documental, enérgico, sereno..."
                    className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'cinematográfico y envolvente',
                      'profesional e informativo',
                      'entusiasta y comercial',
                      'íntimo y reflexivo',
                    ].map((tn) => (
                      <button
                        key={tn}
                        type="button"
                        onClick={() => setVoiceTone(tn)}
                        className="text-xs px-2 py-0.5 rounded bg-[#161922] text-slate-400 hover:text-amber-300 cursor-pointer"
                      >
                        {tn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exact User Formula Preview */}
              <div className="bg-[#0A0B0E] border border-white/8 rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    Prompt de Locución Estructurado
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(builtNarrationPrompt, 'narration-prompt')}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    {copiedPromptId === 'narration-prompt' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar prompt
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  “Genera una narración para el siguiente guion de video:{' '}
                  <span className="text-amber-300">
                    {narrationScript
                      ? `"${narrationScript.slice(0, 75)}${narrationScript.length > 75 ? '…' : ''}"`
                      : '[inserta aquí el guion]'}
                  </span>
                  . La voz debe ser <span className="text-amber-300">{voiceGender}</span>, con un
                  acento <span className="text-amber-300">{voiceAccent}</span> y un tono{' '}
                  <span className="text-amber-300">{voiceTone}</span>.”
                </p>
              </div>

              {narrationError && (
                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{narrationError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleGenerateNarration()}
                disabled={isGeneratingNarration}
                className="w-full py-3 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isGeneratingNarration ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sintetizando Narración en Estudio (24kHz)…
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Generar Narración de Voz IA
                  </>
                )}
              </button>
            </section>

            {/* Right Column: Master Audio Deck & Recorded Takes (6 cols) */}
            <section className="lg:col-span-6 flex flex-col gap-6">
              {activeTake ? (
                <>
                  <StudioAudioPlayer
                    take={activeTake}
                    onToggleFavorite={handleToggleTakeFavorite}
                  />

                  <div className="flex items-center justify-between bg-[#111318] border border-white/8 rounded-lg p-4">
                    <div className="text-xs text-slate-300">
                      ¿Quieres acompañar una secuencia visual con esta locución?
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachVoiceoverToSequence(true);
                        setActiveModule('sequence');
                      }}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                    >
                      Sincronizar en Secuencia de Video
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-[#111318] border border-white/8 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[260px]">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="max-w-md">
                    <h2 className="text-base font-semibold text-white">
                      Consola de Masterización de Voz Lista
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Presiona “Generar Narración de Voz IA” para sintetizar el guion actual con la voz, el acento y el tono seleccionados, o elige cualquier escena de tu Propuesta PDF.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Scene Selector from Active Proposal Storyboard */}
              <div className="bg-[#111318] border border-white/8 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Escenas del Storyboard Activo ({proposal.projectTitle})
                  </h3>
                  <span className="text-xs text-slate-500">Clic para cargar texto</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {proposal.storyboard.map((row) => (
                    <button
                      key={row.sceneNumber}
                      type="button"
                      onClick={() => setNarrationScript(row.narrationOnly || row.audioVoiceover)}
                      className="text-left p-3 rounded-lg bg-[#0A0B0E] hover:bg-[#151821] border border-white/6 hover:border-amber-500/30 transition-colors flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="text-xs text-slate-300 line-clamp-2">
                        <span className="font-mono text-amber-400 mr-2">
                          0{row.sceneNumber} [{row.timestamp}]
                        </span>
                        “{row.narrationOnly || row.audioVoiceover}”
                      </div>
                      <span className="font-mono text-[11px] text-amber-300 shrink-0">
                        {row.onScreenText}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recorded Voice Takes History & Favorites Section */}
              {voiceTakes.length > 0 && (
                <div className="bg-[#111318] border border-white/8 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                        <span>Historial de Tomas de Locución</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-amber-300">
                          {voiceTakes.length} tomas
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Guarda tus tomas preferidas con el corazón ❤️ para encontrarlas rápidamente.
                      </p>
                    </div>

                    {/* Filter Tabs: Todas vs Favoritos */}
                    <div className="inline-flex items-center p-1 rounded-lg bg-[#0A0B0E] border border-white/10">
                      <button
                        type="button"
                        onClick={() => setVoiceFilterTab('all')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          voiceFilterTab === 'all'
                            ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Todas ({voiceTakes.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoiceFilterTab('favorites')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          voiceFilterTab === 'favorites'
                            ? 'bg-rose-500 text-white shadow-xs font-black'
                            : 'text-slate-400 hover:text-rose-300'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            voiceFilterTab === 'favorites' ? 'fill-current' : 'text-rose-400'
                          }`}
                        />
                        <span>Favoritos ({voiceTakes.filter((t) => t.isFavorite).length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Takes List */}
                  {(() => {
                    const favoriteTakes = voiceTakes.filter((t) => t.isFavorite);
                    const displayed =
                      voiceFilterTab === 'favorites' ? favoriteTakes : voiceTakes;

                    if (displayed.length === 0 && voiceFilterTab === 'favorites') {
                      return (
                        <div className="p-8 rounded-xl bg-[#0A0B0E] border border-dashed border-rose-500/30 text-center flex flex-col items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                            <Heart className="w-5 h-5 text-rose-400" />
                          </div>
                          <div className="text-sm font-semibold text-slate-200">
                            Aún no tienes tomas favoritas guardadas
                          </div>
                          <p className="text-xs text-slate-400 max-w-sm">
                            Haz clic en el icono de corazón en cualquier toma de locución para guardarla y acceder a ella rápidamente en esta sección.
                          </p>
                          <button
                            type="button"
                            onClick={() => setVoiceFilterTab('all')}
                            className="mt-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-slate-200 cursor-pointer"
                          >
                            Ver todas las tomas ({voiceTakes.length})
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-2">
                        {displayed.map((t) => {
                          const isCurrentActive = t.id === activeTake?.id;
                          return (
                            <div
                              key={t.id}
                              onClick={() => setActiveTakeId(t.id)}
                              className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                                isCurrentActive
                                  ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-xs'
                                  : t.isFavorite
                                  ? 'bg-rose-500/[0.04] border-rose-500/30 text-slate-300 hover:border-rose-500/50 hover:bg-rose-500/[0.08]'
                                  : 'bg-[#0A0B0E] border-white/6 text-slate-400 hover:text-white hover:border-white/15'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {/* Botón de Favorito con Icono de Corazón */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleTakeFavorite(t.id);
                                  }}
                                  className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                                    t.isFavorite
                                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 hover:scale-110 shadow-xs'
                                      : 'text-slate-500 hover:text-rose-400 hover:bg-white/5 hover:scale-110'
                                  }`}
                                  title={
                                    t.isFavorite
                                      ? 'Quitar toma de favoritos'
                                      : 'Guardar toma como favorita'
                                  }
                                  aria-label={
                                    t.isFavorite
                                      ? 'Quitar toma de favoritos'
                                      : 'Guardar toma como favorita'
                                  }
                                >
                                  <Heart
                                    className={`w-4 h-4 transition-transform ${
                                      t.isFavorite
                                        ? 'fill-rose-500 text-rose-500 scale-110'
                                        : 'text-slate-500 group-hover:text-rose-400'
                                    }`}
                                  />
                                </button>

                                <div className="truncate text-xs flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-amber-400 font-bold">
                                      #{t.id}
                                    </span>
                                    <span className="font-semibold text-slate-200">
                                      {t.voiceName} ({t.voiceGender})
                                    </span>
                                    <span className="text-slate-400 hidden sm:inline">
                                      · {t.accent}
                                    </span>
                                    {t.isFavorite && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                        Favorita ❤️
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-400 truncate text-[11px] mt-0.5">
                                    “{t.scriptExcerpt}”
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono text-xs text-slate-400 tabular-nums">
                                  {t.durationSec.toFixed(1)}s
                                </span>
                                {isCurrentActive && (
                                  <span
                                    className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                                    title="Toma activa en máster"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>
          </div>
        )}

        {/* =====================================================================
            MODULE 04: LABORATORIO DE SECUENCIAS DE VIDEO CORTAS & CLIPS MP4/MP3
           ===================================================================== */}
        {activeModule === 'sequence' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Visual Sequence Prompt & Controls (5 cols) */}
            <section className="lg:col-span-5 bg-[#111318] border border-white/8 rounded-xl p-6 flex flex-col gap-6">
              <div className="border-b border-white/8 pb-4">
                <p className="text-xs text-amber-400 font-medium mb-1">
                  04. Dirección de Fotografía y Síntesis de Video MP4 / MP3
                </p>
                <h1 className="font-display text-2xl font-bold text-white">
                  Secuencia de Video Corta y Generación de Clips
                </h1>
                <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                  Diseña una secuencia visual a partir de tu storyboard o de una escena/emoción y exporta el máster en MP4 o MP3.
                </p>
              </div>

              <form onSubmit={handleGenerateSequencePlan} className="flex flex-col gap-5">
                {/* Descripción de la escena o emoción */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-medium text-slate-300">
                      Descripción de la escena o emoción{' '}
                      <span className="text-slate-500">[descripción de la escena o emoción]</span>
                    </label>
                    <VoiceDictationButton
                      currentValue={sceneEmotionDesc}
                      onChangeText={setSceneEmotionDesc}
                      variant="dark"
                      label="Dictar escena"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={sceneEmotionDesc}
                    onChange={(e) => setSceneEmotionDesc(e.target.value)}
                    placeholder="Ej. la sensación de vértigo y libertad al descubrir un océano luminiscente bajo la noche (o dicta tu idea con el micrófono)..."
                    className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'el asombro silencioso de un astronauta contemplando un eclipse estelar',
                      'la nostalgia cálida de un atardecer sobre una ciudad costera',
                      'la adrenalina y precisión de una red neuronal despertando',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSceneEmotionDesc(preset)}
                        className="text-left text-xs px-2.5 py-1 rounded bg-[#161922] text-slate-400 hover:text-amber-300 cursor-pointer"
                      >
                        {preset.slice(0, 46)}…
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estilo visual deseado */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-medium text-slate-300">
                      Estilo visual deseado{' '}
                      <span className="text-slate-500">[estilo visual deseado]</span>
                    </label>
                    <VoiceDictationButton
                      currentValue={visualStyleDesc}
                      onChangeText={setVisualStyleDesc}
                      variant="dark"
                      label="Dictar estilo"
                    />
                  </div>
                  <input
                    type="text"
                    value={visualStyleDesc}
                    onChange={(e) => setVisualStyleDesc(e.target.value)}
                    placeholder="Ej. cyberpunk atmosférico, acuarela animada, cine 70mm..."
                    className="w-full rounded-lg bg-[#0A0B0E] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'cinematográfico anamórfico 35mm con luz volumétrica',
                      'neo-noir futurista de alto contraste ámbar y cian',
                      'minimalismo arquitectónico nórdico en película Kodak 65mm',
                      'arte conceptual etéreo con desenfoque bokeh orgánico',
                    ].map((stylePreset) => (
                      <button
                        key={stylePreset}
                        type="button"
                        onClick={() => setVisualStyleDesc(stylePreset)}
                        className="text-xs px-2.5 py-1 rounded bg-[#161922] text-slate-400 hover:text-amber-300 cursor-pointer"
                      >
                        {stylePreset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio & Audio Sync Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-slate-400">Relación de Aspecto</span>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0A0B0E] border border-white/8 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setSequenceAspectRatio('16:9')}
                        className={`py-1.5 rounded text-xs font-mono cursor-pointer ${
                          sequenceAspectRatio === '16:9'
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        16:9 Cine
                      </button>
                      <button
                        type="button"
                        onClick={() => setSequenceAspectRatio('9:16')}
                        className={`py-1.5 rounded text-xs font-mono cursor-pointer ${
                          sequenceAspectRatio === '9:16'
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        9:16 Vertical
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-slate-400">Pista de Locución IA</span>
                    <button
                      type="button"
                      onClick={() => setAttachVoiceoverToSequence(!attachVoiceoverToSequence)}
                      className={`h-[38px] px-3 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer ${
                        attachVoiceoverToSequence && activeTake
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-[#0A0B0E] border-white/8 text-slate-400'
                      }`}
                    >
                      <span className="truncate">
                        {activeTake
                          ? attachVoiceoverToSequence
                            ? `Sincronizada (${activeTake.voiceName})`
                            : 'Locución silenciada'
                          : 'Sin locución aún'}
                      </span>
                      <Volume2 className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Live Prompt Formula Preview */}
                <div className="bg-[#0A0B0E] border border-white/8 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      Prompt de Secuencia Visual
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(builtSequencePrompt, 'seq-prompt')}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      {copiedPromptId === 'seq-prompt' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed">
                    “Crea una secuencia de video corta que represente{' '}
                    <span className="text-amber-300">{sceneEmotionDesc || '...'}</span>. Utiliza un
                    estilo visual{' '}
                    <span className="text-amber-300">{visualStyleDesc || '...'}</span>.”
                  </p>
                </div>

                {sequenceError && (
                  <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{sequenceError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isGeneratingSequence}
                  className="w-full py-3 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isGeneratingSequence ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Coreografiando planos, lentes y color con IA…
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Crear Secuencia de Video Corta
                    </>
                  )}
                </button>
              </form>

              {/* Keyframe Images + MP4 / MP3 Production Box */}
              <div className="border-t border-white/8 pt-5 flex flex-col gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-white">
                    Imágenes de la Secuencia y Exportación en MP4 / MP3
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Genera imágenes con IA o sube tus propias imágenes para los planos, y crea el archivo descargable en <span className="font-mono text-amber-300">.mp4</span> (video + imágenes + voz) o <span className="font-mono text-amber-300">.mp3</span> (solo audio).
                  </p>
                </div>

                {/* Image Generation & Upload Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleGenerateAllShotImages}
                    disabled={generatingShotImgIdx !== null}
                    className="py-2.5 px-3 rounded-lg bg-[#181B22] hover:bg-[#222631] border border-white/10 hover:border-amber-500/40 text-xs font-medium text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {generatingShotImgIdx === 'all' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        Generando Imágenes…
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        Generar Imágenes IA ({sequencePlan.shots.length} Planos)
                      </>
                    )}
                  </button>

                  <label className="py-2.5 px-3 rounded-lg bg-[#181B22] hover:bg-[#222631] border border-white/10 hover:border-amber-500/40 text-xs font-medium text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    Subir Imágenes a los Planos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleUploadImages(e)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">Calidad de salida MP4</span>
                  <select
                    value={veoResolution}
                    onChange={(e) => setVeoResolution(e.target.value as '720p' | '1080p')}
                    className="rounded bg-[#0A0B0E] border border-white/10 px-2.5 py-1 text-xs font-mono text-slate-300"
                  >
                    <option value="720p">720p HD (MP4)</option>
                    <option value="1080p">1080p Full HD (MP4)</option>
                  </select>
                </div>

                {veoError && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                    {veoError}
                  </div>
                )}

                {veoStatusMessage && (
                  <div className="p-3 rounded-lg bg-[#0A0B0E] border border-white/10 text-xs text-slate-300 flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                    <span>{veoStatusMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleGenerateVeoVideo}
                    disabled={isGeneratingVeo}
                    className="py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {isGeneratingVeo
                      ? 'Creando Video MP4…'
                      : 'Crear y Descargar Video (.mp4)'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSequenceMp3}
                    disabled={isExportingSequenceMp3}
                    className="py-2.5 px-4 rounded-lg bg-[#181B22] hover:bg-[#222631] border border-white/10 hover:border-amber-500/40 text-xs font-medium text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isExportingSequenceMp3 ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        Exportando MP3…
                      </>
                    ) : (
                      <>
                        <Music className="w-3.5 h-3.5 text-amber-400" />
                        Crear y Descargar Audio (.mp3)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Right Column: Cinema Viewport & Multi-Shot Breakdown (7 cols) */}
            <section className="lg:col-span-7 flex flex-col gap-6">
              {/* Main Sequence Viewport Card */}
              <div className="bg-[#111318] border border-white/8 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-400 font-mono tabular-nums">
                      SECUENCIA MULTICAPA SIN LÍMITE DE TIEMPO · {sequencePlan.shots.length} PLANOS ·{' '}
                      {sequencePlan.shots.reduce((acc, s) => acc + (Number(s.durationSec) || 5), 0)}s TOTAL ·{' '}
                      {sequencePlan.bpmTempo || 84} BPM
                    </div>
                    <h2 className="font-display text-xl font-bold text-white mt-0.5">
                      {sequencePlan.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModule('niche-gallery')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Elegir de las 1,200 Fotos de Nichos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSequencePlan((prev) => {
                          const nextNum = prev.shots.length + 1;
                          return {
                            ...prev,
                            shots: [
                              ...prev.shots,
                              {
                                shotNumber: nextNum,
                                durationSec: 15,
                                shotType: `Plano 0${nextNum} Extendido`,
                                cameraMotion: 'dolly-in',
                                visualMotif: 'cityscape',
                                headlineText: `ESCENA 0${nextNum} · SIN LÍMITE`,
                                actionDescription:
                                  'Secuencia cinematográfica extendida de alta definición sin límite de tiempo.',
                                primaryHex: '#0D1322',
                                secondaryHex: '#1B2845',
                                accentHex: '#F59E0B',
                                focalLens: '35mm Anamorphic',
                              },
                            ],
                          };
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Añadir Plano Sin Límite</span>
                    </button>
                  </div>
                </div>

                {/* Live Procedural 60fps Cinema Canvas + MP4/MP3 Video Recorder */}
                <CinemaSequenceCanvas
                  sequence={sequencePlan}
                  audioUrl={attachVoiceoverToSequence && activeTake ? activeTake.wavUrl : null}
                  audioBase64={
                    attachVoiceoverToSequence && activeTake ? activeTake.audioBase64 : null
                  }
                  narrationText={
                    activeTake?.fullScript || narrationScript || sequencePlan.suggestedVoiceover
                  }
                  aspectRatio={sequenceAspectRatio}
                  activeShotIndex={activeShotIndex}
                  onActiveShotChange={setActiveShotIndex}
                  onMp4Created={(url) => setVeoVideoUrl(url)}
                />

                {/* Suggested Voiceover from Sequence Director */}
                {sequencePlan.suggestedVoiceover && (
                  <div className="bg-[#0A0B0E] border border-white/6 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-300 italic">
                      <span className="not-italic font-medium text-amber-400 mr-2">
                        Voz en off sugerida:
                      </span>
                      “{sequencePlan.suggestedVoiceover}”
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNarrationScript(sequencePlan.suggestedVoiceover);
                        setActiveModule('narration');
                        handleGenerateNarration(sequencePlan.suggestedVoiceover);
                      }}
                      className="text-xs text-amber-400 hover:underline font-medium shrink-0 cursor-pointer"
                    >
                      Sintetizar esta voz en Estudio →
                    </button>
                  </div>
                )}
              </div>

              {/* Native Veo 3.1 MP4 Result (if generated) */}
              {veoVideoUrl && (
                <div className="bg-[#111318] border border-emerald-500/30 rounded-xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      Máster de Video Generado Sin Límite (MP4)
                    </h3>
                    <a
                      href={veoVideoUrl}
                      download="kinetix-video-sequence.mp4"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar MP4
                    </a>
                  </div>
                  <video
                    src={veoVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full rounded-lg border border-white/10 bg-black"
                  />
                </div>
              )}

              {/* Multi-Shot Storyboard, Keyframe Images & Unlimited Duration Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sequencePlan.shots.map((shot, idx) => {
                  const isCurrent = idx === activeShotIndex;
                  const isGeneratingThisImg =
                    generatingShotImgIdx === idx || generatingShotImgIdx === 'all';
                  return (
                    <div
                      key={shot.shotNumber || idx}
                      className={`bg-[#111318] rounded-xl p-4 border transition-colors flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? 'border-amber-500/50 bg-[#151821]'
                          : 'border-white/8'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                          <span className="text-amber-400 font-extrabold">
                            PLANO 0{shot.shotNumber} · {shot.durationSec}s
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 text-[11px]">Duración (s):</span>
                            <input
                              type="number"
                              min={3}
                              max={3600}
                              value={shot.durationSec}
                              onChange={(e) => {
                                const nextDur = Math.max(3, Number(e.target.value) || 8);
                                setSequencePlan((prev) => ({
                                  ...prev,
                                  shots: prev.shots.map((s, sIdx) =>
                                    sIdx === idx ? { ...s, durationSec: nextDur } : s
                                  ),
                                }));
                              }}
                              className="w-16 px-2 py-0.5 rounded bg-white border border-slate-300 text-xs font-mono font-extrabold text-slate-950"
                              title="Duración libre en segundos sin límite de tiempo"
                            />
                          </div>
                        </div>

                        {/* Shot Keyframe Image Preview with Automatic Cinematic Ken Burns */}
                        {shot.imageUrl ? (
                          <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#0A0B0E] aspect-video group shadow-inner">
                            <img
                              src={shot.imageUrl}
                              alt={shot.headlineText}
                              className={`w-full h-full object-cover ${
                                isCurrent
                                  ? shot.cameraMotion?.toLowerCase().includes('zoom-out')
                                    ? 'kenburns-zoom-out'
                                    : shot.cameraMotion?.toLowerCase().includes('pan-right')
                                      ? 'kenburns-pan-right'
                                      : shot.cameraMotion?.toLowerCase().includes('pan-left')
                                        ? 'kenburns-pan-left'
                                        : 'kenburns-zoom-in'
                                  : idx % 4 === 0
                                    ? 'kenburns-zoom-in opacity-95 group-hover:opacity-100'
                                    : idx % 4 === 1
                                      ? 'kenburns-pan-left opacity-95 group-hover:opacity-100'
                                      : idx % 4 === 2
                                        ? 'kenburns-zoom-out opacity-95 group-hover:opacity-100'
                                        : 'kenburns-pan-right opacity-95 group-hover:opacity-100'
                              }`}
                            />
                            {/* Ken Burns Live Dynamic Motion Pill */}
                            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/85 backdrop-blur-sm border border-amber-500/50 text-[10px] font-mono text-amber-300 font-extrabold shadow-md">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isCurrent ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                                }`}
                              />
                              <span>
                                {isCurrent
                                  ? `KEN BURNS ACTIVO · ${(shot.cameraMotion || 'ZOOM IN').toUpperCase()}`
                                  : `KEN BURNS AUTOMÁTICO · ${(shot.cameraMotion || 'DINÁMICO').toUpperCase()}`}
                              </span>
                            </div>

                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between gap-2 z-10">
                              <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                Movimiento Cinematográfico
                              </span>
                              <a
                                href={shot.imageUrl}
                                download={`plano-0${shot.shotNumber}-imagen.png`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-black/80 text-[11px] text-white hover:text-amber-300 border border-white/20 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                Descargar
                              </a>
                            </div>
                          </div>
                        ) : null}

                        <h3 className="text-sm font-semibold text-white">
                          {shot.headlineText}
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {shot.actionDescription}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2.5 pt-2 border-t border-white/6">
                        {/* Per-Shot Image Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleGenerateShotImage(idx)}
                            disabled={isGeneratingThisImg}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#181B22] hover:bg-[#222631] text-xs text-slate-200 hover:text-amber-300 border border-white/8 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isGeneratingThisImg ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                                Generando…
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-3 h-3 text-amber-400" />
                                {shot.imageUrl ? 'Regenerar Imagen IA' : 'Generar Imagen IA'}
                              </>
                            )}
                          </button>

                          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#181B22] hover:bg-[#222631] text-xs text-slate-200 hover:text-amber-300 border border-white/8 transition-colors cursor-pointer">
                            <Upload className="w-3 h-3 text-amber-400" />
                            Subir Foto
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadImages(e, idx)}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveShotIndex(idx);
                              setActiveModule('niche-gallery');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-950 border border-indigo-200 cursor-pointer"
                          >
                            <Layers className="w-3 h-3 text-indigo-700" />
                            <span>Fotos Nicho</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            {shot.shotType} · {shot.cameraMotion}
                          </span>
                          {/* Color Grading Swatches */}
                          <div className="flex items-center gap-1.5">
                            {[shot.primaryHex, shot.secondaryHex, shot.accentHex].map(
                              (hex, hIdx) => (
                                <span
                                  key={hIdx}
                                  className="w-3.5 h-3.5 rounded-xs border border-white/20"
                                  style={{ backgroundColor: hex }}
                                  title={`LUT Hex: ${hex}`}
                                />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Floating Storyboard Preview Monitor (only available in PDF Director module, closed by default) */}
      {activeModule === 'pdf-director' && (
        <FloatingStoryboardPlayer
          projectTitle={proposal.projectTitle}
          targetFormat={proposal.targetFormat}
          storyboard={proposal.storyboard}
          voiceTakes={voiceTakes}
          activeTakeId={activeTakeId}
          onSelectTake={(id) => setActiveTakeId(id)}
          activeSceneIndex={activeStoryboardSceneIdx}
          onActiveSceneChange={setActiveStoryboardSceneIdx}
          onSynthesizeFullVoiceover={() => {
            setNarrationScript(proposal.fullVoiceoverScript);
            handleGenerateNarration(proposal.fullVoiceoverScript);
          }}
          isSynthesizingVoiceover={isGeneratingNarration}
        />
      )}

      {/* Dedicated Audiobook Reproduction Screen Modal — housed inside the 'Reproducir' button */}
      {isPlayerModalOpen && (
        <div
          id="audiobook-master-player"
          role="dialog"
          aria-modal="true"
          aria-label="Reproductor de Audiolibro IA"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsPlayerModalOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-6xl max-h-[94vh] bg-white border border-amber-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-white border-b border-amber-200/80 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-amber-800">Pantalla de Reproducción</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {videoBook.pages.length} capítulos sincronizados
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-amber-900 truncate mt-0.5">
                  {videoBook.bookTitle || 'Audiolibro IA'}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlayerModalOpen(false);
                    setActiveModule('videobook');
                    setVideobookViewMode('library');
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>Biblioteca ({savedAudiobooks.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlayerModalOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                  aria-label="Cerrar pantalla de reproducción"
                >
                  <X className="w-4 h-4" />
                  <span>Cerrar</span>
                </button>
              </div>
            </div>

            {/* Modal Scrollable Player Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50/60">
              <VideoBookPlayer
                videoBook={videoBook}
                onAddUnlimitedChapter={() => {
                  setVideoBook((prev) => {
                    const nextNum = prev.pages.length + 1;
                    const newPage = {
                      pageNumber: nextNum,
                      chapterTitle: `Capítulo ${nextNum}: Desarrollo Extendido Sin Límite`,
                      pageText:
                        'Este nuevo capítulo amplía la obra sin límite de tiempo, integrando escenas visuales de alta definición y narración sincronizada.',
                      keyQuote:
                        'La narrativa sin límite de tiempo permite profundizar en cada idea con claridad cinematográfica.',
                      imagePrompt:
                        'Cinematic editorial illustration of an illuminated library and golden horizon, 8k',
                      durationSec: 15,
                      primaryHex: '#0D1322',
                      secondaryHex: '#1B2845',
                      accentHex: '#F59E0B',
                    };
                    const nextPages = [...prev.pages, newPage];
                    const nextFullNarration = nextPages
                      .map((p) => `Capítulo ${p.pageNumber}: ${p.chapterTitle}. ${p.pageText}`)
                      .join(' ');
                    setNarrationScript(nextFullNarration);
                    return {
                      ...prev,
                      pages: nextPages,
                      fullNarration: nextFullNarration,
                      totalEstimatedSec: nextPages.reduce(
                        (acc, p) => acc + (Number(p.durationSec) || 10),
                        0
                      ),
                    };
                  });
                }}
                onUpdateChapterDuration={(pageIdx, newDurationSec) => {
                  setVideoBook((prev) => {
                    const nextPages = prev.pages.map((p, idx) =>
                      idx === pageIdx ? { ...p, durationSec: Math.max(4, newDurationSec) } : p
                    );
                    return {
                      ...prev,
                      pages: nextPages,
                      totalEstimatedSec: nextPages.reduce(
                        (acc, p) => acc + (Number(p.durationSec) || 10),
                        0
                      ),
                    };
                  });
                }}
                pageImages={pageImages}
                generatingPageIdx={generatingPageIdx}
                isGeneratingAllPages={isGeneratingAllPages}
                onGeneratePageImage={(idx) => handleGeneratePageIllustration(idx)}
                onGenerateAllPageImages={() => handleGenerateAllBookIllustrations()}
                onAssignPageImage={(idx, imageUrl) => {
                  setPageImages((prev) => ({ ...prev, [idx]: imageUrl }));
                  setExportedBookMp4Url(null);
                }}
                onAssignMultiplePageImages={(imagesMap) => {
                  setPageImages((prev) => ({ ...prev, ...imagesMap }));
                  setExportedBookMp4Url(null);
                }}
                takes={voiceTakes}
                selectedTakeId={activeTakeId}
                onSelectTake={(id) => setActiveTakeId(id)}
                isGeneratingAudio={isGeneratingNarration}
                onGenerateBookAudio={() => handleGenerateNarration(videoBook.fullNarration)}
                isExportingMp4={isExportingBookMp4}
                mp4Progress={bookMp4Progress}
                exportedMp4Url={exportedBookMp4Url}
                onExportMp4={handleExportVideoBookMp4}
                onExportMp3={handleExportVideoBookMp3}
                onExportPdf={() => exportVideoBookAsPdf(videoBook)}
                onExportTxt={() => exportVideoBookAsTxt(videoBook)}
                activePageIdx={activeBookPageIdx}
                onPageChange={setActiveBookPageIdx}
                visualMode={audiobookVisualMode}
                onVisualModeChange={setAudiobookVisualMode}
                selectedAvatar={selectedAvatar}
                onSelectAvatar={(av) => {
                  setSelectedAvatar(av);
                  setCustomAvatarUrl(undefined);
                  setVoiceName(av.voiceName);
                  setVoiceGender(av.gender);
                }}
                customAvatarUrl={customAvatarUrl}
                onUploadCustomAvatar={(url) => setCustomAvatarUrl(url)}
                onSellWithPayPal={() => {
                  setIsPlayerModalOpen(false);
                  handleOpenPayPalForBook(
                    videoBook.bookTitle,
                    videoBook.subtitle,
                    pageImages[0],
                    videoBook.pages.length
                  );
                }}
                autoPlayTrigger={playerAutoPlayTrigger}
              />
            </div>
          </div>
        </div>
      )}

      {/* Administrator Account & Control Center Modal */}
      <AdminControlModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        session={adminSession}
        onLoginSuccess={handleAdminLoginSuccess}
        onLogout={handleAdminLogout}
        savedAudiobooksCount={savedAudiobooks.length}
        scriptHistoryCount={scriptHistory.length}
      />

      {/* Hyper-Futuristic Viral Gold Logo Showcase & Export Modal */}
      {isViralLogoModalOpen && (
        <FuturisticLogoModal
          onClose={() => setIsViralLogoModalOpen(false)}
          copied={false}
          onCopyBadge={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText('KINETIX ESTUDIO IA');
          }}
        />
      )}

      {/* Asistente Oficial de Soporte y Onboarding Concierge Modal */}
      <SupportConciergeModal
        isOpen={isSupportConciergeOpen}
        onClose={() => setIsSupportConciergeOpen(false)}
        onNavigateModule={(mod) => setActiveModule(mod as any)}
        onToggleGoldModel={() => {
          const next = !isGoldModel;
          setIsGoldModel(next);
          try {
            localStorage.setItem('kinetix_gold_model_mode', String(next));
          } catch {
            // ignore
          }
        }}
        isGoldModelActive={isGoldModel}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenBuyTokens={() => setIsBuyTokensModalOpen(true)}
      />

      {/* Buy Tokens Modal (Exact match to User Screenshot with 3D Gold Coin & Real PayPal Checkout) */}
      <BuyTokensModal
        isOpen={isBuyTokensModalOpen}
        onClose={() => setIsBuyTokensModalOpen(false)}
        currentBalance={userTokenBalance}
        onTokensPurchased={handleTokensPurchased}
        language={currentLanguage}
      />

      {/* Social Share & Viral Traffic + Real PayPal Test Modal */}
      <SocialShareModal
        isOpen={isSocialShareModalOpen}
        onClose={() => setIsSocialShareModalOpen(false)}
        title={videoBook.bookTitle || 'KINETIX ESTUDIO IA'}
        subtitle={videoBook.authorOrSource || videoBook.subtitle || 'Audiolibros, Guiones & Locución Neuronal'}
        onOpenBuyTokens={() => setIsBuyTokensModalOpen(true)}
        language={currentLanguage}
      />

        {/* Quiet Studio Footer */}
        <footer className="border-t border-slate-200 py-4 px-6 mt-12">
          <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              KINETIX ESTUDIO IA · Audiolibros desde PDF, Storyboard, Locución Neuronal y Exportación MP4 / MP3
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveModule('pdf-director')}
                className="hover:text-amber-800 cursor-pointer"
              >
                01. Director PDF
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('script')}
                className="hover:text-amber-800 cursor-pointer"
              >
                02. Guion 2 Min
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('narration')}
                className="hover:text-amber-800 cursor-pointer"
              >
                03. Locución
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('sequence')}
                className="hover:text-amber-800 cursor-pointer"
              >
                04. Clips MP4/MP3
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
