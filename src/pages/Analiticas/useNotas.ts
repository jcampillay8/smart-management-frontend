// src/pages/Analiticas/useNotas.ts
import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";

export interface AutorOut {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  nombre_visible?: string;
  avatar_url?: string;
}

export interface NotaMencionOut {
  id: string;
  user_id: number;
}

export interface Nota {
  id: string;
  autor_id: number;
  titulo?: string;
  contenido: string;
  urgencia: "alta" | "media" | "baja";
  created_at: string;
  updated_at: string;
  autor?: AutorOut;
  menciones: NotaMencionOut[];
}

export function useNotas() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchNotas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/notes");
      setNotas(res.data);
    } catch (e) {
      console.error("Error cargando notas:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

  const createNota = async (data: { titulo?: string; contenido: string; urgencia: string; fecha?: string; menciones: number[] }) => {
    setSaving(true);
    try {
      await api.post("/notes", data);
      await fetchNotas();
    } finally {
      setSaving(false);
    }
  };

  const updateNota = async (id: string, data: { titulo?: string; contenido?: string; urgencia?: string; fecha?: string; menciones?: number[] }) => {
    setSaving(true);
    try {
      await api.put(`/notes/${id}`, data);
      await fetchNotas();
    } finally {
      setSaving(false);
    }
  };

  const deleteNota = async (id: string) => {
    try {
      await api.delete(`/notes/${id}`);
      await fetchNotas();
    } catch (e) {
      console.error("Error eliminando nota:", e);
    }
  };

  return { notas, loading, saving, refresh: fetchNotas, createNota, updateNota, deleteNota };
}
