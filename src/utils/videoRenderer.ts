import { SequencePlan } from '../components/CinemaSequenceCanvas';
import {
  drawTalkingAvatarOnCanvas,
  NarratorAvatarPreset,
  NARRATOR_AVATAR_PRESETS,
} from '../components/TalkingAvatarStage';

export type AudiobookVisualMode = 'avatar-and-scenes' | 'avatar-only' | 'scenes-only';

export interface VideoBookPage {
  pageNumber: number;
  chapterTitle: string;
  pageText: string;
  keyQuote: string;
  imagePrompt: string;
  durationSec: number;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  imageUrl?: string;
}

export interface VideoBook {
  bookTitle: string;
  subtitle: string;
  authorOrSource: string;
  bookStyle: string;
  totalEstimatedSec: number;
  fullNarration: string;
  pages: VideoBookPage[];
}

function hexToRgb(hex: string, fallback = [245, 158, 11]): [number, number, number] {
  const clean = (hex || '').replace('#', '').trim();
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return [r, g, b];
    }
  }
  return fallback as [number, number, number];
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('No se pudo convertir el Blob a Base64.'));
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo datos binarios.'));
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / Math.max(1, img.height);
  const targetRatio = w / Math.max(1, h);
  let drawW = w;
  let drawH = h;
  let offsetX = x;
  let offsetY = y;

  if (imgRatio > targetRatio) {
    drawH = h;
    drawW = h * imgRatio;
    offsetX = x - (drawW - w) / 2;
  } else {
    drawW = w;
    drawH = w / imgRatio;
    offsetY = y - (drawH - h) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
}

function wrapCanvasLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 7
): string[] {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (lines.length + 1 >= maxLines) {
        lines.push(current + '…');
        return lines;
      }
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Renders a VideoBook / Spoken AI Audiobook (with live talking narrator avatar,
 * topic/chapter scenes, synchronized reading highlight, and spoken narration audio)
 * into a downloadable H.264/AAC MP4.
 */
export async function renderVideoBookToMp4Url(
  book: VideoBook,
  pageImages: Record<number, string> = {},
  audioBase64?: string | null,
  onProgress?: (pct: number) => void,
  visualOptions?: {
    mode?: AudiobookVisualMode;
    avatar?: NarratorAvatarPreset;
    customAvatarUrl?: string;
  }
): Promise<string> {
  const width = 1280;
  const height = 720;
  const pages = book.pages && book.pages.length > 0 ? book.pages : [];
  const mode: AudiobookVisualMode = visualOptions?.mode || 'avatar-and-scenes';
  const avatar: NarratorAvatarPreset = visualOptions?.avatar || NARRATOR_AVATAR_PRESETS[0];

  onProgress?.(8);
  const [loadedImages, customAvatarImg] = await Promise.all([
    Promise.all(
      pages.map((p, idx) => loadImageElement(pageImages[idx] || p.imageUrl || ''))
    ),
    loadImageElement(
      visualOptions?.customAvatarUrl || avatar.customPhotoUrl || avatar.realPhotoUrl || ''
    ),
  ]);

  // Ensure we have spoken audio for the audiobook MP4
  let finalAudioB64 = audioBase64 || null;
  if (!finalAudioB64 && book.fullNarration) {
    try {
      const ttsRes = await fetch('/api/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: book.fullNarration,
          voiceGender: avatar.gender,
          voiceName: avatar.voiceName,
          accent: avatar.accent,
          tone: 'narrador de audiolibro cálido y expresivo',
        }),
      });
      const ttsData = await ttsRes.json();
      if (ttsData.audioBase64) {
        finalAudioB64 = ttsData.audioBase64;
      }
    } catch (_e) {
      // Continue if offline
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el motor gráfico del Audiolibro en Video.');
  }

  const fullBookDurationSec = Math.max(
    12,
    pages.reduce((acc, p) => acc + Math.max(5, Number(p.durationSec) || 8), 0),
    Number(book.totalEstimatedSec) || 0
  );
  const renderDurationSec = Math.max(10, Math.min(20, pages.length * 2.2));
  const stream = canvas.captureStream(30);

  const mimeType =
    typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const webmBlob = await new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('Error codificando el Audiolibro en Video.'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));

    recorder.start(200);
    const startTime = performance.now();

    const drawBookFrame = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      if (elapsed >= renderDurationSec) {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
        return;
      }

      const pageCount = Math.max(1, pages.length);
      const pageDur = renderDurationSec / pageCount;
      const pageIdx = Math.min(pageCount - 1, Math.floor(elapsed / pageDur));
      const pageProgress = (elapsed - pageIdx * pageDur) / pageDur;
      const page = pages[pageIdx];
      const pageImg = loadedImages[pageIdx];

      const pct = Math.min(92, Math.max(12, Math.round((elapsed / renderDurationSec) * 88)));
      onProgress?.(pct);

      const [r1, g1, b1] = hexToRgb(page?.primaryHex || '#0D1322', [13, 19, 34]);
      const [r2, g2, b2] = hexToRgb(page?.secondaryHex || '#1B2845', [27, 40, 69]);
      const [ra, ga, ba] = hexToRgb(page?.accentHex || '#F59E0B', [245, 158, 11]);

      // Outer ambient studio backdrop
      ctx.fillStyle = '#07090E';
      ctx.fillRect(0, 0, width, height);

      // Book spread container
      const bookX = 56;
      const bookY = 44;
      const bookW = width - 112;
      const bookH = height - 88;
      const halfW = bookW / 2;

      // Book drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(bookX + 8, bookY + 12, bookW, bookH);

      // Left Page: Either Full Avatar Stage OR Topic Scene (+ Picture-in-Picture Talking Avatar)
      if (mode === 'avatar-only') {
        drawTalkingAvatarOnCanvas(
          ctx,
          bookX,
          bookY,
          halfW,
          bookH,
          avatar,
          elapsed,
          true,
          customAvatarImg,
          avatar.name
        );
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.rect(bookX, bookY, halfW, bookH);
        ctx.clip();

        const zoom = 1.02 + pageProgress * 0.08;
        ctx.translate(bookX + halfW / 2, bookY + bookH / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-(bookX + halfW / 2), -(bookY + bookH / 2));

        if (pageImg) {
          drawCoverImage(ctx, pageImg, bookX, bookY, halfW, bookH);
        } else {
          const leftGrad = ctx.createLinearGradient(bookX, bookY, bookX + halfW, bookY + bookH);
          leftGrad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
          leftGrad.addColorStop(0.6, `rgb(${r2}, ${g2}, ${b2})`);
          leftGrad.addColorStop(1, '#090C14');
          ctx.fillStyle = leftGrad;
          ctx.fillRect(bookX, bookY, halfW, bookH);

          const cx = bookX + halfW * 0.5;
          const cy = bookY + bookH * 0.42;
          const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, halfW * 0.55);
          glow.addColorStop(0, `rgba(${ra}, ${ga}, ${ba}, 0.5)`);
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(bookX, bookY, halfW, bookH);

          ctx.strokeStyle = `rgba(${ra}, ${ga}, ${ba}, 0.5)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 88 + Math.sin(pageProgress * Math.PI) * 10, 0, Math.PI * 2);
          ctx.stroke();
        }

        const capGrad = ctx.createLinearGradient(0, bookY + bookH - 140, 0, bookY + bookH);
        capGrad.addColorStop(0, 'rgba(7, 9, 14, 0)');
        capGrad.addColorStop(1, 'rgba(7, 9, 14, 0.9)');
        ctx.fillStyle = capGrad;
        ctx.fillRect(bookX, bookY + bookH - 140, halfW, 140);
        ctx.restore();

        // If mode is 'avatar-and-scenes', render the Live Talking Avatar in a Picture-in-Picture studio frame
        if (mode === 'avatar-and-scenes') {
          const pipW = 190;
          const pipH = 210;
          const pipX = bookX + halfW - pipW - 20;
          const pipY = bookY + bookH - pipH - 20;

          ctx.fillStyle = 'rgba(0,0,0,0.65)';
          ctx.fillRect(pipX + 4, pipY + 6, pipW, pipH);

          drawTalkingAvatarOnCanvas(
            ctx,
            pipX,
            pipY,
            pipW,
            pipH,
            avatar,
            elapsed,
            true,
            customAvatarImg,
            avatar.name
          );

          ctx.strokeStyle = `rgb(${ra}, ${ga}, ${ba})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(pipX, pipY, pipW, pipH);
        }
      }

      // Left page bottom badge
      ctx.fillStyle = `rgb(${ra}, ${ga}, ${ba})`;
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText(
        `CAPÍTULO 0${pageIdx + 1} · ${
          mode === 'avatar-only' ? `NARRADOR: ${avatar.name.toUpperCase()}` : 'ESCENA DEL TEMA'
        }`,
        bookX + 24,
        bookY + bookH - 28
      );

      // Right Page: Spoken Audiobook Text & Synchronized Reading Page
      const rightX = bookX + halfW;
      ctx.fillStyle = '#12151E';
      ctx.fillRect(rightX, bookY, halfW, bookH);

      // Center Book Spine Crease Shadow
      const spineGrad = ctx.createLinearGradient(rightX - 18, 0, rightX + 24, 0);
      spineGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
      spineGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.85)');
      spineGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spineGrad;
      ctx.fillRect(rightX - 18, bookY, 42, bookH);

      // Book Outer Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bookX, bookY, bookW, bookH);

      const padX = 44;
      const textStartX = rightX + padX;
      const maxTextW = halfW - padX * 2;

      // Top Audiobook Title Header
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText(
        (book.bookTitle || 'AUDIOLIBRO IA EN VIDEO').toUpperCase().slice(0, 44),
        textStartX,
        bookY + 42
      );

      ctx.textAlign = 'right';
      ctx.fillStyle = `rgb(${ra}, ${ga}, ${ba})`;
      ctx.fillText(
        `CAP. ${pageIdx + 1} / ${pageCount}`,
        rightX + halfW - padX,
        bookY + 42
      );
      ctx.textAlign = 'left';

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(textStartX, bookY + 56);
      ctx.lineTo(rightX + halfW - padX, bookY + 56);
      ctx.stroke();

      // Chapter Title
      ctx.fillStyle = '#F9FAFB';
      ctx.font = '700 24px "Syne", sans-serif';
      const titleLines = wrapCanvasLines(
        ctx,
        page?.chapterTitle || `Capítulo ${pageIdx + 1}`,
        maxTextW,
        2
      );
      let cursorY = bookY + 96;
      for (const tLine of titleLines) {
        ctx.fillText(tLine, textStartX, cursorY);
        cursorY += 32;
      }

      cursorY += 12;

      // Main Page Body Text (with synchronized spoken highlight bar)
      ctx.font = '400 16.5px "Plus Jakarta Sans", sans-serif';
      const bodyLines = wrapCanvasLines(ctx, page?.pageText || '', maxTextW, 9);
      const activeLineIdx = Math.min(
        bodyLines.length - 1,
        Math.floor(pageProgress * bodyLines.length)
      );

      bodyLines.forEach((bLine, lIdx) => {
        if (lIdx === activeLineIdx) {
          ctx.fillStyle = `rgba(${ra}, ${ga}, ${ba}, 0.16)`;
          ctx.fillRect(textStartX - 8, cursorY - 19, maxTextW + 16, 26);
          ctx.fillStyle = '#FFFFFF';
        } else if (lIdx < activeLineIdx) {
          ctx.fillStyle = '#D1D5DB';
        } else {
          ctx.fillStyle = '#9CA3AF';
        }
        ctx.fillText(bLine, textStartX, cursorY);
        cursorY += 28;
      });

      // Key Quote Callout Box at bottom of Right Page
      if (page?.keyQuote) {
        const quoteY = bookY + bookH - 108;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.09)';
        ctx.fillRect(textStartX, quoteY, maxTextW, 64);
        ctx.fillStyle = `rgb(${ra}, ${ga}, ${ba})`;
        ctx.fillRect(textStartX, quoteY, 4, 64);

        ctx.fillStyle = '#FDE68A';
        ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
        const qLines = wrapCanvasLines(ctx, `“${page.keyQuote}”`, maxTextW - 24, 2);
        qLines.forEach((ql, qi) => {
          ctx.fillText(ql, textStartX + 14, quoteY + 25 + qi * 20);
        });
      }

      requestAnimationFrame(drawBookFrame);
    };

    requestAnimationFrame(drawBookFrame);
  });

  try {
    onProgress?.(96);
    const videoBase64 = await blobToBase64(webmBlob);
    const mp4Res = await fetch('/api/export-mp4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoBase64,
        audioBase64: finalAudioB64 || undefined,
        durationSec: fullBookDurationSec,
        capturePassDurationSec: renderDurationSec,
      }),
    });

    if (mp4Res.ok) {
      const mp4Blob = await mp4Res.blob();
      onProgress?.(100);
      return URL.createObjectURL(mp4Blob);
    }
  } catch (_err) {
    // Fallback to webm blob if offline
  }

  onProgress?.(100);
  return URL.createObjectURL(webmBlob);
}

