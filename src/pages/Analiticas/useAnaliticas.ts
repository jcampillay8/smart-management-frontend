import { useState, useEffect, useMemo } from "react";
import api from "../../lib/api";
import { buildInventorySnapshot } from "../../lib/inventory";
import { ProductoAnalitico, SmartNotification } from "./types";
import { isPast, parseISO } from "date-fns";

export function useAnaliticas(selectedBodegaId: string) {
  const [data, setData] = useState<ProductoAnalitico[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, histRes] = await Promise.all([
        api.get("/inventory/products"),
        api.get("/inventory/history/")
      ]);

      // Generamos el snapshot del sistema
      const snapshot = buildInventorySnapshot(histRes.data, new Date().toISOString(), selectedBodegaId);
      
      const enriched: ProductoAnalitico[] = prodRes.data.map((p: any) => {
        // Obtenemos la cantidad desde stockByProduct con casting para evitar TS2339
        const stockActual = (snapshot as any).stockByProduct?.[p.id] || 0;
        
        // Buscamos información de vencimiento en los lotes si existen
        const lotes = (snapshot as any).lotsByProduct?.[p.id] || [];
        const primerVencimiento = lotes.length > 0 ? lotes[0].fecha_vencimiento : null;

        return {
          id: p.id,
          nombre: p.nombre,
          unidad: p.unidad,
          stock_minimo: p.bodegas_config?.find((c: any) => c.bodega_id === selectedBodegaId)?.stock_minimo || 0,
          cantidad: stockActual,
          cantidad_vencida: lotes
            .filter((l: any) => l.fecha_vencimiento && isPast(parseISO(l.fecha_vencimiento)))
            .reduce((sum: number, l: any) => sum + l.cantidad, 0),
          fecha_vencimiento: primerVencimiento,
          bodega_nombre: "Bodega Principal" // Esto podrías dinamizarlo según selectedBodegaId
        };
      });

      setData(enriched);
    } catch (error) {
      console.error("Error cargando analíticas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBodegaId]);

  // Filtro de Stock Crítico
  const stockCritico = useMemo(() => 
    data.filter(p => p.cantidad <= p.stock_minimo && p.stock_minimo > 0), 
  [data]);

  // Lógica de Notificaciones Inteligentes
  const notifications = useMemo(() => {
    const alerts: SmartNotification[] = [];

    // 1. Alerta de Stock Crítico
    if (stockCritico.length > 0) {
      alerts.push({
        key: 'stock-critico-alert',
        type: 'critical',
        title: 'Quiebre de Stock Detectado',
        details: stockCritico.map(p => ({ 
          text: `${p.nombre} (${p.cantidad} ${p.unidad} restantes)`, 
          bodega: p.bodega_nombre 
        }))
      });
    }

    // 2. Alerta de Productos Vencidos
    const vencidos = data.filter(p => p.cantidad_vencida > 0);
    if (vencidos.length > 0) {
      alerts.push({
        key: 'vencimientos-alert',
        type: 'warning',
        title: 'Insumos Vencidos en Bodega',
        details: vencidos.map(p => ({ 
          text: `${p.nombre}: ${p.cantidad_vencida} ${p.unidad} para merma`, 
          bodega: p.bodega_nombre 
        }))
      });
    }

    return alerts;
  }, [data, stockCritico]);

  return { 
    data, 
    stockCritico, 
    notifications, // Ahora el componente index.tsx puede usar esto
    loading, 
    refresh: loadData 
  };
}