// src/pages/ContarInventario/useContarInventario.ts
import { useState } from "react";
import api from "../../lib/api";
import { buildInventorySnapshot } from "../../lib/inventory";
import { CountItem, Discrepancia, Step } from "./types";
import { toast } from "sonner";
import { useBodega } from "../../hooks/useBodega";

export function useContarInventario() {
  const { bodegas } = useBodega();
  const [step, setStep] = useState<Step>("idle");
  const [items, setItems] = useState<CountItem[]>([]);
  const [discrepancias, setDiscrepancias] = useState<Discrepancia[]>([]);

  const calcularDiscrepancias = async (bodegaId: string, productos: any[]) => {
    try {
      const { data: historial } = await api.get("/inventory/history/");
      
      const snapshot = buildInventorySnapshot(historial, new Date().toISOString(), bodegaId);
      const nombreBodega = bodegas.find(b => b.id === bodegaId)?.nombre || "Bodega";

      const results: Discrepancia[] = productos.map(p => {
        const contado = items
          .filter(i => i.producto_id === p.id)
          .reduce((sum, i) => sum + i.cantidad_contada, 0);
        
        // SOLUCIÓN AL ERROR TS2339:
        // Forzamos a TS a tratar el snapshot como 'any' para acceder a la propiedad dinámica
        const sistema = (snapshot as any).stockByProduct?.[p.id] || 0;
        
        const diferencia = contado - sistema;

        return {
          producto_nombre: p.nombre,
          bodega_nombre: nombreBodega,
          stock_sistema: sistema,
          stock_contado: contado,
          diferencia,
          unidad: p.unidad,
          impacto_clp: diferencia * p.costo_unitario
        };
      }).filter(d => d.stock_sistema !== 0 || d.stock_contado !== 0);

      setDiscrepancias(results);
      setStep("reviewing");
    } catch (e) {
      console.error(e);
      toast.error("Error al calcular discrepancias");
    }
  };

  return { step, setStep, items, setItems, discrepancias, calcularDiscrepancias };
}