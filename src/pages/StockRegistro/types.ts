// src/pages/StockRegistro/types.ts

export interface Categoria {
  id: string;
  nombre: string;
  color?: string;
  icono?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria_id: string;
  unidad: string;
  stock_minimo: number;
  sku?: string;
  dias_alerta_vencimiento?: number;
  bodegas_config?: { bodega_id: string; stock_minimo: number }[];
}

// --- NUEVOS TIPOS PARA LA LÓGICA DE REPLICACIÓN ---

/** Representa un lote físico en el sistema (usado por buildInventorySnapshot) */
export interface InventoryLot {
  fecha_vencimiento: string;
  cantidad: number;
}

/** Tipos de movimiento soportados por tu backend en FastAPI */
export type MovementType = 
  | 'entrada' 
  | 'salida' 
  | 'transferencia' 
  | 'merma' 
  | 'ajuste_positivo' 
  | 'ajuste_negativo';

/** Estructura necesaria para enviar movimientos individuales (MermaDialog/TransferDialog) */
export interface MovementPayload {
  producto_id: string;
  bodega_id: string;
  cantidad: number;
  tipo_movimiento: MovementType;
  fecha_vencimiento?: string | null;
  bodega_destino_id?: string;
  motivo_merma?: string;
  descripcion_merma?: string;
}

// --- TIPOS DE LA TABLA DE CONTEO (EXISTENTES) ---

export interface ExpiryEntry {
  fecha_vencimiento: string;
  cantidad: number;
}

export interface StockEntry {
  cantidad: number;
  fecha_recuento: string;
  fecha_vencimiento: string;
  multiExpiry: boolean;
  expiryEntries: ExpiryEntry[];
}

export type DisplayProduct = Producto & { 
  _entryKey: string; 
  _bodegaName?: string;
  _bodegaColor?: string;
  _bodegaIcon?: string;
  // Agregamos esto para que la fila sepa sus lotes calculados
  _lotesDisponibles?: InventoryLot[]; 
  stock_actual: number;
};

