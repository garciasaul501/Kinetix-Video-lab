import { VideoBook, AudiobookVisualMode } from './videoRenderer';
import { SequencePlan } from '../components/CinemaSequenceCanvas';

export interface ScriptSceneData {
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

export interface GeneratedScriptData {
  title: string;
  logline: string;
  totalDuration: string;
  recommendedVoiceGender: string;
  recommendedAccent: string;
  recommendedVoiceTone: string;
  fullNarration: string;
  scenes: ScriptSceneData[];
}

export interface SavedTwoMinuteScript {
  id: string;
  versionNumber: number;
  versionLabel: string;
  createdAt: string;
  updatedAt: string;
  topic: string;
  tone: string;
  targetAudience: string;
  customPrompt?: string;
  isFavorite?: boolean;
  notes?: string;
  script: GeneratedScriptData;
}

export type AudiobookFileFormat = 'MP4' | 'MP3' | 'MP4 + MP3';

export interface SavedAudiobookItem {
  id: string;
  title: string;
  subtitle: string;
  folderName: string;
  format: AudiobookFileFormat;
  createdAt: string;
  durationSec: number;
  chaptersCount: number;
  avatarId: string;
  avatarName: string;
  avatarThumbUrl: string;
  coverImageUrl: string;
  visualMode: AudiobookVisualMode;
  fileSizeLabel: string;
  isFavorite?: boolean;
  videoBook: VideoBook;
  pageImages: Record<number, string>;
  audioBase64?: string | null;
  hasMp4Blob?: boolean;
  hasMp3Blob?: boolean;
}

const SCRIPT_HISTORY_STORAGE_KEY = 'kinetix_2min_script_history_v1';
const AUDIOBOOK_FOLDER_META_KEY = 'kinetix_audiobook_folder_meta_v1';
const AUDIOBOOK_CUSTOM_FOLDERS_KEY = 'kinetix_audiobook_custom_folders_v1';

const IDB_NAME = 'kinetix_audiobook_media_vault_v1';
const IDB_STORE = 'media_blobs';

export const DEFAULT_AUDIOBOOK_FOLDERS = [
  'Negocios & Liderazgo',
  'Ciencia & Tecnología IA',
  'Literatura & Narrativa',
  'Bienestar & Psicología',
  'Historia & Documental',
];

export const SEED_SCRIPT_HISTORY: SavedTwoMinuteScript[] = [
  {
    id: 'script-ver-101',
    versionNumber: 1,
    versionLabel: 'v1.0 · Original IA',
    createdAt: 'Hace 25 min',
    updatedAt: 'Hace 25 min',
    topic: 'El impacto de la inteligencia artificial en la creatividad audiovisual',
    tone: 'cinematográfico e inspirador',
    targetAudience: 'creadores de contenido, cineastas y mentes curiosas',
    isFavorite: true,
    notes: 'Versión principal con 6 escenas equilibradas para formato 16:9.',
    script: {
      title: 'La Sinfonía Algorítmica: El Nuevo Cine de 120 Segundos',
      logline:
        'Un recorrido visual de dos minutos sobre cómo la inteligencia artificial amplifica la visión humana desde el primer boceto hasta la pantalla grande.',
      totalDuration: '02:00 (120 segundos)',
      recommendedVoiceGender: 'femenina',
      recommendedAccent: 'español neutro latinoamericano',
      recommendedVoiceTone: 'cinematográfico, cálido y envolvente',
      fullNarration:
        'Toda gran historia comienza en la oscuridad antes del primer fotograma. Durante un siglo, transformar una idea en cine requería meses de espera y recursos inalcanzables. Hoy, la frontera entre la imaginación y la pantalla se ha disuelto. Los modelos generativos no reemplazan la mirada del director: traducen emociones abstractas en luz, óptica y movimiento en cuestión de segundos. Cuando la sensibilidad humana dirige a la inteligencia artificial, cada creador tiene un estudio completo en sus manos. El futuro del cine no pertenece a las máquinas, sino a quienes se atreven a contar historias inolvidables.',
      scenes: [
        {
          sceneNumber: 1,
          timecode: '00:00 - 00:20',
          durationSec: 20,
          title: 'La Chispa en la Oscuridad',
          visualDescription:
            'Un proyector clásico de 35mm se enciende en una sala oscura; el haz de luz se transforma en partículas holográficas doradas.',
          visualStyle: 'Cinematográfico anamórfico 35mm, claroscuro cálido ámbar y azul noche',
          cameraDirection: 'Dolly-in lento hacia la lente del proyector con enfoque selectivo',
          narrationText:
            'Toda gran historia comienza en la oscuridad antes del primer fotograma. Durante un siglo, transformar una idea en cine requería meses de espera.',
          soundDesign: 'Zumbido analógico de proyector + sub-bass profundo y notas de piano íntimo',
        },
        {
          sceneNumber: 2,
          timecode: '00:20 - 00:45',
          durationSec: 25,
          title: 'Arquitectura de la Imaginación',
          visualDescription:
            'Palabras escritas en un guion flotante se convierten en paisajes urbanos futuristas bajo la lluvia al amanecer.',
          visualStyle: 'Neo-noir atmosférico con iluminación volumétrica y reflejos húmedos',
          cameraDirection: 'Travelling lateral fluido de izquierda a derecha revelando el horizonte',
          narrationText:
            'Hoy, la frontera entre la imaginación y la pantalla se ha disuelto. Las palabras se transforman directamente en atmósfera, profundidad y movimiento.',
          soundDesign: 'Lluvia suave espacializada + pulso electrónico ascendente a 92 BPM',
        },
        {
          sceneNumber: 3,
          timecode: '00:45 - 01:15',
          durationSec: 30,
          title: 'El Director y el Algoritmo',
          visualDescription:
            'Primer plano de los ojos de una directora reflejando múltiples storyboards luminosos que cambian de iluminación en tiempo real.',
          visualStyle: 'Óptica 50mm f/1.2 Noctilux con bokeh orgánico dorado',
          cameraDirection: 'Movimiento orbital de 45 grados alrededor del sujeto',
          narrationText:
            'Los modelos generativos no reemplazan la mirada del director: traducen emociones abstractas en luz, óptica y ritmo en cuestión de segundos.',
          soundDesign: 'Cuerdas cinematográficas en crescendo + destellos acústicos sutiles',
        },
        {
          sceneNumber: 4,
          timecode: '01:15 - 01:40',
          durationSec: 25,
          title: 'Frecuencia Vocal y Emoción',
          visualDescription:
            'Ondas acústicas tridimensionales doradas atraviesan una biblioteca infinita de escenas cinematográficas.',
          visualStyle: 'Estética de laboratorio de sonido e iluminación cálida de estudio',
          cameraDirection: 'Zoom-in progresivo sincronizado con la cadencia de la voz',
          narrationText:
            'Cuando la sensibilidad humana dirige a la inteligencia artificial, cada creador tiene un estudio completo de producción en sus manos.',
          soundDesign: 'Resonancia armónica + percusión cinematográfica profunda',
        },
        {
          sceneNumber: 5,
          timecode: '01:40 - 02:00',
          durationSec: 20,
          title: 'El Horizonte Abierto',
          visualDescription:
            'Una figura contempla un amanecer monumental sobre una metrópolis luminosa mientras la cámara se eleva hacia el cielo.',
          visualStyle: 'Gran formato IMAX 65mm, colores dorados y contraste épico',
          cameraDirection: 'Grúa ascendente (crane up) y zoom-out revelando la escala total',
          narrationText:
            'El futuro del cine no pertenece a las máquinas, sino a quienes se atreven a contar historias inolvidables.',
          soundDesign: 'Acorde orquestal final con reverberación larga y corte limpio',
        },
      ],
    },
  },
  {
    id: 'script-ver-102',
    versionNumber: 2,
    versionLabel: 'v2.0 · Neurociencia & Enfoque',
    createdAt: 'Hace 14 min',
    updatedAt: 'Hace 14 min',
    topic: 'El arte de mantener el enfoque profundo en la era de la distracción digital',
    tone: 'documental riguroso y envolvente',
    targetAudience: 'emprendedores tecnológicos y profesionales curiosos',
    isFavorite: false,
    notes: 'Ideal para generar clips dinámicos con cortes cada 4 segundos.',
    script: {
      title: 'Arquitectura del Enfoque Profundo: Recupera tu Mente en 120 Segundos',
      logline:
        'Un ensayo documental sobre cómo entrenar la atención sostenida frente al ruido de las notificaciones infinitas.',
      totalDuration: '02:00 (120 segundos)',
      recommendedVoiceGender: 'masculina',
      recommendedAccent: 'español de España (peninsular)',
      recommendedVoiceTone: 'documental, sereno y persuasivo',
      fullNarration:
        'Cada interrupción digital de apenas tres segundos le cuesta a tu cerebro veintitrés minutos para recuperar su estado de concentración profunda. Vivimos rodeados de algoritmos diseñados para fragmentar nuestra atención. Sin embargo, la neurociencia demuestra que el enfoque profundo funciona como un músculo biológico: cuando reservas noventa minutos diarios sin pantallas secundarias ni alertas, las redes neuronales de creatividad se sincronizan al máximo nivel. Proteger tu atención es proteger tu activo más valioso.',
      scenes: [
        {
          sceneNumber: 1,
          timecode: '00:00 - 00:30',
          durationSec: 30,
          title: 'El Costo Oculto de una Notificación',
          visualDescription:
            'En un estudio silencioso, una pantalla se ilumina en cámara lenta fragmentando el reflejo del protagonista.',
          visualStyle: 'Documental Fincher, tonos azul acero y ámbar tenue, lente 35mm',
          cameraDirection: 'Dolly-in tenso hacia el rostro iluminado por el monitor',
          narrationText:
            'Cada interrupción digital de apenas tres segundos le cuesta a tu cerebro veintitrés minutos para recuperar su estado de concentración profunda.',
          soundDesign: 'Pulso de reloj minimalista + impacto grave amortiguado',
        },
        {
          sceneNumber: 2,
          timecode: '00:30 - 01:00',
          durationSec: 30,
          title: 'Redes Neuronales en Sincronía',
          visualDescription:
            'Visualización macro de sinapsis cerebrales encendiéndose en color oro cálido cuando desaparece el ruido visual.',
          visualStyle: 'Macro fotografía científica 8K con profundidad de campo extrema',
          cameraDirection: 'Paneo suave siguiendo el haz sináptico principal',
          narrationText:
            'La neurociencia demuestra que el enfoque profundo funciona como un músculo biológico capaz de reconstruir tu claridad mental.',
          soundDesign: 'Textura ambiental binaural cálida a 76 BPM',
        },
        {
          sceneNumber: 3,
          timecode: '01:00 - 01:30',
          durationSec: 30,
          title: 'El Ritual de los 90 Minutos',
          visualDescription:
            'Un reloj de arena dorado sobre un escritorio minimalista de madera oscura iluminado por el sol de la mañana.',
          visualStyle: 'Editorial cálido, luz natural lateral volumétrica',
          cameraDirection: 'Movimiento orbital lento alrededor del escritorio',
          narrationText:
            'Cuando reservas noventa minutos diarios sin alertas ni pantallas secundarias, tu capacidad de resolución se multiplica por tres.',
          soundDesign: 'Acordes de violonchelo cálido + brisa matutina sutil',
        },
        {
          sceneNumber: 4,
          timecode: '01:30 - 02:00',
          durationSec: 30,
          title: 'Claridad Soberana',
          visualDescription:
            'Plano abierto de un creador observando la ciudad en calma desde un mirador al amanecer.',
          visualStyle: 'Anamórfico 50mm, horizonte limpio y dorado',
          cameraDirection: 'Zoom-out sereno hacia el horizonte despejado',
          narrationText:
            'En la economía de la distracción, proteger tu atención es proteger tu activo más valioso.',
          soundDesign: 'Nota final de piano resonante y silencio limpio',
        },
      ],
    },
  },
  {
    id: 'script-ver-103',
    versionNumber: 3,
    versionLabel: 'v3.0 · Ciudades del Futuro',
    createdAt: 'Hace 5 min',
    updatedAt: 'Hace 5 min',
    topic: 'La historia oculta detrás del diseño de las ciudades del futuro y la energía limpia',
    tone: 'dinámico, moderno y persuasivo',
    targetAudience: 'público general apasionado por la ciencia y el futuro',
    isFavorite: false,
    notes: 'Versión orientada a secuencias futuristas y arquitectura solar.',
    script: {
      title: 'Metrópolis Solares: El Diseño de las Ciudades del Mañana',
      logline:
        'Cómo la arquitectura bioclimática y las baterías de estado sólido están transformando los rascacielos en ecosistemas vivos.',
      totalDuration: '02:00 (120 segundos)',
      recommendedVoiceGender: 'femenina',
      recommendedAccent: 'español mexicano',
      recommendedVoiceTone: 'dinámico, claro y visionario',
      fullNarration:
        'Las ciudades del siglo veinte fueron diseñadas para el hormigón y el humo; las metrópolis de la próxima década están diseñadas como bosques verticales que generan su propia energía. Gracias a cristales fotovoltaicos transparentes y baterías de estado sólido integradas en la estructura de cada edificio, los nuevos distritos urbanos capturan el sol y purifican el aire mientras dormimos. Estamos presenciando la mayor reinvención arquitectónica de nuestra historia.',
      scenes: [
        {
          sceneNumber: 1,
          timecode: '00:00 - 00:40',
          durationSec: 40,
          title: 'Del Hormigón al Bosque Vertical',
          visualDescription:
            'Transición hiperrealista de una avenida gris hacia torres cubiertas de jardines colgantes y fachadas solares doradas.',
          visualStyle: 'Arquitectura futurista solar-punk cinematográfica 8K',
          cameraDirection: 'Dolly-in aéreo atravesando los puentes verdes entre edificios',
          narrationText:
            'Las ciudades del siglo veinte fueron diseñadas para el hormigón; las metrópolis de la próxima década funcionan como bosques verticales vivos.',
          soundDesign: 'Whoosh de transición aérea + sintetizador cristalino',
        },
        {
          sceneNumber: 2,
          timecode: '00:40 - 01:20',
          durationSec: 40,
          title: 'Cristales que Capturan el Sol',
          visualDescription:
            'Detalle cercano de ventanales translúcidos absorbiendo rayos de sol al atardecer y enviando pulsos de energía limpia.',
          visualStyle: 'Iluminación dorada de hora mágica, lente 35mm Prime',
          cameraDirection: 'Paneo ascendente siguiendo la energía en la fachada',
          narrationText:
            'Con cristales fotovoltaicos transparentes y baterías de estado sólido, cada edificio almacena energía limpia para toda la comunidad.',
          soundDesign: 'Pulso armónico cálido + ambiente urbano sereno',
        },
        {
          sceneNumber: 3,
          timecode: '01:20 - 02:00',
          durationSec: 40,
          title: 'El Nuevo Horizonte Urbano',
          visualDescription:
            'Vista panorámica nocturna de una ciudad iluminada con energía limpia reflejada sobre un río cristalino.',
          visualStyle: 'Gran angular anamórfico 24mm, reflejos ámbar y esmeralda',
          cameraDirection: 'Zoom-out épico sobre la bahía iluminada',
          narrationText:
            'Estamos presenciando la mayor reinvención arquitectónica de la historia humana: ciudades que respiran con el planeta.',
          soundDesign: 'Crescendo orquestal inspirador',
        },
      ],
    },
  },
];

export function loadScriptHistoryFromStorage(): SavedTwoMinuteScript[] {
  if (typeof window === 'undefined') return SEED_SCRIPT_HISTORY;
  try {
    const raw = window.localStorage.getItem(SCRIPT_HISTORY_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        SCRIPT_HISTORY_STORAGE_KEY,
        JSON.stringify(SEED_SCRIPT_HISTORY)
      );
      return SEED_SCRIPT_HISTORY;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEED_SCRIPT_HISTORY;
  } catch (_e) {
    return SEED_SCRIPT_HISTORY;
  }
}

export function saveScriptHistoryToStorage(items: SavedTwoMinuteScript[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SCRIPT_HISTORY_STORAGE_KEY, JSON.stringify(items));
  } catch (_e) {
    // Ignore storage quota warnings
  }
}

