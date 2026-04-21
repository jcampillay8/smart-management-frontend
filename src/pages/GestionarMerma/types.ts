// src/pages/GestionarMerma/types.ts
export interface MermaRecord {
  id: string;
  cantidad: number;
  motivo_merma: string | null;
  fecha_recuento: string;
  fecha_vencimiento: string | null;
  created_at: string;
  producto_id: string;
  usuario_id: string;
  descripcion_merma: string | null;
  bodega_id: string;
}

export interface Producto {
  id: string;
  nombre: string;
  costo_unitario: number;
}