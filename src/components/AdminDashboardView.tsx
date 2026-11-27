import React, { useMemo, useState } from 'react';
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  Crown,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Sliders,
  Zap,
  UserX,
  UserCheck,
  Save,
  RefreshCw,
  LogOut,
  BarChart3,
  Lock,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { ConversionAnalyticsSection } from './ConversionAnalyticsSection';
import {
  StudioUserAccount,
  StudioUsageEvent,
  StudioOrderRecord,
  MonetizationSettings,
  PlanTier,
  SubscriptionStatus,
  adminUpdateUserPlan,
  adminApproveOrder,
  saveMonetizationSettingsByAdmin,
  formatUsdPrice,
  buildDefaultPromoBannerText,
  resolvePromoBannerText,
} from '../services/firebaseStudioService';

interface AdminDashboardViewProps {
  users: StudioUserAccount[];
  usageEvents: StudioUsageEvent[];
  orders: StudioOrderRecord[];
  monetizationSettings: MonetizationSettings;
  isLoadingData: boolean;
  isPreviewingCustomerView: boolean;
  onTogglePreviewCustomerView: () => void;
  onSignOut: () => void;
  onNotify?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

type AdminSubTab = 'users' | 'analytics' | 'activity' | 'orders' | 'profitability';
type UserFilter = 'all' | 'paid' | 'active_using' | 'inactive' | 'free';

const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'Gratis',
  limited_trial: 'Prueba $5 DLL',
  starter: 'Creador ($10)',
  pro: 'Pro Studio',
  vip: 'VIP Comercial',
};

const EVENT_LABELS: Record<string, string> = {
  session_start: 'Entró al Estudio',
  audiobook_created: 'Creó Audiolibro IA',
  pdf_created: 'Creó PDF Completo IA',
  voice_generated: 'Generó Voz 24kHz',
  video_exported: 'Exportó Video/Audio',
  checkout_opened: 'Abrió Pago PayPal',
  subscription_activated: 'Activó Suscripción',
};

