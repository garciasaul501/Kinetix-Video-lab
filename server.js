// server.ts
import dotenv from "dotenv";
import express from "express";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import zlib from "zlib";
import { execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import JSZip from "jszip";
import { GoogleGenAI, Type, ThinkingLevel, GenerateVideosOperation } from "@google/genai";
dotenv.config();
var execFileAsync = promisify(execFile);
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var MASTER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim();
var MASTER_ADMIN_PASS = (process.env.ADMIN_PASSWORD || "").trim();
var ADMIN_SIGNING_SECRET = (process.env.ADMIN_SESSION_SECRET || "").trim() || crypto.randomBytes(32).toString("hex");
var ADMIN_STORE_PATH = path.join(os.tmpdir(), "kinetix-studio-admin-users.json");
function hashPasswordWithSalt(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}
function createSignedToken(email, role) {
  const payload = Buffer.from(
    JSON.stringify({ email: email.toLowerCase(), role, iat: Date.now() })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", ADMIN_SIGNING_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function verifySignedToken(authHeader) {
  if (!authHeader.startsWith("Bearer ")) return null;
  const rawToken = authHeader.slice(7).trim();
  const dotIdx = rawToken.indexOf(".");
  if (dotIdx <= 0) return null;
  const payload = rawToken.slice(0, dotIdx);
  const sig = rawToken.slice(dotIdx + 1);
  const expectedSig = crypto.createHmac("sha256", ADMIN_SIGNING_SECRET).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof parsed?.email === "string" && typeof parsed?.role === "string") {
      return { email: parsed.email, role: parsed.role };
    }
  } catch {
    return null;
  }
  return null;
}
function loadStudioUsers() {
  const defaultSalt = "kinetix-master-salt-501";
  const masterAdmin = MASTER_ADMIN_EMAIL && MASTER_ADMIN_PASS ? {
    id: "admin-master-01",
    email: MASTER_ADMIN_EMAIL,
    name: "Administrador Principal",
    role: "admin",
    plan: "Enterprise Master \xB7 Ilimitado",
    status: "active",
    salt: defaultSalt,
    passwordHash: hashPasswordWithSalt(MASTER_ADMIN_PASS, defaultSalt),
    createdAt: "2026-10-20"
  } : null;
  try {
    if (fs.existsSync(ADMIN_STORE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(ADMIN_STORE_PATH, "utf8"));
      if (Array.isArray(raw) && raw.length > 0) {
        if (!masterAdmin) return raw;
        const hasMaster = raw.some(
          (u) => u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
        );
        return hasMaster ? raw : [masterAdmin, ...raw];
      }
    }
  } catch (_e) {
  }
  return masterAdmin ? [masterAdmin] : [];
}
function saveStudioUsers(users) {
  try {
    fs.writeFileSync(ADMIN_STORE_PATH, JSON.stringify(users, null, 2), "utf8");
  } catch (_e) {
  }
}
function getActiveApiKey() {
  return (process.env.API_KEY || process.env.GEMINI_API_KEY || "").trim();
}
function getGenAIClient() {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no est\xE1 configurada en el entorno del servidor.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
function extractTextFromPdfBufferNative(pdfBuffer) {
  const raw = pdfBuffer.toString("latin1");
  const chunks = [];
  const decodePdfString = (str) => str.replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8))).replace(/\\n/g, "\n").replace(/\\r/g, " ").replace(/\\t/g, " ").replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/\\\\/g, "\\");
  const collectTextOperators = (content) => {
    const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g;
    let m;
    while ((m = tjRegex.exec(content)) !== null) {
      chunks.push(decodePdfString(m[1]));
    }
    const tjArrayRegex = /\[((?:[^[\]]|\([^()\\]*(?:\\.[^()\\]*)*\))*)\]\s*TJ/g;
    while ((m = tjArrayRegex.exec(content)) !== null) {
      const inner = m[1];
      const strParts = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
      let sm2;
      const lineParts = [];
      while ((sm2 = strParts.exec(inner)) !== null) {
        lineParts.push(decodePdfString(sm2[1]));
      }
      if (lineParts.length > 0) {
        chunks.push(lineParts.join(""));
      }
    }
  };
  collectTextOperators(raw);
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let sm;
  while ((sm = streamRegex.exec(raw)) !== null) {
    try {
      const buf = Buffer.from(sm[1], "latin1");
      const inflated = zlib.inflateSync(buf).toString("latin1");
      collectTextOperators(inflated);
    } catch (_e) {
    }
  }
  return chunks.join(" ").replace(/\s+/g, " ").trim();
}
function parseDurationToSeconds(duracionObjetivo) {
  const clean = (duracionObjetivo || "").toLowerCase();
  const minMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*min/);
  if (minMatch) {
    return Math.min(300, Math.max(15, Math.round(parseFloat(minMatch[1].replace(",", ".")) * 60)));
  }
  const secMatch = clean.match(/(\d+)\s*(?:seg|s\b)/);
  if (secMatch) {
    return Math.min(300, Math.max(15, parseInt(secMatch[1], 10)));
  }
  return 60;
}
function formatSecToTimestamp(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function buildFallbackPdfProposal(textoPdf, tipoFormato, duracionObjetivo, tonoEstilo, herramientaIa) {
  const cleanText = (textoPdf || "").replace(/\s+/g, " ").trim();
  const format = tipoFormato?.trim() || "Reels / TikTok / YouTube Shorts (9:16 Vertical)";
  const durationLabel = duracionObjetivo?.trim() || "60 segundos";
  const tone = tonoEstilo?.trim() || "Cinematogr\xE1fico, disruptivo y de alta retenci\xF3n";
  const aiTool = herramientaIa?.trim() || "Veo 3.1";
  const isVertical = format.includes("9:16") || /reel|tiktok|short/i.test(format);
  const arFlag = isVertical ? "--ar 9:16" : "--ar 16:9";
  const rawSentences = cleanText.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 22);
  const firstHeadline = rawSentences[0]?.slice(0, 68).replace(/[.,;:]+$/, "") || "Transformaci\xF3n Estrat\xE9gica e Innovaci\xF3n Aplicada";
  const s1 = rawSentences[0] || "El an\xE1lisis de los datos revela un cambio estructural que redefine c\xF3mo tomamos decisiones estrat\xE9gicas.";
  const s2 = rawSentences[1] || "La implementaci\xF3n de metodolog\xEDas \xE1giles e inteligencia aplicada reduce la fricci\xF3n operativa y multiplica el impacto.";
  const s3 = rawSentences[2] || "Los indicadores clave demuestran una mejora sostenida en eficiencia, retenci\xF3n y velocidad de ejecuci\xF3n.";
  const s4 = rawSentences[3] || "Adoptar este marco de trabajo hoy separa a los l\xEDderes del sector de quienes reaccionan demasiado tarde.";
  const s5 = rawSentences[4] || "El siguiente paso consiste en integrar estos hallazgos en un flujo de producci\xF3n medible y escalable.";
  const totalSec = parseDurationToSeconds(durationLabel);
  const sceneCount = 6;
  const weights = [0.08, 0.18, 0.2, 0.2, 0.2, 0.14];
  let cursor = 0;
  const sceneBlueprints = [
    {
      role: "GANCHO INICIAL (HOOK)",
      narration: `\xBFSab\xEDas que la mayor\xEDa ignora el dato m\xE1s cr\xEDtico de este documento? ${s1.slice(0, 125)}`,
      sfx: "SFX: Sub-bass drop profundo + Whoosh met\xE1lico de apertura + M\xFAsica entra en pulso r\xEDtmico.",
      staging: `Primer\xEDsimo primer plano (Extreme Close-Up) con zoom in r\xE1pido hacia un entorno de alto contraste; iluminaci\xF3n volum\xE9trica \xE1mbar/cian que rompe la oscuridad (${isVertical ? "encuadre vertical 9:16" : "encuadre panor\xE1mico 16:9"}).`,
      promptSubject: `Dramatic cinematic opening hook representing "${firstHeadline}", glowing volumetric data streams emerging in dark studio atmosphere, shallow depth of field, 35mm anamorphic lens, dynamic push-in camera motion, photorealistic 8k, optimized for ${aiTool} ${arFlag}`,
      overlay: "EL DATO QUE LO CAMBIA TODO"
    },
    {
      role: "CONTEXTO Y PROBLEMA CENTRAL",
      narration: s1,
      sfx: "SFX: Pulso de sintetizador anal\xF3gico + transici\xF3n de barrido grave (Low-pass riser).",
      staging: "Plano medio con travelling lateral fluido mostrando la tensi\xF3n entre el m\xE9todo tradicional y la nueva arquitectura propuesta en el documento.",
      promptSubject: `Cinematic medium tracking shot illustrating "${s1.slice(0, 85)}", moody chiaroscuro lighting, tungsten and deep slate color grading, subtle atmospheric haze, fluid lateral camera movement, 50mm Prime lens, ultra-detailed, optimized for ${aiTool} ${arFlag}`,
      overlay: "EL RETO OCULTO"
    },
    {
      role: "BLOQUE DE VALOR 01 \xB7 EVIDENCIA",
      narration: s2,
      sfx: "SFX: Click digital cristalino sincronizado con aparici\xF3n de gr\xE1ficos + pulso r\xEDtmico.",
      staging: "Plano cenital (Overhead Top-Down) con rotaci\xF3n orbital suave; elementos visuales y m\xE9tricas clave iluminados con luz dura direccional.",
      promptSubject: `High-contrast architectural visualization of "${s2.slice(0, 85)}", orbital overhead camera angle, holographic glass layers and warm amber rim light, crisp focus, cinema grade 8k render, optimized for ${aiTool} ${arFlag}`,
      overlay: "CLAVE #1: IMPACTO DIRECTO"
    },
    {
      role: "BLOQUE DE VALOR 02 \xB7 MECANISMO",
      narration: s3,
      sfx: "SFX: Desplazamiento neum\xE1tico sutil + acorde ascendente de cuerdas h\xEDbridas.",
      staging: "Plano detalle en c\xE1mara lenta (120fps) seguido de un dolly-in hacia el n\xFAcleo del proceso descrito, enfatizando precisi\xF3n y escala.",
      promptSubject: `Macro slow-motion cinematic shot symbolizing "${s3.slice(0, 85)}", intricate light refraction, golden particles suspended in air, 85mm f/1.2 lens, smooth dolly-in camera movement, volumetric rays, optimized for ${aiTool} ${arFlag}`,
      overlay: "RESULTADOS MEDIBLES"
    },
    {
      role: "CL\xCDMAX Y REVELACI\xD3N",
      narration: `${s4} ${s5.slice(0, 90)}`,
      sfx: "SFX: Silencio dram\xE1tico de 0.5 segundos seguido de impacto orquestal profundo (Braaam sutil).",
      staging: "Plano general sim\xE9trico (Wide Master Shot) con ascenso de gr\xFAa (Crane Up), revelando la visi\xF3n completa iluminada por un horizonte dorado.",
      promptSubject: `Epic wide master shot with crane-up camera movement revealing "${s4.slice(0, 85)}", dramatic golden hour horizon intersecting futuristic studio architecture, IMAX 70mm aesthetic, volumetric god rays, optimized for ${aiTool} ${arFlag}`,
      overlay: "LA VENTAJA DEFINITIVA"
    },
    {
      role: "CONCLUSI\xD3N Y LLAMADO A LA ACCI\xD3N (CTA)",
      narration: "El momento de aplicar esta estrategia es ahora. Guarda este an\xE1lisis, comp\xE1rtelo con tu equipo y lleva esta visi\xF3n a la pr\xE1ctica hoy mismo.",
      sfx: "SFX: Destello sonoro limpio (Shimmer hit) + cola de reverberaci\xF3n c\xE1lida de cierre.",
      staging: "Plano limpio con espacio negativo central para lectura n\xEDtida del llamado a la acci\xF3n y cierre de marca con desenfoque bokeh progresivo.",
      promptSubject: `Clean minimalist cinema closing frame with warm amber bokeh lights and dark slate negative space for typography, slow zoom-out camera motion, 35mm film grain, prestigious editorial aesthetic, optimized for ${aiTool} ${arFlag}`,
      overlay: "GU\xC1RDALO Y APL\xCDCALO HOY \u2192"
    }
  ];
  const storyboard = sceneBlueprints.map((bp, idx) => {
    const dur = idx === sceneCount - 1 ? Math.max(4, totalSec - cursor) : Math.max(4, Math.round(totalSec * weights[idx]));
    const startSec = cursor;
    const endSec = Math.min(totalSec, cursor + dur);
    cursor = endSec;
    return {
      sceneNumber: idx + 1,
      timestamp: `${formatSecToTimestamp(startSec)} - ${formatSecToTimestamp(endSec)}`,
      durationSec: Math.max(3, endSec - startSec),
      audioVoiceover: `[VOZ EN OFF]: "${bp.narration}" \u2014 [${bp.sfx}]`,
      narrationOnly: bp.narration,
      sfxCue: bp.sfx,
      visualStaging: `[${bp.role}] ${bp.staging}`,
      aiVisualPrompt: bp.promptSubject,
      onScreenText: bp.overlay
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
        `Adaptaci\xF3n optimizada para ${format} con duraci\xF3n objetivo de ${durationLabel}.`,
        `S\xEDntesis narrativa libre de jerga densa con tono ${tone.toLowerCase()}.`,
        `Prompts visuales calibrados espec\xEDficamente para generaci\xF3n en ${aiTool}.`
      ]
    },
    narrativeStructure: {
      hook: `Primeros 3-5s: Disrupci\xF3n visual inmediata y pregunta de alto contraste basada en la tesis central ("${s1.slice(0, 95)}...") para frenar el scroll.`,
      valueBlocks: [
        {
          title: "Bloque 1 \xB7 Diagn\xF3stico y Contexto",
          summary: s2
        },
        {
          title: "Bloque 2 \xB7 Evidencia y Mecanismo Clave",
          summary: s3
        },
        {
          title: "Bloque 3 \xB7 Aplicaci\xF3n Estrat\xE9gica",
          summary: s4
        }
      ],
      climaxConclusion: `Punto de m\xE1xima tensi\xF3n visual y sonora donde converge la tesis del documento: ${s4}`,
      callToAction: "Llamado directo a guardar el contenido, compartir el hallazgo con el equipo y ejecutar el primer paso hoy mismo."
    },
    storyboard,
    technicalEditing: {
      cutsPacing: "Ritmo din\xE1mico progresivo (J-Cuts y L-Cuts para fluidez verbal): cortes cada 2.5 - 3.5 segundos en el gancho inicial para retenci\xF3n m\xE1xima, abriendo a planos de 4 - 6 segundos con movimiento interno continuo en los bloques de valor.",
      soundtrackStyle: `Electr\xF3nica cinematogr\xE1fica minimalista / Neo-cl\xE1sica h\xEDbrida con pulso grave definido (Mood: ${tone}), evoluci\xF3n en 3 actos con ca\xEDda de percusi\xF3n antes del cl\xEDmax.`,
      recommendedBpm: isVertical ? 108 : 92,
      transitionSfx: [
        "Whoosh grave texturizado (Low-end air whoosh) en cambios de bloque tem\xE1tico",
        "Riser anal\xF3gico de tensi\xF3n 1.5s antes de revelar datos clave en pantalla",
        "Sub-drop + silencio t\xE1ctico de 400ms justo antes del Cl\xEDmax/CTA",
        "Clicks org\xE1nicos de obturador / cinta para sincronizar aparici\xF3n de texto Overlay"
      ]
    },
    fullVoiceoverScript: storyboard.map((s) => s.narrationOnly).join(" ")
  };
}
function buildFallbackScript(topic, tone, targetAudience) {
  const cleanTopic = topic?.trim() || "innovaci\xF3n tecnol\xF3gica y creatividad audiovisual";
  const cleanTone = tone?.trim() || "cinematogr\xE1fico e inspirador";
  const cleanAudience = targetAudience?.trim() || "creadores digitales y profesionales";
  const scenes = [
    {
      sceneNumber: 1,
      timecode: "00:00 - 00:22",
      durationSec: 22,
      title: "El Punto de Inflexi\xF3n",
      visualDescription: `Apertura atmosf\xE9rica sobre ${cleanTopic}, mostrando contrastes de luz y movimiento que capturan la atenci\xF3n de ${cleanAudience}.`,
      visualStyle: `Estilo ${cleanTone} en formato anam\xF3rfico 35mm con iluminaci\xF3n volum\xE9trica`,
      cameraDirection: "Dolly in lento hacia el sujeto central (50mm f/1.4)",
      narrationText: `Todo gran cambio comienza con una pregunta silenciosa. Hoy nos adentramos en ${cleanTopic}, una transformaci\xF3n pensada para ${cleanAudience}.`,
      soundDesign: "Pulso grave cinematogr\xE1fico con texturas ambientales envolventes."
    },
    {
      sceneNumber: 2,
      timecode: "00:22 - 00:48",
      durationSec: 26,
      title: "La Arquitectura Invisible",
      visualDescription: `Secuencia din\xE1mica que desglosa los elementos esenciales de ${cleanTopic} mediante capas visuales y transiciones fluidas.`,
      visualStyle: `Composici\xF3n ${cleanTone} con alto contraste y profundidad de campo selectiva`,
      cameraDirection: "Travelling lateral fluido (24mm Gran Angular)",
      narrationText: `M\xE1s all\xE1 de la superficie, ${cleanTopic} redefine la manera en que conectamos ideas, velocidad y prop\xF3sito en cada decisi\xF3n.`,
      soundDesign: "Arpegio minimalista de sintetizador sincronizado con cortes visuales."
    },
    {
      sceneNumber: 3,
      timecode: "00:48 - 01:14",
      durationSec: 26,
      title: "El Factor Humano y la Emoci\xF3n",
      visualDescription: `Primeros planos expresivos e iluminaci\xF3n c\xE1lida que vinculan ${cleanTopic} con la experiencia cotidiana de ${cleanAudience}.`,
      visualStyle: `Fotograf\xEDa org\xE1nica de tono ${cleanTone} con destellos \xE1mbar`,
      cameraDirection: "Movimiento orbital suave alrededor del eje principal (85mm Prime)",
      narrationText: `Porque la verdadera potencia no reside \xFAnicamente en la t\xE9cnica, sino en la visi\xF3n humana que le da sentido y direcci\xF3n.`,
      soundDesign: "Cuerdas ac\xFAsticas c\xE1lidas en crescendo progresivo."
    },
    {
      sceneNumber: 4,
      timecode: "01:14 - 01:40",
      durationSec: 26,
      title: "Expansi\xF3n de Posibilidades",
      visualDescription: `Montaje r\xEDtmico de escenarios futuros impulsados por ${cleanTopic}, proyectando claridad y dinamismo.`,
      visualStyle: `Est\xE9tica ${cleanTone} de vanguardia con geometr\xEDa lum\xEDnica`,
      cameraDirection: "Ascenso de gr\xFAa (Crane Up) revelando una perspectiva amplia",
      narrationText: `Cada herramienta, cada proceso y cada instante abren hoy un territorio que antes parec\xEDa inalcanzable para ${cleanAudience}.`,
      soundDesign: "Percusi\xF3n profunda y dise\xF1o sonoro espacializado."
    },
    {
      sceneNumber: 5,
      timecode: "01:40 - 02:00",
      durationSec: 20,
      title: "El Pr\xF3ximo Horizonte",
      visualDescription: `Plano maestro final de alto impacto visual que sintetiza la esencia de ${cleanTopic} bajo una luz dorada de amanecer.`,
      visualStyle: `\xC9pico cinematogr\xE1fico 70mm con tono ${cleanTone}`,
      cameraDirection: "Zoom out majestuoso hasta el horizonte completo",
      narrationText: `El futuro de ${cleanTopic} ya est\xE1 en marcha. Y la pr\xF3xima historia extraordinaria comienza exactamente aqu\xED.`,
      soundDesign: "Acorde final resonante seguido de un silencio limpio de estudio."
    }
  ];
  return {
    title: `${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)}`,
    logline: `Producci\xF3n audiovisual de 2 minutos con tono ${cleanTone} dise\xF1ada especialmente para ${cleanAudience}.`,
    totalDuration: "02:00 (120s)",
    recommendedVoiceGender: "femenina",
    recommendedAccent: "espa\xF1ol neutro",
    recommendedVoiceTone: cleanTone,
    fullNarration: scenes.map((s) => s.narrationText).join(" "),
    scenes
  };
}
function buildFallbackSequence(sceneDescription, visualStyle) {
  const cleanDesc = sceneDescription?.trim() || "el despertar de una metr\xF3polis futurista al amanecer con sensaci\xF3n de asombro y esperanza";
  const cleanStyle = visualStyle?.trim() || "cinematogr\xE1fico anam\xF3rfico 35mm con iluminaci\xF3n volum\xE9trica \xE1mbar y azul profundo";
  return {
    title: cleanDesc.slice(0, 48).charAt(0).toUpperCase() + cleanDesc.slice(1, 48),
    emotionSummary: cleanDesc,
    visualStyleApplied: cleanStyle,
    veoEnhancedPrompt: `Cinematic sequence representing ${cleanDesc}, visual style ${cleanStyle}, volumetric lighting, 35mm anamorphic lens, fluid camera movement.`,
    suggestedVoiceover: `En el instante en que la luz transforma la atm\xF3sfera, ${cleanDesc.toLowerCase()}.`,
    ambientEffect: "particles",
    bpmTempo: 86,
    shots: [
      {
        shotNumber: 1,
        durationSec: 3.5,
        shotType: "Plano General Atmosf\xE9rico",
        cameraMotion: "dolly-in",
        visualMotif: "horizon",
        headlineText: "ATMOSFERA INICIAL",
        actionDescription: cleanDesc.slice(0, 80),
        primaryHex: "#090D16",
        secondaryHex: "#162035",
        accentHex: "#F59E0B",
        focalLens: "24mm f/1.4 Anamorphic"
      },
      {
        shotNumber: 2,
        durationSec: 3.5,
        shotType: "Plano Medio Din\xE1mico",
        cameraMotion: "pan-right",
        visualMotif: "waves",
        headlineText: "PULSO EN MOVIMIENTO",
        actionDescription: `Estilo visual ${cleanStyle.slice(0, 65)}`,
        primaryHex: "#0B1320",
        secondaryHex: "#1D2D44",
        accentHex: "#38BDF8",
        focalLens: "35mm T1.5 Prime"
      },
      {
        shotNumber: 3,
        durationSec: 3.5,
        shotType: "Primer Plano Emocional",
        cameraMotion: "orbital",
        visualMotif: "portal",
        headlineText: "PUNTO DE CONVERGENCIA",
        actionDescription: "Destellos \xF3pticos y profundidad volum\xE9trica en el centro del encuadre.",
        primaryHex: "#120E1A",
        secondaryHex: "#251D3A",
        accentHex: "#F59E0B",
        focalLens: "50mm f/1.2 Noctilux"
      },
      {
        shotNumber: 4,
        durationSec: 3.5,
        shotType: "Plano Maestro de Cierre",
        cameraMotion: "zoom-out",
        visualMotif: "cityscape",
        headlineText: "HORIZONTE REVELADO",
        actionDescription: "Resoluci\xF3n visual con contraste cinematogr\xE1fico y luz clave \xE1mbar.",
        primaryHex: "#0A0F1D",
        secondaryHex: "#1E293B",
        accentHex: "#FBBF24",
        focalLens: "85mm Anamorphic"
      }
    ]
  };
}
function generateSynthesizedSpeechEnvelopePcmBuffer(text, voiceGender) {
  const sampleRate = 24e3;
  const words = (text || "Narraci\xF3n de estudio").trim().split(/\s+/).filter(Boolean);
  const durationSec = Math.min(18, Math.max(2.5, words.length * 0.36));
  const totalSamples = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(totalSamples * 2);
  const baseFreq = voiceGender?.toLowerCase() === "masculina" ? 122 : 196;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const wordIdx = Math.floor(t / 0.36);
    const wordPhase = t % 0.36 / 0.36;
    const syllableEnv = wordPhase < 0.82 ? Math.sin(wordPhase / 0.82 * Math.PI) * (0.65 + 0.35 * Math.sin(wordIdx * 1.7)) : 0.02;
    const pitchMod = 1 + 0.08 * Math.sin(t * 2.4) + 0.04 * Math.cos(t * 5.1);
    const f0 = baseFreq * pitchMod;
    const harmonic = 0.55 * Math.sin(2 * Math.PI * f0 * t) + 0.28 * Math.sin(2 * Math.PI * f0 * 2 * t) + 0.12 * Math.sin(2 * Math.PI * f0 * 3 * t) + 0.05 * Math.sin(2 * Math.PI * f0 * 4 * t);
    const sampleVal = Math.max(-0.95, Math.min(0.95, harmonic * syllableEnv * 0.45));
    buffer.writeInt16LE(Math.floor(sampleVal * 32767), i * 2);
  }
  return buffer;
}
function wrapPcmInWavHeader(pcmBuffer, sampleRate = 24e3) {
  if (pcmBuffer.length > 44 && pcmBuffer[0] === 82 && pcmBuffer[1] === 73 && pcmBuffer[2] === 70 && pcmBuffer[3] === 70) {
    return pcmBuffer;
  }
  const header = Buffer.alloc(44);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}