/**
 * Converts any 2-minute script version (or edited version) into a ready-to-render
 * SequencePlan for the Clips & MP4/MP3 studio.
 */
export function convertScriptVersionToSequencePlan(
  script: GeneratedScriptData,
  topicOrStyle?: string
): SequencePlan {
  const paletteCycle = [
    {
      primary: '#090D16',
      secondary: '#162035',
      accent: '#F59E0B',
      motif: 'cityscape',
      motion: 'dolly-in',
      lens: '24mm f/1.4 Anamorphic',
    },
    {
      primary: '#0B1320',
      secondary: '#1D2D44',
      accent: '#38BDF8',
      motif: 'waves',
      motion: 'pan-right',
      lens: '35mm T1.5 Prime',
    },
    {
      primary: '#120E1A',
      secondary: '#251D3A',
      accent: '#F59E0B',
      motif: 'portal',
      motion: 'orbital',
      lens: '50mm f/1.2 Noctilux',
    },
    {
      primary: '#0A0F1D',
      secondary: '#1E293B',
      accent: '#10B981',
      motif: 'horizon',
      motion: 'zoom-out',
      lens: '85mm Anamorphic',
    },
  ];

  const mappedShots = (script.scenes || []).map((scene, idx) => {
    const styleRef = paletteCycle[idx % paletteCycle.length];
    const camLower = (scene.cameraDirection || '').toLowerCase();
    let motion = styleRef.motion;
    if (camLower.includes('pan') || camLower.includes('travelling')) motion = 'pan-right';
    else if (camLower.includes('orbit')) motion = 'orbital';
    else if (camLower.includes('zoom-out') || camLower.includes('grúa')) motion = 'zoom-out';
    else if (camLower.includes('dolly') || camLower.includes('zoom-in')) motion = 'dolly-in';

    return {
      shotNumber: scene.sceneNumber || idx + 1,
      durationSec: Math.min(8, Math.max(3, Math.round((scene.durationSec || 20) / 4))),
      shotType: `Escena 0${scene.sceneNumber} (${scene.timecode})`,
      cameraMotion: motion,
      visualMotif: styleRef.motif,
      headlineText: (scene.title || `ESCENA 0${scene.sceneNumber}`).toUpperCase(),
      actionDescription: `${scene.visualDescription} (${scene.cameraDirection})`,
      primaryHex: styleRef.primary,
      secondaryHex: styleRef.secondary,
      accentHex: styleRef.accent,
      focalLens: styleRef.lens,
    };
  });

  return {
    title: script.title || 'Secuencia desde Guion de 2 Minutos',
    emotionSummary: script.logline || topicOrStyle || 'Narrativa audiovisual de 2 minutos',
    visualStyleApplied:
      script.scenes?.[0]?.visualStyle || 'Cinematográfico Anamórfico 35mm',
    veoEnhancedPrompt: `${script.title}. ${
      script.scenes?.[0]?.visualDescription || ''
    }, cinematic lighting, 35mm anamorphic lens, 8k film grain`,
    suggestedVoiceover: script.fullNarration,
    ambientEffect: 'particles',
    bpmTempo: 92,
    shots: mappedShots,
  };
}

