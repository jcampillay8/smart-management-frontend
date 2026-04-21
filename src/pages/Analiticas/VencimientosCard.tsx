// src/pages/Analiticas/VencimientosCard.tsx

import { Clock, AlertTriangle, CalendarDays } from "lucide-react";
import { ProductoAnalitico } from "./types";
import { cn } from "../../lib/utils";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface VencimientosCardProps {
  type: "upcoming" | "expired";
  data: ProductoAnalitico[];
}

export function VencimientosCard({ type, data }: VencimientosCardProps) {
  const isExpired = type === "expired";

  return (
    <div className={cn(
      "rounded-xl border p-4 bg-card shadow-sm flex flex-col h-full",
      isExpired ? "border-red-100" : "border-amber-100"
    )}>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
          {isExpired ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <Clock className="h-4 w-4 text-amber-500" />
          )}
          {isExpired ? "Productos Vencidos" : "Próximos a Vencer"}
        </h2>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-bold",
          isExpired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
        )}>
          {data.length}
        </span>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center opacity-50">
            <CalendarDays className="h-8 w-8 mb-2" />
            <p className="text-xs">No hay registros para mostrar</p>
          </div>
        ) : (
          data.map((p) => {
            const fecha = p.fecha_vencimiento ? parseISO(p.fecha_vencimiento) : null;
            
            return (
              <div 
                key={`${p.id}-${p.bodega_nombre}`} 
                className="flex flex-col p-2.5 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-semibold truncate max-w-[150px]">
                    {p.nombre}
                  </span>
                  <span className={cn(
                    "text-[11px] font-bold",
                    isExpired ? "text-destructive" : "text-amber-600"
                  )}>
                    {p.fecha_vencimiento}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground uppercase tracking-wider">
                    {p.bodega_nombre}
                  </span>
                  <span className="italic">
                    {fecha && formatDistanceToNow(fecha, { addSuffix: true, locale: es })}
                  </span>
                </div>

                {/* Badge de cantidad afectada */}
                <div className="mt-2 text-[10px] bg-background/50 self-start px-2 py-0.5 rounded border">
                  Stock afectado: <span className="font-bold">{p.cantidad_vencida || p.cantidad} {p.unidad}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isExpired && data.length > 0 && (
        <p className="mt-4 text-[10px] text-destructive font-medium bg-red-50 p-2 rounded">
          ⚠️ Se recomienda realizar una baja de inventario (Merma) para estos productos.
        </p>
      )}
    </div>
  );
}