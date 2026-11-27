import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Upload,
  Paperclip,
  Download,
  FileDown,
  BookOpen,
  Clapperboard,
  Mic,
  Film,
  Image as ImageIcon,
  Layers,
  Plus,
  Trash2,
  Loader2,
  Play,
  Pause,
  Volume2,
  CheckCircle2,
  Wand2,
  Zap,
  Subtitles,
  FilePlus2,
  X,
  Music,
} from 'lucide-react';
import {
  AiGeneratedPdfDocument,
  AiPdfSection,
  exportAiCreatedPdf,
  exportAiCreatedPdfAsTxt,
  exportDynamicSubtitlesAsSrt,
} from '../utils/scriptExporter';
import {
  VideoBook,
  generateDynamicSubtitles,
  downloadAudioAsMp3,
} from '../utils/videoRenderer';
import { matchBestScenesForBookPages } from '../utils/nicheSceneLibrary';
import { STUDIO_PDF_LIBRARY_12 } from '../utils/seoMetadata';
import {
  NARRATOR_AVATAR_PRESETS,
  NarratorAvatarPreset,
} from './TalkingAvatarStage';
import { VoiceDictationButton } from './VoiceDictationButton';
import { pcmBase64ToWav } from '../utils/audioWav';
import { useToast } from './ToastNotification';

interface AiPdfCreatorStudioProps {
  selectedAvatar: NarratorAvatarPreset;
  onSelectAvatar: (avatar: NarratorAvatarPreset) => void;
  onConvertToAudiobook: (
    videoBook: VideoBook,
    pageImages: Record<number, string>,
    audioTake?: { audioBase64: string; wavUrl: string; durationSec: number; fullScript: string } | null
  ) => void;
  onSendToPdfDirector: (text: string, filename: string) => void;
  onSendToScript: (topic: string, fullText: string) => void;
  onSendToNarration: (narrationText: string) => void;
  onSendToSequence: (title: string, narrationText: string, firstImage?: string) => void;
  onMonetizePdf: (title: string, summary: string) => void;
  onBeforeGenerateProject?: () => boolean;
  onProjectGenerated?: (title: string) => void;
}

const DOC_TYPES = [
  'Libro / Ebook Editorial',
  'Guía Práctica Profesional',
  'Manual Técnico & Curso',
  'Informe Ejecutivo & Negocios',
  'Propuesta Comercial Estratégica',
  'Historia / Novela Ilustrada',
];

const EDITORIAL_TONES = [
  'Profesional, claro y persuasivo',
  'Inspirador y cinematográfico',
  'Didáctico paso a paso',
  'Académico y riguroso',
  'Ejecutivo y directo a resultados',
];

const LANGUAGES = ['Español', 'English', 'Português', 'Français', 'Deutsch', 'Italiano'];

const SECTION_PALETTES = [
  { primaryHex: '#0F172A', secondaryHex: '#1E293B', accentHex: '#F59E0B' },
  { primaryHex: '#18181B', secondaryHex: '#27272A', accentHex: '#D97706' },
  { primaryHex: '#0C1222', secondaryHex: '#1B2A4A', accentHex: '#FBBF24' },
  { primaryHex: '#111827', secondaryHex: '#1F2937', accentHex: '#F59E0B' },
];

