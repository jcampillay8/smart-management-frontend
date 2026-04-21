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
  user_display_name?: string;
}

export type TipoMovimiento = "all" | "conteo" | "consumo" | "merma" | "compra";