// src/pages/StockRegistro/MermaDialog.tsx

import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Producto } from "./types";

interface MermaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
  bodegas: { id: string; nombre: string }[];
  productBodegaMap: Record<string, Set<string>>;
  onSuccess: () => void;
}

const MOTIVOS_MERMA = [
  { value: "vencimiento", label: "Vencimiento" },
  { value: "daño", label: "Daño" },
  { value: "error", label: "Error" },
  { value: "otro", label: "Otro" },
];

export function MermaDialog({ 
  open, 
  onOpenChange, 
  productos, 
  bodegas, 
  productBodegaMap,
  onSuccess 
}: MermaDialogProps) {
  const [saving, setSaving] = useState(false);
  const [mermaBodega, setMermaBodega] = useState("");
  const [mermaProducto, setMermaProducto] = useState("");
  const [mermaCantidad, setMermaCantidad] = useState("");
  const [motivoMerma, setMotivoMerma] = useState("");
  const [mermaFechaVencimiento, setMermaFechaVencimiento] = useState("");
  const [mermaDescripcion, setMermaDescripcion] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!open) {
      setMermaBodega("");
      setMermaProducto("");
      setMermaCantidad("");
      setMotivoMerma("");
      setMermaFechaVencimiento("");
      setMermaDescripcion("");
    }
  }, [open]);

  const confirmMerma = async () => {
    if (!mermaBodega || !motivoMerma || !mermaProducto || !mermaCantidad || Number(mermaCantidad) <= 0) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    setSaving(true);
    try {
      await api.post("/inventory/stock/bulk-movements", {
        movements: [{
          producto_id: mermaProducto,
          cantidad: Number(mermaCantidad),
          fecha_recuento: today,
          fecha_vencimiento: mermaFechaVencimiento || null,
          tipo_movimiento: "merma",
          motivo_merma: motivoMerma,
          descripcion_merma: mermaDescripcion || null,
          bodega_id: mermaBodega,
        }]
      });
      toast.success("Merma registrada correctamente");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Error al registrar merma");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Merma</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Bodega</Label>
            <Select value={mermaBodega} onValueChange={setMermaBodega}>
              <SelectTrigger><SelectValue placeholder="Seleccionar bodega" /></SelectTrigger>
              <SelectContent>
                {bodegas.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Producto</Label>
            <Select 
              value={mermaProducto} 
              onValueChange={setMermaProducto}
              disabled={!mermaBodega}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
              <SelectContent>
                {productos
                  .filter(p => productBodegaMap[p.id]?.has(mermaBodega))
                  .map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input 
                type="number" 
                value={mermaCantidad} 
                onChange={(e) => setMermaCantidad(e.target.value)} 
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={motivoMerma} onValueChange={setMotivoMerma}>
                <SelectTrigger><SelectValue placeholder="Motivo" /></SelectTrigger>
                <SelectContent>
                  {MOTIVOS_MERMA.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fecha Vencimiento del Lote (opcional)</Label>
            <Input 
              type="date" 
              value={mermaFechaVencimiento} 
              onChange={(e) => setMermaFechaVencimiento(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción / Observación</Label>
            <Input 
              value={mermaDescripcion} 
              onChange={(e) => setMermaDescripcion(e.target.value)} 
              placeholder="Ej: Envase dañado en transporte"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={confirmMerma} disabled={saving}>
            {saving ? "Registrando..." : "Confirmar Merma"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}