// src/pages/Consumo/ConsumoLog.tsx
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ConsumptionRecord } from "./types";
import { cn } from "../../lib/utils";

interface LogProps {
  records: ConsumptionRecord[];
  onRefresh: () => void;
}

export function ConsumoLog({ records, onRefresh }: LogProps) {
  const [logDate, setLogDate] = useState(new Date());

  const filteredRecords = records.filter(r => {
    const recordDate = format(new Date(r.created_at), "yyyy-MM-dd");
    const selectedDate = format(logDate, "yyyy-MM-dd");
    return recordDate === selectedDate;
  });

  const totalConsumed = filteredRecords.reduce((sum, r) => sum + r.cantidad, 0);

  return (
    <aside className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Historial
        </h2>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Actualizar
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay consumos para esta fecha.
          </p>
        ) : (
          filteredRecords.map((record, idx) => (
            <div 
              key={record.id || idx} 
              className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 text-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{record.nombre_producto || "Producto"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(record.created_at), "HH:mm")}
                  {record.fecha_vencimiento && ` · Venc: ${format(new Date(record.fecha_vencimiento + "T00:00:00"), "dd/MM/yy")}`}
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-orange-600">
                  {record.cantidad}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredRecords.length > 0 && (
        <div className="border-t mt-4 pt-4">
          <p className="text-xs text-muted-foreground text-center">
            {filteredRecords.length} consumo(s) · Total: <span className="font-bold">{totalConsumed}</span>
          </p>
        </div>
      )}
    </aside>
  );
}