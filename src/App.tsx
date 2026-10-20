import React, { useState } from 'react';
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
} from 'lucide-react';
import { pcmBase64ToWav } from './utils/audioWav';
import {
  renderSequenceToVideoUrl,
  downloadAudioAsMp3,
  renderVideoBookToMp4Url,
  VideoBook,
  AudiobookVisualMode,
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
  STUDIO_PDF_LIBRARY_12,
  StudioModuleId,
} from './utils/seoMetadata';

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

export default function App() {
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

  // --- AUDIOBOOK MP3 / MP4 FOLDER VAULT STATE ---
  const [customFolders, setCustomFolders] = useState<string[]>(() =>
    loadCustomFoldersFromStorage()
  );
  const [savedAudiobooks, setSavedAudiobooks] = useState<SavedAudiobookItem[]>(() =>
    loadSavedAudiobooksMeta(INITIAL_VIDEO_BOOK, pageImages, NARRATOR_AVATAR_PRESETS[0])
  );
  const [showAudiobookFolder, setShowAudiobookFolder] = useState<boolean>(true);
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
  const [voiceTakes, setVoiceTakes] = useState<VoiceoverTake[]>([]);
  const [activeTakeId, setActiveTakeId] = useState<string | null>(null);

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

  const activeTake = voiceTakes.find((t) => t.id === activeTakeId) || voiceTakes[0] || null;

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
        setProposal(data.proposal);
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
    if (!textoPdf.trim()) {
      setVideoBookError(
        'Sube primero un archivo PDF o selecciona uno de los documentos de ejemplo.'
      );
      return;
    }

    setIsGeneratingVideoBook(true);
    setVideoBookError(null);
    setExportedBookMp4Url(null);

    try {
      const res = await fetch('/api/pdf-to-videobook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textoPdf,
          bookStyle,
          filename: uploadedPdfName || 'Documento PDF',
          targetChapters: targetChaptersCount,
          durationMode: videoDurationMode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.videoBook) {
        throw new Error(data.error || 'No se pudo convertir el PDF en Audiolibro IA.');
      }

      const createdBook: VideoBook = data.videoBook;
      setVideoBook(createdBook);
      setActiveBookPageIdx(0);

      // Immediately assign matching high-resolution photos from the 1,200+ Niche Scene Library
      const matchedNichePhotos = matchBestScenesForBookPages(createdBook.pages || []);
      const autoPhotoMap: Record<number, string> = {};
      Object.entries(matchedNichePhotos).forEach(([idxStr, photo]) => {
        autoPhotoMap[Number(idxStr)] = photo.imageUrl;
      });
      setPageImages(autoPhotoMap);

      if (createdBook.fullNarration) {
        setNarrationScript(createdBook.fullNarration);
      }

      if (autoIllustrateAndNarrate) {
        await Promise.all([
          handleGenerateAllBookIllustrations(createdBook),
          handleGenerateNarration(createdBook.fullNarration),
        ]);
      }
    } catch (err: any) {
      setVideoBookError(err?.message || 'Error al crear el Audiolibro desde el PDF.');
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
      setShowAudiobookFolder(true);
    } finally {
      setIsSavingToFolder(null);
      setSaveFolderProgress(0);
    }
  };

  const handleExportVideoBookMp4 = async () => {
    if (isExportingBookMp4) return;
    setIsExportingBookMp4(true);
    setBookMp4Progress(5);
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
        }
      );
      setExportedBookMp4Url(url);
      const slug = (videoBook.bookTitle || 'audiolibro')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 35);
      triggerDownloadUrl(url, `${slug || 'audiolibro'}-video.mp4`);

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
      setVideoBookError(err?.message || 'Error al exportar el Audiolibro en MP4.');
    } finally {
      setIsExportingBookMp4(false);
    }
  };

  const handleExportVideoBookMp3 = async () => {
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

  const handleGenerateNarration = async (overrideScript?: string) => {
    const textToSpeak = (overrideScript ?? narrationScript).trim();
    if (!textToSpeak) {
      setNarrationError('Por favor ingresa o selecciona un guion para generar la narración.');
      return;
    }

    setIsGeneratingNarration(true);
    setNarrationError(null);

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
      if (!response.ok) {
        throw new Error(data.error || 'Error al generar el audio de la narración.');
      }

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
      };

      setVoiceTakes((prev) => [newTake, ...prev]);
      setActiveTakeId(newTake.id);

      if (data.quotaFallback && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = voiceAccent.toLowerCase().includes('españa') ? 'es-ES' : 'es-MX';
          utterance.pitch = voiceGender === 'masculina' ? 0.88 : 1.08;
          utterance.rate = 0.98;
          window.speechSynthesis.speak(utterance);
        } catch (_speechErr) {
          // Ignore browser speech synthesis errors
        }
      }
    } catch (err: any) {
      setNarrationError(err?.message || 'Error al sintetizar la voz con IA.');
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

    try {
      if (hasCustomShotImages) {
        const composedMp4Url = await renderSequenceToVideoUrl(
          sequencePlan,
          sequenceAspectRatio,
          veoResolution,
          (msg) => setVeoStatusMessage(msg),
          selectedAudioB64
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
          selectedAudioB64
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
          selectedAudioB64
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
          selectedAudioB64
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
          selectedAudioB64
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
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Ultra-Modern Minimalist Glass Header */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/80">
        <div className="max-w-[1440px] mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-display text-lg font-extrabold tracking-tight text-slate-950">
                Kinetix Studio
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600 border border-slate-200/80">
                Audiolibros & Video IA
              </span>
            </div>
          </div>

          {/* Ultra-Modern Segmented Navigation with Clear Readable Typography */}
          <nav
            aria-label="Módulos del estudio"
            className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-300 rounded-2xl"
          >
            <button
              type="button"
              onClick={() => setActiveModule('videobook')}
              className={`px-3.5 py-2 rounded-xl text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'videobook'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Audiolibros & PDF ({savedAudiobooks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('niche-gallery')}
              className={`px-3.5 py-2 rounded-xl text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'niche-gallery'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-950 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>1,200 Fotos de Nichos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('script')}
              className={`px-3.5 py-2 rounded-xl text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'script'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Guiones ({scriptHistory.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('pdf-director')}
              className={`px-3.5 py-2 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                activeModule === 'pdf-director'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-white'
              }`}
            >
              Storyboard PDF
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('narration')}
              className={`px-3.5 py-2 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                activeModule === 'narration'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-white'
              }`}
            >
              Voces IA
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('sequence')}
              className={`px-3.5 py-2 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                activeModule === 'sequence'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-white'
              }`}
            >
              Videos Sin Límite MP4
            </button>
          </nav>

          {/* Clean, Modern "Suscríbete ahora" CTA Button + Admin Account Button */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
                adminSession
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
              }`}
              title={
                adminSession
                  ? `Administrador Activo: ${adminSession.user.email}`
                  : 'Iniciar sesión como Administrador'
              }
            >
              <ShieldCheck
                className={`w-4 h-4 ${
                  adminSession ? 'text-emerald-600' : 'text-slate-700'
                }`}
              />
              <span className="hidden md:inline">
                {adminSession ? `Admin · ${adminSession.user.email}` : 'Acceso Admin'}
              </span>
              <span className="md:hidden">Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('paypal-monetization')}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Suscríbete ahora</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Module Description & SEO Context Bar — High Contrast & Crystal-Clear Readability */}
      <div className="bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-extrabold uppercase tracking-wider shrink-0">
              {STUDIO_MODULE_SEO_MAP[activeModule]?.badgeText || 'Módulo Activo'}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-950">
                  {STUDIO_MODULE_SEO_MAP[activeModule]?.sectionHeading}
                </h2>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  SEO: {STUDIO_MODULE_SEO_MAP[activeModule]?.metaSection}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-800 mt-0.5 leading-snug">
                {STUDIO_MODULE_SEO_MAP[activeModule]?.shortDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-extrabold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Videos Sin Límite de Tiempo</span>
            </span>
            <span className="hidden xl:inline-flex px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 text-xs font-bold">
              1,200 Fotos HD · 12 PDFs Incluidos
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-8">
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
            onExportCurrentMp4={handleExportVideoBookMp4}
            externalCheckoutProduct={externalPayPalProduct}
            onClearExternalCheckout={() => setExternalPayPalProduct(null)}
          />
        )}

        {/* =====================================================================
            PRIMARY SIMPLE WORKFLOW: AUDIOLIBROS Y VIDEO-LIBROS IA DESDE PDF
           ===================================================================== */}
        {activeModule === 'videobook' && (
          <div className="space-y-8">
            {/* Overview of Studio Modules with Clear Short Descriptions for Easy Reading & SEO */}
            <section
              aria-label="Resumen de módulos del estudio"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
            >
              {STUDIO_MODULE_LIST.slice(0, 4).map((mod) => {
                const isCurrent = activeModule === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setActiveModule(mod.id)}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isCurrent
                        ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-md">
                        {mod.shortLabel}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        {mod.badgeText}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                      {mod.shortDescription}
                    </p>
                  </button>
                );
              })}
            </section>

            {/* Simple 3-Step PDF to Spoken Audiobook Creator Card — Ultra-Modern Surface */}
            <section className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
                <div>
                  <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-indigo-700">
                    AUDIOLIBROS IA EN VIDEO Y AUDIO · SIN LÍMITE DE TIEMPO
                  </span>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">
                    Convierte cualquier PDF en un Audiolibro Hablado con IA
                  </h1>
                  <p className="text-sm sm:text-base font-medium text-slate-800 mt-1">
                    Sube uno o varios archivos PDF, elige entre los 12 documentos completos por nicho y genera videos MP4 o audios MP3 sin límite de duración.
                  </p>
                </div>

                {/* Quick Actions: 1,200 Photos + Folder Toggle + Subscribe */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveModule('niche-gallery')}
                    className="text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-300 flex items-center gap-1.5 font-extrabold transition-all cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-indigo-700" />
                    <span>Ver las 1,200 Fotos de Nichos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAudiobookFolder(!showAudiobookFolder)}
                    className={`text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 font-extrabold border transition-all cursor-pointer ${
                      showAudiobookFolder
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>
                      {showAudiobookFolder
                        ? `Mi Biblioteca (${savedAudiobooks.length})`
                        : `Abrir Biblioteca (${savedAudiobooks.length})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModule('paypal-monetization')}
                    className="text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 font-extrabold shadow-xs transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Suscríbete ahora</span>
                  </button>
                </div>
              </div>

              {/* 12 Ready-to-Use Niche PDF Documents Selector Bar */}
              <div className="mb-6 bg-slate-50 border border-slate-300 rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs sm:text-sm font-extrabold text-slate-950 uppercase tracking-wider">
                      Biblioteca de 12 Documentos PDF Completos por Nicho (Haz clic para cargar o descargar)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    Documento activo: <strong className="text-indigo-700">{uploadedPdfName}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {SAMPLE_PDF_DOCUMENTS.map((doc) => {
                    const isSelected = uploadedPdfName === doc.filename;
                    return (
                      <div
                        key={doc.filename}
                        className={`rounded-xl p-3 border transition-all flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                            : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setTextoPdf(doc.content);
                            setUploadedPdfName(doc.filename);
                          }}
                          className="text-left cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                              }`}
                            >
                              {doc.niche}
                            </span>
                            <span
                              className={`text-[11px] font-mono font-bold ${
                                isSelected ? 'text-indigo-100' : 'text-slate-600'
                              }`}
                            >
                              {doc.pagesCount} págs
                            </span>
                          </div>
                          <div
                            className={`text-xs sm:text-sm font-extrabold leading-snug ${
                              isSelected ? 'text-white' : 'text-slate-950'
                            }`}
                          >
                            {doc.label}
                          </div>
                        </button>

                        <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-current/10">
                          <button
                            type="button"
                            onClick={() => {
                              setTextoPdf(doc.content);
                              setUploadedPdfName(doc.filename);
                            }}
                            className={`text-xs font-extrabold px-2.5 py-1 rounded-lg cursor-pointer ${
                              isSelected
                                ? 'bg-white text-indigo-950'
                                : 'bg-slate-900 text-white hover:bg-indigo-600'
                            }`}
                          >
                            {isSelected ? '✓ Cargado' : 'Usar este PDF'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const blob = new Blob([doc.content], {
                                type: 'text/plain;charset=utf-8',
                              });
                              const url = URL.createObjectURL(blob);
                              triggerDownloadUrl(url, doc.filename.replace(/\.pdf$/i, '.txt'));
                              setTimeout(() => URL.revokeObjectURL(url), 5000);
                            }}
                            className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-700 text-white hover:bg-indigo-800'
                                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                            }`}
                            title="Descargar texto del documento"
                          >
                            <Download className="w-3 h-3" />
                            <span>Bajar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3 Simple Columns: Paso 1 (PDF) | Paso 2 (Avatar, Duración Sin Límite y Escenas) | Paso 3 (Crear y Suscribirse) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* PASO 1: Subir PDF o Texto (Soporta múltiples PDFs) */}
                <div className="lg:col-span-5 bg-[#FAFAFC] border border-slate-300 rounded-2xl p-5 flex flex-col justify-between gap-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold text-slate-950 uppercase tracking-wider">
                        01 · Subir 1 o Varios PDFs / Texto
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                        {pdfWordCount} palabras
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-slate-300 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-extrabold text-slate-950 truncate">
                            {isExtractingPdf
                              ? 'Extrayendo texto del PDF...'
                              : uploadedPdfName || 'Selecciona uno o varios PDFs'}
                          </div>
                          <div className="text-xs font-semibold text-slate-700">
                            Soporta múltiples archivos .PDF, .TXT y .MD sin límite
                          </div>
                        </div>
                      </div>

                      <label className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0">
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

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-xs font-bold text-slate-800">
                        Escribe, pega o dicta tus ideas con el micrófono:
                      </span>
                      <VoiceDictationButton
                        currentValue={textoPdf}
                        onChangeText={setTextoPdf}
                        variant="light"
                        label="Dictar por voz"
                      />
                    </div>

                    <textarea
                      rows={4}
                      value={textoPdf}
                      onChange={(e) => setTextoPdf(e.target.value)}
                      placeholder="Aquí aparece el contenido extraído de tu PDF (también puedes escribir, pegar o dictar con el micrófono cualquier texto sin límite de extensión)..."
                      className="w-full rounded-xl bg-white border border-slate-300 p-3.5 text-sm font-medium text-slate-950 leading-relaxed focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* PASO 2: 30 Avatares Reales IA + Duración Sin Límite + Capítulos */}
                <div className="lg:col-span-4 bg-[#FAFAFC] border border-slate-300 rounded-2xl p-5 flex flex-col justify-between gap-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold text-slate-950 uppercase tracking-wider">
                        02 · Avatar Real & Duración Sin Límite
                      </span>
                      <span className="text-xs font-mono font-extrabold text-indigo-700">
                        30 Voces IA
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-300">
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
                        <label className="text-xs font-extrabold text-slate-800 block truncate">
                          Narrador ({selectedAvatar.accent})
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
                          className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-2 text-xs sm:text-sm font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                        >
                          {NARRATOR_AVATAR_PRESETS.map((av) => (
                            <option key={av.id} value={av.id}>
                              #{String(av.number).padStart(2, '0')} {av.name} ({av.accent.replace('Español ', '')}) — {av.category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-800 block">
                          Duración del Video
                        </label>
                        <select
                          value={videoDurationMode}
                          onChange={(e) => setVideoDurationMode(e.target.value)}
                          className="w-full rounded-xl bg-emerald-50 border border-emerald-300 px-2.5 py-2 text-xs font-extrabold text-emerald-950 focus:outline-none focus:border-emerald-600"
                        >
                          <option value="unlimited">∞ Sin Límite de Tiempo</option>
                          <option value="extended-10m">10+ Minutos Extendido</option>
                          <option value="extended-30m">30+ Minutos Audiolibro</option>
                          <option value="standard">Estándar por Capítulo</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-800 block">
                          Capítulos Iniciales
                        </label>
                        <select
                          value={targetChaptersCount}
                          onChange={(e) => setTargetChaptersCount(Number(e.target.value))}
                          className="w-full rounded-xl bg-white border border-slate-300 px-2.5 py-2 text-xs font-extrabold text-slate-950 focus:outline-none focus:border-indigo-600"
                        >
                          <option value={5}>5 Capítulos</option>
                          <option value={8}>8 Capítulos (Recomendado)</option>
                          <option value={10}>10 Capítulos</option>
                          <option value={12}>12 Capítulos Completos</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-800 block">
                        Estilo Cinematográfico de las Escenas
                      </label>
                      <select
                        value={bookStyle}
                        onChange={(e) => setBookStyle(e.target.value)}
                        className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs sm:text-sm font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
                      >
                        {BOOK_STYLE_PRESETS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between pt-2 border-t border-slate-300">
                    <span>Videos y Audios Sin Límite de Tiempo</span>
                    <span className="text-indigo-700 font-mono font-extrabold">MP4 · MP3 · PDF</span>
                  </div>
                </div>

                {/* PASO 3: Botones de Creación Modernos + Suscríbete ahora */}
                <div className="lg:col-span-3 bg-[#FAFAFC] border border-slate-300 rounded-2xl p-5 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-extrabold text-slate-950 uppercase tracking-wider block">
                      03 · Producción Sin Límite
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                      Genera el audiolibro completo con escenas de los 12 nichos en alta definición.
                    </p>
                  </div>

                  {videoBookError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-xs sm:text-sm text-red-900 font-bold">
                      {videoBookError}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleCreateVideoBookFromPdf(false)}
                      disabled={isGeneratingVideoBook || isGeneratingAllPages}
                      className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isGeneratingVideoBook ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Adaptando PDF Sin Límite...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4" />
                          <span>Crear Audiolibro desde PDF</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateVideoBookFromPdf(true)}
                      disabled={
                        isGeneratingVideoBook || isGeneratingAllPages || isGeneratingNarration
                      }
                      className="w-full py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generar Completo (Voz + Video)</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleSaveCurrentAudiobookToFolder('MP3')}
                        disabled={isSavingToFolder !== null}
                        className="py-2.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 border border-slate-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FolderOpen className="w-4 h-4 text-slate-700" />
                        <span>Guardar MP3</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveCurrentAudiobookToFolder('MP4')}
                        disabled={isSavingToFolder !== null}
                        className="py-2.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 border border-slate-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FolderOpen className="w-4 h-4 text-indigo-700" />
                        <span>Guardar MP4</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenPayPalForBook(
                          videoBook.bookTitle,
                          videoBook.subtitle,
                          pageImages[0],
                          videoBook.pages.length
                        )
                      }
                      className="w-full py-2.5 px-3 rounded-xl bg-[#FFC439] hover:bg-[#F2B729] text-[#003087] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <span>Suscríbete ahora</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Folder Vault for Saving & Downloading Audiobooks in MP3 or MP4 */}
            {showAudiobookFolder && (
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
                  setVideoBook(item.videoBook);
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
                  if (item.videoBook.fullNarration) {
                    setNarrationScript(item.videoBook.fullNarration);
                  }
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

            {/* Interactive Spoken Audiobook & Video-eBook Stage with Talking Avatar + 1,200 Topic Scenes + Unlimited Chapters */}
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
              onSellWithPayPal={() =>
                handleOpenPayPalForBook(
                  videoBook.bookTitle,
                  videoBook.subtitle,
                  pageImages[0],
                  videoBook.pages.length
                )
              }
            />
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
                  <StudioAudioPlayer take={activeTake} />

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

              {/* Recorded Voice Takes History */}
              {voiceTakes.length > 1 && (
                <div className="bg-[#111318] border border-white/8 rounded-xl p-5 flex flex-col gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Historial de Tomas de Locución ({voiceTakes.length})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {voiceTakes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTakeId(t.id)}
                        className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                          t.id === activeTake?.id
                            ? 'bg-amber-500/10 border-amber-500/40 text-white'
                            : 'bg-[#0A0B0E] border-white/6 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="truncate text-xs">
                          <span className="font-mono text-amber-400 mr-2">#{t.id}</span>
                          <span className="font-medium text-slate-200">{t.voiceName}</span> ·{' '}
                          <span>{t.accent}</span> — “{t.scriptExcerpt}”
                        </div>
                        <span className="font-mono text-xs text-slate-400 shrink-0 tabular-nums">
                          {t.durationSec.toFixed(1)}s
                        </span>
                      </button>
                    ))}
                  </div>
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

                        {/* Shot Keyframe Image Preview or Placeholder */}
                        {shot.imageUrl ? (
                          <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#0A0B0E] aspect-video group">
                            <img
                              src={shot.imageUrl}
                              alt={shot.headlineText}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-center justify-between gap-2">
                              <span className="text-[11px] font-mono text-amber-300">
                                Imagen integrada en video
                              </span>
                              <a
                                href={shot.imageUrl}
                                download={`plano-0${shot.shotNumber}-imagen.png`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-black/75 text-[11px] text-white hover:text-amber-300 border border-white/15"
                              >
                                <Download className="w-3 h-3" />
                                Descargar imagen
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

      {/* Floating Real-Time Storyboard Video Preview Monitor synced with Narration Audio */}
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

      {/* Quiet Studio Footer */}
      <footer className="border-t border-white/6 py-4 px-6 mt-12">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Kinetix Video AI Lab · Dirección Audiovisual desde PDF, Storyboard IA, Locución Neuronal y Exportación MP4 / MP3
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveModule('pdf-director')}
              className="hover:text-slate-300 cursor-pointer"
            >
              01. PDF a Propuesta IA
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('script')}
              className="hover:text-slate-300 cursor-pointer"
            >
              02. Guion 2 Min
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('narration')}
              className="hover:text-slate-300 cursor-pointer"
            >
              03. Locución
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('sequence')}
              className="hover:text-slate-300 cursor-pointer"
            >
              04. Clips MP4/MP3
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
