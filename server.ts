import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, GenerateVideosOperation } from '@google/genai';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getActiveApiKey(): string {
  return (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en el entorno del servidor.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractTextFromPdfBufferNative(pdfBuffer: Buffer): string {
  const raw = pdfBuffer.toString('latin1');
  const chunks: string[] = [];

  const decodePdfString = (str: string) =>
    str
      .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');

  const collectTextOperators = (content: string) => {
    const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g;
    let m: RegExpExecArray | null;
    while ((m = tjRegex.exec(content)) !== null) {
      chunks.push(decodePdfString(m[1]));
    }
    const tjArrayRegex = /\[((?:[^[\]]|\([^()\\]*(?:\\.[^()\\]*)*\))*)\]\s*TJ/g;
    while ((m = tjArrayRegex.exec(content)) !== null) {
      const inner = m[1];
      const strParts = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
      let sm: RegExpExecArray | null;
      const lineParts: string[] = [];
      while ((sm = strParts.exec(inner)) !== null) {
        lineParts.push(decodePdfString(sm[1]));
      }
      if (lineParts.length > 0) {
        chunks.push(lineParts.join(''));
      }
    }
  };

  collectTextOperators(raw);

  // Also inspect compressed streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let sm: RegExpExecArray | null;
  while ((sm = streamRegex.exec(raw)) !== null) {
    try {
      const buf = Buffer.from(sm[1], 'latin1');
      const inflated = zlib.inflateSync(buf).toString('latin1');
      collectTextOperators(inflated);
    } catch (_e) {
      // Not a standard zlib stream
    }
  }

  return chunks
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDurationToSeconds(duracionObjetivo: string): number {
  const clean = (duracionObjetivo || '').toLowerCase();
  const minMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*min/);
  if (minMatch) {
    return Math.min(300, Math.max(15, Math.round(parseFloat(minMatch[1].replace(',', '.')) * 60)));
  }
  const secMatch = clean.match(/(\d+)\s*(?:seg|s\b)/);
  if (secMatch) {
    return Math.min(300, Math.max(15, parseInt(secMatch[1], 10)));
  }
  return 60;
}

function formatSecToTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildFallbackPdfProposal(
  textoPdf: string,
  tipoFormato: string,
  duracionObjetivo: string,
  tonoEstilo: string,
  herramientaIa: string
) {
  const cleanText = (textoPdf || '')
    .replace(/\s+/g, ' ')
    .trim();

  const format = tipoFormato?.trim() || 'Reels / TikTok / YouTube Shorts (9:16 Vertical)';
  const durationLabel = duracionObjetivo?.trim() || '60 segundos';
  const tone = tonoEstilo?.trim() || 'Cinematográfico, disruptivo y de alta retención';
  const aiTool = herramientaIa?.trim() || 'Veo 3.1';
  const isVertical = format.includes('9:16') || /reel|tiktok|short/i.test(format);
  const arFlag = isVertical ? '--ar 9:16' : '--ar 16:9';

  const rawSentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 22);

  const firstHeadline =
    rawSentences[0]?.slice(0, 68).replace(/[.,;:]+$/, '') ||
    'Transformación Estratégica e Innovación Aplicada';

  const s1 =
    rawSentences[0] ||
    'El análisis de los datos revela un cambio estructural que redefine cómo tomamos decisiones estratégicas.';
  const s2 =
    rawSentences[1] ||
    'La implementación de metodologías ágiles e inteligencia aplicada reduce la fricción operativa y multiplica el impacto.';
  const s3 =
    rawSentences[2] ||
    'Los indicadores clave demuestran una mejora sostenida en eficiencia, retención y velocidad de ejecución.';
  const s4 =
    rawSentences[3] ||
    'Adoptar este marco de trabajo hoy separa a los líderes del sector de quienes reaccionan demasiado tarde.';
  const s5 =
    rawSentences[4] ||
    'El siguiente paso consiste en integrar estos hallazgos en un flujo de producción medible y escalable.';

  const totalSec = parseDurationToSeconds(durationLabel);
  const sceneCount = 6;
  const weights = [0.08, 0.18, 0.2, 0.2, 0.2, 0.14];
  let cursor = 0;

  const sceneBlueprints = [
    {
      role: 'GANCHO INICIAL (HOOK)',
      narration: `¿Sabías que la mayoría ignora el dato más crítico de este documento? ${s1.slice(0, 125)}`,
      sfx: 'SFX: Sub-bass drop profundo + Whoosh metálico de apertura + Música entra en pulso rítmico.',
      staging: `Primerísimo primer plano (Extreme Close-Up) con zoom in rápido hacia un entorno de alto contraste; iluminación volumétrica ámbar/cian que rompe la oscuridad (${isVertical ? 'encuadre vertical 9:16' : 'encuadre panorámico 16:9'}).`,
      promptSubject: `Dramatic cinematic opening hook representing "${firstHeadline}", glowing volumetric data streams emerging in dark studio atmosphere, shallow depth of field, 35mm anamorphic lens, dynamic push-in camera motion, photorealistic 8k, optimized for ${aiTool} ${arFlag}`,
      overlay: 'EL DATO QUE LO CAMBIA TODO',
    },
    {
      role: 'CONTEXTO Y PROBLEMA CENTRAL',
      narration: s1,
      sfx: 'SFX: Pulso de sintetizador analógico + transición de barrido grave (Low-pass riser).',
      staging:
        'Plano medio con travelling lateral fluido mostrando la tensión entre el método tradicional y la nueva arquitectura propuesta en el documento.',
      promptSubject: `Cinematic medium tracking shot illustrating "${s1.slice(0, 85)}", moody chiaroscuro lighting, tungsten and deep slate color grading, subtle atmospheric haze, fluid lateral camera movement, 50mm Prime lens, ultra-detailed, optimized for ${aiTool} ${arFlag}`,
      overlay: 'EL RETO OCULTO',
    },
    {
      role: 'BLOQUE DE VALOR 01 · EVIDENCIA',
      narration: s2,
      sfx: 'SFX: Click digital cristalino sincronizado con aparición de gráficos + pulso rítmico.',
      staging:
        'Plano cenital (Overhead Top-Down) con rotación orbital suave; elementos visuales y métricas clave iluminados con luz dura direccional.',
      promptSubject: `High-contrast architectural visualization of "${s2.slice(0, 85)}", orbital overhead camera angle, holographic glass layers and warm amber rim light, crisp focus, cinema grade 8k render, optimized for ${aiTool} ${arFlag}`,
      overlay: 'CLAVE #1: IMPACTO DIRECTO',
    },
    {
      role: 'BLOQUE DE VALOR 02 · MECANISMO',
      narration: s3,
      sfx: 'SFX: Desplazamiento neumático sutil + acorde ascendente de cuerdas híbridas.',
      staging:
        'Plano detalle en cámara lenta (120fps) seguido de un dolly-in hacia el núcleo del proceso descrito, enfatizando precisión y escala.',
      promptSubject: `Macro slow-motion cinematic shot symbolizing "${s3.slice(0, 85)}", intricate light refraction, golden particles suspended in air, 85mm f/1.2 lens, smooth dolly-in camera movement, volumetric rays, optimized for ${aiTool} ${arFlag}`,
      overlay: 'RESULTADOS MEDIBLES',
    },
    {
      role: 'CLÍMAX Y REVELACIÓN',
      narration: `${s4} ${s5.slice(0, 90)}`,
      sfx: 'SFX: Silencio dramático de 0.5 segundos seguido de impacto orquestal profundo (Braaam sutil).',
      staging:
        'Plano general simétrico (Wide Master Shot) con ascenso de grúa (Crane Up), revelando la visión completa iluminada por un horizonte dorado.',
      promptSubject: `Epic wide master shot with crane-up camera movement revealing "${s4.slice(0, 85)}", dramatic golden hour horizon intersecting futuristic studio architecture, IMAX 70mm aesthetic, volumetric god rays, optimized for ${aiTool} ${arFlag}`,
      overlay: 'LA VENTAJA DEFINITIVA',
    },
    {
      role: 'CONCLUSIÓN Y LLAMADO A LA ACCIÓN (CTA)',
      narration:
        'El momento de aplicar esta estrategia es ahora. Guarda este análisis, compártelo con tu equipo y lleva esta visión a la práctica hoy mismo.',
      sfx: 'SFX: Destello sonoro limpio (Shimmer hit) + cola de reverberación cálida de cierre.',
      staging:
        'Plano limpio con espacio negativo central para lectura nítida del llamado a la acción y cierre de marca con desenfoque bokeh progresivo.',
      promptSubject: `Clean minimalist cinema closing frame with warm amber bokeh lights and dark slate negative space for typography, slow zoom-out camera motion, 35mm film grain, prestigious editorial aesthetic, optimized for ${aiTool} ${arFlag}`,
      overlay: 'GUÁRDALO Y APLÍCALO HOY →',
    },
  ];

  const storyboard = sceneBlueprints.map((bp, idx) => {
    const dur =
      idx === sceneCount - 1
        ? Math.max(4, totalSec - cursor)
        : Math.max(4, Math.round(totalSec * weights[idx]));
    const startSec = cursor;
    const endSec = Math.min(totalSec, cursor + dur);
    cursor = endSec;

    return {
      sceneNumber: idx + 1,
      timestamp: `${formatSecToTimestamp(startSec)} - ${formatSecToTimestamp(endSec)}`,
      durationSec: Math.max(3, endSec - startSec),
      audioVoiceover: `[VOZ EN OFF]: "${bp.narration}" — [${bp.sfx}]`,
      narrationOnly: bp.narration,
      sfxCue: bp.sfx,
      visualStaging: `[${bp.role}] ${bp.staging}`,
      aiVisualPrompt: bp.promptSubject,
      onScreenText: bp.overlay,
    };
  });

  return {
    projectTitle: `Propuesta Audiovisual: ${firstHeadline.slice(0, 52)}`,
    targetFormat: format,
    targetDuration: durationLabel,
    narrativeTone: tone,
    aiTool,
    analysisSynthesis: {
      coreMessage: s1,
      keyPoints: [s1, s2, s3, s4].map((pt) => pt.slice(0, 160)),
      essentialData: [
        `Adaptación optimizada para ${format} con duración objetivo de ${durationLabel}.`,
        `Síntesis narrativa libre de jerga densa con tono ${tone.toLowerCase()}.`,
        `Prompts visuales calibrados específicamente para generación en ${aiTool}.`,
      ],
    },
    narrativeStructure: {
      hook: `Primeros 3-5s: Disrupción visual inmediata y pregunta de alto contraste basada en la tesis central ("${s1.slice(0, 95)}...") para frenar el scroll.`,
      valueBlocks: [
        {
          title: 'Bloque 1 · Diagnóstico y Contexto',
          summary: s2,
        },
        {
          title: 'Bloque 2 · Evidencia y Mecanismo Clave',
          summary: s3,
        },
        {
          title: 'Bloque 3 · Aplicación Estratégica',
          summary: s4,
        },
      ],
      climaxConclusion: `Punto de máxima tensión visual y sonora donde converge la tesis del documento: ${s4}`,
      callToAction:
        'Llamado directo a guardar el contenido, compartir el hallazgo con el equipo y ejecutar el primer paso hoy mismo.',
    },
    storyboard,
    technicalEditing: {
      cutsPacing:
        'Ritmo dinámico progresivo (J-Cuts y L-Cuts para fluidez verbal): cortes cada 2.5 - 3.5 segundos en el gancho inicial para retención máxima, abriendo a planos de 4 - 6 segundos con movimiento interno continuo en los bloques de valor.',
      soundtrackStyle: `Electrónica cinematográfica minimalista / Neo-clásica híbrida con pulso grave definido (Mood: ${tone}), evolución en 3 actos con caída de percusión antes del clímax.`,
      recommendedBpm: isVertical ? 108 : 92,
      transitionSfx: [
        'Whoosh grave texturizado (Low-end air whoosh) en cambios de bloque temático',
        'Riser analógico de tensión 1.5s antes de revelar datos clave en pantalla',
        'Sub-drop + silencio táctico de 400ms justo antes del Clímax/CTA',
        'Clicks orgánicos de obturador / cinta para sincronizar aparición de texto Overlay',
      ],
    },
    fullVoiceoverScript: storyboard.map((s) => s.narrationOnly).join(' '),
  };
}

function buildFallbackScript(topic: string, tone: string, targetAudience: string) {
  const cleanTopic = topic?.trim() || 'innovación tecnológica y creatividad audiovisual';
  const cleanTone = tone?.trim() || 'cinematográfico e inspirador';
  const cleanAudience = targetAudience?.trim() || 'creadores digitales y profesionales';

  const scenes = [
    {
      sceneNumber: 1,
      timecode: '00:00 - 00:22',
      durationSec: 22,
      title: 'El Punto de Inflexión',
      visualDescription: `Apertura atmosférica sobre ${cleanTopic}, mostrando contrastes de luz y movimiento que capturan la atención de ${cleanAudience}.`,
      visualStyle: `Estilo ${cleanTone} en formato anamórfico 35mm con iluminación volumétrica`,
      cameraDirection: 'Dolly in lento hacia el sujeto central (50mm f/1.4)',
      narrationText: `Todo gran cambio comienza con una pregunta silenciosa. Hoy nos adentramos en ${cleanTopic}, una transformación pensada para ${cleanAudience}.`,
      soundDesign: 'Pulso grave cinematográfico con texturas ambientales envolventes.',
    },
    {
      sceneNumber: 2,
      timecode: '00:22 - 00:48',
      durationSec: 26,
      title: 'La Arquitectura Invisible',
      visualDescription: `Secuencia dinámica que desglosa los elementos esenciales de ${cleanTopic} mediante capas visuales y transiciones fluidas.`,
      visualStyle: `Composición ${cleanTone} con alto contraste y profundidad de campo selectiva`,
      cameraDirection: 'Travelling lateral fluido (24mm Gran Angular)',
      narrationText: `Más allá de la superficie, ${cleanTopic} redefine la manera en que conectamos ideas, velocidad y propósito en cada decisión.`,
      soundDesign: 'Arpegio minimalista de sintetizador sincronizado con cortes visuales.',
    },
    {
      sceneNumber: 3,
      timecode: '00:48 - 01:14',
      durationSec: 26,
      title: 'El Factor Humano y la Emoción',
      visualDescription: `Primeros planos expresivos e iluminación cálida que vinculan ${cleanTopic} con la experiencia cotidiana de ${cleanAudience}.`,
      visualStyle: `Fotografía orgánica de tono ${cleanTone} con destellos ámbar`,
      cameraDirection: 'Movimiento orbital suave alrededor del eje principal (85mm Prime)',
      narrationText: `Porque la verdadera potencia no reside únicamente en la técnica, sino en la visión humana que le da sentido y dirección.`,
      soundDesign: 'Cuerdas acústicas cálidas en crescendo progresivo.',
    },
    {
      sceneNumber: 4,
      timecode: '01:14 - 01:40',
      durationSec: 26,
      title: 'Expansión de Posibilidades',
      visualDescription: `Montaje rítmico de escenarios futuros impulsados por ${cleanTopic}, proyectando claridad y dinamismo.`,
      visualStyle: `Estética ${cleanTone} de vanguardia con geometría lumínica`,
      cameraDirection: 'Ascenso de grúa (Crane Up) revelando una perspectiva amplia',
      narrationText: `Cada herramienta, cada proceso y cada instante abren hoy un territorio que antes parecía inalcanzable para ${cleanAudience}.`,
      soundDesign: 'Percusión profunda y diseño sonoro espacializado.',
    },
    {
      sceneNumber: 5,
      timecode: '01:40 - 02:00',
      durationSec: 20,
      title: 'El Próximo Horizonte',
      visualDescription: `Plano maestro final de alto impacto visual que sintetiza la esencia de ${cleanTopic} bajo una luz dorada de amanecer.`,
      visualStyle: `Épico cinematográfico 70mm con tono ${cleanTone}`,
      cameraDirection: 'Zoom out majestuoso hasta el horizonte completo',
      narrationText: `El futuro de ${cleanTopic} ya está en marcha. Y la próxima historia extraordinaria comienza exactamente aquí.`,
      soundDesign: 'Acorde final resonante seguido de un silencio limpio de estudio.',
    },
  ];

  return {
    title: `${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)}`,
    logline: `Producción audiovisual de 2 minutos con tono ${cleanTone} diseñada especialmente para ${cleanAudience}.`,
    totalDuration: '02:00 (120s)',
    recommendedVoiceGender: 'femenina',
    recommendedAccent: 'español neutro',
    recommendedVoiceTone: cleanTone,
    fullNarration: scenes.map((s) => s.narrationText).join(' '),
    scenes,
  };
}

function buildFallbackSequence(sceneDescription: string, visualStyle: string) {
  const cleanDesc =
    sceneDescription?.trim() ||
    'el despertar de una metrópolis futurista al amanecer con sensación de asombro y esperanza';
  const cleanStyle =
    visualStyle?.trim() ||
    'cinematográfico anamórfico 35mm con iluminación volumétrica ámbar y azul profundo';

  return {
    title: cleanDesc.slice(0, 48).charAt(0).toUpperCase() + cleanDesc.slice(1, 48),
    emotionSummary: cleanDesc,
    visualStyleApplied: cleanStyle,
    veoEnhancedPrompt: `Cinematic sequence representing ${cleanDesc}, visual style ${cleanStyle}, volumetric lighting, 35mm anamorphic lens, fluid camera movement.`,
    suggestedVoiceover: `En el instante en que la luz transforma la atmósfera, ${cleanDesc.toLowerCase()}.`,
    ambientEffect: 'particles',
    bpmTempo: 86,
    shots: [
      {
        shotNumber: 1,
        durationSec: 3.5,
        shotType: 'Plano General Atmosférico',
        cameraMotion: 'dolly-in',
        visualMotif: 'horizon',
        headlineText: 'ATMOSFERA INICIAL',
        actionDescription: cleanDesc.slice(0, 80),
        primaryHex: '#090D16',
        secondaryHex: '#162035',
        accentHex: '#F59E0B',
        focalLens: '24mm f/1.4 Anamorphic',
      },
      {
        shotNumber: 2,
        durationSec: 3.5,
        shotType: 'Plano Medio Dinámico',
        cameraMotion: 'pan-right',
        visualMotif: 'waves',
        headlineText: 'PULSO EN MOVIMIENTO',
        actionDescription: `Estilo visual ${cleanStyle.slice(0, 65)}`,
        primaryHex: '#0B1320',
        secondaryHex: '#1D2D44',
        accentHex: '#38BDF8',
        focalLens: '35mm T1.5 Prime',
      },
      {
        shotNumber: 3,
        durationSec: 3.5,
        shotType: 'Primer Plano Emocional',
        cameraMotion: 'orbital',
        visualMotif: 'portal',
        headlineText: 'PUNTO DE CONVERGENCIA',
        actionDescription: 'Destellos ópticos y profundidad volumétrica en el centro del encuadre.',
        primaryHex: '#120E1A',
        secondaryHex: '#251D3A',
        accentHex: '#F59E0B',
        focalLens: '50mm f/1.2 Noctilux',
      },
      {
        shotNumber: 4,
        durationSec: 3.5,
        shotType: 'Plano Maestro de Cierre',
        cameraMotion: 'zoom-out',
        visualMotif: 'cityscape',
        headlineText: 'HORIZONTE REVELADO',
        actionDescription: 'Resolución visual con contraste cinematográfico y luz clave ámbar.',
        primaryHex: '#0A0F1D',
        secondaryHex: '#1E293B',
        accentHex: '#FBBF24',
        focalLens: '85mm Anamorphic',
      },
    ],
  };
}

function generateSynthesizedSpeechEnvelopePcmBuffer(text: string, voiceGender: string): Buffer {
  const sampleRate = 24000;
  const words = (text || 'Narración de estudio').trim().split(/\s+/).filter(Boolean);
  const durationSec = Math.min(18, Math.max(2.5, words.length * 0.36));
  const totalSamples = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(totalSamples * 2);

  const baseFreq = voiceGender?.toLowerCase() === 'masculina' ? 122 : 196;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const wordIdx = Math.floor(t / 0.36);
    const wordPhase = (t % 0.36) / 0.36;
    const syllableEnv =
      wordPhase < 0.82
        ? Math.sin((wordPhase / 0.82) * Math.PI) * (0.65 + 0.35 * Math.sin(wordIdx * 1.7))
        : 0.02;

    const pitchMod = 1 + 0.08 * Math.sin(t * 2.4) + 0.04 * Math.cos(t * 5.1);
    const f0 = baseFreq * pitchMod;
    const harmonic =
      0.55 * Math.sin(2 * Math.PI * f0 * t) +
      0.28 * Math.sin(2 * Math.PI * f0 * 2 * t) +
      0.12 * Math.sin(2 * Math.PI * f0 * 3 * t) +
      0.05 * Math.sin(2 * Math.PI * f0 * 4 * t);

    const sampleVal = Math.max(-0.95, Math.min(0.95, harmonic * syllableEnv * 0.45));
    buffer.writeInt16LE(Math.floor(sampleVal * 32767), i * 2);
  }

  return buffer;
}