// ============================================================================
// INDEXEDDB BINARY VAULT FOR SAVING MP3 & MP4 AUDIOBOOK FILES IN FOLDERS
// ============================================================================

function openMediaVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB no disponible'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('No se pudo abrir IndexedDB'));
  });
}

export async function saveMediaBlobToIdb(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openMediaVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (_err) {
    // Ignore IDB errors in restricted environments
  }
}

export async function getMediaBlobFromIdb(key: string): Promise<Blob | null> {
  try {
    const db = await openMediaVaultDb();
    const result = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const getReq = tx.objectStore(IDB_STORE).get(key);
      getReq.onsuccess = () => resolve((getReq.result as Blob) || null);
      getReq.onerror = () => reject(getReq.error);
    });
    db.close();
    return result;
  } catch (_err) {
    return null;
  }
}

export async function deleteMediaBlobsFromIdb(itemId: string): Promise<void> {
  try {
    const db = await openMediaVaultDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.delete(`${itemId}:mp4`);
      store.delete(`${itemId}:mp3`);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch (_err) {
    // Ignore
  }
}

export function loadCustomFoldersFromStorage(): string[] {
  if (typeof window === 'undefined') return DEFAULT_AUDIOBOOK_FOLDERS;
  try {
    const raw = window.localStorage.getItem(AUDIOBOOK_CUSTOM_FOLDERS_KEY);
    if (!raw) {
      window.localStorage.setItem(
        AUDIOBOOK_CUSTOM_FOLDERS_KEY,
        JSON.stringify(DEFAULT_AUDIOBOOK_FOLDERS)
      );
      return DEFAULT_AUDIOBOOK_FOLDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_AUDIOBOOK_FOLDERS;
  } catch (_e) {
    return DEFAULT_AUDIOBOOK_FOLDERS;
  }
}

export function saveCustomFoldersToStorage(folders: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUDIOBOOK_CUSTOM_FOLDERS_KEY, JSON.stringify(folders));
  } catch (_e) {
    // Ignore
  }
}

