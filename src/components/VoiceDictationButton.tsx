import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Sparkles, AlertCircle } from 'lucide-react';

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

export interface VoiceDictationButtonProps {
  /** Current text value of the target field */
  currentValue: string;
  /** Callback invoked with the updated text when voice is transcribed */
  onChangeText: (updatedValue: string) => void;
  /** Visual theme to match light or dark studio cards */
  variant?: 'light' | 'dark';
  /** Compact size or standard button size */
  size?: 'xs' | 'sm';
  /** Custom label for the button when idle */
  label?: string;
  /** Language code for speech recognition (default: 'es-ES') */
  lang?: string;
  /** Optional className override */
  className?: string;
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  currentValue,
  onChangeText,
  variant = 'dark',
  size = 'xs',
  label = 'Dictar por voz',
  lang = 'es-ES',
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [errorHint, setErrorHint] = useState<string | null>(null);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const latestValueRef = useRef<string>(currentValue);
  const onChangeRef = useRef<(val: string) => void>(onChangeText);

  useEffect(() => {
    latestValueRef.current = currentValue;
  }, [currentValue]);

  useEffect(() => {
    onChangeRef.current = onChangeText;
  }, [onChangeText]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore stop errors on unmount
        }
      }
    };
  }, []);

  const toggleDictation = () => {
    setErrorHint(null);

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore stop errors
        }
      }
      setIsListening(false);
      setInterimText('');
      return;
    }

    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionCtor) {
      setErrorHint('Tu navegador no soporta dictado por voz (usa Chrome, Edge o Safari).');
      setTimeout(() => setErrorHint(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscriptChunk = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            finalTranscriptChunk += text;
          } else {
            currentInterim += text;
          }
        }

        setInterimText(currentInterim.trim());

        if (finalTranscriptChunk.trim()) {
          const cleanChunk = finalTranscriptChunk.trim();
          const base = latestValueRef.current.trim();
          const separator = base.length > 0 ? ' ' : '';
          const updated = `${base}${separator}${cleanChunk}`;
          latestValueRef.current = updated;
          onChangeRef.current(updated);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorHint('Permiso de micrófono denegado en el navegador.');
        } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setErrorHint(`Error de voz: ${event.error}`);
        }
        setIsListening(false);
        setInterimText('');
        setTimeout(() => setErrorHint(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (_err) {
      setErrorHint('No se pudo iniciar el micrófono del navegador.');
      setIsListening(false);
      setTimeout(() => setErrorHint(null), 4000);
    }
  };

  const baseSizeClasses =
    size === 'sm' ? 'px-3 py-1.5 text-xs gap-1.5' : 'px-2.5 py-1 text-[11px] gap-1.5';

  const themeClasses = isListening
    ? 'bg-red-500 hover:bg-red-600 text-white border border-red-400 shadow-sm animate-pulse'
    : variant === 'light'
    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90'
    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35';

  return (
    <div className={`inline-flex flex-col items-end gap-1 ${className}`}>
      <div className="inline-flex items-center gap-2">
        {isListening && interimText && (
          <span
            className={`max-w-[220px] truncate text-[11px] italic px-2 py-0.5 rounded-md border ${
              variant === 'light'
                ? 'bg-indigo-50/90 text-indigo-800 border-indigo-200'
                : 'bg-[#161922] text-amber-200 border-amber-500/30'
            }`}
            title={interimText}
          >
            “{interimText}…”
          </span>
        )}

        <button
          type="button"
          onClick={toggleDictation}
          title={
            isListening
              ? 'Detener transcripción de voz'
              : 'Dictar tus ideas con el micrófono del navegador (Voz a Texto)'
          }
          className={`inline-flex items-center rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${baseSizeClasses} ${themeClasses}`}
        >
          {isListening ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span>Escuchando… (Detener)</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>{label}</span>
            </>
          )}
        </button>
      </div>

      {errorHint && (
        <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{errorHint}</span>
        </span>
      )}
    </div>
  );
};
