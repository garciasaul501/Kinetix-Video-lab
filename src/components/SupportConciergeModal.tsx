import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Loader2,
  Sparkles,
  HelpCircle,
  BookOpen,
  Layers,
  FileText,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  Bot,
  User,
  ArrowRight,
} from 'lucide-react';
import { VoiceDictationButton } from './VoiceDictationButton';

export type SupportQuickActionType =
  | 'videobook'
  | 'niche-gallery'
  | 'script'
  | 'admin'
  | 'gold'
  | 'monetization';

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickAction?: {
    label: string;
    actionType: SupportQuickActionType;
  };
}

interface SupportConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateModule?: (moduleId: string) => void;
  onToggleGoldModel?: () => void;
  isGoldModelActive?: boolean;
  onOpenAdmin?: () => void;
  onOpenBuyTokens?: () => void;
}

const INITIAL_GREETING: SupportChatMessage = {
  id: 'msg-welcome-01',
  sender: 'assistant',
  text:
    '**Respuesta Directa**: ¡Hola! Soy tu Asistente Oficial de Soporte y Onboarding de Kinetix Estudio IA. Mi misión es guiarte paso a paso para que alcances valor con la plataforma en el menor tiempo posible.\n\n' +
    '**Paso a Paso**:\n' +
    '1. Selecciona una de las consultas rápidas de abajo o escribe/dicta tu duda con el micrófono.\n' +
    '2. Te indicaré la ruta exacta en la interfaz (**Audiolibros & PDF**, **1,200 Fotos**, **Guiones**, **Voces IA**, etc.).\n' +
    '3. Si necesitas soporte humano o asistencia prioritaria, cuento con canal directo de escalación (**garciasaul501@gmail.com**).\n\n' +
    '**Tip / Siguiente Paso**:\n' +
    '• ¿Qué tarea o proyecto audiovisual deseas completar hoy en Kinetix Estudio IA?',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const QUICK_PROMPTS = [
  {
    label: '📖 Crear audiolibro desde PDF',
    prompt: '¿Cómo convertir mi archivo PDF o libro en un audiolibro con avatar real y escenas?',
  },
  {
    label: '📦 Exportar ZIP por lotes',
    prompt: '¿Cómo exporto múltiples audiolibros seleccionados en un solo archivo ZIP con MP3 y MP4?',
  },
  {
    label: '🎤 Dictar con micrófono',
    prompt: '¿Cómo uso el botón de micrófono para dictar mis ideas por voz en vez de escribir?',
  },
  {
    label: '🎨 1,200 fotos de nichos',
    prompt: '¿Cómo elijo y vinculo las fotos de los 12 nichos temáticos a los capítulos?',
  },
  {
    label: '⚡ Acceso Inmediato Pro',
    prompt: '¿Cómo accedo a las herramientas pro y empezar ahora antes de usar o ver?',
  },
  {
    label: '🛡️ Acceso Administrador',
    prompt: '¿Cómo inicio sesión con la cuenta de administrador garciasaul501@gmail.com?',
  },
  {
    label: '🆘 Canal de Soporte Oficial',
    prompt: '¿Cuál es el canal oficial de soporte para reportar un error o solicitar asistencia humana?',
  },
];

export const SupportConciergeModal: React.FC<SupportConciergeModalProps> = ({
  isOpen,
  onClose,
  onNavigateModule,
  onToggleGoldModel,
  isGoldModelActive = true,
  onOpenAdmin,
  onOpenBuyTokens,
}) => {
  const [messages, setMessages] = useState<SupportChatMessage[]>([INITIAL_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isSending) return;

    const userMessage: SupportChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch('/api/support-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          conversationHistory: messages.slice(-4).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      const replyText = data.reply || 'He recibido tu consulta. ¿Deseas explorar un módulo específico?';

      // Detect relevant quick actions
      const lowerReply = replyText.toLowerCase() + ' ' + messageContent.toLowerCase();
      let quickAction: SupportChatMessage['quickAction'] | undefined;
      if (lowerReply.includes('token') || lowerReply.includes('comprar') || lowerReply.includes('monetiz') || lowerReply.includes('paypal')) {
        quickAction = { label: 'Comprar Tokens (PayPal Seguro) ⚡ →', actionType: 'monetization' };
      } else if (lowerReply.includes('audiolibros & pdf') || lowerReply.includes('subir pdf')) {
        quickAction = { label: 'Ir a Audiolibros & PDF →', actionType: 'videobook' };
      } else if (lowerReply.includes('1,200 fotos') || lowerReply.includes('nicho')) {
        quickAction = { label: 'Ir a Galería 1,200 Fotos →', actionType: 'niche-gallery' };
      } else if (lowerReply.includes('guiones') || lowerReply.includes('guion')) {
        quickAction = { label: 'Ir a Generador de Guiones →', actionType: 'script' };
      } else if (lowerReply.includes('admin') || lowerReply.includes('garciasaul501')) {
        quickAction = { label: 'Abrir Acceso Admin →', actionType: 'admin' };
      } else if (lowerReply.includes('letras oro')) {
        quickAction = { label: 'Alternar Modelo Letras Oro →', actionType: 'gold' };
      }

      const botMessage: SupportChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickAction,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (_err) {
      const fallbackMessage: SupportChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text:
          '**Respuesta Directa**: Puedo guiarte paso a paso por cualquier funcionalidad de Kinetix.\n\n' +
          '**Paso a Paso**:\n' +
          '1. Ve a la barra superior y selecciona el módulo deseado (**Audiolibros & PDF**, **1,200 Fotos** o **Guiones**).\n' +
          '2. Usa **Comprar Tokens** para recargar paquetes de 62,500 a 625,000 tokens con PayPal protegido.\n' +
          '3. Para soporte humano o cualquier consulta adicional, escribe directamente a: **garciasaul501@gmail.com**.\n\n' +
          '**Tip / Siguiente Paso**:\n' +
          '• ¿En qué sección te gustaría trabajar hoy?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickAction: { label: 'Comprar Tokens con PayPal ⚡ →', actionType: 'monetization' },
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTriggerQuickAction = (actionType: SupportQuickActionType) => {
    if (actionType === 'monetization') {
      if (onOpenBuyTokens) {
        onOpenBuyTokens();
        onClose();
        return;
      }
      onNavigateModule?.('paypal-monetization');
      onClose();
    } else if (actionType === 'videobook' || actionType === 'niche-gallery' || actionType === 'script') {
      onNavigateModule?.(actionType);
      onClose();
    } else if (actionType === 'admin') {
      onOpenAdmin?.();
      onClose();
    } else if (actionType === 'gold') {
      onToggleGoldModel?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-3xl h-[88vh] max-h-[760px] rounded-3xl bg-gradient-to-b from-[#141724] via-[#0E101A] to-[#0A0C13] border-2 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden text-slate-100">
        {/* Glow ambient flares */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 px-5 sm:px-6 py-4 border-b border-amber-500/20 bg-slate-950/60 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-500/10 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-extrabold bg-gradient-to-r from-[#FFF6CC] via-[#FBBF24] to-[#D97706] bg-clip-text text-transparent">
                  Asistente Oficial de Soporte y Onboarding
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  En línea
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-medium">
                Kinetix Concierge · Customer Success y Guía Paso a Paso en Tiempo Real
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 flex items-center justify-center transition-all cursor-pointer"
            title="Cerrar Asistente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick FAQ / Onboarding Chips Slider */}
        <div className="relative z-10 px-5 sm:px-6 py-2.5 bg-[#0C0E16] border-b border-white/5 overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[11px] font-mono text-amber-400/90 font-bold shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Preguntas Rápidas:
          </span>
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={isSending}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-slate-200 hover:text-amber-200 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Message Conversation Feed */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          {messages.map((msg) => {
            const isBot = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-sm text-sm space-y-2.5 ${
                    isBot
                      ? 'bg-[#121522] border border-amber-500/30 text-slate-100'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-semibold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  }`}
                >
                  {/* Message formatted body */}
                  <div className="whitespace-pre-line leading-relaxed">
                    {msg.text.split('\n\n').map((block, bIdx) => {
                      if (block.startsWith('**Respuesta Directa**:')) {
                        return (
                          <div key={bIdx} className="mb-2">
                            <span className="font-extrabold text-amber-300 uppercase tracking-wide text-xs">
                              Respuesta Directa:{' '}
                            </span>
                            <span className={isBot ? 'text-amber-100' : 'text-slate-950 font-bold'}>
                              {block.replace('**Respuesta Directa**:', '').trim()}
                            </span>
                          </div>
                        );
                      }
                      if (block.startsWith('**Paso a Paso**:')) {
                        return (
                          <div key={bIdx} className="mb-2 p-2.5 rounded-xl bg-black/30 border border-amber-500/20 space-y-1.5">
                            <div className="font-extrabold text-amber-400 uppercase tracking-wide text-xs">
                              Paso a Paso Guiado:
                            </div>
                            <div className="text-slate-200 text-xs sm:text-sm pl-1">
                              {block.replace('**Paso a Paso**:', '').trim()}
                            </div>
                          </div>
                        );
                      }
                      if (block.startsWith('**Tip / Siguiente Paso**:')) {
                        return (
                          <div key={bIdx} className="text-xs text-amber-300/90 font-medium pt-1 border-t border-white/5">
                            <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider block">
                              Siguiente Paso Sugerido:
                            </span>
                            {block.replace('**Tip / Siguiente Paso**:', '').trim()}
                          </div>
                        );
                      }
                      return <p key={bIdx}>{block}</p>;
                    })}
                  </div>

                  {/* Inline Action Launcher if available */}
                  {msg.quickAction && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerQuickAction(msg.quickAction!.actionType)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{msg.quickAction.label}</span>
                      </button>
                    </div>
                  )}

                  {/* Footer info & Copy button for assistant */}
                  {isBot && (
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-slate-400">
                      <span>{msg.timestamp} · Concierge Oficial</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.text, msg.id)}
                        className="hover:text-amber-300 cursor-pointer flex items-center gap-1"
                        title="Copiar respuesta"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {!isBot && (
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-1 font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3 items-center text-amber-400 text-xs font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>El Asistente Oficial está formulando los pasos de respuesta...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Voice Dictation & Text Input */}
        <div className="relative z-10 p-4 sm:p-5 border-t border-amber-500/20 bg-slate-950/70 backdrop-blur-md space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Dictation Button */}
            <VoiceDictationButton
              currentValue={inputText}
              onChangeText={setInputText}
              variant="dark"
              label="Dictar"
            />

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe tu consulta o haz clic en Dictar (ej. ¿Cómo exporto en MP4?)..."
              disabled={isSending}
              className="flex-1 px-4 py-3 rounded-2xl bg-[#121522] border border-amber-500/30 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>

          {/* Official escalation channel disclaimer */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-amber-200/70 px-1">
            <span>
              Canal de Escalación Oficial: <strong className="text-amber-300">garciasaul501@gmail.com</strong>
            </span>
            <span className="hidden sm:inline">
              Resuelve dudas operativas, navegación y onboarding en tiempo real
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
