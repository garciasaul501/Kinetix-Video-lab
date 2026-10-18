export type SceneNicheCategory =
  | 'Negocios & Finanzas'
  | 'IA, Tecnología & Futuro'
  | 'Ciencia, Neurociencia & Cosmos'
  | 'Historia & Civilizaciones'
  | 'Psicología, Mindfulness & Calma'
  | 'Literatura, Thriller & Ficción'
  | 'Naturaleza, Océanos & Planeta'
  | 'Salud, Longevidad & Deporte'
  | 'Marketing, Creadores & Media'
  | 'Filosofía, Estoicismo & Arte'
  | 'Viajes, Ciudades & Arquitectura'
  | 'Educación, Hábitos & Estudio';

export interface NicheScenePhoto {
  id: string;
  number: number;
  niche: SceneNicheCategory;
  subNiche: string;
  title: string;
  cinematicAngle: string;
  keywords: string[];
  imageUrl: string;
  fallbackUrl: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  aiScenePrompt: string;
}

export const SCENE_NICHE_CATEGORIES: SceneNicheCategory[] = [
  'Negocios & Finanzas',
  'IA, Tecnología & Futuro',
  'Ciencia, Neurociencia & Cosmos',
  'Historia & Civilizaciones',
  'Psicología, Mindfulness & Calma',
  'Literatura, Thriller & Ficción',
  'Naturaleza, Océanos & Planeta',
  'Salud, Longevidad & Deporte',
  'Marketing, Creadores & Media',
  'Filosofía, Estoicismo & Arte',
  'Viajes, Ciudades & Arquitectura',
  'Educación, Hábitos & Estudio',
];

interface NicheBlueprint {
  niche: SceneNicheCategory;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  keywordsBase: string[];
  unsplashPool: string[];
  subNiches: string[];
  settings: string[];
}

const CINEMATIC_LIGHTING_MODES = [
  { label: 'Luz Ámbar Cinematográfica 35mm', en: 'warm amber volumetric 35mm anamorphic lighting' },
  { label: 'Hora Dorada al Amanecer', en: 'golden hour sunrise rays and atmospheric mist' },
  { label: 'Estudio Oscuro de Alto Contraste', en: 'high-contrast chiaroscuro dark cinema lighting' },
  { label: 'Neón Cian y Azul Profundo', en: 'deep slate blue and cyan rim lighting' },
  { label: 'Luz Natural Editorial 85mm', en: 'soft editorial natural window light 85mm f/1.4' },
];

