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
  usuario_id: number;
  pedido_realizado: boolean;
  items?: CompraItem[];
}

export interface CompraItem {
  id: string;
  compra_id: string;
  producto_id: string;
  bodega_id: string | null;
  cantidad: number;
  precio_unitario: number;
  producto_nombre?: string;
  bodega_nombre?: string;
}

export type SubTab = "realizadas" | "pendientes" | "canceladas";

export type ConfirmAction = 
  | { kind: "delete"; id: string }
  | { kind: "cancel"; id: string }
  | { kind: "restore"; id: string }
  | { kind: "pedido"; id: string }
  | { kind: "ingresar"; id: string };

export interface ConfirmInfo {
  title: string;
  description: string;
  actionLabel: string;
  danger?: boolean;
}