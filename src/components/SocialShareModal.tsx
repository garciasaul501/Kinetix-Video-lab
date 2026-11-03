import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Send,
  Globe,
  Sparkles,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Download,
  Smartphone,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onOpenBuyTokens: () => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle = 'Convierte cualquier PDF en audiolibros y videos hablados con IA',
  onOpenBuyTokens,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('whatsapp');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kinetix-studio.app';
  const shareUrl = `${currentUrl}?ref=organic_viral&promo=gold2026&utm_source=${selectedNetwork}`;

  const shareText = `🔥 ¡Mira este Audiolibro y Video generado con Inteligencia Artificial desde un documento PDF! "${title}" — ${subtitle}. Pruébalo gratis y monetiza tus contenidos aquí:`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const viralScript = `🚀 ACABO DE TRANSFORMAR UN DOCUMENTO PDF EN UN AUDIOLIBRO COMPLETO HABLADO CON IA EN 10 SEGUNDOS.
🎧 Título: "${title}"
✨ Incluye narrador con avatar expresivo, subtítulos iluminados y descarga en MP4/MP3 sin límite.
👉 Puedes probarlo gratis y comprar paquetes de tokens para crear los tuyos aquí: ${shareUrl}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(viralScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2200);
  };

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=AudiolibrosIA,KinetixEstudioIA,VideoIA,GenerarIngresos`;
    window.open(url, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-2xl bg-[#FCFAF5] border-2 border-amber-400/80 rounded-3xl shadow-[0_15px_50px_rgba(217,119,6,0.22)] p-6 sm:p-8 flex flex-col gap-6 text-slate-900 overflow-hidden">
        {/* Glow Flares */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-amber-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-amber-700">
                TRÁFICO ORGÁNICO & MONETIZACIÓN VIRAL
              </span>
              <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Compartir Directo a Redes Sociales
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview Badge */}
        <div className="p-4 rounded-2xl bg-white border border-amber-300/60 shadow-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-extrabold text-amber-700 uppercase tracking-wider block">
              Contenido listo para compartir
            </span>
            <div className="text-sm font-black text-slate-950 truncate">{title}</div>
            <div className="text-xs text-slate-600 truncate">{subtitle}</div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Enlace Activo
          </span>
        </div>

        {/* Social Share 1-Click Buttons */}
        <div>
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2.5 block">
            Selecciona una red para compartir con 1 clic:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedNetwork('whatsapp');
                shareToWhatsApp();
              }}
              className="px-3.5 py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#128C7E] font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedNetwork('facebook');
                shareToFacebook();
              }}
              className="px-3.5 py-2.5 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-[#1877F2] font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Globe className="w-5 h-5 text-[#1877F2]" />
              <span>Facebook</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedNetwork('twitter');
                shareToTwitter();
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900/10 hover:bg-slate-900/20 border border-slate-900/20 text-slate-950 font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span className="text-base font-black">𝕏</span>
              <span>X (Twitter)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedNetwork('linkedin');
                shareToLinkedIn();
              }}
              className="px-3.5 py-2.5 rounded-xl bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 border border-[#0A66C2]/40 text-[#0A66C2] font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Globe className="w-5 h-5 text-[#0A66C2]" />
              <span>LinkedIn</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedNetwork('telegram');
                shareToTelegram();
              }}
              className="px-3.5 py-2.5 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/40 text-[#0088cc] font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-5 h-5 text-[#229ED9]" />
              <span>Telegram</span>
            </button>
          </div>
        </div>

        {/* Copy Viral Link & Copy Viral Post Script */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-amber-300/70 flex flex-col justify-between gap-2 shadow-2xs">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-600" />
              Enlace con Tracking Orgánico
            </span>
            <div className="text-[11px] font-mono text-slate-600 bg-amber-50/60 p-2 rounded-lg border border-amber-200 truncate">
              {shareUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Enlace Viral</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-amber-300/70 flex flex-col justify-between gap-2 shadow-2xs">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              Guion para TikTok / Reels / Shorts
            </span>
            <div className="text-[11px] text-slate-600 line-clamp-2 italic">
              &ldquo;{viralScript.slice(0, 85)}...&rdquo;
            </div>
            <button
              type="button"
              onClick={handleCopyScript}
              className="w-full py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              {copiedScript ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Guion Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Guion Viral</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real PayPal Payment Testing Card directly embedded */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-400/20 to-amber-600/15 border-2 border-amber-400 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="space-y-0.5 max-w-md">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                ⚡
              </span>
              <span className="text-sm font-black bg-gradient-to-r from-amber-800 to-yellow-700 bg-clip-text text-transparent">
                Testear Pagos Reales con PayPal
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-snug">
              Comprueba el checkout real dirigido a tu cuenta PayPal sin exponer credenciales. Paquetes desde <strong>$5.00</strong> con acreditación instantánea de <strong>62,500 Tokens</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBuyTokens();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-[0_4px_15px_rgba(245,158,11,0.4)] hover:scale-105 transition-all cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-slate-950" />
            <span>Testear Pago Real ($5.00)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
