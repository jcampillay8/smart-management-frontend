// src/pages/Historial/types.ts
export interface RegistroMovimiento {
  id: string;
  producto_id: string;
  cantidad: number;
  tipo_movimiento: string;
  motivo_merma: string | null;
  usuario_id: string;
  created_at: string;
  bodega_id: string;
  descripcion_merma: string | null;
  fecha_vencimiento: string | null;
  fecha_recuento: string;
  user_display_name?: string;
  nombre_producto?: string;
  nombre_bodega?: string;
}

export type TipoMovimiento = "all" | "conteo" | "consumo" | "merma" | "ajuste" | "transferencia" | "compra";

export interface Producto {
  id: string;
  nombre: string;
  unidad: string;
}