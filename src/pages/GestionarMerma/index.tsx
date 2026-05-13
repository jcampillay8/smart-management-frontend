// src/pages/GestionarMerma/index.tsx
import { useState } from "react";
import { TrendingDown, Plus, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useMerma } from "./useMerma";
import { useBodega } from "../../hooks/useBodega";
import { MermaStats } from "./MermaStats";
import { MermaHistory } from "./MermaHistory";
import { MermaRegisterDialog } from "./MermaRegisterDialog";

const TIME_RANGES = [
  { value: "1w", label: "1 semana" },
  { value: "1m", label: "1 mes" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 año" },
];

export default function GestionarMerma() {
  const { selectedBodegaId } = useBodega();
  const {
    mermas,
    productos,
    loading,
    timeRange,
    setTimeRange,
    loadData,
    stats7d,
    stats30d,
    chartData,
    topProducts,
    tips,
    getMermaLevel,
    getProductName,
    getProductUnit,
  } = useMerma();

  const [busqueda, setBusqueda] = useState("");
  const [isRegisterOpen, setRegisterOpen] = useState(false);

  if (loading) return <div className="p-8 text-center">Cargando analíticas...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-card backdrop-blur-md p-4 rounded-2xl border border-input shadow-xl">
        <div className="flex justify-end">
          <Button 
            onClick={() => setRegisterOpen(true)} 
            className="h-10 px-4 gap-2 rounded-xl bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/10 transition-all active:scale-95 font-black text-[10px] uppercase tracking-widest"
          >
            <Plus className="h-4 w-4" /> Registrar Merma
          </Button>
        </div>
      </div>

      <MermaStats
        stats7d={stats7d}
        stats30d={stats30d}
        chartData={chartData}
        topProducts={topProducts}
        tips={tips}
        getMermaLevel={getMermaLevel}
      />

      <div className="bg-card rounded-2xl border border-input shadow-xl overflow-hidden">
        <div className="p-4 border-b bg-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full sm:max-w-md group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-primary/10 transition-colors group-focus-within:bg-primary/20">
              <Search className="h-3.5 w-3.5 text-primary" />
            </div>
            <Input 
              placeholder="Buscar por producto..." 
              className="pl-10 h-10 bg-background border-input rounded-xl text-sm font-medium transition-all focus:ring-primary/20 w-full" 
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          
          <div className="bg-muted/50 p-1 rounded-xl border border-input shadow-inner">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-9 w-40 bg-transparent border-0 shadow-none focus:ring-0 font-bold text-[10px] uppercase tracking-widest">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <MermaHistory 
          mermas={mermas} 
          productos={productos} 
          busqueda={busqueda}
          getProductName={getProductName}
          getProductUnit={getProductUnit}
        />
      </div>

      <MermaRegisterDialog 
        open={isRegisterOpen}
        onOpenChange={setRegisterOpen}
        onSuccess={loadData}
      />
    </div>
  );
}