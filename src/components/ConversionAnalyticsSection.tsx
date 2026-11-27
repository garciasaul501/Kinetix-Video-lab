import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  Area,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  Users,
  Crown,
  TrendingUp,
  DollarSign,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Activity,
  Download,
  RotateCcw,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  StudioUserAccount,
  StudioUsageEvent,
  StudioOrderRecord,
  PlanTier,
} from '../services/firebaseStudioService';

interface ConversionAnalyticsSectionProps {
  customerUsers: StudioUserAccount[];
  usageEvents?: StudioUsageEvent[];
  orders: StudioOrderRecord[];
  freeProjectsLimit?: number;
  isLoadingData?: boolean;
}

type ChartMode = 'daily' | 'cumulative';
type TimeWindowDays = 7 | 14 | 30;
type SubscriptionFilter =
  | 'all'
  | 'active_paid'
  | 'free_within_quota'
  | 'free_quota_reached'
  | 'inactive_or_suspended';
type UsageTierFilter = 'all' | 'high' | 'medium' | 'low' | 'none';
type SortField =
  | 'displayName'
  | 'subscription'
  | 'usageRate'
  | 'projectsCreated'
  | 'sessionsCount'
  | 'lastActiveAt'
  | 'totalRevenue';
type SortDirection = 'asc' | 'desc';

interface DailyConversionPoint {
  isoDate: string;
  dateLabel: string;
  fullDateLabel: string;
  usuariosGratuitos: number;
  suscriptoresActivos: number;
  tasaConversionPct: number;
  eventosUso: number;
  ingresosDiaUsd: number;
}

interface EnrichedUserRow {
  user: StudioUserAccount;
  subscriptionCategory: Exclude<SubscriptionFilter, 'all'>;
  subscriptionLabel: string;
  usageRate: number; // 0..100
  usageTier: Exclude<UsageTierFilter, 'all'>;
  usageTierLabel: string;
  eventsInWindow: number;
  totalRevenueUsd: number;
  lastActiveMs: number;
}

const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'Gratuito',
  limited_trial: 'Prueba Acceso Limitado',
  starter: 'Paquete Creador',
  pro: 'Pro Studio',
  vip: 'Anual VIP',
};

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatRelativeDate(date: Date | null): string {
  if (!date) return 'Sin registro';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 30) return `Hace ${diffDays} d`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function computeUserUsageRate(
  user: StudioUserAccount,
  eventsInWindow: number,
  nowMs: number
): { rate: number; tier: Exclude<UsageTierFilter, 'all'>; label: string } {
  const projects = Math.max(0, user.projectsCreated || 0);
  const sessions = Math.max(0, user.sessionsCount || 0);
  const lastActiveMs = user.lastActiveAt?.getTime() || 0;
  const daysSinceActive = lastActiveMs > 0 ? Math.max(0, (nowMs - lastActiveMs) / 86400000) : 999;

  // If user has never created a project, has <= 1 session and no recent events
  if (projects === 0 && eventsInWindow === 0 && sessions <= 1 && daysSinceActive > 7) {
    return { rate: 0, tier: 'none', label: 'Sin uso' };
  }

  // Weighted engagement score (0..100):
  // - Projects created (up to 45 pts)
  // - Sessions & events in period (up to 35 pts)
  // - Recency bonus (up to 20 pts)
  const projectScore = Math.min(45, projects * 15);
  const activityScore = Math.min(35, Math.max(0, sessions - 1) * 5 + eventsInWindow * 6);
  const recencyScore =
    daysSinceActive <= 1
      ? 20
      : daysSinceActive <= 3
        ? 16
        : daysSinceActive <= 7
          ? 12
          : daysSinceActive <= 14
            ? 7
            : daysSinceActive <= 30
              ? 3
              : 0;

  const total = Math.max(0, Math.min(100, Math.round(projectScore + activityScore + recencyScore)));

  if (total >= 70) return { rate: total, tier: 'high', label: 'Alta' };
  if (total >= 30) return { rate: total, tier: 'medium', label: 'Media' };
  if (total >= 1) return { rate: total, tier: 'low', label: 'Baja' };
  return { rate: 0, tier: 'none', label: 'Sin uso' };
}

