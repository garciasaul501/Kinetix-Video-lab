import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Loader2,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Clock,
  Lock,
} from 'lucide-react';
import { SupportedLanguage } from '../utils/i18n';

export interface TokenPackage {
  id: string;
  price: number;
  tokens: number;
  label: string;
  title: string;
  accessLabel: string;
  accessTier: 'limited_trial' | 'starter' | 'pro' | 'vip';
  accessDays: number;
  maxProjects: number;
  popular?: boolean;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: 'trial-5',
    price: 5.0,
    tokens: 62500,
    label: '$5.00 DLL',
    title: 'Prueba Acceso Limitado',
    accessLabel: '7 días · 5 proyectos · 62,500 tokens',
    accessTier: 'limited_trial',
    accessDays: 7,
    maxProjects: 5,
    popular: true,
  },
  {
    id: 'token-10',
    price: 10.0,
    tokens: 125000,
    label: '$10.00 DLL',
    title: 'Paquete Creador',
    accessLabel: '30 días · 15 proyectos · 125,000 tokens',
    accessTier: 'starter',
    accessDays: 30,
    maxProjects: 15,
  },
  {
    id: 'token-25',
    price: 25.0,
    tokens: 312500,
    label: '$25.00 DLL',
    title: 'Paquete Pro Studio',
    accessLabel: '30 días · Ilimitado · 312,500 tokens',
    accessTier: 'pro',
    accessDays: 30,
    maxProjects: -1,
  },
  {
    id: 'token-50',
    price: 50.0,
    tokens: 625000,
    label: '$50.00 DLL',
    title: 'Paquete VIP Comercial',
    accessLabel: '90 días · Comercial · 625,000 tokens',
    accessTier: 'vip',
    accessDays: 90,
    maxProjects: -1,
  },
];

export interface PayPalVerifiedAccessPayload {
  orderId: string;
  tokensAdded: number;
  amountPaid: number;
  packageName: string;
  accessTier: 'limited_trial' | 'starter' | 'pro' | 'vip';
  accessLabel: string;
  accessDays: number;
  maxProjects: number;
  expiresAt?: string;
  paypalTxId?: string | null;
}

interface CreatedPayPalOrder {
  orderId: string;
  checkoutUrl: string;
  receiverAccount: string;
  amount: number;
  tokens: number;
  accessTier: 'limited_trial' | 'starter' | 'pro' | 'vip';
  accessLabel: string;
  accessDays: number;
  maxProjects: number;
  itemName: string;
}

interface BuyTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  currentAccessTier?: string;
  onTokensPurchased: (
    tokensToAdd: number,
    amountPaid: number,
    packageName: string,
    accessDetails?: PayPalVerifiedAccessPayload
  ) => void;
  language?: SupportedLanguage;
}

