// src/pages/StockRegistro/components/StockActions.tsx

import { Button } from "../../../components/ui/button";
import { 
  ArrowLeftRight, 
  AlertTriangle, 
  Settings2,
  Truck,
  ArrowUpDown,
  Tags
} from "lucide-react";
import BodegaSelector from "../../../components/BodegaSelector";
import { AreaSelector } from "../../../components/AreaSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

interface StockActionsProps {
  onOpenTransfer: () => void;
  onOpenMerma: () => void;
  onOpenAdjustment: () => void;
  onOpenAddingMenu: (mode: "pedidos" | "libre" | "barcode" | "factura") => void;
  showCategories: boolean;
  onToggleCategories: () => void;
  sortOption: string;
  onSortChange: (val: string) => void;
}

export function StockActions({
  onOpenTransfer,
  onOpenMerma,
  onOpenAdjustment,
  onOpenAddingMenu,
  showCategories,
  onToggleCategories,
  sortOption,
  onSortChange
}: StockActionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card backdrop-blur-md p-4 rounded-2xl border border-input shadow-xl relative z-50">
        
        {/* Selectores de Área y Bodega Integrados */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:items-center sm:w-auto bg-muted/50 p-1.5 rounded-xl border border-input shadow-inner shrink-0">
            <AreaSelector buttonClassName="w-full min-w-0 sm:min-w-[180px]" />
            <BodegaSelector className="w-full min-w-0 sm:min-w-[160px]" />
          </div>
        </div>

        {/* Grupo de Acciones - Rediseñado según la solicitud */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Recibir */}
          <Button 
            onClick={() => onOpenAddingMenu("pedidos")}
            className="h-10 px-4 gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10 transition-all active:scale-95 flex-1 sm:flex-none"
          >
            <Truck className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-wider">Recibir</span>
          </Button>

          {/* Transferir (ex Mover) */}
          <Button 
            variant="outline" 
            onClick={onOpenTransfer}
            className="h-10 px-4 gap-2 rounded-xl border-input hover:bg-blue-500/10 hover:text-blue-400 transition-all active:scale-95 flex-1 sm:flex-none"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-wider">Transferir</span>
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

          {/* Ordenar por Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 px-4 gap-2 rounded-xl border-input hover:bg-secondary transition-all active:scale-95 flex-1 sm:flex-none">
                <ArrowUpDown className="h-4 w-4" />
                <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Ordenar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup value={sortOption} onValueChange={onSortChange}>
                <DropdownMenuRadioItem value="urgency" className="text-xs font-bold">Urgencia (Rojo → Verde)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="az" className="text-xs font-bold">Alfabético (A - Z)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="za" className="text-xs font-bold">Alfabético (Z - A)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Categorías Toggle */}
          <Button 
            variant={showCategories ? "default" : "outline"}
            onClick={onToggleCategories}
            className="h-10 px-4 gap-2 rounded-xl border-input transition-all active:scale-95 flex-1 sm:flex-none"
          >
            <Tags className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Categorías</span>
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