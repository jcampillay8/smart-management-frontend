// src/pages/Eventos/index.tsx
import { useState } from "react";
import { CalendarDays, Plus, CalendarIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { useEventos } from "./useEventos";
import { EventoCard } from "./EventoCard";
import { Evento } from "./types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";

export default function EventosPage() {
  const { isAdmin } = useAuth();
  const { eventos, productos, loading, handleAction } = useEventos();
  const [viewTab, setViewTab] = useState<"proximos" | "historial" | "cancelados">("proximos");
  const [deleteTarget, setDeleteTarget] = useState<Evento | null>(null);

  const filteredEventos = eventos.filter(e => {
    if (viewTab === "proximos") return !e.cancelado && !e.ejecutado;
    if (viewTab === "historial") return e.ejecutado && !e.cancelado;
    return e.cancelado;
  });

  const getProdName = (id: string) => productos.find(p => p.id === id)?.nombre ?? "—";
  const getProdUnit = (id: string) => productos.find(p => p.id === id)?.unidad ?? "";

  if (loading) return <div className="p-8 text-center">Cargando eventos...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" /> Eventos Programados
          </h1>
        </div>
        <Button onClick={() => {/* Lógica para abrir dialogo nuevo */}} className="gap-1">
          <Plus className="h-4 w-4" /> Nuevo Evento
        </Button>
      </div>

      <div className="flex gap-1 border-b">
        {(["proximos", "historial", "cancelados"] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setViewTab(tab)}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
              viewTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEventos.map(ev => (
          <EventoCard 
            key={ev.id}
            evento={ev}
            isAdmin={!!isAdmin}
            onExecute={(id) => handleAction(id, "execute")}
            onCancel={(id) => handleAction(id, "cancel")}
            onDelete={setDeleteTarget}
            getProdName={getProdName}
            getProdUnit={getProdUnit}
          />
        ))}
      </div>

      {/* Alerta de Borrado */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Borrar evento "{deleteTarget?.nombre}"?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleAction(deleteTarget.id, "delete")}>Sí, borrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}