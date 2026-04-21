// src/pages/GestionarMerma/useMerma.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { subDays, subMonths, subYears, format } from "date-fns";

export function useMerma() {
  const [mermas, setMermas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");

  const loadData = useCallback(async () => {
    try {
      const [mermasRes, prodRes] = await Promise.all([
        api.get("/inventory/history/?tipo=merma"),
        api.get("/inventory/products")
      ]);
      setMermas(mermasRes.data);
      setProductos(prodRes.data);
    } catch (e) {
      toast.error("Error al cargar mermas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredMermas = useMemo(() => {
    const now = new Date();
    let limit = subMonths(now, 1);
    if (timeRange === "week") limit = subDays(now, 7);
    if (timeRange === "year") limit = subYears(now, 1);

    return mermas.filter(m => new Date(m.created_at) >= limit);
  }, [mermas, timeRange]);

  const stats = useMemo(() => {
    const totalLost = filteredMermas.reduce((acc, m) => {
      const p = productos.find(prod => prod.id === m.producto_id);
      return acc + (m.cantidad * (p?.costo_unitario || 0));
    }, 0);
    return { totalLost, count: filteredMermas.length };
  }, [filteredMermas, productos]);

  return { mermas: filteredMermas, productos, loading, stats, timeRange, setTimeRange, loadData };
}