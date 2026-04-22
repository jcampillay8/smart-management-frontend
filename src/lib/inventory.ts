export interface InventoryMovementRecord {
  producto_id: string;
  fecha_vencimiento: string | null;
  cantidad: number;
  tipo_movimiento: string;
  created_at: string;
  bodega_id?: string;
  descripcion_merma?: string | null;
}

export interface InventoryLot {
  fecha_vencimiento: string;
  cantidad: number;
}

export interface InventorySnapshot {
  lotsByProduct: Record<string, InventoryLot[]>;
  totalByProduct: Record<string, number>;
  stockByProduct: Record<string, number>;
}

const CURRENT_BATCH_WINDOW_MS = 5000;

const toTimestamp = (value: string) => new Date(value).getTime();

const toQuantity = (value: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const compareExpiry = (a: string, b: string) => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
};

const deductFromLots = (lots: Map<string, number>, preferredExpiry: string, quantity: number) => {
  let remaining = quantity;

  if (lots.has(preferredExpiry)) {
    const available = lots.get(preferredExpiry) ?? 0;
    const deducted = Math.min(available, remaining);
    lots.set(preferredExpiry, Math.max(0, available - deducted));
    remaining -= deducted;
  }

  if (remaining <= 0) return;

  const orderedKeys = Array.from(lots.keys()).sort(compareExpiry);
  for (const key of orderedKeys) {
    if (remaining <= 0 || key === preferredExpiry) continue;
    const available = lots.get(key) ?? 0;
    if (available <= 0) continue;

    const deducted = Math.min(available, remaining);
    lots.set(key, Math.max(0, available - deducted));
    remaining -= deducted;
  }
};

export const buildInventorySnapshot = (records: InventoryMovementRecord[], upTo?: string, bodegaId?: string): InventorySnapshot => {
  const filtered = bodegaId ? records.filter(r => r.bodega_id === bodegaId) : records;
  const recordsByProduct: Record<string, InventoryMovementRecord[]> = {};

  filtered.forEach((record) => {
    if (!recordsByProduct[record.producto_id]) {
      recordsByProduct[record.producto_id] = [];
    }
    recordsByProduct[record.producto_id].push(record);
  });

  const lotsByProduct: Record<string, InventoryLot[]> = {};
  const totalByProduct: Record<string, number> = {};

  Object.entries(recordsByProduct).forEach(([productId, productRecords]) => {
    const conteos = productRecords.filter((record) => record.tipo_movimiento === "conteo");
    if (conteos.length === 0) return;

    const latestConteoTimestamp = Math.max(...conteos.map((record) => toTimestamp(record.created_at)));
    const currentBatch = conteos.filter(
      (record) => Math.abs(toTimestamp(record.created_at) - latestConteoTimestamp) <= CURRENT_BATCH_WINDOW_MS,
    );

    const lotMap = new Map<string, number>();
    currentBatch.forEach((record) => {
      const expiryKey = record.fecha_vencimiento ?? "";
      lotMap.set(expiryKey, (lotMap.get(expiryKey) ?? 0) + toQuantity(record.cantidad));
    });

    const upToTimestamp = upTo ? toTimestamp(upTo) : Infinity;
    const deductions = productRecords
      .filter(
        (record) =>
          (record.tipo_movimiento === "consumo" || record.tipo_movimiento === "merma" ||
           (record.tipo_movimiento === "transferencia" && record.descripcion_merma === "salida")) &&
          toTimestamp(record.created_at) > latestConteoTimestamp &&
          toTimestamp(record.created_at) <= upToTimestamp,
      )
      .sort((a, b) => toTimestamp(a.created_at) - toTimestamp(b.created_at));

    const additions = productRecords
      .filter(
        (record) =>
          (record.tipo_movimiento === "entrada" ||
           (record.tipo_movimiento === "transferencia" && record.descripcion_merma !== "salida")) &&
          toTimestamp(record.created_at) > latestConteoTimestamp &&
          toTimestamp(record.created_at) <= upToTimestamp,
      )
      .sort((a, b) => toTimestamp(a.created_at) - toTimestamp(b.created_at));

    deductions.forEach((record) => {
      deductFromLots(lotMap, record.fecha_vencimiento ?? "", toQuantity(record.cantidad));
    });

    additions.forEach((record) => {
      const expiryKey = record.fecha_vencimiento ?? "";
      lotMap.set(expiryKey, (lotMap.get(expiryKey) ?? 0) + toQuantity(record.cantidad));
    });

    const lots = Array.from(lotMap.entries())
      .sort(([expiryA], [expiryB]) => compareExpiry(expiryA, expiryB))
      .map(([fecha_vencimiento, cantidad]) => ({
        fecha_vencimiento,
        cantidad: Math.max(0, cantidad),
      }));

    lotsByProduct[productId] = lots;
    totalByProduct[productId] = lots.reduce((sum, lot) => sum + lot.cantidad, 0);
  });

  return { lotsByProduct, totalByProduct, stockByProduct: totalByProduct };
};
