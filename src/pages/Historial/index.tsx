// src/pages/Historial/index.tsx
import { useHistorial } from "./useHistorial";
import { useBodega } from "../../hooks/useBodega";
import { TablaHistorial } from "./TablaHistorial";
import { FiltrosHistorial } from "./FiltrosHistorial";
import { History, Download } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function HistorialPage() {
  const { selectedBodegaId, bodegas } = useBodega();
  const { filtered, loading, filtros } = useHistorial(selectedBodegaId);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" /> Historial de Movimientos
          </h1>
          <p className="text-sm text-muted-foreground">Auditoría completa de entradas, salidas y mermas.</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </header>

      {/* Componente de Filtros que usa los estados del hook */}
      <FiltrosHistorial 
        tipo={filtros.tipo} 
        setTipo={filtros.setTipo} 
        fecha={filtros.fecha} 
        setFecha={filtros.setFecha} 
      />

      <TablaHistorial 
        data={filtered} 
        productos={[]} // Aquí pasarías tu lista de productos global
        bodegas={bodegas} 
      />
    </div>
  );
}