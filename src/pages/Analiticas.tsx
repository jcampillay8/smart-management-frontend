import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { toast } from "sonner";
import { AlertTriangle, Clock, FileSpreadsheet, Bell, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { saveSeenKeys } from "../lib/notifications";
import { buildInventorySnapshot, type InventoryMovementRecord } from "../lib/inventory";
import BodegaBadge from "../components/BodegaBadge";

interface ProductoConStock {
  id: string;
  nombre: string;
  unidad: string;
  stock_minimo: number;
  costo_unitario: number;
  cantidad: number | null;
  cantidad_vencida: number;
  fecha_vencimiento: string | null;
  categoria_nombre: string;
  bodega_id: string;
  bodega_nombre: string;
}

interface SmartNotification {
  type: "critical" | "warning" | "info";
  title: string;
  details: { text: string; bodega?: string }[];
  key: string;
  action?: () => void;
  bodega_nombre?: string;
}

export default function Analiticas() {
  const navigate = useNavigate();
  const [enriched, setEnriched] = useState<ProductoConStock[]>([]);
  const [sinStockEventos, setSinStockEventos] = useState<{ evento: string; eventoId: string; fecha: string; productos: { id: string; nombre: string; restante: number; minimo: number; unidad: string; insuficiente: boolean; cantidad: number; bodega_nombre?: string; alt_suggestion?: string }[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    try {
      const [regRes, prodRes, catRes, bodRes, eventosRes] = await Promise.all([
        api.get("/inventory/history/"),
        api.get("/inventory/products"),
        api.get("/inventory/categories"),
        api.get("/inventory/bodegas"),
        api.get("/operations/events/"),
      ]);

      const productos = prodRes.data;
      const categorias = catRes.data;
      const bodegasList = bodRes.data;
      const records = regRes.data as InventoryMovementRecord[];

      const items: ProductoConStock[] = [];
      const perBodegaLots = new Map<string, { fecha_vencimiento: string; cantidad: number }[]>();

      for (const bodega of bodegasList) {
        const snapshot = buildInventorySnapshot(records, new Date().toISOString(), bodega.id);
        for (const p of productos) {
          const lots = snapshot.lotsByProduct[p.id] || [];
          perBodegaLots.set(`${p.id}::${bodega.id}`, lots);
          
          if (lots.length === 0 && (snapshot.totalByProduct[p.id] ?? 0) === 0) {
              // If it's explicitly configured for this bodega, but has 0 stock, we might want to show it as 0.
              // For simplicity, we only track if it has movements.
          }
          
          const totalQty = snapshot.totalByProduct[p.id] ?? 0;
          if (totalQty === 0 && !p.bodegas_config?.some((bc: any) => bc.bodega_id === bodega.id)) continue;

          const cat = categorias.find((c: any) => c.id === p.categoria_id);
          const validExpiries = lots.filter(l => l.fecha_vencimiento && l.cantidad > 0);
          const earliestExpiry = validExpiries.length > 0
            ? validExpiries.sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))[0].fecha_vencimiento
            : null;
          
          const nowTs = new Date();
          nowTs.setHours(0, 0, 0, 0);
          const nowTsMs = nowTs.getTime();
          
          const expiredQty = lots
            .filter(l => l.fecha_vencimiento && new Date(l.fecha_vencimiento + "T00:00:00").getTime() < nowTsMs && l.cantidad > 0)
            .reduce((sum, l) => sum + l.cantidad, 0);
          
          const stockMinimo = p.bodegas_config?.find((bc: any) => bc.bodega_id === bodega.id)?.stock_minimo ?? p.stock_minimo;
          
          items.push({
            id: p.id, nombre: p.nombre, unidad: p.unidad, stock_minimo: stockMinimo,
            costo_unitario: p.costo_unitario ?? 0,
            cantidad: totalQty,
            cantidad_vencida: expiredQty,
            fecha_vencimiento: earliestExpiry,
            categoria_nombre: cat?.nombre ?? "",
            bodega_id: bodega.id,
            bodega_nombre: bodega.nombre,
          });
        }
      }

      const eventosData = eventosRes.data.filter((ev: any) => !ev.ejecutado && !ev.cancelado);
      const sinStockList: any[] = [];

      for (const ev of eventosData) {
        const problemProds: any[] = [];
        for (const ep of (ev.evento_productos || [])) {
          const bodegaId = ep.bodega_id;
          const bodegaNombre = bodegasList.find((b: any) => b.id === bodegaId)?.nombre ?? "";
          const key = `${ep.producto_id}::${bodegaId}`;
          const lots = perBodegaLots.get(key) || [];
          
          let validStock = 0;
          lots.forEach(l => {
            if (l.fecha_vencimiento && l.fecha_vencimiento < ev.fecha) return;
            validStock += l.cantidad;
          });

          const restante = validStock - Number(ep.cantidad);
          const prod = productos.find((p: any) => p.id === ep.producto_id);
          if (!prod) continue;

          const stockMinimo = prod.bodegas_config?.find((bc: any) => bc.bodega_id === bodegaId)?.stock_minimo ?? prod.stock_minimo;

          if (restante < 0) {
            problemProds.push({ id: prod.id, nombre: prod.nombre, restante: validStock, minimo: stockMinimo, unidad: prod.unidad, insuficiente: true, cantidad: Number(ep.cantidad), bodega_nombre: bodegaNombre });
          } else if (restante < stockMinimo) {
            problemProds.push({ id: prod.id, nombre: prod.nombre, restante, minimo: stockMinimo, unidad: prod.unidad, insuficiente: false, cantidad: Number(ep.cantidad), bodega_nombre: bodegaNombre });
          }
        }
        if (problemProds.length > 0) {
          sinStockList.push({ evento: ev.nombre, eventoId: ev.id, fecha: ev.fecha, productos: problemProds });
        }
      }
      setSinStockEventos(sinStockList);
      setEnriched(items);
    } catch (error) {
      toast.error("Error al cargar analíticas");
    } finally {
      setLoading(false);
    }
  };

  const sinStock = enriched.filter((p) => p.cantidad !== null && p.cantidad === 0);
  const bajosStock = enriched.filter((p) => p.cantidad !== null && p.cantidad > 0 && p.cantidad < p.stock_minimo);

  const nowTs = new Date();
  nowTs.setHours(0, 0, 0, 0);
  const nowTsMs = nowTs.getTime();
  
  const proximosVencer = enriched.filter((p) => {
    if (!p.fecha_vencimiento || !p.cantidad || p.cantidad === 0) return false;
    const diff = (new Date(p.fecha_vencimiento + "T00:00:00").getTime() - nowTsMs) / 86400000;
    return diff > 0 && diff <= 5;
  });
  
  const vencidos = enriched.filter((p) => {
    if (!p.cantidad || p.cantidad === 0) return false;
    if (!p.fecha_vencimiento) return false;
    return new Date(p.fecha_vencimiento + "T00:00:00").getTime() < nowTsMs && p.cantidad_vencida > 0;
  });

  const notifications = useMemo<SmartNotification[]>(() => {
    const notifs: SmartNotification[] = [];

    if (vencidos.length > 0) {
      notifs.push({
        type: "critical",
        title: `${vencidos.length} productos vencidos`,
        details: vencidos.map(p => ({ text: `${p.nombre}: ${p.cantidad_vencida} ${p.unidad} vencidos`, bodega: p.bodega_nombre })),
        key: vencidos.map(p => `vencido:${p.id}:${p.bodega_id}`).join(","),
        action: () => navigate("/", { state: { openMerma: true, mermaProducts: vencidos } }),
      });
    }

    if (bajosStock.length > 0) {
      notifs.push({
        type: "warning",
        title: `${bajosStock.length} productos bajo stock mínimo`,
        details: bajosStock.map(p => ({ text: `${p.nombre}: ${p.cantidad} / ${p.stock_minimo} ${p.unidad}`, bodega: p.bodega_nombre })),
        key: bajosStock.map(p => `bajo_stock:${p.id}:${p.bodega_id}`).join(","),
        action: () => navigate("/", { state: { highlightProducts: bajosStock.map(p => p.id) } }),
      });
    }

    return notifs;
  }, [vencidos, bajosStock]);

  if (loading) return <div className="py-12 text-center text-muted-foreground">Cargando novedades...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Novedades
        </h1>
        <Button onClick={() => navigate("/informes")} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Analíticas e Informes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notifications.map((n, i) => (
          <div key={i} className={cn("rounded-lg border p-4", n.type === "critical" ? "bg-destructive/10 border-destructive/50" : "bg-amber-50 border-amber-200")}>
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-semibold">{n.title}</h2>
              <Button variant="ghost" size="sm" onClick={n.action}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <ul className="text-xs space-y-1">
              {n.details.map((d, j) => (
                <li key={j} className="flex justify-between">
                  <span>{d.text}</span>
                  <BodegaBadge nombre={d.bodega || ""} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="rounded-lg border p-4 bg-card shadow-sm">
          <h2 className="text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Bajo Stock
          </h2>
          <div className="space-y-2">
            {bajosStock.length === 0 ? <p className="text-xs text-muted-foreground">Todo en orden.</p> : bajosStock.map(p => (
              <div key={`${p.id}-${p.bodega_id}`} className="flex justify-between text-sm p-2 bg-secondary/30 rounded">
                <span>{p.nombre}</span>
                <span className="font-bold text-destructive">{p.cantidad} {p.unidad}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border p-4 bg-card shadow-sm">
          <h2 className="text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> Próximos a Vencer
          </h2>
          <div className="space-y-2">
            {proximosVencer.length === 0 ? <p className="text-xs text-muted-foreground">No hay vencimientos cercanos.</p> : proximosVencer.map(p => (
              <div key={`${p.id}-${p.bodega_id}`} className="flex justify-between text-sm p-2 bg-secondary/30 rounded">
                <span>{p.nombre}</span>
                <span className="text-amber-600 font-bold">{p.fecha_vencimiento}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border p-4 bg-card shadow-sm">
          <h2 className="text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Vencidos
          </h2>
          <div className="space-y-2">
            {vencidos.length === 0 ? <p className="text-xs text-muted-foreground">No hay productos vencidos.</p> : vencidos.map(p => (
              <div key={`${p.id}-${p.bodega_id}`} className="flex justify-between text-sm p-2 bg-secondary/30 rounded">
                <span>{p.nombre}</span>
                <span className="text-destructive font-bold">{p.cantidad_vencida} {p.unidad}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
