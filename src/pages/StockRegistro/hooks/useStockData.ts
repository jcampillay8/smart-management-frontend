// src/pages/StockRegistro/hooks/useStockData.ts

import { useState, useEffect, useCallback } from "react";
import api from "../../../lib/api";
import { toast } from "sonner";
import { buildInventorySnapshot, InventorySnapshot } from "../../../lib/inventory";
import { StockEntry, Producto, Categoria } from "../types";

interface Bodega {
  id: string;
  nombre: string;
}

export function useStockData(selectedBodegaId: string, activeBodegaIdForInsert: string) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [entries, setEntries] = useState<Record<string, StockEntry>>({});
  const [initialEntries, setInitialEntries] = useState<string>("");
  const [productBodegaMap, setProductBodegaMap] = useState<Record<string, Set<string>>>({});
  
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, recordsRes, bodRes] = await Promise.all([
        api.get("/inventory/categories"),
        api.get("/inventory/products"),
        api.get("/inventory/history/"),
        api.get("/inventory/bodegas"),
      ]);

      setCategorias(catRes.data);
      setProductos(prodRes.data);
      setBodegas(bodRes.data);
      
      const pbMap: Record<string, Set<string>> = {};
      prodRes.data.forEach((p: any) => {
        pbMap[p.id] = new Set(p.bodegas_config?.map((bc: any) => bc.bodega_id) || []);
      });
      setProductBodegaMap(pbMap);

      const allRecords = recordsRes.data;
      const loadedBodegas = bodRes.data;
      const init: Record<string, StockEntry> = {};

      const currentSnapshot = buildInventorySnapshot(allRecords, new Date().toISOString(), selectedBodegaId);
      setSnapshot(currentSnapshot);

      if (selectedBodegaId === "all") {
        loadedBodegas.forEach((bodega: Bodega) => {
          const bSnapshot = buildInventorySnapshot(allRecords, new Date().toISOString(), bodega.id);
          
          prodRes.data.forEach((p: Producto) => {
            const lots = (bSnapshot.lotsByProduct[p.id] ?? []).filter(l => l.cantidad > 0);
            if (lots.length === 0) return;

            const key = `${p.id}::${bodega.id}`;
            init[key] = {
              cantidad: lots.length === 1 ? String(lots[0].cantidad) : "",
              fecha_recuento: today,
              fecha_vencimiento: lots.length === 1 ? lots[0].fecha_vencimiento : "",
              multiExpiry: lots.length > 1,
              expiryEntries: lots.map(l => ({ 
                fecha_vencimiento: l.fecha_vencimiento, 
                cantidad: String(l.cantidad) 
              })),
            };
          });
        });
      } else {
        prodRes.data.forEach((p: Producto) => {
          const lots = (currentSnapshot.lotsByProduct[p.id] ?? []).filter(l => l.cantidad > 0);
          init[p.id] = {
            cantidad: lots.length === 1 ? String(lots[0].cantidad) : "",
            fecha_recuento: today,
            fecha_vencimiento: lots.length === 1 ? lots[0].fecha_vencimiento : "",
            multiExpiry: lots.length > 1,
            expiryEntries: lots.map(l => ({ 
              fecha_vencimiento: l.fecha_vencimiento, 
              cantidad: String(l.cantidad) 
            })),
          };
        });
      }

      setEntries(init);
      setInitialEntries(JSON.stringify(init));
    } catch (error) {
      console.error("Error loading stock data:", error);
      toast.error("Error al sincronizar con el inventario");
    } finally {
      setLoading(false);
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
            ? [{ fecha_vencimiento: entry.fecha_vencimiento || "", cantidad: entry.cantidad || "" }]
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
          expiryEntries: [...entry.expiryEntries, { fecha_vencimiento: "", cantidad: "" }]
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