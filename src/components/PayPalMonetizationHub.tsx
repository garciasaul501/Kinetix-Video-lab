import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Download,
  Headphones,
  Film,
  X,
  Check,
  Crown,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { VideoBook } from '../utils/videoRenderer';
import { SavedAudiobookItem } from '../utils/studioStorage';

export interface PayPalProductItem {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  price: number;
  compareAtPrice?: number;
  currency: 'USD' | 'EUR' | 'MXN';
  format: 'MP3 + MP4 + PDF' | 'MP4 HD' | 'MP3 Master';
  coverUrl: string;
  chaptersCount: number;
  durationLabel: string;
  avatarName: string;
  category: string;
  salesCount: number;
}

interface PayPalMonetizationHubProps {
  currentVideoBook: VideoBook;
  currentCoverUrl?: string;
  currentAvatarName: string;
  savedAudiobooks: SavedAudiobookItem[];
  onExportCurrentMp3: () => void;
  onExportCurrentMp4: () => void;
  externalCheckoutProduct?: PayPalProductItem | null;
  onClearExternalCheckout?: () => void;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  badge: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-starter',
    name: 'Pase Estudio Esencial',
    badge: 'Acceso Inmediato',
    price: 9.99,
    period: '/ mes',
    description: 'Ideal para crear y escuchar tus audiolibros desde cualquier documento PDF.',
    features: [
      'Creación de audiolibros completos desde PDF',
      'Voces naturales con IA en español e inglés',
      'Descarga directa en formato de audio .MP3',
      'Biblioteca personal en tu Folder de proyectos',
    ],
  },
  {
    id: 'plan-pro',
    name: 'Suscripción Pro Studio',
    badge: 'Más Popular',
    price: 19.99,
    period: '/ mes',
    description: 'Experiencia completa con los 30 avatares reales, escenas 4K y exportación en video MP4.',
    features: [
      'Audiolibros y Video-Libros ilimitados (.MP3 y .MP4)',
      'Acceso total a los 30 Avatares Reales IA (Gemini 3.1)',
      '1,200 escenas visuales cinematográficas por nicho',
      'Exportación en alta definición 1080p sin marcas de agua',
      'Prioridad de renderizado en servidor de voz y video',
    ],
    highlighted: true,
  },
  {
    id: 'plan-annual',
    name: 'Suscripción Anual VIP',
    badge: 'Ahorra 40%',
    price: 149.0,
    period: '/ año',
    description: 'Todo el poder del estudio durante 12 meses con licencia comercial completa.',
    features: [
      'Todo lo incluido en el plan Pro Studio sin límites',
      'Subida de tus propias fotos reales para avatares',
      'Guiones de 2 minutos + Storyboard Pro ilimitados',
      'Licencia de uso comercial para redes y plataformas',
    ],
  },
];

const PAYPAL_BUSINESS_EMAIL = 'garciasaul501@gmail.com';

function buildPayPalSubscribeUrl(planName: string, amount: number): string {
  const params = new URLSearchParams({
    cmd: '_xclick',
    business: PAYPAL_BUSINESS_EMAIL,
    item_name: `Kinetix Studio - ${planName}`,
    amount: amount.toFixed(2),
    currency_code: 'USD',
    no_shipping: '1',
  });
  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}

