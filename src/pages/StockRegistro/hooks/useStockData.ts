// src/pages/StockRegistro/hooks/useStockData.ts

import { useState, useEffect, useCallback } from "react";
import api from "../../../lib/api";
import { toast } from "sonner";
import { StockEntry, Producto, Categoria } from "../types";

interface Bodega {
  id: string;
  nombre: string;
  color?: string;
  icono?: string;
}

export function useStockData(selectedBodegaId: string, activeBodegaIdForInsert: string) {
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [entries, setEntries] = useState<Record<string, StockEntry>>({});
  const [initialEntries, setInitialEntries] = useState<string>("");
  const [productBodegaMap, setProductBodegaMap] = useState<Record<string, Set<string>>>({});
  
  const [snapshot, setSnapshot] = useState<any>(null);

  const today = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    if (!hasLoadedOnce) setLoading(true);
    try {
      const [catRes, prodRes, statusRes, bodRes, pbRes] = await Promise.all([
        api.get("/inventory/categories"),
        api.get("/inventory/products"),
        api.get(`/inventory/stock/status?bodega_id=${selectedBodegaId}`),
        api.get("/inventory/bodegas"),
        api.get("/inventory/product-setup"),
      ]);

      setCategorias(catRes.data);
      setProductos(prodRes.data);
      setBodegas(bodRes.data);
      
      // Construir mapa de productos por bodega desde product-setup
      const pbMap: Record<string, Set<string>> = {};
      prodRes.data.forEach((p: any) => {
        pbMap[p.id] = new Set(p.bodegas_config?.map((bc: any) => bc.bodega_id) || []);
      });
      setProductBodegaMap(pbMap);

      // El backend ya calcula el snapshot con Polars
      const backendSnapshot = statusRes.data || [];
      const loadedBodegas = bodRes.data;

      // Convertir snapshot del backend al formato que espera la UI
      const selectedIds = selectedBodegaId === "all" 
        ? loadedBodegas.map((b: any) => b.id) 
        : selectedBodegaId.split(",").filter(Boolean);
      
      const isMulti = selectedIds.length > 1;
      const init: Record<string, StockEntry> = {};

      selectedIds.forEach((bId: string) => {
        const bodega = loadedBodegas.find((b: any) => b.id === bId);
        if (!bodega) return;

        // Obtener productos configurados en esta bodega
        const productosEnBodega = prodRes.data.filter((p: Producto) => {
          const configs = p.bodegas_config || [];
          return configs.some((bc: any) => bc.bodega_id === bId);
        });
        
        productosEnBodega.forEach((p: Producto) => {
          const lots = backendSnapshot.filter((s: any) => 
            s.bodega_id === bId && s.producto_id === p.id && s.stock_actual > 0
          );
          
          const key = isMulti ? `${p.id}::${bId}` : p.id;
          init[key] = {
            cantidad: lots.length === 1 ? lots[0].stock_actual : 0,
            fecha_recuento: today,
            fecha_vencimiento: lots.length === 1 ? (lots[0].fecha_vencimiento || "") : "",
            multiExpiry: lots.length > 1,
            expiryEntries: lots.length > 0 ? lots.map(l => ({ 
              fecha_vencimiento: l.fecha_vencimiento || "", 
              cantidad: l.stock_actual 
            })) : [],
          };
        });
      });

      setEntries(init);
      setInitialEntries(JSON.stringify(init));
    } catch (error) {
      console.error("Error loading stock data:", error);
      toast.error("Error al sincronizar con el inventario");
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [selectedBodegaId, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actualización básica de campos simples
  const updateEntry = useCallback((key: string, field: keyof StockEntry, value: any) => {
    setEntries(prev => ({ 
      ...prev, 
      [key]: { ...prev[key], [field]: value } 
    }));
  }, []);

  // --- Mejoras: Funciones de Gestión de Lotes (Multi-Expiry) ---

  const toggleMultiExpiry = useCallback((key: string, checked: boolean) => {
    setEntries(prev => {
      const entry = prev[key];
      if (!entry) return prev;
      return {
        ...prev,
        [key]: {
          ...entry,
          multiExpiry: checked,
          // Al activar, si no hay lotes, inicializamos con el valor actual
          expiryEntries: checked && entry.expiryEntries.length === 0
            ? [{ fecha_vencimiento: entry.fecha_vencimiento || "", cantidad: entry.cantidad || 0 }]
            : entry.expiryEntries,
        }
      };
    });
  }, []);

  const addExpiryEntry = useCallback((key: string) => {
    setEntries(prev => {
      const entry = prev[key];
      if (!entry) return prev;
      return {
        ...prev,
        [key]: {
          ...entry,
          expiryEntries: [...entry.expiryEntries, { fecha_vencimiento: "", cantidad: 0 }]
        }
      };
    });
  }, []);

  const removeExpiryEntry = useCallback((key: string, idx: number) => {
    setEntries(prev => {
      const entry = prev[key];
      if (!entry) return prev;
      const newEntries = entry.expiryEntries.filter((_, i) => i !== idx);
      return {
        ...prev,
        [key]: {
          ...entry,
          expiryEntries: newEntries
        }
      };
    });
  }, []);

  const updateExpiryEntry = useCallback((key: string, idx: number, field: string, value: any) => {
    setEntries(prev => {
      const entry = prev[key];
      if (!entry) return prev;
      const newEntries = [...entry.expiryEntries];
      newEntries[idx] = { ...newEntries[idx], [field]: value };
      return {
        ...prev,
        [key]: {
          ...entry,
          expiryEntries: newEntries
        }
      };
    });
  }, []);

  return {
    categorias,
    productos,
    bodegas,
    entries,
    initialEntries,
    snapshot,
    loading,
    saving,
    setSaving,
    productBodegaMap,
    updateEntry,
    // Nuevas funciones exportadas
    toggleMultiExpiry,
    addExpiryEntry,
    removeExpiryEntry,
    updateExpiryEntry,
    isDirty: () => JSON.stringify(entries) !== initialEntries,
    loadData,
    today
  };
}