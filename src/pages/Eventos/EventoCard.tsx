// src/pages/Eventos/EventoCard.tsx
import { Trash2, Eye, Ban, Pencil, Play } from "lucide-react";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "../../lib/utils";
import { Evento } from "./types";

interface EventoCardProps {
  evento: Evento;
  isAdmin: boolean;
  getStatus: (ev: Evento) => string;
  prodName: (id: string) => string;
  prodCost: (id: string) => number;
  onExecute: (id: string) => void;
  onCancel: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDetail: () => void;
}

export function EventoCard({ 
  evento, isAdmin, getStatus, prodName, prodCost,
  onExecute, onCancel, onEdit, onDelete, onDetail 
}: EventoCardProps) {
  const status = getStatus(evento);
  const totalCost = evento.items.reduce((s, i) => s + i.cantidad * prodCost(i.producto_id), 0);

  const statusBadge = (st: string) => {
    switch (st) {
      case "agendado": return "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300";
      case "cancelado": return "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300";
      case "finalizado": return "bg-primary/10 text-primary";
      default: return "bg-secondary text-muted-foreground";
    }
  };

  const statusLabel = (st: string) => {
    switch (st) {
      case "agendado": return "Agendado";
      case "cancelado": return "Cancelado";
      case "finalizado": return "Finalizado";
      default: return st;
    }
  };

  return (
    <div className="rounded-xl border p-4 space-y-2 cursor-pointer hover:shadow-md transition-shadow" onClick={onDetail}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold flex items-center gap-1.5 truncate">
            {evento.nombre}
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0", 
              status === "agendado" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300" : "bg-primary/10 text-primary"
            )}>
              {status === "agendado" ? "Agendado" : "Finalizado"}
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(evento.fecha), "EEEE dd 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{evento.items.length} producto{evento.items.length !== 1 ? "s" : ""}</span>
        <span className="ml-auto font-medium text-foreground">${totalCost.toLocaleString("es-CL")}</span>
      </div>
      <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
        {status === "agendado" && (
          <>
            <Button size="sm" onClick={() => onExecute(evento.id)} className="flex-1 gap-1 bg-primary">
              <Play className="h-3.5 w-3.5" /> Ejecutar
            </Button>
            <Button size="sm" variant="outline" onClick={onDetail} title="Ver detalles">
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={onEdit} className="gap-1">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onCancel(evento.id); }} title="Cancelar evento" className="text-amber-600">
              <Ban className="h-4 w-4" />
            </Button>
          </>
        )}
        {status !== "agendado" && (
          <Button size="sm" variant="outline" onClick={onDetail} className="gap-1">
            <Eye className="h-3.5 w-3.5" /> Detalles
          </Button>
        )}
        {isAdmin && (
          <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}