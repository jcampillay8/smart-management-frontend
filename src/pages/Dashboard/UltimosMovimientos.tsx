// src/pages/Dashboard/UltimosMovimientos.tsx

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw, 
  Trash2, 
  History,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Movimiento {
  id: string;
  producto_nombre: string; // Asumiendo que el backend o el hook ya mapeó el nombre
  tipo_movimiento: string;
  cantidad: number;
  created_at: string;
  user_display_name?: string;
}

export function UltimosMovimientos({ movimientos, loading }: { movimientos: any[], loading: boolean }) {
  
  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "compra": return { icon: ArrowUpRight, color: "text-emerald-500", bg: "bg-emerald-500/10" };
      case "consumo": return { icon: ArrowDownLeft, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "merma": return { icon: Trash2, color: "text-red-500", bg: "bg-red-500/10" };
      case "conteo": return { icon: RefreshCcw, color: "text-amber-500", bg: "bg-amber-500/10" };
      default: return { icon: History, color: "text-slate-500", bg: "bg-slate-500/10" };
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-6 h-[400px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-8 w-8 bg-muted rounded-full animate-spin border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Sincronizando bitácora...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            Actividad Reciente
          </h3>
          <p className="text-xs text-muted-foreground">Últimos movimientos registrados en el sistema</p>
        </div>
        <Link to="/historial">
          <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            Ver todo <ChevronRight size={14} />
          </button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/20">
              <th className="px-6 py-4 font-black">Producto</th>
              <th className="px-6 py-4 font-black">Tipo</th>
              <th className="px-6 py-4 font-black">Cantidad</th>
              <th className="px-6 py-4 font-black text-right">Tiempo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {movimientos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground italic text-sm">
                  No se registran movimientos hoy.
                </td>
              </tr>
            ) : (
              movimientos.map((m) => {
                const style = getIcon(m.tipo_movimiento);
                return (
                  <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl shrink-0", style.bg)}>
                          <style.icon size={18} className={style.color} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold truncate max-w-[150px]">
                            {m.producto_nombre || "Producto Desconocido"}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                            Por: {m.user_display_name || "Sistema"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-[10px] font-black px-2 py-1 rounded-md uppercase border", style.bg, style.color, "border-current/10")}>
                        {m.tipo_movimiento}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-sm">
                        {m.tipo_movimiento === "consumo" || m.tipo_movimiento === "merma" ? "-" : "+"}
                        {m.cantidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}