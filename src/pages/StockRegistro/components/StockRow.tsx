// src/pages/StockRegistro/components/StockRow.tsx

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { Trash2, Plus, Calendar } from "lucide-react";
import { cn } from "../../../lib/utils";
import { StockEntry, DisplayProduct } from "../types";
import { TABLE_GRID_LAYOUT } from "./StockTable"; 

interface StockRowProps {
  product: DisplayProduct;
  entry: StockEntry;
  canEdit: boolean;
  isViewingAll: boolean;
  onUpdate: (key: string, field: keyof StockEntry, value: any) => void;
  isHighlighted: boolean;
  toggleMultiExpiry: (key: string, checked: boolean) => void;
  addExpiryEntry: (key: string) => void;
  removeExpiryEntry: (key: string, idx: number) => void;
  updateExpiryEntry: (key: string, idx: number, field: string, value: any) => void;
}

export function StockRow({ 
  product, 
  entry, 
  canEdit, 
  onUpdate, 
  isHighlighted,
  toggleMultiExpiry,
  addExpiryEntry,
  removeExpiryEntry,
  updateExpiryEntry
}: StockRowProps) {
  
  if (!entry) return null;

  return (
    <div className="flex flex-col w-full border-b border-input">
      <div className={cn(
        TABLE_GRID_LAYOUT, 
        "py-4 transition-colors hover:bg-muted/10 w-full",
        isHighlighted && "bg-primary/5"
      )}>
        {/* COL 1: PRODUCTO */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm truncate">{product.nombre}</span>
            {/* SOLUCIÓN AL ERROR TS2339: Usamos stock_actual definido en la interfaz */}
            {product.stock_actual <= (product.stock_minimo || 0) && (
               <span className="text-[8px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                 Stock Bajo
               </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground uppercase">{product.unidad}</span>
        </div>
        
        {/* COL 2: CANTIDAD */}
        <div className="flex items-center gap-2">
           <Input 
             disabled={!canEdit || entry.multiExpiry}
             className="w-20 h-9 bg-card border-input text-center font-mono text-sm"
             value={entry.multiExpiry ? "" : entry.cantidad}
             placeholder={entry.multiExpiry ? "---" : "0"}
             onChange={(e) => onUpdate(product._entryKey, "cantidad", e.target.value)}
           />
           <span className="text-muted-foreground text-[10px] font-bold">/ {product.stock_minimo || 0}</span>
        </div>

        {/* COL 3: UNIDAD */}
        <div className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">
          {product.unidad}
        </div>

        {/* COL 4: RECUENTO */}
        <div>
          <Input 
            type="date"
            disabled={!canEdit}
            className="h-9 bg-card border-input text-[11px] w-full px-2"
            value={entry.fecha_recuento}
            onChange={(e) => onUpdate(product._entryKey, "fecha_recuento", e.target.value)}
          />
        </div>

        {/* COL 5: VENCIMIENTO */}
        <div className="relative">
          <Input 
            type="date"
            disabled={!canEdit}
            className={cn(
              "h-9 bg-card border-input text-[11px] w-full px-2",
              entry.multiExpiry && "opacity-0 pointer-events-none"
            )}
            value={entry.fecha_vencimiento}
            onChange={(e) => onUpdate(product._entryKey, "fecha_vencimiento", e.target.value)}
          />
        </div>

        {/* COL 6: CHECKBOX */}
        <div className="flex justify-center">
          <Checkbox 
            disabled={!canEdit}
            checked={entry.multiExpiry}
            onCheckedChange={(val) => toggleMultiExpiry(product._entryKey, !!val)}
            className="border-input data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      {/* PANEL MULTI-LOTE */}
      {entry.multiExpiry && (
        <div className="bg-secondary/30 border-t border-input p-6 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Desglose de Lotes</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => addExpiryEntry(product._entryKey)}
              className="h-7 text-[9px] uppercase font-black hover:bg-primary/10 text-primary"
            >
              <Plus className="h-3 w-3 mr-1" /> Nuevo Lote
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {entry.expiryEntries.map((ee, idx) => (
              <div key={idx} className="flex items-center gap-3 group">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input 
                      type="date"
                      className="h-8 bg-card border-input pl-8 text-[11px]"
                      value={ee.fecha_vencimiento}
                      onChange={(e) => updateExpiryEntry(product._entryKey, idx, "fecha_vencimiento", e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Input 
                      placeholder="Cant."
                      className="h-8 bg-card border-input text-right pr-8 font-mono text-[11px]"
                      value={ee.cantidad}
                      onChange={(e) => updateExpiryEntry(product._entryKey, idx, "cantidad", e.target.value)}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground font-bold uppercase">{product.unidad}</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                  onClick={() => removeExpiryEntry(product._entryKey, idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}