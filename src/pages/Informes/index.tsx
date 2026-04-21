// src/pages/Informes/index.tsx
import { useInformes } from "./useInformes";
import { GraficosInventario } from "./GraficosInventario";
import { ExportadorInformes } from "./ExportadorInformes";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function InformesPage() {
  const { stockData, consumoData, mermaData, loading, refresh } = useInformes();

  return (
    <div className="space-y-6 pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Analíticas e Informes
          </h1>
          <p className="text-sm text-muted-foreground">Visualización de rendimiento y exportación de datos.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin h-4 w-4" : "h-4 w-4"} />
        </Button>
      </header>

      {loading ? (
        <div className="h-64 flex items-center justify-center italic text-muted-foreground">
          Generando visualizaciones...
        </div>
      ) : (
        <>
          <GraficosInventario 
            stockData={stockData} 
            consumoData={consumoData} 
            mermaData={mermaData} 
          />
          
          <ExportadorInformes />
        </>
      )}
    </div>
  );
}