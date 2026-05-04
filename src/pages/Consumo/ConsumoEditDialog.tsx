// src/pages/Consumo/ConsumoEditDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ConsumptionRecord } from "./types";
import { History, Save } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: ConsumptionRecord | null;
  onSave: (id: string, data: { cantidad: number; motivo_merma?: string }) => Promise<void>;
}

export function ConsumoEditDialog({ open, onOpenChange, record, onSave }: Props) {
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setCantidad(Math.abs(record.cantidad).toString());
      setMotivo(record.motivo_merma || "Edición de consumo");
    }
  }, [record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    
    const qty = parseFloat(cantidad);
    if (isNaN(qty) || qty <= 0) return;

    setSaving(true);
    try {
      await onSave(record.id, { cantidad: qty, motivo_merma: motivo });
      onOpenChange(false);
    } catch {
      // Error is handled in hook
    } finally {
      setSaving(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Editar Consumo
          </DialogTitle>
          <DialogDescription>
            {record.nombre_producto || record.nombre_receta}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad Consumida</Label>
            <Input
              id="cantidad"
              type="number"
              step="0.01"
              min="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de edición</Label>
            <Input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Corrección de cantidad"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
