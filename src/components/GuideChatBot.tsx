import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  Volume2,
  Square,
  CheckCircle2,
  Circle,
  ArrowRight,
  Compass,
  MessageSquare,
  DollarSign,
  FilePlus2,
  BookOpen,
  Upload,
  Play,
  Layers,
} from 'lucide-react';
import { VoiceDictationButton } from './VoiceDictationButton';
import {
  unlockStudioAudioContext,
  playBase64AudioViaWebAudio,
  WebAudioPlaybackHandle,
} from '../utils/audioPlayerEngine';

export type GuideActionType =
  | 'videobook'
  | 'ai-pdf-creator'
  | 'niche-gallery'
  | 'paypal-monetization'
  | 'open-trial'
  | 'upload-file'
  | 'open-player'
  | 'test-voice';

export interface GuideSuggestedAction {
  label: string;
  actionType: GuideActionType;
}

interface GuideMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: GuideSuggestedAction[];
}

export interface GuideChatBotProps {
  activeModule: string;
  hasCreatedVideoBook: boolean;
  hasLoadedText: boolean;
  accessTier: string;
  userTokenBalance: number;
  onExecuteAction: (action: GuideActionType) => void;
}

const QUICK_STARTERS = [
  '¿Cómo subo mi PDF y creo un audiolibro con voz?',
  '¿Cómo creo un PDF completo con IA?',
  '¿Cómo funciona la prueba por solo $5 DLL con PayPal?',
  '¿Dónde cambio el color y opacidad de los subtítulos?',
];

