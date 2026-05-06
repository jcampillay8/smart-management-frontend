// src/pages/Gestion/useGestion.ts
import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Categoria, CategoriaReceta, Producto, Receta, ViewTab } from "./types";

export function useGestion() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasRecetas, setCategoriasRecetas] = useState<CategoriaReceta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [mermas, setMermas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingReceta, setSavingReceta] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Usamos trailing slashes para mayor compatibilidad con el backend
      const [catRes, prodRes, recRes, catRecRes, mermasRes] = await Promise.all([
        api.get("/inventory/categories"),
        api.get("/inventory/products"),
        api.get("/operations/recipes"),
        api.get("/operations/recipes/categories"),
        api.get("/inventory/history?tipo_movimiento=merma"),
      ]);
      setCategorias(catRes.data ?? []);
      setCategoriasRecetas(catRecRes.data ?? []);
      setProductos(prodRes.data ?? []);
      setRecetas(recRes.data ?? []);
      setMermas(mermasRes.data ?? []);
    } catch (e) {
      console.error("Error loading data:", e);
      toast.error("Error al sincronizar catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Category CRUD
  const createCategory = async (nombre: string) => {
    try {
      await api.post("/inventory/categories", { nombre });
      toast.success("Categoría creada");
      loadData();
    } catch (e) {
      toast.error("Error al crear categoría");
    }
  };

  const updateCategory = async (id: string, nombre: string) => {
    try {
      await api.put(`/inventory/categories/${id}`, { nombre });
      toast.success("Categoría actualizada");
      loadData();
    } catch (e) {
      toast.error("Error al actualizar categoría");
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(`/inventory/categories/${id}`);
      toast.success("Categoría eliminada");
      loadData();
    } catch (e) {
      toast.error("Error al eliminar categoría");
    }
  };

  const createCategoryReceta = async (nombre: string) => {
    try {
      await api.post("/operations/recipes/categories", { nombre });
      toast.success("Categoría de receta creada");
      loadData();
    } catch (e) {
      toast.error("Error al crear categoría");
    }
  };

  const deleteCategoryReceta = async (id: string) => {
    try {
      await api.delete(`/operations/recipes/categories/${id}`);
      toast.success("Categoría de receta eliminada");
      loadData();
    } catch (e) {
      toast.error("Error al eliminar categoría");
    }
  };

  // Product CRUD
  const createProduct = async (data: Partial<Producto>) => {
    setSavingProduct(true);
    try {
      await api.post("/inventory/products", data);
      toast.success("Producto creado");
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al crear producto");
    } finally {
      setSavingProduct(false);
    }
  };

  const updateProduct = async (id: string, data: Partial<Producto>) => {
    setSavingProduct(true);
    try {
      await api.put(`/inventory/products/${id}`, data);
      toast.success("Producto actualizado");
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al actualizar producto");
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.delete(`/inventory/products/${id}`);
      toast.success("Producto eliminado");
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al eliminar producto");
    }
  };

  // Recipe CRUD
  const createReceta = async (data: Partial<Receta>) => {
    setSavingReceta(true);
    try {
      await api.post("/operations/recipes", data);
      toast.success("Receta creada");
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al crear receta");
    } finally {
      setSavingReceta(false);
    }
  };

  const updateReceta = async (id: string, data: Partial<Receta>) => {
    setSavingReceta(true);
    try {
      await api.put(`/operations/recipes/${id}`, data);
      toast.success("Receta actualizada");
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al actualizar receta");
    } finally {
      setSavingReceta(false);
    }
  };

  const deleteReceta = async (id: string) => {
    try {
      await api.delete(`/operations/recipes/${id}`);
      toast.success("Receta eliminada");
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al eliminar receta");
    }
  };

  const getProductsForBodega = (bodegaId: string) => {
    return productos.filter((p: Producto) => 
      p.bodegas_config?.some(b => b.bodega_id === bodegaId)
    );
  };

  const getRecetaCosto = (receta: Receta) => {
    return receta.ingredientes?.reduce((sum, ing) => {
      const prod = productos.find(p => p.id === ing.producto_id);
      return sum + (prod?.costo_unitario ?? 0) * ing.cantidad;
    }, 0) ?? 0;
  };

  return {
    categorias,
    categoriasRecetas,
    productos,
    recetas,
    mermas,
    loading,
    savingProduct,
    savingReceta,
    refresh: loadData,
    loadData,
    // Categories
    createCategory,
    updateCategory,
    deleteCategory,
    createCategoryReceta,
    deleteCategoryReceta,
    // Products
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsForBodega,
    // Recipes
    createReceta,
    updateReceta,
    deleteReceta,
    getRecetaCosto,
  };
}