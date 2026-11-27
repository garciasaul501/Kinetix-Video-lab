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
  onOpenBuyTokens?: () => void;
  monetizationSettings?: import('../services/firebaseStudioService').MonetizationSettings;
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
    id: 'trial-5',
    name: 'Prueba por solo $5 DLL',
    badge: 'Acceso Limitado',
    price: 5.0,
    period: '/ 7 días',
    description: 'Prueba real de estudio con acceso limitado por 7 días, 62,500 tokens y hasta 5 proyectos.',
    features: [
      'Acceso Limitado inmediato por 7 días completos',
      '62,500 Tokens acreditados directo a tu cuenta',
      'Hasta 5 Audiolibros IA o PDFs Completos con IA',
      'Voz neuronal real 24kHz + Subtítulos dinámicos',
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
      'Acceso total a los 30 Avatares Reales IA',
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

interface ServerCreatedPlanOrder {
  orderId: string;
  checkoutUrl: string;
  merchantName?: string;
  amount: number;
}

async function createPayPalPlanOrder(
  packageId: string,
  planName: string,
  amount: number
): Promise<ServerCreatedPlanOrder | null> {
  try {
    const res = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId,
        itemName: `Kinetix Studio - ${planName}`,
        amount,
        returnOrigin: typeof window !== 'undefined' ? window.location.origin : '',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.checkoutUrl || !data.orderId) return null;
    return {
      orderId: data.orderId,
      checkoutUrl: data.checkoutUrl,
      merchantName: data.merchantName || 'Kinetix Studio Oficial',
      amount: data.amount || amount,
    };
  } catch {
    return null;
  }
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
  onOpenBuyTokens,
  monetizationSettings,
}) => {
  const trialPrice = Math.max(1, Number(monetizationSettings?.trialPriceUsd) || 5);
  const proPrice = Math.max(1, Number(monetizationSettings?.proPriceUsd) || 19.99);
  const annualPrice = Math.max(1, Number(monetizationSettings?.annualPriceUsd) || 149);
  const freeProjectsLimit =
    typeof monetizationSettings?.freeProjectsLimit === 'number'
      ? Math.max(0, Math.round(monetizationSettings.freeProjectsLimit))
      : 1;
  const fmtPrice = (val: number) => (Number.isInteger(val) ? String(val) : val.toFixed(2));

  const liveSubscriptionPlans: SubscriptionPlan[] = React.useMemo(
    () =>
      SUBSCRIPTION_PLANS.map((plan) => {
        if (plan.id === 'trial-5') {
          return {
            ...plan,
            name: `Prueba por solo $${fmtPrice(trialPrice)} DLL`,
            price: trialPrice,
          };
        }
        if (plan.id === 'plan-pro') {
          return {
            ...plan,
            price: proPrice,
          };
        }
        if (plan.id === 'plan-annual') {
          return {
            ...plan,
            price: annualPrice,
          };
        }
        return plan;
      }),
    [trialPrice, proPrice, annualPrice]
  );

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kinetix_pro_subscribed_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [checkoutStep, setCheckoutStep] = useState<'confirm' | 'processing' | 'done'>('confirm');
  const [activeOrder, setActiveOrder] = useState<ServerCreatedPlanOrder | null>(null);
  const [paypalTxCode, setPaypalTxCode] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<{
    paidOrdersCount: number;
    totalRevenueUsd: number;
  }>({
    paidOrdersCount: 0,
    totalRevenueUsd: 0,
  });

  useEffect(() => {
    fetch('/api/paypal/status')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.success) {
          setLiveStatus({
            paidOrdersCount: Number(d.paidOrdersCount || 0),
            totalRevenueUsd: Number(d.totalRevenueUsd || 0),
          });
        }
      })
      .catch(() => {});
  }, [checkoutStep]);

  useEffect(() => {
    if (externalCheckoutProduct) {
      handleOpenSubscribeModal(SUBSCRIPTION_PLANS[0]);
    }
  }, [externalCheckoutProduct]);

  const handleOpenSubscribeModal = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setCheckoutStep('confirm');
    setCheckoutError(null);
    setPaypalTxCode('');
    setActiveOrder(null);
    const created = await createPayPalPlanOrder(plan.id, plan.name, plan.price);
    if (created) {
      setActiveOrder(created);
    } else {
      setCheckoutError('No se pudo generar la orden oficial de PayPal. Intenta de nuevo.');
    }
  };

  const handleCloseModal = () => {
    setSelectedPlan(null);
    setActiveOrder(null);
    if (onClearExternalCheckout) onClearExternalCheckout();
  };

  const handleVerifyPlanOrder = async () => {
    if (!selectedPlan || !activeOrder) {
      setCheckoutError('Primero genera y completa tu pago en PayPal.');
      return;
    }

    setCheckoutStep('processing');
    setCheckoutError(null);

    try {
      const res = await fetch('/api/paypal/verify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.orderId,
          paypalTxId: paypalTxCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'No se pudo confirmar la orden en el servidor.');
      }

      setCheckoutStep('done');
      setIsSubscribed(true);
      try {
        localStorage.setItem('kinetix_pro_subscribed_v1', 'true');
        if (data.accessTier) {
          localStorage.setItem('kinetix_access_tier_v1', String(data.accessTier));
        }
      } catch {
        // ignore storage errors
      }
    } catch (err: any) {
      setCheckoutStep('confirm');
      setCheckoutError(err?.message || 'Error al verificar el pago.');
    }
  };

  return (
    <div className="space-y-10">
      {/* Ultra-Modern Minimal Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-12 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.08)]">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Pagos reales PayPal activos · <strong>Kinetix Estudio IA</strong>
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-emerald-700">
              {liveStatus.paidOrdersCount} ventas (${liveStatus.totalRevenueUsd.toFixed(2)} USD)
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-amber-900 tracking-tight leading-tight">
            Crea audiolibros, PDFs IA y videos listos para monetizar hoy
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {freeProjectsLimit > 0 ? (
              <>
                Empieza con <strong>{freeProjectsLimit} {freeProjectsLimit === 1 ? 'proyecto gratis' : 'proyectos gratis'}</strong>, activa la <strong>Prueba por solo ${fmtPrice(trialPrice)} DLL</strong> (Acceso Limitado por 7 días + 62,500 Tokens) o el <strong>Plan Pro (${fmtPrice(proPrice)}/mes)</strong>. Todos los pagos se procesan directo a PayPal en USD.
              </>
            ) : (
              <>
                Empieza con la <strong>Prueba por solo ${fmtPrice(trialPrice)} DLL</strong> (Acceso Limitado por 7 días + 62,500 Tokens) o activa el <strong>Plan Pro (${fmtPrice(proPrice)}/mes)</strong>. Todos los pagos se procesan directo a PayPal en USD.
              </>
            )}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {onOpenBuyTokens && (
              <button
                type="button"
                onClick={onOpenBuyTokens}
                className="px-7 py-3.5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer border border-amber-600/30"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-current" />
                <span>Prueba por solo ${fmtPrice(trialPrice)} DLL (Acceso Limitado)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenSubscribeModal(liveSubscriptionPlans[1])}
              className="px-6 py-3.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>EMPIEZA AHORA · PLAN PRO (${fmtPrice(proPrice)})</span>
            </button>

            {isSubscribed && (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Acceso Activo
              </span>
            )}
          </div>
        </div>

        {/* Modern Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
          {liveSubscriptionPlans.map((plan) => (
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

                  {checkoutError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                      {checkoutError}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {activeOrder ? (
                      <>
                        <a
                          href={activeOrder.checkoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3.5 px-5 rounded-xl bg-[#FFC439] hover:bg-[#F2B729] text-[#003087] font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                          <span>Pagar ${activeOrder.amount.toFixed(2)} USD con</span>
                          <PayPalLogoBadge />
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <div className="text-[11px] font-bold text-slate-700">
                            Orden {activeOrder.orderId} · PayPal Oficial
                          </div>
                          <input
                            type="text"
                            value={paypalTxCode}
                            onChange={(e) => setPaypalTxCode(e.target.value)}
                            placeholder="ID de recibo PayPal (opcional)"
                            className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyPlanOrder}
                            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Ya pagué en PayPal · Activar Acceso</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-center text-xs text-slate-500">
                        Preparando enlace seguro de PayPal...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pago verificado y protegido por PayPal Oficial</span>
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
