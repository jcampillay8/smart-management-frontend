// src/pages/Compras/useCompras.ts
import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Compra } from "./types";

export function useCompras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/purchases/");
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
      await api.delete(`/purchases/${id}`);
      toast.success("Compra eliminada");
      loadAll();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const cancelCompra = async (id: string) => {
    try {
      await api.patch(`/purchases/${id}/cancel`);
      toast.success("Compra cancelada");
      loadAll();
    } catch (error) {
      toast.error("Error al cancelar");
    }
  };

  const restoreCompra = async (id: string) => {
    try {
      await api.patch(`/purchases/${id}/restore`);
      toast.success("Compra restaurada");
      loadAll();
    } catch (error) {
      toast.error("Error al restaurar");
    }
  };

  const markPedido = async (id: string) => {
    try {
      await api.patch(`/purchases/${id}/pedido`);
      toast.success("Pedido marcado como realizado");
      loadAll();
    } catch (error) {
      toast.error("Error al marcar pedido");
    }
  };

  const receiveCompra = async (id: string) => {
    try {
      await api.patch(`/purchases/${id}/receive`);
      toast.success("Mercadería recibida - stock actualizado");
      loadAll();
    } catch (error) {
      toast.error("Error al recibir mercadería");
    }
  };

  const uploadFactura = async (id: string, facturaUrl: string) => {
    try {
      await api.patch(`/purchases/${id}`, { factura_url: facturaUrl });
      toast.success("Factura actualizada");
      loadAll();
    } catch (error) {
      toast.error("Error al subir factura");
    }
  };

  return { 
    compras, 
    loading, 
    loadAll,
    deleteCompra,
    cancelCompra,
    restoreCompra,
    markPedido,
    receiveCompra,
    uploadFactura
  };
}