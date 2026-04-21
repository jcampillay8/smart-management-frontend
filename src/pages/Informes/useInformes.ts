// src/pages/Informes/useInformes.ts
import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { ChartData } from "./types";

export function useInformes() {
  const [stockData, setStockData] = useState<ChartData[]>([]);
  const [consumoData, setConsumoData] = useState<ChartData[]>([]);
  const [mermaData, setMermaData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [catRes, historyRes, mermaRes] = await Promise.all([
        api.get("/inventory/categories"),
        api.get("/inventory/history/?days=7"),
        api.get("/analytics/merma-stats?days=7")
      ]);

      // Procesar Consumo (Top 10)
      const consumoMap: Record<string, number> = {};
      historyRes.data
        .filter((r: any) => r.tipo_movimiento === "consumo")
        .forEach((r: any) => {
          consumoMap[r.producto_id] = (consumoMap[r.producto_id] || 0) + r.cantidad;
        });
      
      // Aquí podrías mapear con los nombres de productos si los pasas como argumento
      setConsumoData(Object.entries(consumoMap).map(([id, val]) => ({ name: id, value: val })).slice(0, 10));
      setMermaData(mermaRes.data.by_reason || []);
      
      // Datos de ejemplo para categorías (como en el original)
      setStockData(catRes.data.map((c: any) => ({ name: c.nombre, value: Math.floor(Math.random() * 100) })));
      
    } catch (e) {
      toast.error("Error al procesar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return { stockData, consumoData, mermaData, loading, refresh: loadData };
}