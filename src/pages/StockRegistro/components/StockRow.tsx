// src/pages/StockRegistro/components/StockRow.tsx
import { useState, useEffect, useRef } from "react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { Trash2, Plus, Calendar, ChevronDown, Package2, History } from "lucide-react";
import { cn } from "../../../lib/utils";
import { StockEntry, DisplayProduct } from "../types";
import { TABLE_GRID_LAYOUT } from "./StockTable"; 
import { CategoryIcon } from "../../../lib/icons";
import BodegaBadge from "../../../components/BodegaBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function StockRow({ 
  product, 
  entry, 
  canEdit,
  isViewingAll,
  onUpdate, 
  isHighlighted,
  toggleMultiExpiry,
  addExpiryEntry,
  removeExpiryEntry,
  updateExpiryEntry,
  isExpanded,
  onToggleExpand
}: StockRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const lastSeverityRef = useRef<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // if (!entry) return null; // MOVED DOWN to respect Rules of Hooks

  // --- LÓGICA DE COLORES GRADUALES ---
  const getSeverity = () => {
    const stockVal = product.stock_actual ?? 0;
    const minVal = product.stock_minimo ?? 0;
    
    let stockSev = 0;
    if (minVal > 0) {
      if (stockVal === 0) stockSev = 1;
      else if (stockVal < minVal) {
        const ratio = (minVal - stockVal) / minVal;
        stockSev = 0.5 + (ratio * 0.4);
      } else {
        stockSev = 0;
      }
    } else if (stockVal === 0) {
      stockSev = 1;
    }

    let expirySev = 0;
    const activeDates = entry?.multiExpiry 
      ? entry.expiryEntries.map(ee => ee.fecha_vencimiento).filter(Boolean) as string[]
      : [entry?.fecha_vencimiento].filter(Boolean) as string[];

    activeDates.forEach(dateStr => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(dateStr + "T00:00:00");
      const diffMs = expiry.getTime() - today.getTime();
      const days = Math.ceil(diffMs / (1000 * 3600 * 24));
      const threshold = product.dias_alerta_vencimiento ?? 15;

      let currentExpSev = 0;
      if (days < 0) currentExpSev = 1;
      else if (days === 0) currentExpSev = 1;
      else if (days <= 7) currentExpSev = 0.9;
      else if (days <= threshold) currentExpSev = 0.5;
      else if (days <= 30) currentExpSev = 0.2;

      expirySev = Math.max(expirySev, currentExpSev);
    });

    return Math.max(stockSev, expirySev);
  };

  const severity = getSeverity();

  // Auto-scroll logic: only if this row is the one being edited (has focus)
  useEffect(() => {
    if (isFocused && lastSeverityRef.current !== null && lastSeverityRef.current !== severity) {
      // Usamos un timeout para esperar a que framer-motion posicione el elemento
      const timer = setTimeout(() => {
        if (isFocused) { // Re-check focus before scrolling
          rowRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest' 
          });
        }
      }, 500); // 500ms para asegurar que la animación de framer-motion esté avanzada
      return () => clearTimeout(timer);
    }
    lastSeverityRef.current = severity;
  }, [severity, isFocused]);

  if (!entry) return null;

  const step = Math.floor(severity * 11); 

  const stockVal = Number(product.stock_actual) || 0;
  const minVal = Number(product.stock_minimo) || 0;
  const isOutOfStock = stockVal === 0;
  const isLowStock = stockVal < minVal && stockVal > 0;
  
  let isExpired = false;
  let isExpiringToday = false;
  let isExpiringSoon = false;

  const activeDates = entry.multiExpiry 
    ? entry.expiryEntries.map(ee => ee.fecha_vencimiento).filter(Boolean) as string[]
    : [entry.fecha_vencimiento].filter(Boolean) as string[];

  activeDates.forEach(dateStr => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr + "T00:00:00");
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (diff < 0) isExpired = true;
    if (diff === 0) isExpiringToday = true;
    if (diff > 0 && diff <= (product.dias_alerta_vencimiento ?? 15)) isExpiringSoon = true;
  });

  const getStatusLabel = () => {
    if (isExpired) return "Vencido";
    if (isExpiringToday) return "Vence hoy";
    if (isExpiringSoon) return "Por Vencer";
    if (isOutOfStock) return "Agotado";
    if (isLowStock) return "Bajo Stock";
    return null;
  };

  const getVigenciaText = () => {
    if (entry.multiExpiry) return "Múltiples";
    if (!entry.fecha_vencimiento) return "—";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(entry.fecha_vencimiento + "T00:00:00");
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) return `Vencido (${Math.abs(diffDays)}d)`;
    if (diffDays === 0) return "Vence hoy";
    return `${diffDays} días`;
  };

  const getLoteVigenciaData = (dateStr: string) => {
    if (!dateStr) return { text: "—", color: "text-muted-foreground", bg: "bg-muted" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
    const threshold = product.dias_alerta_vencimiento ?? 15;

    if (diff < 0) return { text: `Vencido (${Math.abs(diff)}d)`, color: "text-red-500", bg: "bg-red-500/15" };
    if (diff === 0) return { text: "Vence hoy", color: "text-red-500", bg: "bg-red-500/15" };
    if (diff <= threshold) return { text: `${diff} días`, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/15" };
    return { text: `${diff} días`, color: "text-green-500", bg: "bg-green-500/15" };
  };

  const getHSL = (s: number) => {
    let h = 142; // Green
    if (s <= 5) h = 142 - (s * (142 - 48) / 5);
    else h = 48 - ((s - 5) * 48 / 6);
    return `hsl(${h}, 80%, 45%)`;
  };

  const statusColor = getHSL(step);
  const isValidationError = isHighlighted;
  
  if (!entry) return null;

  return (
    <div 
      ref={rowRef}
      className={cn(
        "flex flex-col w-full border-b border-input transition-all duration-500",
        isValidationError && "ring-2 ring-red-500 ring-inset z-10 animate-pulse-subtle"
      )}
      style={{ borderLeft: `6px solid ${isValidationError ? "#ef4444" : (step >= 0 ? statusColor : "transparent")}` }}
    >
      <div className={cn(
        TABLE_GRID_LAYOUT, 
        "group h-16 transition-colors hover:bg-muted/30 relative"
      )}>
        {/* COL 1: PRODUCTO */}
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="p-2.5 rounded-xl border-2 shadow-sm transition-all group-hover:scale-110"
            style={{ backgroundColor: `${product.categoria_color}15`, borderColor: `${product.categoria_color}40`, color: product.categoria_color }}
          >
            <CategoryIcon name={product.categoria_icono} className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm truncate">{product.nombre}</span>
              {getStatusLabel() && (
                 <span 
                   className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter"
                   style={{ 
                     backgroundColor: (isExpired || isExpiringToday || isOutOfStock) ? "rgba(239, 68, 68, 0.2)" : `${statusColor}20`, 
                     color: (isExpired || isExpiringToday || isOutOfStock) ? "#ef4444" : statusColor 
                   }}
                 >
                   {getStatusLabel()}
                 </span>
              )}
            </div>
            {isViewingAll && (
              <div className="flex items-center gap-1.5">
                <BodegaBadge nombre={product._bodegaName!} color={product._bodegaColor} icono={product._bodegaIcon} />
                {product.bodegas_config?.[0] && (
                   <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 rounded uppercase">
                     {product.bodegas_config[0].coordenada_letra}{product.bodegas_config[0].coordenada_numero}
                   </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* COL 2: CANTIDAD */}
        <div className="flex items-center justify-center gap-2">
           <div className="relative group/qty">
             <Input 
               type="number"
               inputMode="numeric"
               disabled={!canEdit || entry.multiExpiry}
               className={cn(
                 "w-24 h-10 bg-card/50 border-input text-center font-mono text-base focus:ring-2 focus:ring-primary/20 transition-all rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                 (isOutOfStock || isExpiringToday) && "animate-blink-red text-red-500 font-black",
                 (isLowStock && !isExpiringToday) && "animate-blink-orange text-orange-500 font-black",
                 entry.multiExpiry && "bg-primary/5 border-primary/20 text-primary font-black cursor-default"
               )}
               value={entry.multiExpiry 
                 ? entry.expiryEntries.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0)
                 : entry.cantidad
               }
               placeholder="0"
               onFocus={(e) => {
                 e.target.select();
                 setIsFocused(true);
               }}
               onBlur={() => setIsFocused(false)}
               onChange={(e) => {
                 const val = e.target.value.replace(/[^0-9]/g, "");
                 onUpdate(product._entryKey, "cantidad", val);
               }}
             />
             {entry.multiExpiry && (
               <div className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-md bg-primary text-[8px] text-white font-black uppercase shadow-sm">
                 SUM
               </div>
             )}
           </div>
           <div className="flex flex-col -space-y-1">
             <span className="text-[9px] font-black text-muted-foreground/60 uppercase">Mín</span>
             <span className="text-[11px] font-bold text-muted-foreground">{product.stock_minimo || 0}</span>
           </div>
        </div>

        {/* COL 3: UNIDAD */}
        <div className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">
          {product.unidad}
        </div>

        {/* COL 4: VENCIMIENTO */}
        <div className="relative flex justify-center">
          {entry.multiExpiry ? (
            <div className="h-9 w-[110px] flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-dashed border-primary/30 text-[9px] font-black uppercase text-primary tracking-tighter">
              <Calendar className="h-3 w-3" />
              Lotes
            </div>
          ) : (
            <Input 
              type="date"
              disabled={!canEdit}
              className={cn(
                "h-9 bg-card/50 border-input text-[11px] w-[110px] text-center px-1 transition-all cursor-pointer rounded-xl [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0",
                (isExpired || isExpiringToday) && "animate-blink-red text-red-500 font-bold",
                (isExpiringSoon && !isExpiringToday) && "animate-blink-orange text-orange-500 font-bold"
              )}
              value={entry.fecha_vencimiento}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => onUpdate(product._entryKey, "fecha_vencimiento", e.target.value)}
            />
          )}
        </div>

        {/* COL 5: MULTI */}
        <div className="flex items-center justify-center gap-2">
          <Checkbox 
            disabled={!canEdit}
            checked={entry.multiExpiry}
            onCheckedChange={(val) => toggleMultiExpiry(product._entryKey, !!val)}
            className="h-5 w-5 rounded-lg data-[state=checked]:bg-primary"
          />
        </div>

        {/* COL 6: VIGENCIA */}
        <div className="flex items-center justify-center">
          {entry.multiExpiry ? (
            <button 
              onClick={onToggleExpand}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all active:scale-95",
                isExpanded ? "bg-primary text-primary-foreground shadow-md" : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              Múltiples
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", isExpanded && "rotate-180")} />
            </button>
          ) : (
            <div className={cn(
              "text-[11px] font-bold px-3 py-1 rounded-full",
              isExpired || isExpiringToday ? "bg-red-500/10 text-red-500" : isExpiringSoon ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" : "bg-green-500/10 text-green-500"
            )}>
              {getVigenciaText()}
            </div>
          )}
        </div>

        {/* COL 7: RECUENTO */}
        <div className="relative flex justify-center">
          <Input 
            type="date"
            disabled={!canEdit}
            className="h-9 bg-card/50 border-input text-[11px] w-[110px] text-center px-1 cursor-pointer rounded-xl [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0"
            value={entry.fecha_recuento}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => onUpdate(product._entryKey, "fecha_recuento", e.target.value)}
          />
        </div>
      </div>

      {/* SECCIÓN EXPANDIDA: LOTES (Acordeón) */}
      {isExpanded && entry.multiExpiry && (
        <div className="bg-primary/5 border-t border-input/30 py-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {entry.expiryEntries.map((ee, idx) => {
            const { text: vigenciaText, color: lColor, bg: lBg } = getLoteVigenciaData(ee.fecha_vencimiento);

            return (
              <div key={idx} className={cn(TABLE_GRID_LAYOUT, "h-12")}>
                {/* Col 1: Label Lote */}
                <div className="flex items-center gap-2 pl-8">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                  <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-tighter">Lote #{idx + 1}</span>
                </div>

                {/* Col 2: Cantidad Lot */}
                <div className="flex justify-center">
                  <Input 
                    type="number"
                    className="w-24 h-10 bg-card/50 border-input text-center font-mono text-base rounded-xl focus:ring-2 focus:ring-primary/20"
                    value={ee.cantidad}
                    placeholder="0"
                    onFocus={(e) => {
                      e.target.select();
                      setIsFocused(true);
                    }}
                    onBlur={() => setIsFocused(false)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      updateExpiryEntry(product._entryKey, idx, "cantidad", val);
                    }}
                  />
                </div>

                {/* Col 3: Empty */}
                <div></div>

                {/* Col 4: Vencimiento Lot */}
                <div className="relative flex justify-center">
                  <Input 
                    type="date"
                    className="h-9 bg-card/50 border-input text-[11px] w-[110px] text-center px-1 rounded-xl focus:ring-2 focus:ring-primary/20 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0"
                    value={ee.fecha_vencimiento}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChange={(e) => updateExpiryEntry(product._entryKey, idx, "fecha_vencimiento", e.target.value)}
                  />
                </div>

                {/* Col 5: Trash */}
                <div className="flex justify-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeExpiryEntry(product._entryKey, idx)} 
                    className="h-7 w-7 text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors rounded-full"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Col 6: Vigencia Lot */}
                <div className="flex justify-center">
                  <div 
                    className={cn(
                      "text-[11px] font-bold px-3 py-1 rounded-full shadow-sm transition-colors border border-transparent",
                      lColor, lBg
                    )}
                  >
                    {vigenciaText}
                  </div>
                </div>

                {/* Col 7: Shared Date Input for Alignment */}
                <div className="flex justify-center">
                  <Input 
                    type="date"
                    disabled
                    className="h-9 bg-card/5 border-input text-[11px] w-[110px] text-center px-1 rounded-xl opacity-40 cursor-not-allowed [&::-webkit-calendar-picker-indicator]:hidden"
                    value={entry.fecha_recuento}
                  />
                </div>
              </div>
            );
          })}

          {/* Botón Añadir Lote Alineado */}
          <div className={cn(TABLE_GRID_LAYOUT, "h-10 pt-1")}>
            <div className="col-start-2 flex justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => addExpiryEntry(product._entryKey)} 
                className="h-7 px-4 rounded-full text-[9px] font-black uppercase gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                <Plus className="h-3 w-3" /> Añadir Lote
              </Button>
            </div>
            {entry.expiryEntries.length === 0 && (
               <div className="col-start-4 col-span-3 text-[10px] font-medium text-muted-foreground italic flex items-center gap-2">
                 <Package2 className="h-3 w-3 opacity-30" />
                 No hay lotes definidos para este producto
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}