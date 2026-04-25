// src/pages/GestionarMerma/useMerma.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { format, subDays, subMonths, subYears, isSameDay } from "date-fns";

const MOTIVOS = [
  { value: "vencimiento", label: "Vencimiento" },
  { value: "daño", label: "Daño" },
  { value: "error", label: "Error" },
  { value: "otro", label: "Otro" },
];

export function useMerma() {
  const [mermas, setMermas] = useState<any[]>([]);
  const [allMermas, setAllMermas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("1m");

  const loadData = useCallback(async () => {
    try {
      const [mermasRes, prodRes, allMermasRes] = await Promise.all([
        api.get("/inventory/history/?tipo_movimiento=merma"),
        api.get("/inventory/products/"),
        api.get("/inventory/history/?tipo_movimiento=merma&fecha_desde=1900-01-01"),
      ]);
      setMermas(mermasRes.data ?? []);
      setAllMermas(allMermasRes.data ?? []);
      setProductos(prodRes.data ?? []);
    } catch (e) {
      console.error("Error loading mermas:", e);
      toast.error("Error al cargar mermas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredMermas = useMemo(() => {
    const now = new Date();
    let limit = subMonths(now, 1);
    if (timeRange === "1w") limit = subDays(now, 7);
    if (timeRange === "1m") limit = subMonths(now, 1);
    if (timeRange === "6m") limit = subMonths(now, 6);
    if (timeRange === "1y") limit = subYears(now, 1);

    return mermas.filter(m => new Date(m.created_at) >= limit);
  }, [mermas, timeRange]);

  const stats7d = useMemo(() => {
    const now = new Date();
    const d7 = subDays(now, 7);
    const d14 = subDays(now, 14);
    
    const last7 = allMermas.filter(m => new Date(m.created_at) >= d7);
    const prev7 = allMermas.filter(m => new Date(m.created_at) < d7 && new Date(m.created_at) >= d14);
    
    const last7Loss = last7.reduce((acc, m) => {
      const p = productos.find(prod => prod.id === m.producto_id);
      return acc + (m.cantidad * (p?.costo_unitario || 0));
    }, 0);
    
    const prev7Loss = prev7.reduce((acc, m) => {
      const p = productos.find(prod => prod.id === m.producto_id);
      return acc + (m.cantidad * (p?.costo_unitario || 0));
    }, 0);

    return { total: last7Loss, prevTotal: prev7Loss };
  }, [allMermas, productos]);

  const stats30d = useMemo(() => {
    const now = new Date();
    const d30 = subDays(now, 30);
    const d60 = subDays(now, 60);
    
    const last30 = mermas.filter(m => new Date(m.created_at) >= d30);
    const prev30 = allMermas.filter(m => new Date(m.created_at) < d30 && new Date(m.created_at) >= d60);
    
    const last30Loss = last30.reduce((acc, m) => {
      const p = productos.find(prod => prod.id === m.producto_id);
      return acc + (m.cantidad * (p?.costo_unitario || 0));
    }, 0);

    const prev30Loss = prev30.reduce((acc, m) => {
      const p = productos.find(prod => prod.id === m.producto_id);
      return acc + (m.cantidad * (p?.costo_unitario || 0));
    }, 0);

    return { total: last30Loss, prevTotal: prev30Loss };
  }, [mermas, allMermas, productos]);

  const chartData = useMemo(() => {
    const days = timeRange === "1w" ? 7 : timeRange === "1m" ? 30 : timeRange === "6m" ? 180 : 365;
    const startDate = subDays(new Date(), days);
    
    const grouped: Record<string, number> = {};
    filteredMermas.forEach(m => {
      const key = m.fecha_recuento;
      const p = productos.find(prod => prod.id === m.producto_id);
      const val = m.cantidad * (p?.costo_unitario || 0);
      grouped[key] = (grouped[key] || 0) + val;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, total]) => ({
        fecha,
        total,
        label: days <= 30 ? format(new Date(fecha + "T00:00:00"), "dd/MM") : format(new Date(fecha + "T00:00:00"), "MMM yyyy"),
      }));
  }, [filteredMermas, productos, timeRange]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    filteredMermas.forEach(m => {
      const p = productos.find(prod => prod.id === m.producto_id);
      const val = m.cantidad * (p?.costo_unitario || 0);
      map.set(m.producto_id, (map.get(m.producto_id) || 0) + val);
    });
    return Array.from(map.entries())
      .map(([id, valor]) => ({
        id,
        nombre: productos.find(p => p.id === id)?.nombre || "?",
        valor,
        cantidad: filteredMermas.filter(m => m.producto_id === id).reduce((sum, m) => sum + m.cantidad, 0),
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [filteredMermas, productos]);

  const tips = useMemo(() => {
    const result: string[] = [];
    const last7 = allMermas.filter(m => new Date(m.created_at) >= subDays(new Date(), 7));
    
    const vencimiento = last7.filter(m => m.motivo_merma === "vencimiento");
    const dano = last7.filter(m => m.motivo_merma === "daño");
    const error = last7.filter(m => m.motivo_merma === "error");

    if (vencimiento.length > 0) {
      result.push("Hay merma por vencimiento. Considera aplicar FIFO y revisar las cantidades de pedido.");
    }
    if (dano.length > 0) {
      result.push("Se reportan daños frecuentes. Revisa las condiciones de almacenamiento y el manejo de productos.");
    }
    if (error.length > 0) {
      result.push("Existen errores en el registro. Capacita al equipo en el uso correcto del sistema.");
    }
    if (topProducts.length > 0) {
      result.push(`El producto con mayor merma es "${topProducts[0].nombre}". Evalúa si se están pidiendo cantidades excesivas.`);
    }
    if (result.length === 0) {
      result.push("¡Buen trabajo! No se detectan patrones de merma preocupantes esta semana.");
    }
    return result;
  }, [allMermas, topProducts]);

  const getMermaLevel = (pct: number | null) => {
    if (pct === null) return { color: "text-muted-foreground", bg: "bg-secondary", msg: "Datos insuficientes" };
    if (pct <= 5) return { color: "text-primary", bg: "bg-primary/10", msg: "Merma dentro de niveles normales" };
    if (pct <= 8) return { color: "text-amber-600", bg: "bg-amber-50", msg: "Merma por encima de lo recomendado" };
    return { color: "text-destructive", bg: "bg-destructive/10", msg: "Merma alta, revisar procesos" };
  };

  const registerMerma = async (data: {
    producto_id: string;
    bodega_id: string;
    cantidad: number;
    motivo_merma: string;
    descripcion_merma?: string;
    fecha_vencimiento?: string;
  }) => {
    await api.post("/inventory/mermas", data);
    loadData();
  };

  const getProductName = (id: string) => productos.find(p => p.id === id)?.nombre ?? "—";
  const getProductUnit = (id: string) => productos.find(p => p.id === id)?.unidad ?? "";

  return {
    mermas: filteredMermas,
    allMermas,
    productos,
    loading,
    timeRange,
    setTimeRange,
    loadData,
    stats7d,
    stats30d,
    chartData,
    topProducts,
    tips,
    getMermaLevel,
    registerMerma,
    getProductName,
    getProductUnit,
    MOTIVOS,
  };
}