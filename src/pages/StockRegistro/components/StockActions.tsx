// src/pages/StockRegistro/StockActions.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { 
  PackagePlus, 
  ArrowLeftRight, 
  AlertTriangle, 
  Search,
  Settings2,
  Plus
} from "lucide-react";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../lib/utils";

interface StockActionsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenTransfer: () => void;
  onOpenMerma: () => void;
  onOpenAdjustment: () => void; // NUEVO prop
  isViewingAll: boolean;
}

export function StockActions({
  searchTerm,
  onSearchChange,
  onOpenTransfer,
  onOpenMerma,
  onOpenAdjustment,
  isViewingAll
}: StockActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl">
      
      {/* Buscador de alta visibilidad */}
      <div className="relative w-full xl:w-[450px] group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 transition-colors group-focus-within:bg-primary/20">
          <Search className="h-4 w-4 text-primary" />
        </div>
        <Input
          placeholder="Filtrar por nombre de producto..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 h-12 bg-muted/20 border-white/5 rounded-xl text-sm font-medium transition-all focus:ring-primary/20 focus:bg-muted/40"
        />
      </div>

      {/* Grupo de Acciones Rápidas */}
      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
        
        {/* Entrada de Stock (Redirección) */}
        <Button 
          variant="outline" 
          onClick={() => navigate("/compras")}
          className="h-11 px-5 gap-2.5 rounded-xl border-white/10 hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Entrada</span>
        </Button>

        {/* Transferencia */}
        <Button 
          variant="outline" 
          onClick={onOpenTransfer}
          className="h-11 px-5 gap-2.5 rounded-xl border-white/10 hover:bg-blue-500/10 hover:text-blue-400 transition-all active:scale-95"
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Mover</span>
        </Button>

        {/* Ajuste Manual (NUEVO) */}
        <Button 
          variant="outline" 
          onClick={onOpenAdjustment}
          className="h-11 px-5 gap-2.5 rounded-xl border-white/10 hover:bg-amber-500/10 hover:text-amber-400 transition-all active:scale-95"
        >
          <Settings2 className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Ajustar</span>
        </Button>

        <div className="hidden sm:block w-[1px] h-8 bg-white/5 mx-1" />

        {/* Merma (Destructivo) */}
        <Button 
          variant="destructive" 
          onClick={onOpenMerma}
          className="h-11 px-5 gap-2.5 rounded-xl shadow-lg shadow-destructive/10 transition-all hover:brightness-110 active:scale-95"
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Merma</span>
        </Button>
      </div>
    </div>
  );
}