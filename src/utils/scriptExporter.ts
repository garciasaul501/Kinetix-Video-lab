export interface ExportableScriptScene {
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

export interface ExportableScript {
  title: string;
  logline: string;
  totalDuration: string;
  recommendedVoiceGender: string;
  recommendedAccent: string;
  recommendedVoiceTone: string;
  fullNarration: string;
  scenes: ExportableScriptScene[];
}

export interface ScriptExportMetadata {
  topic?: string;
  tone?: string;
  targetAudience?: string;
}

export interface StoryboardSceneRow {
  sceneNumber: number;
  timestamp: string;
  durationSec: number;
  audioVoiceover: string;
  narrationOnly: string;
  sfxCue: string;
  visualStaging: string;
  aiVisualPrompt: string;
  onScreenText: string;
  imageUrl?: string;
}

export interface AudiovisualProposal {
  projectTitle: string;
  targetFormat: string;
  targetDuration: string;
  narrativeTone: string;
  aiTool: string;
  analysisSynthesis: {
    coreMessage: string;
    keyPoints: string[];
    essentialData: string[];
  };
  narrativeStructure: {
    hook: string;
    valueBlocks: { title: string; summary: string }[];
    climaxConclusion: string;
    callToAction: string;
  };
  storyboard: StoryboardSceneRow[];
  technicalEditing: {
    cutsPacing: string;
    soundtrackStyle: string;
    recommendedBpm: number;
    transitionSfx: string[];
  };
  fullVoiceoverScript: string;
}

function slugifyTitle(title: string): string {
  return (
    (title || 'guion-video-ia')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'guion-video-ia'
  );
}

/**
 * Generates and downloads a formatted plain-text (.txt) production script.
 */
export function exportScriptAsTxt(
  script: ExportableScript,
  meta?: ScriptExportMetadata
): void {
  const divider = '========================================================================';
  const subDivider = '------------------------------------------------------------------------';
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines: string[] = [
    divider,
    'KINETIX — VIDEO AI LAB · GUION DE PRODUCCIÓN AUDIOVISUAL',
    divider,
    `TÍTULO DEL PROYECTO : ${script.title}`,
    `FECHA DE EXPORTACIÓN: ${dateStr}`,
    `DURACIÓN OBJETIVO   : ${script.totalDuration}`,
    `VOZ SUGERIDA        : ${script.recommendedVoiceGender} (${script.recommendedAccent})`,
    `TONO VOCAL          : ${script.recommendedVoiceTone}`,
  ];

  if (meta?.topic) {
    lines.push(`TEMA BASE           : ${meta.topic}`);
  }
  if (meta?.targetAudience) {
    lines.push(`PÚBLICO OBJETIVO    : ${meta.targetAudience}`);
  }

  lines.push(
    '',
    'LOGLINE / CONCEPTO:',
    script.logline,
    '',
    divider,
    'LOCUCIÓN CONTINUA (VOICEOVER MASTER · 2 MINUTOS)',
    divider,
    `"${script.fullNarration}"`,
    '',
    divider,
    `ESCALETA TÉCNICA POR ESCENAS (${script.scenes.length} ESCENAS)`,
    divider,
    ''
  );

  for (const scene of script.scenes) {
    lines.push(
      `ESCENA 0${scene.sceneNumber} — ${scene.title.toUpperCase()}`,
      `Código de Tiempo : ${scene.timecode} (${scene.durationSec}s)`,
      subDivider,
      `[DIRECCIÓN VISUAL Y EMOCIÓN]`,
      `${scene.visualDescription}`,
      '',
      `[ESTILO VISUAL]  : ${scene.visualStyle}`,
      `[CÁMARA Y LENTE] : ${scene.cameraDirection}`,
      `[DISEÑO SONORO]  : ${scene.soundDesign}`,
      '',
      `[TEXTO DE NARRACIÓN / VOZ EN OFF]`,
      `"${scene.narrationText}"`,
      '',
      divider,
      ''
    );
  }

  const content = lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugifyTitle(script.title)}-guion.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Converts a UTF-8 JavaScript string into a PDF WinAnsiEncoding literal string `(...)`,
 * preserving Spanish accented characters (á, é, í, ó, ú, ñ, ü, ¿, ¡, etc.).
 */
function toPdfWinAnsiString(input: string): string {
  const normalized = (input || '')
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, ' - ')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/•/g, '-');

  let out = '(';
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    if (code === 0x28 || code === 0x29 || code === 0x5c) {
      out += '\\' + String.fromCharCode(code);
    } else if (code >= 32 && code <= 126) {
      out += String.fromCharCode(code);
    } else if (code >= 160 && code <= 255) {
      const octal = code.toString(8).padStart(3, '0');
      out += '\\' + octal;
    } else {
      out += ' ';
    }
  }
  out += ')';
  return out;
}

