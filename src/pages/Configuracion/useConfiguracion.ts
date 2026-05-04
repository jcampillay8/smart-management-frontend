// src/pages/Configuracion/useConfiguracion.ts
import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { UserWithRole, RestaurantSettings } from "./types";

export function useConfiguracion(isAdmin: boolean) {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings>({ nombre: "", logo_url: null });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        api.get("/user/admin/all/"),
        api.get("/settings/restaurant")
      ]);
      setUsers(uRes.data);
      setSettings(sRes.data);
    } catch (e) {
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [isAdmin]);

  const updateRole = async (userId: number, newRole: string) => {
    try {
      await api.put(`/user/admin/${userId}/role`, { role: newRole });
      toast.success("Rol actualizado");
      loadData();
    } catch (e) {
      toast.error("Error al actualizar rol");
    }
  };

  const createUser = async (data: any) => {
    try {
      await api.post("/account/", data);
      toast.success("Usuario creado exitosamente");
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al crear usuario");
      throw e;
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      await api.delete(`/user/admin/${userId}`);
      toast.success("Usuario eliminado");
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al eliminar usuario");
    }
  };

  return { users, settings, loading, updateRole, createUser, deleteUser, refresh: loadData };
}