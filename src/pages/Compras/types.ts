// src/pages/Compras/types.ts
export interface Compra {
  id: string;
  estado: string;
  fecha: string;
  total: number;
  proveedor: string | null;
  notas: string | null;
  factura_url: string | null;
  created_at: string;
  usuario_id: string;
}

export interface CompraItem {
  id: string;
  compra_id: string;
  producto_id: string;
  bodega_id: string | null;
  cantidad: number;
  precio_unitario: number;
}

export type SubTab = "realizadas" | "pendientes" | "canceladas";