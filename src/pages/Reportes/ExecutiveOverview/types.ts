export interface ProductMerma {
  producto_id: string;
  nombre: string;
  cantidad_merma: number;
  motivo_principal: string;
}

export interface ProductoStock {
  producto_id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  bodega_nombre: string;
}

export interface InsightResponse {
  tipo: "sobrestock" | "fuga_dinero" | "oportunidad";
  mensaje: string;
  impacto_estimado?: number;
}

export interface MermaByMotivo {
  motivo: string;
  cantidad: number;
}

export interface ExecutiveOverviewData {
  valor_total_inventario: number;
  porcentaje_merma: number;
  stock_total_unidades: number;
  total_compras_periodo: number;
  total_ventas_periodo: number;
  top_mermas_productos: ProductMerma[];
  rotacion_promedio: number;
  productos_bajo_stock: ProductoStock[];
}

export interface ExecutiveOverviewHook {
  data: ExecutiveOverviewData | null;
  mermaByMotivo: MermaByMotivo[];
  insights: InsightResponse[];
  lowStock: ProductoStock[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