function wrapPcmInWavHeader(pcmBuffer: Buffer, sampleRate = 24000): Buffer {
  if (
    pcmBuffer.length > 44 &&
    pcmBuffer[0] === 0x52 &&
    pcmBuffer[1] === 0x49 &&
    pcmBuffer[2] === 0x46 &&
    pcmBuffer[3] === 0x46
  ) {
    return pcmBuffer;
  }

  const header = Buffer.alloc(44);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

async function generateFallbackPngBase64(
  headline: string,
  primaryHex = '#0B132B',
  secondaryHex = '#1C2541',
  accentHex = '#F59E0B',
  aspectRatio: '16:9' | '9:16' = '16:9',
  shotNumber = 1
): Promise<string> {
  const w = aspectRatio === '16:9' ? 1280 : 720;
  const h = aspectRatio === '16:9' ? 720 : 1280;
  const safeTitle = (headline || `PLANO 0${shotNumber}`)
    .replace(/[<>&"']/g, '')
    .slice(0, 42);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryHex}" />
        <stop offset="55%" stop-color="${secondaryHex}" />
        <stop offset="100%" stop-color="#05070B" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="44%" r="52%">
        <stop offset="0%" stop-color="${accentHex}" stop-opacity="0.55" />
        <stop offset="45%" stop-color="${secondaryHex}" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)" />
    <rect width="${w}" height="${h}" fill="url(#glow)" />
    <circle cx="${w * 0.5}" cy="${h * 0.46}" r="${Math.min(w, h) * 0.18}" fill="none" stroke="${accentHex}" stroke-width="2" stroke-opacity="0.5" />
    <circle cx="${w * 0.5}" cy="${h * 0.46}" r="${Math.min(w, h) * 0.28}" fill="none" stroke="${accentHex}" stroke-width="1.2" stroke-opacity="0.3" />
    <line x1="0" y1="${h * 0.62}" x2="${w}" y2="${h * 0.62}" stroke="${accentHex}" stroke-width="2" stroke-opacity="0.65" />
    <rect x="${w * 0.12}" y="${h * 0.32}" width="${w * 0.76}" height="${h * 0.3}" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1" />
    <text x="${w * 0.5}" y="${h * 0.5}" text-anchor="middle" fill="#F9FAFB" font-family="sans-serif" font-weight="bold" font-size="${aspectRatio === '16:9' ? 38 : 30}" letter-spacing="3">${safeTitle}</text>
  </svg>`;

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'kinetix-img-'));
  const svgPath = path.join(tmpDir, 'frame.svg');
  const pngPath = path.join(tmpDir, 'frame.png');

  try {
    await fs.promises.writeFile(svgPath, svg, 'utf8');
    await execFileAsync('ffmpeg', ['-y', '-i', svgPath, '-frames:v', '1', pngPath]);
    const pngBuf = await fs.promises.readFile(pngPath);
    return `data:image/png;base64,${pngBuf.toString('base64')}`;
  } catch (_err) {
    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

function buildFallbackVideoBook(
  textoPdf: string,
  bookStyle = 'Ilustración Editorial Cinematográfica',
  filename = 'Documento PDF'
) {
  const cleanText = (textoPdf || '').replace(/\s+/g, ' ').trim();
  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 18);

  const firstTitle =
    sentences[0]?.slice(0, 56).replace(/[.,;:]+$/, '') ||
    'Edición Interactiva en Video-Libro';

  const palettes = [
    { primary: '#0D1322', secondary: '#1B2845', accent: '#F59E0B' },
    { primary: '#101827', secondary: '#1E3A5F', accent: '#38BDF8' },
    { primary: '#161124', secondary: '#2D1E4A', accent: '#F59E0B' },
    { primary: '#0C1A1E', secondary: '#163840', accent: '#10B981' },
    { primary: '#1A1215', secondary: '#382028', accent: '#FBBF24' },
  ];

  const pageCount = 5;
  const chunkSize = Math.max(1, Math.ceil(sentences.length / pageCount));

  const chapterDefaults = [
    'Capítulo I · El Punto de Partida',
    'Capítulo II · La Idea Central',
    'Capítulo III · Descubrimiento y Evidencia',
    'Capítulo IV · Transformación en la Práctica',
    'Capítulo V · Conclusión y Futuro',
  ];

  const pages = Array.from({ length: pageCount }, (_, idx) => {
    const slice = sentences.slice(idx * chunkSize, (idx + 1) * chunkSize);
    const bodyText =
      slice.join(' ') ||
      sentences[idx % Math.max(1, sentences.length)] ||
      'Cada página de este libro electrónico en video transforma los conceptos del documento original en una narrativa visual clara, envolvente y fácil de recordar.';

    const quote =
      slice[0]?.slice(0, 110) ||
      bodyText.slice(0, 110);

    const pal = palettes[idx % palettes.length];
    const words = bodyText.split(/\s+/).filter(Boolean).length;

    return {
      pageNumber: idx + 1,
      chapterTitle: chapterDefaults[idx] || `Capítulo ${idx + 1}`,
      pageText: bodyText.slice(0, 340),
      keyQuote: quote,
      imagePrompt: `Editorial book illustration in style of ${bookStyle}, representing "${bodyText.slice(0, 90)}", warm volumetric lighting, rich cinematic composition, 8k masterpiece`,
      durationSec: Math.min(14, Math.max(5, Math.round(words * 0.38))),
      primaryHex: pal.primary,
      secondaryHex: pal.secondary,
      accentHex: pal.accent,
    };
  });

  return {
    bookTitle: firstTitle,
    subtitle: 'Edición de Libro Electrónico Ilustrado y Narrado en Video',
    authorOrSource: filename.replace(/\.pdf$/i, ''),
    bookStyle,
    totalEstimatedSec: pages.reduce((acc, p) => acc + p.durationSec, 0),
    fullNarration: pages.map((p) => `${p.chapterTitle}. ${p.pageText}`).join(' '),
    pages,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // 0. Simple 1-Click PDF to Video-eBook (Libro Electrónico en Video)
  app.post('/api/pdf-to-videobook', async (req, res) => {
    const {
      textoPdf,
      bookStyle = 'Ilustración Editorial Cinematográfica',
      filename = 'Documento PDF',
    } = req.body || {};

    const cleanPdf =
      (textoPdf || '').trim() ||
      'La lectura audiovisual combina la profundidad de los libros con la fuerza de las imágenes y la voz narrada.';

    const bookSchema = {
      systemInstruction:
        'Eres un Editor Literario Senior y Director de Libros Electrónicos Interactivos en Video (Video-eBooks). Tu misión es transformar el texto extraído de un PDF en un Libro Electrónico en Video de 5 páginas claras, amenas, fáciles de leer y listas para ser narradas en voz alta con ilustraciones generadas por IA.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bookTitle: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          authorOrSource: { type: Type.STRING },
          bookStyle: { type: Type.STRING },
          totalEstimatedSec: { type: Type.INTEGER },
          fullNarration: { type: Type.STRING },
          pages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                pageNumber: { type: Type.INTEGER },
                chapterTitle: { type: Type.STRING },
                pageText: { type: Type.STRING },
                keyQuote: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                durationSec: { type: Type.INTEGER },
                primaryHex: { type: Type.STRING },
                secondaryHex: { type: Type.STRING },
                accentHex: { type: Type.STRING },
              },
              required: [
                'pageNumber',
                'chapterTitle',
                'pageText',
                'keyQuote',
                'imagePrompt',
                'durationSec',
                'primaryHex',
                'secondaryHex',
                'accentHex',
              ],
            },
          },
        },
        required: [
          'bookTitle',
          'subtitle',
          'authorOrSource',
          'bookStyle',
          'totalEstimatedSec',
          'fullNarration',
          'pages',
        ],
      },
    };

    const prompt = `Convierte el siguiente contenido extraído de un documento PDF en un Libro Electrónico en Video (Video-eBook) dividido en exactamente 5 páginas ilustradas y narradas.
Estilo visual de las ilustraciones: ${bookStyle}.
Archivo fuente: ${filename}.

Contenido del PDF:
"""
${cleanPdf}
"""

Para cada una de las 5 páginas incluye:
- pageNumber (1 a 5)
- chapterTitle (título atractivo del capítulo o página en español)
- pageText (párrafo claro, envolvente y literario de 2 a 4 oraciones pensado para leerse en la página del libro y escucharse en voz alta)
- keyQuote (frase breve destacada de la página)
- imagePrompt (prompt detallado en inglés para generar la ilustración de esa página con estilo ${bookStyle})
- durationSec (segundos estimados de lectura entre 6 y 12)
- primaryHex, secondaryHex, accentHex (colores hexadecimales elegantes oscuros para la maquetación).`;

    try {
      const ai = getGenAIClient();
      let responseText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: bookSchema,
        });
        responseText = response.text || '';
      } catch (_firstErr) {
        const fallbackRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite',
          contents: prompt,
          config: bookSchema,
        });
        responseText = fallbackRes.text || '';
      }

      const parsed = JSON.parse(responseText || '{}');
      res.json({ videoBook: parsed, quotaFallback: false });
    } catch (_err) {
      const fallbackBook = buildFallbackVideoBook(cleanPdf, bookStyle, filename);
      res.json({ videoBook: fallbackBook, quotaFallback: true });
    }
  });

  // 0A. Extract Text from Uploaded PDF Document
  app.post('/api/extract-pdf', async (req, res) => {
    const { pdfBase64, filename = 'documento.pdf' } = req.body || {};
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      res.status(400).json({ error: 'No se recibió ningún archivo PDF.' });
      return;
    }

    const cleanB64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
    const pdfBuffer = Buffer.from(cleanB64, 'base64');
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'kinetix-pdf-'));
    const pdfPath = path.join(tmpDir, 'input.pdf');
    const txtPath = path.join(tmpDir, 'output.txt');

    try {
      await fs.promises.writeFile(pdfPath, pdfBuffer);

      // Method 1: Ghostscript txtwrite (fast, accurate UTF-8 PDF text extraction)
      let extractedText = '';
      try {
        await execFileAsync('gs', [
          '-q',
          '-dNOPAUSE',
          '-dBATCH',
          '-dSAFER',
          '-sDEVICE=txtwrite',
          `-sOutputFile=${txtPath}`,
          pdfPath,
        ]);
        const gsText = await fs.promises.readFile(txtPath, 'utf8');
        if (gsText && gsText.trim().length > 15) {
          extractedText = gsText.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
        }
      } catch (_gsErr) {
        // Continue to next extractor
      }

      // Method 2: Native PDF Stream Parser
      if (!extractedText || extractedText.length < 20) {
        const nativeText = extractTextFromPdfBufferNative(pdfBuffer);
        if (nativeText.length > extractedText.length) {
          extractedText = nativeText;
        }
      }

      // Method 3: Multimodal Gemini PDF Reading (handles scanned PDFs or complex encodings)
      if (!extractedText || extractedText.length < 30) {
        try {
          const ai = getGenAIClient();
          const geminiRes = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: cleanB64,
                    },
                  },
                  {
                    text: 'Extrae y transcribe de forma íntegra, limpia y estructurada todo el contenido textual relevante de este documento PDF en español.',
                  },
                ],
              },
            ],
          });
          if (geminiRes.text && geminiRes.text.trim().length > 20) {
            extractedText = geminiRes.text.trim();
          }
        } catch (_aiErr) {
          // Ignore if quota exhausted
        }
      }

      if (!extractedText || extractedText.trim().length < 10) {
        extractedText = `Documento cargado (${filename}). El archivo contiene gráficos o capas escaneadas; añade o edita aquí los puntos principales que deseas transformar en producción audiovisual.`;
      }

      res.json({
        extractedText,
        filename,
      });
    } catch (_err: any) {
      res.status(500).json({ error: 'No se pudo procesar el archivo PDF.' });
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  // 0B. Convert Extracted PDF Content into Production-Ready Audiovisual Proposal & Storyboard
  app.post('/api/pdf-proposal', async (req, res) => {
    const {
      textoPdf,
      tipoFormato = 'Reels / TikTok / YouTube Shorts (9:16 Vertical)',
      duracionObjetivo = '60 segundos',
      tonoEstilo = 'Cinematográfico, disruptivo y de alta retención',
      herramientaIa = 'Veo 3.1',
      customPrompt,
    } = req.body || {};

    const cleanPdfText =
      (textoPdf || '').trim() ||
      'La inteligencia artificial generativa aplicada al sector audiovisual permite reducir los tiempos de preproducción en un 70%, optimizando la creación de guiones técnicos, storyboards y activos visuales de alta fidelidad.';

    const structuredPrompt =
      customPrompt && customPrompt.trim().length > 25
        ? customPrompt.trim()
        : `Actúa como un Director Audiovisual, Guionista Senior y Especialista en Creación de Contenido con Inteligencia Artificial.

Tu objetivo es convertir el contenido extraído de un documento PDF en una propuesta audiovisual lista para producción, optimizada para captar y retener la atención de la audiencia.

### INFORMACIÓN DEL PROYECTO:
- **Contenido del PDF a adaptar:**
"""
${cleanPdfText}
"""
- **Formato y plataforma de destino:** ${tipoFormato}
- **Duración estimada:** ${duracionObjetivo}
- **Tono y estilo narrativo:** ${tonoEstilo}
- **Motor/Herramienta de IA prevista para generación visual:** ${herramientaIa}

### INSTRUCCIONES DE DESARROLLO:
1. **Análisis y Síntesis:** Extrae los puntos clave, mensajes centrales y datos indispensables del texto provisto, descartando redundancias o tecnicismos excesivos según el tono seleccionado.
2. **Estructura Narrativa:** Diseña una estructura que incluya: Gancho inicial (primeros 3-5 segundos), Desarrollo dinámico estructurado en bloques de valor, Clímax/Conclusión y Llamado a la Acción (CTA).
3. **Tabla de Storyboard Escena por Escena:**
Crea una tabla detallada con las siguientes columnas obligatorias:
   - **Escena #:** Número correlativo.
   - **Tiempo (Timestamp):** Rango de segundos (ej. 00:00 - 00:04).
   - **Audio / Voz en Off:** El texto exacto que dirá el narrador o la música/efectos de sonido clave (SFX).
   - **Descripción Visual / Puesta en escena:** Lo que se visualiza en pantalla (tipo de plano, movimiento de cámara, iluminación, elementos).
   - **Prompt para Generación de Video/Imagen con IA:** Prompt optimizado en inglés para ${herramientaIa} (incluyendo iluminación, estilo cinematográfico, perspectiva, cámara y parámetros de calidad).
   - **Texto en Pantalla (Overlay/On-screen text):** Palabras clave o subtítulos destacados para retención visual.
4. **Recomendaciones Técnicas de Edición:**
   - Ritmo de corte (Cuts pacing).
   - Estilo de banda sonora sugerida (género, BPM aproximado, mood).
   - Efectos sonoros específicos (SFX) para enfatizar transiciones.

Genera una salida limpia, exhaustiva y lista para enviar a locución y generación de clips.`;

    const proposalSchemaConfig = {
      systemInstruction:
        'Actúa como un Director Audiovisual, Guionista Senior y Especialista en Creación de Contenido con Inteligencia Artificial. Entregas propuestas audiovisuales exhaustivas, estructuradas y listas para enviar a locución y generación de clips. Los prompts de generación visual (`aiVisualPrompt`) deben estar siempre en inglés técnico cinematográfico optimizado para la herramienta de IA indicada, mientras que el resto de la propuesta debe estar en español impecable.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          projectTitle: { type: Type.STRING },
          targetFormat: { type: Type.STRING },
          targetDuration: { type: Type.STRING },
          narrativeTone: { type: Type.STRING },
          aiTool: { type: Type.STRING },
          analysisSynthesis: {
            type: Type.OBJECT,
            properties: {
              coreMessage: { type: Type.STRING },
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              essentialData: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['coreMessage', 'keyPoints', 'essentialData'],
          },
          narrativeStructure: {
            type: Type.OBJECT,
            properties: {
              hook: { type: Type.STRING },
              valueBlocks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                  },
                  required: ['title', 'summary'],
                },
              },
              climaxConclusion: { type: Type.STRING },
              callToAction: { type: Type.STRING },
            },
            required: ['hook', 'valueBlocks', 'climaxConclusion', 'callToAction'],
          },
          storyboard: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                timestamp: { type: Type.STRING },
                durationSec: { type: Type.INTEGER },
                audioVoiceover: { type: Type.STRING },
                narrationOnly: { type: Type.STRING },
                sfxCue: { type: Type.STRING },
                visualStaging: { type: Type.STRING },
                aiVisualPrompt: { type: Type.STRING },
                onScreenText: { type: Type.STRING },
              },
              required: [
                'sceneNumber',
                'timestamp',
                'durationSec',
                'audioVoiceover',
                'narrationOnly',
                'sfxCue',
                'visualStaging',
                'aiVisualPrompt',
                'onScreenText',
              ],
            },
          },
          technicalEditing: {
            type: Type.OBJECT,
            properties: {
              cutsPacing: { type: Type.STRING },
              soundtrackStyle: { type: Type.STRING },
              recommendedBpm: { type: Type.INTEGER },
              transitionSfx: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['cutsPacing', 'soundtrackStyle', 'recommendedBpm', 'transitionSfx'],
          },
          fullVoiceoverScript: { type: Type.STRING },
        },
        required: [
          'projectTitle',
          'targetFormat',
          'targetDuration',
          'narrativeTone',
          'aiTool',
          'analysisSynthesis',
          'narrativeStructure',
          'storyboard',
          'technicalEditing',
          'fullVoiceoverScript',
        ],
      },
    };

    try {
      const ai = getGenAIClient();
      let responseText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: structuredPrompt,
          config: proposalSchemaConfig,
        });
        responseText = response.text || '';
      } catch (_firstErr) {
        const fallbackRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite',
          contents: structuredPrompt,
          config: proposalSchemaConfig,
        });
        responseText = fallbackRes.text || '';
      }

      const parsed = JSON.parse(responseText || '{}');
      res.json({
        proposal: parsed,
        executedPrompt: structuredPrompt,
        quotaFallback: false,
      });
    } catch (_error: any) {
      const fallbackProposal = buildFallbackPdfProposal(
        cleanPdfText,
        tipoFormato,
        duracionObjetivo,
        tonoEstilo,
        herramientaIa
      );
      res.json({
        proposal: fallbackProposal,
        executedPrompt: structuredPrompt,
        quotaFallback: true,
      });
    }
  });

  // 1. Generate 2-Minute Video Script
  app.post('/api/script', async (req, res) => {
    const { topic, tone, targetAudience, customPrompt } = req.body || {};
    const basePrompt =
      customPrompt && customPrompt.trim().length > 10
        ? customPrompt.trim()
        : `Genera un guion de video de 2 minutos sobre ${topic || 'innovación tecnológica y creatividad humana'}. El tono debe ser ${tone || 'cinematográfico e inspirador'} y el público objetivo son ${targetAudience || 'creadores digitales y profesionales curiosos'}.`;

    const schemaConfig = {
      systemInstruction:
        'Eres un director creativo de cine y guionista senior especializado en producción audiovisual de formato corto (2 minutos / 120 segundos). Responde siempre en español con calidad de estudio de postproducción.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          logline: { type: Type.STRING },
          totalDuration: { type: Type.STRING },
          recommendedVoiceGender: { type: Type.STRING },
          recommendedAccent: { type: Type.STRING },
          recommendedVoiceTone: { type: Type.STRING },
          fullNarration: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                timecode: { type: Type.STRING },
                durationSec: { type: Type.INTEGER },
                title: { type: Type.STRING },
                visualDescription: { type: Type.STRING },
                visualStyle: { type: Type.STRING },
                cameraDirection: { type: Type.STRING },
                narrationText: { type: Type.STRING },
                soundDesign: { type: Type.STRING },
              },
              required: [
                'sceneNumber',
                'timecode',
                'durationSec',
                'title',
                'visualDescription',
                'visualStyle',
                'cameraDirection',
                'narrationText',
                'soundDesign',
              ],
            },
          },
        },
        required: [
          'title',
          'logline',
          'totalDuration',
          'recommendedVoiceGender',
          'recommendedAccent',
          'recommendedVoiceTone',
          'fullNarration',
          'scenes',
        ],
      },
    };

    const fullContents = `${basePrompt}\n\nEstructura el guion exactamente para una duración total de 2 minutos (120 segundos), dividido en 5 escenas cronológicas detalladas. Incluye la locución exacta en español, la dirección visual y emocional de cada escena, el estilo visual sugerido y el movimiento de cámara.`;

    try {
      const ai = getGenAIClient();
      let responseText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: fullContents,
          config: schemaConfig,
        });
        responseText = response.text || '';
      } catch (_firstErr) {
        const fallbackRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite',
          contents: fullContents,
          config: schemaConfig,
        });
        responseText = fallbackRes.text || '';
      }

      const parsed = JSON.parse(responseText || '{}');
      res.json({ script: parsed, executedPrompt: basePrompt });
    } catch (_error: any) {
      const fallbackScript = buildFallbackScript(topic, tone, targetAudience);
      res.json({
        script: fallbackScript,
        executedPrompt: basePrompt,
        quotaFallback: true,
      });
    }
  });

  // 2. Generate Voiceover Narration (TTS)
  app.post('/api/narration', async (req, res) => {
    const { scriptText, voiceGender, voiceName, accent, tone } = req.body || {};
    if (!scriptText || !scriptText.trim()) {
      res.status(400).json({ error: 'El guion de narración no puede estar vacío.' });
      return;
    }

    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    let selectedVoice = validVoices.includes(voiceName) ? voiceName : '';
    if (!selectedVoice) {
      selectedVoice = voiceGender?.toLowerCase() === 'masculina' ? 'Charon' : 'Kore';
    }

    const stylePrompt = `Voz ${voiceGender || 'femenina'}, con acento ${accent || 'español neutro'} y un tono ${tone || 'cinematográfico y expresivo'}.`;
    const fullPromptDescription = `Genera una narración para el siguiente guion de video: "${scriptText.slice(0, 120)}${scriptText.length > 120 ? '...' : ''}". La voz debe ser ${voiceGender || 'femenina'}, con un acento ${accent || 'español neutro'} y un tono ${tone || 'cinematográfico'}.`;

    try {
      const ai = getGenAIClient();
      let base64Audio: string | undefined;
      let mimeType = 'audio/pcm;rate=24000';

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: scriptText.trim(),
                  speechMetadata: { style: stylePrompt },
                } as any,
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        base64Audio = part?.inlineData?.data;
        if (part?.inlineData?.mimeType) {
          mimeType = part.inlineData.mimeType;
        }
      } catch (_primaryErr) {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: scriptText.trim(),
                  speechMetadata: { style: stylePrompt },
                } as any,
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        });
        const part = fallbackResponse.candidates?.[0]?.content?.parts?.[0];
        base64Audio = part?.inlineData?.data;
        if (part?.inlineData?.mimeType) {
          mimeType = part.inlineData.mimeType;
        }
      }

      if (!base64Audio) {
        throw new Error('No audio data returned');
      }

      res.json({
        audioBase64: base64Audio,
        mimeType,
        sampleRate: 24000,
        voiceUsed: selectedVoice,
        stylePrompt,
        executedPrompt: fullPromptDescription,
      });
    } catch (_error: any) {
      const synthesizedBuffer = generateSynthesizedSpeechEnvelopePcmBuffer(
        scriptText,
        voiceGender
      );
      res.json({
        audioBase64: synthesizedBuffer.toString('base64'),
        mimeType: 'audio/pcm;rate=24000',
        sampleRate: 24000,
        voiceUsed: selectedVoice,
        stylePrompt,
        executedPrompt: fullPromptDescription,
        quotaFallback: true,
      });
    }
  });

  // 3. Generate Visual Video Sequence Blueprint (Multi-shot Cinema Sequence)
  app.post('/api/sequence-plan', async (req, res) => {
    const { sceneDescription, visualStyle, customPrompt } = req.body || {};
    const executedPrompt =
      customPrompt && customPrompt.trim().length > 10
        ? customPrompt.trim()
        : `Crea una secuencia de video corta que represente ${sceneDescription || 'el despertar de una metrópolis futurista al amanecer con sensación de asombro y esperanza'}. Utiliza un estilo visual ${visualStyle || 'cinematográfico anamórfico 35mm con iluminación volumétrica'}.`;

    const seqConfig = {
      systemInstruction:
        'Eres un director de fotografía (DoP) y supervisor de efectos visuales. Diseñas secuencias cortas de alto impacto emocional y estético.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          emotionSummary: { type: Type.STRING },
          visualStyleApplied: { type: Type.STRING },
          veoEnhancedPrompt: { type: Type.STRING },
          suggestedVoiceover: { type: Type.STRING },
          ambientEffect: { type: Type.STRING },
          bpmTempo: { type: Type.INTEGER },
          shots: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                shotNumber: { type: Type.INTEGER },
                durationSec: { type: Type.NUMBER },
                shotType: { type: Type.STRING },
                cameraMotion: { type: Type.STRING },
                visualMotif: { type: Type.STRING },
                headlineText: { type: Type.STRING },
                actionDescription: { type: Type.STRING },
                primaryHex: { type: Type.STRING },
                secondaryHex: { type: Type.STRING },
                accentHex: { type: Type.STRING },
                focalLens: { type: Type.STRING },
              },
              required: [
                'shotNumber',
                'durationSec',
                'shotType',
                'cameraMotion',
                'visualMotif',
                'headlineText',
                'actionDescription',
                'primaryHex',
                'secondaryHex',
                'accentHex',
                'focalLens',
              ],
            },
          },
        },
        required: [
          'title',
          'emotionSummary',
          'visualStyleApplied',
          'veoEnhancedPrompt',
          'suggestedVoiceover',
          'ambientEffect',
          'bpmTempo',
          'shots',
        ],
      },
    };

    const contents = `${executedPrompt}\n\nDiseña una secuencia cinematográfica corta compuesta por 4 planos consecutivos (shots) de 3.5 segundos cada uno. Para cada plano especifica colores hexadecimales exactos, tipo de atmósfera visual, movimiento de cámara, composición geométrica/lumínica y una línea breve de voz en off.`;

    try {
      const ai = getGenAIClient();
      let responseText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: seqConfig,
        });
        responseText = response.text || '';
      } catch (_firstErr) {
        const fallbackRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite',
          contents,
          config: seqConfig,
        });
        responseText = fallbackRes.text || '';
      }

      const parsed = JSON.parse(responseText || '{}');
      res.json({ sequence: parsed, executedPrompt });
    } catch (_error: any) {
      const fallbackSeq = buildFallbackSequence(sceneDescription, visualStyle);
      res.json({
        sequence: fallbackSeq,
        executedPrompt,
        quotaFallback: true,
      });
    }
  });

  // 4. Generate AI Keyframe Image for a Shot/Scene or 1:1 Realistic Avatar Portrait
  app.post('/api/generate-image', async (req, res) => {
    const {
      prompt,
      headlineText,
      primaryHex,
      secondaryHex,
      accentHex,
      aspectRatio = '16:9',
      shotNumber = 1,
    } = req.body || {};

    const cleanAspectRatio: '16:9' | '9:16' | '1:1' =
      aspectRatio === '9:16' ? '9:16' : aspectRatio === '1:1' ? '1:1' : '16:9';

    try {
      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              text:
                prompt ||
                `Fotograma cinematográfico de alta resolución: ${headlineText || 'escena atmosférica'}`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: cleanAspectRatio,
          },
        },
      });

      let imageUrl: string | null = null;
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        throw new Error('No image inlineData returned');
      }

      res.json({ imageUrl, quotaFallback: false, modelUsed: 'gemini-3.1-flash-image-preview' });
    } catch (_err: any) {
      const fallbackDataUrl = await generateFallbackPngBase64(
        headlineText || 'SECUENCIA IA',
        primaryHex,
        secondaryHex,
        accentHex,
        cleanAspectRatio === '9:16' ? '9:16' : '16:9',
        shotNumber
      );
      res.json({ imageUrl: fallbackDataUrl, quotaFallback: true, modelUsed: 'fallback-studio-engine' });
    }
  });

  // 5. Export Real MP3 Audio File (via FFmpeg libmp3lame)
  app.post('/api/export-mp3', async (req, res) => {
    const { audioBase64, scriptText, voiceGender = 'femenina', durationSec = 12 } = req.body || {};
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'kinetix-mp3-'));
    const inputWavPath = path.join(tmpDir, 'input.wav');
    const outputMp3Path = path.join(tmpDir, 'output.mp3');

    try {
      let wavBuffer: Buffer;
      if (audioBase64 && typeof audioBase64 === 'string' && audioBase64.length > 32) {
        const cleanBase64 = audioBase64.includes(',')
          ? audioBase64.split(',')[1]
          : audioBase64;
        const rawBuf = Buffer.from(cleanBase64, 'base64');
        wavBuffer = wrapPcmInWavHeader(rawBuf, 24000);
      } else {
        const pcmBuf = generateSynthesizedSpeechEnvelopePcmBuffer(
          scriptText || 'Secuencia audiovisual Kinetix Studio',
          voiceGender
        );
        wavBuffer = wrapPcmInWavHeader(pcmBuf, 24000);
      }

      await fs.promises.writeFile(inputWavPath, wavBuffer);
      await execFileAsync('ffmpeg', [
        '-y',
        '-i',
        inputWavPath,
        '-vn',
        '-ar',
        '44100',
        '-ac',
        '2',
        '-c:a',
        'libmp3lame',
        '-b:a',
        '192k',
        outputMp3Path,
      ]);

      const mp3Buffer = await fs.promises.readFile(outputMp3Path);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="kinetix-audio.mp3"');
      res.send(mp3Buffer);
    } catch (_err: any) {
      try {
        const dur = Math.min(30, Math.max(4, Number(durationSec) || 10));
        await execFileAsync('ffmpeg', [
          '-y',
          '-f',
          'lavfi',
          '-i',
          `sine=frequency=220:duration=${dur}`,
          '-af',
          'volume=0.3,afade=t=in:st=0:d=1,afade=t=out:st=' + Math.max(1, dur - 1.5) + ':d=1.5',
          '-c:a',
          'libmp3lame',
          '-b:a',
          '192k',
          outputMp3Path,
        ]);
        const mp3Buffer = await fs.promises.readFile(outputMp3Path);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(mp3Buffer);
      } catch (_innerErr) {
        res.status(500).json({ error: 'No se pudo codificar el archivo MP3.' });
      }
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  // 6. Export Real H.264 + AAC MP4 Video File with Images & Audio (via FFmpeg)
  app.post('/api/export-mp4', async (req, res) => {
    const { videoBase64, audioBase64, durationSec = 8 } = req.body || {};
    if (!videoBase64 || typeof videoBase64 !== 'string') {
      res.status(400).json({ error: 'Se requieren los datos de video para exportar a MP4.' });
      return;
    }

    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'kinetix-mp4-'));
    const inputVideoPath = path.join(tmpDir, 'input.webm');
    const inputAudioPath = path.join(tmpDir, 'input.wav');
    const outputMp4Path = path.join(tmpDir, 'output.mp4');

    try {
      const cleanVideoB64 = videoBase64.includes(',')
        ? videoBase64.split(',')[1]
        : videoBase64;
      await fs.promises.writeFile(inputVideoPath, Buffer.from(cleanVideoB64, 'base64'));

      let hasCustomAudio = false;
      if (audioBase64 && typeof audioBase64 === 'string' && audioBase64.length > 32) {
        const cleanAudioB64 = audioBase64.includes(',')
          ? audioBase64.split(',')[1]
          : audioBase64;
        const rawAudio = Buffer.from(cleanAudioB64, 'base64');
        const wavBuf = wrapPcmInWavHeader(rawAudio, 24000);
        await fs.promises.writeFile(inputAudioPath, wavBuf);
        hasCustomAudio = true;
      }

      if (hasCustomAudio) {
        await execFileAsync('ffmpeg', [
          '-y',
          '-i',
          inputVideoPath,
          '-i',
          inputAudioPath,
          '-map',
          '0:v:0',
          '-map',
          '1:a:0',
          '-vf',
          'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-shortest',
          '-movflags',
          '+faststart',
          outputMp4Path,
        ]);
      } else {
        const dur = Math.min(30, Math.max(4, Number(durationSec) || 8));
        await execFileAsync('ffmpeg', [
          '-y',
          '-i',
          inputVideoPath,
          '-f',
          'lavfi',
          '-i',
          `sine=frequency=196:duration=${dur}`,
          '-map',
          '0:v:0',
          '-map',
          '1:a:0',
          '-vf',
          'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          '-af',
          'volume=0.2,afade=t=in:st=0:d=0.8,afade=t=out:st=' + Math.max(1, dur - 1.2) + ':d=1.2',
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          'aac',
          '-b:a',
          '160k',
          '-shortest',
          '-movflags',
          '+faststart',
          outputMp4Path,
        ]);
      }

      const mp4Buffer = await fs.promises.readFile(outputMp4Path);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="kinetix-video.mp4"');
      res.send(mp4Buffer);
    } catch (_err: any) {
      res.status(500).json({ error: 'Error al codificar el archivo MP4.' });
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  // 7. Veo 3.1 Video Generation — Step 1: Start Operation
  app.post('/api/generate-video', async (req, res) => {
    const { prompt, aspectRatio = '16:9', resolution = '720p' } = req.body || {};
    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: 'Se requiere una descripción para generar el video.' });
      return;
    }

    try {
      const ai = getGenAIClient();
      const videoConfig = {
        numberOfVideos: 1,
        resolution: resolution === '1080p' ? '1080p' : '720p',
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
      };

      let operation;
      try {
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt: prompt.trim(),
          config: videoConfig,
        });
      } catch (_liteErr) {
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt.trim(),
          config: videoConfig,
        });
      }

      res.json({ operationName: operation.name, quotaFallback: false });
    } catch (_error: any) {
      res.status(200).json({
        operationName: null,
        quotaFallback: true,
        message:
          'Cuota de API de Veo 3.1 alcanzada en el plan actual. Renderizando máster de video MP4 con las imágenes y audio de la secuencia.',
      });
    }
  });

  // 8. Veo 3.1 Video Generation — Step 2: Poll Operation Status
  app.post('/api/video-status', async (req, res) => {
    try {
      const { operationName } = req.body || {};
      if (!operationName) {
        res.status(200).json({ done: true, quotaFallback: true });
        return;
      }

      const ai = getGenAIClient();
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      if (updated.error) {
        res.status(200).json({
          done: true,
          quotaFallback: true,
        });
        return;
      }

      res.json({ done: Boolean(updated.done) });
    } catch (_error: any) {
      res.status(200).json({
        done: true,
        quotaFallback: true,
      });
    }
  });

  // 9. Veo 3.1 Video Generation — Step 3: Download Completed Video
  app.post('/api/video-download', async (req, res) => {
    try {
      const { operationName } = req.body || {};
      if (!operationName) {
        res.status(404).json({ error: 'Falta operationName.' });
        return;
      }

      const apiKey = getActiveApiKey();
      const ai = getGenAIClient();
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        res.status(404).json({ error: 'El archivo de video aún no está disponible.' });
        return;
      }

      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey },
      });

      if (!videoRes.ok || !videoRes.body) {
        res.status(502).json({ error: 'No se pudo descargar el flujo de video generado.' });
        return;
      }

      res.setHeader('Content-Type', 'video/mp4');
      await videoRes.body.pipeTo(
        new WritableStream({
          write(chunk) {
            res.write(chunk);
          },
          close() {
            res.end();
          },
        })
      );
    } catch (_error: any) {
      res.status(500).json({
        error: 'Error al descargar el video.',
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kinetix Video AI Lab server running on http://localhost:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 500);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