export const GuideChatBot: React.FC<GuideChatBotProps> = ({
  activeModule,
  hasCreatedVideoBook,
  hasLoadedText,
  accessTier,
  userTokenBalance,
  onExecuteAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'tour'>('chat');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const speechHandleRef = useRef<WebAudioPlaybackHandle | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<GuideMessage[]>([
    {
      id: 'guide-welcome',
      sender: 'assistant',
      text:
        '¡Hola! Soy tu **Bot Chat Guía IA**. Te ayudo paso a paso a subir archivos, crear audiolibros con voz real 24kHz, generar PDFs completos con IA o activar la **Prueba por solo $5 DLL** con PayPal.\n\n¿Qué quieres hacer primero?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Cargar Archivo Ahora', actionType: 'upload-file' },
        { label: 'Crear PDF Completo con IA', actionType: 'ai-pdf-creator' },
        { label: 'Prueba por solo $5 DLL', actionType: 'open-trial' },
      ],
    },
  ]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [isOpen, activeTab, messages]);

  useEffect(() => {
    return () => {
      if (speechHandleRef.current) {
        speechHandleRef.current.stop();
        speechHandleRef.current = null;
      }
    };
  }, []);

  const stopBotVoice = () => {
    if (speechHandleRef.current) {
      speechHandleRef.current.stop();
      speechHandleRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  const handleSpeakReply = async (msg: GuideMessage) => {
    unlockStudioAudioContext();
    if (speakingMsgId === msg.id) {
      stopBotVoice();
      return;
    }
    stopBotVoice();
    setSpeakingMsgId(msg.id);

    const cleanSpeech = msg.text.replace(/\*\*/g, '').replace(/[#•]/g, '').slice(0, 650);
    try {
      const res = await fetch('/api/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: cleanSpeech,
          voiceGender: 'femenina',
          voiceName: 'Kore',
          accent: 'español neutro latinoamericano',
          tone: 'amable, claro y profesional',
        }),
      });
      const data = await res.json();
      if (res.ok && data.audioBase64 && data.isRealVoice !== false) {
        const handle = await playBase64AudioViaWebAudio(data.audioBase64, {
          volume: 1.0,
          muted: false,
          sampleRate: data.sampleRate || 24000,
          onEnded: () => {
            speechHandleRef.current = null;
            setSpeakingMsgId(null);
          },
        });
        speechHandleRef.current = handle;
        return;
      }
      throw new Error('Fallback speech');
    } catch {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const utt = new SpeechSynthesisUtterance(cleanSpeech);
        utt.lang = 'es-ES';
        utt.onend = () => setSpeakingMsgId(null);
        utt.onerror = () => setSpeakingMsgId(null);
        window.speechSynthesis.speak(utt);
      } else {
        setSpeakingMsgId(null);
      }
    }
  };

  const handleSend = async (overrideText?: string) => {
    const content = (overrideText ?? inputText).trim();
    if (!content || isSending) return;

    const userMsg: GuideMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch('/api/guide-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationHistory: messages.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          context: {
            activeModule,
            hasCreatedVideoBook,
            accessTier,
            userTokenBalance,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.reply) {
        throw new Error(data.error || 'Error de conexión con el Bot Guía IA.');
      }

      const botMsg: GuideMessage = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: Array.isArray(data.suggestedActions) ? data.suggestedActions : undefined,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text:
            err?.message ||
            'No se pudo conectar en este momento con el Bot Guía IA. Intenta de nuevo en unos segundos.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const renderFormattedLine = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-extrabold text-amber-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  const tourSteps: Array<{
    id: string;
    title: string;
    desc: string;
    done: boolean;
    btnLabel: string;
    action: GuideActionType;
    icon: React.ReactNode;
  }> = [
    {
      id: 'step-1',
      title: '1. Carga tu archivo o plantilla',
      desc: 'Sube PDF, Word (.docx), TXT o imagen (OCR) con un clic o arrastrando.',
      done: hasLoadedText,
      btnLabel: 'Cargar Archivo',
      action: 'upload-file',
      icon: <Upload className="w-3.5 h-3.5" />,
    },
    {
      id: 'step-2',
      title: '2. Prueba tu Voz IA real (24 kHz)',
      desc: 'Escucha al instante cualquiera de los 30 narradores antes de producir.',
      done: false,
      btnLabel: 'Probar Voz',
      action: 'test-voice',
      icon: <Volume2 className="w-3.5 h-3.5" />,
    },
    {
      id: 'step-3',
      title: '3. Crea Audiolibro o PDF Completo con IA',
      desc: 'Genera capítulos, escenas, voz real y documento PDF descargable.',
      done: hasCreatedVideoBook,
      btnLabel: 'Crear PDF IA',
      action: 'ai-pdf-creator',
      icon: <FilePlus2 className="w-3.5 h-3.5" />,
    },
    {
      id: 'step-4',
      title: '4. Reproduce con Subtítulos Dinámicos',
      desc: 'Personaliza color, tamaño y opacidad del fondo al instante debajo del video.',
      done: hasCreatedVideoBook,
      btnLabel: 'Reproducir',
      action: 'open-player',
      icon: <Play className="w-3.5 h-3.5" />,
    },
    {
      id: 'step-5',
      title: '5. Activa Prueba por solo $5 DLL (PayPal)',
      desc: 'Pago real directo a PayPal con Acceso Limitado por 7 días + 62,500 Tokens.',
      done: accessTier !== 'free',
      btnLabel: 'Activar $5 DLL',
      action: 'open-trial',
      icon: <DollarSign className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <>
      {/* Floating Always-Visible Guide Chat Bot Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 px-4 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white border-2 border-amber-400 shadow-[0_12px_30px_rgba(180,83,9,0.35)] flex items-center gap-2.5 transition-all hover:scale-[1.03] cursor-pointer"
          aria-label="Abrir Bot Chat Guía IA"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shrink-0">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </span>
          <div className="text-left leading-tight pr-1">
            <div className="text-xs font-extrabold text-amber-300 tracking-wide">
              Bot Chat Guía IA
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              Te guío paso a paso
            </div>
          </div>
        </button>
      )}

      {/* Floating Crisp White + 24K Gold Guide Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[410px] h-[min(620px,calc(100vh-2rem))] bg-white border-2 border-amber-300 rounded-2xl shadow-[0_24px_60px_rgba(15,23,42,0.22)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-white border-b border-amber-200 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold text-amber-900 truncate">
                    Bot Chat Guía IA
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  Guía real en vivo · Acciones en 1 clic
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                stopBotVoice();
                setIsOpen(false);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Cerrar Bot Guía"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2 Tabs: Chat IA | Tour Paso a Paso */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white text-amber-900 border border-amber-300 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat Guía IA</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tour')}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'tour'
                  ? 'bg-white text-amber-900 border border-amber-300 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Tour 5 Pasos</span>
            </button>
          </div>

          {activeTab === 'tour' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-white">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-semibold">
                Sigue estos 5 pasos reales para crear, reproducir y monetizar hoy mismo:
              </div>

              {tourSteps.map((st) => (
                <div
                  key={st.id}
                  className={`p-3 rounded-xl border transition-colors ${
                    st.done
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {st.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900">{st.title}</div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{st.desc}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onExecuteAction(st.action);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {st.icon}
                      <span>{st.btnLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onExecuteAction('videobook')}
                  className="py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>Audiolibro IA</span>
                </button>
                <button
                  type="button"
                  onClick={() => onExecuteAction('niche-gallery')}
                  className="py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-700" />
                  <span>+1,200 Escenas</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/60">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isSpeakingThis = speakingMsgId === msg.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed space-y-1.5 ${
                          isUser
                            ? 'bg-slate-950 text-white rounded-br-sm'
                            : 'bg-white border border-amber-200/90 text-slate-800 rounded-bl-sm shadow-2xs'
                        }`}
                      >
                        {msg.text.split('\n').map((line, i) => (
                          <p key={i} className={line.trim() === '' ? 'h-1' : ''}>
                            {isUser ? line : renderFormattedLine(line)}
                          </p>
                        ))}

                        {!isUser && (
                          <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-slate-100">
                            <span className="text-[10px] font-mono text-slate-400">
                              {msg.timestamp}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSpeakReply(msg)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                isSpeakingThis
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              {isSpeakingThis ? (
                                <>
                                  <Square className="w-2.5 h-2.5 fill-current" />
                                  <span>Detener voz</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" />
                                  <span>Escuchar</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-[92%]">
                          {msg.suggestedActions.map((act, idx) => (
                            <button
                              key={`${msg.id}-act-${idx}`}
                              type="button"
                              onClick={() => onExecuteAction(act.actionType)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-950 border border-amber-300 text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 shrink-0" />
                              <span>{act.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isSending && (
                  <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold px-2 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Bot Guía IA escribiendo...</span>
                  </div>
                )}

                <div ref={endRef} />
              </div>

              {/* Quick Question Chips */}
              <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto shrink-0">
                {QUICK_STARTERS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={isSending}
                    onClick={() => handleSend(q)}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-950 border border-slate-200 hover:border-amber-300 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Bar with Voice Dictation */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5 shrink-0"
              >
                <VoiceDictationButton
                  currentValue={inputText}
                  onChangeText={setInputText}
                  variant="light"
                  label=""
                />
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Pregunta al Bot Guía IA..."
                  className="flex-1 min-w-0 rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                  aria-label="Enviar mensaje"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
