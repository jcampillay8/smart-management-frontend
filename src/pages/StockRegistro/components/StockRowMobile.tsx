// src/pages/StockRegistro/components/StockRowMobile.tsx
import { Input } from "../../../components/ui/input";
import { Checkbox } from "../../../components/ui/checkbox";
import { StockEntry, DisplayProduct } from "../types";
import { cn } from "../../../lib/utils";
import BodegaBadge from "../../../components/BodegaBadge";

export function StockRowMobile({ product, entry, canEdit, onUpdate, isHighlighted }: any) {
  if (!entry) return null;

  const totalQty = entry.multiExpiry 
    ? entry.expiryEntries.reduce((acc: number, curr: any) => acc + (parseFloat(curr.cantidad) || 0), 0)
    : parseFloat(entry.cantidad) || 0;

  const isCritical = totalQty <= (product.stock_minimo || 0);

  return (
    <div className={cn(
      "p-4 rounded-2xl border border-input space-y-4 transition-all",
      isCritical ? "bg-destructive/10 border-destructive/30" : "bg-card",
      isHighlighted && "ring-2 ring-primary"
    )}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="font-bold text-foreground leading-none">{product.nombre}</h3>
          <div className="flex items-center gap-2">
            {product._bodegaName && <BodegaBadge nombre={product._bodegaName} />}
            <span className="text-[10px] text-muted-foreground uppercase font-black">{product.unidad}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-muted-foreground uppercase font-bold block">Stock / Mín</span>
          <span className={cn("text-sm font-mono font-black", isCritical ? "text-destructive" : "text-primary")}>
            {totalQty} / {product.stock_minimo}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-muted-foreground uppercase">Recuento</label>
          <Input 
            type="date" 
            value={entry.fecha_recuento} 
            onChange={(e) => onUpdate(product._entryKey, "fecha_recuento", e.target.value)}
            className="h-9 text-[11px] bg-background border-input"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-muted-foreground uppercase text-right block">Vencimiento</label>
          <Input 
            type="date" 
            value={entry.fecha_vencimiento} 
            disabled={entry.multiExpiry}
            onChange={(e) => onUpdate(product._entryKey, "fecha_vencimiento", e.target.value)}
            className="h-9 text-[11px] bg-background border-input"
          />
        </div>
      </div>

      {!entry.multiExpiry && (
        <div className="pt-2">
          <label className="text-[9px] font-black text-muted-foreground uppercase block mb-1.5 text-center">Cantidad</label>
          <Input 
            type="number" 
            value={entry.cantidad}
            onChange={(e) => onUpdate(product._entryKey, "cantidad", e.target.value)}
            className="h-10 text-center font-mono font-black bg-background border-input"
          />
        </div>
      )}

      <div className="flex items-center justify-center gap-2 pt-2 border-t border-input">
        <Checkbox 
          checked={entry.multiExpiry} 
          onCheckedChange={(c) => onUpdate(product._entryKey, "multiExpiry", !!c)}
        />
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Gestionar múltiples lotes</span>
      </div>
    </div>
  );
}