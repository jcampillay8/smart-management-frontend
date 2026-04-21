// src/pages/Gestion/types.ts
export interface Categoria { id: string; nombre: string }

export interface Producto { 
  id: string; 
  nombre: string; 
  categoria_id: string; 
  unidad: string; 
  costo_unitario: number;
  bodegas_config: { bodega_id: string; stock_minimo: number }[];
}

export interface Receta {
  id: string; 
  nombre: string; 
  precio: number; 
  ingredientes: { producto_id: string; cantidad: number; bodega_id: string }[];
}