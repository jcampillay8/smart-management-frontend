// src/pages/Consumo/useConsumo.ts
import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Producto, Receta, CartItem } from "./types";

export function useConsumo() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, recetaRes] = await Promise.all([
        api.get("/inventory/products"),
        api.get("/operations/recipes/"),
      ]);
      setProductos(prodRes.data);
      setRecetas(recetaRes.data);
    } catch (e) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any, type: "producto" | "receta") => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type);
      if (existing) {
        return prev.map(i => i.id === item.id && i.type === type 
          ? { ...i, quantity: i.quantity + 1 } 
          : i);
      }
      return [...prev, { 
        id: item.id, 
        type, 
        quantity: 1, 
        name: item.nombre, 
        unit: type === "producto" ? item.unidad : "serv." 
      }];
    });
    toast.success(`${item.nombre} agregado`);
  };

  const removeFromCart = (id: string, type: string) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  const updateQuantity = (id: string, type: string, qty: number) => {
    if (qty <= 0) return;
    setCart(prev => prev.map(i => i.id === id && i.type === type ? { ...i, quantity: qty } : i));
  };

  return {
    productos, recetas, cart, loading, saving,
    setSaving, setCart, addToCart, removeFromCart, updateQuantity
  };
}