// src/pages/Analiticas/index.tsx
import { useAnaliticas } from "./useAnaliticas";
import { useBodega } from "../../hooks/useBodega";
import { NotificacionesPanel } from "./NotificacionesPanel";
import { StockCriticoTable } from "./StockCriticoTable";
import { VencimientosCard } from "./VencimientosCard";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils"; // <--- AGREGAR ESTA LÍNEA

export default function AnaliticasPage() {
  const { selectedBodegaId } = useBodega();
  const { stockCritico, loading, refresh } = useAnaliticas(selectedBodegaId);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Inteligencia</h1>
          <p className="text-muted-foreground">Estado crítico de inventario y alertas preventivas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Actualizar
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Reporte
          </Button>
        </div>
      </header>

      {/* Grid de Reportes */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <StockCriticoTable data={stockCritico} />
          <div className="grid md:grid-cols-2 gap-6">
            <VencimientosCard type="upcoming" data={[]} />
            <VencimientosCard type="expired" data={[]} />
          </div>
        </div>
        
        <aside>
          <NotificacionesPanel notifications={[]} />
        </aside>
      </div>
    </div>
  );
}