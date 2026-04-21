// src/pages/StockRegistro/types.ts

export interface Categoria {
  id: string;
  nombre: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria_id: string;
  unidad: string;
  stock_minimo: number;
  bodegas_config?: { bodega_id: string; stock_minimo: number }[];
}

export interface ExpiryEntry {
  fecha_vencimiento: string;
  cantidad: string;
}

export interface StockEntry {
  cantidad: string;
  fecha_recuento: string;
  fecha_vencimiento: string;
  multiExpiry: boolean;
  expiryEntries: ExpiryEntry[];
}

export type DisplayProduct = Producto & { 
  _entryKey: string; 
  _bodegaName?: string 
};