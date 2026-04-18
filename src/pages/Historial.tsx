import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useBodega } from "../hooks/useBodega";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import BodegaSelector from "../components/BodegaSelector";
import BodegaBadge from "../components/BodegaBadge";
import { Button } from "../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { EnhancedCalendar } from "../components/ui/enhanced-calendar";
import { format } from "date-fns";
import { CalendarIcon, History } from "lucide-react";
import { cn } from "../lib/utils";
import { toChileDatetime, toChileDate } from "../lib/timezone";

interface Registro {
  id: string;
  producto_id: string;
  cantidad: number;
  fecha_recuento: string;
  tipo_movimiento: string;
  motivo_merma: string | null;
  usuario_id: string;
  created_at: string;
  bodega_id: string;
  descripcion_merma: string | null;
  user_display_name?: string;
}

interface Producto { id: string; nombre: string; unidad: string }

const TIPOS = [
  { value: "all", label: "Todos" },
  { value: "conteo", label: "Conteo" },
  { value: "consumo", label: "Consumo" },
  { value: "merma", label: "Merma" },
  { value: "ajuste", label: "Ajuste" },
  { value: "transferencia", label: "Transferencia" },
];

export default function HistorialPage() {
  const { isAdmin, isSupervisor } = useAuth();
  const { selectedBodegaId, bodegas } = useBodega();
  const canSeeUser = isAdmin || isSupervisor;

  const [registros, setRegistros] = useState<Registro[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroProducto, setFiltroProducto] = useState("all");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();

  useEffect(() => { loadData(); }, [selectedBodegaId]);

  const loadData = async () => {
    try {
        let url = "/inventory/history/";
        const params = new URLSearchParams();
        if (selectedBodegaId !== "all") params.append("bodega_id", selectedBodegaId);
        if (params.toString()) url += `?${params.toString()}`;

        const [regRes, prodRes] = await Promise.all([
          api.get(url),
          api.get("/inventory/products"),
        ]);
        setRegistros(regRes.data);
        setProductos(prodRes.data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const prodName = (id: string) => productos.find((p) => p.id === id)?.nombre ?? "—";
  const prodUnit = (id: string) => productos.find((p) => p.id === id)?.unidad ?? "";

  const tipoLabel = (t: string) => {
    const map: Record<string, string> = { conteo: "Conteo", consumo: "Consumo", merma: "Merma", ajuste: "Ajuste", transferencia: "Transferencia" };
    return map[t] ?? t;
  };

  const tipoBadgeClass = (t: string) => {
    switch (t) {
      case "conteo": return "bg-primary/10 text-primary";
      case "consumo": return "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-400";
      case "merma": return "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-400";
      case "ajuste": return "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-400";
      case "transferencia": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400";
      default: return "bg-secondary text-muted-foreground";
    }
  };

  const filtered = registros.filter((r) => {
    if (filtroProducto !== "all" && r.producto_id !== filtroProducto) return false;
    if (filtroTipo !== "all" && r.tipo_movimiento !== filtroTipo) return false;
    if (fechaDesde) {
      const d = new Date(r.fecha_recuento + "T00:00:00");
      if (d < fechaDesde) return false;
    }
    if (fechaHasta) {
      const d = new Date(r.fecha_recuento + "T00:00:00");
      if (d > fechaHasta) return false;
    }
    return true;
  });

  if (loading) return <div className="py-12 text-center text-muted-foreground">Cargando historial...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Historial de Movimientos</h1>
      </div>

      <BodegaSelector />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Select value={filtroProducto} onValueChange={setFiltroProducto}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Producto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los productos</SelectItem>
            {productos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full sm:w-40 justify-start", !fechaDesde && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fechaDesde ? format(fechaDesde, "dd/MM/yyyy") : "Desde"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <EnhancedCalendar mode="single" selected={fechaDesde} onSelect={setFechaDesde} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full sm:w-40 justify-start", !fechaHasta && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fechaHasta ? format(fechaHasta, "dd/MM/yyyy") : "Hasta"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <EnhancedCalendar mode="single" selected={fechaHasta} onSelect={setFechaHasta} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left border-b">
              <th className="px-4 py-2 font-semibold">Fecha y hora</th>
              <th className="px-4 py-2 font-semibold">Producto</th>
              <th className="px-4 py-2 font-semibold">Tipo</th>
              <th className="px-4 py-2 font-semibold">Bodega</th>
              <th className="px-4 py-2 font-semibold text-right">Cantidad</th>
              <th className="px-4 py-2 font-semibold">Usuario</th>
              <th className="px-4 py-2 font-semibold">Detalle/Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-accent/50 transition-colors">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="font-medium">{toChileDate(r.created_at)}</div>
                  <div className="text-[10px] text-muted-foreground">{toChileDatetime(r.created_at)}</div>
                </td>
                <td className="px-4 py-2 font-medium">{prodName(r.producto_id)}</td>
                <td className="px-4 py-2">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", tipoBadgeClass(r.tipo_movimiento))}>
                    {tipoLabel(r.tipo_movimiento)}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <BodegaBadge nombre={bodegas.find(b => b.id === r.bodega_id)?.nombre ?? ""} />
                </td>
                <td className="px-4 py-2 text-right font-bold">{r.cantidad} {prodUnit(r.producto_id)}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{r.user_display_name || "—"}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground italic">{r.motivo_merma || r.descripcion_merma || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
