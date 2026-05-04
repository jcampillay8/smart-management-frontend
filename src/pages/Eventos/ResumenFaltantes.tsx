// src/pages/Eventos/ResumenFaltantes.tsx

import { useMemo } from "react";
import { Evento, Producto } from "./types";
import { AlertTriangle, ShoppingCart, Package } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";

interface Props {
  eventos: Evento[];
  stocks: any[];
  productos: Producto[];
}

export function ResumenFaltantes({ eventos, stocks, productos }: Props) {
  const faltantes = useMemo(() => {
    const summary: Record<string, { 
      producto_id: string; 
      nombre: string; 
      unidad: string;
      necesario: number; 
      disponible: number; 
    }> = {};

    // Solo eventos agendados (no cancelados, no ejecutados)
    const proximos = eventos.filter(e => !e.cancelado && !e.ejecutado);

    proximos.forEach(ev => {
      ev.items.forEach(item => {
        if (!summary[item.producto_id]) {
          const p = productos.find(x => x.id === item.producto_id);
          const stockItems = stocks.filter(s => s.producto_id === item.producto_id);
          const totalStock = stockItems.reduce((sum, s) => sum + (s.stock_actual || 0), 0);
          
          summary[item.producto_id] = {
            producto_id: item.producto_id,
            nombre: p?.nombre || "—",
            unidad: p?.unidad || "",
            necesario: 0,
            disponible: totalStock
          };
        }
        summary[item.producto_id].necesario += item.cantidad;
      });
    });

    return Object.values(summary).filter(s => s.necesario > s.disponible);
  }, [eventos, stocks, productos]);

  const exportCSV = () => {
    if (faltantes.length === 0) return;
    const rows = [["Producto", "Necesario", "Disponible", "Faltante", "Unidad"]];
    faltantes.forEach(f => {
      rows.push([f.nombre, String(f.necesario), String(f.disponible), String(f.necesario - f.disponible), f.unidad]);
    });
    const csvContent = "\uFEFF" + rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pedido_sugerido_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (faltantes.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black flex items-center gap-2 text-amber-600 uppercase tracking-tight">
          <AlertTriangle className="h-4 w-4" /> Stock Faltante para Eventos
        </h3>
        <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
          {faltantes.length} Productos
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {faltantes.map(f => (
          <div key={f.producto_id} className="flex items-center justify-between p-2 rounded-xl bg-background/50 border border-amber-500/10">
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{f.nombre}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Faltan: {f.necesario - f.disponible} {f.unidad}</p>
            </div>
            <div className="text-right shrink-0">
               <span className="text-[10px] font-black text-amber-600">{f.disponible} / {f.necesario}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={exportCSV}
          className="h-8 rounded-lg text-[10px] font-black uppercase gap-2 border-amber-500/20 text-amber-700 hover:bg-amber-500/10"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Descargar Pedido Sugerido (CSV)
        </Button>
      </div>
    </div>
  );
}
