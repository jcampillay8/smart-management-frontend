// src/pages/GestionarMerma/MermaStats.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatMoney } from "../../lib/format";
import { format } from "date-fns";
import { DollarSign, TrendingUp, ShieldAlert, Lightbulb } from "lucide-react";
import { cn } from "../../lib/utils";

interface MermaStatsProps {
  stats7d: { total: number; prevTotal: number };
  stats30d: { total: number; prevTotal: number };
  chartData: { fecha: string; total: number; label: string }[];
  topProducts: { id: string; nombre: string; valor: number; cantidad: number }[];
  tips: string[];
  getMermaLevel: (pct: number | null) => { color: string; bg: string; msg: string };
}

const TIME_RANGES = [
  { value: "1w", label: "1 semana" },
  { value: "1m", label: "1 mes" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 año" },
];

export function MermaStats({ stats7d, stats30d, chartData, topProducts, tips, getMermaLevel }: MermaStatsProps) {
  const mermaPct7d = null; // Would need conteo stats to calculate
  const mermaPct30d = null;
  const level7d = getMermaLevel(mermaPct7d);
  const isCritical = stats7d.total > 100000; // Placeholder threshold

  return (
    <div className="space-y-4">
      {isCritical && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm font-semibold text-destructive">Nivel de merma crítico detectado</p>
        </div>
      )}

      {/* Health Dashboard */}
      <section className={cn("rounded-lg border p-4", level7d.bg)}>
        <div className="mb-3 flex items-center gap-2">
          <DollarSign className={cn("h-5 w-5", level7d.color)} />
          <h2 className="font-semibold">Salud del inventario</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Merma (7 días)</p>
            <p className={cn("text-xl font-bold", level7d.color)}>{formatMoney(stats7d.total)}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Merma %</p>
            <p className={cn("text-xl font-bold", level7d.color)}>
              {mermaPct7d !== null ? `${mermaPct7d.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Merma (30 días)</p>
            <p className="text-xl font-bold">{formatMoney(stats30d.total)}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Merma % (30d)</p>
            <p className="text-xl font-bold">
              {mermaPct30d !== null ? `${mermaPct30d.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>

        <p className={cn("text-sm font-medium", level7d.color)}>{level7d.msg}</p>

        {stats7d.prevTotal > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {stats7d.total > stats7d.prevTotal
              ? `La merma aumentó ${(((stats7d.total - stats7d.prevTotal) / stats7d.prevTotal) * 100).toFixed(0)}% respecto a la semana pasada`
              : stats7d.total < stats7d.prevTotal
              ? `La merma disminuyó ${Math.abs(((stats7d.total - stats7d.prevTotal) / stats7d.prevTotal) * 100).toFixed(0)}% respecto a la semana pasada`
              : "La merma se mantuvo igual respecto a la semana pasada"}
          </p>
        )}

        {topProducts.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Top productos con mayor pérdida (período)</p>
            <div className="space-y-1">
              {topProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate mr-2">{p.nombre}</span>
                  <span className="font-bold text-destructive whitespace-nowrap">{formatMoney(p.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Dashboard Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-semibold">Top productos (período)</span>
          </div>
          <div className="space-y-1">
            {topProducts.length === 0 && <p className="text-sm text-muted-foreground">Sin datos</p>}
            {topProducts.slice(0, 5).map(p => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="truncate mr-2">{p.nombre}</span>
                <span className="font-bold whitespace-nowrap">{p.cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Tips */}
        <div className="rounded-lg border p-4 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
            <Lightbulb className="h-5 w-5" />
            <span className="text-sm font-semibold">Consejos para reducir merma</span>
          </div>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="text-sm text-amber-900 dark:text-amber-300 flex gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Time-series Chart */}
      <div className="rounded-lg border p-4">
        <h2 className="font-semibold mb-4">Merma en el tiempo</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Sin datos para el período seleccionado</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
              <Tooltip formatter={(v: number) => formatMoney(v)} />
              <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}