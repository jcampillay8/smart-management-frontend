// src/pages/ContarInventario/types.ts
export interface CountItem {
  producto_id: string;
  cantidad_contada: number;
  fecha_vencimiento: string;
  localId: string;
}

export interface Discrepancia {
  producto_nombre: string;
  bodega_nombre: string;
  stock_sistema: number;
  stock_contado: number;
  diferencia: number;
  unidad: string;
  impacto_clp: number;
}

export type Step = "idle" | "counting" | "reviewing" | "finished";