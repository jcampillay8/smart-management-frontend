import { useState, useEffect, useMemo } from "react";
import api from "../lib/api";
import { buildInventorySnapshot } from "../lib/inventory";
import { SmartNotification } from "../pages/Analiticas/types";
import { isPast, parseISO } from "date-fns";

export function useGlobalNotifications() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, histRes] = await Promise.all([
        api.get("/inventory/products"),
        api.get("/inventory/history"),
      ]);

      const snapshot = buildInventorySnapshot(histRes.data, new Date().toISOString(), "");
      
      const enriched: any[] = prodRes.data.map((p: any) => {
        const stockActual = (snapshot as any).stockByProduct?.[p.id] || 0;
        const lotes = (snapshot as any).lotsByProduct?.[p.id] || [];
        const primerVencimiento = lotes.length > 0 ? lotes[0].fecha_vencimiento : null;

        return {
          id: p.id,
          nombre: p.nombre,
          unidad: p.unidad,
          stock_minimo: p.stock_minimo || 0,
          cantidad: stockActual,
          cantidad_vencida: lotes
            .filter((l: any) => l.fecha_vencimiento && isPast(parseISO(l.fecha_vencimiento)))
            .reduce((sum: number, l: any) => sum + l.cantidad, 0),
          fecha_vencimiento: primerVencimiento,
          bodega_nombre: "Todas",
        };
      });

      setData(enriched);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const notifications = useMemo(() => {
    const alerts: SmartNotification[] = [];

    const stockCritico = data.filter(p => p.cantidad <= p.stock_minimo && p.stock_minimo > 0);
    const sinStock = data.filter(p => p.cantidad === 0);
    const vencidos = data.filter(p => p.cantidad_vencida > 0);

    if (sinStock.length > 0) {
      alerts.push({
        key: 'sin-stock',
        type: 'critical',
        title: `${sinStock.length} producto${sinStock.length > 1 ? 's' : ''} sin stock`,
        details: sinStock.map(p => ({ 
          text: `${p.nombre}: 0 ${p.unidad}`, 
          bodega: p.bodega_nombre 
        }))
      });
    }

    if (stockCritico.length > 0) {
      alerts.push({
        key: 'bajo-stock',
        type: 'warning',
        title: `${stockCritico.length} producto${stockCritico.length > 1 ? 's' : ''} bajo stock mínimo`,
        details: stockCritico.map(p => ({ 
          text: `${p.nombre}: ${p.cantidad} / mínimo: ${p.stock_minimo} ${p.unidad}`, 
          bodega: p.bodega_nombre 
        }))
      });
    }

    if (vencidos.length > 0) {
      alerts.push({
        key: 'vencidos',
        type: 'critical',
        title: `${vencidos.length} producto${vencidos.length > 1 ? 's' : ''} vencido${vencidos.length > 1 ? 's' : ''}`,
        details: vencidos.map(p => ({ 
          text: `${p.nombre}: ${p.cantidad_vencida} ${p.unidad} vencido${p.cantidad_vencida !== 1 ? 's' : ''}`, 
          bodega: p.bodega_nombre 
        }))
      });
    }

    return alerts;
  }, [data]);

  const totalCount = useMemo(() => {
    return notifications.reduce((sum, n) => sum + n.details.length, 0);
  }, [notifications]);

  const hasCritical = notifications.some(n => n.type === "critical");

  return { notifications, totalCount, hasCritical, loading, refresh: loadData };
}