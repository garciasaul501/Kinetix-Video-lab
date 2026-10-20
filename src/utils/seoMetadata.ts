export type StudioModuleId =
  | 'videobook'
  | 'niche-gallery'
  | 'script'
  | 'pdf-director'
  | 'narration'
  | 'sequence'
  | 'paypal-monetization';

export interface StudioModuleSeoEntry {
  id: StudioModuleId;
  shortLabel: string;
  sectionBadge: string;
  heading: string;
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  ogImage: string;
  ogImageAlt: string;
  highlights: string[];
}

export const STUDIO_MODULES_SEO: Record<StudioModuleId, StudioModuleSeoEntry> = {
  videobook: {
    id: 'videobook',
    shortLabel: 'Audiolibros & PDF IA',
    sectionBadge: 'SECCIÓN 01 · AUDIOLIBROS Y VIDEO-LIBROS SIN LÍMITE',
    heading: 'Estudio de Audiolibros Hablados desde PDF y Video Sin Límite de Tiempo',
    shortDescription:
      'Convierte cualquier documento PDF o libro completo en un audiolibro hablado con avatares reales IA, +1,200 escenas por nichos y exportación en MP3 y MP4 sin límite de duración.',
    seoTitle: 'Audiolibros IA desde PDF y Video Sin Límite | Kinetix Studio',
    seoDescription:
      'Transforma documentos PDF en audiolibros hablados y videos completos sin límite de tiempo con 30 avatares reales IA y +1,200 imágenes de escenas por nichos.',
    keywords:
      'audiolibros IA desde PDF, convertir PDF a audiolibro MP3 MP4, video sin límite de tiempo, avatares hablados IA, Kinetix Studio',
    ogImage:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&h=630&q=85',
    ogImageAlt:
      'Estudio de Audiolibros IA desde PDF con avatares hablados y escenas cinematográficas sin límite de tiempo',
    highlights: [
      'Videos y audiolibros sin límite de tiempo',
      'Biblioteca de 12+ PDFs listos y subida múltiple',
      '30 avatares reales + 1,200 escenas de nichos',
    ],
  },
  'niche-gallery': {
    id: 'niche-gallery',
    shortLabel: '+1,200 Fotos Nichos',
    sectionBadge: 'SECCIÓN 02 · CATÁLOGO VISUAL DE 12 NICHOS (1,200 FOTOS HD)',
    heading: 'Galería Completa de +1,200 Imágenes Cinematográficas por Nichos',
    shortDescription:
      'Explora, visualiza en alta definición y asigna las 1,200 fotografías cinematográficas organizadas en 12 nichos temáticos para tus audiolibros, guiones y videos.',
    seoTitle: 'Galería de +1,200 Fotos por Nichos para Escenas IA | Kinetix',
    seoDescription:
      'Visualiza y asigna más de 1,200 fotos de escenas en 12 nichos (Finanzas, IA, Ciencia, Historia, Psicología, Salud y más) para audiolibros y videos sin límite.',
    keywords:
      'imágenes para escenas de video, fotos por nichos audiolibros, galería 1200 fotos HD, escenas cinematográficas IA, Kinetix Video AI Lab',
    ogImage:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&h=630&q=85',
    ogImageAlt:
      'Galería visual de 1,200 escenas cinematográficas organizadas en 12 nichos para producción audiovisual',
    highlights: [
      '12 nichos completos × 100 fotos cada uno (1,200 total)',
      'Visor en pantalla grande (Lightbox HD) y lectura clara',
      'Asignación en 1 clic a capítulos, guiones y secuencias',
    ],
  },
  script: {
    id: 'script',
    shortLabel: 'Guiones & Historial',
    sectionBadge: 'SECCIÓN 03 · GUIONES DE VIDEO E HISTORIAL DE VERSIONES',
    heading: 'Generador de Guiones Audiovisuales con Dictado por Voz e Historial',
    shortDescription:
      'Crea, edita y recupera guiones de 2 minutos o de duración ilimitada con dirección de cámara, dictado por micrófono y generación directa de clips MP4.',
    seoTitle: 'Generador de Guiones de Video IA e Historial | Kinetix Studio',
    seoDescription:
      'Escribe o dicta por voz guiones de video de 2 minutos o sin límite de tiempo, guarda versiones en el historial y genera escenas visuales y audio.',
    keywords:
      'generador de guiones de video IA, guiones de 2 minutos, historial de guiones, dictado por voz a texto, dirección audiovisual',
    ogImage:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&h=630&q=85',
    ogImageAlt:
      'Generador de guiones audiovisuales con historial de versiones y transcripción de voz a texto',
    highlights: [
      'Modo 2 minutos o duración libre sin límite de tiempo',
      'Historial persistente para editar versiones previas',
      'Dictado por micrófono integrado en cada escena',
    ],
  },
  'pdf-director': {
    id: 'pdf-director',
    shortLabel: 'Storyboard PDF',
    sectionBadge: 'SECCIÓN 04 · DIRECTOR AUDIOVISUAL Y STORYBOARD DESDE PDF',
    heading: 'Adaptador de Documentos PDF a Propuesta Audiovisual y Storyboard IA',
    shortDescription:
      'Analiza documentos PDF técnicos o literarios y genera una escaleta de storyboard escena por escena con prompts visuales, ritmo de edición y locución.',
    seoTitle: 'Director de Storyboard y Propuestas desde PDF | Kinetix Studio',
    seoDescription:
      'Convierte cualquier archivo PDF en una propuesta audiovisual completa con síntesis ejecutiva, storyboard técnico y prompts en inglés para generación de video.',
    keywords:
      'PDF a storyboard IA, propuesta audiovisual desde PDF, escaleta de video, prompts Veo 3.1, dirección de fotografía IA',
    ogImage:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&h=630&q=85',
    ogImageAlt:
      'Director Audiovisual IA para transformar documentos PDF en storyboards técnicos listos para producción',
    highlights: [
      'Extracción automática de texto y puntos clave del PDF',
      'Tabla de storyboard con tiempos y prompts visuales',
      'Soporte para videos cortos o documentales sin límite',
    ],
  },
  narration: {
    id: 'narration',
    shortLabel: 'Voz IA (TTS)',
    sectionBadge: 'SECCIÓN 05 · LOCUCIÓN NEURONAL Y MASTERIZACIÓN DE VOZ 24KHZ',
    heading: 'Estudio de Locución Neuronal Multiaudio y Síntesis de Voz IA',
    shortDescription:
      'Sintetiza locuciones profesionales en español con voces femeninas y masculinas, control de acento regional y descarga directa en WAV y MP3.',
    seoTitle: 'Estudio de Locución y Voz IA en Español (MP3) | Kinetix Studio',
    seoDescription:
      'Genera narraciones de voz con inteligencia artificial para audiolibros y videos con selección de timbre, acento y tono emocional en calidad de estudio 24kHz.',
    keywords:
      'locución IA en español, texto a voz audiolibros, narración neuronal MP3 WAV, voces realistas IA, Kinetix Studio',
    ogImage:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&h=630&q=85',
    ogImageAlt:
      'Estudio de locución neuronal y síntesis de voz en español para audiolibros y videos',
    highlights: [
      'Voces de estudio femeninas y masculinas en 24 kHz',
      'Dictado por voz y carga directa desde PDF o guion',
      'Exportación instantánea en formato MP3 y WAV',
    ],
  },
  sequence: {
    id: 'sequence',
    shortLabel: 'Videos MP4 Sin Límite',
    sectionBadge: 'SECCIÓN 06 · PRODUCCIÓN DE VIDEOS MP4 SIN LÍMITE DE TIEMPO',
    heading: 'Laboratorio de Secuencias Visuales y Videos MP4 Sin Límite de Duración',
    shortDescription:
      'Produce secuencias visuales y videos completos en MP4 (16:9 o 9:16) sin límite de tiempo combinando las +1,200 fotos de nichos, imágenes IA y locución.',
    seoTitle: 'Generador de Videos MP4 Sin Límite de Tiempo | Kinetix Studio',
    seoDescription:
      'Crea y descarga videos MP4 en alta definición sin límite de tiempo con múltiples planos, imágenes de los 12 nichos y sincronización de voz en off.',
    keywords:
      'generador de videos MP4 sin límite, crear videos largos con IA, secuencias cinematográficas 1080p, exportar video con voz MP4',
    ogImage:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&h=630&q=85',
    ogImageAlt:
      'Laboratorio de generación de videos MP4 sin límite de tiempo con escenas por nicho y audio sincronizado',
    highlights: [
      'Duración configurable: desde clips hasta videos sin límite',
      'Integración directa con las +1,200 fotos de los 12 nichos',
      'Exportación real en MP4 (H.264 + AAC) y audio MP3',
    ],
  },
  'paypal-monetization': {
    id: 'paypal-monetization',
    shortLabel: 'Suscripción PayPal',
    sectionBadge: 'SECCIÓN 07 · SUSCRIPCIÓN Y LICENCIA COMERCIAL PAYPAL',
    heading: 'Suscripción al Estudio y Pagos Seguros con PayPal',
    shortDescription:
      'Activa tu acceso ilimitado o adquiere audiolibros y producciones digitales al instante mediante checkout directo y seguro con PayPal.',
    seoTitle: 'Suscripción y Acceso Ilimitado con PayPal | Kinetix Studio',
    seoDescription:
      'Suscríbete ahora a Kinetix Studio con PayPal para desbloquear producciones ilimitadas de audiolibros en video, guiones y descargas comerciales MP4 y MP3.',
    keywords:
      'suscripción estudio audiolibros IA, pagos PayPal audiolibros, licencia comercial video IA, Kinetix Studio Pro',
    ogImage:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&h=630&q=85',
    ogImageAlt: 'Centro de suscripción y checkout con PayPal en Kinetix Studio',
    highlights: [
      'Botones directos de suscripción con PayPal',
      'Descarga inmediata de audiolibros en MP3 y MP4',
      'Licencia comercial completa sin límite de duración',
    ],
  },
};

