// src/pages/AnaliticasCompra/types.ts
export interface CompraData {
  id: string;
  estado: string;
  total: number;
  created_at: string;
}

export interface ChartDataPoint {
  name: string;
  total: number;
  cantidad: number;
}

export interface ProductoRecurrente {
  id: string;
  nombre: string;
  count: number;
  totalGastado: number;
}