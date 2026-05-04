// src/pages/Analiticas/index.tsx
import { useState, useEffect } from "react";
import { useAnaliticas } from "./useAnaliticas";
import { useBodega } from "../../hooks/useBodega";
import { useAuth } from "../../hooks/useAuth";
import { useNotas } from "./useNotas";
import { NotificacionesPanel } from "./NotificacionesPanel";
import { StockCriticoTable } from "./StockCriticoTable";
import { VencimientosCard } from "./VencimientosCard";
import { NotaCard } from "./NotaCard";
import { NotaDialog } from "./NotaDialog";
import { FileSpreadsheet, RefreshCw, Plus, StickyNote, Bell } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

type Tab = "notas" | "alertas";

export default function AnaliticasPage() {
  const { selectedBodegaId } = useBodega();
  const { stockCritico, loading: alertLoading, refresh: refreshAlertas, notifications, data } = useAnaliticas(selectedBodegaId);

  const vencimientosProximos = data.filter(p => p.cantidad > 0 && p.fecha_vencimiento);
  const vencidos = data.filter(p => p.cantidad_vencida > 0);

  // Persistir badge de alertas en localStorage y disparar evento
  useEffect(() => {
    const total = notifications.length;
    const critical = notifications.some(n => n.type === "critical");
    localStorage.setItem("notif_total_count", String(total));
    localStorage.setItem("notif_has_critical", String(critical));
    window.dispatchEvent(new Event("notif-updated"));
  }, [notifications]);

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2 mb-2">
        <div className="space-y-1 shrink-0">
          <h1 className="text-4xl font-black tracking-tighter">Alertas</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Estado de Stock y Vencimientos del Sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshAlertas} disabled={alertLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", alertLoading && "animate-spin")} /> Actualizar
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <StockCriticoTable data={stockCritico} />
          <div className="grid md:grid-cols-2 gap-6">
            <VencimientosCard type="upcoming" data={vencimientosProximos} />
            <VencimientosCard type="expired" data={vencidos} />
          </div>
        </div>
        <aside>
          <NotificacionesPanel notifications={notifications} />
        </aside>
      </div>
    </div>
  );
}