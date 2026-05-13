// src/pages/Gestion/ProductoDashboard.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "../../components/ui/sheet";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingDown, Package2, Activity, RotateCw,
  ShoppingCart, Flame, Layers, Tag, Loader2, X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { formatMoney } from "../../lib/format";
import { Producto } from "./types";
import api from "../../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────
interface SeriePoint { fecha: string; cantidad: number; valor: number; }
interface DashboardData {
  producto: {
    id: string; nombre: string; unidad: string;
    costo_unitario: number; precio_venta: number;
    categoria_nombre: string; imagen_url?: string | null;
    marca?: string | null; proveedor?: string | null;
  };
  stock_actual: number;
  stock_promedio: number;
  rotacion_dias: number | null;
  compras:  { cantidad: number; valor: number; serie: SeriePoint[] };
  consumos: { cantidad: number; valor: number; serie: SeriePoint[] };
  mermas:   { cantidad: number; valor: number; serie: SeriePoint[] };
  periodo:  { desde: string; hasta: string; dias: number };
}

// ── Range selector ────────────────────────────────────────────────────────────
const RANGES = [
  { key: "1D",   label: "1D" },
  { key: "3D",   label: "3D" },
  { key: "7D",   label: "1S" },
  { key: "30D",  label: "1M" },
  { key: "365D", label: "1A" },
] as const;
type RangeKey = typeof RANGES[number]["key"];

