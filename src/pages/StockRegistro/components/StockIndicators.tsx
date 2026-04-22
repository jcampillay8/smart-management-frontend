// src/pages/StockRegistro/components/StockIndicators.tsx
import { AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../components/ui/tooltip";
import { cn } from "../../../lib/utils";
import { InventoryLot } from "../types";
import { differenceInDays, parseISO } from "date-fns";

interface StockIndicatorsProps {
  lots: InventoryLot[];
  stockMinimo: number;
  totalStock: number;
}

export function StockIndicators({ lots, stockMinimo, totalStock }: StockIndicatorsProps) {
  const today = new Date();
  
  // 1. Cálculos de estado de vencimiento
  const hasExpired = lots.some(l => l.fecha_vencimiento && parseISO(l.fecha_vencimiento) < today && l.cantidad > 0);
  const isCloseToExpiration = lots.some(l => {
    if (!l.fecha_vencimiento || l.cantidad <= 0) return false;
    const days = differenceInDays(parseISO(l.fecha_vencimiento), today);
    return days >= 0 && days <= 7; // Alerta si vence en menos de 7 días
  });

  // 2. Cálculo de stock crítico
  const isLowStock = totalStock > 0 && totalStock <= stockMinimo;
  const isOutOfStock = totalStock <= 0;

  return (
    <div className="flex items-center gap-1.5">
      <TooltipProvider delayDuration={100}>
        
        {/* Indicador de Vencimiento */}
        {hasExpired ? (
          <Tooltip>
            <TooltipTrigger>
              <XCircle className="h-4 w-4 text-destructive animate-pulse" />
            </TooltipTrigger>
            <TooltipContent className="bg-destructive text-destructive-foreground">
              <p className="text-xs font-bold">PRODUCTO VENCIDO</p>
            </TooltipContent>
          </Tooltip>
        ) : isCloseToExpiration ? (
          <Tooltip>
            <TooltipTrigger>
              <Clock className="h-4 w-4 text-orange-500 animate-bounce" />
            </TooltipTrigger>
            <TooltipContent className="bg-orange-500 text-white">
              <p className="text-xs font-bold">VENCE PRONTO ({"<"} 7 días)</p>
            </TooltipContent>
          </Tooltip>
        ) : totalStock > 0 ? (
          <Tooltip>
            <TooltipTrigger>
              <CheckCircle2 className="h-4 w-4 text-green-500/50" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Estado de lotes OK</p>
            </TooltipContent>
          </Tooltip>
        ) : null}

        {/* Indicador de Stock Crítico */}
        {isOutOfStock ? (
          <Tooltip>
            <TooltipTrigger>
              <div className="px-1.5 py-0.5 rounded text-[9px] font-black bg-destructive/10 text-destructive border border-destructive/20">
                SIN STOCK
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-bold">No hay existencias en esta bodega</p>
            </TooltipContent>
          </Tooltip>
        ) : isLowStock ? (
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </TooltipTrigger>
            <TooltipContent className="bg-yellow-500 text-white">
              <p className="text-xs font-bold">STOCK MÍNIMO ALCANZADO</p>
              <p className="text-[10px]">Mínimo: {stockMinimo}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}

      </TooltipProvider>
    </div>
  );
}