// src/pages/Informes/index.tsx
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Package, DollarSign,
  Trash2, Activity, Calendar as CalendarIcon, Download, Share2, ArrowLeft, Info, RotateCw,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Calendar } from "../../components/ui/calendar";
import { Skeleton } from "../../components/ui/skeleton";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { format, subDays, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { useInformes } from "./useInformes";
import { useBodega } from "../../hooks/useBodega";
import { formatMoney } from "../../lib/format";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";

const COLORES = ["#10B981", "#6366F1", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#F97316", "#8B5CF6"];

type PeriodType = "week" | "month" | "custom";

export default function InformesPage() {
  const navigate = useNavigate();
  const { bodegas: allBodegas } = useBodega();
  const [selectedBodegas, setSelectedBodegas] = useState<string[]>(["all"]);

  const {
    productos, categorias, registros, compras, bodegas,
    loading, period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd,
    dateFrom, dateTo, kpis, financialChartData, categoryDistribution,
    topMerma, mermaEvolution, mermaPorCategoria, topConsumidos, lowRotation,
    insights, loadData,
  } = useInformes(selectedBodegas);

  const handleBodegaChange = (bodegaId: string, checked: boolean) => {
    if (bodegaId === "all") {
      setSelectedBodegas(checked ? ["all"] : []);
      return;
    }
    setSelectedBodegas(prev => {
      const withoutAll = prev.filter(id => id !== "all");
      if (checked) {
        return [...withoutAll, bodegaId];
      } else {
        return withoutAll.filter(id => id !== bodegaId);
      }
    });
  };

  const KpiCard = ({ title, value, variation, invertColor, icon: Icon, tooltip }: {
    title: string; value: string; variation?: number; invertColor?: boolean;
    icon: React.ElementType; tooltip?: string;
  }) => {
    const isPositive = variation !== undefined && variation >= 0;
    const colorClass = variation === undefined ? ""
      : invertColor
        ? (isPositive ? "text-destructive" : "text-emerald-500")
        : (isPositive ? "text-emerald-500" : "text-destructive");

    return (
      <Card className="relative overflow-hidden shadow-sm border-border/60 hover:shadow-md transition-shadow duration-300 rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
              {tooltip && (
                <UITooltip>
                  <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs max-w-[200px]">{tooltip}</p></TooltipContent>
                </UITooltip>
              )}
            </div>
            <Icon className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {variation !== undefined && (
            <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium", colorClass)}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{isPositive ? "+" : ""}{variation.toFixed(1)}% vs anterior</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const SectionTitle = ({ children, icon: Icon }: { children: React.ReactNode; icon: React.ElementType }) => (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-lg font-semibold">{children}</h2>
    </div>
  );

  const buildCsv = async () => {
    const fromStr = format(dateFrom, "yyyy-MM-dd");
    const toStr = format(dateTo, "yyyy-MM-dd");
    try {
      const [regsRes, stockRes] = await Promise.all([
        fetch(`/api/inventory/history/?fecha_desde=${fromStr}&fecha_hasta=${toStr}`).then(r => r.json()),
        fetch(`/api/inventory/stock/status`).then(r => r.json()),
      ]);
      const lines: string[] = [];
      lines.push("Informe de Inventario");
      lines.push(`Periodo: ${format(dateFrom, "dd/MM/yyyy")} a ${format(dateTo, "dd/MM/yyyy")}`);
      lines.push("");
      lines.push("STOCK ACTUAL");
      lines.push("Producto,Categoria,Unidad,Stock Minimo,Cantidad Actual");
      productos.forEach(p => {
        const stock = stockRes.find((s: any) => s.producto_id === p.id);
        const cat = categorias.find(c => c.id === p.categoria_id);
        lines.push(`"${p.nombre}","${cat?.nombre ?? ""}","${p.unidad}",${p.stock_minimo ?? 0},${stock?.stock_actual ?? 0}`);
      });
      lines.push("");
      lines.push("MOVIMIENTOS DEL PERIODO");
      lines.push("Fecha,Producto,Tipo,Cantidad,Motivo Merma,Descripcion");
      (regsRes || []).forEach((r: any) => {
        const prod = productos.find(p => p.id === r.producto_id);
        lines.push(`${r.fecha_recuento},"${prod?.nombre ?? "?"}",${r.tipo_movimiento},${r.cantidad},"${r.motivo_merma ?? ""}","${r.descripcion_merma ?? ""}"`);
      });
      return { csv: lines.join("\n"), fileName: `Analiticas ${format(dateFrom, "dd-MM-yyyy")} a ${format(dateTo, "dd-MM-yyyy")}.csv` };
    } catch (e) {
      toast.error("Error al generar CSV");
      return { csv: "", fileName: "" };
    }
  };

  const downloadCsv = async () => {
    const { csv, fileName } = await buildCsv();
    if (!csv) return;
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
    toast.success("Informe descargado");
  };

  const shareReport = async () => {
    const { csv, fileName } = await buildCsv();
    if (!csv) return;
    const file = new File(["\ufeff" + csv], fileName, { type: "text/csv" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ title: "Analiticas de Inventario", files: [file] }); toast.success("Compartido"); } catch {}
    } else { downloadCsv(); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-32 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter">Resumen General</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Analíticas e informes del inventario
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="outline" size="sm" onClick={loadData} className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <RotateCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/panel-ejecutivo">Panel Ejecutivo</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/panel-ejecutivo">Panel Ejecutivo</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/control-perdidas">Control de Pérdidas</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/eficiencia-operacional">
              <TrendingUp className="h-4 w-4 mr-2" />
              Eficiencia Operacional
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/vision-financiera">Visión Financiera</Link>
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 px-2">
        <div className="flex flex-col gap-1.5 flex-1">
          <span className="text-xs font-medium text-muted-foreground">Bodegas</span>
          <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bodega-all" 
                checked={selectedBodegas.includes("all")}
                onCheckedChange={(checked) => handleBodegaChange("all", checked as boolean)}
              />
              <Label htmlFor="bodega-all" className="text-sm">Todas</Label>
            </div>
            {bodegas.map(b => (
              <div key={b.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`bodega-${b.id}`}
                  checked={selectedBodegas.includes(b.id) || selectedBodegas.includes("all")}
                  onCheckedChange={(checked) => handleBodegaChange(b.id, checked as boolean)}
                  disabled={selectedBodegas.includes("all") && b.id !== "all"}
                />
                <Label htmlFor={`bodega-${b.id}`} className="text-sm">{b.nombre}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Periodo</span>
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {period === "custom" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Fechas</span>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {format(customStart, "dd/MM/yy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customStart} onSelect={d => d && setCustomStart(d)} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">a</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {format(customEnd, "dd/MM/yy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customEnd} onSelect={d => d && setCustomEnd(d)} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      {/* BLOCK 1: KPIs */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Valor inventario" value={formatMoney(kpis.inventoryValue)} icon={DollarSign} tooltip="Suma del stock actual por costo unitario" />
          <KpiCard title="Merma del periodo" value={formatMoney(kpis.mermaValue)} variation={kpis.mermaVariation} invertColor icon={Trash2} tooltip="Valor total de productos perdidos" />
          <KpiCard title="% Merma / Inventario" value={`${kpis.mermaPct.toFixed(1)}%`} icon={AlertTriangle} tooltip="Porcentaje de costo de merma sobre valor de inventario" />
          <KpiCard title="Stock critico" value={`${kpis.criticalCount} productos`} icon={Package} tooltip="Productos con stock bajo minimo" />
        </div>
      </section>

      {/* BLOCK 2: Financial Vision */}
      <section>
        <SectionTitle icon={DollarSign}>Vision Financiera</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <KpiCard title="Compras del periodo" value={formatMoney(kpis.comprasValue)} variation={kpis.comprasVariation} icon={TrendingUp} />
          <KpiCard title="Consumo valorizado" value={formatMoney(kpis.consumoValue)} icon={Activity} />
          <KpiCard title="Valor en stock" value={formatMoney(kpis.inventoryValue)} icon={Package} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Compras vs Consumo vs Merma</CardTitle></CardHeader>
            <CardContent>
              {financialChartData.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={financialChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => formatMoney(Number(v))} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                    <Bar dataKey="Compras" fill="#10B981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Consumo" fill="#6366F1" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Merma" fill="#EF4444" radius={[2, 2, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Inventario por categoria</CardTitle></CardHeader>
            <CardContent>
              {categoryDistribution.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {categoryDistribution.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* BLOCK 3: Loss Control */}
      <section>
        <SectionTitle icon={Trash2}>Control de Perdidas</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <KpiCard title="Total de merma" value={formatMoney(kpis.mermaValue)} variation={kpis.mermaVariation} invertColor icon={Trash2} tooltip="Valor total perdido en el periodo" />
          <KpiCard title="% Merma / Inventario" value={`${kpis.mermaPct.toFixed(1)}%`} icon={AlertTriangle} tooltip="Costo merma / Costo inventario actual" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Top 5 productos con mayor merma</CardTitle></CardHeader>
            <CardContent>
              {topMerma.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Sin merma</p> : (
                <div className="space-y-3">
                  {topMerma.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                        <span className="text-sm truncate">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-destructive whitespace-nowrap">{formatMoney(item.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Evolucion de merma</CardTitle></CardHeader>
            <CardContent>
              {mermaEvolution.every(d => d.Merma === 0) ? <p className="text-sm text-muted-foreground py-4 text-center">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={mermaEvolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => formatMoney(Number(v))} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                    <Area type="monotone" dataKey="Merma" fill="hsl(0, 72%, 51%)" fillOpacity={0.15} stroke="hsl(0, 72%, 51%)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          {mermaPorCategoria.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Merma por categoria</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={mermaPorCategoria} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={(v: any) => formatMoney(Number(v))} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                    <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Merma" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* BLOCK 4: Efficiency */}
      <section>
        <SectionTitle icon={Activity}>Operacion y Eficiencia</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <KpiCard title="Rotacion inventario" value={kpis.rotation} icon={RotateCw} tooltip="Consumo / Valor de inventario" />
          <KpiCard title="Cobertura (dias)" value={kpis.coverageDays === 999 ? "+999" : `${kpis.coverageDays}`} icon={CalendarIcon} tooltip="Dias que cubre tu inventario" />
          <KpiCard title="Sin movimiento" value={`${kpis.noMovementCount} productos`} icon={Package} tooltip="Productos con stock sin movimiento" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Top 5 mas consumidos</CardTitle></CardHeader>
            <CardContent>
              {topConsumidos.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Sin consumo</p> : (
                <div className="space-y-3">
                  {topConsumidos.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                        <span className="text-sm truncate">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">{item.value} uds</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Entradas vs Salidas (CLP)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[{ name: "Periodo", Entradas: kpis.totalEntradas, Salidas: kpis.totalSalidas }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatMoney(Number(v))} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                  <Bar dataKey="Entradas" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Salidas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {lowRotation.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Productos con baja rotacion</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-muted-foreground">Producto</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Stock</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Consumido</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Rotacion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowRotation.map((p, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2">{p.name}</td>
                          <td className="py-2 text-right">{p.stock}</td>
                          <td className="py-2 text-right">{p.consumed}</td>
                          <td className="py-2 text-right text-amber-500 font-medium">{p.rotation.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* INSIGHTS */}
      {insights.length > 0 && (
        <section>
          <SectionTitle icon={Lightbulb}>Insights Automaticos</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, i) => {
              const baseClass = "rounded-xl border p-4 flex items-start gap-3 shadow-sm transition-all hover:shadow-md";
              const bgClass = insight.type === "success"
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-900/10"
                : insight.type === "warning"
                  ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/10"
                  : "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10";
              const textClass = insight.type === "success"
                ? "text-emerald-700 dark:text-emerald-400"
                : insight.type === "warning"
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-red-700 dark:text-red-400";
              const iconBgClass = insight.type === "success"
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : insight.type === "warning"
                  ? "bg-amber-100 dark:bg-amber-900/30"
                  : "bg-red-100 dark:bg-red-900/30";
                  
              return (
                <div key={i} className={cn(baseClass, bgClass)}>
                  <div className={cn("p-2 rounded-lg flex-shrink-0", iconBgClass)}>
                    <Lightbulb className={cn("h-4 w-4", textClass)} />
                  </div>
                  <div className="flex-1 mt-0.5">
                    <p className={cn("text-sm font-medium", textClass)}>{insight.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Export */}
      <section className="rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm">Exportar datos</h3>
            <p className="text-xs text-muted-foreground">Periodo: {format(dateFrom, "dd/MM/yyyy")} - {format(dateTo, "dd/MM/yyyy")}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadCsv} size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Descargar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={shareReport} className="gap-1.5">
              <Share2 className="h-3.5 w-3.5" /> Compartir
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
