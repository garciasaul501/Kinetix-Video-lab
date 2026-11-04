import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Globe,
  Sparkles,
  DollarSign,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { SupportedLanguage, t } from '../utils/i18n';
import { useToast } from './ToastNotification';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onOpenBuyTokens: () => void;
  language?: SupportedLanguage;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  onOpenBuyTokens,
  language = 'es',
}) => {
  const toast = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('whatsapp');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kinetix-studio.app';
  const shareUrl = `${currentUrl}?ref=organic_viral&promo=gold2026&utm_source=${selectedNetwork}`;

  const resolvedSubtitle = subtitle || t('actionCrearDesc', language);

  const shareTextMap: Record<SupportedLanguage, string> = {
    es: `🔥 ¡Mira este Audiolibro y Video generado con Inteligencia Artificial desde un documento PDF! "${title}" — ${resolvedSubtitle}. Pruébalo gratis y monetiza tus contenidos aquí:`,
    en: `🔥 Check out this Audiobook & Video generated with Artificial Intelligence from a PDF document! "${title}" — ${resolvedSubtitle}. Try it free and monetize content here:`,
    pt: `🔥 Veja este Audiolivro e Vídeo gerado com Inteligência Artificial a partir de um PDF! "${title}" — ${resolvedSubtitle}. Experimente grátis e monetize seu conteúdo:`,
    fr: `🔥 Découvrez ce Livre Audio et Vidéo généré par Intelligence Artificielle à partir d'un PDF ! "${title}" — ${resolvedSubtitle}. Essayez gratuitement ici :`,
    de: `🔥 Sehen Sie sich dieses mit KI erstellte Hörbuch & Video aus einem PDF-Dokument an! "${title}" — ${resolvedSubtitle}. Jetzt kostenlos testen:`,
    it: `🔥 Guarda questo Audiolibro e Video generato dall'Intelligenza Artificiale da un PDF! "${title}" — ${resolvedSubtitle}. Provalo gratis qui:`,
  };

  const shareText = shareTextMap[language] || shareTextMap.es;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success('¡Enlace Copiado!', 'El enlace viral con parámetros de campaña orgánica se ha copiado.');
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const viralScriptMap: Record<SupportedLanguage, string> = {
    es: `🚀 ACABO DE TRANSFORMAR UN DOCUMENTO PDF EN UN AUDIOLIBRO COMPLETO HABLADO CON IA EN 10 SEGUNDOS.
🎧 Título: "${title}"
✨ Incluye narrador con avatar expresivo, subtítulos iluminados y descarga en MP4/MP3 sin límite.
👉 Puedes probarlo gratis y comprar paquetes de tokens para crear los tuyos aquí: ${shareUrl}`,
    en: `🚀 JUST TRANSFORMED A PDF DOCUMENT INTO A FULL SPOKEN AI AUDIOBOOK IN 10 SECONDS.
🎧 Title: "${title}"
✨ Includes expressive talking avatar, illuminated subtitles and unlimited MP4/MP3 download.
👉 Try it free and get token packages to build yours here: ${shareUrl}`,
    pt: `🚀 ACABEI DE TRANSFORMAR UM PDF EM UM AUDIOLIVRO FALADO COMPLETO COM IA EM 10 SEGUNDOS.
🎧 Título: "${title}"
✨ Inclui avatar falante expressivo, legendas dinâmicas e download em MP4/MP3 ilimitado.
👉 Experimente grátis e adquira tokens para criar o seu aqui: ${shareUrl}`,
    fr: `🚀 JE VIENS DE TRANSFORMER UN PDF EN LIVRE AUDIO COMPLET PARLÉ AVEC L'IA EN 10 SECONDES.
🎧 Titre: "${title}"
✨ Comprend un avatar expressif, des sous-titres animés et un téléchargement MP4/MP3 illimité.
👉 Essayez-le gratuitement et obtenez des tokens ici: ${shareUrl}`,
    de: `🚀 GERADE EIN PDF-DOKUMENT IN 10 SEKUNDEN IN EIN VOLLSTÄNDIGES KI-HÖRBUCH VERWANDELT.
🎧 Titel: "${title}"
✨ Inklusive sprechendem Avatar, leuchtenden Untertiteln und unbegrenztem MP4/MP3-Download.
👉 Jetzt kostenlos testen und Tokens sichern: ${shareUrl}`,
    it: `🚀 HO APPENA TRASFORMATO UN PDF IN UN AUDIOLIBRO COMPLETO PARLATO CON IA IN 10 SECONDI.
🎧 Titolo: "${title}"
✨ Include avatar parlante espressivo, sottotitoli dinamici e download MP4/MP3 illimitato.
👉 Provalo gratis e acquista i token per creare il tuo qui: ${shareUrl}`,
  };

  const viralScript = viralScriptMap[language] || viralScriptMap.es;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(viralScript);
    setCopiedScript(true);
    toast.success('¡Guion Viral Copiado!', 'El guion para TikTok, Reels o Shorts se ha copiado.');
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
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#FAF8F5] border-2 border-amber-400 p-6 sm:p-8 shadow-[0_20px_60px_rgba(217,119,6,0.25)] space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-4 border-b border-amber-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md">
              <Share2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  {t('actionCompartirSub', language)}
                </span>
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Viral Growth
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-600 bg-clip-text text-transparent">
                {t('shareModalTitle', language)}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
            title={t('modalClose', language)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview Badge */}
        <div className="p-4 rounded-2xl bg-white border border-amber-300/60 shadow-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-extrabold text-amber-700 uppercase tracking-wider block">
              {t('actionCompartir', language)}
            </span>
            <div className="text-sm font-black text-slate-950 truncate">{title}</div>
            <div className="text-xs text-slate-600 truncate">{resolvedSubtitle}</div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Live Link
          </span>
        </div>

        {/* Social Share 1-Click Buttons */}
        <div>
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2.5 block">
            {t('publishDirectly', language)}
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
              <span>X</span>
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
              {t('viralLinkTitle', language)}
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
                  <span>{t('linkCopied', language)}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('copyLinkBtn', language)}</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-amber-300/70 flex flex-col justify-between gap-2 shadow-2xs">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              {t('viralScriptTitle', language)}
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
                  <span>{t('scriptCopied', language)}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('copyScriptBtn', language)}</span>
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
                {t('testPaymentBoxTitle', language)}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-snug">
              {t('testPaymentBoxDesc', language)}
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
            <span>{t('openCheckoutBtn', language)}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
