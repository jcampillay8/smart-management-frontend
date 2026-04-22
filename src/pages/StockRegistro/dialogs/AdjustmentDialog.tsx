// src/pages/StockRegistro/dialogs/AdjustmentDialog.tsx
import { useState } from "react";
import api from "../../../lib/api";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../../components/ui/select";
import { Settings2, AlertCircle } from "lucide-react";
import { Producto } from "../types";

interface AdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
  bodegas: { id: string; nombre: string }[];
  onSuccess: () => void;
}

const TIPOS_AJUSTE = [
  { value: "entrada", label: "Entrada (Hallazgo / Sobrante)" },
  { value: "salida", label: "Salida (Error de inventario / Extravío)" },
];

export function AdjustmentDialog({ 
  open, 
  onOpenChange, 
  productos, 
  bodegas, 
  onSuccess 
}: AdjustmentDialogProps) {
  const [saving, setSaving] = useState(false);
  const [productoId, setProductoId] = useState("");
  const [bodegaId, setBodegaId] = useState("");
  const [tipo, setTipo] = useState<"entrada" | "salida">("entrada");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");

  const handleConfirm = async () => {
    if (!productoId || !bodegaId || !cantidad || Number(cantidad) <= 0) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setSaving(true);
    try {
      await api.post("/inventory/stock/movement", {
        producto_id: productoId,
        bodega_id: bodegaId,
        cantidad: Number(cantidad),
        tipo_movimiento: tipo,
        descripcion_merma: `Ajuste manual: ${motivo || "Sin descripción"}`,
        fecha_recuento: new Date().toISOString().split("T")[0],
      });

      toast.success("Ajuste de inventario aplicado");
      onSuccess();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Error al procesar el ajuste");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setProductoId("");
    setBodegaId("");
    setCantidad("");
    setMotivo("");
    setTipo("entrada");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Ajuste de Stock</DialogTitle>
          </div>
          <DialogDescription className="text-xs font-medium text-muted-foreground">
            Corrige discrepancias de inventario que no corresponden a mermas o ventas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Producto */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Producto</Label>
            <Select value={productoId} onValueChange={setProductoId}>
              <SelectTrigger className="h-11 bg-muted/30 border-white/5">
                <SelectValue placeholder="Seleccionar producto..." />
              </SelectTrigger>
              <SelectContent>
                {productos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Bodega */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bodega</Label>
              <Select value={bodegaId} onValueChange={setBodegaId}>
                <SelectTrigger className="h-11 bg-muted/30 border-white/5">
                  <SelectValue placeholder="Bodega" />
                </SelectTrigger>
                <SelectContent>
                  {bodegas.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Ajuste */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Ajuste</Label>
              <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                <SelectTrigger className={cn(
                  "h-11 bg-muted/30 border-white/5 font-bold",
                  tipo === "entrada" ? "text-green-500" : "text-destructive"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_AJUSTE.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cantidad a ajustar</Label>
            <div className="relative">
              <Input 
                type="number" 
                step="any"
                placeholder="0.00"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="h-12 text-lg font-mono font-bold pl-4 pr-12 bg-muted/20 border-white/5 focus:ring-primary"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase">
                {productos.find(p => p.id === productoId)?.unidad || "UND"}
              </span>
            </div>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nota / Motivo del ajuste</Label>
            <Input 
              placeholder="Ej: Error en conteo anterior"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="h-11 bg-muted/30 border-white/5"
            />
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-200/80 leading-relaxed font-medium">
            Atención: Los ajustes manuales afectan directamente el stock disponible y quedan registrados en la bitácora de auditoría.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl uppercase text-[10px] font-black tracking-widest">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={saving}
            className="rounded-xl px-8 uppercase text-[10px] font-black tracking-widest shadow-lg shadow-primary/20"
          >
            {saving ? "Procesando..." : "Aplicar Ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Función auxiliar de utilidad (si no la tienes importada)
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}