const NICHE_BLUEPRINTS: NicheBlueprint[] = [
  {
    niche: 'Negocios & Finanzas',
    primaryHex: '#0B1325',
    secondaryHex: '#1D2D4E',
    accentHex: '#F59E0B',
    keywordsBase: ['negocios', 'finanzas', 'empresa', 'dinero', 'inversion', 'liderazgo', 'economia', 'mercado', 'capital', 'estrategia'],
    unsplashPool: [
      'photo-1486406146926-c627a92ad1ab',
      'photo-1454165804606-c3d57bc86b40',
      'photo-1507679799987-c73779587ccf',
      'photo-1551288049-bebda4e38f71',
      'photo-1460925895917-afdab827c52f',
      'photo-1526304640581-d334cdbbf45e',
      'photo-1556761175-5973dc0f32e7',
      'photo-1579532537598-459ecdaf39cc',
      'photo-1542744173-8e7e53415bb0',
      'photo-1611974789855-9c2a0a7236a3',
    ],
    subNiches: [
      'Mercados Bursátiles & Trading',
      'Liderazgo Ejecutivo & CEO',
      'Startups & Capital de Riesgo',
      'Estrategia Corporativa Global',
      'Libertad Financiera & Activos',
    ],
    settings: [
      'Sala de juntas panorámica en rascacielos financiero',
      'Pantallas de análisis bursátil y flujo de capital global',
      'Mesa ejecutiva minimalista con arquitectura de cristal',
      'Distrito financiero metropolitano iluminado al anochecer',
    ],
  },
  {
    niche: 'IA, Tecnología & Futuro',
    primaryHex: '#081226',
    secondaryHex: '#132A4A',
    accentHex: '#38BDF8',
    keywordsBase: ['ia', 'inteligencia artificial', 'tecnologia', 'futuro', 'robotica', 'algoritmo', 'datos', 'software', 'digital', 'automatizacion'],
    unsplashPool: [
      'photo-1518770660439-4636190af475',
      'photo-1620712943543-bcc4688e7485',
      'photo-1550751827-4bd374c3f58b',
      'photo-1526374965328-7f61d4dc18c5',
      'photo-1485827404703-89b55fcc595e',
      'photo-1558494949-ef010cbdcc31',
      'photo-1531297484001-80022131f5a1',
      'photo-1635070041078-e363dbe005cb',
      'photo-1504384308090-c894fdcc538d',
      'photo-1581091226825-a6a2a5aee158',
    ],
    subNiches: [
      'Redes Neuronales & Deep Learning',
      'Robótica Humanoide Avanzada',
      'Computación Cuántica & Chips',
      'Ciberseguridad & Criptografía',
      'Ciudades Inteligentes del Futuro',
    ],
    settings: [
      'Centro de supercomputación con haces de fibra óptica',
      'Laboratorio de robótica avanzada e interfaz holográfica',
      'Arquitectura de circuitos cuánticos y nodos luminosos',
      'Centro de control de inteligencia artificial generativa',
    ],
  },
  {
    niche: 'Ciencia, Neurociencia & Cosmos',
    primaryHex: '#0A1024',
    secondaryHex: '#1E1B4B',
    accentHex: '#06B6D4',
    keywordsBase: ['ciencia', 'neurociencia', 'cerebro', 'memoria', 'cosmos', 'universo', 'espacio', 'fisica', 'biologia', 'neuronas'],
    unsplashPool: [
      'photo-1451187580459-43490279c0fa',
      'photo-1462331940025-496dfbfc7564',
      'photo-1532187863486-abf9dbad1b69',
      'photo-1507413245164-6160d8298b31',
      'photo-1446776811953-b23d57bd21aa',
      'photo-1576086213369-97a306d36557',
      'photo-1582719471384-894fbb16e074',
      'photo-1614728894747-a83421e2b9c9',
      'photo-1516339901601-2e1b62dc0c45',
      'photo-1530026405186-ed1f139313f8',
    ],
    subNiches: [
      'Neurociencia & Sinapsis Cerebral',
      'Astrofísica & Nebulosas Profundas',
      'Genética Molecular & ADN',
      'Exploración Espacial & Planetas',
      'Física de Partículas & Energía',
    ],
    settings: [
      'Red de sinapsis neuronales bioluminiscentes en alta resolución',
      'Observatorio astronómico bajo nebulosa estelar profunda',
      'Laboratorio de investigación biomédica y microscopía óptica',
      'Órbita planetaria con horizonte luminoso desde el espacio',
    ],
  },
  {
    niche: 'Historia & Civilizaciones',
    primaryHex: '#1C140D',
    secondaryHex: '#3B2818',
    accentHex: '#D97706',
    keywordsBase: ['historia', 'antiguo', 'civilizacion', 'imperio', 'cultura', 'siglo', 'pasado', 'arqueologia', 'epoca', 'cronicas'],
    unsplashPool: [
      'photo-1461360370896-922624d12aa1',
      'photo-1507842229356-51c61504d3ab',
      'photo-1513635269975-59663e0ac1ad',
      'photo-1548013146-72479768bada',
      'photo-1552832230-c0197dd311b5',
      'photo-1524995997946-a1c2e315a42f',
      'photo-1518709268805-4e9042af9f23',
      'photo-1564507592333-c60657eea523',
      'photo-1533929736458-ca588d08c8be',
      'photo-1577985051167-0d49eec21977',
    ],
    subNiches: [
      'Bibliotecas Históricas & Manuscritos',
      'Imperios Clásicos: Roma & Grecia',
      'Arqueología & Templos Milenarios',
      'Cartografía & Grandes Navegantes',
      'Revolución Industrial & Crónicas',
    ],
    settings: [
      'Gran biblioteca clásica con códices antiguos y rayos de sol',
      'Columnata monumental de arquitectura clásica al atardecer',
      'Mesa de cartógrafo con mapas históricos, brújula y astrolabio',
      'Archivo histórico de pergaminos bajo iluminación cálida',
    ],
  },
  {
    niche: 'Psicología, Mindfulness & Calma',
    primaryHex: '#0B1D1D',
    secondaryHex: '#163836',
    accentHex: '#10B981',
    keywordsBase: ['psicologia', 'mente', 'calma', 'emociones', 'paz', 'meditacion', 'ansiedad', 'autoconocimiento', 'bienestar', 'conciencia'],
    unsplashPool: [
      'photo-1506126613408-eca07ce68773',
      'photo-1499209974431-9dddcece7f88',
      'photo-1518241353330-0f7941c2d9b5',
      'photo-1447752875215-b2761acb3c5d',
      'photo-1507525428034-b723cf961d3e',
      'photo-1519834785169-98be25ec3f84',
      'photo-1470071459604-3b5ec3a7fe05',
      'photo-1508672019048-805c876b67e2',
      'photo-1528715471579-d1bcf0ba5e83',
      'photo-1469474968028-56623f02e42e',
    ],
    subNiches: [
      'Mindfulness & Atención Plena',
      'Inteligencia Emocional & Empatía',
      'Psicología Cognitiva & Hábitos',
      'Paz Interior & Silencio Mental',
      'Superación & Resiliencia Humana',
    ],
    settings: [
      'Lago cristalino en calma al amanecer rodeado de niebla suave',
      'Jardín zen minimalista con luz cálida y reflejos serenos',
      'Sendero luminoso entre árboles centenarios en paz absoluta',
      'Horizonte oceánico sereno bajo cielo dorado de meditación',
    ],
  },
  {
    niche: 'Literatura, Thriller & Ficción',
    primaryHex: '#141122',
    secondaryHex: '#281E3E',
    accentHex: '#F43F5E',
    keywordsBase: ['novela', 'ficcion', 'misterio', 'thriller', 'cuento', 'literatura', 'drama', 'aventura', 'fantasia', 'relato'],
    unsplashPool: [
      'photo-1519681393784-d120267933ba',
      'photo-1478760329108-5c3ed9d495a0',
      'photo-1509198397868-475647b2a1e5',
      'photo-1518709268805-4e9042af9f23',
      'photo-1457369804613-52c61a468e7d',
      'photo-1516979187457-637abb4f9353',
      'photo-1505664194779-8beaceb93744',
      'photo-1514539079130-25950c84af65',
      'photo-1534447677768-be436bb09401',
      'photo-1481627834876-b7833e8f5570',
    ],
    subNiches: [
      'Noir, Detectives & Suspenso',
      'Fantasía Épica & Mundos Mágicos',
      'Drama Literario & Época',
      'Ciencia Ficción & Distopía',
      'Realismo Mágico & Leyendas',
    ],
    settings: [
      'Callejón empedrado bajo lluvia nocturna con farolas ámbar',
      'Estudio literario con máquina de escribir clásica y libros',
      'Faro solitario frente al mar embravecido al anochecer',
      'Expreso nocturno atravesando montañas cubiertas de niebla',
    ],
  },
  {
    niche: 'Naturaleza, Océanos & Planeta',
    primaryHex: '#071C18',
    secondaryHex: '#113A32',
    accentHex: '#34D399',
    keywordsBase: ['naturaleza', 'oceano', 'bosque', 'planeta', 'ecologia', 'clima', 'montana', 'agua', 'biodiversidad', 'tierra'],
    unsplashPool: [
      'photo-1441974231531-c6227db76b6e',
      'photo-1472214103451-9374bd1c798e',
      'photo-1501854140801-50d01698950b',
      'photo-1464822759023-fed622ff2c3b',
      'photo-1518837695005-2083093ee35b',
      'photo-1505118380757-91f5f5632de0',
      'photo-1439066615861-d1af74d74000',
      'photo-1426604966848-d7adac402bff',
      'photo-1493246507139-91e8fad9978e',
      'photo-1506744038136-46273834b3fb',
    ],
    subNiches: [
      'Selvas Tropicales & Biodiversidad',
      'Océanos Profundos & Vida Marina',
      'Alta Montaña & Glaciares',
      'Auroras Boreales & Cielos',
      'Desiertos, Cañones & Geología',
    ],
    settings: [
      'Valle alpino monumental con rayos solares entre las cumbres',
      'Profundidades oceánicas con luz solar filtrándose en el agua',
      'Bosque milenario cubierto de musgo y neblina matinal',
      'Aurora boreal esmeralda sobre fiordo ártico cristalino',
    ],
  },
  {
    niche: 'Salud, Longevidad & Deporte',
    primaryHex: '#0C1A24',
    secondaryHex: '#1A3648',
    accentHex: '#38BDF8',
    keywordsBase: ['salud', 'nutricion', 'deporte', 'longevidad', 'energia', 'cuerpo', 'ejercicio', 'medicina', 'sueno', 'vitalidad'],
    unsplashPool: [
      'photo-1505576399279-565b52d4ac71',
      'photo-1490645935967-10de6ba17061',
      'photo-1517838277536-f5f99be501cd',
      'photo-1476480862126-209bfaa8edc8',
      'photo-1544367567-0f2fcb009e0b',
      'photo-1532938911079-1b06ac7ceec7',
      'photo-1512621776951-a57141f2eefd',
      'photo-1571019613454-1cb2f99b2d8b',
      'photo-1506126613408-eca07ce68773',
      'photo-1559757175-5700dde675bc',
    ],
    subNiches: [
      'Longevidad Celular & Biohacking',
      'Nutrición Funcional & Metabolismo',
      'Alto Rendimiento Deportivo',
      'Ciencia del Sueño & Recuperación',
      'Medicina Preventiva & Vitalidad',
    ],
    settings: [
      'Atleta corriendo al amanecer frente a horizonte montañoso',
      'Composición editorial de nutrición orgánica y longevidad',
      'Centro moderno de medicina deportiva y fisiología avanzada',
      'Entrenamiento de resistencia bajo luz dorada de mañana',
    ],
  },
  {
    niche: 'Marketing, Creadores & Media',
    primaryHex: '#1A1026',
    secondaryHex: '#341F4E',
    accentHex: '#A855F7',
    keywordsBase: ['marketing', 'contenido', 'redes', 'marca', 'audiencia', 'ventas', 'comunicacion', 'creadores', 'video', 'podcast'],
    unsplashPool: [
      'photo-1590602847861-f357a9332bbc',
      'photo-1478737270239-2f02b77fc618',
      'photo-1533750516457-a7f992034fec',
      'photo-1557804506-669a67965ba0',
      'photo-1522542550221-31fd19575a2d',
      'photo-1492691527719-9d1e07e534b4',
      'photo-1516321318423-f06f85e504b3',
      'photo-1574717024653-61fd2cf4d44d',
      'photo-1552664730-d307ca884978',
      'photo-1611162617474-5b21e879e113',
    ],
    subNiches: [
      'Estudios de Podcast & Locución',
      'Producción Cinematográfica & Video',
      'Branding, Storytelling & Copywriting',
      'E-Commerce & Crecimiento Digital',
      'Comunidades & Economía de Creadores',
    ],
    settings: [
      'Estudio de grabación profesional con micrófono de condensador',
      'Set de rodaje cinematográfico con cámaras y luces clave',
      'Suite de edición audiovisual y colorimetría de cine',
      'Mesa creativa de estrategia de marca y narrativa visual',
    ],
  },
  {
    niche: 'Filosofía, Estoicismo & Arte',
    primaryHex: '#181512',
    secondaryHex: '#2E2822',
    accentHex: '#FBBF24',
    keywordsBase: ['filosofia', 'estoicismo', 'sabiduria', 'etica', 'arte', 'virtud', 'tiempo', 'existencia', 'pensamiento', 'reflexion'],
    unsplashPool: [
      'photo-1544716278-ca5e3f4abd8c',
      'photo-1513519245088-0e12902e5a38',
      'photo-1579783902614-a3fb3927b675',
      'photo-1457369804613-52c61a468e7d',
      'photo-1507679799987-c73779587ccf',
      'photo-1519682337058-a94d519337bc',
      'photo-1491841550275-ad7854e35ca6',
      'photo-1509021436665-8f07dbf5bf1d',
      'photo-1476275466078-4007374efbbe',
      'photo-1532012197267-da84d127e765',
    ],
    subNiches: [
      'Estoicismo Clásico & Marco Aurelio',
      'Ética, Propósito & Sentido Vital',
      'Estética, Escultura & Bellas Artes',
      'El Paso del Tiempo & Memoria',
      'Grandes Pensadores & Ensayo',
    ],
    settings: [
      'Escultura clásica en claroscuro con iluminación dorada',
      'Diario manuscrito con pluma estilográfica y reloj de arena',
      'Galería de arte renacentista en silencio contemplativo',
      'Acantilado solitario frente al horizonte al caer la tarde',
    ],
  },
  {
    niche: 'Viajes, Ciudades & Arquitectura',
    primaryHex: '#0F172A',
    secondaryHex: '#1E293B',
    accentHex: '#F97316',
    keywordsBase: ['viajes', 'ciudad', 'arquitectura', 'mundo', 'metropolis', 'culturas', 'horizonte', 'urbanismo', 'paisaje', 'destino'],
    unsplashPool: [
      'photo-1477959858617-67f85cf4f1df',
      'photo-1480714378408-67cf0d13bc1b',
      'photo-1514565131-fce0801e5785',
      'photo-1449824913935-59a10b8d2000',
      'photo-1502602898657-3e91760cbb34',
      'photo-1493976040374-85c8e12f0c0e',
      'photo-1513635269975-59663e0ac1ad',
      'photo-1506973035872-a4ec16b8e8d9',
      'photo-1518684079-3c830dcef090',
      'photo-1496442226666-8d4d0e62e6e9',
    ],
    subNiches: [
      'Metrópolis Nocturnas & Skylines',
      'Arquitectura Contemporánea Icónica',
      'Culturas & Tradiciones de Oriente',
      'Capitales Europeas & Patrimonio',
      'Rutas Panorámicas & Grandes Viajes',
    ],
    settings: [
      'Skyline metropolitano al crepúsculo con luces arquitectónicas',
      'Templo tradicional rodeado de linternas cálidas al anochecer',
      'Puente colgante monumental entre bruma matinal dorada',
      'Avenida histórica europea iluminada tras la lluvia',
    ],
  },
  {
    niche: 'Educación, Hábitos & Estudio',
    primaryHex: '#0D192B',
    secondaryHex: '#1E3A5F',
    accentHex: '#FBBF24',
    keywordsBase: ['educacion', 'aprendizaje', 'estudio', 'habitos', 'lectura', 'libro', 'conocimiento', 'productividad', 'enfoque', 'disciplina'],
    unsplashPool: [
      'photo-1456513080510-7bf3a84b82f8',
      'photo-1434030216411-0b793f4b4173',
      'photo-1524995997946-a1c2e315a42f',
      'photo-1497633762265-9d179a990aa6',
      'photo-1503676260728-1c00da094a0b',
      'photo-1513258496099-48168024aec0',
      'photo-1488190211105-8b0e65b80b4e',
      'photo-1522202176988-66273c2fd55f',
      'photo-1516979187457-637abb4f9353',
      'photo-1495446815901-a7297e633e8d',
    ],
    subNiches: [
      'Lectura Profunda & Aprendizaje',
      'Productividad & Trabajo Enfocado',
      'Pensamiento Crítico & Ajedrez',
      'Escritura, Notas & Mapas Mentales',
      'Academia, Mentoría & Maestría',
    ],
    settings: [
      'Escritorio de estudio profundo con lámpara cálida y libros abiertos',
      'Tablero de ajedrez estratégico iluminado con luz lateral dramática',
      'Sala de lectura universitaria con estanterías de madera noble',
      'Cuaderno de notas estructurado junto a café humeante al amanecer',
    ],
  },
];