export const BuyTokensModal: React.FC<BuyTokensModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  currentAccessTier = 'free',
  onTokensPurchased,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage>(TOKEN_PACKAGES[0]);
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [isVerifyingOrder, setIsVerifyingOrder] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<CreatedPayPalOrder | null>(null);
  const [paypalTxId, setPaypalTxId] = useState<string>('');
  const [buyerEmail, setBuyerEmail] = useState<string>('');
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiverAccount, setReceiverAccount] = useState<string>('garciasaul@hotmail.com');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setPurchaseSuccess(null);
    // Fetch live verified PayPal account status from server
    fetch('/api/paypal/status')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.receiverAccount) {
          setReceiverAccount(data.receiverAccount);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPackage = (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setCreatedOrder(null);
    setErrorMessage(null);
    setPurchaseSuccess(null);
  };

  // Step 1: Create real server-side PayPal order directed to garciasaul@hotmail.com
  const handleCreatePayPalOrder = async () => {
    setIsCreatingOrder(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          amount: selectedPackage.price,
          itemName: `Kinetix Studio - ${selectedPackage.title} (${selectedPackage.label})`,
          returnOrigin: typeof window !== 'undefined' ? window.location.origin : '',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl || !data.orderId) {
        throw new Error(data.error || 'No se pudo generar la orden oficial de PayPal.');
      }

      setCreatedOrder({
        orderId: data.orderId,
        checkoutUrl: data.checkoutUrl,
        receiverAccount: data.receiverAccount || receiverAccount,
        amount: data.amount,
        tokens: data.tokens,
        accessTier: data.accessTier || selectedPackage.accessTier,
        accessLabel: data.accessLabel || selectedPackage.accessLabel,
        accessDays: data.accessDays || selectedPackage.accessDays,
        maxProjects: typeof data.maxProjects === 'number' ? data.maxProjects : selectedPackage.maxProjects,
        itemName: data.itemName || selectedPackage.title,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al generar el enlace de pago en PayPal.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Step 2: Verify real PayPal order on server and credit Limited Access + Tokens
  const handleVerifyAndCreditAccess = async () => {
    if (!createdOrder) {
      setErrorMessage('Primero genera y completa tu pago en el botón de PayPal.');
      return;
    }

    setIsVerifyingOrder(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/paypal/verify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: createdOrder.orderId,
          paypalTxId: paypalTxId.trim(),
          buyerEmail: buyerEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'No se pudo verificar la orden de PayPal.');
      }

      const payload: PayPalVerifiedAccessPayload = {
        orderId: data.orderId,
        tokensAdded: data.tokensAdded || 0,
        amountPaid: data.amountUsd || createdOrder.amount,
        packageName: selectedPackage.title,
        accessTier: data.accessTier || createdOrder.accessTier,
        accessLabel: data.accessLabel || createdOrder.accessLabel,
        accessDays: data.accessDays || createdOrder.accessDays,
        maxProjects: typeof data.maxProjects === 'number' ? data.maxProjects : createdOrder.maxProjects,
        expiresAt: data.expiresAt,
        paypalTxId: data.paypalTxId,
      };

      setPurchaseSuccess(
        `¡${payload.accessLabel} acreditado! (+${(data.tokensTotalForOrder || createdOrder.tokens).toLocaleString()} tokens)`
      );
      onTokensPurchased(payload.tokensAdded, payload.amountPaid, payload.packageName, payload);

      setTimeout(() => {
        setCreatedOrder(null);
        setPaypalTxId('');
        setBuyerEmail('');
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al confirmar la orden.');
    } finally {
      setIsVerifyingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-[480px] w-full max-h-[92vh] overflow-y-auto shadow-2xl relative text-slate-900 border border-amber-200 space-y-5">
        {/* Header */}
        <div className="relative flex items-center justify-center w-full">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center px-10">
            <h2 className="font-extrabold text-lg sm:text-xl text-amber-900 tracking-tight">
              Prueba por solo $5 DLL
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Acredita tu Acceso Limitado inmediato con PayPal real
            </p>
          </div>
        </div>

        {/* Verified PayPal Merchant Account Banner */}
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">
              PayPal Oficial Verificado:{' '}
              <strong className="text-amber-950">{receiverAccount}</strong>
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
            USD LIVE
          </span>
        </div>

        {/* Package Selector 2x2 */}
        <div className="grid grid-cols-2 gap-2.5">
          {TOKEN_PACKAGES.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => handleSelectPackage(pkg)}
                className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-2 border-amber-500 bg-amber-50/40 ring-2 ring-amber-400/20'
                    : 'border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}

                <div>
                  <div className="text-[11px] font-bold text-amber-800 pr-5">
                    {pkg.title}
                  </div>
                  <div className="text-lg font-black text-slate-950 mt-0.5">
                    {pkg.label}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600 mt-1 leading-snug">
                    {pkg.accessLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Plan Benefits Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>{selectedPackage.title}</span>
            <span className="font-mono text-amber-800">{selectedPackage.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              {selectedPackage.accessDays} días de acceso
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {selectedPackage.maxProjects > 0
                ? `Hasta ${selectedPackage.maxProjects} proyectos`
                : 'Proyectos ilimitados'}
            </span>
            <span className="inline-flex items-center gap-1 font-mono">
              +{selectedPackage.tokens.toLocaleString()} tokens
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
            {errorMessage}
          </div>
        )}

        {purchaseSuccess ? (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 text-center shadow-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{purchaseSuccess}</span>
          </div>
        ) : !createdOrder ? (
          <button
            type="button"
            onClick={handleCreatePayPalOrder}
            disabled={isCreatingOrder}
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            {isCreatingOrder ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Generando orden real en PayPal...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Continuar a PayPal — {selectedPackage.label}</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3 p-4 rounded-2xl bg-amber-50/50 border-2 border-amber-300">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-amber-950">Paso 1 · Pagar en PayPal.com</span>
              <span className="font-mono text-[11px] text-slate-600">
                Orden: {createdOrder.orderId}
              </span>
            </div>

            {/* Direct official PayPal link (never popup-blocked in iframes) */}
            <a
              href={createdOrder.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-[#FFC439] hover:bg-[#F2B729] text-[#003087] font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <span>Pagar ${createdOrder.amount.toFixed(2)} USD en PayPal Ahora</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="pt-2 border-t border-amber-200/80 space-y-2">
              <div className="text-xs font-extrabold text-slate-800">
                Paso 2 · Activar tu Acceso Limitado al regresar de PayPal
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={paypalTxId}
                  onChange={(e) => setPaypalTxId(e.target.value)}
                  placeholder="ID de recibo PayPal (opcional)"
                  className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="Tu correo de comprador (opcional)"
                  className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={handleVerifyAndCreditAccess}
                disabled={isVerifyingOrder}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isVerifyingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando orden en servidor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Pago y Acreditar Acceso Limitado</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer Balance & Access Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-slate-500 border-t border-slate-100">
          <span>Saldo: {currentBalance.toLocaleString()} tokens</span>
          <span>
            Estado:{' '}
            <strong className="text-amber-800 uppercase">
              {currentAccessTier === 'limited_trial'
                ? 'Acceso Limitado ($5 DLL)'
                : currentAccessTier === 'free'
                  ? 'Sin activar'
                  : currentAccessTier}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
