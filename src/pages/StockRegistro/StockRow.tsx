// src/pages/StockRegistro/StockRow.tsx

import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { differenceInDays } from "date-fns";
import BodegaBadge from "../../components/BodegaBadge";
import { StockEntry, DisplayProduct, ExpiryEntry } from "./types";

interface StockRowProps {
  product: DisplayProduct;
  entry: StockEntry;
  canEdit: boolean;
  isViewingAll: boolean;
  onUpdate: (key: string, field: keyof StockEntry, value: any) => void;
  isHighlighted: boolean;
}

const INVARIANT_UNITS = new Set(["kg", "g", "mg", "L", "mL"]);

export function StockRow({ 
  product, 
  entry, 
  canEdit, 
  isViewingAll, 
  onUpdate, 
  isHighlighted 
}: StockRowProps) {
  const today = new Date().toISOString().split("T")[0];

  const pluralizeUnit = (unit: string, qty: number): string => {
    if (INVARIANT_UNITS.has(unit)) return unit;
    if (qty === 1) return unit;
    if (unit.endsWith("dad") || unit.endsWith("ción") || unit.endsWith("sión")) return unit + "es";
    if (unit === "unidad") return "unidades";
    if (unit.endsWith("z")) return unit.slice(0, -1) + "ces";
    if (unit.match(/[aeiou]$/)) return unit + "s";
    return unit + "es";
  };

  const getExpiryDaysLines = () => {
    if (entry.multiExpiry) {
      return entry.expiryEntries
        .filter(e => e.fecha_vencimiento)
        .map(e => {
          const days = differenceInDays(new Date(e.fecha_vencimiento + "T00:00:00"), new Date(today + "T00:00:00"));
          const qty = Number(e.cantidad) || 0;
          const unitStr = pluralizeUnit(product.unidad, qty);
          const className = days <= 0 ? "text-destructive" : days <= 5 ? "text-amber-600" : "text-muted-foreground";
          const text = days <= 0 ? `${qty} ${unitStr} vencidos` : `${qty} ${unitStr} vencen en ${days} días`;
          return { text, className };
        });
    }
    if (!entry.fecha_vencimiento) return [];
    const days = differenceInDays(new Date(entry.fecha_vencimiento + "T00:00:00"), new Date(today + "T00:00:00"));
    const className = days <= 0 ? "text-destructive" : days <= 5 ? "text-amber-600" : "text-muted-foreground";
    const text = days <= 0 ? "Vencido" : `Vence en ${days} días`;
    return [{ text, className }];
  };

  const toggleMultiExpiry = (checked: boolean) => {
    const newEntry = {
      ...entry,
      multiExpiry: checked,
      expiryEntries: checked && entry.expiryEntries.length === 0
        ? [{ fecha_vencimiento: entry.fecha_vencimiento || "", cantidad: entry.cantidad || "" }]
        : entry.expiryEntries,
    };
    onUpdate(product._entryKey, "multiExpiry", checked);
    if (checked) onUpdate(product._entryKey, "expiryEntries", newEntry.expiryEntries);
  };

  return (
    <tr className={cn(isHighlighted && "bg-primary/10 animate-pulse")}>
      <td className="px-4 py-3">
        <div className="font-medium">{product.nombre}</div>
        {isViewingAll && <div className="text-[10px]"><BodegaBadge nombre={product._bodegaName || ""} /></div>}
        {getExpiryDaysLines().map((line, i) => (
          <div key={i} className={cn("text-[10px] font-medium", line.className)}>{line.text}</div>
        ))}
      </td>
      <td className="px-4 py-3 text-right">
        {!entry.multiExpiry ? (
          <div className="flex items-center justify-end gap-1">
            <Input 
              type="number" 
              value={entry.cantidad} 
              onChange={(e) => onUpdate(product._entryKey, "cantidad", e.target.value)} 
              className="h-8 w-20 text-right" 
              disabled={!canEdit} 
            />
            <span className="text-xs text-muted-foreground">{product.unidad}</span>
          </div>
        ) : (
          <span className="text-xs font-bold text-primary">Múltiples lotes</span>
        )}
      </td>
      <td className="px-4 py-3">
        {!entry.multiExpiry ? (
          <Input 
            type="date" 
            value={entry.fecha_vencimiento} 
            onChange={(e) => onUpdate(product._entryKey, "fecha_vencimiento", e.target.value)}
            className="h-8 text-xs" 
            disabled={!canEdit} 
          />
        ) : (
          <div className="space-y-1">
            {entry.expiryEntries.map((exp, idx) => (
              <div key={idx} className="flex gap-1 items-center">
                <Input 
                  type="date" 
                  value={exp.fecha_vencimiento} 
                  onChange={(e) => {
                    const newEntries = [...entry.expiryEntries];
                    newEntries[idx].fecha_vencimiento = e.target.value;
                    onUpdate(product._entryKey, "expiryEntries", newEntries);
                  }} 
                  className="h-7 text-[10px]" 
                />
                <Input 
                  type="number" 
                  value={exp.cantidad} 
                  onChange={(e) => {
                    const newEntries = [...entry.expiryEntries];
                    newEntries[idx].cantidad = e.target.value;
                    onUpdate(product._entryKey, "expiryEntries", newEntries);
                  }} 
                  className="h-7 w-12 text-right text-[10px]" 
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => {
                    const newEntries = entry.expiryEntries.filter((_, i) => i !== idx);
                    onUpdate(product._entryKey, "expiryEntries", newEntries);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[10px] w-full" 
              onClick={() => onUpdate(product._entryKey, "expiryEntries", [...entry.expiryEntries, { fecha_vencimiento: "", cantidad: "" }])}
            >
              + Lote
            </Button>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <Checkbox checked={entry.multiExpiry} onCheckedChange={(c) => toggleMultiExpiry(!!c)} />
      </td>
    </tr>
  );
}