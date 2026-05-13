// src/pages/Consumo/useConsumo.ts
import { useState, useEffect, useMemo } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Categoria, Producto, Receta, CartItem, ConsumptionRecord } from "./types";

export function useConsumo(bodegaId: string = "all", areaId: string | null = null) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasRecetas, setCategoriasRecetas] = useState<Categoria[]>([]);
  const [allRecetas, setAllRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("consumo_cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("consumo_cart", JSON.stringify(cart));
  }, [cart]);
  const [stockByProduct, setStockByProduct] = useState<Record<string, number>>({});
  const [lotsByProduct, setLotsByProduct] = useState<Record<string, { fecha_vencimiento: string; cantidad: number }[]>>({});
  const [consumptionLog, setConsumptionLog] = useState<ConsumptionRecord[]>([]);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [catRes, catRecRes, prodRes, stockRes, recetaRes, logRes] = await Promise.all([
        api.get("/inventory/categories"),
        api.get("/operations/recipes/categories"),
        api.get("/inventory/products"),
        api.get(`/inventory/stock/status?bodega_id=${bodegaId}`),
        api.get("/operations/recipes"),
        api.get(`/inventory/history?tipo_movimiento=consumo&fecha_desde=${today}&fecha_hasta=${today}`),
      ]);

      setCategorias(catRes.data || []);
      setCategoriasRecetas(catRecRes.data || []);
      setProductos(prodRes.data || []);
      setAllRecetas(recetaRes.data || []);
      setConsumptionLog(logRes.data || []);

      const todayStr = new Date().toISOString().split("T")[0];
      const stockMap: Record<string, number> = {};
      const lotsMap: Record<string, { fecha_vencimiento: string; cantidad: number }[]> = {};
      
      (stockRes.data || []).forEach((s: any) => {
        const prodId = s.producto_id;
        
        // --- FILTRO DE VENCIMIENTO ---
        // Si tiene fecha de vencimiento y es anterior a hoy, no lo contamos para el consumo
        if (s.fecha_vencimiento && s.fecha_vencimiento < todayStr) {
          return;
        }

        if (!stockMap[prodId]) {
          stockMap[prodId] = 0;
          lotsMap[prodId] = [];
        }
        stockMap[prodId] += s.stock_actual;
        if (s.stock_actual > 0) {
          lotsMap[prodId].push({
            fecha_vencimiento: s.fecha_vencimiento || "",
            cantidad: s.stock_actual,
          });
        }
      });

      setStockByProduct(stockMap);
      setLotsByProduct(lotsMap);
    } catch (e) {
      console.error("Error loading data:", e);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bodegaId === "none") {
      setStockByProduct({});
      setLotsByProduct({});
      setLoading(false);
      return;
    }
    loadData();
  }, [bodegaId, areaId]);

  const recetas = useMemo(() => {
    if (!areaId) return allRecetas;
    return allRecetas.filter(r => r.areas_operativas_ids?.includes(areaId));
  }, [allRecetas, areaId]);

  const getStock = (productoId: string): number => {
    return stockByProduct[productoId] ?? 0;
  };

  const getAlertStatus = (productoId: string): "normal" | "warning" | "critical" => {
    const stock = getStock(productoId);
    const prod = productos.find(p => p.id === productoId);
    const min = prod?.stock_minimo ?? 0;
    const threshold = prod?.dias_alerta_vencimiento ?? 15;
    
    if (stock <= 0) return "critical";
    
    // Revisar lotes para vencimiento
    const lots = lotsByProduct[productoId] ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let hasExpired = false;
    let isSoon = false;
    
    lots.forEach(l => {
      if (!l.fecha_vencimiento) return;
      const target = new Date(l.fecha_vencimiento + "T00:00:00");
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diffDays < 0) hasExpired = true;
      else if (diffDays <= threshold) isSoon = true;
    });
    
    if (hasExpired) return "critical";
    if (isSoon || stock <= min) return "warning";
    return "normal";
  };

  const filteredProducts = useMemo(() => {
    return productos.filter(p => {
      const stock = stockByProduct[p.id] ?? 0;
      const hasLots = (lotsByProduct[p.id] ?? []).length > 0;
      if (stock === 0 && !hasLots) return false;
      return true;
    });
  }, [productos, stockByProduct, lotsByProduct]);

  const groupedProducts = useMemo(() => {
    return categorias
      .map(c => ({
        ...c,
        productos: filteredProducts.filter(p => p.categoria_id === c.id),
      }))
      .filter(c => c.productos.length > 0);
  }, [categorias, filteredProducts]);

  const groupedRecetas = useMemo(() => {
    return categoriasRecetas
      .map(c => ({
        ...c,
        recetas: recetas.filter(r => r.categoria_receta_id === c.id),
      }))
      .filter(c => c.recetas.length > 0);
  }, [categoriasRecetas, recetas]);

  const addToCart = (item: any, type: "producto" | "receta") => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type);
      if (existing) {
        return prev.map(i => i.id === item.id && i.type === type 
          ? { ...i, quantity: i.quantity + 1 } 
          : i);
      }
      return [...prev, { 
        id: item.id, 
        type, 
        quantity: 1, 
        name: item.nombre, 
        unit: type === "producto" ? item.unidad : "serv.",
        price: type === "producto" ? (item.precio_venta || item.costo_unitario) : item.precio
      }];
    });
    toast.success(`${item.nombre} agregado`);
  };

  const removeFromCart = (id: string, type: string) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  const updateQuantity = (id: string, type: string, qty: number) => {
    if (qty <= 0) return;
    setCart(prev => prev.map(i => i.id === id && i.type === type ? { ...i, quantity: qty } : i));
  };

  const refreshLog = async () => {
    await loadData();
  };

  const updateConsumo = async (recordId: string, data: { cantidad: number; motivo_merma?: string; descripcion_merma?: string }) => {
    try {
      await api.put(`/inventory/stock/consume/${recordId}`, data);
      toast.success("Consumo actualizado");
      refreshLog();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al actualizar consumo");
      throw e;
    }
  };

  const deleteConsumo = async (recordId: string) => {
    try {
      await api.delete(`/inventory/stock/consume/${recordId}`);
      toast.success("Consumo eliminado");
      refreshLog();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al eliminar consumo");
      throw e;
    }
  };

  const getRecipeAvailability = (recetaId: string): number => {
    const receta = allRecetas.find(r => r.id === recetaId);
    if (!receta || !receta.ingredientes?.length) return 0;
    
    let minAvailability = Infinity;
    receta.ingredientes.forEach(ing => {
      const stock = getStock(ing.producto_id);
      const possible = Math.floor(stock / ing.cantidad);
      if (possible < minAvailability) minAvailability = possible;
    });
    
    return minAvailability === Infinity ? 0 : minAvailability;
  };

  return {
    productos: filteredProducts,
    categorias,
    categoriasRecetas,
    recetas,
    cart,
    loading,
    saving,
    setSaving,
    setCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    getStock,
    getAlertStatus,
    getRecipeAvailability,
    groupedProducts,
    groupedRecetas,
    consumptionLog,
    refreshLog,
    updateConsumo,
    deleteConsumo,
  };
}