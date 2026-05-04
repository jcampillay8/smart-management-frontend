// src/pages/StockRegistro/StockActions.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { 
  ArrowLeftRight, 
  AlertTriangle, 
  Search,
  Settings2,
  Truck
} from "lucide-react";
import { Input } from "../../../components/ui/input";
import BodegaSelector from "../../../components/BodegaSelector";
import { AreaSelector } from "../../../components/AreaSelector";

interface StockActionsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenTransfer: () => void;
  onOpenMerma: () => void;
  onOpenAdjustment: () => void;
  onOpenAddingMenu: (mode: "pedidos" | "libre" | "barcode" | "factura") => void;
}

export function StockActions({
  searchTerm,
  onSearchChange,
  onOpenTransfer,
  onOpenMerma,
  onOpenAdjustment,
  onOpenAddingMenu,
}: StockActionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-card backdrop-blur-md p-4 rounded-2xl border border-input shadow-xl">
        
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 w-full">
          {/* Selectores de Área y Bodega Integrados */}
          <div className="flex items-center gap-2 w-full sm:w-auto bg-muted/50 p-1.5 rounded-xl border border-input shadow-inner shrink-0">
            <AreaSelector />
            <BodegaSelector />
          </div>

          <div className="hidden sm:block w-[1px] h-8 bg-border mx-1" />

          {/* Buscador de alta visibilidad (Solo PC/Tablet en este contenedor) */}
          <div className="hidden md:relative md:flex md:flex-1 group max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-primary/10 transition-colors group-focus-within:bg-primary/20">
              <Search className="h-3.5 w-3.5 text-primary" />
            </div>
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 bg-background border-input rounded-xl text-sm font-medium transition-all focus:ring-primary/20 w-full"
            />
          </div>
        </div>

        {/* Grupo de Acciones (Ahora a la derecha) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Recibir */}
          <Button 
            onClick={() => onOpenAddingMenu("pedidos")}
            className="h-10 px-4 gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10 transition-all active:scale-95 flex-1 sm:flex-none"
          >
            <Truck className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-wider">Recibir</span>
          </Button>

          {/* Mover */}
          <Button 
            variant="outline" 
            onClick={onOpenTransfer}
            className="h-10 px-4 gap-2 rounded-xl border-input hover:bg-blue-500/10 hover:text-blue-400 transition-all active:scale-95 flex-1 sm:flex-none"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-wider">Mover</span>
          </Button>

          {/* Ajustar */}
          <Button 
            variant="outline" 
            onClick={onOpenAdjustment}
            className="h-10 px-4 gap-2 rounded-xl border-input hover:bg-amber-500/10 hover:text-amber-400 transition-all active:scale-95 flex-1 sm:flex-none"
          >
            <Settings2 className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-wider">Ajustar</span>
          </Button>

          {/* Merma */}
          <Button 
            variant="destructive" 
            onClick={onOpenMerma}
            className="h-10 px-4 gap-2 rounded-xl shadow-lg shadow-destructive/10 transition-all hover:brightness-110 active:scale-95 flex-1 sm:flex-none"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-wider">Merma</span>
          </Button>
        </div>
      </div>
    </div>
  );
}