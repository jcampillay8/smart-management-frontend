// src/pages/Proyeccion/types.ts
export interface ProyeccionDataPoint {
  date: string;
  label: string;
  stock: number;
  isProjected: boolean;
  events?: { name: string; qty: number }[];
}

export interface EventoProximo {
  id: string;
  nombre: string;
  fecha: string;
  items: { producto_id: string; cantidad: number }[];
}