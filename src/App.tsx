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
import { matchBestScenesForBookPages } from './utils/nicheSceneLibrary';

type ActiveModule = 'videobook' | 'pdf-director' | 'script' | 'narration' | 'sequence';

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

const SAMPLE_PDF_DOCUMENTS = [
  {
    label: 'PDF 01 · Informe IA Generativa Audiovisual',
    filename: 'informe-ia-produccion-audiovisual-2026.pdf',
    content: `RESUMEN EJECUTIVO: IMPACTO DE LA IA GENERATIVA EN LA PRODUCCIÓN AUDIOVISUAL (2026).
Los estudios de producción digital que integran flujos de trabajo asistidos por inteligencia artificial han reducido el tiempo de preproducción y storyboard en un 68%, permitiendo validar conceptos visuales en minutos en lugar de semanas.
Sin embargo, el 82% de la retención de audiencia en plataformas verticales y de streaming sigue dependiendo de los primeros 4 segundos (el gancho narrativo) y de la claridad estructural del guion.
Tres pilares definen las producciones de alto rendimiento actual: 1) Síntesis ejecutiva sin tecnicismos innecesarios, transformando datos complejos en metáforas visuales concretas; 2) Dirección de fotografía intencional en prompts de generación de video (especificando distancia focal, iluminación volumétrica y movimiento de cámara); y 3) Diseño sonoro multicapa que combina locución neuronal expresiva con efectos de transición sincronizados (SFX) y subtítulos dinámicos en pantalla para retención sin sonido.
Conclusión: Los equipos creativos que dominan la dirección técnica de modelos generativos multiplican por 3.4x su capacidad de publicación manteniendo estándares cinematográficos.`,
  },
  {
    label: 'PDF 02 · Neurociencia de la Atención Digital',
    filename: 'estudio-neurociencia-atencion-retencion.pdf',
    content: `DOCUMENTO DE INVESTIGACIÓN: ARQUITECTURA DE LA ATENCIÓN HUMANA EN ENTORNOS DIGITALES.
El cerebro humano procesa estímulos visuales de alto contraste en apenas 13 milisegundos, pero decide si continúa prestando atención a una pieza audiovisual dentro de una ventana crítica de 3 a 5 segundos.
Cuando un contenido presenta bloques de información monótonos sin cambios de plano ni variaciones acústicas, la tasa de abandono supera el 74% antes del segundo 15.
Los hallazgos clínicos demuestran que alternar el ritmo de corte cada 3 a 4 segundos, acompañado de micro-impactos sonoros (whooshes graves, silencios tácticos de 300ms y palabras clave ancladas en pantalla), activa el sistema dopaminérgico de curiosidad anticipatoria.
Para convertir documentos técnicos en piezas memorables es indispensable eliminar la jerga pasiva, estructurar el mensaje en tres bloques de valor progresivos y cerrar con un llamado a la acción concreto y accionable.`,
  },
  {
    label: 'PDF 03 · Baterías de Estado Sólido y Energía',
    filename: 'reporte-baterias-estado-solido-movilidad.pdf',
    content: `REPORTE TÉCNICO: BATERÍAS DE ESTADO SÓLIDO Y LA NUEVA ERA DEL ALMACENAMIENTO ENERGÉTICO.
La transición hacia electrolitos sólidos cerámicos reemplaza los compuestos líquidos inflamables tradicionales, alcanzando una densidad energética de 500 Wh/kg, el doble que las celdas de iones de litio convencionales.
En pruebas industriales recientes, los nuevos prototipos lograron cargas del 10% al 80% en exactamente 6 minutos y medio, manteniendo el 92% de su capacidad tras 4,000 ciclos completos.
Este avance elimina la ansiedad de autonomía en vehículos eléctricos y habilita el almacenamiento estacionario de red a gran escala con una huella térmica un 45% menor.`,
  },
];

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
  '30 segundos (Impacto Rápido)',
  '60 segundos (1 Minuto · Retención Óptima)',
  '90 segundos (Explicativo Profundo)',
  '2 minutos (120s · Storytelling Completo)',
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

  // --- MODULE 0: PDF TO AUDIOVISUAL PROPOSAL DIRECTOR STATE ---
  const [textoPdf, setTextoPdf] = useState<string>(SAMPLE_PDF_DOCUMENTS[0].content);
  const [uploadedPdfName, setUploadedPdfName] = useState<string | null>(
    SAMPLE_PDF_DOCUMENTS[0].filename
  );
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [tipoFormato, setTipoFormato] = useState<string>(FORMAT_PRESETS[0]);
  const [duracionObjetivo, setDuracionObjetivo] = useState<string>(DURATION_PRESETS[1]);
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

  // --- MODULE 1: 2-MINUTE VIDEO SCRIPT STATE ---
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

  // --- PDF UPLOAD & PROPOSAL HANDLERS ---
  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedPdfName(file.name);
    setProposalError(null);

    // Plain text / markdown files can be read directly
    if (file.type.startsWith('text/') || /\.(txt|md|csv)$/i.test(file.name)) {
      const textContent = await file.text();
      setTextoPdf(textContent);
      e.target.value = '';
      return;
    }

    setIsExtractingPdf(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(new Error('No se pudo leer el archivo PDF'));
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
        throw new Error(data.error || 'Error al extraer texto del PDF.');
      }
      if (data.extractedText) {
        setTextoPdf(data.extractedText);
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
    await downloadAudioAsMp3({
      audioBase64: activeTake ? activeTake.audioBase64 : undefined,
      scriptText: videoBook.fullNarration,
      voiceGender: selectedAvatar.gender,
      durationSec: videoBook.totalEstimatedSec || 40,
      filename: `${slug || 'audiolibro'}-completo.mp3`,
    });
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

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F3F4F6] flex flex-col">
      {/* Top Studio Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#0A0B0E]/95 backdrop-blur-md border-b border-white/8">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center text-slate-950 font-bold shrink-0">
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                Kinetix Audiolibros IA
              </span>
              <span className="mx-2 text-slate-600">·</span>
              <span className="text-xs text-slate-400">
                Audiolibros Completos desde PDF Hablados con Avatares y Escenas del Tema
              </span>
            </div>
          </div>

          {/* Segmented Studio Workflow Switcher */}
          <nav
            aria-label="Módulos del laboratorio"
            className="flex flex-wrap items-center gap-1 p-1 bg-[#111318] border border-white/8 rounded-lg"
          >
            <button
              type="button"
              onClick={() => setActiveModule('videobook')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'videobook'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>01. Audiolibros IA desde PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('pdf-director')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeModule === 'pdf-director'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              02. Storyboard Pro
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('narration')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeModule === 'narration'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              03. Estudio de Voz
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('sequence')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeModule === 'sequence'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              04. Clips MP4/MP3
            </button>
          </nav>

          {/* Quiet Pipeline Context Indicator */}
          <div className="hidden xl:flex items-center gap-3 text-xs text-slate-400 font-mono tabular-nums">
            <span>{videoBook.pages.length} capítulos</span>
            <span aria-hidden="true">·</span>
            <span>Narrador: {selectedAvatar.name}</span>
          </div>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-8">
        {/* =====================================================================
            PRIMARY SIMPLE WORKFLOW: AUDIOLIBROS Y VIDEO-LIBROS IA DESDE PDF
            (HABLADOS CON AVATARES REALES Y ESCENAS DEL TEXTO/TEMA)
           ===================================================================== */}
        {activeModule === 'videobook' && (
          <div className="space-y-8">
            {/* Simple 3-Step PDF to Spoken Audiobook Creator Card */}
            <section className="bg-[#11131A] border border-slate-800/90 rounded-md p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
                    ESTUDIO DE AUDIOLIBROS HABLADOS CON IA · DESDE CUALQUIER PDF
                  </span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-0.5">
                    Crea Audiolibros Completos con Avatares y Escenas desde tu PDF
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Sube un documento PDF, elige tu Avatar Narrador (o sube una foto real) y el estilo de las escenas del tema para escucharlo completo y descargarlo en MP4 o MP3.
                  </p>
                </div>

                {/* Sample PDF Quick Selector */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-400 mr-1">
                    PDFs de muestra:
                  </span>
                  {SAMPLE_PDF_DOCUMENTS.map((doc) => (
                    <button
                      key={doc.filename}
                      type="button"
                      onClick={() => {
                        setTextoPdf(doc.content);
                        setUploadedPdfName(doc.filename);
                      }}
                      className={`text-xs px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                        uploadedPdfName === doc.filename
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                          : 'bg-[#171A24] text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      {doc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Simple Columns: Paso 1 (PDF) | Paso 2 (Avatar y Escenas) | Paso 3 (Crear Audiolibro) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* PASO 1: Subir PDF o Texto */}
                <div className="lg:col-span-5 bg-[#0B0D13] border border-slate-800/90 rounded-md p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                        PASO 1 · SUBE EL PDF DE TU LIBRO O TEMA
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {pdfWordCount} palabras
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 p-3 rounded bg-[#121620] border border-dashed border-amber-500/40">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-100 truncate">
                            {isExtractingPdf
                              ? 'Extrayendo texto del PDF...'
                              : uploadedPdfName || 'Selecciona un archivo PDF'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Extrae automáticamente capítulos e ideas del PDF
                          </div>
                        </div>
                      </div>

                      <label className="px-3.5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0">
                        {isExtractingPdf ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileUp className="w-3.5 h-3.5" />
                        )}
                        <span>Subir PDF</span>
                        <input
                          type="file"
                          accept=".pdf,.txt,.md,application/pdf,text/plain"
                          onChange={handlePdfFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <textarea
                      rows={3}
                      value={textoPdf}
                      onChange={(e) => setTextoPdf(e.target.value)}
                      placeholder="Aquí aparece el contenido extraído de tu PDF (también puedes escribir o pegar cualquier texto para tu audiolibro)..."
                      className="w-full rounded bg-[#11141E] border border-slate-800 p-2.5 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* PASO 2: 30 Avatares Reales IA y Estilo de Escenas del Tema */}
                <div className="lg:col-span-4 bg-[#0B0D13] border border-slate-800/90 rounded-md p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                        PASO 2 · 30 AVATARES REALES IA
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        Gemini 3.1 Live
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          customAvatarUrl ||
                          selectedAvatar.customPhotoUrl ||
                          selectedAvatar.realPhotoUrl
                        }
                        alt={selectedAvatar.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded object-cover border border-amber-500/70 shrink-0 bg-slate-900"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <label className="text-[11px] font-medium text-slate-300 block truncate">
                          Elige entre los 30 Avatares Reales ({selectedAvatar.accent})
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
                          className="w-full rounded bg-[#121620] border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          {NARRATOR_AVATAR_PRESETS.map((av) => (
                            <option key={av.id} value={av.id}>
                              #{String(av.number).padStart(2, '0')} {av.name} ({av.accent.replace('Español ', '')}) — {av.category} · Voz {av.voiceName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300 block">
                        Estilo de las Escenas del Texto y Tema
                      </label>
                      <select
                        value={bookStyle}
                        onChange={(e) => setBookStyle(e.target.value)}
                        className="w-full rounded bg-[#121620] border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        {BOOK_STYLE_PRESETS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span>30 Rostros Reales + Generador IA 3.1</span>
                    <span className="text-amber-400 font-mono">MP4 + MP3</span>
                  </div>
                </div>

                {/* PASO 3: Botones de Creación en 1 Clic */}
                <div className="lg:col-span-3 bg-[#0B0D13] border border-slate-800/90 rounded-md p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                      PASO 3 · GENERAR AUDIOLIBRO
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Convierte tu PDF en un audiolibro estructurado por capítulos o genera todo automáticamente con voz IA y escenas del tema.
                    </p>
                  </div>

                  {videoBookError && (
                    <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                      {videoBookError}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleCreateVideoBookFromPdf(false)}
                      disabled={isGeneratingVideoBook || isGeneratingAllPages}
                      className="w-full py-2.5 px-4 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {isGeneratingVideoBook ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Adaptando PDF a Audiolibro...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4" />
                          <span>Crear Audiolibro desde el PDF</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateVideoBookFromPdf(true)}
                      disabled={
                        isGeneratingVideoBook || isGeneratingAllPages || isGeneratingNarration
                      }
                      className="w-full py-2.5 px-3 rounded bg-[#161B28] hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Crear Completo (Voz IA + Escenas + Avatar)</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Interactive Spoken Audiobook & Video-eBook Stage with Talking Avatar + Topic Scenes */}
            <VideoBookPlayer
              videoBook={videoBook}
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
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-slate-200">
                      Contenido del PDF a adaptar{' '}
                      <span className="font-mono text-amber-400/90">{'{{texto_pdf}}'}</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {pdfWordCount} palabras
                    </span>
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
            MODULE 02: GENERADOR DE GUIONES DE VIDEO DE 2 MINUTOS
           ===================================================================== */}
        {activeModule === 'script' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Prompt Formula & Parameters (5 cols) */}
            <section className="lg:col-span-5 bg-[#111318] border border-white/8 rounded-xl p-6 flex flex-col gap-6">
              <div className="border-b border-white/8 pb-4">
                <p className="text-xs text-amber-400 font-medium mb-1">
                  02. Arquitectura de Guion Audiovisual
                </p>
                <h1 className="font-display text-2xl font-bold text-white">
                  Generador de Guion de 2 Minutos
                </h1>
                <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                  Estructura un guion cronometrado de 120 segundos con dirección de cámara, atmósfera sonora y texto listo para locutar.
                </p>
              </div>

              <form onSubmit={handleGenerateScript} className="flex flex-col gap-5">
                {/* Tema del video */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-300">
                    Tema del video <span className="text-slate-500">[tema del video]</span>
                  </label>
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
                  <label className="text-xs font-medium text-slate-300">
                    Tono del video <span className="text-slate-500">[tono del video]</span>
                  </label>
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
                  <label className="text-xs font-medium text-slate-300">
                    Público objetivo <span className="text-slate-500">[público objetivo]</span>
                  </label>
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
                      Generar Guion de 2 Minutos
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Right Column: Generated 2-Minute Script Breakdown (7 cols) */}
            <section className="lg:col-span-7 flex flex-col gap-6">
              {/* Script Master Header */}
              <div className="bg-[#111318] border border-white/8 rounded-xl p-6 flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums mb-1">
                      <span>DURACIÓN OBJETIVO: {generatedScript.totalDuration}</span>
                      <span aria-hidden="true">·</span>
                      <span>{generatedScript.scenes.length} ESCENAS</span>
                      <span aria-hidden="true">·</span>
                      <span>VOZ SUGERIDA: {generatedScript.recommendedVoiceGender.toUpperCase()}</span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      {generatedScript.title}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                      {generatedScript.logline}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#181B22] hover:bg-[#222631] text-slate-200 hover:text-amber-300 border border-white/10 hover:border-amber-500/40 text-xs font-medium transition-colors cursor-pointer"
                      title="Descargar el guion completo con escaleta técnica en formato PDF (.pdf)"
                    >
                      {exportedFormat === 'pdf' ? (
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
                      onClick={handleExportTxt}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#181B22] hover:bg-[#222631] text-slate-200 hover:text-amber-300 border border-white/10 hover:border-amber-500/40 text-xs font-medium transition-colors cursor-pointer"
                      title="Descargar el guion completo en archivo de texto plano (.txt)"
                    >
                      {exportedFormat === 'txt' ? (
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
                      onClick={handleSendFullScriptToNarration}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      Enviar a Locución IA
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Full Continuous Voiceover Preview */}
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
                  <p className="text-sm text-slate-200 leading-relaxed">
                    “{generatedScript.fullNarration}”
                  </p>
                </div>
              </div>

              {/* Timecoded Scenes List */}
              <div className="flex flex-col gap-4">
                {generatedScript.scenes.map((scene) => (
                  <article
                    key={scene.sceneNumber}
                    className="bg-[#111318] border border-white/8 hover:border-white/15 rounded-xl p-5 transition-colors flex flex-col gap-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/6 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-medium text-amber-400 tabular-nums">
                          ESCENA 0{scene.sceneNumber}
                        </span>
                        <span className="text-slate-600">·</span>
                        <h3 className="text-base font-semibold text-white">{scene.title}</h3>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs text-slate-400 tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{scene.timecode}</span>
                        <span aria-hidden="true">·</span>
                        <span>{scene.durationSec}s</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Visual & Camera Column */}
                      <div className="flex flex-col gap-2">
                        <div className="text-xs font-medium text-slate-400">
                          Dirección Visual y Emoción
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {scene.visualDescription}
                        </p>
                        <div className="text-xs text-slate-400 pt-1">
                          <span className="text-slate-500">Estilo:</span> {scene.visualStyle}
                          <span className="mx-1.5 text-slate-600">·</span>
                          <span className="text-slate-500">Cámara:</span> {scene.cameraDirection}
                        </div>
                      </div>

                      {/* Voiceover & Sound Column */}
                      <div className="bg-[#0A0B0E] border border-white/6 rounded-lg p-3.5 flex flex-col justify-between gap-3">
                        <div>
                          <div className="text-xs font-medium text-amber-400/90 mb-1">
                            Texto de Narración (Voz en Off)
                          </div>
                          <p className="text-sm text-white leading-relaxed italic">
                            “{scene.narrationText}”
                          </p>
                        </div>
                        <div className="text-xs text-slate-400 border-t border-white/6 pt-2">
                          <span className="text-slate-500">Diseño Sonoro:</span> {scene.soundDesign}
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
                        Crear secuencia visual de escena
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
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
                  <div className="font-mono text-xs text-slate-400 tabular-nums">
                    {wordCount} palabras · ~{estimatedSeconds}s estimados
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={narrationScript}
                  onChange={(e) => setNarrationScript(e.target.value)}
                  placeholder="Inserta aquí el guion de video para generar la narración..."
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
                  <label className="text-xs font-medium text-slate-300">
                    Descripción de la escena o emoción{' '}
                    <span className="text-slate-500">[descripción de la escena o emoción]</span>
                  </label>
                  <textarea
                    rows={3}
                    value={sceneEmotionDesc}
                    onChange={(e) => setSceneEmotionDesc(e.target.value)}
                    placeholder="Ej. la sensación de vértigo y libertad al descubrir un océano luminiscente bajo la noche..."
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
                  <label className="text-xs font-medium text-slate-300">
                    Estilo visual deseado{' '}
                    <span className="text-slate-500">[estilo visual deseado]</span>
                  </label>
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
                      SECUENCIA MULTICAPA · {sequencePlan.shots.length} PLANOS ·{' '}
                      {sequencePlan.bpmTempo || 84} BPM
                    </div>
                    <h2 className="font-display text-xl font-bold text-white mt-0.5">
                      {sequencePlan.title}
                    </h2>
                  </div>

                  <div className="text-xs text-slate-400">
                    Atmósfera: <span className="text-amber-300">{sequencePlan.ambientEffect}</span>
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
                      Máster de Video Generado (MP4)
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

              {/* Multi-Shot Storyboard, Keyframe Images & Color LUT Breakdown */}
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
                          <span className="text-amber-400 font-medium">
                            PLANO 0{shot.shotNumber} · {shot.durationSec}s
                          </span>
                          <span className="text-slate-400">{shot.focalLens}</span>
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
