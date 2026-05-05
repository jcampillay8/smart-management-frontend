export interface MermaByMotivo {
  motivo: string;
  cantidad_total: number;
  porcentaje: number;
}

export interface MermaByProducto {
  producto_id: string;
  nombre: string;
  cantidad_total: number;
  bodega_nombre?: string;
}

export interface ProductoAnomalia {
  producto_id: string;
  nombre: string;
  merma_actual: number;
  promedio_historico: number;
  desviacion: number;
  diferencia_porcentual: number;
}

export interface LossControlSummary {
  mermas_por_motivo: MermaByMotivo[];
  top_productos_merma: MermaByProducto[];
  anomalias: ProductoAnomalia[];
}

export interface LossControlHook {
  summary: LossControlSummary | null;
  mermaByMotivo: MermaByMotivo[];
  topProductos: MermaByProducto[];
  anomalias: ProductoAnomalia[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
