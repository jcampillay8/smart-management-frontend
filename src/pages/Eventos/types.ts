// src/pages/Eventos/types.ts
export interface Producto { 
  id: string; 
  nombre: string; 
  categoria_id: string; 
  unidad: string; 
  costo_unitario: number 
}

export interface EventoItem {
  producto_id: string;
  cantidad: number;
  bodega_id: string;
}

export interface EventoReceta {
  receta_id: string;
  cantidad: number;
}

export interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  items: EventoItem[];
  ejecutado: boolean;
  cancelado: boolean;
  valor_publico?: number | null;
}