/**
 * Renders a SequencePlan (including any AI-generated or uploaded shot images and voiceover audio)
 * into a genuine H.264/AAC MP4 Blob URL.
 */
export async function renderSequenceToVideoUrl(
  sequence: SequencePlan,
  aspectRatio: '16:9' | '9:16' = '16:9',
  resolution: '720p' | '1080p' = '720p',
  onProgress?: (msg: string) => void,
  audioBase64?: string | null
): Promise<string> {
  const is1080 = resolution === '1080p';
  const width = aspectRatio === '16:9' ? (is1080 ? 1280 : 960) : is1080 ? 720 : 540;
  const height = aspectRatio === '16:9' ? (is1080 ? 720 : 540) : is1080 ? 1280 : 960;

  const shots = sequence.shots && sequence.shots.length > 0 ? sequence.shots : [];

  onProgress?.('Cargando imágenes de los planos para composición de video…');
  const loadedImages = await Promise.all(
    shots.map((s) => loadImageElement(s.imageUrl || ''))
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto de renderizado de video.');
  }

  const fullSequenceDurationSec = Math.max(
    10,
    shots.reduce((acc, s) => acc + Math.max(3, Number(s.durationSec) || 4), 0)
  );
  const renderDurationSec = Math.max(8, Math.min(18, shots.length * 2.2));
  const stream = canvas.captureStream(30);

  const mimeType =
    typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: is1080 ? 6_000_000 : 3_500_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const webmBlob = await new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => {
      reject(new Error('Error durante la codificación del flujo de video.'));
    };

    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };

    recorder.start(200);
    const startTime = performance.now();

    const drawLoop = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      if (elapsed >= renderDurationSec) {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
        return;
      }

      const progressPct = Math.min(92, Math.round((elapsed / renderDurationSec) * 90));
      const shotCount = Math.max(1, shots.length);
      const shotDuration = renderDurationSec / shotCount;
      const currentShotIndex = Math.min(shotCount - 1, Math.floor(elapsed / shotDuration));
      const shotProgress = (elapsed - currentShotIndex * shotDuration) / shotDuration;

      onProgress?.(
        `Componiendo video con imágenes · Plano 0${currentShotIndex + 1}/0${shotCount} (${progressPct}%)…`
      );

      const shot = shots[currentShotIndex] || {
        shotNumber: 1,
        durationSec: 3,
        shotType: 'Plano General',
        cameraMotion: 'dolly-in',
        visualMotif: 'horizon',
        headlineText: sequence.title || 'Secuencia IA',
        actionDescription: sequence.emotionSummary || '',
        primaryHex: '#0A0E1A',
        secondaryHex: '#18243E',
        accentHex: '#F59E0B',
        focalLens: '35mm Anamorphic',
      };

      const shotImg = loadedImages[currentShotIndex] || null;
      const [r1, g1, b1] = hexToRgb(shot.primaryHex, [10, 14, 26]);
      const [r2, g2, b2] = hexToRgb(shot.secondaryHex, [24, 36, 62]);
      const [ra, ga, ba] = hexToRgb(shot.accentHex, [245, 158, 11]);

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      const scale = 1.03 + shotProgress * 0.14;
      const offsetX = Math.sin(shotProgress * Math.PI) * 16;
      ctx.translate(width / 2 + offsetX, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);

      if (shotImg) {
        drawCoverImage(ctx, shotImg, 0, 0, width, height);

        const lutGrad = ctx.createLinearGradient(0, 0, 0, height);
        lutGrad.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, 0.22)`);
        lutGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.08)');
        lutGrad.addColorStop(1, `rgba(${r1}, ${g1}, ${b1}, 0.65)`);
        ctx.fillStyle = lutGrad;
        ctx.fillRect(0, 0, width, height);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, width * 0.35, height);
        bgGrad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
        bgGrad.addColorStop(0.6, `rgb(${r2}, ${g2}, ${b2})`);
        bgGrad.addColorStop(
          1,
          `rgb(${Math.floor(r1 * 0.5)}, ${Math.floor(g1 * 0.5)}, ${Math.floor(b1 * 0.65)})`
        );
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-width * 0.2, -height * 0.2, width * 1.4, height * 1.4);

        const glowX = width * (0.5 + Math.sin(elapsed * 1.1 + currentShotIndex) * 0.1);
        const glowY = height * (0.46 + Math.cos(elapsed * 0.8) * 0.06);
        const radGrad = ctx.createRadialGradient(
          glowX,
          glowY,
          12,
          glowX,
          glowY,
          Math.max(width, height) * 0.55
        );
        radGrad.addColorStop(0, `rgba(${ra}, ${ga}, ${ba}, 0.45)`);
        radGrad.addColorStop(0.45, `rgba(${r2}, ${g2}, ${b2}, 0.22)`);
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);

        const horizonY = height * 0.62;
        for (let r = 1; r <= 4; r++) {
          const radius = Math.min(width, height) * 0.065 * r + ((shotProgress * 24) % 24);
          ctx.beginPath();
          ctx.arc(glowX, glowY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${ra}, ${ga}, ${ba}, ${0.5 - r * 0.09})`;
          ctx.lineWidth = r === 2 ? 2.2 : 1.1;
          ctx.stroke();
        }

        ctx.strokeStyle = `rgba(${ra}, ${ga}, ${ba}, 0.6)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(width, horizonY);
        ctx.stroke();
      }

      for (let i = 0; i < 24; i++) {
        const px = (i * 89 + elapsed * (22 + (i % 5) * 8)) % width;
        const py = height - ((i * 59 + elapsed * (26 + (i % 4) * 7)) % height);
        const pr = (i % 4 === 0 ? 3.5 : 1.8) + Math.sin(elapsed * 2 + i) * 0.6;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, pr), 0, Math.PI * 2);
        ctx.fillStyle =
          i % 2 === 0
            ? `rgba(${ra}, ${ga}, ${ba}, 0.32)`
            : 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
      }

      ctx.restore();

      const barHeight =
        aspectRatio === '16:9' ? Math.round(height * 0.085) : Math.round(height * 0.04);
      ctx.fillStyle = '#050608';
      ctx.fillRect(0, 0, width, barHeight);
      ctx.fillRect(0, height - barHeight, width, barHeight);

      if (shot.headlineText) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = `700 ${aspectRatio === '16:9' ? '26px' : '22px'} "Syne", sans-serif`;
        ctx.fillStyle = 'rgba(243, 244, 246, 0.96)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 12;
        ctx.fillText(shot.headlineText, width / 2, height - barHeight - 44);

        if (shot.actionDescription) {
          ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = 'rgba(229, 231, 235, 0.9)';
          const desc =
            shot.actionDescription.length > 82
              ? shot.actionDescription.slice(0, 80) + '…'
              : shot.actionDescription;
          ctx.fillText(desc, width / 2, height - barHeight - 20);
        }
        ctx.restore();
      }

      requestAnimationFrame(drawLoop);
    };

    requestAnimationFrame(drawLoop);
  });

  try {
    onProgress?.('Empaquetando video final MP4 (H.264 + Audio AAC)…');
    const videoBase64 = await blobToBase64(webmBlob);
    const mp4Res = await fetch('/api/export-mp4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoBase64,
        audioBase64: audioBase64 || undefined,
        durationSec: fullSequenceDurationSec,
        capturePassDurationSec: renderDurationSec,
      }),
    });

    if (mp4Res.ok) {
      const mp4Blob = await mp4Res.blob();
      return URL.createObjectURL(mp4Blob);
    }
  } catch (_transcodeErr) {
    // Fallback to recorded blob if offline
  }

  return URL.createObjectURL(webmBlob);
}

/**
 * Exports audio (voiceover or sequence soundtrack) as a real downloadable .mp3 file
 * and returns the MP3 Blob + Object URL so it can also be saved in the Audiobook Folder.
 */
export async function downloadAudioAsMp3(options: {
  audioBase64?: string | null;
  scriptText?: string;
  voiceGender?: string;
  durationSec?: number;
  filename?: string;
  skipBrowserDownload?: boolean;
}): Promise<{ blob: Blob; objectUrl: string }> {
  const response = await fetch('/api/export-mp3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: options.audioBase64 || undefined,
      scriptText: options.scriptText || 'Narración de estudio Kinetix',
      voiceGender: options.voiceGender || 'femenina',
      durationSec: options.durationSec || 12,
    }),
  });

  if (!response.ok) {
    throw new Error('No se pudo exportar el archivo MP3.');
  }

  const mp3Blob = await response.blob();
  const url = URL.createObjectURL(mp3Blob);
  if (!options.skipBrowserDownload) {
    const link = document.createElement('a');
    link.href = url;
    link.download = options.filename || 'kinetix-narracion.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  return { blob: mp3Blob, objectUrl: url };
}

