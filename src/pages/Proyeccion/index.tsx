import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../lib/api";
import { useBodega } from "../../hooks/useBodega";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Dot, ReferenceLine, Legend } from "recharts";
import { format, addDays, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, AlertTriangle, Calendar, Search, X, Package, CalendarIcon, Boxes, LayoutGrid, Rows3, ArrowLeft, ArrowUpDown, Filter, ChevronRight, Info, ShoppingCart } from "lucide-react";
import BodegaBadge from "../../components/BodegaBadge";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { EnhancedCalendar } from "../../components/ui/enhanced-calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { cn } from "../../lib/utils";
import { formatMoney } from "../../lib/format";
import { buildInventorySnapshot, InventoryLot, InventoryMovementRecord } from "../../lib/inventory";
import { useExpiryAlertDays } from "../../hooks/useExpiryAlertDays";
import { AreaSelector } from "../../components/AreaSelector";
import BodegaSelector from "../../components/BodegaSelector";
import { SimpleCategoriaSeccion } from "../../components/SimpleCategoriaSeccion";

interface Producto {
  id: string;
  nombre: string;
  unidad: string;
  stock_minimo: number;
  categoria_id: string;
  costo_unitario: number;
  bodegas_config?: any[];
}

interface Categoria { id: string; nombre: string; color?: string; icono?: string }
interface EventoItem { producto_id: string; cantidad: number; bodega_id?: string }
interface Evento { id: string; nombre: string; fecha: string; items: EventoItem[]; ejecutado?: boolean; cancelado?: boolean }

interface ExpiringLot {
  fecha_vencimiento: string;
  cantidad: number;
}

interface DayPoint {
  date: string;
  label: string;
  qty: number;
  status: "normal" | "warning" | "critical";
  statusLabel: string;
  events?: { name: string; qty: number }[];
  expiring?: ExpiringLot[];
}

type SortMode = "urgency" | "az" | "za";
type ViewStyle = "compact" | "detailed";

const STORAGE_KEYS = {
  DAYS: "proyeccion_days",
  CUSTOM_MODE: "proyeccion_custom_mode",
  CUSTOM_FROM: "proyeccion_custom_from",
  CUSTOM_TO: "proyeccion_custom_to",
  SORT_MODE: "proyeccion_sort_mode",
  VIEW_STYLE: "proyeccion_view_style",
  SHOW_CATEGORIAS: "proyeccion_show_categorias",
  SELECTED_CATEGORIAS: "proyeccion_selected_categorias",
};

