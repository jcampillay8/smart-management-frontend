// src/pages/Consumo/types.ts
export interface Producto {
  id: string;
  nombre: string;
  unidad: string;
  categoria_id: string;
  stock_minimo: number;
  costo_unitario: number;
  bodegas_config: any[];
}

export interface Receta {
  id: string;
  nombre: string;
  precio: number;
  ingredientes: { producto_id: string; cantidad: number; bodega_id: string }[];
}

export interface CartItem {
  id: string;
  type: "producto" | "receta";
  quantity: number;
  name: string;
  unit?: string;
}