function wrapTextByChars(text: string, maxChars: number): string[] {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [''];
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

/**
 * Generates and downloads a multi-page studio-formatted PDF (.pdf) script document
 * without requiring popups or external network calls.
 */
export function exportScriptAsPdf(
  script: ExportableScript,
  meta?: ScriptExportMetadata
): void {
  const pageWidth = 595.28; // A4 width in pt
  const pageHeight = 841.89; // A4 height in pt
  const marginX = 48;
  const topY = pageHeight - 54;
  const bottomLimitY = 56;

  const pagesCommands: string[][] = [];
  let currentCommands: string[] = [];
  let cursorY = topY;

  const startNewPage = (isFirstPage = false) => {
    if (currentCommands.length > 0) {
      pagesCommands.push(currentCommands);
    }
    currentCommands = [];
    cursorY = topY;

    currentCommands.push(
      '0.06 0.07 0.09 rg',
      `${marginX} ${pageHeight - 42} ${pageWidth - marginX * 2} 22 re f`,
      'BT',
      '/F2 8.5 Tf',
      '0.96 0.62 0.04 rg',
      `${marginX + 8} ${pageHeight - 34} Td`,
      `${toPdfWinAnsiString('KINETIX — VIDEO AI LAB · GUION DE PRODUCCIÓN (2 MINUTOS)')} Tj`,
      'ET'
    );

    cursorY = isFirstPage ? pageHeight - 66 : pageHeight - 64;
  };

  const ensureSpace = (neededPt: number) => {
    if (cursorY - neededPt < bottomLimitY) {
      startNewPage(false);
    }
  };

  const addTextLine = (
    text: string,
    font: 'F1' | 'F2' | 'F3',
    fontSize: number,
    lineHeight: number,
    rgb: [number, number, number] = [0.1, 0.12, 0.16],
    indentX = 0
  ) => {
    ensureSpace(lineHeight);
    const [r, g, b] = rgb;
    currentCommands.push(
      'BT',
      `/${font} ${fontSize} Tf`,
      `${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} rg`,
      `${marginX + indentX} ${cursorY.toFixed(2)} Td`,
      `${toPdfWinAnsiString(text)} Tj`,
      'ET'
    );
    cursorY -= lineHeight;
  };

  const addWrappedParagraph = (
    text: string,
    font: 'F1' | 'F2' | 'F3',
    fontSize: number,
    lineHeight: number,
    maxChars: number,
    rgb: [number, number, number] = [0.15, 0.17, 0.22],
    indentX = 0
  ) => {
    const wrapped = wrapTextByChars(text, maxChars);
    for (const line of wrapped) {
      addTextLine(line, font, fontSize, lineHeight, rgb, indentX);
    }
  };

  const addHorizontalRule = () => {
    ensureSpace(14);
    currentCommands.push(
      '0.84 0.86 0.90 RG',
      '0.7 w',
      `${marginX} ${(cursorY + 4).toFixed(2)} m ${pageWidth - marginX} ${(cursorY + 4).toFixed(2)} l S`
    );
    cursorY -= 10;
  };

  startNewPage(true);

  addWrappedParagraph(script.title.toUpperCase(), 'F2', 15, 20, 58, [0.05, 0.07, 0.12]);
  cursorY -= 2;
  addWrappedParagraph(script.logline, 'F1', 10, 14, 82, [0.32, 0.36, 0.44]);
  cursorY -= 6;
  addHorizontalRule();

  addTextLine(
    `DURACION TOTAL: ${script.totalDuration}   |   ESCENAS: ${script.scenes.length}   |   VOZ SUGERIDA: ${script.recommendedVoiceGender.toUpperCase()} (${script.recommendedAccent})`,
    'F3',
    8.5,
    13,
    [0.25, 0.28, 0.35]
  );
  addTextLine(
    `TONO VOCAL: ${script.recommendedVoiceTone}${meta?.targetAudience ? `   |   PUBLICO: ${meta.targetAudience}` : ''}`,
    'F3',
    8.5,
    13,
    [0.25, 0.28, 0.35]
  );
  cursorY -= 4;
  addHorizontalRule();

  addTextLine('LOCUCION CONTINUA (VOICEOVER MASTER · 2 MINUTOS)', 'F2', 10, 15, [0.78, 0.44, 0.02]);
  addWrappedParagraph(`"${script.fullNarration}"`, 'F1', 9.5, 13.5, 86, [0.12, 0.14, 0.18]);
  cursorY -= 8;
  addHorizontalRule();

  addTextLine('ESCALETA TECNICA POR ESCENAS', 'F2', 11, 17, [0.05, 0.07, 0.12]);
  cursorY -= 2;

  for (const scene of script.scenes) {
    ensureSpace(95);

    currentCommands.push(
      '0.94 0.95 0.97 rg',
      `${marginX} ${(cursorY - 4).toFixed(2)} ${pageWidth - marginX * 2} 18 re f`
    );
    addTextLine(
      `ESCENA 0${scene.sceneNumber}: ${scene.title.toUpperCase()}   [${scene.timecode} · ${scene.durationSec}s]`,
      'F2',
      9.5,
      16,
      [0.08, 0.1, 0.15],
      6
    );
    cursorY -= 2;

    addTextLine('Direccion Visual y Emocion:', 'F2', 8.5, 12, [0.28, 0.32, 0.4]);
    addWrappedParagraph(scene.visualDescription, 'F1', 9.2, 13, 86, [0.12, 0.14, 0.18], 8);
    cursorY -= 2;

    addWrappedParagraph(
      `Estilo Visual: ${scene.visualStyle}   |   Camara: ${scene.cameraDirection}`,
      'F3',
      8,
      11.5,
      88,
      [0.32, 0.36, 0.44],
      8
    );
    addWrappedParagraph(
      `Diseno Sonoro: ${scene.soundDesign}`,
      'F3',
      8,
      12,
      88,
      [0.32, 0.36, 0.44],
      8
    );
    cursorY -= 2;

    addTextLine('Voz en Off (Locucion):', 'F2', 8.5, 12, [0.78, 0.44, 0.02]);
    addWrappedParagraph(`"${scene.narrationText}"`, 'F1', 9.5, 13.5, 84, [0.06, 0.08, 0.12], 8);
    cursorY -= 8;
  }

  if (currentCommands.length > 0) {
    pagesCommands.push(currentCommands);
  }

  buildAndDownloadPdfDocument(pagesCommands, pageWidth, pageHeight, marginX, `${slugifyTitle(script.title)}-guion.pdf`);
}

/**
 * Exports the complete Audiovisual Proposal (adapted from PDF) as a downloadable .txt file.
 */
export function exportProposalAsTxt(proposal: AudiovisualProposal): void {
  const divider = '================================================================================';
  const subDivider = '--------------------------------------------------------------------------------';
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines: string[] = [
    divider,
    'KINETIX — PROPUESTA AUDIOVISUAL LISTA PARA PRODUCCIÓN (ADAPTACIÓN PDF CON IA)',
    divider,
    `PROYECTO            : ${proposal.projectTitle}`,
    `FECHA               : ${dateStr}`,
    `FORMATO / PLATAFORMA: ${proposal.targetFormat}`,
    `DURACIÓN ESTIMADA   : ${proposal.targetDuration}`,
    `TONO Y ESTILO       : ${proposal.narrativeTone}`,
    `MOTOR VISUAL IA     : ${proposal.aiTool}`,
    '',
    divider,
    '1. ANÁLISIS Y SÍNTESIS DEL CONTENIDO',
    divider,
    `MENSAJE CENTRAL:`,
    proposal.analysisSynthesis.coreMessage,
    '',
    'PUNTOS CLAVE EXTRAÍDOS:',
    ...proposal.analysisSynthesis.keyPoints.map((pt, i) => `  ${i + 1}. ${pt}`),
    '',
    'DATOS INDISPENSABLES Y RETENCIÓN:',
    ...proposal.analysisSynthesis.essentialData.map((d) => `  • ${d}`),
    '',
    divider,
    '2. ESTRUCTURA NARRATIVA DE ALTA RETENCIÓN',
    divider,
    `[GANCHO INICIAL · PRIMEROS 3-5 SEGUNDOS]:`,
    proposal.narrativeStructure.hook,
    '',
    `[DESARROLLO DINÁMICO EN BLOQUES DE VALOR]:`,
    ...proposal.narrativeStructure.valueBlocks.map(
      (b, idx) => `  Bloque ${idx + 1} (${b.title}): ${b.summary}`
    ),
    '',
    `[CLÍMAX / CONCLUSIÓN]:`,
    proposal.narrativeStructure.climaxConclusion,
    '',
    `[LLAMADO A LA ACCIÓN (CTA)]:`,
    proposal.narrativeStructure.callToAction,
    '',
    divider,
    `3. TABLA DE STORYBOARD ESCENA POR ESCENA (${proposal.storyboard.length} ESCENAS)`,
    divider,
    '',
  ];

  for (const row of proposal.storyboard) {
    lines.push(
      `ESCENA #${row.sceneNumber}  |  TIEMPO: ${row.timestamp} (${row.durationSec}s)`,
      subDivider,
      `• AUDIO / VOZ EN OFF + SFX:`,
      `  ${row.audioVoiceover}`,
      '',
      `• DESCRIPCIÓN VISUAL / PUESTA EN ESCENA:`,
      `  ${row.visualStaging}`,
      '',
      `• PROMPT PARA GENERACIÓN DE VIDEO/IMAGEN CON IA (${proposal.aiTool} - INGLÉS):`,
      `  ${row.aiVisualPrompt}`,
      '',
      `• TEXTO EN PANTALLA (OVERLAY / ON-SCREEN TEXT):`,
      `  [${row.onScreenText}]`,
      '',
      divider,
      ''
    );
  }

  lines.push(
    '4. RECOMENDACIONES TÉCNICAS DE EDICIÓN',
    divider,
    `• RITMO DE CORTE (CUTS PACING):`,
    `  ${proposal.technicalEditing.cutsPacing}`,
    '',
    `• ESTILO DE BANDA SONORA SUGERIDA (BPM ~${proposal.technicalEditing.recommendedBpm}):`,
    `  ${proposal.technicalEditing.soundtrackStyle}`,
    '',
    `• EFECTOS SONOROS ESPECÍFICOS (SFX) PARA TRANSICIONES:`,
    ...proposal.technicalEditing.transitionSfx.map((sfx) => `  - ${sfx}`),
    '',
    divider,
    'LOCUCIÓN CONTINUA PARA ESTUDIO DE VOZ:',
    divider,
    `"${proposal.fullVoiceoverScript}"`,
    ''
  );

  const content = lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugifyTitle(proposal.projectTitle)}-propuesta-audiovisual.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Exports the complete Audiovisual Proposal (adapted from PDF) as a multi-page studio PDF (.pdf).
 */
export function exportProposalAsPdf(proposal: AudiovisualProposal): void {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 44;
  const topY = pageHeight - 54;
  const bottomLimitY = 54;

  const pagesCommands: string[][] = [];
  let currentCommands: string[] = [];
  let cursorY = topY;

  const startNewPage = (isFirstPage = false) => {
    if (currentCommands.length > 0) {
      pagesCommands.push(currentCommands);
    }
    currentCommands = [];
    cursorY = topY;

    currentCommands.push(
      '0.06 0.07 0.09 rg',
      `${marginX} ${pageHeight - 42} ${pageWidth - marginX * 2} 22 re f`,
      'BT',
      '/F2 8.2 Tf',
      '0.96 0.62 0.04 rg',
      `${marginX + 8} ${pageHeight - 34} Td`,
      `${toPdfWinAnsiString('KINETIX — PROPUESTA AUDIOVISUAL IA & STORYBOARD DE PRODUCCION')} Tj`,
      'ET'
    );

    cursorY = isFirstPage ? pageHeight - 64 : pageHeight - 62;
  };

  const ensureSpace = (neededPt: number) => {
    if (cursorY - neededPt < bottomLimitY) {
      startNewPage(false);
    }
  };

  const addTextLine = (
    text: string,
    font: 'F1' | 'F2' | 'F3',
    fontSize: number,
    lineHeight: number,
    rgb: [number, number, number] = [0.1, 0.12, 0.16],
    indentX = 0
  ) => {
    ensureSpace(lineHeight);
    const [r, g, b] = rgb;
    currentCommands.push(
      'BT',
      `/${font} ${fontSize} Tf`,
      `${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} rg`,
      `${marginX + indentX} ${cursorY.toFixed(2)} Td`,
      `${toPdfWinAnsiString(text)} Tj`,
      'ET'
    );
    cursorY -= lineHeight;
  };

  const addWrappedParagraph = (
    text: string,
    font: 'F1' | 'F2' | 'F3',
    fontSize: number,
    lineHeight: number,
    maxChars: number,
    rgb: [number, number, number] = [0.15, 0.17, 0.22],
    indentX = 0
  ) => {
    const wrapped = wrapTextByChars(text, maxChars);
    for (const line of wrapped) {
      addTextLine(line, font, fontSize, lineHeight, rgb, indentX);
    }
  };

  const addHorizontalRule = () => {
    ensureSpace(12);
    currentCommands.push(
      '0.84 0.86 0.90 RG',
      '0.7 w',
      `${marginX} ${(cursorY + 4).toFixed(2)} m ${pageWidth - marginX} ${(cursorY + 4).toFixed(2)} l S`
    );
    cursorY -= 9;
  };

  startNewPage(true);

  addWrappedParagraph(proposal.projectTitle.toUpperCase(), 'F2', 14, 18, 62, [0.05, 0.07, 0.12]);
  cursorY -= 3;
  addTextLine(
    `FORMATO: ${proposal.targetFormat}   |   DURACION: ${proposal.targetDuration}   |   MOTOR IA: ${proposal.aiTool}`,
    'F3',
    8,
    12,
    [0.25, 0.28, 0.35]
  );
  addTextLine(`TONO Y ESTILO: ${proposal.narrativeTone}`, 'F3', 8, 12, [0.25, 0.28, 0.35]);
  cursorY -= 4;
  addHorizontalRule();

  // 1. Análisis y Síntesis
  addTextLine('1. ANALISIS Y SINTESIS EJECUTIVA', 'F2', 10.5, 15, [0.78, 0.44, 0.02]);
  addWrappedParagraph(
    `Mensaje Central: ${proposal.analysisSynthesis.coreMessage}`,
    'F1',
    9.2,
    13,
    88,
    [0.1, 0.12, 0.16]
  );
  cursorY -= 2;
  for (const pt of proposal.analysisSynthesis.keyPoints) {
    addWrappedParagraph(`- ${pt}`, 'F1', 8.8, 12.5, 86, [0.2, 0.23, 0.29], 6);
  }
  cursorY -= 4;
  addHorizontalRule();

  // 2. Estructura Narrativa
  addTextLine('2. ESTRUCTURA NARRATIVA (HOOK, BLOQUES, CLIMAX Y CTA)', 'F2', 10.5, 15, [0.78, 0.44, 0.02]);
  addWrappedParagraph(
    `GANCHO INICIAL (3-5s): ${proposal.narrativeStructure.hook}`,
    'F2',
    9,
    13,
    86,
    [0.08, 0.1, 0.15]
  );
  for (const blk of proposal.narrativeStructure.valueBlocks) {
    addWrappedParagraph(`• ${blk.title}: ${blk.summary}`, 'F1', 8.8, 12.5, 86, [0.18, 0.2, 0.26], 6);
  }
  addWrappedParagraph(
    `CLIMAX / CONCLUSION: ${proposal.narrativeStructure.climaxConclusion}`,
    'F1',
    8.8,
    12.5,
    86,
    [0.12, 0.14, 0.18]
  );
  addWrappedParagraph(
    `LLAMADO A LA ACCION (CTA): ${proposal.narrativeStructure.callToAction}`,
    'F2',
    9,
    13,
    86,
    [0.08, 0.1, 0.15]
  );
  cursorY -= 4;
  addHorizontalRule();

  // 3. Storyboard
  addTextLine(
    `3. TABLA DE STORYBOARD ESCENA POR ESCENA (${proposal.storyboard.length} ESCENAS)`,
    'F2',
    10.5,
    16,
    [0.05, 0.07, 0.12]
  );

  for (const row of proposal.storyboard) {
    ensureSpace(105);
    currentCommands.push(
      '0.93 0.95 0.97 rg',
      `${marginX} ${(cursorY - 4).toFixed(2)} ${pageWidth - marginX * 2} 17 re f`
    );
    addTextLine(
      `ESCENA #${row.sceneNumber}   |   TIEMPO: ${row.timestamp}   |   OVERLAY: [${row.onScreenText}]`,
      'F2',
      9,
      15,
      [0.06, 0.08, 0.14],
      6
    );
    cursorY -= 2;

    addWrappedParagraph(
      `Audio / Voz en Off + SFX: ${row.audioVoiceover}`,
      'F1',
      9,
      12.5,
      86,
      [0.08, 0.1, 0.14],
      6
    );
    addWrappedParagraph(
      `Descripcion Visual / Puesta en Escena: ${row.visualStaging}`,
      'F1',
      8.8,
      12.5,
      86,
      [0.2, 0.23, 0.3],
      6
    );
    addWrappedParagraph(
      `Prompt IA (${proposal.aiTool}): ${row.aiVisualPrompt}`,
      'F3',
      8,
      11.5,
      88,
      [0.28, 0.32, 0.42],
      6
    );
    cursorY -= 6;
  }

  addHorizontalRule();
  ensureSpace(70);
  addTextLine('4. RECOMENDACIONES TECNICAS DE EDICION', 'F2', 10.5, 15, [0.78, 0.44, 0.02]);
  addWrappedParagraph(
    `Ritmo de Corte (Cuts Pacing): ${proposal.technicalEditing.cutsPacing}`,
    'F1',
    8.8,
    12.5,
    86,
    [0.12, 0.14, 0.18]
  );
  addWrappedParagraph(
    `Banda Sonora (${proposal.technicalEditing.recommendedBpm} BPM): ${proposal.technicalEditing.soundtrackStyle}`,
    'F1',
    8.8,
    12.5,
    86,
    [0.12, 0.14, 0.18]
  );
  addWrappedParagraph(
    `Efectos Sonoros (SFX): ${proposal.technicalEditing.transitionSfx.join(' | ')}`,
    'F1',
    8.8,
    12.5,
    86,
    [0.12, 0.14, 0.18]
  );

  if (currentCommands.length > 0) {
    pagesCommands.push(currentCommands);
  }

  buildAndDownloadPdfDocument(
    pagesCommands,
    pageWidth,
    pageHeight,
    marginX,
    `${slugifyTitle(proposal.projectTitle)}-propuesta-audiovisual.pdf`
  );
}

function buildAndDownloadPdfDocument(
  pagesCommands: string[][],
  pageWidth: number,
  pageHeight: number,
  marginX: number,
  filename: string
): void {
  const objects: string[] = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>';

  const pageObjectIds: number[] = [];
  let nextObjId = 6;

  pagesCommands.forEach((cmds, pageIdx) => {
    const footerCmd = [
      'BT',
      '/F3 8 Tf',
      '0.45 0.48 0.54 rg',
      `${marginX} 28 Td`,
      `${toPdfWinAnsiString(`Kinetix Video AI Lab  |  Pagina ${pageIdx + 1} de ${pagesCommands.length}`)} Tj`,
      'ET',
    ].join('\n');

    const streamBody = cmds.join('\n') + '\n' + footerCmd;
    const pageObjId = nextObjId++;
    const contentObjId = nextObjId++;

    pageObjectIds.push(pageObjId);
    objects[pageObjId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentObjId} 0 R >>`;
    objects[contentObjId] = `<< /Length ${streamBody.length} >>\nstream\n${streamBody}\nendstream`;
  });

  const kidsArray = pageObjectIds.map((id) => `${id} 0 R`).join(' ');
  objects[2] = `<< /Type /Pages /Kids [ ${kidsArray} ] /Count ${pageObjectIds.length} >>`;

  let pdfText = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (let i = 1; i < objects.length; i++) {
    offsets[i] = pdfText.length;
    pdfText += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = pdfText.length;
  pdfText += `xref\n0 ${objects.length}\n`;
  pdfText += '0000000000 65535 f \n';
  for (let i = 1; i < objects.length; i++) {
    pdfText += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdfText += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const bytes = new Uint8Array(pdfText.length);
  for (let i = 0; i < pdfText.length; i++) {
    bytes[i] = pdfText.charCodeAt(i) & 0xff;
  }

  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export interface ExportableVideoBookPage {
  pageNumber: number;
  chapterTitle: string;
  pageText: string;
  keyQuote: string;
  imagePrompt: string;
  durationSec: number;
}

export interface ExportableVideoBook {
  bookTitle: string;
  subtitle: string;
  authorOrSource: string;
  bookStyle: string;
  totalEstimatedSec: number;
  fullNarration: string;
  pages: ExportableVideoBookPage[];
}

export function exportVideoBookAsTxt(book: ExportableVideoBook): void {
  const divider = '========================================================================';
  const subDivider = '------------------------------------------------------------------------';
  const lines: string[] = [
    divider,
    'VIDEO-LIBRO ELECTRÓNICO (EBOOK EN VIDEO + AUDIOLIBRO IA)',
    divider,
    `TÍTULO DEL LIBRO : ${book.bookTitle}`,
    `SUBTÍTULO        : ${book.subtitle}`,
    `FUENTE / AUTOR   : ${book.authorOrSource}`,
    `ESTILO VISUAL    : ${book.bookStyle}`,
    `PÁGINAS          : ${book.pages.length} páginas ilustradas`,
    '',
    divider,
    'CAPÍTULOS Y PÁGINAS DEL VIDEO-LIBRO',
    divider,
    '',
  ];

  for (const p of book.pages) {
    lines.push(
      `PÁGINA ${p.pageNumber} — ${p.chapterTitle.toUpperCase()}`,
      subDivider,
      p.pageText,
      '',
      `Cita Destacada: "${p.keyQuote}"`,
      `Ilustración IA: ${p.imagePrompt}`,
      '',
      divider,
      ''
    );
  }

  const content = lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugifyTitle(book.bookTitle)}-videolibro.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportVideoBookAsPdf(book: ExportableVideoBook): void {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 48;
  const topY = pageHeight - 54;
  const bottomLimitY = 56;

  const pagesCommands: string[][] = [];
  let currentCommands: string[] = [];
  let cursorY = topY;

  const startNewPage = (isFirstPage = false) => {
    if (currentCommands.length > 0) {
      pagesCommands.push(currentCommands);
    }
    currentCommands = [];
    cursorY = topY;

    currentCommands.push(
      '0.06 0.07 0.09 rg',
      `${marginX} ${pageHeight - 42} ${pageWidth - marginX * 2} 22 re f`,
      'BT',
      '/F2 8.5 Tf',
      '0.96 0.62 0.04 rg',
      `${marginX + 8} ${pageHeight - 34} Td`,
      `${toPdfWinAnsiString('KINETIX — VIDEO-LIBRO ELECTRONICO (EDICION EBOOK ILUSTRADO)')} Tj`,
      'ET'
    );

    cursorY = isFirstPage ? pageHeight - 66 : pageHeight - 64;
  };

  const ensureSpace = (neededPt: number) => {
    if (cursorY - neededPt < bottomLimitY) {
      startNewPage(false);
    }
  };

  const addTextLine = (
    text: string,
    font: 'F1' | 'F2' | 'F3',
    fontSize: number,
    lineHeight: number,
    rgb: [number, number, number] = [0.1, 0.12, 0.16],
    indentX = 0
  ) => {
    ensureSpace(lineHeight);
    const [r, g, b] = rgb;
    currentCommands.push(
      'BT',
      `/${font} ${fontSize} Tf`,
      `${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} rg`,
      `${marginX + indentX} ${cursorY.toFixed(2)} Td`,
      `${toPdfWinAnsiString(text)} Tj`,
      'ET'
    );
    cursorY -= lineHeight;
  };

  const addWrappedParagraph = (
    text: string,
    font: 'F1' | 'F2' | 'F3',
    fontSize: number,
    lineHeight: number,
    maxChars: number,
    rgb: [number, number, number] = [0.15, 0.17, 0.22],
    indentX = 0
  ) => {
    const wrapped = wrapTextByChars(text, maxChars);
    for (const line of wrapped) {
      addTextLine(line, font, fontSize, lineHeight, rgb, indentX);
    }
  };

  startNewPage(true);

  addWrappedParagraph(book.bookTitle.toUpperCase(), 'F2', 16, 21, 56, [0.05, 0.07, 0.12]);
  cursorY -= 2;
  addWrappedParagraph(book.subtitle, 'F1', 10.5, 15, 80, [0.32, 0.36, 0.44]);
  cursorY -= 4;
  addTextLine(
    `FUENTE: ${book.authorOrSource}   |   ESTILO: ${book.bookStyle}   |   PAGINAS: ${book.pages.length}`,
    'F3',
    8.5,
    14,
    [0.25, 0.28, 0.35]
  );
  cursorY -= 10;

  for (const p of book.pages) {
    ensureSpace(120);
    currentCommands.push(
      '0.94 0.95 0.97 rg',
      `${marginX} ${(cursorY - 4).toFixed(2)} ${pageWidth - marginX * 2} 18 re f`
    );
    addTextLine(
      `PAGINA 0${p.pageNumber} — ${p.chapterTitle.toUpperCase()}`,
      'F2',
      10,
      16,
      [0.08, 0.1, 0.15],
      6
    );
    cursorY -= 4;

    addWrappedParagraph(p.pageText, 'F1', 10, 14.5, 84, [0.1, 0.12, 0.16], 4);
    cursorY -= 3;
    addWrappedParagraph(`Cita Clave: "${p.keyQuote}"`, 'F2', 9, 13, 84, [0.78, 0.44, 0.02], 8);
    cursorY -= 10;
  }

  if (currentCommands.length > 0) {
    pagesCommands.push(currentCommands);
  }

  buildAndDownloadPdfDocument(
    pagesCommands,
    pageWidth,
    pageHeight,
    marginX,
    `${slugifyTitle(book.bookTitle)}-videolibro.pdf`
  );
}