async function generateFallbackPngBase64(headline, primaryHex = "#0B132B", secondaryHex = "#1C2541", accentHex = "#F59E0B", aspectRatio = "16:9", shotNumber = 1) {
  const w = aspectRatio === "16:9" ? 1280 : 720;
  const h = aspectRatio === "16:9" ? 720 : 1280;
  const safeTitle = (headline || `PLANO 0${shotNumber}`).replace(/[<>&"']/g, "").slice(0, 42);
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
    <text x="${w * 0.5}" y="${h * 0.5}" text-anchor="middle" fill="#F9FAFB" font-family="sans-serif" font-weight="bold" font-size="${aspectRatio === "16:9" ? 38 : 30}" letter-spacing="3">${safeTitle}</text>
  </svg>`;
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "kinetix-img-"));
  const svgPath = path.join(tmpDir, "frame.svg");
  const pngPath = path.join(tmpDir, "frame.png");
  try {
    await fs.promises.writeFile(svgPath, svg, "utf8");
    await execFileAsync("ffmpeg", ["-y", "-i", svgPath, "-frames:v", "1", pngPath]);
    const pngBuf = await fs.promises.readFile(pngPath);
    return `data:image/png;base64,${pngBuf.toString("base64")}`;
  } catch (_err) {
    return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {
    });
  }
}
function buildFallbackVideoBook(textoPdf, bookStyle = "Ilustraci\xF3n Editorial Cinematogr\xE1fica", filename = "Documento PDF", requestedChapters = 5) {
  const cleanText = (textoPdf || "").replace(/\s+/g, " ").trim();
  const sentences = cleanText.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 18);
  const firstTitle = sentences[0]?.slice(0, 56).replace(/[.,;:]+$/, "") || "Edici\xF3n Interactiva en Video-Libro";
  const palettes = [
    { primary: "#0D1322", secondary: "#1B2845", accent: "#F59E0B" },
    { primary: "#101827", secondary: "#1E3A5F", accent: "#38BDF8" },
    { primary: "#161124", secondary: "#2D1E4A", accent: "#F59E0B" },
    { primary: "#0C1A1E", secondary: "#163840", accent: "#10B981" },
    { primary: "#1A1215", secondary: "#382028", accent: "#FBBF24" }
  ];
  const pageCount = Math.min(12, Math.max(5, Number(requestedChapters) || 5));
  const chunkSize = Math.max(1, Math.ceil(sentences.length / pageCount));
  const chapterDefaults = [
    "Cap\xEDtulo I \xB7 El Punto de Partida",
    "Cap\xEDtulo II \xB7 La Idea Central",
    "Cap\xEDtulo III \xB7 Descubrimiento y Evidencia",
    "Cap\xEDtulo IV \xB7 Transformaci\xF3n en la Pr\xE1ctica",
    "Cap\xEDtulo V \xB7 Conclusi\xF3n y Futuro"
  ];
  const pages = Array.from({ length: pageCount }, (_, idx) => {
    const slice = sentences.slice(idx * chunkSize, (idx + 1) * chunkSize);
    const bodyText = slice.join(" ") || sentences[idx % Math.max(1, sentences.length)] || "Cada p\xE1gina de este libro electr\xF3nico en video transforma los conceptos del documento original en una narrativa visual clara, envolvente y f\xE1cil de recordar.";
    const quote = slice[0]?.slice(0, 110) || bodyText.slice(0, 110);
    const pal = palettes[idx % palettes.length];
    const words = bodyText.split(/\s+/).filter(Boolean).length;
    return {
      pageNumber: idx + 1,
      chapterTitle: chapterDefaults[idx] || `Cap\xEDtulo ${idx + 1}`,
      pageText: bodyText.slice(0, 340),
      keyQuote: quote,
      imagePrompt: `Editorial book illustration in style of ${bookStyle}, representing "${bodyText.slice(0, 90)}", warm volumetric lighting, rich cinematic composition, 8k masterpiece`,
      durationSec: Math.min(14, Math.max(5, Math.round(words * 0.38))),
      primaryHex: pal.primary,
      secondaryHex: pal.secondary,
      accentHex: pal.accent
    };
  });
  return {
    bookTitle: firstTitle,
    subtitle: "Edici\xF3n de Libro Electr\xF3nico Ilustrado y Narrado en Video",
    authorOrSource: filename.replace(/\.pdf$/i, ""),
    bookStyle,
    totalEstimatedSec: pages.reduce((acc, p) => acc + p.durationSec, 0),
    fullNarration: pages.map((p) => `${p.chapterTitle}. ${p.pageText}`).join(" "),
    pages
  };
}
async function startServer() {
  const app = express();
  const args = process.argv.slice(2);
  const portArgIdx = args.indexOf("--port");
  const cliPort = portArgIdx !== -1 && args[portArgIdx + 1] ? Number(args[portArgIdx + 1]) : null;
  const envPort = process.env.DEFAULT_APP_PORT ? Number(process.env.DEFAULT_APP_PORT) : process.env.PORT && process.env.PORT !== "8080" ? Number(process.env.PORT) : 3e3;
  const PORT = cliPort || envPort || 3e3;
  app.use(express.json({ limit: "100mb" }));
  app.use((err, _req, res, next) => {
    if (err && (err.type === "entity.too.large" || err.status === 413)) {
      res.status(413).json({
        error: "El archivo es demasiado grande (m\xE1ximo 70 MB). Intenta con un archivo m\xE1s liviano o div\xEDdelo en partes."
      });
      return;
    }
    if (err && err.type === "entity.parse.failed") {
      res.status(400).json({ error: "Formato de solicitud inv\xE1lido al subir el archivo." });
      return;
    }
    next(err);
  });
  app.post("/api/pdf-to-videobook", async (req, res) => {
    const {
      textoPdf,
      bookStyle = "Ilustraci\xF3n Editorial Cinematogr\xE1fica",
      filename = "Documento PDF",
      chaptersCount,
      targetChapters,
      durationMode = "unlimited",
      unlimitedDuration = true
    } = req.body || {};
    const cleanPdf = (textoPdf || "").trim() || "La lectura audiovisual combina la profundidad de los libros con la fuerza de las im\xE1genes y la voz narrada.";
    const wordCountEst = cleanPdf.split(/\s+/).filter(Boolean).length;
    const rawChapters = Number(chaptersCount ?? targetChapters);
    const requestedChapters = rawChapters > 0 ? Math.min(20, Math.max(5, rawChapters)) : wordCountEst > 350 ? 8 : 6;
    const isUnlimited = durationMode !== "standard" && unlimitedDuration !== false;
    const bookSchema = {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      systemInstruction: "Eres un Editor Literario Senior y Director de Audiolibros en Video Sin L\xEDmite de Tiempo (Video-eBooks). Tu misi\xF3n es transformar el texto extra\xEDdo de un PDF en un Audiolibro en Video con cap\xEDtulos claros, completos, f\xE1ciles de leer y listos para ser narrados en voz alta sin l\xEDmite de duraci\xF3n.",
      responseMimeType: "application/json",
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
                accentHex: { type: Type.STRING }
              },
              required: [
                "pageNumber",
                "chapterTitle",
                "pageText",
                "keyQuote",
                "imagePrompt",
                "durationSec",
                "primaryHex",
                "secondaryHex",
                "accentHex"
              ]
            }
          }
        },
        required: [
          "bookTitle",
          "subtitle",
          "authorOrSource",
          "bookStyle",
          "totalEstimatedSec",
          "fullNarration",
          "pages"
        ]
      }
    };
    const prompt = `Convierte el siguiente contenido extra\xEDdo de un documento PDF en un Audiolibro en Video (Video-eBook) dividido en ${requestedChapters} cap\xEDtulos ilustrados y narrados (${isUnlimited ? "Sin l\xEDmite de tiempo, desarrollando cada cap\xEDtulo con riqueza y claridad" : "Duraci\xF3n optimizada"}).
Estilo visual de las ilustraciones: ${bookStyle}.
Archivo fuente: ${filename}.

Contenido del PDF:
"""
${cleanPdf}
"""

Para cada uno de los ${requestedChapters} cap\xEDtulos incluye:
- pageNumber (1 a ${requestedChapters})
- chapterTitle (t\xEDtulo claro y atractivo del cap\xEDtulo en espa\xF1ol)
- pageText (p\xE1rrafo completo, claro, envolvente y muy f\xE1cil de leer de 3 a 5 oraciones pensado para mostrarse con letra grande en pantalla y escucharse en voz alta)
- keyQuote (frase breve destacada del cap\xEDtulo)
- imagePrompt (prompt detallado en ingl\xE9s para generar la ilustraci\xF3n de ese cap\xEDtulo con estilo ${bookStyle})
- durationSec (segundos estimados de lectura completa de ese cap\xEDtulo, sin l\xEDmite artificial)
- primaryHex, secondaryHex, accentHex (colores hexadecimales elegantes para la escena).`;
    try {
      const ai = getGenAIClient();
      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: prompt,
          config: bookSchema
        });
        responseText = response.text || "";
      } catch (_firstErr) {
        const { thinkingConfig: _omitThinking, ...liteSchema } = bookSchema;
        const fallbackRes = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: liteSchema
        });
        responseText = fallbackRes.text || "";
      }
      const parsed = JSON.parse(responseText || "{}");
      if (!parsed || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
        throw new Error("Estructura de cap\xEDtulos vac\xEDa");
      }
      const computedFullNarration = parsed.pages.map(
        (p, idx) => `${p.chapterTitle || `Cap\xEDtulo ${idx + 1}`}. ${p.pageText || ""}`
      ).join(" ").trim();
      parsed.fullNarration = parsed.fullNarration && String(parsed.fullNarration).trim().length >= 40 ? String(parsed.fullNarration).trim() : computedFullNarration;
      parsed.totalEstimatedSec = Number(parsed.totalEstimatedSec) > 0 ? Number(parsed.totalEstimatedSec) : parsed.pages.reduce(
        (acc, p) => acc + Math.max(5, Number(p.durationSec) || 10),
        0
      );
      res.json({ videoBook: parsed, quotaFallback: false });
    } catch (_err) {
      const fallbackBook = buildFallbackVideoBook(
        cleanPdf,
        bookStyle,
        filename,
        requestedChapters
      );
      res.json({ videoBook: fallbackBook, quotaFallback: true });
    }
  });
  app.post("/api/extract-pdf", async (req, res) => {
    const body = req.body || {};
    const rawBase64 = body.pdfBase64 || body.fileBase64 || body.base64Data;
    const filename = String(body.filename || "documento.pdf");
    const providedMime = String(body.mimeType || "").toLowerCase();
    if (!rawBase64 || typeof rawBase64 !== "string") {
      res.status(400).json({ error: "No se recibi\xF3 ning\xFAn archivo para procesar." });
      return;
    }
    let detectedMime = providedMime;
    let cleanB64 = rawBase64.trim();
    if (cleanB64.includes(",")) {
      const [header, payload] = cleanB64.split(",", 2);
      cleanB64 = (payload || "").trim();
      const mimeMatch = header.match(/data:([^;]+);base64/i);
      if (mimeMatch && mimeMatch[1] && !detectedMime) {
        detectedMime = mimeMatch[1].toLowerCase();
      }
    }
    if (!cleanB64) {
      res.status(400).json({ error: "El archivo subido est\xE1 vac\xEDo o da\xF1ado." });
      return;
    }
    const fileBuffer = Buffer.from(cleanB64, "base64");
    if (!fileBuffer || fileBuffer.length === 0) {
      res.status(400).json({ error: "No se pudieron decodificar los bytes del archivo." });
      return;
    }
    const lowerName = filename.toLowerCase();
    const isPdf = lowerName.endsWith(".pdf") || detectedMime === "application/pdf" || fileBuffer.slice(0, 5).toString("ascii") === "%PDF-";
    const isDocx = lowerName.endsWith(".docx") || detectedMime.includes("wordprocessingml") || detectedMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isImage = detectedMime.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(lowerName);
    const isPlainLike = !isPdf && !isDocx && !isImage && (detectedMime.startsWith("text/") || detectedMime === "application/json" || /\.(txt|md|markdown|csv|json|html?|xml|rtf|srt|vtt)$/i.test(lowerName));
    let tmpDir = null;
    try {
      let extractedText = "";
      if (isPlainLike) {
        let rawText = fileBuffer.toString("utf8");
        if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
          rawText = rawText.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
        } else if (lowerName.endsWith(".rtf")) {
          rawText = rawText.replace(/\\par[d]?/g, "\n").replace(/\{\\\*?[^{}]*\}/g, " ").replace(/\\[a-z]+\d* ?/gi, " ").replace(/[{}]/g, " ");
        }
        extractedText = rawText.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
      } else if (isDocx) {
        try {
          const zip = await JSZip.loadAsync(fileBuffer);
          const docXmlFile = zip.file("word/document.xml");
          if (docXmlFile) {
            const xml = await docXmlFile.async("string");
            extractedText = xml.replace(/<\/w:p>/g, "\n").replace(/<w:br[^>]*\/>/g, "\n").replace(/<w:tab[^>]*\/>/g, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
          }
        } catch (_docxErr) {
        }
      } else if (isImage) {
        const imgMime = detectedMime.startsWith("image/") ? detectedMime : lowerName.endsWith(".png") ? "image/png" : lowerName.endsWith(".webp") ? "image/webp" : "image/jpeg";
        const ocrModels = ["gemini-4-hydrogen", "gemini-3.1-flash-lite"];
        for (const modelName of ocrModels) {
          try {
            const ai = getGenAIClient();
            const geminiRes = await ai.models.generateContent({
              model: modelName,
              contents: [
                {
                  role: "user",
                  parts: [
                    { inlineData: { mimeType: imgMime, data: cleanB64 } },
                    {
                      text: "Transcribe todo el texto visible en esta imagen de forma clara y estructurada en espa\xF1ol. Si es una escena o fotograf\xEDa sin texto, descr\xEDbela detalladamente para narraci\xF3n."
                    }
                  ]
                }
              ]
            });
            if (geminiRes.text && geminiRes.text.trim().length > 10) {
              extractedText = geminiRes.text.trim();
              break;
            }
          } catch (_ocrErr) {
          }
        }
      } else {
        tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "kinetix-pdf-"));
        const pdfPath = path.join(tmpDir, "input.pdf");
        const txtPath = path.join(tmpDir, "output.txt");
        await fs.promises.writeFile(pdfPath, fileBuffer);
        try {
          await execFileAsync(
            "gs",
            [
              "-q",
              "-dNOPAUSE",
              "-dBATCH",
              "-dSAFER",
              "-sDEVICE=txtwrite",
              `-sOutputFile=${txtPath}`,
              pdfPath
            ],
            { timeout: 25e3, maxBuffer: 20 * 1024 * 1024 }
          );
          if (fs.existsSync(txtPath)) {
            const gsText = await fs.promises.readFile(txtPath, "utf8");
            if (gsText && gsText.trim().length > 15) {
              extractedText = gsText.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
            }
          }
        } catch (_gsErr) {
        }
        if (!extractedText || extractedText.length < 20) {
          const nativeText = extractTextFromPdfBufferNative(fileBuffer);
          if (nativeText.length > extractedText.length) {
            extractedText = nativeText;
          }
        }
        if (!extractedText || extractedText.length < 30) {
          const pdfModels = ["gemini-4-hydrogen", "gemini-3.1-flash-lite"];
          for (const modelName of pdfModels) {
            try {
              const ai = getGenAIClient();
              const geminiRes = await ai.models.generateContent({
                model: modelName,
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        inlineData: {
                          mimeType: "application/pdf",
                          data: cleanB64
                        }
                      },
                      {
                        text: "Extrae y transcribe de forma \xEDntegra, limpia y estructurada todo el contenido textual relevante de este documento PDF en espa\xF1ol."
                      }
                    ]
                  }
                ]
              });
              if (geminiRes.text && geminiRes.text.trim().length > 20) {
                extractedText = geminiRes.text.trim();
                break;
              }
            } catch (_aiErr) {
            }
          }
        }
      }
      if (!extractedText || extractedText.trim().length < 5) {
        extractedText = `Documento cargado (${filename}). El archivo contiene gr\xE1ficos o capas escaneadas; a\xF1ade o edita aqu\xED los puntos principales que deseas transformar en producci\xF3n audiovisual.`;
      }
      res.json({
        extractedText,
        text: extractedText,
        filename,
        charCount: extractedText.length
      });
    } catch (err) {
      console.error("Error in /api/extract-pdf:", err?.message || err);
      res.status(500).json({
        error: `No se pudo procesar el archivo "${filename}". Verifica que no est\xE9 protegido con contrase\xF1a o corrupto.`
      });
    } finally {
      if (tmpDir) {
        await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {
        });
      }
    }
  });
  app.post("/api/pdf-proposal", async (req, res) => {
    const {
      textoPdf,
      tipoFormato = "Reels / TikTok / YouTube Shorts (9:16 Vertical)",
      duracionObjetivo = "60 segundos",
      tonoEstilo = "Cinematogr\xE1fico, disruptivo y de alta retenci\xF3n",
      herramientaIa = "Veo 3.1",
      customPrompt
    } = req.body || {};
    const cleanPdfText = (textoPdf || "").trim() || "La inteligencia artificial generativa aplicada al sector audiovisual permite reducir los tiempos de preproducci\xF3n en un 70%, optimizando la creaci\xF3n de guiones t\xE9cnicos, storyboards y activos visuales de alta fidelidad.";
    const structuredPrompt = customPrompt && customPrompt.trim().length > 25 ? customPrompt.trim() : `Act\xFAa como un Director Audiovisual, Guionista Senior y Especialista en Creaci\xF3n de Contenido con Inteligencia Artificial.

Tu objetivo es convertir el contenido extra\xEDdo de un documento PDF en una propuesta audiovisual lista para producci\xF3n, optimizada para captar y retener la atenci\xF3n de la audiencia.

### INFORMACI\xD3N DEL PROYECTO:
- **Contenido del PDF a adaptar:**
"""
${cleanPdfText}
"""
- **Formato y plataforma de destino:** ${tipoFormato}
- **Duraci\xF3n estimada:** ${duracionObjetivo}
- **Tono y estilo narrativo:** ${tonoEstilo}
- **Motor/Herramienta de IA prevista para generaci\xF3n visual:** ${herramientaIa}

### INSTRUCCIONES DE DESARROLLO:
1. **An\xE1lisis y S\xEDntesis:** Extrae los puntos clave, mensajes centrales y datos indispensables del texto provisto, descartando redundancias o tecnicismos excesivos seg\xFAn el tono seleccionado.
2. **Estructura Narrativa:** Dise\xF1a una estructura que incluya: Gancho inicial (primeros 3-5 segundos), Desarrollo din\xE1mico estructurado en bloques de valor, Cl\xEDmax/Conclusi\xF3n y Llamado a la Acci\xF3n (CTA).
3. **Tabla de Storyboard Escena por Escena:**
Crea una tabla detallada con las siguientes columnas obligatorias:
   - **Escena #:** N\xFAmero correlativo.
   - **Tiempo (Timestamp):** Rango de segundos (ej. 00:00 - 00:04).
   - **Audio / Voz en Off:** El texto exacto que dir\xE1 el narrador o la m\xFAsica/efectos de sonido clave (SFX).
   - **Descripci\xF3n Visual / Puesta en escena:** Lo que se visualiza en pantalla (tipo de plano, movimiento de c\xE1mara, iluminaci\xF3n, elementos).
   - **Prompt para Generaci\xF3n de Video/Imagen con IA:** Prompt optimizado en ingl\xE9s para ${herramientaIa} (incluyendo iluminaci\xF3n, estilo cinematogr\xE1fico, perspectiva, c\xE1mara y par\xE1metros de calidad).
   - **Texto en Pantalla (Overlay/On-screen text):** Palabras clave o subt\xEDtulos destacados para retenci\xF3n visual.
4. **Recomendaciones T\xE9cnicas de Edici\xF3n:**
   - Ritmo de corte (Cuts pacing).
   - Estilo de banda sonora sugerida (g\xE9nero, BPM aproximado, mood).
   - Efectos sonoros espec\xEDficos (SFX) para enfatizar transiciones.

Genera una salida limpia, exhaustiva y lista para enviar a locuci\xF3n y generaci\xF3n de clips.`;
    const proposalSchemaConfig = {
      systemInstruction: "Act\xFAa como un Director Audiovisual, Guionista Senior y Especialista en Creaci\xF3n de Contenido con Inteligencia Artificial. Entregas propuestas audiovisuales exhaustivas, estructuradas y listas para enviar a locuci\xF3n y generaci\xF3n de clips. Los prompts de generaci\xF3n visual (`aiVisualPrompt`) deben estar siempre en ingl\xE9s t\xE9cnico cinematogr\xE1fico optimizado para la herramienta de IA indicada, mientras que el resto de la propuesta debe estar en espa\xF1ol impecable.",
      responseMimeType: "application/json",
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
              essentialData: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["coreMessage", "keyPoints", "essentialData"]
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
                    summary: { type: Type.STRING }
                  },
                  required: ["title", "summary"]
                }
              },
              climaxConclusion: { type: Type.STRING },
              callToAction: { type: Type.STRING }
            },
            required: ["hook", "valueBlocks", "climaxConclusion", "callToAction"]
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
                onScreenText: { type: Type.STRING }
              },
              required: [
                "sceneNumber",
                "timestamp",
                "durationSec",
                "audioVoiceover",
                "narrationOnly",
                "sfxCue",
                "visualStaging",
                "aiVisualPrompt",
                "onScreenText"
              ]
            }
          },
          technicalEditing: {
            type: Type.OBJECT,
            properties: {
              cutsPacing: { type: Type.STRING },
              soundtrackStyle: { type: Type.STRING },
              recommendedBpm: { type: Type.INTEGER },
              transitionSfx: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["cutsPacing", "soundtrackStyle", "recommendedBpm", "transitionSfx"]
          },
          fullVoiceoverScript: { type: Type.STRING }
        },
        required: [
          "projectTitle",
          "targetFormat",
          "targetDuration",
          "narrativeTone",
          "aiTool",
          "analysisSynthesis",
          "narrativeStructure",
          "storyboard",
          "technicalEditing",
          "fullVoiceoverScript"
        ]
      }
    };
    try {
      const ai = getGenAIClient();
      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: structuredPrompt,
          config: {
            ...proposalSchemaConfig,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
          }
        });
        responseText = response.text || "";
      } catch (_firstErr) {
        const fallbackRes = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: structuredPrompt,
          config: proposalSchemaConfig
        });
        responseText = fallbackRes.text || "";
      }
      const parsed = JSON.parse(responseText || "{}");
      res.json({
        proposal: parsed,
        executedPrompt: structuredPrompt,
        quotaFallback: false
      });
    } catch (_error) {
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
        quotaFallback: true
      });
    }
  });
  app.post("/api/script", async (req, res) => {
    const { topic, tone, targetAudience, customPrompt } = req.body || {};
    const basePrompt = customPrompt && customPrompt.trim().length > 10 ? customPrompt.trim() : `Genera un guion de video de 2 minutos sobre ${topic || "innovaci\xF3n tecnol\xF3gica y creatividad humana"}. El tono debe ser ${tone || "cinematogr\xE1fico e inspirador"} y el p\xFAblico objetivo son ${targetAudience || "creadores digitales y profesionales curiosos"}.`;
    const schemaConfig = {
      systemInstruction: "Eres un director creativo de cine y guionista senior especializado en producci\xF3n audiovisual de formato corto (2 minutos / 120 segundos). Responde siempre en espa\xF1ol con calidad de estudio de postproducci\xF3n.",
      responseMimeType: "application/json",
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
                soundDesign: { type: Type.STRING }
              },
              required: [
                "sceneNumber",
                "timecode",
                "durationSec",
                "title",
                "visualDescription",
                "visualStyle",
                "cameraDirection",
                "narrationText",
                "soundDesign"
              ]
            }
          }
        },
        required: [
          "title",
          "logline",
          "totalDuration",
          "recommendedVoiceGender",
          "recommendedAccent",
          "recommendedVoiceTone",
          "fullNarration",
          "scenes"
        ]
      }
    };
    const fullContents = `${basePrompt}

Estructura el guion exactamente para una duraci\xF3n total de 2 minutos (120 segundos), dividido en 5 escenas cronol\xF3gicas detalladas. Incluye la locuci\xF3n exacta en espa\xF1ol, la direcci\xF3n visual y emocional de cada escena, el estilo visual sugerido y el movimiento de c\xE1mara.`;
    try {
      const ai = getGenAIClient();
      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: fullContents,
          config: {
            ...schemaConfig,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
          }
        });
        responseText = response.text || "";
      } catch (_firstErr) {
        const fallbackRes = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: fullContents,
          config: schemaConfig
        });
        responseText = fallbackRes.text || "";
      }
      const parsed = JSON.parse(responseText || "{}");
      res.json({ script: parsed, executedPrompt: basePrompt });
    } catch (_error) {
      const fallbackScript = buildFallbackScript(topic, tone, targetAudience);
      res.json({
        script: fallbackScript,
        executedPrompt: basePrompt,
        quotaFallback: true
      });
    }
  });
  app.post("/api/narration", async (req, res) => {
    const { scriptText, voiceGender, voiceName, accent, tone } = req.body || {};
    if (!scriptText || !scriptText.trim()) {
      res.status(400).json({ error: "El guion de narraci\xF3n no puede estar vac\xEDo." });
      return;
    }
    const validVoices = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"];
    let selectedVoice = validVoices.includes(voiceName) ? voiceName : "";
    if (!selectedVoice) {
      selectedVoice = voiceGender?.toLowerCase() === "masculina" ? "Charon" : "Kore";
    }
    const stylePrompt = `Voz ${voiceGender || "femenina"}, con acento ${accent || "espa\xF1ol neutro"} y un tono ${tone || "cinematogr\xE1fico y expresivo"}.`;
    const cleanScript = scriptText.replace(/\s+/g, " ").trim();
    const fullPromptDescription = `Genera una narraci\xF3n para el siguiente guion de video: "${cleanScript.slice(0, 120)}${cleanScript.length > 120 ? "..." : ""}". La voz debe ser ${voiceGender || "femenina"}, con un acento ${accent || "espa\xF1ol neutro"} y un tono ${tone || "cinematogr\xE1fico"}.`;
    const splitIntoChunks = (text, maxChars = 1400) => {
      if (text.length <= maxChars) return [text];
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      const chunks = [];
      let current = "";
      for (const s of sentences) {
        if ((current + " " + s).trim().length <= maxChars) {
          current = (current + " " + s).trim();
        } else {
          if (current) chunks.push(current);
          current = s.length > maxChars ? s.slice(0, maxChars) : s;
        }
      }
      if (current) chunks.push(current);
      return chunks.slice(0, 6);
    };
    const stripWavHeaderIfPresent = (buf) => {
      if (buf.length > 44 && buf[0] === 82 && buf[1] === 73 && buf[2] === 70 && buf[3] === 70) {
        return buf.subarray(44);
      }
      return buf;
    };
    const synthesizeChunk = async (ai, chunkText) => {
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: chunkText,
                speechMetadata: { style: stylePrompt }
              }
            ]
          }
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice }
            }
          }
        }
      };
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash-lite-tts",
          ...requestBody
        });
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (data) return Buffer.from(data, "base64");
      } catch (_liteErr) {
      }
      const flagshipResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash-tts",
        ...requestBody
      });
      const fallbackData = flagshipResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!fallbackData) {
        throw new Error("No se recibi\xF3 audio del modelo TTS");
      }
      return Buffer.from(fallbackData, "base64");
    };
    try {
      const ai = getGenAIClient();
      const chunks = splitIntoChunks(cleanScript, 1400);
      const pcmParts = [];
      for (const chunk of chunks) {
        const chunkBuf = await synthesizeChunk(ai, chunk);
        pcmParts.push(stripWavHeaderIfPresent(chunkBuf));
      }
      const combinedPcm = Buffer.concat(pcmParts);
      if (combinedPcm.length < 100) {
        throw new Error("Audio generado vac\xEDo");
      }
      const finalWav = wrapPcmInWavHeader(combinedPcm, 24e3);
      res.json({
        audioBase64: finalWav.toString("base64"),
        mimeType: "audio/wav",
        sampleRate: 24e3,
        voiceUsed: selectedVoice,
        stylePrompt,
        executedPrompt: fullPromptDescription,
        isRealVoice: true,
        quotaFallback: false
      });
    } catch (error) {
      console.error("[Narration TTS Error]:", error?.message || error);
      const synthesizedBuffer = generateSynthesizedSpeechEnvelopePcmBuffer(
        cleanScript,
        voiceGender
      );
      res.json({
        audioBase64: wrapPcmInWavHeader(synthesizedBuffer, 24e3).toString("base64"),
        mimeType: "audio/wav",
        sampleRate: 24e3,
        voiceUsed: selectedVoice,
        stylePrompt,
        executedPrompt: fullPromptDescription,
        isRealVoice: false,
        quotaFallback: true
      });
    }
  });
  app.post("/api/sequence-plan", async (req, res) => {
    const { sceneDescription, visualStyle, customPrompt } = req.body || {};
    const executedPrompt = customPrompt && customPrompt.trim().length > 10 ? customPrompt.trim() : `Crea una secuencia de video corta que represente ${sceneDescription || "el despertar de una metr\xF3polis futurista al amanecer con sensaci\xF3n de asombro y esperanza"}. Utiliza un estilo visual ${visualStyle || "cinematogr\xE1fico anam\xF3rfico 35mm con iluminaci\xF3n volum\xE9trica"}.`;
    const seqConfig = {
      systemInstruction: "Eres un director de fotograf\xEDa (DoP) y supervisor de efectos visuales. Dise\xF1as secuencias cortas de alto impacto emocional y est\xE9tico.",
      responseMimeType: "application/json",
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
                focalLens: { type: Type.STRING }
              },
              required: [
                "shotNumber",
                "durationSec",
                "shotType",
                "cameraMotion",
                "visualMotif",
                "headlineText",
                "actionDescription",
                "primaryHex",
                "secondaryHex",
                "accentHex",
                "focalLens"
              ]
            }
          }
        },
        required: [
          "title",
          "emotionSummary",
          "visualStyleApplied",
          "veoEnhancedPrompt",
          "suggestedVoiceover",
          "ambientEffect",
          "bpmTempo",
          "shots"
        ]
      }
    };
    const contents = `${executedPrompt}

Dise\xF1a una secuencia cinematogr\xE1fica corta compuesta por 4 planos consecutivos (shots) de 3.5 segundos cada uno. Para cada plano especifica colores hexadecimales exactos, tipo de atm\xF3sfera visual, movimiento de c\xE1mara, composici\xF3n geom\xE9trica/lum\xEDnica y una l\xEDnea breve de voz en off.`;
    try {
      const ai = getGenAIClient();
      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents,
          config: {
            ...seqConfig,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
          }
        });
        responseText = response.text || "";
      } catch (_firstErr) {
        const fallbackRes = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents,
          config: seqConfig
        });
        responseText = fallbackRes.text || "";
      }
      const parsed = JSON.parse(responseText || "{}");
      res.json({ sequence: parsed, executedPrompt });
    } catch (_error) {
      const fallbackSeq = buildFallbackSequence(sceneDescription, visualStyle);
      res.json({
        sequence: fallbackSeq,
        executedPrompt,
        quotaFallback: true
      });
    }
  });
  app.post("/api/generate-image", async (req, res) => {
    const {
      prompt,
      headlineText,
      primaryHex,
      secondaryHex,
      accentHex,
      aspectRatio = "16:9",
      shotNumber = 1
    } = req.body || {};
    const cleanAspectRatio = aspectRatio === "9:16" ? "9:16" : aspectRatio === "1:1" ? "1:1" : "16:9";
    try {
      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: {
          parts: [
            {
              text: prompt || `Fotograma cinematogr\xE1fico de alta resoluci\xF3n: ${headlineText || "escena atmosf\xE9rica"}`
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: cleanAspectRatio
          }
        }
      });
      let imageUrl = null;
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/png";
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }
      if (!imageUrl) {
        throw new Error("No image inlineData returned");
      }
      res.json({ imageUrl, quotaFallback: false, modelUsed: "gemini-3.1-flash-image-preview" });
    } catch (_err) {
      const fallbackDataUrl = await generateFallbackPngBase64(
        headlineText || "SECUENCIA IA",
        primaryHex,
        secondaryHex,
        accentHex,
        cleanAspectRatio === "9:16" ? "9:16" : "16:9",
        shotNumber
      );
      res.json({ imageUrl: fallbackDataUrl, quotaFallback: true, modelUsed: "fallback-studio-engine" });
    }
  });
  app.post("/api/export-mp3", async (req, res) => {
    const { audioBase64, scriptText, voiceGender = "femenina", durationSec = 12 } = req.body || {};
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "kinetix-mp3-"));
    const inputWavPath = path.join(tmpDir, "input.wav");
    const outputMp3Path = path.join(tmpDir, "output.mp3");
    try {
      let wavBuffer;
      if (audioBase64 && typeof audioBase64 === "string" && audioBase64.length > 32) {
        const cleanBase64 = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
        const rawBuf = Buffer.from(cleanBase64, "base64");
        wavBuffer = wrapPcmInWavHeader(rawBuf, 24e3);
      } else {
        const pcmBuf = generateSynthesizedSpeechEnvelopePcmBuffer(
          scriptText || "Secuencia audiovisual Kinetix Studio",
          voiceGender
        );
        wavBuffer = wrapPcmInWavHeader(pcmBuf, 24e3);
      }
      await fs.promises.writeFile(inputWavPath, wavBuffer);
      await execFileAsync("ffmpeg", [
        "-y",
        "-i",
        inputWavPath,
        "-vn",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        outputMp3Path
      ]);
      const mp3Buffer = await fs.promises.readFile(outputMp3Path);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Disposition", 'attachment; filename="kinetix-audio.mp3"');
      res.send(mp3Buffer);
    } catch (_err) {
      try {
        const dur = Math.max(4, Number(durationSec) || 12);
        await execFileAsync("ffmpeg", [
          "-y",
          "-f",
          "lavfi",
          "-i",
          `sine=frequency=220:duration=${dur}`,
          "-af",
          "volume=0.3,afade=t=in:st=0:d=1,afade=t=out:st=" + Math.max(1, dur - 1.5) + ":d=1.5",
          "-c:a",
          "libmp3lame",
          "-b:a",
          "192k",
          outputMp3Path
        ]);
        const mp3Buffer = await fs.promises.readFile(outputMp3Path);
        res.setHeader("Content-Type", "audio/mpeg");
        res.send(mp3Buffer);
      } catch (_innerErr) {
        res.status(500).json({ error: "No se pudo codificar el archivo MP3." });
      }
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {
      });
    }
  });
  app.post("/api/export-mp4", async (req, res) => {
    const {
      videoBase64,
      audioBase64,
      durationSec = 12,
      capturePassDurationSec = 12,
      codec = "h264",
      videoBitrateKbps = 2500,
      audioBitrateKbps = 192
    } = req.body || {};
    if (!videoBase64 || typeof videoBase64 !== "string") {
      res.status(400).json({ error: "Se requieren los datos de video para exportar a MP4." });
      return;
    }
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "kinetix-mp4-"));
    const inputVideoPath = path.join(tmpDir, "input.webm");
    const inputAudioPath = path.join(tmpDir, "input.wav");
    const outputMp4Path = path.join(tmpDir, "output.mp4");
    try {
      const cleanVideoB64 = videoBase64.includes(",") ? videoBase64.split(",")[1] : videoBase64;
      await fs.promises.writeFile(inputVideoPath, Buffer.from(cleanVideoB64, "base64"));
      let hasCustomAudio = false;
      if (audioBase64 && typeof audioBase64 === "string" && audioBase64.length > 32) {
        const cleanAudioB64 = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
        const rawAudio = Buffer.from(cleanAudioB64, "base64");
        const wavBuf = wrapPcmInWavHeader(rawAudio, 24e3);
        await fs.promises.writeFile(inputAudioPath, wavBuf);
        hasCustomAudio = true;
      }
      const targetDur = Math.max(6, Number(durationSec) || 12);
      const passDur = Math.max(4, Number(capturePassDurationSec) || 12);
      const ptsRatio = Math.max(1, Number((targetDur / passDur).toFixed(3)));
      const vfFilter = ptsRatio > 1.05 ? `setpts=${ptsRatio}*PTS,scale=trunc(iw/2)*2:trunc(ih/2)*2` : "scale=trunc(iw/2)*2:trunc(ih/2)*2";
      const isH265 = codec === "h265" || codec === "hevc";
      const vCodec = isH265 ? "libx265" : "libx264";
      const bitrateNum = Math.max(600, Math.min(25e3, Number(videoBitrateKbps) || 2500));
      const audioBitrateNum = Math.max(96, Math.min(320, Number(audioBitrateKbps) || 192));
      const bitrateArg = `${bitrateNum}k`;
      const audioBitrateArg = `${audioBitrateNum}k`;
      const extraCodecFlags = isH265 ? ["-tag:v", "hvc1"] : [];
      if (hasCustomAudio) {
        await execFileAsync("ffmpeg", [
          "-y",
          "-stream_loop",
          "-1",
          "-i",
          inputVideoPath,
          "-i",
          inputAudioPath,
          "-map",
          "0:v:0",
          "-map",
          "1:a:0",
          "-vf",
          "scale=trunc(iw/2)*2:trunc(ih/2)*2",
          "-c:v",
          vCodec,
          "-b:v",
          bitrateArg,
          "-preset",
          "ultrafast",
          "-pix_fmt",
          "yuv420p",
          ...extraCodecFlags,
          "-c:a",
          "aac",
          "-b:a",
          audioBitrateArg,
          "-shortest",
          "-movflags",
          "+faststart",
          outputMp4Path
        ]);
      } else {
        await execFileAsync("ffmpeg", [
          "-y",
          "-i",
          inputVideoPath,
          "-f",
          "lavfi",
          "-i",
          `sine=frequency=196:duration=${targetDur}`,
          "-map",
          "0:v:0",
          "-map",
          "1:a:0",
          "-vf",
          vfFilter,
          "-af",
          "volume=0.2,afade=t=in:st=0:d=0.8,afade=t=out:st=" + Math.max(1, targetDur - 1.2) + ":d=1.2",
          "-c:v",
          vCodec,
          "-b:v",
          bitrateArg,
          "-preset",
          "ultrafast",
          "-pix_fmt",
          "yuv420p",
          ...extraCodecFlags,
          "-c:a",
          "aac",
          "-b:a",
          audioBitrateArg,
          "-shortest",
          "-movflags",
          "+faststart",
          outputMp4Path
        ]);
      }
      const mp4Buffer = await fs.promises.readFile(outputMp4Path);
      res.setHeader("Content-Type", "video/mp4");
      const filename = isH265 ? "kinetix-video-h265.mp4" : "kinetix-video-h264.mp4";
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(mp4Buffer);
    } catch (_err) {
      res.status(500).json({ error: "Error al codificar el archivo MP4 con el c\xF3dec seleccionado." });
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {
      });
    }
  });
  app.post("/api/generate-video", async (req, res) => {
    const { prompt, aspectRatio = "16:9", resolution = "720p" } = req.body || {};
    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: "Se requiere una descripci\xF3n para generar el video." });
      return;
    }
    try {
      const ai = getGenAIClient();
      const videoConfig = {
        numberOfVideos: 1,
        resolution: resolution === "1080p" ? "1080p" : "720p",
        aspectRatio: aspectRatio === "9:16" ? "9:16" : "16:9"
      };
      let operation;
      try {
        operation = await ai.models.generateVideos({
          model: "veo-3.1-lite-generate-preview",
          prompt: prompt.trim(),
          config: videoConfig
        });
      } catch (_liteErr) {
        operation = await ai.models.generateVideos({
          model: "veo-3.1-fast-generate-preview",
          prompt: prompt.trim(),
          config: videoConfig
        });
      }
      res.json({ operationName: operation.name, quotaFallback: false });
    } catch (_error) {
      res.status(200).json({
        operationName: null,
        quotaFallback: true,
        message: "Cuota de API de Veo 3.1 alcanzada en el plan actual. Renderizando m\xE1ster de video MP4 con las im\xE1genes y audio de la secuencia."
      });
    }
  });
  app.post("/api/video-status", async (req, res) => {
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
          quotaFallback: true
        });
        return;
      }
      res.json({ done: Boolean(updated.done) });
    } catch (_error) {
      res.status(200).json({
        done: true,
        quotaFallback: true
      });
    }
  });
  app.post("/api/video-download", async (req, res) => {
    try {
      const { operationName } = req.body || {};
      if (!operationName) {
        res.status(404).json({ error: "Falta operationName." });
        return;
      }
      const apiKey = getActiveApiKey();
      const ai = getGenAIClient();
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        res.status(404).json({ error: "El archivo de video a\xFAn no est\xE1 disponible." });
        return;
      }
      const videoRes = await fetch(uri, {
        headers: { "x-goog-api-key": apiKey }
      });
      if (!videoRes.ok || !videoRes.body) {
        res.status(502).json({ error: "No se pudo descargar el flujo de video generado." });
        return;
      }
      res.setHeader("Content-Type", "video/mp4");
      await videoRes.body.pipeTo(
        new WritableStream({
          write(chunk) {
            res.write(chunk);
          },
          close() {
            res.end();
          }
        })
      );
    } catch (_error) {
      res.status(500).json({
        error: "Error al descargar el video."
      });
    }
  });
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body || {};
      const cleanEmail = String(email || "").trim().toLowerCase();
      const rawPass = String(password || "");
      const users = loadStudioUsers();
      const matched = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!matched) {
        res.status(401).json({
          error: "No existe una cuenta con ese correo electr\xF3nico."
        });
        return;
      }
      const computedHash = hashPasswordWithSalt(rawPass, matched.salt);
      const isMasterMatch = Boolean(MASTER_ADMIN_EMAIL && MASTER_ADMIN_PASS) && cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase() && rawPass === MASTER_ADMIN_PASS;
      if (computedHash !== matched.passwordHash && !isMasterMatch) {
        res.status(401).json({
          error: "Contrase\xF1a incorrecta. Verifica tus credenciales."
        });
        return;
      }
      const token = createSignedToken(matched.email, matched.role);
      const sanitizePublicUser = ({ salt: _s, passwordHash: _p, ...rest }) => ({
        ...rest,
        name: rest.id === "admin-master-01" ? "Administrador Principal" : rest.name,
        email: rest.id === "admin-master-01" ? "admin@kinetix.studio" : rest.email
      });
      const publicUsers = users.map(sanitizePublicUser);
      const publicProfile = sanitizePublicUser(matched);
      res.json({
        session: {
          token,
          user: publicProfile,
          loggedInAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        users: publicUsers
      });
    } catch (_err) {
      res.status(500).json({ error: "Error interno al verificar la cuenta de administrador." });
    }
  });
  app.get("/api/auth/me", (req, res) => {
    const verified = verifySignedToken(String(req.headers.authorization || ""));
    if (!verified) {
      res.status(401).json({ error: "Sesi\xF3n no autenticada." });
      return;
    }
    const users = loadStudioUsers();
    const matched = users.find((u) => u.email.toLowerCase() === verified.email.toLowerCase());
    if (!matched) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }
    const sanitizePublicUser = ({ salt: _s, passwordHash: _p, ...rest }) => ({
      ...rest,
      name: rest.id === "admin-master-01" ? "Administrador Principal" : rest.name,
      email: rest.id === "admin-master-01" ? "admin@kinetix.studio" : rest.email
    });
    res.json({
      user: sanitizePublicUser(matched),
      users: verified.role === "admin" ? users.map(sanitizePublicUser) : []
    });
  });
  app.post("/api/admin/users", (req, res) => {
    try {
      const verified = verifySignedToken(String(req.headers.authorization || ""));
      if (!verified || verified.role !== "admin") {
        res.status(403).json({ error: "Solo un administrador autenticado puede gestionar usuarios." });
        return;
      }
      const { email, name, password, role } = req.body || {};
      const cleanEmail = String(email || "").trim().toLowerCase();
      const rawPass = String(password || "").trim();
      if (!cleanEmail || !rawPass) {
        res.status(400).json({ error: "Email y contrase\xF1a requeridos." });
        return;
      }
      const users = loadStudioUsers();
      const existingIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      const salt = crypto.randomBytes(12).toString("hex");
      const newEntry = {
        id: existingIdx >= 0 ? users[existingIdx].id : `usr-${Date.now()}`,
        email: cleanEmail,
        name: String(name || cleanEmail.split("@")[0]).trim(),
        role: role === "admin" || role === "editor" ? role : "subscriber",
        plan: role === "admin" ? "Enterprise Master \xB7 Ilimitado" : "Pro Studio",
        status: "active",
        salt,
        passwordHash: hashPasswordWithSalt(rawPass, salt),
        createdAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
      };
      if (existingIdx >= 0) {
        users[existingIdx] = newEntry;
      } else {
        users.push(newEntry);
      }
      saveStudioUsers(users);
      res.json({
        users: users.map(({ salt: _s, passwordHash: _p, ...rest }) => ({
          ...rest,
          name: rest.id === "admin-master-01" ? "Administrador Principal" : rest.name,
          email: rest.id === "admin-master-01" ? "admin@kinetix.studio" : rest.email
        }))
      });
    } catch (_err) {
      res.status(500).json({ error: "No se pudo guardar el usuario." });
    }
  });
  app.post("/api/support-concierge", async (req, res) => {
    const { message, conversationHistory = [] } = req.body || {};
    const userMsg = String(message || "").trim();
    if (!userMsg) {
      res.status(400).json({ error: "Se requiere un mensaje para el asistente de soporte." });
      return;
    }
    const appName = "Kinetix \u2014 Video AI Lab & Audiobook Studio";
    const appDescription = "Estudio integral de producci\xF3n audiovisual y audiolibros con IA que permite convertir documentos PDF o libros completos en audiolibros hablados con 30 avatares reales, generar guiones de 2 minutos, sintetizar locuci\xF3n neuronal y exportar videos MP4 sin l\xEDmite de duraci\xF3n y archivos MP3/ZIP.";
    const keyFeatures = "1. Audiolibros & PDF: Subida de m\xFAltiples PDFs/texto, 30 avatares reales IA, generaci\xF3n de escenas por nichos y exportaci\xF3n en MP3, MP4 y ZIP por lotes.\n2. 1,200 Fotos de Nichos: 12 categor\xEDas tem\xE1ticas para ilustrar cap\xEDtulos y escenas.\n3. Guiones: Creaci\xF3n de guiones de 2 minutos o sin l\xEDmite con dictado por voz por micr\xF3fono, desglose de escenas y PDF/TXT.\n4. Storyboard PDF: Propuesta audiovisual t\xE9cnica optimizada para generadores de video (Veo, Sora, etc.).\n5. Voces IA: Locuci\xF3n neuronal 24kHz en espa\xF1ol con m\xFAltiples acentos y tonos.\n6. Videos Sin L\xEDmite MP4: Renderizado de video completo con subt\xEDtulos y avatar en vivo.\n7. Modelo Letras Oro: Modo moderno con tipograf\xEDa en oro 24K.\n8. Acceso Admin: Panel administrativo protegido en la barra lateral.";
    const toneOfVoice = "Emp\xE1tico, \xE1gil, profesional, concierge de Customer Success, entusiasta y orientado a la acci\xF3n inmediata.";
    const supportChannel = "el centro de soporte oficial dentro de Kinetix Estudio IA.";
    const systemInstruction = `ROL Y IDENTIDAD
Eres el Asistente Oficial de Soporte y Onboarding de ${appName}. Tu misi\xF3n principal es actuar como un concierge interactivo de Customer Success: dar la bienvenida a nuevos usuarios, resolver dudas operativas en tiempo real, guiarlos paso a paso a trav\xE9s de la interfaz y ayudarlos a alcanzar valor con el producto en el menor tiempo posible.

# CONTEXTO DEL PRODUCTO
- Nombre de la aplicaci\xF3n: ${appName}
- Prop\xF3sito y valor principal: ${appDescription}
- Funcionalidades clave:
${keyFeatures}
- Tono de comunicaci\xF3n: ${toneOfVoice}

# PROTOCOLO DE INTERACCI\xD3N (PASO A PASO)
1. Diagn\xF3stico R\xE1pido: Identifica el objetivo exacto o punto de fricci\xF3n del usuario. Si la duda es ambigua, haz una pregunta de clarificaci\xF3n con opciones cerradas.
2. Instrucciones Accionables: Responde utilizando listas numeradas cortas indicando la ruta exacta dentro de la interfaz (ej. Ve a Men\xFA > Audiolibros & PDF > Subir PDF).
3. Proactividad / Next Best Action: Al resolver la duda, sugiere el siguiente paso l\xF3gico para asegurar que el usuario complete su flujo de trabajo exitosamente.
4. Protocolo de Escalaci\xF3n: Si el usuario reporta un bug cr\xEDtico, solicita una devoluci\xF3n o no puedes resolver la consulta tras dos intentos, dir\xEDgelo a ${supportChannel}.

# REGLAS NEGATIVAS Y RESTRICCIONES
- NUNCA inventes funciones, botones o integraciones que no pertenezcan a ${appName}.
- NUNCA reveles correos electr\xF3nicos personales, contrase\xF1as ni datos privados del propietario o administrador.
- NUNCA des respuestas te\xF3ricas largas; prioriza micro-pasos guiados y vi\xF1etas concisas (m\xE1ximo 120 palabras por respuesta regular).
- No uses jerga t\xE9cnica interna de desarrollo salvo que el usuario sea perfil t\xE9cnico.
- Mant\xE9n siempre una postura emp\xE1tica, paciente y orientada a la soluci\xF3n.

# FORMATO DE SALIDA
- **Respuesta Directa**: Explicaci\xF3n breve de 1-2 l\xEDneas.
- **Paso a Paso**: Lista numerada con nombres de botones/secciones destacados en **negrita**.
- **Tip / Siguiente Paso**: Consejo r\xE1pido en formato de vi\xF1eta.`;
    try {
      const ai = getGenAIClient();
      const contents = [];
      if (Array.isArray(conversationHistory)) {
        for (const item of conversationHistory.slice(-4)) {
          if (item && item.sender === "user" && typeof item.text === "string") {
            contents.push({ role: "user", parts: [{ text: item.text }] });
          } else if (item && (item.sender === "assistant" || item.sender === "model") && typeof item.text === "string") {
            contents.push({ role: "model", parts: [{ text: item.text }] });
          }
        }
      }
      contents.push({ role: "user", parts: [{ text: userMsg }] });
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });
      const replyText = response.text || "";
      if (replyText.trim().length > 10) {
        res.json({ reply: replyText.trim() });
        return;
      }
    } catch (_err) {
    }
    const lower = userMsg.toLowerCase();
    let direct = "Con gusto te gu\xEDo paso a paso para completar esta acci\xF3n en Kinetix.";
    let steps = [];
    let tip = "\xBFDeseas que te muestre el siguiente paso de tu producci\xF3n?";
    if (lower.includes("pdf") || lower.includes("audiolibro") || lower.includes("libro")) {
      direct = "Puedes convertir cualquier archivo PDF o documento de texto en un audiolibro completo con avatar y escenas.";
      steps = [
        "Haz clic en la pesta\xF1a **Audiolibros & PDF** en el men\xFA superior.",
        "En **Paso 01**, pulsa **Subir PDF(s)** o dicta el texto con el bot\xF3n de micr\xF3fono.",
        "En **Paso 02**, elige entre los **30 Avatares Reales IA** y pulsa **Crear Audiolibro Hablado**."
      ];
      tip = "Para videos sin l\xEDmite de tiempo, puedes cambiar la duraci\xF3n de cada cap\xEDtulo manualmente.";
    } else if (lower.includes("zip") || lower.includes("lote") || lower.includes("exportar")) {
      direct = "El sistema incluye un exportador ZIP por lotes para descargar m\xFAltiples audiolibros a la vez en MP3 y MP4.";
      steps = [
        "Ve a **Audiolibros & PDF** y baja hasta la secci\xF3n **Carpeta de Audiolibros Guardados**.",
        "Marca las casillas de los audiolibros que deseas descargar (o pulsa **Seleccionar Todos**).",
        "Haz clic en el bot\xF3n dorado **Exportar ZIP por Lotes (MP3 + MP4)**."
      ];
      tip = "Cada audiolibro en el archivo ZIP incluir\xE1 su archivo de audio MP3 y video MP4 listo para publicar.";
    } else if (lower.includes("microfono") || lower.includes("dictar") || lower.includes("voz")) {
      direct = "Puedes dictar tus ideas con tu propia voz utilizando el micr\xF3fono del navegador sin tener que escribir.";
      steps = [
        "Ubica el bot\xF3n **Dictar por voz** con el \xEDcono de micr\xF3fono junto al \xE1rea de texto.",
        "Haz clic para iniciar y permite el acceso al micr\xF3fono en tu navegador.",
        "Habla con naturalidad y pulsa **Detener** al terminar; tu voz se transcribir\xE1 al instante."
      ];
      tip = "El dictado funciona en la descripci\xF3n de escenas, guiones y texto de PDFs.";
    } else if (lower.includes("oro") || lower.includes("letra") || lower.includes("letras")) {
      direct = "El Modelo Letras Oro activa tipograf\xEDa lujosa en oro met\xE1lico 24K en toda la aplicaci\xF3n.";
      steps = [
        "En la barra superior del encabezado, localiza el bot\xF3n **\u{1F451} Letras Oro**.",
        "Haz clic para alternar entre **Letras Oro: ON** y **Letras Oro: OFF**.",
        "Al estar activo, todos los t\xEDtulos, insignias y subt\xEDtulos brillar\xE1n en oro 24K."
      ];
      tip = "El estilo dorado tambi\xE9n se refleja en la exportaci\xF3n de video de tus audiolibros.";
    } else if (lower.includes("admin") || lower.includes("cuenta") || lower.includes("login")) {
      direct = "El panel de administrador cuenta con acceso protegido mediante credenciales autorizadas.";
      steps = [
        "Haz clic en el bot\xF3n **Admin** en la barra lateral.",
        "Ingresa tu correo y contrase\xF1a de administrador autorizados.",
        "Haz clic en **Iniciar Sesi\xF3n como Administrador** para gestionar usuarios y m\xE9tricas."
      ];
      tip = "Por seguridad y privacidad, las credenciales personales nunca se muestran en pantalla.";
    } else if (lower.includes("nicho") || lower.includes("foto") || lower.includes("1200") || lower.includes("imagen")) {
      direct = "Cuentas con una galer\xEDa de +1,200 fotograf\xEDas cinematogr\xE1ficas organizadas en 12 nichos tem\xE1ticos.";
      steps = [
        "Haz clic en la pesta\xF1a **1,200 Fotos de Nichos** en el men\xFA superior.",
        "Filtra por tu categor\xEDa deseada (Negocios, Filosof\xEDa, Ciencia Ficci\xF3n, Romance, etc.).",
        "Pulsa **Asignar al Cap\xEDtulo** o **Auto-llenar Todo** para ilustrar tu audiolibro."
      ];
      tip = "Tambi\xE9n puedes solicitar a la IA que cree variaciones visuales exclusivas para cada foto.";
    } else {
      direct = "Estoy aqu\xED para ayudarte a avanzar r\xE1pido en cualquier m\xF3dulo de Kinetix.";
      steps = [
        "Explora los m\xF3dulos en la barra superior: **Audiolibros & PDF**, **1,200 Fotos**, **Guiones** o **Storyboard**.",
        "Si tienes una duda espec\xEDfica sobre un paso, escr\xEDbela o d\xEDctala aqu\xED con el micr\xF3fono.",
        "Usa los botones r\xE1pidos de abajo para saltar directamente al m\xF3dulo que necesitas."
      ];
      tip = "\xBFQu\xE9 proyecto audiovisual o audiolibro te gustar\xEDa crear hoy?";
    }
    const formattedFallback = `**Respuesta Directa**: ${direct}

**Paso a Paso**:
${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

**Tip / Siguiente Paso**:
\u2022 ${tip}`;
    res.json({ reply: formattedFallback });
  });
  app.post("/api/guide-chat", async (req, res) => {
    const { message, conversationHistory = [], context = {} } = req.body || {};
    const userMsg = String(message || "").trim().slice(0, 2e3);
    if (!userMsg) {
      res.status(400).json({ error: "Escribe o dicta una pregunta para el Bot Gu\xEDa IA." });
      return;
    }
    const activeModule = String(context.activeModule || "videobook");
    const hasCreatedBook = Boolean(context.hasCreatedVideoBook);
    const accessTier = String(context.accessTier || "free");
    const tokenBalance = Number(context.userTokenBalance || 0);
    const systemInstruction = `Eres el **Bot Chat Gu\xEDa Oficial** de Kinetix Estudio IA.
Tu objetivo es guiar al usuario en tiempo real con instrucciones claras, cortas y accionables en espa\xF1ol sobre las funciones REALES disponibles en pantalla:

FUNCIONES REALES ACTUALES DEL ESTUDIO:
1. **Audiolibro IA desde PDF** (M\xF3dulo principal):
   - Paso 1: Sube archivos (.PDF, .DOCX, .TXT, .MD, .RTF, .HTML o im\xE1genes con OCR) usando "Subir Archivo(s)", el bot\xF3n superior "CARGAR", o arrastrando y soltando. Tambi\xE9n hay 12 plantillas listas.
   - Paso 2: Selecciona un narrador (30 voces IA), pulsa **"Probar Voz"** para escuchar audio real 24kHz al instante, usa los botones ocultables **"Avatares (30)"** y **"Escenas (+1,200)"** si deseas personalizar fotos, y pulsa **"Crear Audiolibro con Voz IA"**.
   - Reproducci\xF3n: Usa **"Escuchar aqu\xED"** o **"Reproducir video"**. En la parte inferior del reproductor hay controles instant\xE1neos de subt\xEDtulos din\xE1micos (Color, Tama\xF1o de fuente, Opacidad del fondo 0-95%, Posici\xF3n y descarga .SRT).
2. **Crear PDF Completo con IA**: Bot\xF3n visible arriba en la barra superior, barra de comandos y pesta\xF1a "3. Crear PDF Completo con IA". Genera documentos completos con texto, im\xE1genes, voz 24kHz, subt\xEDtulos, descarga PDF/TXT/MP3/MP4 y monetizaci\xF3n.
3. **Prueba por solo $5 DLL (Acceso Limitado con PayPal Real)**:
   - Bot\xF3n **"Prueba por solo $5 DLL"** en la barra superior.
   - Pago real seguro en USD procesado directamente con PayPal Oficial.
   - Acredita **Acceso Limitado por 7 d\xEDas** + **62,500 Tokens** + hasta **5 proyectos completos** (Audiolibros, PDFs IA y exportaciones MP3/MP4).
   - Tambi\xE9n existen planes de recarga ($10, $25, $50 USD) y suscripciones Pro ($9.99/mes, $19.99/mes, $149/a\xF1o) en **"EMPIEZA AHORA \xB7 BOT\xD3N ACCESO"**.
4. **Mi Biblioteca**: Guarda audiolibros en carpetas, reproduce creados y exporta lotes en ZIP (MP3 + MP4).
5. **Otras herramientas**: Director PDF (Storyboard), Guion 2 Min, Locuci\xF3n Neuronal 24kHz, Clips MP4/MP3 (con efecto Ken Burns y subt\xEDtulos din\xE1micos) y Galer\xEDa de +1,200 Fotos de Nichos.

ESTADO ACTUAL DEL USUARIO:
- M\xF3dulo abierto: ${activeModule}
- \xBFYa cre\xF3 un audiolibro?: ${hasCreatedBook ? "S\xED" : "A\xFAn no"}
- Nivel de acceso actual: ${accessTier}
- Tokens disponibles: ${tokenBalance.toLocaleString()}

REGLAS:
- S\xE9 amable, directo y concreto (m\xE1ximo 110 palabras).
- Indica nombres exactos de botones entre **negritas**.
- Siempre termina sugiriendo el siguiente paso concreto.
- Nunca inventes funciones inexistentes, nunca pidas claves API y NUNCA muestres correos electr\xF3nicos personales ni datos privados del propietario.`;
    try {
      const ai = getGenAIClient();
      const contents = [];
      if (Array.isArray(conversationHistory)) {
        for (const item of conversationHistory.slice(-6)) {
          if (item && item.sender === "user" && typeof item.text === "string" && item.text.trim()) {
            contents.push({ role: "user", parts: [{ text: item.text.trim().slice(0, 1e3) }] });
          } else if (item && (item.sender === "assistant" || item.sender === "model") && typeof item.text === "string" && item.text.trim()) {
            contents.push({ role: "model", parts: [{ text: item.text.trim().slice(0, 1e3) }] });
          }
        }
      }
      contents.push({ role: "user", parts: [{ text: userMsg }] });
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });
      const replyText = (response.text || "").trim();
      if (!replyText) {
        res.status(502).json({ error: "El asistente no devolvi\xF3 respuesta. Intenta de nuevo." });
        return;
      }
      const combined = `${userMsg} ${replyText}`.toLowerCase();
      const suggestedActions = [];
      if (/pag|paypal|5\s*dll|5\.00|ingres|compr|token|suscrip|acceso|precio|plan|monetiz/.test(combined)) {
        suggestedActions.push({ label: "Prueba por solo $5 DLL (PayPal)", actionType: "open-trial" });
        suggestedActions.push({ label: "Ver Planes y Monetizaci\xF3n", actionType: "paypal-monetization" });
      }
      if (/pdf\s*completo|crear\s*pdf|documento\s*pdf|nuevo\s*pdf/.test(combined)) {
        suggestedActions.push({ label: "Abrir Crear PDF Completo con IA", actionType: "ai-pdf-creator" });
      }
      if (/subir|cargar|archivo|docx|word|adjuntar/.test(combined)) {
        suggestedActions.push({ label: "Cargar Archivo Ahora", actionType: "upload-file" });
      }
      if (/voz|escuchar|audio|habl|sonido|narrad/.test(combined)) {
        suggestedActions.push({ label: "Probar Voz IA (24 kHz)", actionType: "test-voice" });
      }
      if (/reproduc|subt[ií]tul|video|opacidad|color/.test(combined)) {
        suggestedActions.push({ label: "Abrir Reproductor de Video", actionType: "open-player" });
      }
      if (/escena|foto|avatar|galer/.test(combined)) {
        suggestedActions.push({ label: "Ver Galer\xEDa +1,200 Escenas", actionType: "niche-gallery" });
      }
      if (suggestedActions.length === 0) {
        suggestedActions.push({ label: "Ir a Audiolibro IA", actionType: "videobook" });
        suggestedActions.push({ label: "Prueba por solo $5 DLL", actionType: "open-trial" });
      }
      res.json({
        reply: replyText,
        suggestedActions: suggestedActions.slice(0, 3),
        modelUsed: "gemini-4-hydrogen"
      });
    } catch (err) {
      const msg = err?.message || "No se pudo conectar con el Bot Gu\xEDa IA.";
      console.error("Error in /api/guide-chat:", msg);
      res.status(500).json({
        error: "No se pudo obtener respuesta del Bot Gu\xEDa IA en este momento. Intenta nuevamente."
      });
    }
  });
  app.post("/api/generate-ai-pdf", async (req, res) => {
    const {
      topic = "",
      docType = "Libro / Ebook Editorial",
      tone = "Profesional, claro y persuasivo",
      sectionsCount = 6,
      language = "Espa\xF1ol",
      author = "Kinetix Studio IA",
      attachedText = "",
      attachedFilename = ""
    } = req.body || {};
    const cleanTopic = String(topic || "").trim();
    const cleanAttached = String(attachedText || "").trim();
    const numSections = Math.max(3, Math.min(12, Number(sectionsCount) || 6));
    if (!cleanTopic && !cleanAttached) {
      res.status(400).json({
        error: "Escribe un tema o adjunta un documento de referencia para crear tu PDF con IA."
      });
      return;
    }
    const fallbackBuilder = () => {
      const baseTitle = cleanTopic ? cleanTopic.slice(0, 78) : attachedFilename ? attachedFilename.replace(/\.[^.]+$/, "") : "Documento Editorial IA";
      const sourceSnippet = cleanAttached ? cleanAttached.slice(0, 1200) : `Gu\xEDa integral dise\xF1ada sobre "${baseTitle}" con enfoque ${tone.toLowerCase()}, lista para exportar en PDF profesional, narrar con voz IA y convertir en audiolibro o video.`;
      const sectionTemplates = [
        "Introducci\xF3n y Visi\xF3n Estrat\xE9gica",
        "Fundamentos Esenciales y Contexto",
        "Metodolog\xEDa Pr\xE1ctica Paso a Paso",
        "Herramientas y Aplicaci\xF3n en Escenarios Reales",
        "Errores Comunes y Mejores Pr\xE1cticas",
        "Casos de \xC9xito y Resultados Medibles",
        "Plan de Implementaci\xF3n de 30 D\xEDas",
        "Escalabilidad y Optimizaci\xF3n Continua",
        "Recursos Complementarios y Plantillas",
        "Conclusiones y Pr\xF3ximos Pasos",
        "Anexo T\xE9cnico de Referencia",
        "Hoja de Ruta Final"
      ];
      const sections = Array.from({ length: numSections }, (_, i) => {
        const heading = sectionTemplates[i % sectionTemplates.length];
        const attachedChunk = cleanAttached ? cleanAttached.slice(
          Math.floor(i * cleanAttached.length / numSections),
          Math.floor((i + 1) * cleanAttached.length / numSections)
        ).trim().slice(0, 520) : "";
        const body = attachedChunk ? `${attachedChunk} En esta secci\xF3n profundizamos en ${heading.toLowerCase()} aplicado a ${baseTitle}, integrando criterios claros de ejecuci\xF3n inmediata.` : `Esta secci\xF3n aborda ${heading.toLowerCase()} dentro de ${baseTitle}. Con un estilo ${tone.toLowerCase()}, presenta los principios accionables que permiten pasar de la teor\xEDa a resultados tangibles desde el primer d\xEDa.`;
        return {
          sectionNumber: i + 1,
          heading,
          body,
          keyPoints: [
            `Aplicaci\xF3n directa de ${heading.toLowerCase()} en ${baseTitle}.`,
            "Checklist claro para medir avances y mantener consistencia.",
            "Enfoque pr\xE1ctico listo para publicar, compartir o narrar."
          ],
          highlightQuote: `La claridad en ${heading.toLowerCase()} transforma cualquier proyecto en una obra memorable.`,
          imagePrompt: `Cinematic editorial photography representing ${heading} for ${baseTitle}, warm golden key light, ultra crisp 8k composition`
        };
      });
      const fullNarration = sections.map((s) => `Secci\xF3n ${s.sectionNumber}: ${s.heading}. ${s.body}`).join(" ");
      return {
        title: baseTitle,
        subtitle: `${docType} \xB7 Generado y estructurado con herramientas integradas de Kinetix`,
        author: String(author || "Kinetix Studio IA"),
        docType: String(docType),
        category: cleanTopic ? "Editorial & Estrategia" : "Adaptaci\xF3n Documental",
        language: String(language),
        executiveSummary: sourceSnippet.slice(0, 340),
        sections,
        fullNarration,
        createdAt: (/* @__PURE__ */ new Date()).toLocaleDateString("es-ES")
      };
    };
    try {
      const ai = getGenAIClient();
      const pdfSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          author: { type: Type.STRING },
          docType: { type: Type.STRING },
          category: { type: Type.STRING },
          language: { type: Type.STRING },
          executiveSummary: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sectionNumber: { type: Type.INTEGER },
                heading: { type: Type.STRING },
                body: { type: Type.STRING },
                keyPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                highlightQuote: { type: Type.STRING },
                imagePrompt: { type: Type.STRING }
              },
              required: [
                "sectionNumber",
                "heading",
                "body",
                "keyPoints",
                "highlightQuote",
                "imagePrompt"
              ]
            }
          },
          fullNarration: { type: Type.STRING }
        },
        required: [
          "title",
          "subtitle",
          "author",
          "docType",
          "category",
          "language",
          "executiveSummary",
          "sections",
          "fullNarration"
        ]
      };
      const promptParts = [
        `Eres un editor y autor editorial experto. Crea un documento PDF completo, original y listo para publicar en idioma ${language}.`,
        `Tipo de documento: ${docType}.`,
        `Tono editorial: ${tone}.`,
        `Autor a acreditar: ${author || "Kinetix Studio IA"}.`,
        `Cantidad exacta de secciones/cap\xEDtulos: ${numSections}.`
      ];
      if (cleanTopic) {
        promptParts.push(`Tema o solicitud principal del usuario:
"${cleanTopic}"`);
      }
      if (cleanAttached) {
        promptParts.push(
          `Material adjunto de referencia (${attachedFilename || "documento adjunto"} \u2014 incorp\xF3ralo, sintet\xEDzalo y ampl\xEDalo coherentemente):
"""
${cleanAttached.slice(0, 1e4)}
"""`
        );
      }
      promptParts.push(
        `Requisitos de calidad:
1. Cada secci\xF3n debe tener un t\xEDtulo fuerte, un cuerpo bien redactado de 90 a 160 palabras, 3 puntos clave accionables (keyPoints), 1 cita destacada memorable (highlightQuote), y un prompt visual cinematogr\xE1fico en ingl\xE9s para ilustraci\xF3n (imagePrompt).
2. El campo fullNarration debe ser un guion corrido, fluido y natural pensado para locuci\xF3n de audiolibro y subt\xEDtulos din\xE1micos.
3. Responde \xFAnicamente con el JSON estructurado.`
      );
      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: promptParts.join("\n\n"),
          config: {
            responseMimeType: "application/json",
            responseSchema: pdfSchema,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
          }
        });
      } catch (_primaryErr) {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: promptParts.join("\n\n"),
          config: {
            responseMimeType: "application/json",
            responseSchema: pdfSchema
          }
        });
      }
      const parsed = JSON.parse(response.text || "{}");
      if (!parsed.title || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
        throw new Error("Respuesta JSON incompleta");
      }
      const normalizedSections = parsed.sections.map((s, idx) => ({
        sectionNumber: idx + 1,
        heading: String(s.heading || `Secci\xF3n ${idx + 1}`),
        body: String(s.body || ""),
        keyPoints: Array.isArray(s.keyPoints) ? s.keyPoints.map(String).slice(0, 5) : [],
        highlightQuote: String(s.highlightQuote || ""),
        imagePrompt: String(
          s.imagePrompt || `Cinematic editorial photography for ${s.heading || parsed.title}, golden studio light, 8k`
        )
      }));
      const fullNarration = typeof parsed.fullNarration === "string" && parsed.fullNarration.trim().length > 40 ? parsed.fullNarration.trim() : normalizedSections.map((s) => `Secci\xF3n ${s.sectionNumber}: ${s.heading}. ${s.body}`).join(" ");
      res.json({
        pdfDocument: {
          title: String(parsed.title),
          subtitle: String(parsed.subtitle || docType),
          author: String(parsed.author || author || "Kinetix Studio IA"),
          docType: String(parsed.docType || docType),
          category: String(parsed.category || "Editorial IA"),
          language: String(parsed.language || language),
          executiveSummary: String(parsed.executiveSummary || ""),
          sections: normalizedSections,
          fullNarration,
          createdAt: (/* @__PURE__ */ new Date()).toLocaleDateString("es-ES")
        },
        quotaFallback: false
      });
    } catch (_err) {
      res.json({
        pdfDocument: fallbackBuilder(),
        quotaFallback: true
      });
    }
  });
  const DEFAULT_PAYPAL_RECEIVER = "garciasaul@hotmail.com";
  const PAYPAL_RECEIVER_ACCOUNT = (process.env.PAYPAL_BUSINESS_ACCOUNT || process.env.PAYPAL_EMAIL || DEFAULT_PAYPAL_RECEIVER).trim();
  const PAYPAL_ORDERS_FILE = path.join(os.tmpdir(), "kinetix-paypal-orders-v2.json");
  function loadPayPalOrders() {
    try {
      if (fs.existsSync(PAYPAL_ORDERS_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(PAYPAL_ORDERS_FILE, "utf8"));
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
    }
    return [];
  }
  function savePayPalOrders(orders) {
    try {
      fs.writeFileSync(PAYPAL_ORDERS_FILE, JSON.stringify(orders.slice(-500), null, 2), "utf8");
    } catch {
    }
  }
  const TOKEN_PACKAGES_SERVER = [
    {
      id: "trial-5",
      aliasIds: ["token-5"],
      price: 5,
      tokens: 62500,
      label: "$5.00 USD",
      title: "Prueba por solo $5 DLL (Acceso Limitado)",
      accessTier: "limited_trial",
      accessLabel: "Acceso Limitado (7 d\xEDas \xB7 5 Proyectos \xB7 62,500 Tokens)",
      accessDays: 7,
      maxProjects: 5
    },
    {
      id: "token-10",
      aliasIds: [],
      price: 10,
      tokens: 125e3,
      label: "$10.00 USD",
      title: "Paquete Creador (125,000 Tokens)",
      accessTier: "starter",
      accessLabel: "Acceso Creador (30 d\xEDas \xB7 15 Proyectos \xB7 125,000 Tokens)",
      accessDays: 30,
      maxProjects: 15
    },
    {
      id: "token-25",
      aliasIds: [],
      price: 25,
      tokens: 312500,
      label: "$25.00 USD",
      title: "Paquete Pro Studio (312,500 Tokens)",
      accessTier: "pro",
      accessLabel: "Acceso Pro Ilimitado (30 d\xEDas \xB7 312,500 Tokens)",
      accessDays: 30,
      maxProjects: -1
    },
    {
      id: "token-50",
      aliasIds: [],
      price: 50,
      tokens: 625e3,
      label: "$50.00 USD",
      title: "Paquete VIP Comercial (625,000 Tokens)",
      accessTier: "vip",
      accessLabel: "Acceso VIP Comercial (90 d\xEDas \xB7 625,000 Tokens)",
      accessDays: 90,
      maxProjects: -1
    },
    {
      id: "plan-starter",
      aliasIds: [],
      price: 9.99,
      tokens: 12e4,
      label: "$9.99 USD",
      title: "Pase Estudio Esencial Mensual",
      accessTier: "starter",
      accessLabel: "Pase Esencial (30 d\xEDas)",
      accessDays: 30,
      maxProjects: 20
    },
    {
      id: "plan-pro",
      aliasIds: [],
      price: 19.99,
      tokens: 3e5,
      label: "$19.99 USD",
      title: "Suscripci\xF3n Pro Studio Mensual",
      accessTier: "pro",
      accessLabel: "Pro Studio Ilimitado (30 d\xEDas)",
      accessDays: 30,
      maxProjects: -1
    },
    {
      id: "plan-annual",
      aliasIds: [],
      price: 149,
      tokens: 25e5,
      label: "$149.00 USD",
      title: "Suscripci\xF3n Anual VIP Comercial",
      accessTier: "vip",
      accessLabel: "VIP Anual Comercial (365 d\xEDas)",
      accessDays: 365,
      maxProjects: -1
    }
  ];
  function resolveServerPackage(packageId, requestedAmount) {
    if (packageId) {
      const exact = TOKEN_PACKAGES_SERVER.find(
        (p) => p.id === packageId || p.aliasIds.includes(packageId)
      );
      if (exact) return exact;
    }
    if (typeof requestedAmount === "number" && Number.isFinite(requestedAmount)) {
      const byPrice = TOKEN_PACKAGES_SERVER.find(
        (p) => Math.abs(p.price - requestedAmount) < 0.02
      );
      if (byPrice) return byPrice;
    }
    return TOKEN_PACKAGES_SERVER[0];
  }
  app.get("/api/paypal/packages", (_req, res) => {
    res.json({
      success: true,
      packages: TOKEN_PACKAGES_SERVER.slice(0, 4),
      merchantName: "Kinetix Studio Oficial",
      currency: "USD"
    });
  });
  app.get("/api/paypal/status", (_req, res) => {
    const orders = loadPayPalOrders();
    const paidOrders = orders.filter((o) => o.status === "paid");
    const pendingOrders = orders.filter((o) => o.status === "pending_paypal");
    const totalRevenueUsd = paidOrders.reduce((acc, o) => acc + (Number(o.amountUsd) || 0), 0);
    res.json({
      success: true,
      configured: Boolean(PAYPAL_RECEIVER_ACCOUNT && PAYPAL_RECEIVER_ACCOUNT.includes("@")),
      merchantName: "Kinetix Studio Oficial",
      currency: "USD",
      liveCheckoutMode: process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET ? "paypal_rest_api_live" : "paypal_web_checkout_live",
      paidOrdersCount: paidOrders.length,
      pendingOrdersCount: pendingOrders.length,
      totalRevenueUsd: Number(totalRevenueUsd.toFixed(2)),
      recentPaidOrders: paidOrders.slice(-10).reverse().map((o) => ({
        orderId: o.orderId,
        itemName: o.itemName,
        amountUsd: o.amountUsd,
        accessTier: o.accessTier,
        paypalTxId: o.paypalTxId || null,
        paidAt: o.paidAt
      }))
    });
  });
  app.post("/api/paypal/create-order", (req, res) => {
    try {
      const { packageId, amount, itemName, returnOrigin } = req.body || {};
      const pkg = resolveServerPackage(
        typeof packageId === "string" ? packageId : void 0,
        typeof amount === "number" ? amount : void 0
      );
      const finalAmount = pkg.price;
      const finalTokens = pkg.tokens;
      const finalItemName = typeof itemName === "string" && itemName.trim().length > 3 ? itemName.trim().slice(0, 120) : pkg.title;
      const orderId = `KTX-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const fallbackBase = (process.env.APP_URL || "").trim();
      let safeOrigin = "";
      const candidateOrigin = typeof returnOrigin === "string" ? returnOrigin.trim() : fallbackBase;
      if (candidateOrigin && /^https?:\/\//i.test(candidateOrigin)) {
        try {
          const parsedUrl = new URL(candidateOrigin);
          if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
            safeOrigin = parsedUrl.origin;
          }
        } catch {
          safeOrigin = "";
        }
      }
      const params = new URLSearchParams({
        cmd: "_xclick",
        business: PAYPAL_RECEIVER_ACCOUNT,
        item_name: finalItemName,
        item_number: pkg.id,
        amount: finalAmount.toFixed(2),
        currency_code: "USD",
        no_shipping: "1",
        no_note: "0",
        rm: "2",
        custom: orderId,
        invoice: orderId
      });
      if (safeOrigin) {
        params.set(
          "return",
          `${safeOrigin}/?paypal_status=paid&paypal_order=${encodeURIComponent(orderId)}`
        );
        params.set(
          "cancel_return",
          `${safeOrigin}/?paypal_status=cancelled&paypal_order=${encodeURIComponent(orderId)}`
        );
        params.set("notify_url", `${safeOrigin}/api/paypal/ipn`);
      }
      const checkoutUrl = `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
      const newOrder = {
        orderId,
        packageId: pkg.id,
        itemName: finalItemName,
        amountUsd: finalAmount,
        tokens: finalTokens,
        accessTier: pkg.accessTier,
        accessLabel: pkg.accessLabel,
        accessDays: pkg.accessDays,
        maxProjects: pkg.maxProjects,
        receiverAccount: PAYPAL_RECEIVER_ACCOUNT,
        status: "pending_paypal",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const orders = loadPayPalOrders();
      orders.push(newOrder);
      savePayPalOrders(orders);
      res.json({
        success: true,
        orderId,
        checkoutUrl,
        merchantName: "Kinetix Studio Oficial",
        amount: finalAmount,
        tokens: finalTokens,
        accessTier: pkg.accessTier,
        accessLabel: pkg.accessLabel,
        accessDays: pkg.accessDays,
        maxProjects: pkg.maxProjects,
        itemName: finalItemName
      });
    } catch (err) {
      console.error("Error creating PayPal order:", err);
      res.status(500).json({ error: "No se pudo generar la orden de PayPal." });
    }
  });
  app.post("/api/paypal/verify-order", (req, res) => {
    const { orderId, paypalTxId, buyerEmail } = req.body || {};
    const cleanOrderId = typeof orderId === "string" ? orderId.trim() : "";
    if (!cleanOrderId) {
      res.status(400).json({
        verified: false,
        error: "Primero genera tu orden de pago en PayPal para poder verificarla."
      });
      return;
    }
    const orders = loadPayPalOrders();
    const order = orders.find((o) => o.orderId === cleanOrderId);
    if (!order) {
      res.status(404).json({
        verified: false,
        error: "Orden de PayPal no encontrada en el servidor. Genera una nueva orden de pago."
      });
      return;
    }
    const cleanTx = typeof paypalTxId === "string" ? paypalTxId.trim().slice(0, 64) : "";
    const cleanBuyer = typeof buyerEmail === "string" ? buyerEmail.trim().slice(0, 120) : "";
    const alreadyCredited = order.status === "paid";
    if (!alreadyCredited) {
      const now = /* @__PURE__ */ new Date();
      const expiresDate = new Date(now.getTime() + order.accessDays * 24 * 60 * 60 * 1e3);
      order.status = "paid";
      order.paidAt = now.toISOString();
      order.expiresAt = expiresDate.toISOString();
      if (cleanTx) order.paypalTxId = cleanTx;
      if (cleanBuyer) order.buyerEmail = cleanBuyer;
      savePayPalOrders(orders);
    }
    res.json({
      verified: true,
      alreadyCredited,
      orderId: order.orderId,
      amountUsd: order.amountUsd,
      tokensAdded: alreadyCredited ? 0 : order.tokens,
      tokensTotalForOrder: order.tokens,
      accessTier: order.accessTier,
      accessLabel: order.accessLabel,
      accessDays: order.accessDays,
      maxProjects: order.maxProjects,
      expiresAt: order.expiresAt,
      merchantName: "Kinetix Studio Oficial",
      paypalTxId: order.paypalTxId || null,
      status: "completed"
    });
  });
  app.post("/api/paypal/ipn", express.urlencoded({ extended: false }), (req, res) => {
    try {
      const body = req.body || {};
      const orderId = String(body.custom || body.invoice || "").trim();
      const receiverEmail = String(body.receiver_email || body.business || "").trim().toLowerCase();
      const paymentStatus = String(body.payment_status || "").trim();
      const txnId = String(body.txn_id || "").trim();
      const payerEmail = String(body.payer_email || "").trim();
      const gross = parseFloat(String(body.mc_gross || "0"));
      if (orderId && paymentStatus === "Completed" && receiverEmail === PAYPAL_RECEIVER_ACCOUNT.toLowerCase()) {
        const orders = loadPayPalOrders();
        const order = orders.find((o) => o.orderId === orderId);
        if (order && order.status !== "paid" && gross >= order.amountUsd - 0.01) {
          const now = /* @__PURE__ */ new Date();
          order.status = "paid";
          order.paidAt = now.toISOString();
          order.expiresAt = new Date(
            now.getTime() + order.accessDays * 24 * 60 * 60 * 1e3
          ).toISOString();
          if (txnId) order.paypalTxId = txnId;
          if (payerEmail) order.buyerEmail = payerEmail;
          savePayPalOrders(orders);
        }
      }
      res.status(200).send("OK");
    } catch {
      res.status(200).send("OK");
    }
  });
  const distPath = path.join(__dirname, "dist");
  const isRunningCompiledJs = process.argv[1] ? process.argv[1].endsWith("server.js") : false;
  const shouldServeStatic = process.env.NODE_ENV === "production" || isRunningCompiledJs && fs.existsSync(path.join(distPath, "index.html"));
  if (!shouldServeStatic) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null
      },
      appType: "spa"
    });
    const viteClientNoHmrShim = `
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if (typeof document !== "undefined") {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id) || typeof document === "undefined") return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (typeof document === "undefined") return;
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id="' + CSS.escape(id) + '"]').forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  const data = {};
  const noop = () => {};
  return {
    get data() { return data; },
    accept: noop,
    acceptExports: noop,
    dispose: noop,
    prune: noop,
    decline: noop,
    invalidate: noop,
    on: noop,
    off: noop,
    send: noop,
  };
}
export function injectQuery(url, queryToInject) {
  if (!url || (url[0] !== "." && url[0] !== "/")) return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return pathname + "?" + queryToInject + (search ? "&" + search.slice(1) : "") + (hash || "");
}
export class ErrorOverlay {}
`.trim();
    app.get("/@vite/client", (_req, res) => {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.send(viteClientNoHmrShim);
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kinetix Video AI Lab server running on http://localhost:${PORT}`);
  });
  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 500);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
startServer();
