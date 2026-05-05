// src/pages/Informes/useInformes.ts
import { useState, useEffect, useMemo } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { KpiData, PeriodType } from "./types";
import { formatMoney } from "../../lib/format";
import { 
  startOfWeek, startOfMonth, endOfWeek, endOfMonth, differenceInDays, 
  eachWeekOfInterval, eachMonthOfInterval, format, subDays 
} from "date-fns";
import { es } from "date-fns/locale";

interface Producto {
  id: string;
  nombre: string;
  unidad: string;
  categoria_id: string;
  costo_unitario: number;
  stock_minimo?: number;
  bodegas_config?: Array<{ bodega_id: string; stock_minimo: number; stock_actual: number }>;
}

interface Categoria {
  id: string;
  nombre: string;
}

interface Registro {
  id: string;
  producto_id: string;
  tipo_movimiento: string;
  cantidad: number;
  fecha_recuento: string;
  created_at: string;
  bodega_id: string;
  motivo_merma?: string | null;
  descripcion_merma?: string | null;
}

interface Compra {
  id: string;
  total: number;
  created_at: string;
  estado: string;
}

export function useInformes(selectedBodegas: string[] = ["all"]) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [bodegas, setBodegas] = useState<Array<{ id: string; nombre: string }>>([]);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState<PeriodType>("month");
  const [customStart, setCustomStart] = useState<Date>(subDays(new Date(), 30));
  const [customEnd, setCustomEnd] = useState<Date>(new Date());

  const { dateFrom, dateTo, prevFrom, prevTo } = useMemo(() => {
    const now = new Date();
    let from: Date, to: Date;
    if (period === "week") {
      from = startOfWeek(now, { locale: es });
      to = endOfWeek(now, { locale: es });
    } else if (period === "month") {
      from = startOfMonth(now);
      to = endOfMonth(now);
    } else {
      from = customStart;
      to = customEnd;
    }
    const diff = differenceInDays(to, from) + 1;
    return {
      dateFrom: from,
      dateTo: to,
      prevFrom: subDays(from, diff),
      prevTo: subDays(from, 1),
    };
  }, [period, customStart, customEnd]);

  const filteredRegistros = useMemo(() => {
    if (selectedBodegas.includes("all")) return registros;
    return registros.filter(r => selectedBodegas.includes(r.bodega_id));
  }, [registros, selectedBodegas]);

  const currentRecords = useMemo(() =>
    filteredRegistros.filter(r => {
      const d = new Date(r.fecha_recuento + "T12:00:00");
      return d >= dateFrom && d <= dateTo;
    }), [filteredRegistros, dateFrom, dateTo]);

  const prevRecords = useMemo(() =>
    filteredRegistros.filter(r => {
      const d = new Date(r.fecha_recuento + "T12:00:00");
      return d >= prevFrom && d <= prevTo;
    }), [filteredRegistros, prevFrom, prevTo]);

  const inventorySnapshot = useMemo(() => {
    const snapshot: Record<string, number> = {};
    filteredRegistros.forEach(r => {
      const qty = Number(r.cantidad);
      if (!snapshot[r.producto_id]) snapshot[r.producto_id] = 0;
      if (r.tipo_movimiento === "entrada" || r.tipo_movimiento === "conteo") {
        snapshot[r.producto_id] += qty;
      } else if (r.tipo_movimiento === "consumo" || r.tipo_movimiento === "merma" || r.tipo_movimiento === "ajuste_negativo") {
        snapshot[r.producto_id] -= qty;
      }
    });
    return snapshot;
  }, [filteredRegistros]);

  const kpis = useMemo<KpiData>(() => {
    let inventoryValue = 0;
    let criticalCount = 0;

    productos.forEach(p => {
      const qty = inventorySnapshot[p.id] ?? 0;
      inventoryValue += qty * (p.costo_unitario || 0);
      
      const bodegaConfig = p.bodegas_config?.find(b => 
        selectedBodegas.includes("all") || selectedBodegas.includes(b.bodega_id)
      );
      const stockMin = bodegaConfig?.stock_minimo ?? p.stock_minimo ?? 0;
      if (qty <= stockMin && qty >= 0) criticalCount++;
    });

    const mermaRecords = currentRecords.filter(r => r.tipo_movimiento === "merma");
    const prevMermaRecords = prevRecords.filter(r => r.tipo_movimiento === "merma");
    
    let mermaValue = 0;
    mermaRecords.forEach(r => {
      const p = productos.find(pr => pr.id === r.producto_id);
      mermaValue += (p?.costo_unitario ?? 0) * Number(r.cantidad);
    });
    
    let prevMermaValue = 0;
    prevMermaRecords.forEach(r => {
      const p = productos.find(pr => pr.id === r.producto_id);
      prevMermaValue += (p?.costo_unitario ?? 0) * Number(r.cantidad);
    });

    let comprasValue = 0;
    const filteredCompras = compras.filter(c => {
      const d = new Date(c.created_at);
      return d >= dateFrom && d <= dateTo && c.estado === "realizada";
    });
    comprasValue = filteredCompras.reduce((sum, c) => sum + Number(c.total), 0);
    
    const entradas = currentRecords.filter(r => r.tipo_movimiento === "entrada" || r.tipo_movimiento === "conteo");
    entradas.forEach(r => {
      const p = productos.find(pr => pr.id === r.producto_id);
      comprasValue += (p?.costo_unitario ?? 0) * Number(r.cantidad);
    });

    const prevCompras = compras.filter(c => {
      const d = new Date(c.created_at);
      return d >= prevFrom && d <= prevTo && c.estado === "realizada";
    });
    let prevComprasValue = prevCompras.reduce((sum, c) => sum + Number(c.total), 0);
    
    const prevEntradas = prevRecords.filter(r => r.tipo_movimiento === "entrada" || r.tipo_movimiento === "conteo");
    prevEntradas.forEach(r => {
      const p = productos.find(pr => pr.id === r.producto_id);
      prevComprasValue += (p?.costo_unitario ?? 0) * Number(r.cantidad);
    });

    const mermaPct = inventoryValue > 0 ? (mermaValue / inventoryValue) * 100 : 0;
    const prevMermaPct = 0; // Not used currently in UI, removing old purchases calc

    const consumoRecords = currentRecords.filter(r => r.tipo_movimiento === "consumo");
    let consumoValue = 0;
    consumoRecords.forEach(r => {
      const p = productos.find(pr => pr.id === r.producto_id);
      consumoValue += (p?.costo_unitario ?? 0) * Number(r.cantidad);
    });

    const calcVariation = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    const rotation = inventoryValue > 0 ? consumoValue / inventoryValue : 0;
    const periodDays = Math.max(1, differenceInDays(dateTo, dateFrom) + 1);
    const dailyConsumo = consumoValue / periodDays;
    const coverageDays = dailyConsumo > 0 ? Math.round(inventoryValue / dailyConsumo) : 999;

    const movedProducts = new Set(currentRecords.map(r => r.producto_id));
    const productsWithStock = productos.filter(p => (inventorySnapshot[p.id] ?? 0) > 0);
    const noMovementCount = productsWithStock.filter(p => !movedProducts.has(p.id)).length;

    let totalEntradas = 0, totalSalidas = 0;
    currentRecords.forEach(r => {
      const p = productos.find(pr => pr.id === r.producto_id);
      const val = (p?.costo_unitario ?? 0) * Number(r.cantidad);
      if (r.tipo_movimiento === "entrada" || r.tipo_movimiento === "conteo") totalEntradas += val;
      else if (r.tipo_movimiento === "consumo" || r.tipo_movimiento === "merma") totalSalidas += val;
    });

    return {
      inventoryValue,
      mermaValue,
      prevMermaValue,
      mermaVariation: calcVariation(mermaValue, prevMermaValue),
      mermaPct,
      prevMermaPct,
      criticalCount,
      comprasValue,
      prevComprasValue,
      comprasVariation: calcVariation(comprasValue, prevComprasValue),
      consumoValue,
      rotation: rotation.toFixed(2),
      coverageDays,
      noMovementCount,
      totalEntradas,
      totalSalidas,
    };
  }, [productos, currentRecords, prevRecords, inventorySnapshot, compras, dateFrom, dateTo, prevFrom, prevTo, selectedBodegas]);

  const financialChartData = useMemo(() => {
    const days = differenceInDays(dateTo, dateFrom);
    const useWeeks = days > 14;
    const intervals = useWeeks
      ? eachWeekOfInterval({ start: dateFrom, end: dateTo }, { locale: es })
      : Array.from({ length: days + 1 }, (_, i) => subDays(dateTo, days - i));

    return intervals.map(intervalStart => {
      const intervalEnd = useWeeks ? new Date(intervalStart.getTime() + 6 * 86400000) : intervalStart;
      const label = useWeeks
        ? `Sem ${format(intervalStart, "dd/MM", { locale: es })}`
        : format(intervalStart, "dd/MM", { locale: es });

      let compras = 0, consumo = 0, merma = 0;
      currentRecords.forEach(r => {
        const d = new Date(r.fecha_recuento + "T12:00:00");
        if (d < intervalStart || d > intervalEnd) return;
        const p = productos.find(pr => pr.id === r.producto_id);
        const val = (p?.costo_unitario ?? 0) * Number(r.cantidad);
        if (r.tipo_movimiento === "entrada" || r.tipo_movimiento === "conteo") compras += val;
        else if (r.tipo_movimiento === "consumo") consumo += val;
        else if (r.tipo_movimiento === "merma") merma += val;
      });
      return { name: label, Compras: Math.round(compras), Consumo: Math.round(consumo), Merma: Math.round(merma) };
    });
  }, [currentRecords, productos, dateFrom, dateTo]);

  const categoryDistribution = useMemo(() => {
    const catValues: Record<string, number> = {};
    productos.forEach(p => {
      const qty = inventorySnapshot[p.id] ?? 0;
      const cat = categorias.find(c => c.id === p.categoria_id);
      const name = cat?.nombre ?? "Sin categoria";
      catValues[name] = (catValues[name] ?? 0) + qty * (p.costo_unitario || 0);
    });
    return Object.entries(catValues)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [productos, categorias, inventorySnapshot]);

  const topMerma = useMemo(() => {
    const mermaRecords = currentRecords.filter(r => r.tipo_movimiento === "merma");
    const byProduct: Record<string, number> = {};
    mermaRecords.forEach(r => {
      const p = productos.find(pr => pr.id === r.producto_id);
      byProduct[r.producto_id] = (byProduct[r.producto_id] ?? 0) + (p?.costo_unitario ?? 0) * Number(r.cantidad);
    });
    return Object.entries(byProduct)
      .map(([id, value]) => ({ name: productos.find(p => p.id === id)?.nombre ?? "?", value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [currentRecords, productos]);

  const mermaEvolution = useMemo(() => {
    const days = differenceInDays(dateTo, dateFrom);
    const useWeeks = days > 14;
    const intervals = useWeeks
      ? eachWeekOfInterval({ start: dateFrom, end: dateTo }, { locale: es })
      : Array.from({ length: days + 1 }, (_, i) => subDays(dateTo, days - i));

    return intervals.map(intervalStart => {
      const intervalEnd = useWeeks ? new Date(intervalStart.getTime() + 6 * 86400000) : intervalStart;
      const label = useWeeks
        ? `Sem ${format(intervalStart, "dd/MM", { locale: es })}`
        : format(intervalStart, "dd/MM", { locale: es });
      let total = 0;
      currentRecords.filter(r => r.tipo_movimiento === "merma").forEach(r => {
        const d = new Date(r.fecha_recuento + "T12:00:00");
        if (d < intervalStart || d > intervalEnd) return;
        const p = productos.find(pr => pr.id === r.producto_id);
        total += (p?.costo_unitario ?? 0) * Number(r.cantidad);
      });
      return { name: label, Merma: Math.round(total) };
    });
  }, [currentRecords, productos, dateFrom, dateTo]);

  const mermaPorCategoria = useMemo(() => {
    const mermaRecords = currentRecords.filter(r => r.tipo_movimiento === "merma");
    const byCat: Record<string, number> = {};
    mermaRecords.forEach(r => {
      const p = productos.find(pr => pr.id === r.producto_id);
      const cat = categorias.find(c => c.id === p?.categoria_id);
      const name = cat?.nombre ?? "Sin categoria";
      byCat[name] = (byCat[name] ?? 0) + (p?.costo_unitario ?? 0) * Number(r.cantidad);
    });
    return Object.entries(byCat)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [currentRecords, productos, categorias]);

  const topConsumidos = useMemo(() => {
    const consumoRecords = currentRecords.filter(r => r.tipo_movimiento === "consumo");
    const consumoByProduct: Record<string, number> = {};
    consumoRecords.forEach(r => {
      consumoByProduct[r.producto_id] = (consumoByProduct[r.producto_id] ?? 0) + Number(r.cantidad);
    });
    return Object.entries(consumoByProduct)
      .map(([id, qty]) => ({ name: productos.find(p => p.id === id)?.nombre ?? "?", value: Math.round(qty) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [currentRecords, productos]);

  const lowRotation = useMemo(() => {
    const consumoRecords = currentRecords.filter(r => r.tipo_movimiento === "consumo");
    const consumoByProduct: Record<string, number> = {};
    consumoRecords.forEach(r => {
      consumoByProduct[r.producto_id] = (consumoByProduct[r.producto_id] ?? 0) + Number(r.cantidad);
    });

    const productsWithStock = productos.filter(p => (inventorySnapshot[p.id] ?? 0) > 0);
    return productsWithStock
      .map(p => {
        const stock = inventorySnapshot[p.id] ?? 0;
        const consumed = consumoByProduct[p.id] ?? 0;
        const rot = stock > 0 ? consumed / stock : 0;
        return { name: p.nombre, rotation: rot, stock, consumed };
      })
      .filter(p => p.rotation < 0.5 && p.stock > 0)
      .sort((a, b) => a.rotation - b.rotation)
      .slice(0, 5);
  }, [productos, currentRecords, inventorySnapshot]);

  const insights = useMemo(() => {
    const items: Array<{ type: "success" | "warning" | "danger"; icon: any; text: string }> = [];

    if (kpis.mermaVariation > 10) {
      items.push({ type: "danger", icon: null, text: `La merma aumento un ${Math.abs(kpis.mermaVariation).toFixed(0)}% respecto al periodo anterior` });
    } else if (kpis.mermaVariation < -10) {
      items.push({ type: "success", icon: null, text: `La merma disminuyo un ${Math.abs(kpis.mermaVariation).toFixed(0)}% respecto al periodo anterior` });
    }

    if (topMerma.length > 0) {
      items.push({ type: "warning", icon: null, text: `"${topMerma[0].name}" representa la mayor perdida del periodo: ${formatMoney(topMerma[0].value)}` });
    }

    if (kpis.coverageDays < 999) {
      items.push({
        type: kpis.coverageDays < 7 ? "danger" : "success",
        icon: null,
        text: `Tu inventario actual cubre aproximadamente ${kpis.coverageDays} dias de operacion`,
      });
    }

    if (kpis.noMovementCount > 0) {
      items.push({ type: "warning", icon: null, text: `${kpis.noMovementCount} producto${kpis.noMovementCount > 1 ? "s" : ""} con stock no tuvo movimiento este periodo` });
    }

    if (kpis.criticalCount > 0) {
      items.push({ type: "danger", icon: null, text: `${kpis.criticalCount} producto${kpis.criticalCount > 1 ? "s" : ""} con stock critico o agotado` });
    }

    const overStockCategories = categoryDistribution.filter(c => c.value > kpis.inventoryValue * 0.4);
    if (overStockCategories.length > 0 && categoryDistribution.length > 1) {
      items.push({ type: "warning", icon: null, text: `La categoria "${overStockCategories[0].name}" concentra mas del 40% del valor de tu inventario` });
    }

    return items;
  }, [kpis, topMerma, categoryDistribution]);

  const loadData = async () => {
    try {
      const [catRes, prodRes, bodegasRes, comprasRes] = await Promise.all([
        api.get("/inventory/categories"),
        api.get("/inventory/products"),
        api.get("/inventory/bodegas"),
        api.get("/purchases/"),
      ]);

      setCategorias(catRes.data || []);
      setProductos(prodRes.data || []);
      setBodegas(bodegasRes.data || []);
      setCompras(comprasRes.data || []);

      const fromStr = format(dateFrom, "yyyy-MM-dd");
      const toStr = format(dateTo, "yyyy-MM-dd");
      const historyRes = await api.get(`/inventory/history/?fecha_desde=${fromStr}&fecha_hasta=${toStr}`);
      setRegistros(historyRes.data || []);

    } catch (e) {
      toast.error("Error al cargar los datos");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo, selectedBodegas]);

  return {
    productos,
    categorias,
    registros,
    compras,
    bodegas,
    loading,
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    dateFrom,
    dateTo,
    kpis,
    financialChartData,
    categoryDistribution,
    topMerma,
    mermaEvolution,
    mermaPorCategoria,
    topConsumidos,
    lowRotation,
    insights,
    loadData,
  };
}
