// src/pages/Eventos/EventoCard.tsx
import { Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { Evento } from "./types";

interface EventoCardProps {
  evento: Evento;
  isAdmin: boolean;
  onExecute: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (evento: Evento) => void;
  getProdName: (id: string) => string;
  getProdUnit: (id: string) => string;
}

export function EventoCard({ evento, isAdmin, onExecute, onCancel, onDelete, getProdName, getProdUnit }: EventoCardProps) {
  const status = evento.cancelado ? "cancelado" : evento.ejecutado ? "finalizado" : "agendado";

  return (
    <div className="rounded-xl border p-4 bg-card shadow-sm space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{evento.nombre}</h3>
          <p className="text-xs text-muted-foreground">{format(new Date(evento.fecha + "T12:00:00"), "dd/MM/yyyy")}</p>
        </div>
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", 
          evento.ejecutado ? "bg-primary/10 text-primary" : evento.cancelado ? "bg-destructive/10 text-destructive" : "bg-blue-50 text-blue-600"
        )}>
          {status}
        </span>
      </div>
      <div className="space-y-1">
        {evento.items.slice(0, 3).map((item, i) => (
          <div key={i} className="flex justify-between text-xs p-1 bg-secondary/30 rounded">
            <span>{getProdName(item.producto_id)}</span>
            <span className="font-bold">{item.cantidad} {getProdUnit(item.producto_id)}</span>
          </div>
        ))}
        {evento.items.length > 3 && <p className="text-[10px] text-center text-muted-foreground">+{evento.items.length - 3} más...</p>}
      </div>
      <div className="flex gap-1 pt-2">
        {!evento.ejecutado && !evento.cancelado && (
          <>
            <Button size="sm" onClick={() => onExecute(evento.id)} className="flex-1 text-[10px] h-7">Ejecutar</Button>
            <Button size="sm" variant="outline" onClick={() => onCancel(evento.id)} className="text-[10px] h-7">Cancelar</Button>
          </>
        )}
        {isAdmin && (
          <Button size="sm" variant="ghost" onClick={() => onDelete(evento)} className="h-7 w-7 p-0 text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}