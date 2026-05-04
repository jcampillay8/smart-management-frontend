// src/pages/Eventos/useEventos.ts
import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Evento, Producto, Receta, EventoItem, EventoReceta } from "./types";

export function useEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load events (may fail if backend has issues)
      let eventosData = [];
      try {
        const res = await api.get("/operations/events/");
        eventosData = res.data || [];
      } catch (e) {
        console.error("Failed to load events:", e);
      }
      
      setEventos(eventosData.map((e: any) => ({
        ...e,
        items: (e.productos || []).map((p: any) => ({
          producto_id: p.producto_id,
          cantidad: p.cantidad,
          bodega_id: p.bodega_id
        })),
        recetas: (e.recetas || []).map((r: any) => ({
          receta_id: r.receta_id,
          cantidad: r.cantidad
        }))
      })));

      // Load products
      try {
        const prodRes = await api.get("/inventory/products");
        setProductos(prodRes.data || []);
      } catch (e) {
        console.error("Failed to load products:", e);
      }

      // Load recipes
      try {
        const rRes = await api.get("/operations/recipes/");
        setRecetas(rRes.data || []);
      } catch (e) {
        console.error("Failed to load recipes:", e);
      }

      // Load current stocks
      try {
        const stockRes = await api.get("/inventory/product-bodega");
        setStocks(stockRes.data || []);
      } catch (e) {
        console.error("Failed to load stocks:", e);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const prodName = (id: string) => productos.find(p => p.id === id)?.nombre ?? "—";
  const prodUnit = (id: string) => productos.find(p => p.id === id)?.unidad ?? "";
  const prodCost = (id: string) => productos.find(p => p.id === id)?.costo_unitario ?? 0;

  const getEventCost = (items: EventoItem[]) => {
    return items.reduce((sum, item) => sum + item.cantidad * prodCost(item.producto_id), 0);
  };

  const createEvento = async (nombre: string, fecha: string, items: EventoItem[], recetas: EventoReceta[], valorPublico?: number) => {
    try {
      await api.post("/operations/events/", {
        nombre,
        fecha,
        productos: items,
        recetas,
        valor_publico: valorPublico || null
      });
      toast.success("Evento creado");
      loadData();
    } catch (error: any) {
      toast.error("Error: " + (error.response?.data?.detail || "Error al crear"));
      throw error;
    }
  };

  const updateEvento = async (id: string, nombre: string, fecha: string, items: EventoItem[], recetas: EventoReceta[], valorPublico?: number) => {
    try {
      await api.put(`/operations/events/${id}`, {
        nombre,
        fecha,
        productos: items,
        recetas,
        valor_publico: valorPublico || null
      });
      toast.success("Evento actualizado");
      loadData();
    } catch (error: any) {
      toast.error("Error: " + (error.response?.data?.detail || "Error al actualizar"));
      throw error;
    }
  };

  const deleteEvento = async (id: string) => {
    try {
      await api.delete(`/operations/events/${id}`);
      toast.success("Evento eliminado");
      loadData();
    } catch (error: any) {
      toast.error("Error: " + (error.response?.data?.detail || "Error al eliminar"));
      throw error;
    }
  };

  const executeEvento = async (id: string) => {
    try {
      await api.post(`/operations/events/${id}/execute`);
      toast.success("Evento ejecutado");
      loadData();
    } catch (error: any) {
      toast.error("Error: " + (error.response?.data?.detail || "Error al ejecutar"));
      throw error;
    }
  };

  const cancelEvento = async (id: string) => {
    try {
      await api.patch(`/operations/events/${id}/cancel`);
      toast.success("Evento cancelado");
      loadData();
    } catch (error: any) {
      toast.error("Error: " + (error.response?.data?.detail || "Error al cancelar"));
      throw error;
    }
  };

  const reactivateEvento = async (id: string) => {
    try {
      await api.patch(`/operations/events/${id}/reactivate`);
      toast.success("Evento reactivado");
      loadData();
    } catch (error: any) {
      toast.error("Error: " + (error.response?.data?.detail || "Error al reactivar"));
      throw error;
    }
  };

  return {
    eventos,
    productos,
    recetas,
    loading,
    loadData,
    createEvento,
    updateEvento,
    deleteEvento,
    executeEvento,
    cancelEvento,
    reactivateEvento,
    prodName,
    prodUnit,
    prodCost,
    getEventCost,
    stocks
  };
}