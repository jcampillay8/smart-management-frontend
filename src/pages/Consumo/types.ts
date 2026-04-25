// src/pages/Consumo/types.ts
export interface Categoria {
  id: string;
  nombre: string;
}

export interface Producto {
  id: string;
  nombre: string;
  unidad: string;
  categoria_id: string;
  stock_minimo: number;
  costo_unitario: number;
  categorias_config: any[];
  categoria?: Categoria;
}

export interface Receta {
  id: string;
  nombre: string;
  precio: number;
  ingredientes: RecetaIngrediente[];
}

export interface RecetaIngrediente {
  producto_id: string;
  cantidad: number;
  bodega_id: string;
}

export interface CartItem {
  id: string;
  type: "producto" | "receta";
  quantity: number;
  name: string;
  unit?: string;
}

export interface Lot {
  fecha_vencimiento: string;
  cantidad: number;
}

export interface ConsumptionRecord {
  id: string;
  producto_id: string;
  cantidad: number;
  tipo_movimiento: string;
  bodega_id: string;
  created_at: string;
  fecha_vencimiento?: string;
  nombre_producto?: string;
  nombre_bodega?: string;
  user_display_name?: string;
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