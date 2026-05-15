// src/pages/Gestion/types.ts
export interface Categoria {
  id: string;
  nombre: string;
  color?: string;
  icono?: string;
}

export interface CategoriaReceta {
  id: string;
  nombre: string;
  color?: string;
  icono?: string;
}

export interface ProductoBodega {
  producto_id: string;
  bodega_id: string;
  stock_minimo: number;
  coordenada_letra?: string | null;
  coordenada_numero?: string | null;
  bodega_nombre?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria_id: string;
  unidad: string;
  costo_unitario: number;
  iva_incluido?: boolean;
  iva_porcentaje?: number;
  imagen_url?: string | null;
  precio_venta?: number | null;
  codigo_barra?: string | null;
  factor_conversion?: number | null;
  unidad_conversion?: string | null;
  marca?: string | null;
  proveedor?: string | null;
  proveedor_id?: string | null;
  sku?: string | null;
  dias_alerta_vencimiento?: number;
  bodegas_config: { bodega_id: string; stock_minimo: number }[];
}

export interface Receta {
  id: string;
  nombre: string;
  precio: number;
  iva_incluido?: boolean;
  iva_porcentaje?: number;
  imagen_url?: string | null;
  categoria_receta_id?: string | null;
  areas_operativas_ids?: string[];
  ingredientes: { id?: string; producto_id: string; bodega_id: string; cantidad: number; nombre_producto?: string; unidad?: string }[];
  
  // Campos dinámicos de Gestión
  disponibilidad_por_bodega?: { bodega_id: string; bodega_nombre: string; cantidad: number }[];
  consumo_diario?: number;
  consumo_semanal?: number;
  consumo_mensual?: number;
}

export type ViewTab = "productos" | "recetas" | "compras" | "mermas";