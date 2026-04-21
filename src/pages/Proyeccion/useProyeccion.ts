// src/pages/Proyeccion/useProyeccion.ts
import { useState, useMemo } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { ProyeccionDataPoint } from "./types";

export function useProyeccion(producto: any, stockActual: number, eventos: any[]) {
  const [diasProyeccion, setDiasProyeccion] = useState(14);

  const chartData = useMemo(() => {
    if (!producto) return [];

    const data: ProyeccionDataPoint[] = [];
    let currentStock = stockActual;

    for (let i = 0; i <= diasProyeccion; i++) {
      const date = addDays(new Date(), i);
      
      // Buscamos eventos que afecten este producto en esta fecha
      const eventosDia = eventos.filter(e => 
        isSameDay(new Date(e.fecha), date) && 
        e.items.some((it: any) => it.producto_id === producto.id)
      );

      const impactoEventos = eventosDia.reduce((sum, e) => {
        const item = e.items.find((it: any) => it.producto_id === producto.id);
        return sum + (item?.cantidad || 0);
      }, 0);

      currentStock -= impactoEventos;

      data.push({
        date: date.toISOString(),
        label: format(date, "dd MMM"),
        stock: Math.max(0, currentStock),
        isProjected: i > 0,
        events: eventosDia.map(e => ({
          name: e.nombre,
          qty: e.items.find((it: any) => it.producto_id === producto.id)?.cantidad || 0
        }))
      });
    }
    return data;
  }, [producto, stockActual, eventos, diasProyeccion]);

  return { chartData, diasProyeccion, setDiasProyeccion };
}