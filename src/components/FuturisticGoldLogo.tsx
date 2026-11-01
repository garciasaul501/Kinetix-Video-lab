import React, { useRef, useState } from 'react';
import { Download, Sparkles, Copy, Check, Eye, Maximize2, X } from 'lucide-react';

export interface FuturisticGoldLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  animated?: boolean;
  className?: string;
  subText?: string;
  onClick?: () => void;
}

export const FuturisticGoldLogo: React.FC<FuturisticGoldLogoProps> = ({
  size = 'md',
  showWordmark = true,
  animated = true,
  className = '',
  subText = 'QUANTUM AUDIO & VIDEO · 2050',
  onClick,
}) => {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Pixel sizing for badge
  const sizeMap = {
    xs: { badge: 28, svg: 24, text: 'text-xs', sub: 'text-[9px]' },
    sm: { badge: 36, svg: 32, text: 'text-sm', sub: 'text-[10px]' },
    md: { badge: 48, svg: 42, text: 'text-lg', sub: 'text-[11px]' },
    lg: { badge: 72, svg: 64, text: 'text-2xl', sub: 'text-xs' },
    xl: { badge: 120, svg: 110, text: 'text-4xl', sub: 'text-sm' },
  };

  const dim = sizeMap[size] || sizeMap.md;

  const handleCopyBadge = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('KINETIX QUANTUM 2050 · AI VIDEO & AUDIO LAB');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-3 select-none group cursor-pointer ${className}`}
        title="Kinetix · Logotipo Futurista Viral en Oro 24K"
      >
        {/* Futuristic Gold 3D Emblem Badge */}
        <div
          style={{ width: dim.badge, height: dim.badge }}
          className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#1F190B] via-[#0E0F14] to-[#141208] border border-amber-500/40 p-1 shadow-[0_0_20px_rgba(245,158,11,0.22)] group-hover:shadow-[0_0_28px_rgba(245,158,11,0.45)] group-hover:border-amber-400 transition-all duration-300"
        >
          {/* Subtle Ambient Radial Gold Glow */}
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.25)_0%,transparent_70%)] pointer-events-none" />

          {/* SVG Vector Emblem */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: dim.svg, height: dim.svg }}
            className={`relative z-10 transition-transform duration-300 group-hover:scale-105 ${
              animated ? 'animate-[pulse_4s_ease-in-out_infinite]' : ''
            }`}
          >
            <defs>
              {/* Ultra-Luxe 24K Liquid Gold Metallic Gradient */}
              <linearGradient id="goldMetallicMain" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="20%" stopColor="#FDE68A" />
                <stop offset="45%" stopColor="#F59E0B" />
                <stop offset="70%" stopColor="#D97706" />
                <stop offset="90%" stopColor="#92400E" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>

              {/* Gold Chrome Highlight */}
              <linearGradient id="goldChromeLight" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFE57F" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>

              {/* Quantum Cyber Rings */}
              <linearGradient id="quantumRingGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#D97706" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#B45309" stopOpacity="0.3" />
              </linearGradient>

              {/* Glowing Drop Shadow Filter */}
              <filter id="goldGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Soundwave Ring Orbit 1 */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="url(#quantumRingGrad)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              className="opacity-70 animate-[spin_24s_linear_infinite]"
              style={{ transformOrigin: '50px 50px' }}
            />

            {/* Outer Hexagonal Shield Cyber Boundary */}
            <path
              d="M50 4 L88 25 L88 75 L50 96 L12 75 L12 25 Z"
              stroke="url(#goldMetallicMain)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              fill="rgba(18, 16, 10, 0.45)"
            />

            {/* Futuristic Soundwave Pulse Nodes */}
            <circle cx="50" cy="4" r="2.5" fill="#FFE57F" />
            <circle cx="88" cy="25" r="2.5" fill="#F59E0B" />
            <circle cx="88" cy="75" r="2.5" fill="#FDE68A" />
            <circle cx="50" cy="96" r="2.5" fill="#FFE57F" />
            <circle cx="12" cy="75" r="2.5" fill="#F59E0B" />
            <circle cx="12" cy="25" r="2.5" fill="#FDE68A" />

            {/* Inner Isometric Diamond Core with Specular Facets */}
            <polygon
              points="50,16 80,50 50,84 20,50"
              stroke="url(#goldChromeLight)"
              strokeWidth="1.5"
              fill="rgba(31, 25, 11, 0.65)"
            />

            {/* Futuristic Harmonic Sound Frequencies Left/Right */}
            <path
              d="M32 40 L32 60 M26 44 L26 56 M74 44 L74 56 M68 40 L68 60"
              stroke="url(#goldMetallicMain)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Iconic Central Hyper-Futuristic "K" Glyph */}
            <g filter="url(#goldGlowFilter)">
              {/* Vertical Golden Spine */}
              <path
                d="M38 28 L44 28 L44 72 L38 72 Z"
                fill="url(#goldMetallicMain)"
              />
              {/* Upper Diagonal Blade */}
              <path
                d="M44 48 L58 32 L66 32 L49 52 Z"
                fill="url(#goldChromeLight)"
              />
              {/* Lower Diagonal Sound Beam */}
              <path
                d="M47 50 L66 72 L58 72 L42 55 Z"
                fill="url(#goldMetallicMain)"
              />
              {/* Golden Prismatic Node */}
              <polygon
                points="48,46 54,50 48,54 44,50"
                fill="#FFFFFF"
              />
            </g>
          </svg>
        </div>

        {/* Wordmark & Futuristic Typography (All Letters in Pure Radiant Gold) */}
        {showWordmark && (
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span
                className={`font-display font-extrabold tracking-wider bg-gradient-to-r from-[#FFF6CC] via-[#FBBF24] to-[#D97706] bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)] ${dim.text}`}
              >
                KINETIX
              </span>
              <span className="px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 text-[9px] font-mono font-black text-amber-300 uppercase tracking-widest">
                AI 2050
              </span>
            </div>
            <span
              className={`font-mono font-bold tracking-widest bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent ${dim.sub}`}
            >
              {subText}
            </span>
          </div>
        )}
      </div>

      {/* Fullscreen Showcase / Download Modal when clicked */}
      {showModal && (
        <FuturisticLogoModal
          onClose={() => setShowModal(false)}
          copied={copied}
          onCopyBadge={handleCopyBadge}
        />
      )}
    </>
  );
};