export function loadSavedAudiobooksMeta(
  defaultBook: VideoBook,
  defaultImages: Record<number, string>,
  defaultAvatar: { id: string; name: string; realPhotoUrl: string }
): SavedAudiobookItem[] {
  const seedItems: SavedAudiobookItem[] = [
    {
      id: 'ab-vault-01',
      title: defaultBook.bookTitle,
      subtitle: defaultBook.subtitle,
      folderName: 'Ciencia & Tecnología IA',
      format: 'MP4 + MP3',
      createdAt: 'Guardado hoy · 10:15',
      durationSec: defaultBook.totalEstimatedSec || 40,
      chaptersCount: defaultBook.pages.length,
      avatarId: defaultAvatar.id,
      avatarName: defaultAvatar.name,
      avatarThumbUrl: defaultAvatar.realPhotoUrl,
      coverImageUrl:
        defaultImages[0] ||
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=85',
      visualMode: 'avatar-and-scenes',
      fileSizeLabel: '14.8 MB (MP4) · 1.9 MB (MP3)',
      isFavorite: true,
      videoBook: defaultBook,
      pageImages: defaultImages,
      hasMp4Blob: false,
      hasMp3Blob: false,
    },
    {
      id: 'ab-vault-02',
      title: 'Neurociencia de la Atención y el Enfoque Profundo',
      subtitle: 'Audiolibro Completo desde PDF · 4 Capítulos Hablados',
      folderName: 'Bienestar & Psicología',
      format: 'MP3',
      createdAt: 'Guardado hoy · 09:40',
      durationSec: 36,
      chaptersCount: 4,
      avatarId: 'avatar-mateo',
      avatarName: 'Dr. Mateo Salazar',
      avatarThumbUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=85',
      coverImageUrl:
        'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1280&q=85',
      visualMode: 'avatar-and-scenes',
      fileSizeLabel: '2.4 MB (MP3 24kHz)',
      isFavorite: false,
      videoBook: {
        bookTitle: 'Neurociencia de la Atención y el Enfoque Profundo',
        subtitle: 'Audiolibro Completo desde PDF · 4 Capítulos Hablados',
        authorOrSource: 'estudio-neurociencia-atencion-retencion.pdf',
        bookStyle: 'Ilustración Editorial Cinematográfica',
        totalEstimatedSec: 36,
        fullNarration:
          'Capítulo 1: La Ventana de los Cinco Segundos. El cerebro humano procesa estímulos visuales en trece milisegundos, pero decide en apenas cuatro segundos si una historia merece su atención profunda. Capítulo 2: El Costo de la Fragmentación. Cuando alternamos entre notificaciones sin pausa, la memoria de trabajo pierde hasta el setenta por ciento de su eficacia creativa. Capítulo 3: El Estado de Flujo Neuronal. Reservar bloques de lectura y escucha consciente sincroniza la corteza prefrontal y despierta la imaginación a largo plazo. Capítulo 4: El Poder de la Voz y la Imagen. Combinar narración hablada con escenas visuales multiplica la comprensión y transforma el aprendizaje diario.',
        pages: [
          {
            pageNumber: 1,
            chapterTitle: 'La Ventana de los Cinco Segundos',
            pageText:
              'El cerebro humano procesa estímulos visuales en trece milisegundos, pero decide en apenas cuatro segundos si una historia merece su atención profunda.',
            keyQuote: 'En cuatro segundos se abre la puerta de la curiosidad humana.',
            imagePrompt: 'Cinematic neural network glowing in warm gold and deep blue, 8k',
            durationSec: 9,
            primaryHex: '#0D1322',
            secondaryHex: '#1B2845',
            accentHex: '#38BDF8',
          },
          {
            pageNumber: 2,
            chapterTitle: 'El Costo de la Fragmentación',
            pageText:
              'Cuando alternamos entre notificaciones sin pausa, la memoria de trabajo pierde hasta el setenta por ciento de su eficacia creativa.',
            keyQuote: 'El silencio intencional es el verdadero lujo de la mente moderna.',
            imagePrompt: 'Minimalist calm studio desk with golden hourglass at sunrise, 8k',
            durationSec: 9,
            primaryHex: '#111827',
            secondaryHex: '#1E293B',
            accentHex: '#F59E0B',
          },
          {
            pageNumber: 3,
            chapterTitle: 'El Estado de Flujo Neuronal',
            pageText:
              'Reservar bloques de lectura y escucha consciente sincroniza la corteza prefrontal y despierta la imaginación a largo plazo.',
            keyQuote: 'La atención sostenida convierte información dispersa en sabiduría.',
            imagePrompt: 'Bioluminescent brain pathways in deep slate studio, 8k',
            durationSec: 9,
            primaryHex: '#0C1A1E',
            secondaryHex: '#163840',
            accentHex: '#10B981',
          },
          {
            pageNumber: 4,
            chapterTitle: 'El Poder de la Voz y la Imagen',
            pageText:
              'Combinar narración hablada con escenas visuales multiplica la comprensión y transforma el aprendizaje diario.',
            keyQuote: 'Escuchar y contemplar en armonía graba cada idea en la memoria.',
            imagePrompt: 'Open illuminated book with golden soundwaves in dark library, 8k',
            durationSec: 9,
            primaryHex: '#161124',
            secondaryHex: '#2D1E4A',
            accentHex: '#FBBF24',
          },
        ],
      },
      pageImages: {
        0: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1280&q=85',
        1: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1280&q=85',
        2: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1280&q=85',
        3: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1280&q=85',
      },
      hasMp4Blob: false,
      hasMp3Blob: false,
    },
  ];

  if (typeof window === 'undefined') return seedItems;
  try {
    const raw = window.localStorage.getItem(AUDIOBOOK_FOLDER_META_KEY);
    if (!raw) {
      window.localStorage.setItem(AUDIOBOOK_FOLDER_META_KEY, JSON.stringify(seedItems));
      return seedItems;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return seedItems;
  } catch (_e) {
    return seedItems;
  }
}

export function saveAudiobooksMetaToStorage(items: SavedAudiobookItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUDIOBOOK_FOLDER_META_KEY, JSON.stringify(items));
  } catch (_e) {
    // Ignore storage quota warnings
  }
}