export const PayPalLogoBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center font-sans font-extrabold tracking-tight ${className}`}>
    <span className="text-[#003087] italic">Pay</span>
    <span className="text-[#0079C1] italic">Pal</span>
  </span>
);

export const PayPalMonetizationHub: React.FC<PayPalMonetizationHubProps> = ({
  onExportCurrentMp3,
  onExportCurrentMp4,
  externalCheckoutProduct,
  onClearExternalCheckout,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kinetix_pro_subscribed_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [checkoutStep, setCheckoutStep] = useState<'confirm' | 'processing' | 'done'>('confirm');

  useEffect(() => {
    if (externalCheckoutProduct) {
      setSelectedPlan(SUBSCRIPTION_PLANS[1]);
      setCheckoutStep('confirm');
    }
  }, [externalCheckoutProduct]);

  const handleOpenSubscribeModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setCheckoutStep('confirm');
  };

  const handleCloseModal = () => {
    setSelectedPlan(null);
    if (onClearExternalCheckout) onClearExternalCheckout();
  };

  const handleConfirmSubscription = (openExternalPayPal: boolean) => {
    if (!selectedPlan) return;

    if (openExternalPayPal) {
      const url = buildPayPalSubscribeUrl(selectedPlan.name, selectedPlan.price);
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    setCheckoutStep('processing');
    setTimeout(() => {
      setCheckoutStep('done');
      setIsSubscribed(true);
      try {
        localStorage.setItem('kinetix_pro_subscribed_v1', 'true');
      } catch {
        // ignore storage errors
      }
    }, 1000);
  };

  return (
    <div className="space-y-10">
      {/* Ultra-Modern Minimal Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-12 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.08)]">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>KINETIX STUDIO PRO · ACCESO TOTAL</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Crea audiolibros y películas habladas sin límites
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Desbloquea los 30 avatares reales con IA, las 1,200 escenas cinematográficas y la exportación instantánea en formatos MP3 y MP4 HD.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenSubscribeModal(SUBSCRIPTION_PLANS[1])}
              className="px-7 py-3.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-slate-950/15 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Suscríbete ahora</span>
            </button>

            {isSubscribed && (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Suscripción Activa
              </span>
            )}
          </div>
        </div>

        {/* Modern Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                plan.highlighted
                  ? 'bg-slate-950 text-white ring-2 ring-slate-950 shadow-xl'
                  : 'bg-slate-50/80 text-slate-900 border border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      plan.highlighted ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  >
                    {plan.name}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      plan.highlighted
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold tracking-tight">
                    ${plan.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      plan.highlighted ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    USD {plan.period}
                  </span>
                </div>

                <p
                  className={`text-xs leading-relaxed ${
                    plan.highlighted ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {plan.description}
                </p>

                <ul className="space-y-2.5 pt-2 border-t border-slate-200/20">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-xs">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          plan.highlighted ? 'text-amber-400' : 'text-emerald-600'
                        }`}
                      />
                      <span className={plan.highlighted ? 'text-slate-200' : 'text-slate-700'}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => handleOpenSubscribeModal(plan)}
                  className={`w-full py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    plan.highlighted
                      ? 'bg-white hover:bg-slate-100 text-slate-950 shadow-md'
                      : 'bg-slate-950 hover:bg-slate-800 text-white shadow-sm'
                  }`}
                >
                  <span>Suscríbete ahora</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clean Subscription Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-950">
                    {selectedPlan.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">Activación inmediata</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {checkoutStep === 'confirm' && (
                <>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block">
                        Plan seleccionado
                      </span>
                      <span className="text-sm font-bold text-slate-950">
                        {selectedPlan.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-2xl font-extrabold text-slate-950">
                        ${selectedPlan.price.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        USD {selectedPlan.period}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleConfirmSubscription(false)}
                      className="w-full py-3.5 px-5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Suscríbete ahora</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConfirmSubscription(true)}
                      className="w-full py-3 px-5 rounded-xl bg-[#FFC439] hover:bg-[#F2B729] text-[#003087] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Continuar con</span>
                      <PayPalLogoBadge />
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cancela en cualquier momento con un clic</span>
                  </div>
                </>
              )}

              {checkoutStep === 'processing' && (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-3 border-slate-950 border-t-transparent animate-spin mx-auto" />
                  <p className="text-sm font-bold text-slate-900">
                    Activando tu suscripción...
                  </p>
                </div>
              )}

              {checkoutStep === 'done' && (
                <div className="space-y-5 text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-extrabold text-slate-950">
                      ¡Suscripción activa!
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Tienes acceso completo para descargar tus audiolibros en MP3 y MP4 HD.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onExportCurrentMp3();
                        handleCloseModal();
                      }}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Descargar MP3</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onExportCurrentMp4();
                        handleCloseModal();
                      }}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Descargar MP4</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
