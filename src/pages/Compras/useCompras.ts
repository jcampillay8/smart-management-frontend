// src/pages/Compras/useCompras.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Compra } from "./types";

export function useCompras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/inventory/compras/");
      setCompras(res.data);
    } catch (error) {
      toast.error("Error al cargar compras");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const deleteCompra = async (id: string) => {
    try {
      await api.delete(`/inventory/compras/${id}`);
      toast.success("Compra eliminada");
      loadAll();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return { compras, loading, deleteCompra, loadAll };
}