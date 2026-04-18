import { useEffect, useState, useMemo, useRef } from "react";
import api from "../lib/api";
import { useBodega } from "../hooks/useBodega";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Dot, ReferenceLine, Legend } from "recharts";
import { format, addDays, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, AlertTriangle, Calendar, Search, X, Package, CalendarIcon } from "lucide-react";
import BodegaBadge from "../components/BodegaBadge";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { EnhancedCalendar } from "../components/ui/enhanced-calendar";
import { cn } from "../lib/utils";
import { formatMoney } from "../lib/format";
import { buildInventorySnapshot, type InventoryLot, type InventoryMovementRecord } from "../lib/inventory";
import BodegaSelector from "../components/BodegaSelector";

interface Producto {
  id: string;
  nombre: string;
  unidad: string;
  stock_minimo: number;
  categoria_id: string;
  costo_unitario: number;
  bodegas_config?: any[];
}

interface EventoItem { producto_id: string; cantidad: number; bodega_id?: string }
interface Evento { id: string; nombre: string; fecha: string; items: EventoItem[]; ejecutado?: boolean; cancelado?: boolean }

interface DayPoint {
  date: string;
  label: string;
  qty: number;
  status: "normal" | "warning" | "critical";
  statusLabel: string;
  events?: { name: string; qty: number }[];
}

export default function Proyeccion() {
  const { selectedBodegaId, bodegas } = useBodega();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [customMode, setCustomMode] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [allRecords, setAllRecords] = useState<InventoryMovementRecord[]>([]);
  const [totalByProduct, setTotalByProduct] = useState<Record<string, number>>({});
  const [lotsByProduct, setLotsByProduct] = useState<Record<string, InventoryLot[]>>({});
  
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => { loadData(); }, [selectedBodegaId]);

  const loadData = async () => {
    try {
      const [prodRes, regRes, eventosRes] = await Promise.all([
        api.get("/inventory/products"),
        api.get("/inventory/history/"),
        api.get("/operations/events/"),
      ]);
      setProductos(prodRes.data);
      setAllRecords(regRes.data);

      const bodegaFilter = selectedBodegaId === "all" ? undefined : selectedBodegaId;
      const snapshot = buildInventorySnapshot(regRes.data, new Date().toISOString(), bodegaFilter);
      setTotalByProduct(snapshot.totalByProduct);
      setLotsByProduct(snapshot.lotsByProduct);

      const mappedEventos: Evento[] = eventosRes.data.map((e: any) => ({
        ...e,
        items: e.productos.map((p: any) => ({
          producto_id: p.producto_id,
          cantidad: p.cantidad,
          bodega_id: p.bodega_id
        }))
      }));
      setEventos(mappedEventos);

      if (prodRes.data.length > 0 && !selectedId) setSelectedId(prodRes.data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const product = productos.find((p) => p.id === selectedId);
  const currentQty = totalByProduct[selectedId] ?? 0;
  const lots = lotsByProduct[selectedId] ?? [];

  const getPerBodegaMin = (prodId: string) => {
    const p = productos.find(x => x.id === prodId);
    if (!p) return 0;
    if (selectedBodegaId !== "all") {
        const bc = p.bodegas_config?.find((bc: any) => bc.bodega_id === selectedBodegaId);
        if (bc) return bc.stock_minimo;
    }
    return p.stock_minimo;
  };

  const buildChartData = (productId: string, numDays: number): DayPoint[] => {
    const prod = productos.find(p => p.id === productId);
    if (!prod) return [];

    const today = new Date();
    const bodegaFilter = selectedBodegaId === "all" ? undefined : selectedBodegaId;

    const remainingLots = (lotsByProduct[productId] ?? []).map(l => ({ expiry: l.fecha_vencimiento, qty: l.cantidad }));

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

    const minStock = getPerBodegaMin(productId);
    const data: DayPoint[] = [];

    for (let i = 0; i <= numDays; i++) {
      const d = addDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");

      // Expire lots
      remainingLots.forEach(l => { if (l.expiry && l.expiry < dateStr) l.qty = 0; });

      // Event deductions
      const dayEvents: any[] = [];
      eventos.forEach(ev => {
          if (ev.fecha === dateStr && !ev.ejecutado && !ev.cancelado) {
              ev.items.forEach(item => {
                  if (item.producto_id === productId && (!bodegaFilter || item.bodega_id === bodegaFilter)) {
                      deductFromLots(item.cantidad);
                      dayEvents.push({ name: ev.nombre, qty: item.cantidad });
                  }
              });
          }
      });

      const qty = Math.max(0, getTotal());
      let status: any = "normal";
      if (qty === 0) status = "critical";
      else if (qty <= minStock) status = "warning";

      data.push({
          date: dateStr,
          label: format(d, "dd/MM"),
          qty,
          status,
          statusLabel: status === "critical" ? "Sin Stock" : status === "warning" ? "Bajo Stock" : "Normal",
          events: dayEvents.length > 0 ? dayEvents : undefined
      });
    }
    return data;
  };

  const chartData = useMemo(() => product ? buildChartData(selectedId, days) : [], [product, days, eventos, allRecords]);

  if (loading) return <div className="py-12 text-center">Cargando proyecciones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Proyección de Stock
        </h1>
        <div className="flex gap-2">
            <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {[7, 14, 30].map(d => <SelectItem key={d} value={String(d)}>{d} días</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </div>

      <BodegaSelector />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="space-y-4">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filtrar productos..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
                {productos.filter(p => p.nombre.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                    <button key={p.id} onClick={() => setSelectedId(p.id)} className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", selectedId === p.id ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
                        {p.nombre}
                    </button>
                ))}
            </div>
        </aside>

        <main className="md:col-span-3 space-y-6">
            {product && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg border bg-card">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Stock Actual</p>
                            <p className="text-2xl font-black">{currentQty} <span className="text-sm font-normal">{product.unidad}</span></p>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Stock Mínimo</p>
                            <p className="text-2xl font-black">{getPerBodegaMin(selectedId)} <span className="text-sm font-normal">{product.unidad}</span></p>
                        </div>
                    </div>

                    <div className="p-6 rounded-xl border bg-card shadow-sm">
                        <h2 className="text-sm font-bold uppercase mb-6">Gráfico de Proyección</h2>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="label" tick={{fontSize: 10}} />
                                    <YAxis tick={{fontSize: 10}} />
                                    <ReTooltip />
                                    <ReferenceLine y={getPerBodegaMin(selectedId)} stroke="#F59E0B" strokeDasharray="3 3" label={{value: "MÍN", position: "right", fontSize: 9}} />
                                    <Line type="monotone" dataKey="qty" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff"}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-bold uppercase">Eventos que afectan el stock</h3>
                        <div className="space-y-1">
                            {chartData.filter(d => d.events).map((d, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30 text-sm">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span className="font-medium">{d.label}</span>
                                        <span className="text-muted-foreground">— {d.events?.map((e: any) => e.name).join(", ")}</span>
                                    </div>
                                    <span className="font-bold text-destructive">-{d.events?.reduce((s: number, e: any) => s + e.qty, 0)} {product.unidad}</span>
                                </div>
                            ))}
                            {chartData.filter(d => d.events).length === 0 && <p className="text-sm text-muted-foreground italic">No hay eventos próximos para este producto.</p>}
                        </div>
                    </div>
                </>
            )}
        </main>
      </div>
    </div>
  );
}
