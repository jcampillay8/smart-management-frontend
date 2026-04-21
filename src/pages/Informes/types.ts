// src/pages/Informes/types.ts
export interface ChartData {
  name: string;
  value: number;
}

export interface MermaStats {
  name: string;
  value: number;
}

export type ExportMode = "single" | "range";