// src/pages/Consumo/ConsumoLog.tsx
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ConsumptionRecord } from "./types";
import { cn } from "../../lib/utils";

interface LogProps {
  records: ConsumptionRecord[];
  onRefresh: () => void;
  onEdit?: (record: ConsumptionRecord) => void;
  onDelete?: (record: ConsumptionRecord) => void;
}

export function ConsumoLog({ records, onRefresh, onEdit, onDelete }: LogProps) {
  const [logDate, setLogDate] = useState(new Date());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredRecords = records.filter(r => {
    const recordDate = format(new Date(r.created_at), "yyyy-MM-dd");
    const selectedDate = format(logDate, "yyyy-MM-dd");
    return recordDate === selectedDate;
  });

  // Group by receta_consumo_id — only show one row per recipe consumption group
  const uniqueRecords: ConsumptionRecord[] = [];
  const seenGroups = new Set<string>();
  for (const r of filteredRecords) {
    if (r.receta_consumo_id) {
      if (!seenGroups.has(r.receta_consumo_id)) {
        seenGroups.add(r.receta_consumo_id);
        uniqueRecords.push(r);
      }
    } else {
      uniqueRecords.push(r);
    }
  }

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

      {/* Date nav */}
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
          const d = new Date(logDate); d.setDate(d.getDate() - 1); setLogDate(d);
        }}>‹</Button>
        <span className="text-xs text-muted-foreground flex-1 text-center font-medium">
          {format(logDate, "EEEE d 'de' MMMM", { locale: es })}
        </span>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
          const d = new Date(logDate); d.setDate(d.getDate() + 1); setLogDate(d);
        }}>›</Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {uniqueRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay consumos para esta fecha.
          </p>
        ) : (
          uniqueRecords.map((record, idx) => (
            <div
              key={record.id || idx}
              className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 text-sm relative group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{record.nombre_producto || record.nombre_receta || "Producto"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(record.created_at), "HH:mm")}
                  {record.receta_consumo_id && <span className="ml-1 text-primary">· Receta</span>}
                  {record.fecha_vencimiento && ` · Venc: ${format(new Date(record.fecha_vencimiento + "T00:00:00"), "dd/MM/yy")}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-orange-600 shrink-0">
                  {record.cantidad}
                </span>
                {(onEdit || onDelete) && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === record.id ? null : record.id)}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                    {openMenuId === record.id && (
                      <div className="absolute right-0 bottom-7 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[130px]">
                        {onEdit && (
                          <button
                            onClick={() => { onEdit(record); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary text-left"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => { onDelete(record); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-destructive/10 text-destructive text-left"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {uniqueRecords.length > 0 && (
        <div className="border-t mt-4 pt-4">
          <p className="text-xs text-muted-foreground text-center">
            {uniqueRecords.length} registro(s) · Total: <span className="font-bold">{totalConsumed}</span>
          </p>
        </div>
      )}
    </aside>
  );
}