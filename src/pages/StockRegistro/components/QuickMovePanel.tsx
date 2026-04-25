// src/pages/StockRegistro/components/QuickMovePanel.tsx
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { 
  Zap, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  PackageCheck
} from "lucide-react";
import { cn } from "../../../lib/utils";

export function QuickMovePanel() {
  const [mode, setMode] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState("");

  return (
    <div className="flex flex-col h-full bg-card backdrop-blur-xl border border-input rounded-3xl overflow-hidden shadow-xl animate-in slide-in-from-right duration-500">
      {/* Header del Panel */}
      <div className="p-6 border-b border-input bg-muted/20">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-primary fill-primary" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">
            Quick Actions
          </h3>
        </div>
        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
          Movimientos rápidos sin auditoría de lote (PEPS automático).
        </p>
      </div>

      <div className="p-6 space-y-8 flex-1">
        {/* Selector de Modo */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-2xl border border-input">
          <Button
            variant="ghost"
            onClick={() => setMode("in")}
            className={cn(
              "rounded-xl h-12 gap-2 transition-all duration-300",
              mode === "in" 
                ? "bg-primary text-primary-foreground shadow-lg" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <ArrowDownLeft className={cn("h-4 w-4", mode === "in" ? "text-green-500" : "")} />
            <span className="text-[10px] font-black uppercase">Entrada</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setMode("out")}
            className={cn(
              "rounded-xl h-12 gap-2 transition-all duration-300",
              mode === "out" 
                ? "bg-destructive text-destructive-foreground shadow-lg" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <ArrowUpRight className={cn("h-4 w-4", mode === "out" ? "text-red-500" : "")} />
            <span className="text-[10px] font-black uppercase">Salida</span>
          </Button>
        </div>

        {/* Input de Cantidad Gigante */}
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
            Cantidad a procesar
          </Label>
          <div className="relative group">
            <Input 
              type="number"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-20 text-4xl font-mono font-black text-center bg-background border-input rounded-2xl focus:ring-primary/20 transition-all"
            />
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <span className="text-[10px] font-black text-muted-foreground/40 uppercase">QTY</span>
            </div>
          </div>
        </div>

        {/* Placeholder de Selección */}
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-input rounded-3xl bg-muted/10 gap-3">
          <div className="p-3 bg-muted rounded-full">
            <Search className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-tighter leading-tight">
            Selecciona un producto <br /> en la tabla para vincular
          </p>
        </div>
      </div>

      {/* Footer con Botón de Acción */}
      <div className="p-6 bg-muted/20 border-t border-input">
        <Button 
          disabled={!quantity}
          className={cn(
            "w-full h-14 rounded-2xl gap-3 shadow-xl transition-all active:scale-95",
            mode === "in" 
              ? "bg-green-600 hover:bg-green-500 shadow-green-900/20" 
              : "bg-red-600 hover:bg-red-500 shadow-red-900/20"
          )}
        >
          <PackageCheck className="h-5 w-5" />
          <span className="text-xs font-black uppercase tracking-widest">
            Confirmar {mode === "in" ? "Ingreso" : "Egreso"}
          </span>
        </Button>
        
        <p className="mt-4 text-center text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">
          Presiona <kbd className="px-1.5 py-0.5 rounded bg-muted border border-input text-foreground">Enter</kbd> para ejecutar
        </p>
      </div>
    </div>
  );
}