import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, Users, Crown, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import {
  StudioUserAccount,
  StudioOrderRecord,
  PlanTier,
} from '../services/firebaseStudioService';

interface ConversionAnalyticsSectionProps {
  customerUsers: StudioUserAccount[];
  orders: StudioOrderRecord[];
  isLoadingData?: boolean;
}

type ChartMode = 'daily' | 'cumulative';

interface DailyConversionPoint {
  isoDate: string;
  dateLabel: string;
  fullDateLabel: string;
  usuariosGratuitos: number;
  suscriptoresActivos: number;
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

export const ConversionAnalyticsSection: React.FC<ConversionAnalyticsSectionProps> = ({
  customerUsers,
  orders,
  isLoadingData = false,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('daily');

  const analytics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startWindow = new Date(today);
    startWindow.setDate(today.getDate() - 29);

    // Map each user's earliest paid order timestamp (if any) for accurate conversion day attribution
    const firstPaidOrderDateByUser = new Map<string, Date>();
    let paidRevenue30d = 0;
    let paidOrders30d = 0;

    for (const order of orders) {
      if (order.status !== 'paid') continue;
      const orderDate = order.updatedAt || order.createdAt;
      if (orderDate) {
        if (orderDate >= startWindow) {
          paidRevenue30d += Number(order.amountUsd) || 0;
          paidOrders30d += 1;
        }
        const existing = firstPaidOrderDateByUser.get(order.userId);
        if (!existing || orderDate < existing) {
          firstPaidOrderDateByUser.set(order.userId, orderDate);
        }
      }
    }

    // Build 30-day rolling buckets
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

    for (let i = 0; i < 30; i++) {
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
    let freeIn30d = 0;
    let paidIn30d = 0;

    const tierBreakdown30d: Record<PlanTier, number> = {
      free: 0,
      limited_trial: 0,
      starter: 0,
      pro: 0,
      vip: 0,
    };

    for (const user of customerUsers) {
      const isPaidSubscriber =
        user.planTier !== 'free' && user.subscriptionStatus === 'active';
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
          paidIn30d += 1;
          tierBreakdown30d[user.planTier] += 1;
        } else {
          bucket.freeCount += 1;
          freeIn30d += 1;
          tierBreakdown30d.free += 1;
        }
      }
    }

    const dailySeries: DailyConversionPoint[] = orderedKeys.map((key) => {
      const b = buckets.get(key)!;
      return {
        isoDate: b.isoDate,
        dateLabel: b.dateLabel,
        fullDateLabel: b.fullDateLabel,
        usuariosGratuitos: b.freeCount,
        suscriptoresActivos: b.paidCount,
      };
    });

    let runningFree = baselineFreeBeforeWindow;
    let runningPaid = baselinePaidBeforeWindow;
    const cumulativeSeries: DailyConversionPoint[] = orderedKeys.map((key) => {
      const b = buckets.get(key)!;
      runningFree += b.freeCount;
      runningPaid += b.paidCount;
      return {
        isoDate: b.isoDate,
        dateLabel: b.dateLabel,
        fullDateLabel: b.fullDateLabel,
        usuariosGratuitos: runningFree,
        suscriptoresActivos: runningPaid,
      };
    });

    const total30d = freeIn30d + paidIn30d;
    const conversionRate30d = total30d > 0 ? (paidIn30d / total30d) * 100 : 0;

    return {
      dailySeries,
      cumulativeSeries,
      freeIn30d,
      paidIn30d,
      total30d,
      totalAllFree: runningFree,
      totalAllPaid: runningPaid,
      conversionRate30d,
      paidRevenue30d,
      paidOrders30d,
      tierBreakdown30d,
    };
  }, [customerUsers, orders]);

  const activeSeries =
    chartMode === 'daily' ? analytics.dailySeries : analytics.cumulativeSeries;

  return (
    <div className="space-y-6">
      {/* Section Header + Mode Switcher */}
      <div className="rounded-2xl bg-white border border-amber-200/90 p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>Ventana móvil · Últimos 30 días en tiempo real</span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-slate-950 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-700" />
              <span>Analíticas de Conversión: Gratuitos vs. Suscriptores Activos</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl">
              Comparativa en vivo desde Firestore entre usuarios registrados en plan gratuito y suscriptores pagos activos durante los últimos 30 días.
            </p>
          </div>

          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setChartMode('daily')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                chartMode === 'daily'
                  ? 'bg-slate-950 text-amber-300 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Diario (30 días)
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
              Acumulado Total
            </button>
          </div>
        </div>

        {/* 4 Focused 30-Day Conversion Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span>Gratuitos (30d)</span>
              <Users className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-950">
              {chartMode === 'daily' ? analytics.freeIn30d : analytics.totalAllFree}
            </div>
            <div className="text-[11px] text-amber-900/75">
              {chartMode === 'daily' ? 'Nuevos últimos 30 días' : 'Base gratuita acumulada'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>Suscriptores Activos</span>
              <Crown className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-800">
              {chartMode === 'daily' ? analytics.paidIn30d : analytics.totalAllPaid}
            </div>
            <div className="text-[11px] text-emerald-800/80">
              {chartMode === 'daily' ? 'Activados últimos 30 días' : 'Total activos acumulados'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Conversión (30d)</span>
              <TrendingUp className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-950">
              {analytics.conversionRate30d.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500">
              {analytics.paidIn30d} de {analytics.total30d} usuarios (30d)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 text-white border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span>Ingresos (30d)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white">
              ${analytics.paidRevenue30d.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400">
              {analytics.paidOrders30d} pagos confirmados en 30d
            </div>
          </div>
        </div>

        {/* Recharts BarChart Container */}
        <div className="rounded-2xl bg-slate-50/70 border border-slate-200 p-4 sm:p-5">
          {isLoadingData ? (
            <div className="h-[320px] flex items-center justify-center text-xs text-slate-500 font-semibold">
              Cargando métricas de conversión en vivo desde Firestore...
            </div>
          ) : (
            <div className="space-y-3">
              {customerUsers.length === 0 && (
                <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium">
                  Aún no hay clientes registrados en los últimos 30 días. Comparte tu enlace público y el gráfico de barras comparará automáticamente usuarios gratuitos frente a suscriptores activos en tiempo real.
                </div>
              )}

              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeSeries}
                    margin={{ top: 12, right: 12, left: -12, bottom: 4 }}
                    barGap={3}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      interval={3}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#475569' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(245, 158, 11, 0.08)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const point = payload[0]?.payload as DailyConversionPoint | undefined;
                        if (!point) return null;
                        const freeVal = point.usuariosGratuitos;
                        const paidVal = point.suscriptoresActivos;
                        const totalVal = freeVal + paidVal;
                        const rate = totalVal > 0 ? ((paidVal / totalVal) * 100).toFixed(1) : '0.0';
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
                              <span className="font-mono font-extrabold text-white">{freeVal}</span>
                            </div>
                            <div className="flex items-center justify-between gap-5">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                                Suscriptores Activos
                              </span>
                              <span className="font-mono font-extrabold text-emerald-300">
                                {paidVal}
                              </span>
                            </div>
                            <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                              <span>Tasa de conversión</span>
                              <span className="font-mono font-bold text-amber-300">{rate}%</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="usuariosGratuitos"
                      name="Usuarios Gratuitos"
                      fill="#f59e0b"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={24}
                    />
                    <Bar
                      dataKey="suscriptoresActivos"
                      name="Suscriptores Activos"
                      fill="#059669"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan Tier Breakdown over the Last 30 Days */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-extrabold text-slate-950">
              Distribución por Plan (Últimos 30 días)
            </h4>
            <p className="text-xs text-slate-500">
              Identifica qué plan está convirtiendo más clientes de gratuito a pago.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            Total 30d: {analytics.total30d}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {(['free', 'limited_trial', 'starter', 'pro', 'vip'] as PlanTier[]).map((tier) => {
            const count = analytics.tierBreakdown30d[tier];
            const pct =
              analytics.total30d > 0 ? Math.round((count / analytics.total30d) * 100) : 0;
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
