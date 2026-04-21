// src/pages/Analiticas/types.ts
export interface ProductoAnalitico {
  id: string;
  nombre: string;
  unidad: string;
  stock_minimo: number;
  cantidad: number;
  cantidad_vencida: number;
  fecha_vencimiento: string | null;
  bodega_nombre: string;
}

export interface SmartNotification {
  type: "critical" | "warning" | "info";
  title: string;
  key: string;
  details: { text: string; bodega?: string }[];
}