// ── Tiny KPI Card ─────────────────────────────────────────────────────────────
function KPICard({
  icon: Icon, label, qty, money, accentColor,
}: {
  icon: any; label: string; qty: string; money: string; accentColor: string;
}) {
  return (
    <div
      className="rounded-xl border bg-card p-3 flex flex-col gap-1 relative overflow-hidden"
      style={{ borderColor: `${accentColor}30`, boxShadow: `0 0 12px ${accentColor}08` }}
    >
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none rounded-xl"
        style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent 70%)` }} />
      <div className="flex items-center justify-center gap-1.5">
        <div className="p-1 rounded-lg shrink-0" style={{ backgroundColor: `${accentColor}18`, color: accentColor }}>
          <Icon className="h-3 w-3" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground truncate">{label}</span>
      </div>
      <p className="text-base font-black tabular-nums leading-none mt-0.5 text-center" style={{ color: accentColor }}>{qty}</p>
      <p className="text-[10px] font-bold text-muted-foreground text-center truncate">{money}</p>
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unidad, mode }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card shadow-lg p-2.5 text-xs">
      <p className="font-black text-muted-foreground uppercase tracking-widest mb-1.5 text-[9px]">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-1.5 mb-0.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-foreground/70 font-bold">{p.name}:</span>
          <span className="font-black" style={{ color: p.color }}>
            {mode === "valor"
              ? formatMoney(p.value)
              : `${Number(p.value).toFixed(2)} ${unidad || ""}`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface ProductoDashboardProps {
  producto: Producto | null;
  open: boolean;
  onClose: () => void;
}

export function ProductoDashboard({ producto, open, onClose }: ProductoDashboardProps) {
  const [range, setRange]         = useState<RangeKey | "custom">("30D");
  const [customDates, setCustomDates] = useState({ desde: "", hasta: "" });
  const [data, setData]           = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [chartMode, setChartMode] = useState<"cantidad" | "valor">("cantidad");

  const fetchData = useCallback(async () => {
    if (!producto) return;
    if (range === "custom" && (!customDates.desde || !customDates.hasta)) return;
    
    setLoading(true);
    try {
      let url = `/inventory/products/${producto.id}/dashboard?range=${range}`;
      if (range === "custom") {
        url += `&desde=${customDates.desde}&hasta=${customDates.hasta}`;
      }
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching product dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [producto, range, customDates]);

  useEffect(() => {
    if (open && producto) fetchData();
    else setData(null);
  }, [open, producto, range, customDates]);

  // Combined bar chart data
  const combinedSerie = (() => {
    if (!data) return [];
    const map: Record<string, any> = {};
    const k = chartMode;
    data.compras.serie.forEach(p => { if (!map[p.fecha]) map[p.fecha] = { fecha: p.fecha }; map[p.fecha].compras = p[k]; });
    data.consumos.serie.forEach(p => { if (!map[p.fecha]) map[p.fecha] = { fecha: p.fecha }; map[p.fecha].consumos = p[k]; });
    return Object.values(map).sort((a, b) => a.fecha.localeCompare(b.fecha));
  })();

  const mermaSerie = (() => {
    if (!data) return [];
    const k = chartMode;
    return data.mermas.serie.map(p => ({ fecha: p.fecha, merma: p[k] }));
  })();

  const d = data;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side={window.innerWidth < 640 ? "bottom" : "right"}
        className={cn(
          "p-0 border-border flex flex-col bg-background overflow-hidden",
          "w-full sm:max-w-2xl",
          "max-h-[96vh] sm:max-h-none rounded-t-[2.5rem] sm:rounded-none"
        )}
      >
        <div className="h-1.5 w-12 bg-muted rounded-full mx-auto mt-3 shrink-0 sm:hidden" />
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-3 border-b border-border bg-card/50 shrink-0 relative">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-colors sm:flex hidden z-10"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <button 
            onClick={onClose}
            className="absolute left-4 top-4 p-2 rounded-full hover:bg-muted transition-colors sm:hidden z-10"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <div className="flex items-start justify-between gap-4 sm:mt-0 mt-8">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-base font-black tracking-tight truncate leading-none">
                  {producto?.nombre ?? "Producto"}
                </SheetTitle>
                {d && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-muted border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                      <Tag className="h-2.5 w-2.5" /> {d.producto.categoria_nombre}
                    </span>
                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-muted border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                      <Layers className="h-2.5 w-2.5" /> {d.producto.unidad}
                    </span>
                    {d.producto.marca && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-muted border border-border rounded-full px-2 py-0.5 text-muted-foreground">{d.producto.marca}</span>
                    )}
                    <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
                      Costo: {formatMoney(d.producto.costo_unitario)}
                    </span>
                    {d.producto.precio_venta > 0 && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5 text-blue-600 dark:text-blue-400">
                        Venta: {formatMoney(d.producto.precio_venta)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Range + Mode toggles */}
          <div className="flex flex-col gap-2 mt-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 border border-border overflow-x-auto no-scrollbar max-w-[calc(100vw-80px)]">
                {RANGES.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    className={cn(
                      "h-6 px-3 rounded-md text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                      range === r.key
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                    )}
                  >{r.label}</button>
                ))}
                <button
                  onClick={() => setRange("custom")}
                  className={cn(
                    "h-6 px-3 rounded-md text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                    range === "custom"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                  )}
                >Fechas</button>
              </div>
              <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 border border-border shrink-0">
              {(["cantidad", "valor"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setChartMode(m)}
                  className={cn(
                    "h-6 px-2.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all",
                    chartMode === m
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                  )}
                >{m === "valor" ? "$ Valor" : "Cantidad"}</button>
              ))}
            </div>
            </div>
            
            {range === "custom" && (
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="date" 
                  value={customDates.desde}
                  onChange={e => setCustomDates(prev => ({ ...prev, desde: e.target.value }))}
                  className="h-8 rounded-lg bg-muted border-border text-xs px-2 flex-1"
                />
                <span className="text-muted-foreground text-xs font-bold">a</span>
                <input 
                  type="date" 
                  value={customDates.hasta}
                  onChange={e => setCustomDates(prev => ({ ...prev, hasta: e.target.value }))}
                  className="h-8 rounded-lg bg-muted border-border text-xs px-2 flex-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Body (scrollable if needed on mobile) ────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-3 px-5 py-3 min-h-0 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          )}

          {!loading && d && (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                <KPICard
                  icon={Package2}
                  label="Stock"
                  qty={`${d.stock_actual} ${d.producto.unidad}`}
                  money={`Prom: ${d.stock_promedio} ${d.producto.unidad}`}
                  accentColor="hsl(262 80% 58%)"
                />
                <KPICard
                  icon={ShoppingCart}
                  label="Compras"
                  qty={`${d.compras.cantidad} ${d.producto.unidad}`}
                  money={formatMoney(d.compras.valor)}
                  accentColor="hsl(142 70% 45%)"
                />
                <KPICard
                  icon={TrendingDown}
                  label="Consumido"
                  qty={`${d.consumos.cantidad} ${d.producto.unidad}`}
                  money={formatMoney(d.consumos.valor)}
                  accentColor="hsl(213 80% 58%)"
                />
                <KPICard
                  icon={Flame}
                  label="Merma"
                  qty={`${d.mermas.cantidad} ${d.producto.unidad}`}
                  money={formatMoney(d.mermas.valor)}
                  accentColor="hsl(0 72% 60%)"
                />
              </div>

              {/* Rotación strip */}
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shrink-0">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <RotateCw className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">Rotación estimada</p>
                  <p className="text-sm font-black text-amber-500 leading-tight">
                    {d.rotacion_dias !== null ? `${d.rotacion_dias} días de cobertura` : "Sin datos de consumo en el período"}
                  </p>
                </div>
                {d.rotacion_dias !== null && (
                  <span className="text-[8px] font-bold text-muted-foreground text-right leading-snug max-w-[110px] shrink-0">
                    Al ritmo actual de {(d.consumos.cantidad / d.periodo.dias).toFixed(2)} {d.producto.unidad}/día
                  </span>
                )}
              </div>

              {/* Bar chart: Compras vs Consumos */}
              <div className="h-[250px] sm:h-auto sm:flex-1 flex flex-col rounded-xl border border-border bg-card px-3 pt-2.5 pb-1">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1 shrink-0 text-center">
                  Compras vs Consumos
                </p>
                {combinedSerie.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40">
                    <Package2 className="h-6 w-6 mb-1" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Sin movimientos</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={combinedSerie} barCategoryGap="30%" margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="fecha"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8, fontWeight: 700 }}
                          tickFormatter={v => v.slice(5)}
                          axisLine={false} tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8, fontWeight: 700 }}
                          axisLine={false} tickLine={false} width={36}
                          tickFormatter={v => chartMode === "valor" ? `$${(v/1000).toFixed(0)}k` : String(Number(v).toFixed(1))}
                        />
                        <Tooltip content={<ChartTooltip unidad={d.producto.unidad} mode={chartMode} />} />
                        <Bar dataKey="compras"  name="Compras"  fill="hsl(142 70% 45%)" radius={[3,3,0,0]} maxBarSize={28} />
                        <Bar dataKey="consumos" name="Consumos" fill="hsl(213 80% 58%)" radius={[3,3,0,0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Area chart: Merma */}
              <div className="h-[220px] sm:h-auto sm:flex-1 flex flex-col rounded-xl border border-border bg-card px-3 pt-2.5 pb-1">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1 shrink-0 text-center">
                  Merma
                </p>
                {mermaSerie.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40">
                    <Flame className="h-6 w-6 mb-1" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Sin mermas</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mermaSerie} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="mermaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="hsl(0 72% 60%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(0 72% 60%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="fecha"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8, fontWeight: 700 }}
                          tickFormatter={v => v.slice(5)}
                          axisLine={false} tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8, fontWeight: 700 }}
                          axisLine={false} tickLine={false} width={36}
                          tickFormatter={v => chartMode === "valor" ? `$${(v/1000).toFixed(0)}k` : String(Number(v).toFixed(1))}
                        />
                        <Tooltip content={<ChartTooltip unidad={d.producto.unidad} mode={chartMode} />} />
                        <Area type="monotone" dataKey="merma" name="Merma"
                          stroke="hsl(0 72% 60%)" strokeWidth={2}
                          fill="url(#mermaGrad)"
                          dot={{ fill: "hsl(0 72% 60%)", strokeWidth: 0, r: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