export const AiPdfCreatorStudio: React.FC<AiPdfCreatorStudioProps> = ({
  selectedAvatar,
  onSelectAvatar,
  onConvertToAudiobook,
  onSendToPdfDirector,
  onSendToScript,
  onSendToNarration,
  onSendToSequence,
  onMonetizePdf,
  onBeforeGenerateProject,
  onProjectGenerated,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sectionImageInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generation Form State
  const [topic, setTopic] = useState<string>('');
  const [docType, setDocType] = useState<string>(DOC_TYPES[0]);
  const [tone, setTone] = useState<string>(EDITORIAL_TONES[0]);
  const [sectionsCount, setSectionsCount] = useState<number>(6);
  const [language, setLanguage] = useState<string>('Español');
  const [author, setAuthor] = useState<string>('Kinetix Studio IA');

  // Attached Reference File State (.pdf / .txt / .md / Built-in Library)
  const [attachedFilename, setAttachedFilename] = useState<string>('');
  const [attachedText, setAttachedText] = useState<string>('');
  const [isExtractingAttachment, setIsExtractingAttachment] = useState<boolean>(false);
  const [showLibraryPicker, setShowLibraryPicker] = useState<boolean>(false);

  // Created AI PDF Document State
  const [pdfDoc, setPdfDoc] = useState<AiGeneratedPdfDocument | null>(null);
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [generatingImgIdx, setGeneratingImgIdx] = useState<number | null>(null);
  const [isGeneratingAllImgs, setIsGeneratingAllImgs] = useState<boolean>(false);
  const [uploadTargetIdx, setUploadTargetIdx] = useState<number>(0);

  // Voice IA (TTS) Preview inside PDF Creator
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState<boolean>(false);
  const [voiceAudio, setVoiceAudio] = useState<{
    audioBase64: string;
    wavUrl: string;
    durationSec: number;
    fullScript: string;
  } | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);
  const [isExportingMp3, setIsExportingMp3] = useState<boolean>(false);

  const shortcutBridgeRef = useRef<{
    triggerGenerate: () => void;
    triggerSave: () => void;
  }>({
    triggerGenerate: () => {},
    triggerSave: () => {},
  });

  useEffect(() => {
    const onShortcutGenerate = () => shortcutBridgeRef.current.triggerGenerate();
    const onShortcutSave = () => shortcutBridgeRef.current.triggerSave();
    window.addEventListener('kinetix:shortcut-generate', onShortcutGenerate);
    window.addEventListener('kinetix:shortcut-save', onShortcutSave);
    return () => {
      window.removeEventListener('kinetix:shortcut-generate', onShortcutGenerate);
      window.removeEventListener('kinetix:shortcut-save', onShortcutSave);
    };
  }, []);

  const totalWords = useMemo(() => {
    if (!pdfDoc) return 0;
    const combined = [
      pdfDoc.title,
      pdfDoc.subtitle,
      pdfDoc.executiveSummary,
      ...pdfDoc.sections.map((s) => `${s.heading} ${s.body} ${s.keyPoints.join(' ')}`),
    ].join(' ');
    return combined.trim().split(/\s+/).filter(Boolean).length;
  }, [pdfDoc]);

  const estimatedReadMin = Math.max(1, Math.round(totalWords / 180));

  const buildPlainTextFromDoc = (doc: AiGeneratedPdfDocument): string => {
    const header = `${doc.title}\n${doc.subtitle}\nAutor: ${doc.author}\n\nResumen Ejecutivo:\n${doc.executiveSummary}\n\n`;
    const body = doc.sections
      .map(
        (s) =>
          `Capítulo ${s.sectionNumber}: ${s.heading}\n${s.body}\nPuntos clave: ${s.keyPoints.join(
            ' · '
          )}\nCita: "${s.highlightQuote}"`
      )
      .join('\n\n');
    return `${header}${body}`;
  };

  const buildVideoBookFromPdfDoc = (doc: AiGeneratedPdfDocument): {
    book: VideoBook;
    imagesMap: Record<number, string>;
  } => {
    const imagesMap: Record<number, string> = {};
    const pages = doc.sections.map((sec, idx) => {
      const palette = SECTION_PALETTES[idx % SECTION_PALETTES.length];
      if (sec.imageUrl) {
        imagesMap[idx] = sec.imageUrl;
      }
      const words = sec.body.trim().split(/\s+/).filter(Boolean).length;
      const estSec = Math.max(10, Math.round((words / 145) * 60));
      return {
        pageNumber: idx + 1,
        chapterTitle: sec.heading,
        pageText: sec.body,
        keyQuote: sec.highlightQuote || sec.keyPoints[0] || sec.heading,
        imagePrompt: sec.imagePrompt,
        durationSec: estSec,
        primaryHex: palette.primaryHex,
        secondaryHex: palette.secondaryHex,
        accentHex: palette.accentHex,
        imageUrl: sec.imageUrl,
      };
    });

    const fullNarration =
      doc.fullNarration?.trim() ||
      pages.map((p) => `Capítulo ${p.pageNumber}: ${p.chapterTitle}. ${p.pageText}`).join(' ');

    const book: VideoBook = {
      bookTitle: doc.title,
      subtitle: doc.subtitle,
      authorOrSource: doc.author || 'Kinetix Studio IA',
      bookStyle: doc.docType || 'Libro Editorial IA',
      totalEstimatedSec: pages.reduce((acc, p) => acc + p.durationSec, 0),
      fullNarration,
      pages,
    };

    return { book, imagesMap };
  };

  // Attach existing .pdf, .docx, .txt, .md, .csv, .rtf, .html, or image files
  const handleAttachFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExtractingAttachment(true);
    const toastId = toast.loading(
      'Procesando archivo(s) adjunto(s)...',
      'Extrayendo texto para integrarlo en tu nuevo PDF con IA.'
    );

    try {
      const extractedBlocks: string[] = [];
      const names: string[] = [];

      for (const file of Array.from(files)) {
        names.push(file.name);
        const isDirectText =
          (file.type.startsWith('text/') && !/html/i.test(file.type)) ||
          /\.(txt|md|markdown|csv|json)$/i.test(file.name);

        if (isDirectText) {
          const txt = await file.text();
          if (txt.trim()) {
            extractedBlocks.push(`[ARCHIVO: ${file.name}]\n${txt.trim()}`);
          }
          continue;
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error(`No se pudo leer el archivo ${file.name}.`));
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/extract-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: base64,
            fileBase64: base64,
            filename: file.name,
            mimeType: file.type,
          }),
        });

        const rawResp = await res.text();
        let data: any = {};
        try {
          data = rawResp ? JSON.parse(rawResp) : {};
        } catch {
          throw new Error(
            res.status === 413
              ? `El archivo ${file.name} excede el tamaño máximo permitido.`
              : `Respuesta inválida del servidor al leer ${file.name}.`
          );
        }

        const extracted = (data.extractedText || data.text || '').trim();
        if (res.ok && extracted) {
          extractedBlocks.push(`[ARCHIVO: ${file.name}]\n${extracted}`);
        } else {
          throw new Error(data.error || `No se pudo extraer texto de ${file.name}`);
        }
      }

      if (extractedBlocks.length === 0) {
        throw new Error('No se encontró texto legible en los archivos seleccionados.');
      }

      const combined = extractedBlocks.join('\n\n---\n\n');
      setAttachedFilename(names.join(', '));
      setAttachedText((prev) => (prev ? `${prev}\n\n${combined}` : combined));
      toast.dismiss(toastId);
      toast.success(
        'Archivo adjuntado correctamente',
        `${names.join(', ')} listo para combinar con tu PDF IA.`
      );
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Error al adjuntar archivo', err?.message || 'Verifica que el archivo sea válido.');
    } finally {
      setIsExtractingAttachment(false);
      e.target.value = '';
    }
  };

  // Generate AI PDF via /api/generate-ai-pdf
  const handleGenerateAiPdf = async () => {
    if (!topic.trim() && !attachedText.trim()) {
      toast.error(
        'Falta contenido base',
        'Escribe un tema, dicta por micrófono o adjunta un archivo PDF/TXT.'
      );
      return;
    }

    if (onBeforeGenerateProject && !onBeforeGenerateProject()) {
      return;
    }

    setIsGeneratingPdf(true);
    setVoiceAudio(null);
    setIsPlayingVoice(false);
    const toastId = toast.loading(
      'Creando tu PDF con IA...',
      `Redactando ${sectionsCount} secciones estructuradas y guion de narración.`
    );

    try {
      const res = await fetch('/api/generate-ai-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          docType,
          tone,
          sectionsCount,
          language,
          author: author.trim() || 'Kinetix Studio IA',
          attachedText: attachedText.trim(),
          attachedFilename,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.pdfDocument) {
        throw new Error(data.error || 'No se pudo generar el documento PDF.');
      }

      const generatedDoc: AiGeneratedPdfDocument = data.pdfDocument;

      // Auto-match cohesive high-res scenes from the 1,200+ Niche Scene Library
      const tempPages = generatedDoc.sections.map((s, idx) => ({
        pageNumber: idx + 1,
        chapterTitle: s.heading,
        pageText: s.body,
        keyQuote: s.highlightQuote,
        imagePrompt: s.imagePrompt,
        durationSec: 12,
        primaryHex: '#0F172A',
        secondaryHex: '#1E293B',
        accentHex: '#F59E0B',
      }));
      const matchedScenes = matchBestScenesForBookPages(tempPages, 'Auto');
      const enrichedSections = generatedDoc.sections.map((s, idx) => ({
        ...s,
        imageUrl: s.imageUrl || matchedScenes[idx]?.imageUrl,
      }));

      setPdfDoc({
        ...generatedDoc,
        sections: enrichedSections,
      });
      setActiveSectionIdx(0);
      onProjectGenerated?.(generatedDoc.title);

      toast.dismiss(toastId);
      toast.success(
        'PDF con IA Creado',
        `"${generatedDoc.title}" con ${enrichedSections.length} secciones e ilustraciones listas.`
      );
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Error al crear PDF', err?.message || 'Ocurrió un error al generar el PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Generate AI illustration for a single section
  const handleGenerateSectionImage = async (idx: number) => {
    if (!pdfDoc || !pdfDoc.sections[idx]) return;
    const sec = pdfDoc.sections[idx];
    const palette = SECTION_PALETTES[idx % SECTION_PALETTES.length];
    setGeneratingImgIdx(idx);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: sec.imagePrompt || `Editorial photography for ${sec.heading}, warm golden lighting, 8k`,
          headlineText: sec.heading.toUpperCase().slice(0, 36),
          primaryHex: palette.primaryHex,
          secondaryHex: palette.secondaryHex,
          accentHex: palette.accentHex,
          aspectRatio: '16:9',
          shotNumber: idx + 1,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setPdfDoc((prev) => {
          if (!prev) return prev;
          const nextSections = prev.sections.map((s, i) =>
            i === idx ? { ...s, imageUrl: data.imageUrl } : s
          );
          return { ...prev, sections: nextSections };
        });
        toast.success('Ilustración IA lista', `Sección ${idx + 1} actualizada.`);
      }
    } catch {
      toast.error('Error de imagen', 'No se pudo generar la ilustración IA.');
    } finally {
      setGeneratingImgIdx(null);
    }
  };

  // Auto-fill all sections from 1,200+ Niche Scene Library
  const handleAutoMatchNicheImages = () => {
    if (!pdfDoc) return;
    const tempPages = pdfDoc.sections.map((s, idx) => ({
      pageNumber: idx + 1,
      chapterTitle: s.heading,
      pageText: s.body,
      keyQuote: s.highlightQuote,
      imagePrompt: s.imagePrompt,
      durationSec: 12,
      primaryHex: '#0F172A',
      secondaryHex: '#1E293B',
      accentHex: '#F59E0B',
    }));
    const matched = matchBestScenesForBookPages(tempPages, 'Auto');
    setPdfDoc((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s, idx) => ({
          ...s,
          imageUrl: matched[idx]?.imageUrl || s.imageUrl,
        })),
      };
    });
    toast.success('Escenas asignadas', 'Todas las secciones recibieron fotografías de la biblioteca 1,200+.');
  };

  // Generate AI images for ALL sections
  const handleGenerateAllSectionImages = async () => {
    if (!pdfDoc || isGeneratingAllImgs) return;
    setIsGeneratingAllImgs(true);
    const toastId = toast.loading(
      'Ilustrando todas las secciones con IA...',
      `Generando ${pdfDoc.sections.length} imágenes editoriales.`
    );
    try {
      for (let i = 0; i < pdfDoc.sections.length; i++) {
        await handleGenerateSectionImage(i);
      }
      toast.dismiss(toastId);
      toast.success('Ilustraciones completas', 'Todas las secciones del PDF tienen arte IA.');
    } finally {
      setIsGeneratingAllImgs(false);
    }
  };

  // Upload custom image to a section
  const handleUploadSectionImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pdfDoc) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setPdfDoc((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.map((s, idx) =>
              idx === uploadTargetIdx ? { ...s, imageUrl: dataUrl } : s
            ),
          };
        });
        toast.success('Imagen adjuntada', `Imagen personalizada añadida a la sección ${uploadTargetIdx + 1}.`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Synthesize real Gemini 24kHz TTS narration for this PDF
  const handleSynthesizePdfVoice = async () => {
    if (!pdfDoc || isSynthesizingVoice) return;
    const scriptToSpeak =
      pdfDoc.fullNarration?.trim() ||
      pdfDoc.sections.map((s) => `Sección ${s.sectionNumber}: ${s.heading}. ${s.body}`).join(' ');

    setIsSynthesizingVoice(true);
    const toastId = toast.loading(
      'Sintetizando Voz IA 24kHz...',
      `Narrador: ${selectedAvatar.name} (${selectedAvatar.accent})`
    );
    try {
      const res = await fetch('/api/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: scriptToSpeak,
          voiceGender: selectedAvatar.gender,
          voiceName: selectedAvatar.voiceName,
          accent: selectedAvatar.accent,
          tone: 'narrador editorial cálido, claro y profesional',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || 'No se pudo sintetizar el audio del PDF.');
      }
      const { wavUrl, durationSec } = pcmBase64ToWav(data.audioBase64, data.sampleRate || 24000);
      setVoiceAudio({
        audioBase64: data.audioBase64,
        wavUrl,
        durationSec,
        fullScript: scriptToSpeak,
      });
      toast.dismiss(toastId);
      toast.success(
        'Voz IA del PDF lista',
        `Narración generada (${Math.round(durationSec)}s) con ${selectedAvatar.name}.`
      );
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Error al sintetizar voz', err?.message || 'Intenta nuevamente.');
    } finally {
      setIsSynthesizingVoice(false);
    }
  };

  const handleTogglePlayVoice = () => {
    const el = audioRef.current;
    if (!el || !voiceAudio) return;
    if (isPlayingVoice) {
      el.pause();
      setIsPlayingVoice(false);
    } else {
      el.play()
        .then(() => setIsPlayingVoice(true))
        .catch(() => setIsPlayingVoice(false));
    }
  };

  const handleDownloadVoiceMp3 = async () => {
    if (!pdfDoc || isExportingMp3) return;
    setIsExportingMp3(true);
    try {
      await downloadAudioAsMp3({
        audioBase64: voiceAudio?.audioBase64 || null,
        scriptText: pdfDoc.fullNarration,
        voiceGender: selectedAvatar.gender,
        durationSec: voiceAudio?.durationSec || Math.max(15, pdfDoc.sections.length * 10),
        filename: `${pdfDoc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 36)}-audio.mp3`,
      });
      toast.success('Audio MP3 descargado', 'La narración de tu PDF se guardó en MP3.');
    } catch {
      toast.error('Error al exportar MP3', 'No se pudo codificar el archivo MP3.');
    } finally {
      setIsExportingMp3(false);
    }
  };

  const handleExportPdfSubtitlesSrt = () => {
    if (!pdfDoc) return;
    const { book } = buildVideoBookFromPdfDoc(pdfDoc);
    const totalDur = voiceAudio?.durationSec || book.totalEstimatedSec || 60;
    const cues = generateDynamicSubtitles(book.fullNarration, totalDur, book.pages);
    exportDynamicSubtitlesAsSrt(cues, pdfDoc.title);
    toast.success('Subtítulos .SRT descargados', `${cues.length} bloques sincronizados exportados.`);
  };

  const updateSectionField = (idx: number, patch: Partial<AiPdfSection>) => {
    setPdfDoc((prev) => {
      if (!prev) return prev;
      const nextSections = prev.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s));
      const nextNarration = nextSections
        .map((s) => `Sección ${s.sectionNumber}: ${s.heading}. ${s.body}`)
        .join(' ');
      return { ...prev, sections: nextSections, fullNarration: nextNarration };
    });
  };

  // Sync latest callbacks for global Ctrl+Enter / Ctrl+S shortcuts
  shortcutBridgeRef.current = {
    triggerGenerate: () => {
      if (isGeneratingPdf) {
        toast.info('Generación en curso', 'Ya se está generando tu documento PDF con IA.');
        return;
      }
      if (!topic.trim() && !attachedText.trim()) {
        toast.info(
          'Falta tema o documento',
          'Escribe un tema o adjunta un archivo antes de pulsar Ctrl+Enter.'
        );
        return;
      }
      void handleGenerateAiPdf();
    },
    triggerSave: () => {
      if (!pdfDoc) {
        toast.info(
          'Sin PDF generado aún',
          'Pulsa Ctrl+Enter para crear el PDF completo con IA y luego Ctrl+S para guardarlo.'
        );
        return;
      }
      exportAiCreatedPdf(pdfDoc);
      toast.success(
        'PDF Guardado (Ctrl+S)',
        `Se descargó "${pdfDoc.title}" en formato PDF profesional.`
      );
    },
  };

  const handleAddSection = () => {
    setPdfDoc((prev) => {
      if (!prev) return prev;
      const nextNum = prev.sections.length + 1;
      const newSec: AiPdfSection = {
        sectionNumber: nextNum,
        heading: `Nueva Sección ${nextNum}`,
        body: 'Escribe o edita aquí el desarrollo de esta nueva sección de tu documento PDF.',
        keyPoints: ['Idea principal accionable', 'Recomendación práctica de implementación'],
        highlightQuote: 'Cada sección aporta valor claro y directo al lector.',
        imagePrompt: `Editorial studio photography for ${prev.title} section ${nextNum}, golden warm light, 8k`,
      };
      const nextSections = [...prev.sections, newSec];
      setActiveSectionIdx(nextSections.length - 1);
      return {
        ...prev,
        sections: nextSections,
        fullNarration: nextSections
          .map((s) => `Sección ${s.sectionNumber}: ${s.heading}. ${s.body}`)
          .join(' '),
      };
    });
  };

  const handleRemoveSection = (idx: number) => {
    setPdfDoc((prev) => {
      if (!prev || prev.sections.length <= 1) return prev;
      const filtered = prev.sections
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, sectionNumber: i + 1 }));
      setActiveSectionIdx(Math.max(0, Math.min(idx, filtered.length - 1)));
      return {
        ...prev,
        sections: filtered,
        fullNarration: filtered
          .map((s) => `Sección ${s.sectionNumber}: ${s.heading}. ${s.body}`)
          .join(' '),
      };
    });
  };

  const activeSection = pdfDoc?.sections[activeSectionIdx] || pdfDoc?.sections[0] || null;

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.csv,.docx,.doc,.rtf,.html,.json,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,image/*"
        multiple
        onChange={handleAttachFiles}
        className="hidden"
      />
      <input
        ref={sectionImageInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadSectionImage}
        className="hidden"
      />

      {/* Top Studio Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
            CREAR PDF CON IA · TODAS LAS HERRAMIENTAS INTEGRADAS
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-amber-900 tracking-tight">
            Estudio Creador de Documentos PDF con Inteligencia Artificial
          </h2>
          <p className="text-sm text-slate-600">
            Redacta, adjunta PDFs o textos existentes, dicta por micrófono, ilustra con IA o +1,200
            fotos, agrega voz neuronal 24kHz, descarga tu PDF real o envíalo directo a Audiolibro,
            Storyboard y Video MP4.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtractingAttachment}
            className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
          >
            {isExtractingAttachment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
            <span>Adjuntar PDF / TXT</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLibraryPicker((v) => !v)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>Usar Biblioteca (12 PDFs)</span>
          </button>

          {pdfDoc && (
            <button
              type="button"
              onClick={() => {
                exportAiCreatedPdf(pdfDoc);
                toast.success('PDF descargado', `"${pdfDoc.title}.pdf" descargado en tu equipo.`);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>Descargar PDF (.pdf)</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional 12 Built-in PDFs Picker Drawer */}
      {showLibraryPicker && (
        <div className="bg-white border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-amber-900">
              Selecciona uno de los 12 PDFs incluidos para adjuntar y transformar con IA
            </span>
            <button
              type="button"
              onClick={() => setShowLibraryPicker(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {STUDIO_PDF_LIBRARY_12.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  setAttachedFilename(doc.filename);
                  setAttachedText(doc.content);
                  if (!topic.trim()) {
                    setTopic(doc.label.replace(/^PDF \d+\s*·\s*/, ''));
                  }
                  setShowLibraryPicker(false);
                  toast.success('PDF de biblioteca adjuntado', doc.label);
                }}
                className="text-left p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 transition-colors cursor-pointer space-y-1"
              >
                <div className="text-xs font-bold text-slate-900 line-clamp-1">{doc.label}</div>
                <div className="text-[11px] text-amber-800 font-medium">{doc.niche}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main 12-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (4 cols): Brief, Dictation, Attachments & Generation Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-amber-900 uppercase tracking-wide">
                1. Configurar Documento PDF
              </h3>
              <VoiceDictationButton
                currentValue={topic}
                onChangeText={setTopic}
                variant="light"
                size="xs"
                label="Dictar"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Tema, idea o instrucciones del PDF
              </label>
              <textarea
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: Guía completa de finanzas personales con IA para emprendedores modernos, con pasos accionables y casos reales..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Attached Reference Indicator */}
            {attachedText && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 truncate">
                    <Paperclip className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{attachedFilename || 'Texto adjunto'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedFilename('');
                      setAttachedText('');
                    }}
                    className="text-xs font-bold text-rose-700 hover:underline shrink-0 cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {attachedText.slice(0, 180)}... ({attachedText.split(/\s+/).length} palabras
                  adjuntas)
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Tipo de PDF</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  {DOC_TYPES.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Idioma</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Tono Editorial</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
              >
                {EDITORIAL_TONES.map((tOpt) => (
                  <option key={tOpt} value={tOpt}>
                    {tOpt}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Secciones ({sectionsCount})
                </label>
                <input
                  type="range"
                  min={3}
                  max={12}
                  value={sectionsCount}
                  onChange={(e) => setSectionsCount(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer mt-1.5"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Autor</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Tu nombre o marca"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateAiPdf}
              disabled={isGeneratingPdf}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando PDF Completo con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Crear PDF Completo con IA</span>
                </>
              )}
            </button>
          </div>

          {/* Integrated Voice IA & Narrator Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span>2. Voz IA 24kHz & Subtítulos</span>
            </h3>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">
                Narrador / Avatar del PDF
              </label>
              <select
                value={selectedAvatar.id}
                onChange={(e) => {
                  const found = NARRATOR_AVATAR_PRESETS.find((a) => a.id === e.target.value);
                  if (found) onSelectAvatar(found);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
              >
                {NARRATOR_AVATAR_PRESETS.map((av) => (
                  <option key={av.id} value={av.id}>
                    #{av.number} {av.name} · {av.accent} ({av.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSynthesizePdfVoice}
                disabled={!pdfDoc || isSynthesizingVoice}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 whitespace-nowrap"
              >
                {isSynthesizingVoice ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Sintetizando...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sintetizar Voz IA</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportPdfSubtitlesSrt}
                disabled={!pdfDoc}
                className="py-2 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-45 whitespace-nowrap"
                title="Descargar subtítulos dinámicos sincronizados (.SRT)"
              >
                <Subtitles className="w-3.5 h-3.5" />
                <span>.SRT</span>
              </button>
            </div>

            {voiceAudio && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={handleTogglePlayVoice}
                    className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {isPlayingVoice ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-emerald-900 truncate">
                      Voz IA · {selectedAvatar.name}
                    </div>
                    <div className="text-[11px] font-mono text-emerald-700">
                      {Math.round(voiceAudio.durationSec)}s · WAV 24kHz
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadVoiceMp3}
                  disabled={isExportingMp3}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {isExportingMp3 ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Music className="w-3 h-3" />
                  )}
                  <span>MP3</span>
                </button>
                <audio
                  ref={audioRef}
                  src={voiceAudio.wavUrl}
                  onEnded={() => setIsPlayingVoice(false)}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* 1-Click Send to ALL Studio Tools */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-amber-900 uppercase tracking-wide">
              3. Enviar PDF a Todas las Herramientas
            </h3>
            <p className="text-xs text-slate-600">
              Conecta el documento creado directamente con cualquier módulo del estudio sin copiar ni
              pegar.
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={!pdfDoc}
                onClick={() => {
                  if (!pdfDoc) return;
                  const { book, imagesMap } = buildVideoBookFromPdfDoc(pdfDoc);
                  onConvertToAudiobook(book, imagesMap, voiceAudio);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-between cursor-pointer disabled:opacity-45 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Convertir a Audiolibro / Video Libro IA</span>
                </span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={!pdfDoc}
                onClick={() => {
                  if (!pdfDoc) return;
                  onSendToPdfDirector(
                    buildPlainTextFromDoc(pdfDoc),
                    `${pdfDoc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}.pdf`
                  );
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-800 font-bold text-xs flex items-center justify-between cursor-pointer disabled:opacity-45 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Clapperboard className="w-4 h-4 text-amber-700" />
                  <span>Enviar a Director PDF → Storyboard</span>
                </span>
                <span className="text-amber-700">→</span>
              </button>

              <button
                type="button"
                disabled={!pdfDoc}
                onClick={() => {
                  if (!pdfDoc) return;
                  onSendToScript(pdfDoc.title, buildPlainTextFromDoc(pdfDoc));
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-800 font-bold text-xs flex items-center justify-between cursor-pointer disabled:opacity-45 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Adaptar a Guion Audiovisual</span>
                </span>
                <span className="text-amber-700">→</span>
              </button>

              <button
                type="button"
                disabled={!pdfDoc}
                onClick={() => {
                  if (!pdfDoc) return;
                  onSendToNarration(pdfDoc.fullNarration || buildPlainTextFromDoc(pdfDoc));
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-800 font-bold text-xs flex items-center justify-between cursor-pointer disabled:opacity-45 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-amber-700" />
                  <span>Abrir en Estudio de Voz IA (TTS)</span>
                </span>
                <span className="text-amber-700">→</span>
              </button>

              <button
                type="button"
                disabled={!pdfDoc}
                onClick={() => {
                  if (!pdfDoc) return;
                  onSendToSequence(
                    pdfDoc.title,
                    pdfDoc.fullNarration || pdfDoc.executiveSummary,
                    pdfDoc.sections[0]?.imageUrl
                  );
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-800 font-bold text-xs flex items-center justify-between cursor-pointer disabled:opacity-45 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-amber-700" />
                  <span>Crear Video MP4 con Subtítulos</span>
                </span>
                <span className="text-amber-700">→</span>
              </button>

              <button
                type="button"
                disabled={!pdfDoc}
                onClick={() => {
                  if (!pdfDoc) return;
                  onMonetizePdf(pdfDoc.title, pdfDoc.executiveSummary);
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-between cursor-pointer disabled:opacity-45 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-700" />
                  <span>Monetizar PDF · Botón Acceso PayPal</span>
                </span>
                <span className="text-amber-700">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 cols): Interactive Live Document Studio & Editor */}
        <div className="lg:col-span-8 space-y-4">
          {!pdfDoc ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
                <FilePlus2 className="w-7 h-7" />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-xl font-extrabold text-amber-900">
                  Tu Nuevo Documento PDF con IA aparecerá aquí
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Escribe un tema a la izquierda, usa el micrófono para dictar o adjunta archivos PDF
                  existentes. La IA redactará el libro o informe completo con secciones editables,
                  citas destacadas, ilustraciones y narración lista para exportar.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                {[
                  'Guía Práctica de Inteligencia Artificial para Negocios',
                  'Ebook: Hábitos Financieros de Alto Rendimiento',
                  'Manual Completo de Producción Audiovisual y Podcast',
                ].map((quickIdea) => (
                  <button
                    key={quickIdea}
                    type="button"
                    onClick={() => setTopic(quickIdea)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    {quickIdea}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {/* Document Meta & Export Toolbar */}
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600">
                  <span className="font-bold text-amber-800">{pdfDoc.docType}</span>
                  <span>{pdfDoc.sections.length} secciones</span>
                  <span>{totalWords.toLocaleString()} palabras</span>
                  <span>~{estimatedReadMin} min lectura</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoMatchNicheImages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-amber-400 text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Auto-asignar fotos de la biblioteca 1,200+ a todas las secciones"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    <span>Auto-Fotos 1,200+</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAllSectionImages}
                    disabled={isGeneratingAllImgs}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900 flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {isGeneratingAllImgs ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    <span>Ilustrar Todo IA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportAiCreatedPdfAsTxt(pdfDoc);
                      toast.success('Texto .TXT descargado', 'Archivo guardado correctamente.');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.TXT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportAiCreatedPdf(pdfDoc);
                      toast.success('PDF descargado', `"${pdfDoc.title}.pdf" descargado.`);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Descargar .PDF</span>
                  </button>
                </div>
              </div>

              {/* Cover & Executive Summary Inline Editor */}
              <div className="p-5 sm:p-6 border-b border-slate-200 space-y-3">
                <input
                  type="text"
                  value={pdfDoc.title}
                  onChange={(e) => setPdfDoc({ ...pdfDoc, title: e.target.value })}
                  className="w-full text-xl sm:text-2xl font-extrabold text-amber-900 bg-transparent border-b border-transparent hover:border-amber-200 focus:border-amber-500 focus:outline-none pb-1"
                />
                <input
                  type="text"
                  value={pdfDoc.subtitle}
                  onChange={(e) => setPdfDoc({ ...pdfDoc, subtitle: e.target.value })}
                  className="w-full text-sm font-medium text-slate-600 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-amber-500 focus:outline-none pb-1"
                />
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    Resumen Ejecutivo
                  </label>
                  <textarea
                    rows={2}
                    value={pdfDoc.executiveSummary}
                    onChange={(e) => setPdfDoc({ ...pdfDoc, executiveSummary: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Section Tabs Strip */}
              <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto">
                {pdfDoc.sections.map((sec, idx) => (
                  <button
                    key={sec.sectionNumber}
                    type="button"
                    onClick={() => setActiveSectionIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                      idx === activeSectionIdx
                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    {String(sec.sectionNumber).padStart(2, '0')}. {sec.heading.slice(0, 22)}
                    {sec.heading.length > 22 ? '…' : ''}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 border border-dashed border-amber-400 text-amber-800 hover:bg-amber-50 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Sección</span>
                </button>
              </div>

              {/* Active Section Editor & Visual Card */}
              {activeSection && (
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-mono font-bold text-amber-800">
                      SECCIÓN {String(activeSection.sectionNumber).padStart(2, '0')} DE{' '}
                      {String(pdfDoc.sections.length).padStart(2, '0')}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateSectionImage(activeSectionIdx)}
                        disabled={generatingImgIdx === activeSectionIdx}
                        className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        {generatingImgIdx === activeSectionIdx ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>Generar Imagen IA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUploadTargetIdx(activeSectionIdx);
                          sectionImageInputRef.current?.click();
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Foto</span>
                      </button>

                      {pdfDoc.sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(activeSectionIdx)}
                          className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Eliminar esta sección"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section Visual Illustration Preview */}
                  {activeSection.imageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 h-52 sm:h-60 bg-slate-950">
                      <img
                        src={activeSection.imageUrl}
                        alt={activeSection.heading}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 h-36 flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-50">
                      <ImageIcon className="w-6 h-6 text-amber-600" />
                      <span className="text-xs font-semibold">
                        Sin ilustración asignada en esta sección
                      </span>
                    </div>
                  )}

                  {/* Heading & Body Inputs */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Título de la Sección</label>
                      <input
                        type="text"
                        value={activeSection.heading}
                        onChange={(e) =>
                          updateSectionField(activeSectionIdx, { heading: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Contenido Editorial (Editable)
                      </label>
                      <textarea
                        rows={6}
                        value={activeSection.body}
                        onChange={(e) =>
                          updateSectionField(activeSectionIdx, { body: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 leading-relaxed focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Puntos Clave (1 por línea)
                        </label>
                        <textarea
                          rows={3}
                          value={activeSection.keyPoints.join('\n')}
                          onChange={(e) =>
                            updateSectionField(activeSectionIdx, {
                              keyPoints: e.target.value
                                .split('\n')
                                .map((l) => l.trim())
                                .filter(Boolean),
                            })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Cita Destacada</label>
                        <textarea
                          rows={3}
                          value={activeSection.highlightQuote}
                          onChange={(e) =>
                            updateSectionField(activeSectionIdx, {
                              highlightQuote: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-amber-300 bg-amber-50/40 px-3 py-2 text-xs font-semibold text-amber-950 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