export default function ProyeccionPage() {
  const { selectedBodegaIds, bodegas, allBodegas } = useBodega();
  const isAll = Array.isArray(selectedBodegaIds) && selectedBodegaIds.includes("all");
  const firstBodegaId = Array.isArray(selectedBodegaIds) && selectedBodegaIds.length > 0 ? selectedBodegaIds[0] : "all";

  const expiryAlertDays = useExpiryAlertDays();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  // Persistence
  const [days, setDays] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.DAYS) || 7));
  const [customMode, setCustomMode] = useState(() => localStorage.getItem(STORAGE_KEYS.CUSTOM_MODE) === "true");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_FROM);
    return saved ? new Date(saved) : undefined;
  });
  const [customTo, setCustomTo] = useState<Date | undefined>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TO);
    return saved ? new Date(saved) : undefined;
  });
  const [sortMode, setSortMode] = useState<SortMode>(() => (localStorage.getItem(STORAGE_KEYS.SORT_MODE) as SortMode) || "urgency");
  const [viewStyle, setViewStyle] = useState<ViewStyle>(() => (localStorage.getItem(STORAGE_KEYS.VIEW_STYLE) as ViewStyle) || "compact");

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showCategorias, setShowCategorias] = useState(() => localStorage.getItem(STORAGE_KEYS.SHOW_CATEGORIAS) === "true");
  const [selectedCategorias, setSelectedCategorias] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_CATEGORIAS);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [totalByProduct, setTotalByProduct] = useState<Record<string, number>>({});
  const [lotsByProduct, setLotsByProduct] = useState<Record<string, InventoryLot[]>>({});
  const [productBodegaMap, setProductBodegaMap] = useState<Record<string, Set<string>>>({});
  const [perBodegaSnapshots, setPerBodegaSnapshots] = useState<Record<string, { totalByProduct: Record<string, number>; lotsByProduct: Record<string, InventoryLot[]> }>>({});
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [futureRecords, setFutureRecords] = useState<InventoryMovementRecord[]>([]);
  const [productoBodegas, setProductoBodegas] = useState<{ producto_id: string; bodega_id: string; stock_minimo: number }[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAYS, String(days));
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MODE, String(customMode));
    if (customFrom) localStorage.setItem(STORAGE_KEYS.CUSTOM_FROM, customFrom.toISOString());
    if (customTo) localStorage.setItem(STORAGE_KEYS.CUSTOM_TO, customTo.toISOString());
    localStorage.setItem(STORAGE_KEYS.SORT_MODE, sortMode);
    localStorage.setItem(STORAGE_KEYS.VIEW_STYLE, viewStyle);
    localStorage.setItem(STORAGE_KEYS.SHOW_CATEGORIAS, String(showCategorias));
    localStorage.setItem(STORAGE_KEYS.SELECTED_CATEGORIAS, JSON.stringify(Array.from(selectedCategorias)));
  }, [days, customMode, customFrom, customTo, sortMode, viewStyle, showCategorias, selectedCategorias]);

  useEffect(() => { loadData(); }, [selectedBodegaIds]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, catRes, regRes, pbRes, eventRes] = await Promise.all([
        api.get("/inventory/products"),
        api.get("/inventory/categories"),
        api.get("/inventory/history", { params: { limit: 2000 } }),
        api.get("/inventory/product-setup"),
        api.get("/operations/events")
      ]);

      const prods = prodRes.data ?? [];
      setProductos(prods);
      setCategorias(catRes.data ?? []);
      setProductoBodegas(pbRes.data ?? []);

      const records = (regRes.data ?? []) as InventoryMovementRecord[];
      const now = new Date().toISOString();
      const nowTs = new Date(now).getTime();

      const bodegaSnapshots: typeof perBodegaSnapshots = {};
      allBodegas.forEach((b: any) => {
        bodegaSnapshots[b.id] = buildInventorySnapshot(records, now, b.id);
      });
      setPerBodegaSnapshots(bodegaSnapshots);

      const pbMap: Record<string, Set<string>> = {};
      prods.forEach((p: any) => {
        if (p.bodegas_config) {
          p.bodegas_config.forEach((bc: any) => {
            if (!pbMap[p.id]) pbMap[p.id] = new Set();
            pbMap[p.id].add(bc.bodega_id);
          });
        }
      });
      setProductBodegaMap(pbMap);

      const bodegaFilter = isAll ? undefined : firstBodegaId;
      const snapshot = buildInventorySnapshot(records, now, bodegaFilter);
      setTotalByProduct(snapshot.totalByProduct);
      setLotsByProduct(snapshot.lotsByProduct);

      const futureRecs = records.filter(
        r => (r.tipo_movimiento === "consumo" || r.tipo_movimiento === "merma" || (r.tipo_movimiento === "transferencia" && r.descripcion_merma === "salida")) &&
          new Date(r.created_at).getTime() > nowTs
      );
      setFutureRecords(futureRecs);

      const mappedEventos: Evento[] = (eventRes.data ?? []).map((e: any) => ({
        id: e.id, nombre: e.nombre, fecha: e.fecha,
        ejecutado: e.ejecutado, cancelado: e.cancelado,
        items: (e.productos ?? []).map((ep: any) => ({
          producto_id: ep.producto_id, cantidad: Number(ep.cantidad), bodega_id: ep.bodega_id ?? "",
        })),
      }));
      setEventos(mappedEventos);

    } catch (error) {
      console.error("Error loading projection data:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = (p: Producto) => {
    setSelectedId(p.id);
    setSearchQuery("");
    setShowSuggestions(false);
    setShowProductDetail(true);
  };

  const product = productos.find((p) => p.id === selectedId);
  const currentQty = totalByProduct[selectedId] ?? 0;
  const lots = lotsByProduct[selectedId] ?? [];

  const statusColor = (s: string) =>
    s === "critical" ? "hsl(0 84% 60%)" : s === "warning" ? "hsl(45 93% 47%)" : "hsl(160 84% 39%)";

  const getPerBodegaMin = (prodId: string, bodegaId?: string) => {
    const bid = bodegaId || (!isAll ? firstBodegaId : undefined);
    if (bid && bid !== "all") {
      const pb = productoBodegas.find(x => x.producto_id === prodId && x.bodega_id === bid);
      if (pb) return pb.stock_minimo;
    }
    const pbs = productoBodegas.filter(x => x.producto_id === prodId);
    if (pbs.length > 0) return Math.max(...pbs.map(x => x.stock_minimo));
    return productos.find(p => p.id === prodId)?.stock_minimo ?? 0;
  };

  const buildChartData = (productId: string, numDays: number, specificBodegaId?: string): DayPoint[] => {
    const prod = productos.find(p => p.id === productId);
    if (!prod) return [];

    const today = new Date();
    const bodegaFilter = (specificBodegaId && specificBodegaId !== "all") ? specificBodegaId : (isAll ? undefined : firstBodegaId);

    const scheduledDeductions: { fecha: string; cantidad: number; eventName: string }[] = [];
    eventos.forEach(ev => {
      if (ev.cancelado || ev.ejecutado) return;
      ev.items.forEach(item => {
        if (item.producto_id !== productId) return;
        if (bodegaFilter && item.bodega_id && item.bodega_id !== bodegaFilter) return;
        scheduledDeductions.push({ fecha: ev.fecha, cantidad: Math.abs(item.cantidad), eventName: ev.nombre });
      });
    });

    futureRecords.forEach(r => {
      if (r.producto_id === productId) {
        if (bodegaFilter && r.bodega_id && r.bodega_id !== bodegaFilter) return;
        const recordDate = format(new Date(r.created_at), "yyyy-MM-dd");
        scheduledDeductions.push({ fecha: recordDate, cantidad: Math.abs(r.cantidad), eventName: "" });
      }
    });

    let productLots: { expiry: string; qty: number }[];
    if (bodegaFilter && perBodegaSnapshots[bodegaFilter]) {
      productLots = (perBodegaSnapshots[bodegaFilter].lotsByProduct[productId] ?? []).map(l => ({ expiry: l.fecha_vencimiento, qty: l.cantidad }));
    } else {
      productLots = (lotsByProduct[productId] ?? []).map(l => ({ expiry: l.fecha_vencimiento, qty: l.cantidad }));
    }
    const remainingLots = productLots.map(l => ({ ...l }));

    const getTotal = () => remainingLots.reduce((s, l) => s + Math.max(0, l.qty), 0);

    const deductFromLots = (amount: number) => {
      let rem = amount;
      const sorted = remainingLots.filter(l => l.qty > 0).sort((a, b) => {
        if (!a.expiry && !b.expiry) return 0;
        if (!a.expiry) return 1;
        if (!b.expiry) return -1;
        return a.expiry.localeCompare(b.expiry);
      });
      for (const lot of sorted) {
        if (rem <= 0) break;
        const take = Math.min(lot.qty, rem);
        lot.qty -= take;
        rem -= take;
      }
    };

    const expireLots = (dateStr: string): ExpiringLot[] => {
      const expired: ExpiringLot[] = [];
      remainingLots.forEach(l => {
        if (l.expiry && l.expiry < dateStr && l.expiry !== "" && l.qty > 0) {
          expired.push({ fecha_vencimiento: l.expiry, cantidad: l.qty });
          l.qty = 0;
        }
      });
      return expired;
    };

    const minStock = getPerBodegaMin(productId, bodegaFilter);

    const data: DayPoint[] = [];
    for (let i = 0; i <= numDays; i++) {
      const d = addDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const expiringToday = expireLots(dateStr);

      const dayEvents: { name: string; qty: number }[] = [];
      scheduledDeductions.forEach(ev => {
        if (ev.fecha === dateStr) {
          deductFromLots(ev.cantidad);
          if (ev.eventName) dayEvents.push({ name: ev.eventName, qty: ev.cantidad });
        }
      });

      const qty = Math.max(0, Math.round(getTotal() * 100) / 100);

      let status: "normal" | "warning" | "critical" = "normal";
      let statusLabel = "Normal";
      if (qty === 0) {
        const expiredAll = remainingLots.every(l => l.qty <= 0) && remainingLots.some(l => l.expiry && l.expiry < dateStr);
        status = "critical";
        statusLabel = expiredAll ? "Sin stock (vencimiento)" : "Sin stock";
      }
      else if (qty <= minStock) { status = "warning"; statusLabel = "Bajo stock"; }
      else {
        const hasExpiringSoon = remainingLots.some(l => {
          if (!l.expiry || l.qty <= 0) return false;
          const diff = differenceInDays(new Date(l.expiry + "T00:00:00"), d);
          return diff >= 0 && diff <= expiryAlertDays;
        });
        if (hasExpiringSoon) { status = "warning"; statusLabel = "Próximo a vencer"; }
      }

      data.push({
        date: dateStr,
        label: format(d, "EEE dd/MM", { locale: es }),
        qty, status, statusLabel,
        events: dayEvents.length > 0 ? dayEvents : undefined,
        expiring: expiringToday.length > 0 ? expiringToday : undefined,
      });
    }
    return data;
  };

  const effectiveDays = useMemo(() => {
    if (!customMode) return days;
    if (customFrom && customTo) return Math.max(1, differenceInDays(customTo, customFrom));
    return days;
  }, [customMode, customFrom, customTo, days]);

  const chartData = product ? buildChartData(selectedId, effectiveDays) : [];

  const baseFilteredProducts = useMemo(() => {
    return productos.filter(p => {
      if (selectedCategorias.size > 0 && !selectedCategorias.has(p.categoria_id)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!p.nombre.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [productos, selectedCategorias, searchQuery]);

  const computeCardForBodega = (productId: string, bodegaId: string | null) => {
    const chartPoints = buildChartData(productId, effectiveDays, bodegaId ?? undefined);
    const projectedQty = chartPoints.length > 0 ? chartPoints[chartPoints.length - 1].qty : 0;
    const currentQty = bodegaId
      ? (perBodegaSnapshots[bodegaId]?.totalByProduct[productId] ?? 0)
      : (totalByProduct[productId] ?? 0);
    const pLots = bodegaId
      ? (perBodegaSnapshots[bodegaId]?.lotsByProduct[productId] ?? [])
      : (lotsByProduct[productId] ?? []);
    let worstStatus: "normal" | "warning" | "critical" = "normal";
    let worstLabel = "Normal";
    let worstDay = 0;
    for (let idx = 0; idx < chartPoints.length; idx++) {
      const pt = chartPoints[idx];
      if (pt.status === "critical") { worstStatus = "critical"; worstLabel = pt.statusLabel; worstDay = idx; break; }
      if (pt.status === "warning" && worstStatus === "normal") { worstStatus = "warning"; worstLabel = pt.statusLabel; worstDay = idx; }
    }
    if (worstStatus !== "normal" && worstDay > 0) worstLabel += ` (día ${worstDay})`;
    return { qty: projectedQty, currentQty, lots: pLots, worstStatus, worstLabel };
  };

  const overviewProducts = useMemo(() => {
    let rows: any[] = [];
    const allowedBodegaIds = bodegas.map(b => b.id);

    if (isAll) {
      baseFilteredProducts.forEach((p) => {
        const bIds = Array.from(productBodegaMap[p.id] ?? []).filter(bid => allowedBodegaIds.includes(bid));
        if (bIds.length === 0) return;
        bIds.forEach(bid => {
          const card = computeCardForBodega(p.id, bid);
          rows.push({ ...p, bodegaId: bid, ...card });
        });
      });
    } else {
      baseFilteredProducts
        .filter(p => productBodegaMap[p.id]?.has(firstBodegaId))
        .forEach(p => {
          const card = computeCardForBodega(p.id, firstBodegaId);
          rows.push({ ...p, bodegaId: firstBodegaId, ...card });
        });
    }
    if (sortMode === "az") {
      rows = rows.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (sortMode === "za") {
      rows = rows.sort((a, b) => b.nombre.localeCompare(a.nombre));
    } else {
      const order = { critical: 0, warning: 1, normal: 2 } as any;
      rows = rows.sort((a, b) => order[a.worstStatus] - order[b.worstStatus]);
    }
    return rows;
  }, [baseFilteredProducts, totalByProduct, lotsByProduct, eventos, effectiveDays, isAll, firstBodegaId, bodegas, productBodegaMap, perBodegaSnapshots, sortMode]);

  const groupedOverview = useMemo(() => {
    const result = categorias
      .map(c => ({
        ...c,
        rows: overviewProducts.filter(p => p.categoria_id === c.id)
      }))
      .filter(c => c.rows.length > 0);

    if (!showCategorias) {
      return [{
        id: "unified",
        nombre: "Todos los productos",
        color: "#6366f1",
        rows: overviewProducts
      }];
    }
    return result;
  }, [categorias, overviewProducts, showCategorias]);

  const toggleCategoria = (id: string) => {
    setSelectedCategorias(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleShowCategorias = () => {
    setShowCategorias(prev => {
      const next = !prev;
      if (!next) setSelectedCategorias(new Set());
      return next;
    });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as DayPoint;
    const unit = product?.unidad ?? "";
    const costo = product?.costo_unitario ?? 0;
    return (
      <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-md p-4 shadow-2xl text-sm max-w-[240px]">
        <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{d.label}</p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground">Cantidad:</span>
            <span className="font-bold text-lg">{d.qty} <span className="text-xs font-normal opacity-70">{unit}</span></span>
          </div>
          {costo > 0 && (
            <div className="flex justify-between items-baseline border-t border-border/50 pt-1">
              <span className="text-muted-foreground">Valor Est.:</span>
              <span className="font-bold text-emerald-500">{formatMoney(d.qty * costo)}</span>
            </div>
          )}
        </div>
        {((d.expiring && d.expiring.length > 0) || (d.events && d.events.length > 0)) && (
          <div className="mt-3 space-y-2 border-t border-border/50 pt-2">
            {d.expiring?.map((exp, i) => (
              <div key={i} className="flex gap-2 text-[10px] leading-tight text-destructive font-bold">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Vence {format(new Date(exp.fecha_vencimiento + "T00:00:00"), "dd/MM")}: -{exp.cantidad} {unit}</span>
              </div>
            ))}
            {d.events?.map((ev, i) => (
              <div key={i} className="flex gap-2 text-[10px] leading-tight text-indigo-500 font-bold">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{ev.name}: -{ev.qty} {unit}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 w-fit">
          <span className="h-2 w-2 rounded-full" style={{ background: statusColor(d.status) }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: statusColor(d.status) }}>{d.statusLabel}</span>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Procesando Proyección...</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen">
      <div className="absolute -top-10 -mx-10 inset-x-0 bg-gradient-to-b from-indigo-500/10 to-background pointer-events-none h-[600px]" />

      <div className="relative space-y-6 pb-20">
        <header className="flex flex-col md:flex-row md:items-end gap-4 px-2 mb-2 relative z-[60]">
          <div className="space-y-1 shrink-0 flex flex-col items-center md:items-start">
            <div className="flex items-center justify-start gap-3">
              <TrendingUp className="h-8 w-8 text-indigo-500" />
              <h1 className="text-4xl font-black tracking-tighter">Proyección</h1>
            </div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              Simulación de Disponibilidad y Alertas
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-card/50 backdrop-blur-md p-1.5 rounded-2xl border border-border/50 shadow-xl flex items-center gap-2">
              <AreaSelector />
              <BodegaSelector />
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-3 px-2 relative z-50">
          <div className="bg-card backdrop-blur-md p-3 rounded-2xl border border-input shadow-xl flex-1 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full group" ref={searchRef}>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-indigo-500/10 group-focus-within:bg-indigo-500/20 transition-colors">
                <Search className="h-4 w-4 text-indigo-500" />
              </div>
              <Input
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                className="pl-11 h-11 bg-background rounded-xl border-input transition-all focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={customMode ? "custom" : String(days)} onValueChange={(v) => {
                if (v === "custom") setCustomMode(true);
                else { setCustomMode(false); setDays(Number(v)); }
              }}>
                <SelectTrigger className="w-full md:w-36 h-11 rounded-xl border-input bg-background font-bold text-[10px] uppercase tracking-widest">
                  <Calendar className="h-3.5 w-3.5 mr-2 text-indigo-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 14, 30].map((d) => (
                    <SelectItem key={d} value={String(d)} className="text-xs">{d} días</SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-xs">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 px-4 gap-2 rounded-xl border-input font-bold text-[10px] uppercase tracking-widest">
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Ordenar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setSortMode("urgency")}>Urgencia</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortMode("az")}>Nombre A-Z</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortMode("za")}>Nombre Z-A</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant={showCategorias ? "default" : "outline"}
                className={cn(
                  "h-11 px-4 gap-2 rounded-xl border-input font-bold text-[10px] uppercase tracking-widest transition-all",
                  showCategorias ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border-indigo-400" : "hover:bg-indigo-500/5 hover:text-indigo-500 hover:border-indigo-500/30"
                )}
                onClick={toggleShowCategorias}
              >
                <Filter className={cn("h-4 w-4", showCategorias ? "text-white" : "text-indigo-500")} />
                <span className="hidden sm:inline">Categorías</span>
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {customMode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-2">
              <div className="flex gap-2 p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest">{customFrom ? format(customFrom, "dd/MM/yyyy") : "Desde"}</Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><EnhancedCalendar mode="single" selected={customFrom} onSelect={setCustomFrom} /></PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest">{customTo ? format(customTo, "dd/MM/yyyy") : "Hasta"}</Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><EnhancedCalendar mode="single" selected={customTo} onSelect={setCustomTo} /></PopoverContent>
                </Popover>
              </div>
            </motion.div>
          )}
          {showCategorias && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-2"
            >
              <SimpleCategoriaSeccion
                categorias={categorias}
                selectedIds={selectedCategorias}
                onToggle={toggleCategoria}
                onClear={() => setSelectedCategorias(new Set())}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <main className="px-2">
          <AnimatePresence mode="wait">
            {showProductDetail && product ? (
              <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <button onClick={() => setShowProductDetail(false)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-indigo-500 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Volver al listado
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-card rounded-3xl border border-border shadow-xl p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h2 className="text-3xl font-black tracking-tighter">{product.nombre}</h2>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                              {categorias.find(c => c.id === product.categoria_id)?.nombre || "S/C"}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground">Unidad: {product.unidad}</span>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-center md:text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Hoy</p>
                            <p className="text-3xl font-black text-indigo-500">{currentQty}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-card rounded-3xl border border-border shadow-xl p-6 h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.05} />
                          <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis fontSize={10} tickLine={false} axisLine={false} />
                          <ReTooltip content={<CustomTooltip />} />
                          <ReferenceLine y={getPerBodegaMin(selectedId)} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
                          <Line type="monotone" dataKey="qty" stroke="#6366f1" strokeWidth={4} dot={<Dot r={4} fill="#6366f1" />} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-card rounded-3xl border border-border shadow-xl p-6">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-6">Métricas</p>
                      <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">Valor Actual</span>
                          <span className="font-bold">{formatMoney(currentQty * product.costo_unitario)}</span>
                        </div>
                        <Button className="w-full h-12 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20">
                          <ShoppingCart className="h-4 w-4 mr-2" /> Gestionar Pedido
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {groupedOverview.map((cat) => (
                  <div key={cat.id} className="space-y-4">
                    <div className="flex items-center gap-4 px-1">
                      <div
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20"
                        style={{ color: cat.color || "var(--primary)", borderColor: cat.color ? `${cat.color}40` : undefined }}
                      >
                        <span>{cat.nombre}</span>
                        <span className="opacity-50 font-normal tracking-normal">({cat.rows.length})</span>
                      </div>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 via-primary/5 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {cat.rows.map((p) => {
                        const bodega = allBodegas.find(b => b.id === p.bodegaId);
                        return (
                          <motion.div key={`${p.id}-${p.bodegaId}`} onClick={() => selectProduct(p)} className={cn("group rounded-3xl border bg-card/60 backdrop-blur-sm p-4 transition-all cursor-pointer hover:shadow-2xl hover:scale-[1.02] relative overflow-hidden", p.worstStatus === "critical" ? "border-red-500/30" : p.worstStatus === "warning" ? "border-yellow-500/30" : "border-border/50")}>
                            <div className="absolute bottom-0 inset-x-0 h-1" style={{ background: statusColor(p.worstStatus) }} />
                            <div className="flex flex-col gap-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h3 className="font-black text-lg tracking-tighter group-hover:text-indigo-500 transition-colors">{p.nombre}</h3>
                                  <div className="flex items-center gap-2">
                                    {bodega && <BodegaBadge nombre={bodega.nombre} color={bodega.color} icono={bodega.icono} className="scale-75 origin-left" />}
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{p.unidad}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between items-end">
                                <div><p className="text-[9px] font-black uppercase opacity-50">Hoy</p><p className="font-black text-xl">{p.currentQty}</p></div>
                                <div className="text-right"><p className="text-[9px] font-black uppercase opacity-50">Proyectado</p><p className={cn("font-black text-xl", p.qty <= 0 ? "text-red-500" : "text-indigo-500")}>{p.qty}</p></div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}