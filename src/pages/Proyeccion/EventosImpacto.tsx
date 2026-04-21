// src/pages/Proyeccion/EventosImpacto.tsx

import { Calendar, AlertCircle, ArrowDownRight } from "lucide-react";
import { ProyeccionDataPoint } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  data: ProyeccionDataPoint[];
  unidad: string;
}

export function EventosImpacto({ data, unidad }: Props) {
  // Filtramos solo los días que tienen eventos asociados
  const diasConEventos = data.filter((d) => d.events && d.events.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" /> Eventos con Impacto en Stock
        </h3>
        <span className="text-[10px] bg-secondary px-2 py-1 rounded-md font-medium">
          {diasConEventos.length} días afectados
        </span>
      </div>

      <div className="grid gap-3">
        {diasConEventos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-muted/10">
            <p className="text-sm text-muted-foreground italic">
              No hay eventos programados que consuman este insumo en el periodo seleccionado.
            </p>
          </div>
        ) : (
          diasConEventos.map((dia, idx) => {
            const totalConsumoDia = dia.events?.reduce((acc, curr) => acc + curr.qty, 0) || 0;

            return (
              <div 
                key={idx} 
                className={cn(
                  "group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border bg-card transition-all hover:shadow-md",
                  dia.stock <= 0 ? "border-destructive/30 bg-destructive/5" : "hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center bg-muted rounded-lg h-12 w-12 border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      {dia.label.split(" ")[1]}
                    </span>
                    <span className="text-lg font-black leading-none">
                      {dia.label.split(" ")[0]}
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {dia.events?.map((ev, eIdx) => (
                        <span 
                          key={eIdx} 
                          className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                        >
                          {ev.name}
                        </span>
                      ))}
                    </div>
                    {dia.stock <= 0 && (
                      <p className="text-[10px] text-destructive font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> QUIEBRE DE STOCK ESTIMADO
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 md:mt-0 flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Consumo Total</p>
                    <p className="text-sm font-black flex items-center justify-end text-orange-600">
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                      {totalConsumoDia} {unidad}
                    </p>
                  </div>
                  
                  <div className="text-right border-l pl-4">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Stock Final</p>
                    <p className={cn(
                      "text-sm font-black",
                      dia.stock <= 0 ? "text-destructive" : "text-foreground"
                    )}>
                      {dia.stock} {unidad}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}