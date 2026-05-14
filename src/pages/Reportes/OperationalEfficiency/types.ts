export interface RotacionProducto {
  producto_id: string;
  nombre: string;
  rotacion: number;
  stock_promedio: number;
  costo_ventas: number;
}

export interface TransferenciaReporte {
  id: string;
  producto_nombre: string;
  bodega_origen: string;
  bodega_destino: string;
  cantidad: number;
  fecha: string;
  motivo?: string;
}

export interface PuntoPedidoAlerta {
  producto_id: string;
  nombre: string;
  stock_actual: number;
  punto_pedido: number;
  diferencia: number; // Negativo indica que está por debajo del punto de pedido
}

export interface OperationalEfficiencySummary {
  rotacion_productos: RotacionProducto[];
  transferencias_recientes: TransferenciaReporte[];
  alertas_punto_pedido: PuntoPedidoAlerta[];
  rotacion_promedio_general: number;
}

export interface OperationalEfficiencyHook {
  summary: OperationalEfficiencySummary | null;
  rotacionProductos: RotacionProducto[];
  transferencias: TransferenciaReporte[];
  alertasPuntoPedido: PuntoPedidoAlerta[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