/**
 * Generates the complete catalog of 1,200 Niche Scene Photos (100 scenes per each of the 12 niches).
 */
function build1200NicheSceneCatalog(): NicheScenePhoto[] {
  const catalog: NicheScenePhoto[] = [];
  let globalNumber = 1;

  for (const bp of NICHE_BLUEPRINTS) {
    // 5 subNiches x 4 settings x 5 lighting modes = 100 unique scenes per niche (12 x 100 = 1,200 total!)
    for (let sIdx = 0; sIdx < bp.subNiches.length; sIdx++) {
      const subNiche = bp.subNiches[sIdx];
      for (let setIdx = 0; setIdx < bp.settings.length; setIdx++) {
        const setting = bp.settings[setIdx];
        for (let lIdx = 0; lIdx < CINEMATIC_LIGHTING_MODES.length; lIdx++) {
          const light = CINEMATIC_LIGHTING_MODES[lIdx];
          const localIdx = sIdx * 20 + setIdx * 5 + lIdx; // 0..99
          const unsplashId = bp.unsplashPool[localIdx % bp.unsplashPool.length];
          // Varying crop focal parameters so each variation in the pool has distinct framing
          const cropShift = (localIdx % 5) * 15;
          const imageUrl = `https://images.unsplash.com/${unsplashId}?auto=format&fit=crop&w=1280&h=720&q=82&fp-y=${0.35 + (cropShift % 30) * 0.01}`;
          const fallbackUrl = `https://picsum.photos/seed/kinetix-niche-${globalNumber}/1280/720`;

          catalog.push({
            id: `scene-${String(globalNumber).padStart(4, '0')}`,
            number: globalNumber,
            niche: bp.niche,
            subNiche,
            title: `${setting} · ${light.label}`,
            cinematicAngle: light.label,
            keywords: [
              ...bp.keywordsBase,
              subNiche.toLowerCase(),
              setting.toLowerCase(),
              light.label.toLowerCase(),
            ],
            imageUrl,
            fallbackUrl,
            primaryHex: bp.primaryHex,
            secondaryHex: bp.secondaryHex,
            accentHex: bp.accentHex,
            aiScenePrompt: `Cinematic 16:9 widescreen audiobook scene illustration for niche "${bp.niche}" (${subNiche}): ${setting}, ${light.en}, shot on 35mm anamorphic lens, ultra-detailed 8k editorial photography, no text.`,
          });

          globalNumber++;
        }
      }
    }
  }

  return catalog;
}

