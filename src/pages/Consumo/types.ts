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

export interface RecetaIngrediente {
  producto_id: string;
  cantidad: number;
  bodega_id: string;
}

export interface Receta {
  id: string;
  nombre: string;
  precio: number;
  ingredientes: RecetaIngrediente[];
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
  cantidad_anterior?: number;
  tipo_movimiento: string;
  bodega_id: string;
  created_at: string;
  fecha_vencimiento?: string;
  nombre_producto?: string;
  nombre_receta?: string;
  nombre_bodega?: string;
  user_display_name?: string;
  receta_consumo_id?: string;
  receta_id?: string;
  motivo_merma?: string;
}