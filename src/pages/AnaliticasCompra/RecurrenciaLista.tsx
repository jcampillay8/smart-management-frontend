// src/pages/AnaliticasCompra/RecurrenciaLista.tsx

import { TrendingUp, TrendingDown, Package } from "lucide-react";
import { ProductoRecurrente } from "./types";
import { formatMoney } from "../../lib/format";

interface Props {
  data: ProductoRecurrente[];
}

export function RecurrenciaLista({ data }: Props) {
  // Separamos los más comprados de los menos comprados
  const topRecurrentes = [...data].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-muted-foreground uppercase">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          Productos más recurrentes
        </h3>
        
        {topRecurrentes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Sin datos de compras.</p>
        ) : (
          <div className="space-y-3">
            {topRecurrentes.map((item) => (
              <div key={item.id} className="flex items-center justify-between group">
                <div className="flex flex-col">
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {item.nombre}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {item.count} órdenes realizadas
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatMoney(item.totalGastado)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
        <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
          <Package className="h-4 w-4" /> Inteligencia de Stock
        </h4>
        <p className="text-xs text-indigo-600 leading-relaxed">
          Los productos con alta recurrencia y bajo costo unitario son candidatos ideales para compras por volumen (Stock Fijo).
        </p>
      </div>
    </div>
  );
}