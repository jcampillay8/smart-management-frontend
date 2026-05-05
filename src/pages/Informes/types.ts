// src/pages/Informes/types.ts

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface Insight {
  type: "success" | "warning" | "danger";
  icon: React.ElementType;
  text: string;
}

export interface KpiData {
  inventoryValue: number;
  mermaValue: number;
  prevMermaValue: number;
  mermaVariation: number;
  mermaPct: number;
  prevMermaPct: number;
  criticalCount: number;
  comprasValue: number;
  prevComprasValue: number;
  comprasVariation: number;
  consumoValue: number;
  rotation: string;
  coverageDays: number;
  noMovementCount: number;
  totalEntradas: number;
  totalSalidas: number;
}

export type PeriodType = "week" | "month" | "custom";
export type ExportMode = "single" | "range";
