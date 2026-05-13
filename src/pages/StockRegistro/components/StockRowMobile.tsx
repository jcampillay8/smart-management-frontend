// src/pages/StockRegistro/components/StockRowMobile.tsx
import { useState } from "react";
import { ChevronRight, Calendar, User, Clock, History as HistoryIcon, Package2, Plus, Trash2, MapPin } from "lucide-react";
import { cn } from "../../../lib/utils";
import { StockEntry, DisplayProduct } from "../types";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "../../../components/ui/sheet";
import api from "../../../lib/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import BodegaBadge from "../../../components/BodegaBadge";

interface StockRowMobileProps {
  product: DisplayProduct;
  entry: StockEntry;
  canEdit: boolean;
  isHighlighted: boolean;
  onUpdate: (key: string, field: keyof StockEntry, value: any) => void;
  toggleMultiExpiry: (key: string, checked: boolean) => void;
  addExpiryEntry: (key: string) => void;
  removeExpiryEntry: (key: string, idx: number) => void;
  updateExpiryEntry: (key: string, idx: number, field: string, value: any) => void;
}

export function StockRowMobile({
  product,
  entry,
  canEdit,
  isHighlighted,
  onUpdate,
  toggleMultiExpiry,
  addExpiryEntry,
  removeExpiryEntry,
  updateExpiryEntry
}: StockRowMobileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastCount, setLastCount] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // if (!entry) return null; // MOVED DOWN

  // --- LÓGICA DE SEVERIDAD ---
  const getSeverity = () => {
    const stockVal = product.stock_actual ?? 0;
    const minVal = product.stock_minimo ?? 0;
    let stockSev = 0;
    if (minVal > 0) {
      if (stockVal === 0) stockSev = 1;
      else if (stockVal < minVal) {
        // Salto inmediato a naranja (0.5 min) y escala hasta rojo (0.9)
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
      if (days <= 0) currentExpSev = 1;
      else if (days <= 3) currentExpSev = 0.9;
      else if (days <= threshold) currentExpSev = 0.5;
      
      expirySev = Math.max(expirySev, currentExpSev);
    });
    
    return Math.max(stockSev, expirySev);
  };

  const severity = getSeverity();
  const step = Math.floor(severity * 11);
  
  if (!entry) return null;
  
  const stockVal = Number(product.stock_actual) || 0;
  const isOutOfStock = stockVal === 0;
  const isLowStock = stockVal < (product.stock_minimo || 0);
  
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
    
    if (diff <= 0) isExpired = true; // Use isExpired for today or past
    if (diff > 0 && diff <= 3) isExpiringSoon = true; // Use this for orange
    const threshold = product.dias_alerta_vencimiento ?? 15;
    if (diff > 3 && diff <= threshold) isExpiringSoon = true; // Also yellow
  });

  const isCritical = isExpired || isOutOfStock || step > 8;
  const isWarning = !isCritical && (isExpiringSoon || isLowStock || step > 4);
  const isNormal = !isCritical && !isWarning;

  const getStatusLabel = () => {
    if (isExpired) return "Vencido";
    if (isOutOfStock) return "Agotado";
    if (isLowStock) return "Bajo Stock";
    return null;
  };

  const fetchLastCount = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get("/inventory/history", {
        params: { producto_id: product.id, tipo_movimiento: "conteo", limit: 1 }
      });
      if (res.data && res.data.length > 0) setLastCount(res.data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchLastCount();
  };

  const getVigenciaText = (dateStr: string) => {
    if (!dateStr) return "Sin fecha";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return "Vencido";
    if (diffDays === 0) return "Vence hoy";
    if (diffDays === 1) return "Vence mañana";
    return `Vence en ${diffDays} días`;
  };

  return (
    <>
      <div 
        onClick={handleOpen}
        className={cn(
          "p-4 rounded-2xl bg-card border border-input shadow-sm transition-all active:scale-[0.98] relative overflow-hidden",
          isCritical && "animate-blink-red",
          isWarning && "animate-blink-orange",
          isNormal && "border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
          isHighlighted && "ring-2 ring-primary ring-inset"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground truncate">{product.nombre}</h3>
              {getStatusLabel() && (
                <span className={cn(
                  "text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter",
                  isCritical ? "bg-red-500/20 text-red-500" : "bg-orange-500/20 text-orange-500"
                )}>
                  {getStatusLabel()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-xs font-mono font-black",
                isCritical ? "text-red-500" : isWarning ? "text-orange-500" : "text-primary"
              )}>
                {product.stock_actual} / {product.stock_minimo}
                <span className="ml-1 text-[10px] font-bold text-muted-foreground uppercase">{product.unidad}</span>
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
        </div>

        <div className="grid grid-cols-[1.2fr_1fr_1.2fr] items-center gap-2 mt-3 pt-3 border-t border-input/50">
          <div className="flex flex-col items-start gap-0.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Bodega</p>
            {product._bodegaName && (
              <BodegaBadge nombre={product._bodegaName} color={product._bodegaColor} icono={product._bodegaIcon} />
            )}
          </div>
          
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Ubicación</p>
            {product.bodegas_config?.[0] && (
              <div className="flex items-center gap-1 text-[10px] font-black uppercase text-foreground">
                <MapPin className="h-3 w-3 text-primary" />
                {product.bodegas_config[0].coordenada_letra}{product.bodegas_config[0].coordenada_numero}
              </div>
            )}
          </div>

          <div className="space-y-0.5 text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Vigencia</p>
            <p className={cn(
              "text-[11px] font-bold",
              isExpired ? "text-red-500" : isExpiringSoon ? "text-yellow-600 dark:text-yellow-400" : "text-green-500"
            )}>
              {entry.multiExpiry ? "Varios" : getVigenciaText(entry.fecha_vencimiento)}
            </p>
          </div>
        </div>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-8 pb-12 outline-none border-t-0 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.3)] max-h-[95vh] overflow-y-auto">
          <SheetHeader className="mb-8">
            <div className="flex items-center gap-4 mb-2">
               <div className="p-3 rounded-2xl bg-primary/10">
                 <Package2 className="h-6 w-6 text-primary" />
               </div>
               <div className="flex-1 min-w-0">
                 <SheetTitle className="text-2xl font-black tracking-tight truncate">{product.nombre}</SheetTitle>
                 <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                   Control de Inventario y Trazabilidad
                 </SheetDescription>
               </div>
            </div>
          </SheetHeader>

          <div className="space-y-8">
            <div className="space-y-4 p-6 rounded-[2rem] bg-secondary/30 border border-border/50">
               <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Modificar Registro</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Multi-Lote</span>
                    <Checkbox 
                      disabled={!canEdit}
                      checked={entry.multiExpiry}
                      onCheckedChange={(v) => toggleMultiExpiry(product._entryKey, !!v)}
                    />
                  </div>
               </div>

               <div className={cn("grid gap-4", entry.multiExpiry ? "grid-cols-1" : "grid-cols-2")}>
                 <div className="space-y-1.5 text-center">
                   <label className="text-[9px] font-black uppercase text-muted-foreground block text-center mb-1">Stock Actual</label>
                   <Input 
                     type="number"
                     inputMode="numeric"
                     disabled={!canEdit || entry.multiExpiry}
                     className={cn(
                       "h-14 bg-card border-2 text-center font-mono text-xl focus:ring-4 focus:ring-primary/20 transition-all rounded-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                       entry.multiExpiry && "bg-primary/5 border-primary/40 text-primary font-black opacity-100"
                     )}
                     value={entry.multiExpiry 
                       ? entry.expiryEntries.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0)
                       : entry.cantidad
                     }
                     onFocus={(e) => e.target.select()}
                     placeholder={entry.multiExpiry ? "---" : "0"}
                     onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        onUpdate(product._entryKey, "cantidad", val);
                     }}
                   />
                   {entry.multiExpiry && (
                     <p className="text-[8px] font-black uppercase text-primary tracking-tighter mt-1">Suma total de lotes</p>
                   )}
                 </div>
                 {!entry.multiExpiry && (
                   <>
                     <div className="space-y-1.5 text-center">
                       <label className="text-[9px] font-black uppercase text-muted-foreground block text-center mb-1">Vencimiento</label>
                       <Input 
                         type="date"
                         disabled={!canEdit}
                         value={entry.fecha_vencimiento || ""}
                         onChange={(e) => onUpdate(product._entryKey, "fecha_vencimiento", e.target.value)}
                         className="h-14 rounded-xl bg-background border-input text-sm text-center"
                       />
                     </div>
                     <div className="col-span-2 mt-2 pt-2 border-t border-border/30">
                        <div className={cn(
                          "py-2 px-4 rounded-xl text-center text-[10px] font-black uppercase tracking-widest border",
                          (() => {
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            const target = new Date((entry.fecha_vencimiento || "") + "T00:00:00");
                            const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
                            const threshold = product.dias_alerta_vencimiento ?? 15;

                            if (diff <= 0) return "bg-red-500/10 text-red-500 border-red-500/20";
                            if (diff <= 3) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
                            if (diff <= threshold) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
                            return "bg-green-500/10 text-green-500 border-green-500/20";
                          })()
                        )}>
                          {getVigenciaText(entry.fecha_vencimiento)}
                        </div>
                     </div>
                   </>
                 )}
               </div>

               {entry.multiExpiry && (
                 <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black uppercase text-muted-foreground">Gestión de Lotes</span>
                     <Button variant="outline" size="sm" onClick={() => addExpiryEntry(product._entryKey)} className="h-8 px-4 rounded-full text-[10px] font-black uppercase">
                       <Plus className="h-3 w-3 mr-1" /> Nuevo Lote
                     </Button>
                   </div>
                   <div className="space-y-3">
                     {entry.expiryEntries.map((ee, idx) => {
                        const getLoteVigenciaData = (dateStr: string) => {
                          if (!dateStr) return { text: "—", color: "text-muted-foreground", bg: "bg-muted" };
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const target = new Date(dateStr + "T00:00:00");
                          const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
                          const threshold = product.dias_alerta_vencimiento ?? 15;

                           if (diff <= 0) return { text: diff === 0 ? "Vence hoy" : "Vencido", color: "text-red-500", bg: "bg-red-500/15" };
                           if (diff <= 3) return { text: diff === 1 ? "Vence mañana" : `Vence en ${diff} días`, color: "text-orange-500", bg: "bg-orange-500/15" };
                           if (diff <= threshold) return { text: `Vence en ${diff} días`, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/15" };
                           return { text: `Vence en ${diff} días`, color: "text-green-500", bg: "bg-green-500/15" };
                        };

                        const { text: vigText, color: lColor, bg: lBg } = getLoteVigenciaData(ee.fecha_vencimiento);

                        return (
                          <div key={idx} className="flex flex-col gap-4 p-5 rounded-2xl bg-background border border-input/50 relative group shadow-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-muted-foreground block ml-1">Cantidad</label>
                                <Input 
                                  type="number"
                                  className="h-12 text-sm font-mono font-bold rounded-xl text-center bg-secondary/20"
                                  placeholder="0"
                                  value={ee.cantidad}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, "");
                                    updateExpiryEntry(product._entryKey, idx, "cantidad", val);
                                  }}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-muted-foreground block ml-1">Vencimiento</label>
                                <Input 
                                  type="date"
                                  className="h-12 text-xs rounded-xl text-center bg-secondary/20"
                                  value={ee.fecha_vencimiento}
                                  onChange={(e) => updateExpiryEntry(product._entryKey, idx, "fecha_vencimiento", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                               <div 
                                 className={cn(
                                   "flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm border border-transparent",
                                   lColor, lBg
                                 )}
                               >
                                 {vigText}
                               </div>
                               <Button variant="ghost" size="icon" onClick={() => removeExpiryEntry(product._entryKey, idx)} className="h-10 w-10 text-red-500 hover:bg-red-500/10 rounded-xl shrink-0">
                                 <Trash2 className="h-5 w-5" />
                               </Button>
                            </div>
                          </div>
                        );
                     })}
                   </div>
                 </div>
               )}
            </div>

            <div className="bg-card rounded-[2rem] border border-input overflow-hidden divide-y divide-input/50 shadow-sm">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10">
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Último Recuento</p>
                    <p className="text-sm font-bold">
                      {loadingHistory ? "Cargando..." : (lastCount ? format(new Date(lastCount.created_at), "dd 'de' MMMM", { locale: es }) : "No registrado")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/10">
                    <User className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Realizado por</p>
                    <p className="text-sm font-bold">
                      {loadingHistory ? "Cargando..." : (lastCount?.user_display_name || "Sistema")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl border-2 border-dashed border-input hover:bg-secondary transition-all font-black uppercase text-[10px] tracking-widest gap-2"
              onClick={() => {
                setIsOpen(false);
                window.location.href = `/historial?search=${encodeURIComponent(product.nombre)}`;
              }}
            >
              <HistoryIcon className="h-4 w-4" />
              Explorar Historial Completo
            </Button>
          </div>
          
          <SheetFooter className="mt-8">
            <Button onClick={() => setIsOpen(false)} className="w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-primary">
              Finalizar Revisión
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}