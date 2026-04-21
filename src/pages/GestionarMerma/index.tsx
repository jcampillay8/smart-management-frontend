// src/pages/GestionarMerma/index.tsx
import { useState } from "react";
import { TrendingDown, Plus, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useMerma } from "./useMerma";
import { MermaStats } from "./MermaStats";
import { MermaHistory } from "./MermaHistory";
import { MermaRegisterDialog } from "./MermaRegisterDialog";

export default function GestionarMerma() {
  const { mermas, productos, loading, stats, timeRange, setTimeRange, loadData } = useMerma();
  const [busqueda, setBusqueda] = useState("");
  const [isRegisterOpen, setRegisterOpen] = useState(false);

  if (loading) return <div className="p-8 text-center">Cargando analíticas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-destructive" /> Gestión de Mermas
          </h1>
          <p className="text-muted-foreground text-sm">Control y análisis de pérdidas de inventario</p>
        </div>
        <Button onClick={() => setRegisterOpen(true)} className="bg-destructive hover:bg-destructive/90 gap-2">
          <Plus className="h-4 w-4" /> Registrar Merma
        </Button>
      </div>

      <MermaStats data={mermas} totalLost={stats.totalLost} />

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por producto..." 
              className="pl-9 h-9" 
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <select 
            value={timeRange} 
            onChange={e => setTimeRange(e.target.value)}
            className="text-sm border rounded px-2 py-1 bg-background"
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mes</option>
            <option value="year">Último Año</option>
          </select>
        </div>
        
        <MermaHistory mermas={mermas} productos={productos} busqueda={busqueda} />
      </div>

      <MermaRegisterDialog 
        open={isRegisterOpen}
        onOpenChange={setRegisterOpen}
        onSuccess={loadData}
      />
    </div>
  );
}