export const ConversionAnalyticsSection: React.FC<ConversionAnalyticsSectionProps> = ({
  customerUsers,
  usageEvents = [],
  orders,
  freeProjectsLimit = 1,
  isLoadingData = false,
}) => {
  const [windowDays, setWindowDays] = useState<TimeWindowDays>(30);
  const [chartMode, setChartMode] = useState<ChartMode>('daily');

  // Interactive Table Filters & Sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionFilter>('all');
  const [usageTierFilter, setUsageTierFilter] = useState<UsageTierFilter>('all');
  const [sortField, setSortField] = useState<SortField>('usageRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 10;

  const safeFreeLimit = Math.max(0, Math.round(Number(freeProjectsLimit) || 0));

  const analytics = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const startWindow = new Date(today);
    startWindow.setDate(today.getDate() - (windowDays - 1));

    // Revenue and first paid order date per user
    const firstPaidOrderDateByUser = new Map<string, Date>();
    const revenueByUser = new Map<string, number>();
    const revenueByDay = new Map<string, number>();
    let paidRevenueInWindow = 0;
    let paidOrdersInWindow = 0;

    for (const order of orders) {
      if (order.status !== 'paid') continue;
      const amount = Number(order.amountUsd) || 0;
      revenueByUser.set(order.userId, (revenueByUser.get(order.userId) || 0) + amount);

      const orderDate = order.updatedAt || order.createdAt;
      if (orderDate) {
        const normalizedOrderDay = new Date(orderDate);
        normalizedOrderDay.setHours(0, 0, 0, 0);
        if (normalizedOrderDay >= startWindow) {
          paidRevenueInWindow += amount;
          paidOrdersInWindow += 1;
          const dayKey = toDayKey(normalizedOrderDay > today ? today : normalizedOrderDay);
          revenueByDay.set(dayKey, (revenueByDay.get(dayKey) || 0) + amount);
        }
        const existing = firstPaidOrderDateByUser.get(order.userId);
        if (!existing || orderDate < existing) {
          firstPaidOrderDateByUser.set(order.userId, orderDate);
        }
      }
    }

    // Usage events per day and per user inside the window
    const eventsByDay = new Map<string, number>();
    const eventsCountByUser = new Map<string, number>();
    let totalEventsInWindow = 0;

    for (const ev of usageEvents) {
      if (!ev.createdAt) continue;
      const evDay = new Date(ev.createdAt);
      evDay.setHours(0, 0, 0, 0);
      if (evDay >= startWindow) {
        totalEventsInWindow += 1;
        const key = toDayKey(evDay > today ? today : evDay);
        eventsByDay.set(key, (eventsByDay.get(key) || 0) + 1);
        eventsCountByUser.set(ev.userId, (eventsCountByUser.get(ev.userId) || 0) + 1);
      }
    }

    // Build rolling day buckets
    const buckets = new Map<
      string,
      {
        isoDate: string;
        dateLabel: string;
        fullDateLabel: string;
        freeCount: number;
        paidCount: number;
      }
    >();
    const orderedKeys: string[] = [];

    for (let i = 0; i < windowDays; i++) {
      const d = new Date(startWindow);
      d.setDate(startWindow.getDate() + i);
      const key = toDayKey(d);
      orderedKeys.push(key);
      buckets.set(key, {
        isoDate: key,
        dateLabel: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        fullDateLabel: d.toLocaleDateString('es-ES', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        freeCount: 0,
        paidCount: 0,
      });
    }

    let baselineFreeBeforeWindow = 0;
    let baselinePaidBeforeWindow = 0;
    let freeInWindow = 0;
    let paidInWindow = 0;

    const tierBreakdown: Record<PlanTier, number> = {
      free: 0,
      limited_trial: 0,
      starter: 0,
      pro: 0,
      vip: 0,
    };

    const enrichedUsers: EnrichedUserRow[] = [];

    for (const user of customerUsers) {
      const isPaidSubscriber =
        user.planTier !== 'free' && user.subscriptionStatus === 'active';
      const isInactiveOrSuspended =
        user.subscriptionStatus === 'suspended' || user.subscriptionStatus === 'expired';

      let subscriptionCategory: Exclude<SubscriptionFilter, 'all'>;
      let subscriptionLabel: string;

      if (isPaidSubscriber) {
        subscriptionCategory = 'active_paid';
        subscriptionLabel = `${PLAN_LABELS[user.planTier]} · Activa`;
      } else if (isInactiveOrSuspended) {
        subscriptionCategory = 'inactive_or_suspended';
        subscriptionLabel =
          user.subscriptionStatus === 'suspended' ? 'Suspendida' : 'Expirada';
      } else if ((user.projectsCreated || 0) >= safeFreeLimit) {
        subscriptionCategory = 'free_quota_reached';
        subscriptionLabel = 'Gratuito · Cuota agotada';
      } else {
        subscriptionCategory = 'free_within_quota';
        subscriptionLabel = 'Gratuito · En cuota';
      }

      const eventsInWindow = eventsCountByUser.get(user.uid) || 0;
      const usageInfo = computeUserUsageRate(user, eventsInWindow, nowMs);

      enrichedUsers.push({
        user,
        subscriptionCategory,
        subscriptionLabel,
        usageRate: usageInfo.rate,
        usageTier: usageInfo.tier,
        usageTierLabel: usageInfo.label,
        eventsInWindow,
        totalRevenueUsd: revenueByUser.get(user.uid) || 0,
        lastActiveMs: user.lastActiveAt?.getTime() || 0,
      });

      const paidDate = firstPaidOrderDateByUser.get(user.uid);
      const effectiveDate =
        (isPaidSubscriber && paidDate) ||
        user.createdAt ||
        user.lastActiveAt ||
        user.updatedAt ||
        today;

      const normalized = new Date(effectiveDate);
      normalized.setHours(0, 0, 0, 0);

      if (normalized < startWindow) {
        if (isPaidSubscriber) baselinePaidBeforeWindow += 1;
        else baselineFreeBeforeWindow += 1;
        continue;
      }

      const key = toDayKey(normalized > today ? today : normalized);
      const bucket = buckets.get(key);
      if (bucket) {
        if (isPaidSubscriber) {
          bucket.paidCount += 1;
          paidInWindow += 1;
          tierBreakdown[user.planTier] += 1;
        } else {
          bucket.freeCount += 1;
          freeInWindow += 1;
          tierBreakdown.free += 1;
        }
      }
    }

    let runningFree = baselineFreeBeforeWindow;
    let runningPaid = baselinePaidBeforeWindow;

    const dailySeries: DailyConversionPoint[] = [];
    const cumulativeSeries: DailyConversionPoint[] = [];

    for (const key of orderedKeys) {
      const b = buckets.get(key)!;
      const dayTotal = b.freeCount + b.paidCount;
      const dayRate = dayTotal > 0 ? Number(((b.paidCount / dayTotal) * 100).toFixed(1)) : 0;
      const dayEvents = eventsByDay.get(key) || 0;
      const dayRevenue = Number((revenueByDay.get(key) || 0).toFixed(2));

      dailySeries.push({
        isoDate: b.isoDate,
        dateLabel: b.dateLabel,
        fullDateLabel: b.fullDateLabel,
        usuariosGratuitos: b.freeCount,
        suscriptoresActivos: b.paidCount,
        tasaConversionPct: dayRate,
        eventosUso: dayEvents,
        ingresosDiaUsd: dayRevenue,
      });

      runningFree += b.freeCount;
      runningPaid += b.paidCount;
      const cumTotal = runningFree + runningPaid;
      const cumRate = cumTotal > 0 ? Number(((runningPaid / cumTotal) * 100).toFixed(1)) : 0;

      cumulativeSeries.push({
        isoDate: b.isoDate,
        dateLabel: b.dateLabel,
        fullDateLabel: b.fullDateLabel,
        usuariosGratuitos: runningFree,
        suscriptoresActivos: runningPaid,
        tasaConversionPct: cumRate,
        eventosUso: dayEvents,
        ingresosDiaUsd: dayRevenue,
      });
    }

    const totalInWindow = freeInWindow + paidInWindow;
    const conversionRateWindow = totalInWindow > 0 ? (paidInWindow / totalInWindow) * 100 : 0;
    const avgUsageRateAll =
      enrichedUsers.length > 0
        ? enrichedUsers.reduce((acc, r) => acc + r.usageRate, 0) / enrichedUsers.length
        : 0;

    return {
      dailySeries,
      cumulativeSeries,
      freeInWindow,
      paidInWindow,
      totalInWindow,
      totalAllFree: runningFree,
      totalAllPaid: runningPaid,
      conversionRateWindow,
      paidRevenueInWindow,
      paidOrdersInWindow,
      totalEventsInWindow,
      avgUsageRateAll,
      tierBreakdown,
      enrichedUsers,
    };
  }, [customerUsers, usageEvents, orders, windowDays, safeFreeLimit]);

  const activeSeries =
    chartMode === 'daily' ? analytics.dailySeries : analytics.cumulativeSeries;

  // Filtered and sorted interactive table rows
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = analytics.enrichedUsers.filter((row) => {
      if (subscriptionFilter !== 'all' && row.subscriptionCategory !== subscriptionFilter) {
        return false;
      }
      if (usageTierFilter !== 'all' && row.usageTier !== usageTierFilter) {
        return false;
      }
      if (q) {
        const match =
          row.user.displayName.toLowerCase().includes(q) ||
          row.user.email.toLowerCase().includes(q) ||
          row.user.lastModuleUsed.toLowerCase().includes(q) ||
          row.subscriptionLabel.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    const dir = sortDirection === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      switch (sortField) {
        case 'displayName':
          return a.user.displayName.localeCompare(b.user.displayName) * dir;
        case 'subscription':
          return a.subscriptionLabel.localeCompare(b.subscriptionLabel) * dir;
        case 'usageRate':
          return (a.usageRate - b.usageRate) * dir;
        case 'projectsCreated':
          return (a.user.projectsCreated - b.user.projectsCreated) * dir;
        case 'sessionsCount':
          return (a.user.sessionsCount - b.user.sessionsCount) * dir;
        case 'lastActiveAt':
          return (a.lastActiveMs - b.lastActiveMs) * dir;
        case 'totalRevenue':
          return (a.totalRevenueUsd - b.totalRevenueUsd) * dir;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    analytics.enrichedUsers,
    searchQuery,
    subscriptionFilter,
    usageTierFilter,
    sortField,
    sortDirection,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Segment summary for currently filtered cohort
  const segmentStats = useMemo(() => {
    const count = filteredRows.length;
    if (count === 0) {
      return { avgUsage: 0, paidCount: 0, paidPct: 0, revenue: 0 };
    }
    const avgUsage = filteredRows.reduce((s, r) => s + r.usageRate, 0) / count;
    const paidCount = filteredRows.filter((r) => r.subscriptionCategory === 'active_paid').length;
    const revenue = filteredRows.reduce((s, r) => s + r.totalRevenueUsd, 0);
    return {
      avgUsage,
      paidCount,
      paidPct: (paidCount / count) * 100,
      revenue,
    };
  }, [filteredRows]);

  const handleSort = (field: SortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-amber-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-amber-600" />
    );
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 || subscriptionFilter !== 'all' || usageTierFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSubscriptionFilter('all');
    setUsageTierFilter('all');
    setCurrentPage(1);
  };

  const handleExportFilteredCsv = () => {
    const headers = [
      'Nombre',
      'Correo',
      'Estado Suscripción',
      'Plan',
      'Tasa de Uso (%)',
      'Nivel de Uso',
      'Proyectos Creados',
      'Sesiones',
      `Eventos (${windowDays}d)`,
      'Último Módulo',
      'Ingresos USD',
    ];
    const escapeCell = (val: string | number) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };
    const lines = [
      headers.map(escapeCell).join(','),
      ...filteredRows.map((r) =>
        [
          r.user.displayName,
          r.user.email,
          r.subscriptionLabel,
          PLAN_LABELS[r.user.planTier],
          r.usageRate,
          r.usageTierLabel,
          r.user.projectsCreated,
          r.user.sessionsCount,
          r.eventsInWindow,
          r.user.lastModuleUsed,
          r.totalRevenueUsd.toFixed(2),
        ]
          .map(escapeCell)
          .join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kinetix-analiticas-conversion-${windowDays}d.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const xAxisInterval = windowDays === 7 ? 0 : windowDays === 14 ? 1 : 3;

  return (
    <div className="space-y-6">
      {/* =====================================================================
          SECTION 1: HEADER, WINDOW SELECTOR, KPI CARDS & DUAL RECHARTS TRENDS
         ===================================================================== */}
      <div className="rounded-2xl bg-white border border-amber-200/90 p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>Ventana móvil · Últimos {windowDays} días en tiempo real</span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-slate-950 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-700" />
              <span>Analíticas de Conversión y Tendencias Temporales</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl">
              Evolución diaria y acumulada de usuarios gratuitos frente a suscriptores activos, tasa de conversión y volumen de uso desde Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Timeframe Switcher (7d / 14d / 30d) */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
              {([7, 14, 30] as TimeWindowDays[]).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setWindowDays(days)}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    windowDays === days
                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            {/* Chart Mode Switcher */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setChartMode('daily')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  chartMode === 'daily'
                    ? 'bg-slate-950 text-amber-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Diario
              </button>
              <button
                type="button"
                onClick={() => setChartMode('cumulative')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  chartMode === 'cumulative'
                    ? 'bg-slate-950 text-amber-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Acumulado
              </button>
            </div>
          </div>
        </div>

        {/* 5 Conversion & Usage Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span>Gratuitos ({windowDays}d)</span>
              <Users className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-950">
              {chartMode === 'daily' ? analytics.freeInWindow : analytics.totalAllFree}
            </div>
            <div className="text-[11px] text-amber-900/75">
              {chartMode === 'daily' ? `Nuevos últimos ${windowDays} días` : 'Base gratuita total'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>Suscriptores Activos</span>
              <Crown className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-800">
              {chartMode === 'daily' ? analytics.paidInWindow : analytics.totalAllPaid}
            </div>
            <div className="text-[11px] text-emerald-800/80">
              {chartMode === 'daily' ? `Activados en ${windowDays}d` : 'Total activos'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Conversión ({windowDays}d)</span>
              <TrendingUp className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-950">
              {analytics.conversionRateWindow.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500">
              {analytics.paidInWindow} de {analytics.totalInWindow} usuarios
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Tasa de Uso Media</span>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-950">
              {analytics.avgUsageRateAll.toFixed(0)}%
            </div>
            <div className="text-[11px] text-slate-500">
              {analytics.totalEventsInWindow} eventos en {windowDays}d
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 p-3.5 rounded-xl bg-slate-950 text-white border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span>Ingresos ({windowDays}d)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white">
              ${analytics.paidRevenueInWindow.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400">
              {analytics.paidOrdersInWindow} pagos confirmados
            </div>
          </div>
        </div>

        {/* Dual Recharts Visualizations */}
        {isLoadingData ? (
          <div className="h-[320px] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-500 font-semibold">
            Cargando métricas y tendencias en vivo desde Firestore...
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Chart A: BarChart — Gratuitos vs Suscriptores Activos */}
            <div className="rounded-2xl bg-slate-50/70 border border-slate-200 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-900">
                    Gratuitos vs. Suscriptores Activos ({chartMode === 'daily' ? 'Diario' : 'Acumulado'})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Comparación en barras de los últimos {windowDays} días
                  </p>
                </div>
              </div>

              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeSeries}
                    margin={{ top: 10, right: 10, left: -14, bottom: 2 }}
                    barGap={3}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 10, fill: '#475569' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      interval={xAxisInterval}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: '#475569' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(245, 158, 11, 0.08)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const point = payload[0]?.payload as DailyConversionPoint | undefined;
                        if (!point) return null;
                        return (
                          <div className="rounded-xl bg-slate-950 text-white border border-amber-500/40 px-3.5 py-2.5 shadow-xl text-xs space-y-1.5">
                            <div className="font-bold text-amber-300 capitalize">
                              {point.fullDateLabel}
                            </div>
                            <div className="flex items-center justify-between gap-5">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                                Usuarios Gratuitos
                              </span>
                              <span className="font-mono font-extrabold text-white">
                                {point.usuariosGratuitos}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-5">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                                Suscriptores Activos
                              </span>
                              <span className="font-mono font-extrabold text-emerald-300">
                                {point.suscriptoresActivos}
                              </span>
                            </div>
                            <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                              <span>Tasa de conversión</span>
                              <span className="font-mono font-bold text-amber-300">
                                {point.tasaConversionPct}%
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" />
                    <Bar
                      dataKey="usuariosGratuitos"
                      name="Usuarios Gratuitos"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="suscriptoresActivos"
                      name="Suscriptores Activos"
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart B: ComposedChart — Tendencias Temporales (Tasa de Conversión % + Eventos de Uso) */}
            <div className="rounded-2xl bg-slate-50/70 border border-slate-200 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-900">
                    Tendencia Temporal: Tasa de Conversión (%) y Actividad
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Evolución de eventos de uso diarios frente al porcentaje de conversión
                  </p>
                </div>
              </div>

              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={activeSeries}
                    margin={{ top: 10, right: 6, left: -14, bottom: 2 }}
                  >
                    <defs>
                      <linearGradient id="kinetixUsageArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 10, fill: '#475569' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      interval={xAxisInterval}
                    />
                    <YAxis
                      yAxisId="left"
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: '#475569' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 10, fill: '#059669' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const point = payload[0]?.payload as DailyConversionPoint | undefined;
                        if (!point) return null;
                        return (
                          <div className="rounded-xl bg-slate-950 text-white border border-amber-500/40 px-3.5 py-2.5 shadow-xl text-xs space-y-1.5">
                            <div className="font-bold text-amber-300 capitalize">
                              {point.fullDateLabel}
                            </div>
                            <div className="flex items-center justify-between gap-5">
                              <span className="text-slate-300">Eventos de uso</span>
                              <span className="font-mono font-extrabold text-white">
                                {point.eventosUso}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-5">
                              <span className="text-slate-300">Tasa de conversión</span>
                              <span className="font-mono font-extrabold text-emerald-300">
                                {point.tasaConversionPct}%
                              </span>
                            </div>
                            <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                              <span>Ingresos del día</span>
                              <span className="font-mono font-bold text-amber-300">
                                ${point.ingresosDiaUsd.toFixed(2)} USD
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="eventosUso"
                      name="Eventos de Uso"
                      stroke="#0f172a"
                      strokeWidth={2}
                      fill="url(#kinetixUsageArea)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="tasaConversionPct"
                      name="Conversión (%)"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 2.5, fill: '#059669' }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          SECTION 2: INTERACTIVE COHORT TABLE (FILTER BY SUBSCRIPTION & USAGE RATE)
         ===================================================================== */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-extrabold text-slate-950 flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-700" />
              <span>Tabla Interactiva de Usuarios por Suscripción y Tasa de Uso</span>
            </h4>
            <p className="text-xs text-slate-500">
              Segmenta usuarios gratuitos que agotaron su cuota o tienen alta actividad para convertirlos en suscriptores pagos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportFilteredCsv}
              disabled={filteredRows.length === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV ({filteredRows.length})</span>
            </button>
          </div>
        </div>

        {/* Interactive Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre, correo o módulo..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Subscription Status Filter */}
          <div className="md:col-span-4">
            <select
              aria-label="Filtrar por estado de suscripción"
              value={subscriptionFilter}
              onChange={(e) => {
                setSubscriptionFilter(e.target.value as SubscriptionFilter);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Estado: Todos los estados</option>
              <option value="active_paid">Suscripción Activa (Pago)</option>
              <option value="free_quota_reached">Gratuito · Cuota agotada (Pago obligatorio)</option>
              <option value="free_within_quota">Gratuito · Con cuota disponible</option>
              <option value="inactive_or_suspended">Expirada o Suspendida</option>
            </select>
          </div>

          {/* Usage Rate Filter */}
          <div className="md:col-span-4">
            <select
              aria-label="Filtrar por tasa de uso"
              value={usageTierFilter}
              onChange={(e) => {
                setUsageTierFilter(e.target.value as UsageTierFilter);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Tasa de uso: Todos los niveles</option>
              <option value="high">Alta (70% – 100%) · Power Users</option>
              <option value="medium">Media (30% – 69%) · Uso regular</option>
              <option value="low">Baja (1% – 29%) · Uso ocasional</option>
              <option value="none">Sin uso (0%) · Inactivos</option>
            </select>
          </div>
        </div>

        {/* Live Filtered Segment Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-50/60 border border-amber-200/90 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-800">
            <span>
              Mostrando <strong className="font-mono text-slate-950">{filteredRows.length}</strong>{' '}
              de <strong className="font-mono text-slate-950">{analytics.enrichedUsers.length}</strong>{' '}
              usuarios
            </span>
            <span className="text-amber-300">|</span>
            <span>
              Tasa de uso media:{' '}
              <strong className="font-mono text-amber-900">
                {segmentStats.avgUsage.toFixed(0)}%
              </strong>
            </span>
            <span className="text-amber-300">|</span>
            <span>
              Conversión del segmento:{' '}
              <strong className="font-mono text-emerald-700">
                {segmentStats.paidPct.toFixed(1)}%
              </strong>{' '}
              ({segmentStats.paidCount} pagos)
            </span>
          </div>
          <div className="font-mono font-extrabold text-slate-950">
            Ingresos segmento: ${segmentStats.revenue.toFixed(2)} USD
          </div>
        </div>

        {/* Responsive Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('displayName')}
                    className="inline-flex items-center gap-1 hover:text-slate-950 cursor-pointer"
                  >
                    <span>Usuario</span>
                    {renderSortIcon('displayName')}
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('subscription')}
                    className="inline-flex items-center gap-1 hover:text-slate-950 cursor-pointer"
                  >
                    <span>Suscripción</span>
                    {renderSortIcon('subscription')}
                  </button>
                </th>
                <th className="py-3 px-3 min-w-[160px]">
                  <button
                    type="button"
                    onClick={() => handleSort('usageRate')}
                    className="inline-flex items-center gap-1 hover:text-slate-950 cursor-pointer"
                  >
                    <span>Tasa de Uso</span>
                    {renderSortIcon('usageRate')}
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('projectsCreated')}
                    className="inline-flex items-center gap-1 hover:text-slate-950 cursor-pointer ml-auto"
                  >
                    <span>Proyectos</span>
                    {renderSortIcon('projectsCreated')}
                  </button>
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('sessionsCount')}
                    className="inline-flex items-center gap-1 hover:text-slate-950 cursor-pointer ml-auto"
                  >
                    <span>Sesiones / Eventos</span>
                    {renderSortIcon('sessionsCount')}
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('lastActiveAt')}
                    className="inline-flex items-center gap-1 hover:text-slate-950 cursor-pointer"
                  >
                    <span>Última Actividad</span>
                    {renderSortIcon('lastActiveAt')}
                  </button>
                </th>
                <th className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('totalRevenue')}
                    className="inline-flex items-center gap-1 hover:text-slate-950 cursor-pointer ml-auto"
                  >
                    <span>Ingresos</span>
                    {renderSortIcon('totalRevenue')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center text-slate-500">
                    {analytics.enrichedUsers.length === 0
                      ? 'Aún no hay usuarios registrados para analizar. Comparte el estudio y aparecerán aquí en tiempo real.'
                      : 'Ningún usuario coincide con los filtros de suscripción y tasa de uso seleccionados.'}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const { user } = row;
                  const barColor =
                    row.usageTier === 'high'
                      ? 'bg-emerald-600'
                      : row.usageTier === 'medium'
                        ? 'bg-amber-500'
                        : row.usageTier === 'low'
                          ? 'bg-slate-400'
                          : 'bg-rose-300';

                  return (
                    <tr
                      key={user.uid}
                      className="hover:bg-amber-50/35 transition-colors align-middle"
                    >
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-950 truncate max-w-[200px]">
                          {user.displayName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                          {user.email}
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {row.subscriptionCategory === 'active_paid' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            <Crown className="w-3 h-3" />
                            <span>{PLAN_LABELS[user.planTier]}</span>
                          </span>
                        )}
                        {row.subscriptionCategory === 'free_quota_reached' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px]">
                            <Lock className="w-3 h-3" />
                            <span>Gratis · Cuota agotada</span>
                          </span>
                        )}
                        {row.subscriptionCategory === 'free_within_quota' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px]">
                            <Sparkles className="w-3 h-3" />
                            <span>Gratis · En cuota</span>
                          </span>
                        )}
                        {row.subscriptionCategory === 'inactive_or_suspended' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[11px]">
                            <span>{row.subscriptionLabel}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono font-extrabold text-slate-900">
                            {row.usageRate}%
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-500">
                            {row.usageTierLabel}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${Math.max(row.usageRate, row.usageRate > 0 ? 6 : 0)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                        <div className="font-extrabold text-slate-950">{user.projectsCreated}</div>
                        {row.subscriptionCategory !== 'active_paid' && (
                          <div className="text-[10px] text-slate-500">
                            cuota {user.projectsCreated}/{safeFreeLimit}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-slate-700">
                        <div>{user.sessionsCount} ses.</div>
                        <div className="text-[10px] text-slate-500">
                          {row.eventsInWindow} evt ({windowDays}d)
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {formatRelativeDate(user.lastActiveAt)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {user.lastModuleUsed}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-extrabold">
                        <span
                          className={
                            row.totalRevenueUsd > 0 ? 'text-emerald-700' : 'text-slate-400'
                          }
                        >
                          ${row.totalRevenueUsd.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredRows.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 pt-1 text-xs">
            <span className="text-slate-500">
              Página <strong className="text-slate-900">{safePage}</strong> de{' '}
              <strong className="text-slate-900">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold disabled:opacity-40 cursor-pointer"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold disabled:opacity-40 cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          SECTION 3: PLAN TIER BREAKDOWN IN SELECTED TIMEFRAME
         ===================================================================== */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-extrabold text-slate-950">
              Distribución por Plan (Últimos {windowDays} días)
            </h4>
            <p className="text-xs text-slate-500">
              Identifica qué plan está convirtiendo más clientes de gratuito a pago en la ventana activa.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            Total {windowDays}d: {analytics.totalInWindow}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {(['free', 'limited_trial', 'starter', 'pro', 'vip'] as PlanTier[]).map((tier) => {
            const count = analytics.tierBreakdown[tier];
            const pct =
              analytics.totalInWindow > 0 ? Math.round((count / analytics.totalInWindow) * 100) : 0;
            const isPaid = tier !== 'free';
            return (
              <div
                key={tier}
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isPaid
                    ? 'bg-emerald-50/40 border-emerald-200/80'
                    : 'bg-amber-50/50 border-amber-200/80'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-700 truncate">
                  {PLAN_LABELS[tier]}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black font-mono text-slate-950">{count}</span>
                  <span className="text-[11px] font-mono font-bold text-slate-500">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white overflow-hidden border border-slate-200/70">
                  <div
                    className={`h-full rounded-full ${isPaid ? 'bg-emerald-600' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
