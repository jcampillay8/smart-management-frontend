// src/pages/Gestion/useGestion.ts
import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Categoria, Producto, Receta } from "./types";

export function useGestion() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [catRes, prodRes, recRes] = await Promise.all([
        api.get("/inventory/categories"),
        api.get("/inventory/products"),
        api.get("/operations/recipes"),
      ]);
      setCategorias(catRes.data);
      setProductos(prodRes.data);
      setRecetas(recRes.data);
    } catch (e) {
      toast.error("Error al sincronizar catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return { categorias, productos, recetas, loading, refresh: loadData };
}