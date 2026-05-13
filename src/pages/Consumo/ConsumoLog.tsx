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
  const uniqueRecords: { record: ConsumptionRecord; ingredients: ConsumptionRecord[] }[] = [];
  const recipeGroups: Record<string, ConsumptionRecord[]> = {};
  
  filteredRecords.forEach(r => {
    if (r.receta_consumo_id) {
      if (!recipeGroups[r.receta_consumo_id]) recipeGroups[r.receta_consumo_id] = [];
      recipeGroups[r.receta_consumo_id].push(r);
    }
  });

  const seenGroups = new Set<string>();
  for (const r of filteredRecords) {
    if (r.receta_consumo_id) {
      if (!seenGroups.has(r.receta_consumo_id)) {
        seenGroups.add(r.receta_consumo_id);
        uniqueRecords.push({ record: r, ingredients: recipeGroups[r.receta_consumo_id] });
      }
    } else {
      uniqueRecords.push({ record: r, ingredients: [] });
    }
  }

  const totalItems = uniqueRecords.length;

  return (
    <aside className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-base uppercase tracking-tighter flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" /> Historial de Consumo
        </h2>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-2 mb-4 bg-muted/30 p-1.5 rounded-xl border">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-background shadow-sm" onClick={() => {
          const d = new Date(logDate); d.setDate(d.getDate() - 1); setLogDate(d);
        }}>‹</Button>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex-1 text-center">
          {format(logDate, "EEEE d 'de' MMMM", { locale: es })}
        </span>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-background shadow-sm" onClick={() => {
          const d = new Date(logDate); d.setDate(d.getDate() + 1); setLogDate(d);
        }}>›</Button>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        {uniqueRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
            <Calendar className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest italic">Sin registros</p>
          </div>
        ) : (
          uniqueRecords.map(({ record, ingredients }, idx) => (
            <div
              key={record.id || idx}
              className="flex flex-col p-3 rounded-2xl border bg-secondary/5 text-sm relative group transition-all hover:border-primary/30"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-black uppercase tracking-tighter text-xs truncate">
                    {record.nombre_receta || record.nombre_producto || "Consumo"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground">
                      {format(new Date(record.created_at), "HH:mm")}
                    </span>
                    <span className="text-[9px] font-black uppercase text-primary/70">
                      · {record.user_display_name || "Sistema"}
                    </span>
                    {record.receta_consumo_id && <span className="text-[9px] font-black uppercase text-purple-500">· RECETA</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-primary">
                    {record.cantidad}
                  </span>
                  {(onEdit || onDelete) && !record.receta_consumo_id && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === record.id ? null : record.id)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                      {openMenuId === record.id && (
                        <div className="absolute right-0 bottom-8 bg-card border border-border rounded-xl shadow-xl z-20 min-w-[120px] overflow-hidden">
                          {onEdit && (
                            <button
                              onClick={() => { onEdit(record); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-secondary text-left"
                            >
                              <Pencil className="h-3 w-3" /> Editar
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => { onDelete(record); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-destructive/10 text-destructive text-left"
                            >
                              <Trash2 className="h-3 w-3" /> Eliminar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {record.receta_consumo_id && onDelete && (
                     <button
                        onClick={() => onDelete(record)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                  )}
                </div>
              </div>

              {ingredients.length > 0 && (
                <div className="mt-2 pl-3 border-l-2 border-dashed border-primary/20 space-y-1">
                  {ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between text-[9px] text-muted-foreground font-medium italic">
                      <span>• {ing.nombre_producto}</span>
                      <span className="font-bold">{ing.cantidad}</span>
                    </div>
                  ))}
                </div>
              )}

              {record.motivo_merma && (
                <div className="mt-2 p-1.5 rounded-lg bg-destructive/5 border border-destructive/10 text-[9px] text-destructive italic">
                  Merma: {record.motivo_merma}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {uniqueRecords.length > 0 && (
        <div className="border-t mt-4 pt-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {totalItems} Registro(s) en total
          </p>
        </div>
      )}
    </aside>
  );
}