export const NICHE_SCENE_LIBRARY_1200: NicheScenePhoto[] = build1200NicheSceneCatalog();

/**
 * Automatically selects the best matching scene photos from the 1,200+ library
 * for each chapter of a VideoBook based on chapter text and optional preferred niche.
 */
export function matchBestScenesForBookPages(
  pages: Array<{ chapterTitle: string; pageText: string; keyQuote?: string }>,
  preferredNiche?: 'Auto' | SceneNicheCategory
): Record<number, NicheScenePhoto> {
  const result: Record<number, NicheScenePhoto> = {};
  const usedIds = new Set<string>();

  pages.forEach((page, idx) => {
    const textBlob = `${page.chapterTitle} ${page.pageText} ${page.keyQuote || ''}`.toLowerCase();

    let pool =
      preferredNiche && preferredNiche !== 'Auto'
        ? NICHE_SCENE_LIBRARY_1200.filter((item) => item.niche === preferredNiche)
        : NICHE_SCENE_LIBRARY_1200;

    // Score items by keyword overlap
    let bestItem: NicheScenePhoto | null = null;
    let bestScore = -1;

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[(i + idx * 17) % pool.length];
      if (usedIds.has(candidate.id)) continue;

      let score = 0;
      for (const kw of candidate.keywords) {
        if (textBlob.includes(kw)) {
          score += 3;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestItem = candidate;
      }
    }

    const chosen = bestItem || pool[(idx * 19) % pool.length] || NICHE_SCENE_LIBRARY_1200[idx];
    usedIds.add(chosen.id);
    result[idx] = chosen;
  });

  return result;
}