function upsertMetaTag(
  selector: string,
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Dynamically updates document title, meta description, section-specific meta tags,
 * OpenGraph/Twitter social cards, canonical URL, and Schema.org JSON-LD when the user
 * navigates across studio sections or updates the active project title.
 */
export function applyDynamicStudioSeo(
  activeModule: StudioModuleId,
  customProjectTitle?: string
) {
  if (typeof document === 'undefined') return;
  const entry = STUDIO_MODULES_SEO[activeModule] || STUDIO_MODULES_SEO.videobook;

  const computedTitle = customProjectTitle
    ? `${entry.seoTitle} — ${customProjectTitle.slice(0, 38)}`
    : entry.seoTitle;

  document.title = computedTitle;

  const currentUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#${activeModule}`
      : 'https://ais-pre-u5qfwoyqvgln3bcxvf6bik-392229245207.us-east5.run.app';

  // Standard & Section-Specific SEO Meta Tags
  upsertMetaTag('meta[name="description"]', 'name', 'description', entry.seoDescription);
  upsertMetaTag('meta[name="keywords"]', 'name', 'keywords', entry.keywords);
  upsertMetaTag('meta[name="section"]', 'name', 'section', entry.shortLabel);
  upsertMetaTag('meta[name="studio:module"]', 'name', 'studio:module', entry.id);
  upsertMetaTag(
    'meta[name="studio:module-title"]',
    'name',
    'studio:module-title',
    entry.heading
  );
  upsertMetaTag(
    'meta[name="studio:module-description"]',
    'name',
    'studio:module-description',
    entry.shortDescription
  );
  upsertMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large');

  // OpenGraph Dynamic Meta Tags
  upsertMetaTag('meta[property="og:title"]', 'property', 'og:title', computedTitle);
  upsertMetaTag(
    'meta[property="og:description"]',
    'property',
    'og:description',
    entry.seoDescription
  );
  upsertMetaTag('meta[property="og:url"]', 'property', 'og:url', currentUrl);
  upsertMetaTag('meta[property="og:image"]', 'property', 'og:image', entry.ogImage);
  upsertMetaTag(
    'meta[property="og:image:secure_url"]',
    'property',
    'og:image:secure_url',
    entry.ogImage
  );
  upsertMetaTag('meta[property="og:image:alt"]', 'property', 'og:image:alt', entry.ogImageAlt);
  upsertMetaTag(
    'meta[property="article:section"]',
    'property',
    'article:section',
    entry.shortLabel
  );

  // Twitter / X Card Dynamic Meta Tags
  upsertMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', computedTitle);
  upsertMetaTag(
    'meta[name="twitter:description"]',
    'name',
    'twitter:description',
    entry.seoDescription
  );
  upsertMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', entry.ogImage);
  upsertMetaTag(
    'meta[name="twitter:image:alt"]',
    'name',
    'twitter:image:alt',
    entry.ogImageAlt
  );

  // Canonical Link
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute(
    'href',
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : currentUrl
  );

  // Dynamic Schema.org Structured Data (JSON-LD) including all Studio Modules
  let ldScript = document.head.querySelector<HTMLScriptElement>('#kinetix-dynamic-jsonld');
  if (!ldScript) {
    ldScript = document.createElement('script');
    ldScript.id = 'kinetix-dynamic-jsonld';
    ldScript.type = 'application/ld+json';
    document.head.appendChild(ldScript);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: computedTitle,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All',
    url: currentUrl,
    image: entry.ogImage,
    description: entry.seoDescription,
    author: {
      '@type': 'Organization',
      name: 'Kinetix — Video AI Lab',
    },
    hasPart: Object.values(STUDIO_MODULES_SEO).map((mod, idx) => ({
      '@type': 'WebPageElement',
      position: idx + 1,
      name: mod.heading,
      identifier: mod.id,
      description: mod.shortDescription,
    })),
  };

  ldScript.textContent = JSON.stringify(structuredData, null, 2);
}

export interface StudioPdfDocumentItem {
  id: string;
  label: string;
  filename: string;
  niche: string;
  pagesEstimate: number;
  durationMode: string;
  content: string;
}

/**
 * Complete Library of 12+ Ready-to-Use PDF Documents across all Studio Niches
 * so users can test, combine, edit, download, or convert them into unlimited-duration
 * spoken audiobooks and videos immediately.
 */
export const COMPLETE_PDF_LIBRARY_DOCUMENTS: StudioPdfDocumentItem[] = [
  {
    id: 'pdf-01',
    label: 'PDF 01 · IA Generativa y Producción Audiovisual',
    filename: '01-informe-ia-produccion-audiovisual-2026.pdf',
    niche: 'IA, Tecnología & Futuro',
    pagesEstimate: 12,
    durationMode: 'Sin límite de tiempo',
    content: `RESUMEN EJECUTIVO: IMPACTO DE LA IA GENERATIVA EN LA PRODUCCIÓN AUDIOVISUAL (2026).
Capítulo 1: La Nueva Era del Cine y los Audiolibros Digitales. Los estudios de producción digital que integran flujos de trabajo asistidos por inteligencia artificial han reducido el tiempo de preproducción y storyboard en un 68%, permitiendo validar conceptos visuales en minutos en lugar de semanas.
Capítulo 2: La Regla de los Primeros Cuatro Segundos. El 82% de la retención de audiencia en plataformas de streaming y video depende del gancho narrativo inicial y de la claridad en cada oración hablada.
Capítulo 3: Dirección de Fotografía y Escenas por Nichos. Tres pilares definen las producciones de alto rendimiento actual: síntesis ejecutiva sin tecnicismos innecesarios, dirección de fotografía intencional con óptica definida (35mm, iluminación volumétrica y movimiento de cámara) y diseño sonoro multicapa sincronizado con la voz.
Capítulo 4: Producción Sin Límite de Tiempo. Hoy cualquier libro, manual o documento PDF extenso puede transformarse en una obra audiovisual completa sin restricciones de duración, multiplicando por 3.4 veces el alcance educativo y comercial.`,
  },
  {
    id: 'pdf-02',
    label: 'PDF 02 · Neurociencia de la Atención y Memoria',
    filename: '02-neurociencia-atencion-memoria-humana.pdf',
    niche: 'Ciencia, Neurociencia & Cosmos',
    pagesEstimate: 14,
    durationMode: 'Sin límite de tiempo',
    content: `DOCUMENTO CIENTÍFICO: ARQUITECTURA DE LA ATENCIÓN HUMANA Y MEMORIA VISUAL.
Capítulo 1: Velocidad de Procesamiento Cerebral. El cerebro humano procesa estímulos visuales de alto contraste en apenas 13 milisegundos, activando redes de asociación inmediata entre la voz escuchada y la escena observada.
Capítulo 2: Sincronía entre Voz e Imagen. Cuando un audiolibro combina la voz expresiva de un narrador con escenas visuales coherentes del tema, la retención de conceptos complejos supera el 78% frente a la lectura pasiva.
Capítulo 3: El Ritmo de la Curiosidad. Alternar ideas claras cada bloque narrativo activa el sistema dopaminérgico de curiosidad anticipatoria, manteniendo al espectador inmerso en documentales y audiolibros de larga duración.
Capítulo 4: Aprendizaje Profundo. La unión de lectura resaltada en vivo, locución clara y fotografía cinematográfica constituye el estándar más alto para la educación moderna.`,
  },
  {
    id: 'pdf-03',
    label: 'PDF 03 · Libertad Financiera e Inversión Global',
    filename: '03-estrategia-finanzas-inversion-inteligente.pdf',
    niche: 'Negocios & Finanzas',
    pagesEstimate: 18,
    durationMode: 'Sin límite de tiempo',
    content: `MANUAL EJECUTIVO: ARQUITECTURA DE LA LIBERTAD FINANCIERA E INVERSIÓN INTELIGENTE.
Capítulo 1: El Poder del Interés Compuesto y el Capital Productivo. La verdadera riqueza no se mide por el ingreso mensual aislado, sino por la capacidad de transformar flujo de caja en activos que generan valor de manera autónoma las veinticuatro horas del día.
Capítulo 2: Diversificación Estratégica en Mercados Globales. Los portafolios institucionales más resilientes combinan renta variable tecnológica, bonos soberanos, bienes raíces comerciales y liquidez táctica para aprovechar correcciones del mercado.
Capítulo 3: Psicología del Inversor Disciplinado. El noventa por ciento de los errores financieros provienen de decisiones emocionales ante la volatilidad a corto plazo; un sistema automatizado elimina el sesgo del miedo y la euforia.
Capítulo 4: Construcción de Activos Digitales y Propiedad Intelectual. Crear catálogos de audiolibros, cursos y publicaciones digitales permite escalar ingresos globales sin techo geográfico ni límite de inventario.`,
  },
  {
    id: 'pdf-04',
    label: 'PDF 04 · Estoicismo Práctico y Paz Mental',
    filename: '04-filosofia-estoica-serenidad-cotidiana.pdf',
    niche: 'Filosofía, Estoicismo & Arte',
    pagesEstimate: 15,
    durationMode: 'Sin límite de tiempo',
    content: `TRATADO DE FILOSOFÍA APLICADA: ESTOICISMO PRÁCTICO Y CLARIDAD INTERIOR.
Capítulo 1: La Dicotomía del Control. Como enseñaron Epicteto, Séneca y Marco Aurelio, la serenidad inquebrantable comienza al distinguir con absoluta nitidez entre lo que depende de nuestras acciones y lo que pertenece al azar externo.
Capítulo 2: El Obstáculo es el Camino. Cada dificultad inesperada contiene la materia prima para ejercitar la virtud, la paciencia estratégica y la fortaleza de carácter.
Capítulo 3: El Diario Matutino y la Meditación Vespertina. Dedicar diez minutos al amanecer para anticipar los retos del día y diez minutos al anochecer para examinar nuestras decisiones transforma la calidad de toda una vida.
Capítulo 4: Amar el Destino (Amor Fati). No basta con tolerar lo inevitable; la verdadera sabiduría consiste en abrazar cada circunstancia como combustible para construir una obra significativa.`,
  },
  {
    id: 'pdf-05',
    label: 'PDF 05 · Mindfulness, Calma y Gestión Emocional',
    filename: '05-guia-mindfulness-calma-resiliencia.pdf',
    niche: 'Psicología, Mindfulness & Calma',
    pagesEstimate: 11,
    durationMode: 'Sin límite de tiempo',
    content: `GUÍA CLÍNICA DE BIENESTAR: MINDFULNESS, RESPIRACIÓN CONSCIENTE Y CALMA PROFUNDA.
Capítulo 1: El Silencio en medio del Ruido Moderno. Vivimos rodeados de notificaciones constantes que fragmentan nuestra paz interior; recuperar el gobierno de la respiración es volver a casa en cualquier momento del día.
Capítulo 2: Fisiología de la Calma. Una inhalación profunda de cuatro segundos seguida de una exhalación suave de seis segundos activa el nervio vago y reduce el cortisol circulante en menos de tres minutos.
Capítulo 3: Observación sin Juicio. Las emociones intensas son como tormentas pasajeras en el cielo; cuando aprendemos a observarlas sin identificarnos con ellas, recuperamos la claridad para responder con sabiduría.
Capítulo 4: Arquitectura del Descanso Reparador. Preparar la mente cada noche mediante gratitud y lectura serena restaura la energía creativa para el nuevo amanecer.`,
  },
  {
    id: 'pdf-06',
    label: 'PDF 06 · Grandes Civilizaciones e Historia Antigua',
    filename: '06-cronicas-civilizaciones-antiguas-historia.pdf',
    niche: 'Historia & Civilizaciones',
    pagesEstimate: 20,
    durationMode: 'Sin límite de tiempo',
    content: `CRÓNICAS DE LA HUMANIDAD: LECCIONES DE LAS GRANDES CIVILIZACIONES ANTIGUAS.
Capítulo 1: La Biblioteca de Alejandría y el Sueño del Conocimiento Universal. Durante siglos, los sabios del mundo antiguo reunieron cientos de miles de pergaminos buscando comprender las leyes del cosmos, la medicina y la ingeniería.
Capítulo 2: Ingeniería y Caminos del Mundo Clásico. Desde los acueductos de piedra que abastecían ciudades enteras hasta las rutas marítimas guiadas por las estrellas, la cooperación técnica permitió unir continentes.
Capítulo 3: El Renacimiento y la Imprenta. Cada vez que la humanidad ha democratizado el acceso a los libros y las ideas, ha nacido una época dorada de arte, ciencia y prosperidad.
Capítulo 4: Nuestro Legado hacia el Futuro. Hoy somos los arquitectos de una nueva biblioteca digital hablada que preservará las mejores historias para las próximas generaciones.`,
  },
  {
    id: 'pdf-07',
    label: 'PDF 07 · Longevidad Celular, Salud y Vitalidad',
    filename: '07-ciencia-longevidad-nutricion-vitalidad.pdf',
    niche: 'Salud, Longevidad & Deporte',
    pagesEstimate: 16,
    durationMode: 'Sin límite de tiempo',
    content: `PROTOCOLO DE SALUD AVANZADA: LONGEVIDAD CELULAR, NUTRICIÓN Y ENERGÍA VITAL.
Capítulo 1: Los Pilares de la Juventud Biológica. La ciencia de la longevidad demuestra que el ochenta por ciento de nuestro envejecimiento celular depende de hábitos diarios: movimiento de fuerza, nutrición densa en micronutrientes y sueño profundo.
Capítulo 2: Salud Mitocondrial y Energía Sostenida. El entrenamiento aeróbico constante junto con ejercicios de fuerza preserva la capacidad energética de las células y protege la agudeza cognitiva a lo largo de las décadas.
Capítulo 3: Nutrición Antiinflamatoria y Claridad Mental. Priorizar alimentos naturales, hidratación mineral y ritmos circadianos alineados con la luz solar estabiliza el metabolismo y multiplica la vitalidad diaria.
Capítulo 4: Vivir Más y Mejor. El objetivo de la medicina preventiva moderna es añadir vida plena y lúcida a cada año.`,
  },
  {
    id: 'pdf-08',
    label: 'PDF 08 · Naturaleza, Océanos y Equilibrio del Planeta',
    filename: '08-atlas-naturaleza-oceanos-biodiversidad.pdf',
    niche: 'Naturaleza, Océanos & Planeta',
    pagesEstimate: 14,
    durationMode: 'Sin límite de tiempo',
    content: `ATLAS DOCUMENTAL: SECRETOS DE LOS OCÉANOS PROFUNDOS Y LOS BOSQUES MILENARIOS.
Capítulo 1: El Pulso Azul de la Tierra. Los océanos cubren más del setenta por ciento de nuestro planeta, regulan el clima global y albergan ecosistemas bioluminiscentes que apenas comenzamos a explorar.
Capítulo 2: La Red Subterránea de los Bosques. Bajo el suelo de las grandes selvas y bosques alpinos, millones de raíces y micorrizas intercambian nutrientes e información para sostener la biodiversidad.
Capítulo 3: Energías Limpias y Restauración Ecológica. La innovación tecnológica en energía solar, almacenamiento sólido y reforestación inteligente demuestra que el progreso humano puede prosperar en armonía con la naturaleza.`,
  },
  {
    id: 'pdf-09',
    label: 'PDF 09 · El Faro de Medianoche (Thriller & Ficción)',
    filename: '09-novela-el-faro-de-medianoche-thriller.pdf',
    niche: 'Literatura, Thriller & Ficción',
    pagesEstimate: 22,
    durationMode: 'Sin límite de tiempo',
    content: `NOVELA ORIGINAL: EL MANUSCRITO DEL FARO DE MEDIANOCHE.
Capítulo 1: La Carta bajo la Lluvia. El reloj de la estación marcaba las once y cuarenta y siete cuando Elena abrió el sobre lacrado en ámbar; dentro solo había una llave de bronce y las coordenadas de un faro abandonado en la costa norte.
Capítulo 2: Luces en la Niebla. A través del parabrisas empañado, el haz de luz del antiguo faro giró tres veces sobre el acantilado, aunque los registros oficiales aseguraban que llevaba treinta años apagado.
Capítulo 3: La Cámara de los Relojes. Al abrir la puerta principal, Elena descubrió un estudio circular lleno de libros encuadernados en piel y una grabadora magnética cuyas bobinas seguían girando en silencio.
Capítulo 4: La Verdad Revelada. Al presionar reproducir, una voz serena pronunció su nombre y reveló el secreto que su familia había custodiado durante tres generaciones.`,
  },
  {
    id: 'pdf-10',
    label: 'PDF 10 · Marketing Digital y Economía de Creadores',
    filename: '10-guia-marketing-economia-creadores-ia.pdf',
    niche: 'Marketing, Creadores & Media',
    pagesEstimate: 13,
    durationMode: 'Sin límite de tiempo',
    content: `ESTRATEGIA DE CRECIMIENTO: STORYTELLING, AUDIOLIBROS Y ECONOMÍA DE CREADORES.
Capítulo 1: Marcas que Cuentan Historias. En un mercado saturado de anuncios fugaces, los creadores y empresas que construyen audiolibros, documentales y contenido de valor profundo conquistan la confianza duradera de su audiencia.
Capítulo 2: Producción Omnicanal desde un Solo Documento. Un único libro o informe en PDF puede transformarse simultáneamente en un audiolibro MP3, un video-libro MP4 sin límite de tiempo y decenas de clips verticales para redes sociales.
Capítulo 3: Monetización Directa sin Intermediarios. Ofrecer acceso directo y suscripciones simples permite a cualquier autor o estudio independiente construir un negocio digital rentable y escalable.`,
  },
  {
    id: 'pdf-11',
    label: 'PDF 11 · Arquitectura del Mundo y Grandes Metrópolis',
    filename: '11-arquitectura-ciudades-viajes-mundo.pdf',
    niche: 'Viajes, Ciudades & Arquitectura',
    pagesEstimate: 15,
    durationMode: 'Sin límite de tiempo',
    content: `CRÓNICA DE ARQUITECTURA Y VIAJES: LAS CIUDADES QUE REDISEÑAN EL HORIZONTE.
Capítulo 1: El Diálogo entre Piedra, Cristal y Luz. Desde los templos tradicionales de Kioto rodeados de jardines de musgo hasta las torres bioclimáticas de Singapur y Madrid, la arquitectura refleja la visión de cada cultura.
Capítulo 2: Urbanismo Humano y Espacios de Encuentro. Las metrópolis más admiradas del siglo veintiuno integran parques elevados, transporte limpio y bibliotecas públicas abiertas a la luz natural.
Capítulo 3: El Arte de Viajar con Mirada Cinematográfica. Observar una ciudad al amanecer nos enseña que cada calle, puente y plaza guarda siglos de historias esperando ser narradas.`,
  },
  {
    id: 'pdf-12',
    label: 'PDF 12 · Hábitos de Estudio Profundo y Maestría',
    filename: '12-sistema-habitos-enfoque-aprendizaje.pdf',
    niche: 'Educación, Hábitos & Estudio',
    pagesEstimate: 16,
    durationMode: 'Sin límite de tiempo',
    content: `SISTEMA DE APRENDIZAJE ACELERADO: ENFOQUE PROFUNDO Y HÁBITOS DE MAESTRÍA.
Capítulo 1: La Regla del Bloque de Noventa Minutos. El trabajo cognitivo de alto valor requiere periodos de concentración sin interrupciones donde las conexiones neuronales se consolidan a máxima velocidad.
Capítulo 2: Lectura Activa y Escucha Sincronizada. Combinar la lectura visual del texto con la escucha hablada en voz alta activa simultáneamente la corteza visual y auditiva, duplicando la velocidad de comprensión.
Capítulo 3: Constancia Compuesta. Mejorar apenas un uno por ciento cada día mediante el estudio estructurado de libros y documentos seleccionados transforma por completo cualquier carrera profesional en doce meses.`,
  },
];

export interface ExtendedStudioModuleSeoEntry extends StudioModuleSeoEntry {
  badgeText: string;
  sectionHeading: string;
  metaSection: string;
}

export const STUDIO_MODULE_SEO_MAP: Record<StudioModuleId, ExtendedStudioModuleSeoEntry> =
  Object.fromEntries(
    Object.entries(STUDIO_MODULES_SEO).map(([key, val]) => [
      key,
      {
        ...val,
        badgeText: val.sectionBadge,
        sectionHeading: val.heading,
        metaSection: val.shortLabel,
      },
    ])
  ) as Record<StudioModuleId, ExtendedStudioModuleSeoEntry>;

export const STUDIO_MODULE_LIST: ExtendedStudioModuleSeoEntry[] =
  Object.values(STUDIO_MODULE_SEO_MAP);

export const applyStudioModuleSeoMeta = applyDynamicStudioSeo;

export const STUDIO_PDF_LIBRARY_12 = COMPLETE_PDF_LIBRARY_DOCUMENTS.map((doc) => ({
  ...doc,
  pagesCount: doc.pagesEstimate,
}));

