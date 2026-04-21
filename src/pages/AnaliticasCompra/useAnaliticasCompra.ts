// src/pages/AnaliticasCompra/useAnaliticasCompra.ts

import { useMemo } from "react";
import { startOfMonth } from "date-fns";
import { ProductoRecurrente } from "./types";

export function useAnaliticasCompra(compras: any[], items: any[], productos: any[]) {
  const realizadas = useMemo(() => 
    compras.filter(c => c.estado === "realizada"), 
  [compras]);

  const statsMes = useMemo(() => {
    const inicioMes = startOfMonth(new Date()).toISOString();
    const comprasMes = realizadas.filter(c => c.created_at >= inicioMes);
    return {
      gastoTotal: comprasMes.reduce((s, c) => s + Number(c.total || 0), 0),
      conteo: comprasMes.length
    };
  }, [realizadas]);

  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(it => {
      const p = productos.find(prod => prod.id === it.producto_id);
      if (p) {
        map[p.nombre] = (map[p.nombre] || 0) + (it.cantidad * it.precio_unitario);
      }
    });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [items, productos]);

  // NUEVA LÓGICA: Cálculo de recurrencia
  const productosRecurrentes = useMemo(() => {
    const map: Record<string, ProductoRecurrente> = {};
    
    items.forEach(it => {
      const p = productos.find(prod => prod.id === it.producto_id);
      if (p) {
        if (!map[p.id]) {
          map[p.id] = { id: p.id, nombre: p.nombre, count: 0, totalGastado: 0 };
        }
        map[p.id].count += 1;
        map[p.id].totalGastado += (it.cantidad * it.precio_unitario);
      }
    });

    return Object.values(map);
  }, [items, productos]);

  return { 
    statsMes, 
    chartData, 
    productosRecurrentes 
  };
}