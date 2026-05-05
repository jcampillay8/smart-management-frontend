export interface PlatoMenu {
  receta_id: string;
  nombre: string;
  precio_venta: number;
  costo_receta: number;
  margen: number;
  margen_porcentaje: number;
  cantidad_vendida: number;
  categoria: string; // Estrellas, Caballos de batalla, Puzzles, Perros
}

export interface BreakEvenResult {
  gastos_fijos: number;
  margen_promedio: number;
  punto_equilibrio: number;
  ventas_actuales: number;
  porcentaje_cubierto: number;
}

export interface PrimeCostResult {
  costo_alimentos: number;
  costo_labor: number;
  total_prime_cost: number;
  ventas_totales: number;
  prime_cost_porcentaje: number;
}

export interface VariacionPrecio {
  producto_id: string;
  nombre: string;
  proveedor_nombre?: string;
  precio_anterior: number;
  precio_actual: number;
  porcentaje_cambio: number;
}

export interface FinancialVisionSummary {
  matriz_menu: PlatoMenu[];
  break_even: BreakEvenResult;
  prime_cost: PrimeCostResult;
  variacion_precios: VariacionPrecio[];
}

export interface FinancialVisionHook {
  summary: FinancialVisionSummary | null;
  matrizMenu: PlatoMenu[];
  breakEven: BreakEvenResult | null;
  primeCost: PrimeCostResult | null;
  variacionPrecios: VariacionPrecio[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