function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Sin registro';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 2) return 'En línea ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} d`;
  return date.toLocaleDateString();
}

function isOnlineNow(date: Date | null): boolean {
  if (!date) return false;
  return Date.now() - date.getTime() <= 15 * 60 * 1000;
}

function isActiveLast7Days(date: Date | null): boolean {
  if (!date) return false;
  return Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  users,
  usageEvents,
  orders,
  monetizationSettings,
  isLoadingData,
  isPreviewingCustomerView,
  onTogglePreviewCustomerView,
  onSignOut,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<AdminSubTab>('users');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Editable profitability settings
  const [draftSettings, setDraftSettings] = useState<MonetizationSettings>(monetizationSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  React.useEffect(() => {
    setDraftSettings(monetizationSettings);
  }, [monetizationSettings]);

  // Separate non-admin users (customers/subscribers) from admin accounts for accurate business metrics
  const customerUsers = useMemo(
    () => users.filter((u) => u.role !== 'admin'),
    [users]
  );

  const metrics = useMemo(() => {
    const totalCustomers = customerUsers.length;
    const paidSubscribers = customerUsers.filter(
      (u) => u.planTier !== 'free' && u.subscriptionStatus === 'active'
    );
    const activeUsing = customerUsers.filter(
      (u) => isActiveLast7Days(u.lastActiveAt) && (u.projectsCreated > 0 || u.sessionsCount > 1)
    );
    const onlineNow = customerUsers.filter((u) => isOnlineNow(u.lastActiveAt));
    const inactiveUsers = customerUsers.filter(
      (u) => !isActiveLast7Days(u.lastActiveAt) || u.projectsCreated === 0
    );
    const paidOrders = orders.filter((o) => o.status === 'paid');
    const pendingOrders = orders.filter((o) => o.status === 'pending');
    const totalRevenueUsd = paidOrders.reduce((sum, o) => sum + (Number(o.amountUsd) || 0), 0);
    const conversionRate =
      totalCustomers > 0 ? (paidSubscribers.length / totalCustomers) * 100 : 0;

    return {
      totalCustomers,
      paidCount: paidSubscribers.length,
      activeUsingCount: activeUsing.length,
      onlineNowCount: onlineNow.length,
      inactiveCount: inactiveUsers.length,
      totalRevenueUsd,
      paidOrdersCount: paidOrders.length,
      pendingOrdersCount: pendingOrders.length,
      conversionRate,
    };
  }, [customerUsers, orders]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customerUsers.filter((u) => {
      if (userFilter === 'paid' && !(u.planTier !== 'free' && u.subscriptionStatus === 'active')) {
        return false;
      }
      if (
        userFilter === 'active_using' &&
        !(isActiveLast7Days(u.lastActiveAt) && (u.projectsCreated > 0 || u.sessionsCount > 1))
      ) {
        return false;
      }
      if (
        userFilter === 'inactive' &&
        isActiveLast7Days(u.lastActiveAt) &&
        u.projectsCreated > 0
      ) {
        return false;
      }
      if (userFilter === 'free' && u.planTier !== 'free') {
        return false;
      }
      if (q) {
        return (
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          PLAN_LABELS[u.planTier].toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [customerUsers, userFilter, searchQuery]);

  // Top tools usage breakdown
  const moduleStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ev of usageEvents) {
      counts.set(ev.moduleId, (counts.get(ev.moduleId) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([moduleId, count]) => ({ moduleId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [usageEvents]);

  const handleQuickPlanChange = async (
    user: StudioUserAccount,
    planTier: PlanTier,
    subscriptionStatus: SubscriptionStatus,
    bonusTokens = 0
  ) => {
    setBusyUserId(user.uid);
    try {
      await adminUpdateUserPlan(user.uid, {
        planTier,
        subscriptionStatus,
        tokenBalance: Math.max(0, user.tokenBalance + bonusTokens),
      });
      onNotify?.(
        `Cuenta de ${user.displayName} actualizada a ${PLAN_LABELS[planTier]}.`,
        'success'
      );
    } catch {
      onNotify?.('No se pudo actualizar el plan del usuario.', 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleApprovePendingOrder = async (order: StudioOrderRecord) => {
    setBusyOrderId(order.orderId);
    try {
      const targetUser = users.find((u) => u.uid === order.userId);
      await adminApproveOrder(order, targetUser?.tokenBalance || 0);
      onNotify?.(`Pedido ${order.orderId} marcado como PAGADO y acreditado.`, 'success');
    } catch {
      onNotify?.('No se pudo aprobar el pedido.', 'error');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleResetUserQuota = async (user: StudioUserAccount) => {
    setBusyUserId(user.uid);
    try {
      await adminUpdateUserPlan(user.uid, { projectsCreated: 0 });
      onNotify?.(
        `Cuota gratuita de ${user.displayName} reiniciada a 0 proyectos usados.`,
        'success'
      );
    } catch {
      onNotify?.('No se pudo reiniciar la cuota de proyectos del usuario.', 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await saveMonetizationSettingsByAdmin(draftSettings);
      onNotify?.('Reglas de rentabilidad, tarifas y cuota gratuita guardadas en vivo.', 'success');
    } catch {
      onNotify?.('Error al guardar la configuración de rentabilidad.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveFreeQuotaOnly = async () => {
    setIsSavingSettings(true);
    try {
      const nextLimit = Math.max(
        0,
        Math.min(100, Math.round(Number(draftSettings.freeProjectsLimit) || 0))
      );
      await saveMonetizationSettingsByAdmin({
        ...draftSettings,
        freeProjectsLimit: nextLimit,
      });
      onNotify?.(
        nextLimit === 0
          ? 'Cuota actualizada: suscripción obligatoria desde el primer proyecto (0 gratis).'
          : `Cuota actualizada en vivo: máximo ${nextLimit} ${nextLimit === 1 ? 'proyecto gratuito' : 'proyectos gratuitos'} por usuario antes de suscripción obligatoria.`,
        'success'
      );
    } catch {
      onNotify?.('Error al guardar el límite de proyectos gratuitos en Firestore.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCopyShareUrl = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    onNotify?.('Enlace público copiado para promocionar tu app.', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Command Header */}
      <div className="rounded-3xl bg-slate-950 text-white p-6 sm:p-8 border border-amber-500/40 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>MODO ADMINISTRADOR EXCLUSIVO · SIN OPCIONES DE SUSCRIPTOR</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight">
              Panel de Control, Suscriptores y Rentabilidad
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Controla en tiempo real quién está usando tu programa, quién está suscrito, quién no lo usa todavía y ajusta tus precios y límites gratis para maximizar tus ingresos en USD.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Enlace Copiado' : 'Copiar Link para Clientes'}</span>
            </button>

            <button
              type="button"
              onClick={onTogglePreviewCustomerView}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer transition-colors ${
                isPreviewingCustomerView
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/15'
              }`}
              title="Activa esto solo si deseas ver temporalmente los botones de compra como un cliente"
            >
              {isPreviewingCustomerView ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>
                {isPreviewingCustomerView ? 'Salir de Vista de Cliente' : 'Vista de Cliente'}
              </span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-200 hover:text-rose-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live 6-Card KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Usuarios</span>
            <Users className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-950">
            {metrics.totalCustomers}
          </div>
          <div className="text-[11px] text-slate-500">Cuentas registradas</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Usando la App</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-700">
            {metrics.activeUsingCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            {metrics.onlineNowCount} en línea ahora
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-300 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-900 text-xs font-semibold">
            <span>Suscriptores Pago</span>
            <Crown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-900">
            {metrics.paidCount}
          </div>
          <div className="text-[11px] text-amber-800 font-semibold">
            Activos ($5 / Pro / VIP)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
            <span>Sin Usar / Inactivos</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-700">
            {metrics.inactiveCount}
          </div>
          <div className="text-[11px] text-slate-500">0 proyectos o +7d inactivos</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
            <span>Ingresos USD</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-950">
            ${metrics.totalRevenueUsd.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">
            {metrics.paidOrdersCount} pagos · {metrics.pendingOrdersCount} pend.
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
            <span>Conversión</span>
            <TrendingUp className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-950">
            {metrics.conversionRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500">De registro a pago</div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          {
            id: 'users' as const,
            label: `Suscriptores y Usuarios (${customerUsers.length})`,
            icon: Users,
          },
          {
            id: 'analytics' as const,
            label: 'Analíticas de Conversión',
            icon: BarChart3,
          },
          {
            id: 'activity' as const,
            label: `Actividad en Vivo (${usageEvents.length})`,
            icon: Activity,
          },
          {
            id: 'orders' as const,
            label: `Ventas PayPal (${orders.length})`,
            icon: DollarSign,
          },
          {
            id: 'profitability' as const,
            label: 'Configuración de Tarifas',
            icon: Sliders,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-colors cursor-pointer border ${
                active
                  ? 'bg-slate-950 text-amber-400 border-amber-500/60'
                  : 'bg-white text-slate-700 hover:bg-amber-50 border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================
          TAB 1: SUBSCRIBERS & USERS (ACTIVE VS INACTIVE)
         =================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: `Todos (${customerUsers.length})` },
                  { id: 'paid', label: `Suscriptores Pago (${metrics.paidCount})` },
                  { id: 'active_using', label: `Usando la App (${metrics.activeUsingCount})` },
                  { id: 'inactive', label: `Sin Usar / Inactivos (${metrics.inactiveCount})` },
                  {
                    id: 'free',
                    label: `Plan Gratis (${customerUsers.filter((u) => u.planTier === 'free').length})`,
                  },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setUserFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border transition-colors ${
                    userFilter === chip.id
                      ? 'bg-amber-500 text-slate-950 border-amber-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar usuario o plan..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {isLoadingData ? (
            <div className="p-10 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              <span>Cargando suscriptores en tiempo real...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-amber-300 bg-amber-50/30 text-center space-y-2">
              <Users className="w-8 h-8 text-amber-700 mx-auto" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Aún no hay clientes registrados en este filtro
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Comparte el enlace de tu app con el botón <strong>Copiar Link para Clientes</strong>. Cada persona que entre con su cuenta aparecerá aquí automáticamente en vivo con su plan, proyectos y última actividad.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredUsers.map((u) => {
                const online = isOnlineNow(u.lastActiveAt);
                const active7d = isActiveLast7Days(u.lastActiveAt) && u.projectsCreated > 0;
                const isPaid = u.planTier !== 'free' && u.subscriptionStatus === 'active';
                const freeLimit = Math.max(0, Math.round(monetizationSettings.freeProjectsLimit));
                const reachedFreeQuota = !isPaid && u.projectsCreated >= freeLimit;
                return (
                  <div
                    key={u.uid}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-950 truncate">
                          {u.displayName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.subscriptionStatus === 'suspended'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {PLAN_LABELS[u.planTier]}
                          {u.subscriptionStatus === 'suspended' ? ' · SUSPENDIDO' : ''}
                        </span>

                        {!isPaid && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              reachedFreeQuota
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            {reachedFreeQuota && <Lock className="w-2.5 h-2.5" />}
                            {reachedFreeQuota
                              ? `Cuota agotada (${u.projectsCreated}/${freeLimit}) · Pago obligatorio`
                              : `Cuota gratis: ${u.projectsCreated}/${freeLimit}`}
                          </span>
                        )}

                        {online ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            En línea
                          </span>
                        ) : active7d ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                            Usa la app
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                            Sin usar / Inactivo
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-mono">
                        <span>{u.email}</span>
                        <span>·</span>
                        <span>Proyectos: {u.projectsCreated}</span>
                        <span>·</span>
                        <span>Sesiones: {u.sessionsCount}</span>
                        <span>·</span>
                        <span>Tokens: {u.tokenBalance.toLocaleString()}</span>
                        <span>·</span>
                        <span>Último uso: {formatRelativeTime(u.lastActiveAt)} ({u.lastModuleUsed})</span>
                      </div>
                    </div>

                    {/* 1-Click Admin Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {!isPaid && u.projectsCreated > 0 && (
                        <button
                          type="button"
                          disabled={busyUserId === u.uid}
                          onClick={() => handleResetUserQuota(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                          title="Reiniciar contador de proyectos gratuitos de este usuario a 0"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reiniciar cuota</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyUserId === u.uid}
                        onClick={() =>
                          handleQuickPlanChange(u, 'limited_trial', 'active', 62500)
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                      >
                        Dar Prueba ${formatUsdPrice(monetizationSettings.trialPriceUsd)}
                      </button>
                      <button
                        type="button"
                        disabled={busyUserId === u.uid}
                        onClick={() => handleQuickPlanChange(u, 'pro', 'active', 300000)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                      >
                        Activar Pro
                      </button>
                      <button
                        type="button"
                        disabled={busyUserId === u.uid}
                        onClick={() =>
                          handleQuickPlanChange(
                            u,
                            u.planTier,
                            u.subscriptionStatus === 'suspended' ? 'active' : 'suspended',
                            0
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                      >
                        {u.subscriptionStatus === 'suspended' ? 'Reactivar' : 'Suspender'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================
          TAB 2: ANALÍTICAS DE CONVERSIÓN AVANZADA (RECHARTS + TABLA INTERACTIVA)
         =================================================================== */}
      {activeTab === 'analytics' && (
        <ConversionAnalyticsSection
          customerUsers={customerUsers}
          usageEvents={usageEvents}
          orders={orders}
          freeProjectsLimit={monetizationSettings.freeProjectsLimit}
          isLoadingData={isLoadingData}
        />
      )}

      {/* ===================================================================
          TAB 3: LIVE USAGE ACTIVITY FEED
         =================================================================== */}
      {activeTab === 'activity' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Registro de Actividad en Tiempo Real</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Últimos {usageEvents.length} eventos
              </span>
            </div>

            {usageEvents.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                Cuando los usuarios entren o creen audiolibros, PDFs o videos, verás cada acción aquí al instante.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                {usageEvents.map((ev) => (
                  <div key={ev.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{ev.userLabel}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold">
                          {EVENT_LABELS[ev.eventType] || ev.eventType}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate">{ev.summary}</p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {formatRelativeTime(ev.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Herramientas Más Usadas</span>
            </h3>
            {moduleStats.length === 0 ? (
              <p className="text-xs text-slate-500">Sin datos de módulos todavía.</p>
            ) : (
              <div className="space-y-3">
                {moduleStats.map((m) => {
                  const pct = Math.min(
                    100,
                    Math.round((m.count / Math.max(1, usageEvents.length)) * 100)
                  );
                  return (
                    <div key={m.moduleId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{m.moduleId}</span>
                        <span className="font-mono text-slate-500">
                          {m.count} usos ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 3: PAYPAL ORDERS & SUBSCRIPTIONS LEDGER
         =================================================================== */}
      {activeTab === 'orders' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-950">
              Pedidos y Pagos PayPal Registrados
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-700">
              Total Cobrado: ${metrics.totalRevenueUsd.toFixed(2)} USD
            </span>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              Aún no hay pedidos registrados. Cada orden creada desde “Prueba por solo $5 DLL” o los planes Pro aparecerá aquí automáticamente.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-950">{order.userLabel}</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {order.orderId}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          order.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'cancelled'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {order.status === 'paid'
                          ? 'PAGADO'
                          : order.status === 'cancelled'
                            ? 'CANCELADO'
                            : 'PENDIENTE'}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      {order.packageTitle} · +{order.tokensGranted.toLocaleString()} tokens
                      {order.paypalTxId ? ` · Recibo: ${order.paypalTxId}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-sm text-slate-950">
                      ${order.amountUsd.toFixed(2)} USD
                    </span>
                    {order.status === 'pending' && (
                      <button
                        type="button"
                        disabled={busyOrderId === order.orderId}
                        onClick={() => handleApprovePendingOrder(order)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                      >
                        Aprobar y Activar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================
          TAB 4: CONFIGURACIÓN DE TARIFAS (REAL-TIME FIRESTORE + LIVE BANNER)
         =================================================================== */}
      {activeTab === 'profitability' && (() => {
        const hasUnsavedTariffChanges =
          draftSettings.trialPriceUsd !== monetizationSettings.trialPriceUsd ||
          draftSettings.proPriceUsd !== monetizationSettings.proPriceUsd ||
          draftSettings.annualPriceUsd !== monetizationSettings.annualPriceUsd ||
          draftSettings.freeProjectsLimit !== monetizationSettings.freeProjectsLimit ||
          draftSettings.requireLoginForExport !== monetizationSettings.requireLoginForExport ||
          draftSettings.promoBannerEnabled !== monetizationSettings.promoBannerEnabled ||
          draftSettings.promoBannerText !== monetizationSettings.promoBannerText;

        const previewBannerText = resolvePromoBannerText(draftSettings);
        const exactFreeQuota = Math.max(
          0,
          Math.min(100, Math.round(Number(draftSettings.freeProjectsLimit) || 0))
        );
        const freeProjectsBadge =
          exactFreeQuota <= 0
            ? 'Pago obligatorio (0 gratis)'
            : exactFreeQuota === 1
              ? '1 proyecto gratis'
              : `${exactFreeQuota} proyectos gratis`;

        const freeTierUsers = customerUsers.filter(
          (u) => !(u.planTier !== 'free' && u.subscriptionStatus === 'active')
        );
        const freeUsersBlockedAtDraftLimit = freeTierUsers.filter(
          (u) => u.projectsCreated >= exactFreeQuota
        ).length;
        const freeUsersWithRemainingQuota = Math.max(
          0,
          freeTierUsers.length - freeUsersBlockedAtDraftLimit
        );
        const quotaChangedOnly = exactFreeQuota !== monetizationSettings.freeProjectsLimit;

        return (
          <div className="space-y-6">
            {/* Dedicated Section: Mandatory Free Projects Quota Before Subscription */}
            <div className="rounded-2xl bg-white border-2 border-slate-900/90 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-950">
                        Control de Proyectos Gratuitos antes de Suscripción Obligatoria
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          quotaChangedOnly
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {quotaChangedOnly
                          ? 'Nuevo límite sin guardar'
                          : `Activo en vivo: ${monetizationSettings.freeProjectsLimit} gratis`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 max-w-2xl">
                      Define la cantidad exacta de proyectos gratuitos que puede generar cada usuario antes de bloquear nuevas creaciones y exigir obligatoriamente una suscripción activa.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSavingSettings}
                  onClick={handleSaveFreeQuotaOnly}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 font-extrabold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSavingSettings ? 'Aplicando cuota...' : 'Guardar Límite Obligatorio'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Exact Numeric Control + Presets */}
                <div className="lg:col-span-7 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="exact-free-projects-limit"
                      className="text-xs font-extrabold text-slate-900"
                    >
                      Cantidad exacta de proyectos gratuitos por usuario (0 – 100)
                    </label>
                    <span className="text-xs font-mono font-extrabold text-amber-800">
                      {freeProjectsBadge}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setDraftSettings((s) => ({
                            ...s,
                            freeProjectsLimit: Math.max(0, (Number(s.freeProjectsLimit) || 0) - 1),
                          }))
                        }
                        className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer border-r border-slate-200"
                        aria-label="Disminuir proyectos gratuitos"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        id="exact-free-projects-limit"
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={exactFreeQuota}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const parsed =
                            raw === ''
                              ? 0
                              : Math.max(0, Math.min(100, Math.round(Number(raw) || 0)));
                          setDraftSettings((s) => ({
                            ...s,
                            freeProjectsLimit: parsed,
                          }));
                        }}
                        className="w-20 h-10 text-center text-base font-mono font-black text-slate-950 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraftSettings((s) => ({
                            ...s,
                            freeProjectsLimit: Math.min(100, (Number(s.freeProjectsLimit) || 0) + 1),
                          }))
                        }
                        className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer border-l border-slate-200"
                        aria-label="Aumentar proyectos gratuitos"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[0, 1, 2, 3, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setDraftSettings((s) => ({
                              ...s,
                              freeProjectsLimit: preset,
                            }))
                          }
                          className={`px-2.5 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            exactFreeQuota === preset
                              ? 'bg-slate-950 text-amber-300 border-slate-950'
                              : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {preset === 0 ? '0 · Pago directo' : `${preset} gratis`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Rule Summary */}
                  <div
                    className={`rounded-lg px-3.5 py-2.5 text-xs border leading-relaxed ${
                      exactFreeQuota === 0
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50/80 border-amber-200 text-amber-950'
                    }`}
                  >
                    {exactFreeQuota === 0 ? (
                      <>
                        <strong>Bloqueo inmediato (0 proyectos gratis):</strong> ningún usuario sin suscripción podrá generar audiolibros, PDFs IA, guiones, propuestas ni clips; se mostrará la ventana de suscripción obligatoria desde el primer intento.
                      </>
                    ) : (
                      <>
                        <strong>Regla exacta activa:</strong> cada usuario gratuito podrá crear hasta{' '}
                        <strong>
                          {exactFreeQuota} {exactFreeQuota === 1 ? 'proyecto' : 'proyectos'}
                        </strong>{' '}
                        en el estudio. Al intentar generar el proyecto{' '}
                        <strong>#{exactFreeQuota + 1}</strong>, la generación se bloqueará y se solicitará obligatoriamente una suscripción.
                      </>
                    )}
                  </div>
                </div>

                {/* Live Impact Telemetry on Real Firestore Users */}
                <div className="lg:col-span-5 rounded-xl bg-slate-950 text-white p-4 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                      Impacto en tus Usuarios Actuales
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {freeTierUsers.length} usuarios gratuitos
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                      <div className="text-lg font-black font-mono text-rose-400">
                        {freeUsersBlockedAtDraftLimit}
                      </div>
                      <div className="text-[10px] text-slate-300 leading-tight mt-0.5">
                        Requieren suscripción
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                      <div className="text-lg font-black font-mono text-amber-300">
                        {freeUsersWithRemainingQuota}
                      </div>
                      <div className="text-[10px] text-slate-300 leading-tight mt-0.5">
                        Con cuota gratis
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                      <div className="text-lg font-black font-mono text-emerald-400">
                        {metrics.paidCount}
                      </div>
                      <div className="text-[10px] text-slate-300 leading-tight mt-0.5">
                        Suscriptores activos
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">
                    Los administradores y suscriptores con plan activo nunca se ven bloqueados. El contador de cada usuario está protegido por reglas de Firestore para evitar reinicios manuales.
                  </p>
                </div>
              </div>
            </div>
            {/* Live Promotional Banner Preview (Reflects exact changes in real time) */}
            <div className="rounded-2xl bg-white border border-amber-300/90 p-5 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-900">
                    Vista Previa del Banner Promocional en Tiempo Real
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold ${
                      hasUnsavedTariffChanges
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {hasUnsavedTariffChanges
                      ? 'Cambios listos para publicar'
                      : 'Sincronizado en vivo con Firestore'}
                  </span>
                  {monetizationSettings.updatedAt && (
                    <span className="text-slate-500 font-mono">
                      Último cambio: {formatRelativeTime(monetizationSettings.updatedAt)}
                    </span>
                  )}
                </div>
              </div>

              {draftSettings.promoBannerEnabled ? (
                <div className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-1.5 min-w-0">
                    <div className="font-bold text-amber-950">{previewBannerText}</div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 font-bold text-amber-900">
                        {freeProjectsBadge}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 font-mono font-bold text-slate-900">
                        Prueba: ${formatUsdPrice(draftSettings.trialPriceUsd)} DLL
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 font-mono font-bold text-slate-900">
                        Pro: ${formatUsdPrice(draftSettings.proPriceUsd)}/mes
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 font-mono font-bold text-slate-900">
                        VIP: ${formatUsdPrice(draftSettings.annualPriceUsd)}/año
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-950 font-bold text-xs">
                      Crear Cuenta Gratis
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-amber-300 font-extrabold text-xs">
                      Activar Prueba ${formatUsdPrice(draftSettings.trialPriceUsd)} DLL
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-dashed border-slate-300 px-4 py-3 text-xs text-slate-500">
                  El banner promocional está desactivado actualmente para los visitantes. Activa la casilla inferior para mostrarlo en tiempo real.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Tariff & Limits Form */}
              <form
                onSubmit={handleSaveSettings}
                className="rounded-2xl bg-white border border-amber-200 p-6 space-y-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-700" />
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-950">
                        Configuración de Tarifas y Límites
                      </h3>
                      <p className="text-xs text-slate-500">
                        Se guarda en Firestore y actualiza los banners y planes al instante.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subscription Prices */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Prueba 7 días (USD)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      step="0.5"
                      value={draftSettings.trialPriceUsd}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(500, Number(e.target.value) || 1));
                        setDraftSettings((s) => ({
                          ...s,
                          trialPriceUsd: val,
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-none text-sm font-mono font-bold text-slate-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Pro Mensual (USD)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      step="0.5"
                      value={draftSettings.proPriceUsd}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(1000, Number(e.target.value) || 1));
                        setDraftSettings((s) => ({
                          ...s,
                          proPriceUsd: val,
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-none text-sm font-mono font-bold text-slate-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Anual VIP (USD)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5000}
                      step="1"
                      value={draftSettings.annualPriceUsd}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(5000, Number(e.target.value) || 1));
                        setDraftSettings((s) => ({
                          ...s,
                          annualPriceUsd: val,
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-none text-sm font-mono font-bold text-slate-950"
                    />
                  </div>
                </div>

                {/* Synced Free Projects Limit Summary inside Main Tariff Form */}
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                  <div className="flex items-center gap-2 text-amber-950 font-bold">
                    <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Cuota gratuita configurada arriba:</span>
                  </div>
                  <span className="font-mono font-extrabold text-slate-950">
                    {exactFreeQuota} {exactFreeQuota === 1 ? 'proyecto' : 'proyectos'} antes de pago obligatorio
                  </span>
                </div>

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftSettings.requireLoginForExport}
                    onChange={(e) =>
                      setDraftSettings((s) => ({
                        ...s,
                        requireLoginForExport: e.target.checked,
                      }))
                    }
                    className="mt-0.5 accent-amber-600"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">
                      Exigir cuenta Google para exportar MP3 / MP4 / PDF
                    </div>
                    <div className="text-slate-500">
                      Garantiza que todo usuario que descargue contenido quede registrado en tu lista de clientes para seguimiento y ventas.
                    </div>
                  </div>
                </label>

                <div className="space-y-2.5 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftSettings.promoBannerEnabled}
                        onChange={(e) =>
                          setDraftSettings((s) => ({
                            ...s,
                            promoBannerEnabled: e.target.checked,
                          }))
                        }
                        className="accent-amber-600"
                      />
                      <span>Mostrar banner promocional a visitantes</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftSettings((s) => ({
                          ...s,
                          promoBannerText: buildDefaultPromoBannerText(s),
                        }))
                      }
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900 cursor-pointer"
                    >
                      Sincronizar texto con tarifas
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={180}
                    value={draftSettings.promoBannerText}
                    onChange={(e) =>
                      setDraftSettings((s) => ({ ...s, promoBannerText: e.target.value }))
                    }
                    placeholder="Ej. Oferta activa: {freeLimit} proyecto gratis · Prueba por solo {trial} DLL"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-amber-300 text-xs text-slate-900"
                  />
                  <p className="text-[11px] text-amber-900/75">
                    Tip: puedes usar variables automáticas <code className="font-mono font-bold">{'{trial}'}</code>,{' '}
                    <code className="font-mono font-bold">{'{pro}'}</code>,{' '}
                    <code className="font-mono font-bold">{'{annual}'}</code> y{' '}
                    <code className="font-mono font-bold">{'{freeLimit}'}</code> o escribir texto libre ({draftSettings.promoBannerText.length}/180).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSavingSettings
                      ? 'Publicando tarifas en Firestore...'
                      : 'Guardar y Publicar Tarifas en Tiempo Real'}
                  </span>
                </button>
              </form>

              {/* Actionable Profitability Playbook */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-950">
                      Proyección de Ingresos con tus Tarifas Actuales
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cálculo instantáneo según los precios configurados a la izquierda
                    </p>
                  </div>
                </div>

                {/* Revenue Projection Mini-Table */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-[11px] font-bold text-amber-900">
                      20 Pruebas ${formatUsdPrice(draftSettings.trialPriceUsd)}
                    </div>
                    <div className="text-lg font-black font-mono text-slate-950">
                      ${(20 * draftSettings.trialPriceUsd).toFixed(0)}
                    </div>
                    <div className="text-[10px] text-slate-600">Entrada rápida</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[11px] font-bold text-emerald-900">
                      25 Clientes Pro
                    </div>
                    <div className="text-lg font-black font-mono text-emerald-800">
                      ${(25 * draftSettings.proPriceUsd).toFixed(0)}/m
                    </div>
                    <div className="text-[10px] text-slate-600">Ingreso recurrente</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 text-white">
                    <div className="text-[11px] font-bold text-amber-300">
                      10 Anuales VIP
                    </div>
                    <div className="text-lg font-black font-mono text-white">
                      ${(10 * draftSettings.annualPriceUsd).toFixed(0)}
                    </div>
                    <div className="text-[10px] text-slate-400">Flujo inmediato</div>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-extrabold text-slate-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      1. Gancho activo: {freeProjectsBadge} → Prueba ${formatUsdPrice(draftSettings.trialPriceUsd)} DLL
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Al guardar tus tarifas, todos los banners promocionales, botones de pago y tarjetas de suscripción se actualizan en tiempo real sin recargar la página.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-extrabold text-slate-950 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      2. Convierte a tus usuarios “Sin Usar / Inactivos”
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Revisa la pestaña <strong>Sin Usar / Inactivos</strong> cada semana ({metrics.inactiveCount} actuales). Quien se registra pero no termina un proyecto suele convertirse si le das un seguimiento breve.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-extrabold text-slate-950 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-700" />
                      3. Promociona con videos hechos por tu propia app
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Publica clips cortos (30–45 s) en TikTok, Reels y YouTube Shorts mostrando la conversión de PDF a audiolibro y video con subtítulos con tu tarifa actual de <strong>${formatUsdPrice(draftSettings.trialPriceUsd)} DLL</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
