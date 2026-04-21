// src/pages/Dashboard/AlertasList.tsx

import { AlertTriangle, PackageSearch, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Alerta {
  id: string;
  producto: string;
  mensaje: string;
  nivel: "critico" | "advertencia";
}

export function AlertasList({ cantidad, alertas = [] }: { cantidad: number, alertas?: Alerta[] }) {
  
  // Si no hay alertas, mostramos un estado de "Todo en orden"
  if (cantidad === 0) {
    return (
      <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center border border-white/10">
        <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert size={32} />
        </div>
        <h3 className="font-bold text-lg text-foreground">Inventario Seguro</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
          No hay productos bajo el stock mínimo en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Alertas Críticas
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground animate-pulse">
            {cantidad}
          </span>
        </h2>
      </div>

      <div className="space-y-3">
        {/* En una versión real, mapearías 'alertas' de la API. 
            Aquí simulamos el diseño basado en tu Dashboard original */}
        {alertas.length > 0 ? (
          alertas.map((alerta) => (
            <div 
              key={alerta.id} 
              className={cn(
                "glass-card p-4 rounded-2xl flex gap-4 items-center border-l-4 transition-transform hover:scale-[1.02]",
                alerta.nivel === "critico" ? "border-l-destructive bg-destructive/5" : "border-l-warning bg-warning/5"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                alerta.nivel === "critico" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
              )}>
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{alerta.producto}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{alerta.mensaje}</p>
              </div>
            </div>
          ))
        ) : (
          /* Placeholder de carga o fallback */
          <div className="glass-card p-4 rounded-2xl flex gap-4 items-center border-l-4 border-l-destructive bg-destructive/5 animate-pulse">
             <div className="h-10 w-10 bg-destructive/20 rounded-xl shrink-0" />
             <div className="space-y-2 flex-1">
                <div className="h-3 bg-destructive/20 rounded w-3/4" />
                <div className="h-2 bg-destructive/10 rounded w-1/2" />
             </div>
          </div>
        )}
      </div>

      <Link to="/inventario" className="block">
        <Button 
          variant="outline" 
          className="w-full py-6 glass-card rounded-2xl text-primary font-bold hover:bg-primary hover:text-white transition-all group"
        >
          <PackageSearch className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
          Gestionar Inventario 
          <ArrowRight className="ml-auto h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}