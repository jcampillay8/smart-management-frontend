// src/pages/Eventos/index.tsx
import { useState } from "react";
import { CalendarDays, Plus, CalendarIcon, XCircle, Eye, Ban, Pencil, Play, Trash2, FileSpreadsheet } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEventos } from "./useEventos";
import { EventoCard } from "./EventoCard";
import { EventoDialog } from "./EventoDialog";
import { Evento } from "./types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { ResumenFaltantes } from "./ResumenFaltantes";

export default function EventosPage() {
  const { isAdmin } = useAuth();
  const { 
    eventos, loading, createEvento, updateEvento, deleteEvento, 
    executeEvento, cancelEvento, reactivateEvento,
    prodName, prodCost, getEventCost, stocks, productos
  } = useEventos();
  
  const [viewTab, setViewTab] = useState<"proximos" | "historial" | "cancelados">("proximos");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [detailEvento, setDetailEvento] = useState<Evento | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Evento | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const proximosEventos = eventos.filter(e => !e.cancelado && !e.ejecutado);
  const finalizados = eventos.filter(e => e.ejecutado && !e.cancelado);
  const cancelados = eventos.filter(e => e.cancelado);

  const filteredEventos = viewTab === "proximos" ? proximosEventos 
    : viewTab === "historial" ? finalizados 
    : cancelados;

  const getStatus = (ev: Evento) => {
    if (ev.cancelado) return "cancelado";
    if (ev.ejecutado) return "finalizado";
    return "agendado";
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "agendado": return "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300";
      case "cancelado": return "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300";
      case "finalizado": return "bg-primary/10 text-primary";
      default: return "bg-secondary text-muted-foreground";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "agendado": return "Agendado";
      case "cancelado": return "Cancelado";
      case "finalizado": return "Finalizado";
      default: return status;
    }
  };

  const monthEvents = eventos.filter(e => {
    const d = new Date(e.fecha);
    return d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear();
  });

  const handleNew = () => {
    setEditingEvento(null);
    setDialogOpen(true);
  };

  const handleEdit = (ev: Evento) => {
    if (ev.cancelado || ev.ejecutado) return;
    setEditingEvento(ev);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvento(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) { /* handled in hook */ }
  };

  const handleExecute = async (id: string) => {
    try {
      await executeEvento(id);
    } catch (e) { /* handled in hook */ }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelEvento(id);
    } catch (e) { /* handled in hook */ }
  };

  const handleReactivate = async (id: string) => {
    try {
      await reactivateEvento(id);
    } catch (e) { /* handled in hook */ }
  };

  if (loading) return <div className="p-8 text-center">Cargando eventos...</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter">Eventos</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Programación y Control de Consumo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="gap-1">
            <FileSpreadsheet className="h-4 w-4" /> Exportar
          </Button>
          <Button variant="outline" onClick={() => setShowCalendar(!showCalendar)} className="gap-1">
            <CalendarIcon className="h-4 w-4" /> {showCalendar ? "Ver lista" : "Calendario"}
          </Button>
          <Button onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" /> Nuevo Evento
          </Button>
        </div>
      </header>

      <ResumenFaltantes eventos={eventos} stocks={stocks} productos={productos} />

      {showCalendar && (
        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() - 1)))}>&lt;</Button>
            <span className="px-4 font-medium">{format(calendarMonth, "MMMM yyyy", { locale: es })}</span>
            <Button variant="outline" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() + 1)))}>&gt;</Button>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Eventos del mes</h3>
            {monthEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay eventos este mes.</p>
            ) : (
              monthEvents.map(ev => {
                const status = getStatus(ev);
                return (
                  <div key={ev.id} className={cn("flex items-center justify-between rounded-lg border px-3 py-2", status === "cancelado" && "opacity-60")}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">{ev.nombre}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap", statusBadge(status))}>{statusLabel(status)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(ev.fecha), "dd/MM")}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDetailEvento(ev)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {!showCalendar && (
        <>
          <div className="flex gap-1 border-b">
            {([
              { key: "proximos", label: "Agendados", count: proximosEventos.length },
              { key: "historial", label: "Finalizados", count: finalizados.length },
              { key: "cancelados", label: "Cancelados", count: cancelados.length },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setViewTab(tab.key)}
                className={cn("px-3 py-2 text-sm font-medium border-b-2 transition-colors",
                  viewTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {viewTab === "proximos" && (
            proximosEventos.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <CalendarDays className="h-10 w-10 mx-auto opacity-40" />
                <p>No hay eventos agendados</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {proximosEventos.sort((a, b) => a.fecha.localeCompare(b.fecha)).map(ev => (
                  <EventoCard 
                    key={ev.id} 
                    evento={ev} 
                    prodName={prodName}
                    prodCost={prodCost}
                    isAdmin={!!isAdmin}
                    getStatus={getStatus}
                    onEdit={() => handleEdit(ev)} 
                    onDelete={() => setDeleteTarget(ev)}
                    onCancel={() => handleCancel(ev.id)}
                    onDetail={() => setDetailEvento(ev)}
                    onExecute={() => handleExecute(ev.id)}
                  />
                ))}
              </div>
            )
          )}

          {viewTab === "cancelados" && (
            cancelados.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <XCircle className="h-10 w-10 mx-auto opacity-40" />
                <p>No hay eventos cancelados</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {cancelados.map(ev => (
                  <div key={ev.id} className="rounded-xl border border-red-200 p-4 space-y-3 opacity-70">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold flex items-center gap-1.5">
                          {ev.nombre}
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusBadge("cancelado"))}>Cancelado</span>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(ev.fecha), "EEEE dd 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => handleReactivate(ev.id)} className="flex-1 gap-1">Reactivar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setDetailEvento(ev)} className="gap-1"><Eye className="h-3 w-3" /> Detalles</Button>
                      {isAdmin && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(ev)}><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {viewTab === "historial" && (
            finalizados.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <CalendarDays className="h-10 w-10 mx-auto opacity-40" />
                <p>No hay eventos finalizados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {finalizados.sort((a, b) => b.fecha.localeCompare(a.fecha)).map(ev => {
                  const status = getStatus(ev);
                  return (
                    <div key={ev.id} className="rounded-lg border p-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{ev.nombre}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap", statusBadge(status))}>{statusLabel(status)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{format(new Date(ev.fecha), "dd/MM/yyyy")} — {ev.items.length} productos</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setDetailEvento(ev)}><Eye className="h-4 w-4" /></Button>
                        {isAdmin && (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(ev)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}

      <EventoDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        editingEvento={editingEvento}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingEvento(null);
        }}
      />

      <Dialog open={!!detailEvento} onOpenChange={() => setDetailEvento(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailEvento?.nombre}
              {detailEvento && (
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusBadge(getStatus(detailEvento)))}>{statusLabel(getStatus(detailEvento))}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailEvento && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {format(new Date(detailEvento.fecha), "EEEE dd 'de' MMMM, yyyy", { locale: es })}
              </p>
              <div className="border-t pt-3 space-y-1">
                <p className="text-sm font-medium mb-2">📦 Productos ({detailEvento.items.length})</p>
                {detailEvento.items.map((item, idx) => {
                  const stockItem = stocks.find(s => s.producto_id === item.producto_id && s.bodega_id === item.bodega_id);
                  const currentStock = stockItem?.stock_actual || 0;
                  const isShort = currentStock < item.cantidad;
                  
                  return (
                    <div key={idx} className="flex flex-col gap-1 rounded-xl border p-2 bg-secondary/20">
                      <div className="flex justify-between text-sm">
                        <span className="font-bold truncate">{prodName(item.producto_id)}</span>
                        <div className="text-right">
                          <span className={cn(
                            "font-black",
                            isShort ? "text-destructive" : "text-primary"
                          )}>
                            {item.cantidad}
                          </span>
                          <span className="text-muted-foreground text-[10px] ml-1">/{currentStock}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] text-muted-foreground uppercase font-black">Bodega: {item.bodega_id?.slice(0,8) || "General"}</span>
                         {isShort && (
                           <span className="flex items-center gap-1 text-[10px] font-bold text-destructive">
                             <AlertTriangle className="h-3 w-3" /> Faltante: {item.cantidad - currentStock}
                           </span>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Costo total</span>
                  <span className="font-bold">${getEventCost(detailEvento.items).toLocaleString("es-CL")}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro que quieres borrar este evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el evento "{deleteTarget?.nombre}" y todos sus productos asociados.
              {deleteTarget?.ejecutado && " También se eliminarán los registros de consumo asociados."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Exportar planilla de eventos
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
            <p>Funcionalidad de exportación XLSX en desarrollo...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}