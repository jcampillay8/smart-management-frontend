// src/pages/StockRegistro/useStockData.ts

import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { buildInventorySnapshot } from "../../lib/inventory";
import { StockEntry, Producto, Categoria } from "./types";

// Definimos una interfaz local para Bodega para tipar el estado
interface Bodega {
  id: string;
  nombre: string;
}

export function useStockData(selectedBodegaId: string, activeBodegaIdForInsert: string) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]); // <-- Agregado
  const [entries, setEntries] = useState<Record<string, StockEntry>>({});
  const [initialEntries, setInitialEntries] = useState<string>("");
  const [productBodegaMap, setProductBodegaMap] = useState<Record<string, Set<string>>>({});

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
      setBodegas(bodRes.data); // <-- Guardamos las bodegas
      
      const pbMap: Record<string, Set<string>> = {};
      prodRes.data.forEach((p: any) => {
        pbMap[p.id] = new Set(p.bodegas_config?.map((bc: any) => bc.bodega_id) || []);
      });
      setProductBodegaMap(pbMap);

      const allRecords = recordsRes.data;
      const loadedBodegas = bodRes.data;
      const init: Record<string, StockEntry> = {};

      if (selectedBodegaId === "all") {
        for (const bodega of loadedBodegas) {
          const snapshot = buildInventorySnapshot(allRecords, new Date().toISOString(), bodega.id);
          prodRes.data.forEach((p: Producto) => {
            const lots = (snapshot.lotsByProduct[p.id] ?? []).filter(l => l.cantidad > 0);
            if (lots.length === 0) return;
            init[`${p.id}::${bodega.id}`] = {
              cantidad: lots.length === 1 ? String(lots[0].cantidad) : "",
              fecha_recuento: today,
              fecha_vencimiento: lots.length === 1 ? lots[0].fecha_vencimiento : "",
              multiExpiry: lots.length > 1,
              expiryEntries: lots.map(l => ({ fecha_vencimiento: l.fecha_vencimiento, cantidad: String(l.cantidad) })),
            };
          });
        }
      } else {
        const snapshot = buildInventorySnapshot(allRecords, new Date().toISOString(), selectedBodegaId);
        prodRes.data.forEach((p: Producto) => {
          const lots = (snapshot.lotsByProduct[p.id] ?? []).filter(l => l.cantidad > 0);
          init[p.id] = {
            cantidad: lots.length === 1 ? String(lots[0].cantidad) : "",
            fecha_recuento: today,
            fecha_vencimiento: lots.length === 1 ? lots[0].fecha_vencimiento : "",
            multiExpiry: lots.length > 1,
            expiryEntries: lots.map(l => ({ fecha_vencimiento: l.fecha_vencimiento, cantidad: String(l.cantidad) })),
          };
        });
      }

      setEntries(init);
      setInitialEntries(JSON.stringify(init));
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [selectedBodegaId, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateEntry = (key: string, field: keyof StockEntry, value: any) => {
    setEntries(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const isDirty = () => JSON.stringify(entries) !== initialEntries;

  return {
    categorias,
    productos,
    bodegas, // <-- Retornamos las bodegas
    entries,
    setEntries,
    loading,
    saving,
    setSaving,
    productBodegaMap,
    updateEntry,
    isDirty,
    loadData,
    today
  };
}