export const FuturisticLogoModal: React.FC<{
  onClose: () => void;
  copied: boolean;
  onCopyBadge: (e: React.MouseEvent) => void;
}> = ({ onClose, copied, onCopyBadge }) => {
  const [downloadingPng, setDownloadingPng] = useState(false);

  const handleDownloadSvg = () => {
    const svgEl = document.getElementById('viral-futuristic-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'kinetix-futuristic-gold-logo-2050.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const handleDownloadPng = async () => {
    setDownloadingPng(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark Obsidian Studio Background
      const bgGrad = ctx.createRadialGradient(512, 512, 100, 512, 512, 600);
      bgGrad.addColorStop(0, '#1E180A');
      bgGrad.addColorStop(0.5, '#0E1017');
      bgGrad.addColorStop(1, '#05070B');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Cyber Grid lines
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 1024; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1024);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(1024, i);
        ctx.stroke();
      }

      // Draw SVG onto canvas
      const svgEl = document.getElementById('viral-futuristic-svg');
      if (!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || window.webkitURL || window;
      const blobURL = URLObj.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Draw centered emblem
        ctx.drawImage(img, 212, 120, 600, 600);

        // Futuristic Brand Typography in Gold
        ctx.textAlign = 'center';
        ctx.font = '900 68px "Syne", sans-serif';
        const textGrad = ctx.createLinearGradient(300, 0, 724, 0);
        textGrad.addColorStop(0, '#FFF6CC');
        textGrad.addColorStop(0.5, '#F5B738');
        textGrad.addColorStop(1, '#D97706');
        ctx.fillStyle = textGrad;
        ctx.fillText('KINETIX', 512, 790);

        ctx.font = '700 24px "JetBrains Mono", monospace';
        ctx.fillStyle = '#FDE68A';
        ctx.letterSpacing = '6px';
        ctx.fillText('QUANTUM AUDIO & VIDEO STUDIO · 2050', 512, 840);

        ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#B45309';
        ctx.letterSpacing = '2px';
        ctx.fillText('VIRAL ICONIC BRAND IDENTITY · 24K LIQUID GOLD', 512, 880);

        const pngUrl = canvas.toDataURL('image/png');
        const dlLink = document.createElement('a');
        dlLink.href = pngUrl;
        dlLink.download = 'kinetix-futuristic-gold-logo-4k.png';
        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
        URLObj.revokeObjectURL(blobURL);
        setDownloadingPng(false);
      };
      img.src = blobURL;
    } catch {
      setDownloadingPng(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#16130C] via-[#0E1017] to-[#0A0C12] border-2 border-amber-500/50 shadow-[0_0_60px_rgba(245,158,11,0.35)] p-6 sm:p-8 flex flex-col gap-6 text-white overflow-hidden">
        {/* Glow corner flares */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display text-xl font-black bg-gradient-to-r from-[#FFF6CC] via-[#FBBF24] to-[#D97706] bg-clip-text text-transparent">
                Logotipo Futurista Viral Kinetix 2050
              </h3>
              <p className="text-xs font-mono text-amber-300/80">
                Identidad Visual en Oro 24K · Vector SVG & PNG 4K
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo Visual Stage */}
        <div className="relative flex flex-col items-center justify-center p-8 rounded-2xl bg-[#08090D] border border-amber-500/30 overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.2)_0%,transparent_65%)]" />

          {/* Large Vector SVG */}
          <div className="relative z-10 w-44 h-44 sm:w-56 sm:h-56">
            <svg
              id="viral-futuristic-svg"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-[0_0_24px_rgba(245,158,11,0.4)]"
            >
              <defs>
                <linearGradient id="goldMetallicMainModal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFBEB" />
                  <stop offset="20%" stopColor="#FDE68A" />
                  <stop offset="45%" stopColor="#F59E0B" />
                  <stop offset="70%" stopColor="#D97706" />
                  <stop offset="90%" stopColor="#92400E" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>

                <linearGradient id="goldChromeLightModal" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFE57F" />
                  <stop offset="50%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>

                <linearGradient id="quantumRingGradModal" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#D97706" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#B45309" stopOpacity="0.35" />
                </linearGradient>

                <filter id="goldGlowFilterModal" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="url(#quantumRingGradModal)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />

              <path
                d="M50 4 L88 25 L88 75 L50 96 L12 75 L12 25 Z"
                stroke="url(#goldMetallicMainModal)"
                strokeWidth="2.8"
                strokeLinejoin="round"
                fill="rgba(24, 20, 10, 0.55)"
              />

              <circle cx="50" cy="4" r="3" fill="#FFE57F" />
              <circle cx="88" cy="25" r="3" fill="#F59E0B" />
              <circle cx="88" cy="75" r="3" fill="#FDE68A" />
              <circle cx="50" cy="96" r="3" fill="#FFE57F" />
              <circle cx="12" cy="75" r="3" fill="#F59E0B" />
              <circle cx="12" cy="25" r="3" fill="#FDE68A" />

              <polygon
                points="50,16 80,50 50,84 20,50"
                stroke="url(#goldChromeLightModal)"
                strokeWidth="2"
                fill="rgba(38, 30, 12, 0.75)"
              />

              <path
                d="M32 40 L32 60 M26 44 L26 56 M74 44 L74 56 M68 40 L68 60"
                stroke="url(#goldMetallicMainModal)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <g filter="url(#goldGlowFilterModal)">
                <path d="M38 28 L44 28 L44 72 L38 72 Z" fill="url(#goldMetallicMainModal)" />
                <path d="M44 48 L58 32 L66 32 L49 52 Z" fill="url(#goldChromeLightModal)" />
                <path d="M47 50 L66 72 L58 72 L42 55 Z" fill="url(#goldMetallicMainModal)" />
                <polygon points="48,46 54,50 48,54 44,50" fill="#FFFFFF" />
              </g>
            </svg>
          </div>

          <div className="relative z-10 text-center mt-5 space-y-1">
            <h2 className="font-display text-3xl font-black tracking-widest bg-gradient-to-r from-[#FFF6CC] via-[#FBBF24] to-[#D97706] bg-clip-text text-transparent">
              KINETIX
            </h2>
            <div className="font-mono text-xs font-bold text-amber-300 tracking-[0.25em] uppercase">
              Quantum Video AI · Next Gen 2050
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 hover:from-amber-500/30 hover:to-yellow-500/20 border border-amber-400/40 text-amber-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Descargar Vector SVG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={downloadingPng}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)]"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>{downloadingPng ? 'Generando PNG...' : 'Descargar PNG 4K'}</span>
          </button>

          <button
            type="button"
            onClick={onCopyBadge}
            className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-extrabold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copiar Identidad</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
