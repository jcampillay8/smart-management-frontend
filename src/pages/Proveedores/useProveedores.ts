// src/pages/Proveedores/useProveedores.ts
import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Proveedor } from "./types";

export function useProveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get("/purchases/suppliers/");
      setProveedores(res.data ?? []);
    } catch (e) {
      toast.error("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createProveedor = async (data: Partial<Proveedor>) => {
    setSaving(true);
    try {
      await api.post("/purchases/suppliers/", data);
      toast.success("Proveedor creado");
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al crear proveedor");
    } finally {
      setSaving(false);
    }
  };

  const updateProveedor = async (id: string, data: Partial<Proveedor>) => {
    setSaving(true);
    try {
      await api.put(`/purchases/suppliers/${id}`, data);
      toast.success("Proveedor actualizado");
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al actualizar proveedor");
    } finally {
      setSaving(false);
    }
  };

  const deleteProveedor = async (id: string) => {
    try {
      await api.delete(`/purchases/suppliers/${id}`);
      toast.success("Proveedor eliminado");
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al eliminar proveedor");
    }
  };

  return {
    proveedores,
    loading,
    saving,
    refresh: loadData,
    createProveedor,
    updateProveedor,
    deleteProveedor,
  };
}