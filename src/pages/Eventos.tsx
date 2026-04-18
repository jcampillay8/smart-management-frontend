import { useEffect, useState, useMemo, useRef } from "react";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useBodega } from "../hooks/useBodega";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { EnhancedCalendar } from "../components/ui/enhanced-calendar";
import { toast } from "sonner";
import { CalendarDays, Plus, Trash2, CalendarIcon, XCircle, Eye, Ban, Pencil, Play, Search, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { buildInventorySnapshot, type InventoryMovementRecord } from "../lib/inventory";
import { formatMoney } from "../lib/format";
import BodegaBadge from "../components/BodegaBadge";

interface Producto { id: string; nombre: string; categoria_id: string; unidad: string; stock_minimo: number; costo_unitario: number }
interface Receta { id: string; nombre: string; precio: number }

interface EventoItem {
  producto_id: string;
  cantidad: number;
  bodega_id: string;
}

interface EventoReceta {
  receta_id: string;
  cantidad: number;
}

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  productos: any[]; // Items from backend
  items: EventoItem[]; // Local mapped items
  ejecutado: boolean;
  cancelado: boolean;
  valor_publico?: number | null;
}

export default function EventosPage() {
  const { user, isAdmin } = useAuth();
  const { bodegas } = useBodega();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState<InventoryMovementRecord[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventoNombre, setEventoNombre] = useState("");
  const [eventoFecha, setEventoFecha] = useState<Date>(new Date());
  const [eventoItems, setEventoItems] = useState<EventoItem[]>([]);
  const [eventoRecetas, setEventoRecetas] = useState<EventoReceta[]>([]);
  const [eventoValorPublico, setEventoValorPublico] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Per-bodega search
  const [bodegaSearch, setBodegaSearch] = useState<Record<string, string>>({});
  const [bodegaSearchFocus, setBodegaSearchFocus] = useState<string | null>(null);
  const blurTimeoutRef = useRef<any>(null);

  const [detailEvento, setDetailEvento] = useState<Evento | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Evento | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [viewTab, setViewTab] = useState<"proximos" | "cancelados" | "historial">("proximos");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prodRes, eventosRes, regRes, recetasRes] = await Promise.all([
        api.get("/inventory/products"),
        api.get("/operations/events/"),
        api.get("/inventory/history/"),
        api.get("/operations/recipes/"),
      ]);
      setProductos(prodRes.data);
      setRecetas(recetasRes.data);
      setAllRecords(regRes.data);
      
      const mapped = eventosRes.data.map((e: any) => ({
        ...e,
        items: e.productos.map((p: any) => ({
          producto_id: p.producto_id,
          cantidad: p.cantidad,
          bodega_id: p.bodega_id
        }))
      }));
      setEventos(mapped);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const prodName = (id: string) => productos.find(p => p.id === id)?.nombre ?? "—";
  const prodUnit = (id: string) => productos.find(p => p.id === id)?.unidad ?? "";
  const prodCost = (id: string) => productos.find(p => p.id === id)?.costo_unitario ?? 0;

  const getProjectedStock = (productoId: string, bodegaId: string, targetDate: string, excludeEventId?: string | null) => {
    const snapshot = buildInventorySnapshot(allRecords, new Date().toISOString(), bodegaId);
    let stock = snapshot.totalByProduct[productoId] ?? 0;
    const today = format(new Date(), "yyyy-MM-dd");
    eventos.forEach(ev => {
      if (ev.cancelado || ev.ejecutado) return;
      if (excludeEventId && ev.id === excludeEventId) return;
      if (ev.fecha >= today && ev.fecha <= targetDate) {
        ev.items.forEach(item => {
          if (item.producto_id === productoId && item.bodega_id === bodegaId) {
            stock -= item.cantidad;
          }
        });
      }
    });
    return Math.max(0, stock);
  };

  const openNewEvento = () => {
    setEditingId(null);
    setEventoNombre("");
    setEventoFecha(new Date());
    setEventoItems([]);
    setEventoRecetas([]);
    setEventoValorPublico("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!eventoNombre.trim()) { toast.error("Ingresa un nombre"); return; }
    const payload = {
        nombre: eventoNombre.trim(),
        fecha: format(eventoFecha, "yyyy-MM-dd"),
        valor_publico: eventoValorPublico ? Number(eventoValorPublico) : null,
        items: eventoItems,
        recetas: eventoRecetas
    };

    try {
        if (editingId) {
            await api.put(`/operations/events/${editingId}`, payload);
            toast.success("Evento actualizado");
        } else {
            await api.post("/operations/events/", payload);
            toast.success("Evento creado");
        }
        setDialogOpen(false);
        loadData();
    } catch (e) {
        toast.error("Error al guardar");
    }
  };

  const handleExecute = async (ev: Evento) => {
    try {
        await api.post(`/operations/events/${ev.id}/execute`);
        toast.success("Evento ejecutado");
        loadData();
    } catch (e) {
        toast.error("Error al ejecutar");
    }
  };

  const handleCancel = async (ev: Evento) => {
    try {
        await api.patch(`/operations/events/${ev.id}/cancel`);
        toast.success("Evento cancelado");
        loadData();
    } catch (e) {
        toast.error("Error al cancelar");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
        await api.delete(`/operations/events/${deleteTarget.id}`);
        toast.success("Evento eliminado");
        setDeleteTarget(null);
        loadData();
    } catch (e) {
        toast.error("Error al eliminar");
    }
  };

  const proximosEventos = eventos.filter(e => !e.cancelado && !e.ejecutado);
  const cancelados = eventos.filter(e => e.cancelado);
  const finalizados = eventos.filter(e => e.ejecutado && !e.cancelado);

  const getStatus = (ev: Evento) => {
    if (ev.cancelado) return "cancelado";
    if (ev.ejecutado) return "finalizado";
    return "agendado";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Eventos Programados
          </h1>
          <p className="text-sm text-muted-foreground">Gestiona banquetes y servicios especiales.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCalendar(!showCalendar)} className="gap-1">
            <CalendarIcon className="h-4 w-4" /> {showCalendar ? "Lista" : "Calendario"}
          </Button>
          <Button onClick={openNewEvento} className="gap-1">
            <Plus className="h-4 w-4" /> Nuevo Evento
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {(["proximos", "historial", "cancelados"] as const).map(tab => (
          <button key={tab} onClick={() => setViewTab(tab)}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
              viewTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            )}>
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(viewTab === "proximos" ? proximosEventos : viewTab === "historial" ? finalizados : cancelados).map(ev => (
          <div key={ev.id} className="rounded-xl border p-4 bg-card shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{ev.nombre}</h3>
                <p className="text-xs text-muted-foreground">{format(new Date(ev.fecha + "T12:00:00"), "dd/MM/yyyy")}</p>
              </div>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", 
                ev.ejecutado ? "bg-primary/10 text-primary" : ev.cancelado ? "bg-destructive/10 text-destructive" : "bg-blue-50 text-blue-600"
              )}>
                {getStatus(ev)}
              </span>
            </div>
            <div className="space-y-1">
                {ev.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex justify-between text-xs p-1 bg-secondary/30 rounded">
                        <span>{prodName(item.producto_id)}</span>
                        <span className="font-bold">{item.cantidad} {prodUnit(item.producto_id)}</span>
                    </div>
                ))}
                {ev.items.length > 3 && <p className="text-[10px] text-center text-muted-foreground">+{ev.items.length - 3} más...</p>}
            </div>
            <div className="flex gap-1 pt-2">
                {!ev.ejecutado && !ev.cancelado && (
                    <>
                        <Button size="sm" onClick={() => handleExecute(ev)} className="flex-1 bg-primary text-[10px] h-7">Ejecutar</Button>
                        <Button size="sm" variant="outline" onClick={() => handleCancel(ev)} className="text-[10px] h-7">Cancelar</Button>
                    </>
                )}
                <Button size="sm" variant="ghost" onClick={() => setDetailEvento(ev)} className="text-[10px] h-7">Ver</Button>
                {isAdmin && <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(ev)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
            </div>
          </div>
        ))}
      </div>

      {/* Dialogs: Edit/New, Detail, Delete (skipped for brevity but implement logic) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md overflow-y-auto max-h-[80vh]">
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Nuevo"} Evento</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
                <Input placeholder="Nombre del evento" value={eventoNombre} onChange={e => setEventoNombre(e.target.value)} />
                <Input type="date" value={format(eventoFecha, "yyyy-MM-dd")} onChange={e => setEventoFecha(new Date(e.target.value + "T12:00:00"))} />
                
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Productos Directos</p>
                    <Select onValueChange={id => setEventoItems([...eventoItems, { producto_id: id, cantidad: 1, bodega_id: bodegas[0]?.id }])}>
                        <SelectTrigger><SelectValue placeholder="Agregar producto..." /></SelectTrigger>
                        <SelectContent>{productos.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                    {eventoItems.map((item, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <span className="text-xs flex-1 truncate">{prodName(item.producto_id)}</span>
                            <Input type="number" className="w-16 h-7 text-xs" value={item.cantidad} onChange={e => {
                                const newItems = [...eventoItems];
                                newItems[i].cantidad = Number(e.target.value);
                                setEventoItems(newItems);
                            }} />
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setEventoItems(eventoItems.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                    ))}
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>¿Borrar evento?</AlertDialogTitle></AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>No</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Sí, borrar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
