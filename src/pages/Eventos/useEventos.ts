// src/pages/Eventos/useEventos.ts
import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { buildInventorySnapshot } from "../../lib/inventory";
import { Evento, Producto } from "./types";

export function useEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<any[]>([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [prodRes, eventosRes, regRes, recetasRes] = await Promise.all([
        api.get("/inventory/products"),
        api.get("/operations/events/"),
        api.get("/inventory/history/"),
        api.get("/operations/recipes/"),
      ]);
      setProductos(prodRes.data);
      setRecetas(recetasRes.data);
      setAllRecords(regRes.data);
      
      const mapped = eventosRes.data.map((e: any) => ({
        ...e,
        items: e.productos.map((p: any) => ({
          producto_id: p.producto_id,
          cantidad: p.cantidad,
          bodega_id: p.bodega_id
        }))
      }));
      setEventos(mapped);
    } catch (error) {
      toast.error("Error al cargar eventos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAction = async (id: string, action: "execute" | "cancel" | "delete") => {
    try {
      if (action === "delete") await api.delete(`/operations/events/${id}`);
      else if (action === "execute") await api.post(`/operations/events/${id}/execute`);
      else await api.patch(`/operations/events/${id}/cancel`);
      
      toast.success(`Evento ${action === "delete" ? "eliminado" : "actualizado"}`);
      loadData();
    } catch (e) {
      toast.error("Error al procesar la acción");
    }
  };

  return { eventos, productos, recetas, loading, handleAction, loadData };
}