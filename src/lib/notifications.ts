export interface NotifKeyData {
  keys: string[];
  hasCritical: boolean;
}

export function computeNotifKeys(
  products: { id: string; stock_minimo: number }[],
  stock: { producto_id: string; bodega_id?: string | null; cantidad: number | null; fecha_vencimiento: string | null }[],
  pendingEvents: { id: string; nombre: string; evento_productos: { producto_id: string; cantidad: number }[] }[],
  productBodegas?: { producto_id: string; bodega_id: string; stock_minimo: number }[]
): NotifKeyData {
  const keys: string[] = [];
  let hasCritical = false;

  const bodegaMinimo = new Map<string, number>();
  if (productBodegas) {
    productBodegas.forEach(pb => {
      bodegaMinimo.set(`${pb.producto_id}::${pb.bodega_id}`, pb.stock_minimo);
    });
  }

  const bodegaGroups = new Map<string, { total: number; lots: { cantidad: number; fecha_vencimiento: string | null }[] }>();
  const totalByProduct = new Map<string, number>();

  stock.forEach(s => {
    const pid = s.producto_id;
    const bid = s.bodega_id ?? "all";
    const key = `${pid}::${bid}`;

    if (!bodegaGroups.has(key)) bodegaGroups.set(key, { total: 0, lots: [] });
    const group = bodegaGroups.get(key)!;
    group.total += s.cantidad ?? 0;
    group.lots.push({ cantidad: s.cantidad ?? 0, fecha_vencimiento: s.fecha_vencimiento });

    totalByProduct.set(pid, (totalByProduct.get(pid) ?? 0) + (s.cantidad ?? 0));
  });

  bodegaGroups.forEach((group, compositeKey) => {
    const [pid, bid] = compositeKey.split("::");
    const product = products.find(p => p.id === pid);
    if (!product) return;

    const keySuffix = bid !== "all" ? `:${bid}` : "";
    const minimo = bodegaMinimo.get(`${pid}::${bid}`) ?? product.stock_minimo;

    if (group.total === 0) {
      keys.push(`sin_stock:${pid}${keySuffix}`);
      hasCritical = true;
    }

    if (group.total > 0 && group.total < minimo) {
      keys.push(`bajo_stock:${pid}${keySuffix}`);
    }

    for (const lot of group.lots) {
      if (lot.fecha_vencimiento && lot.cantidad > 0) {
        const diff = (new Date(lot.fecha_vencimiento).getTime() - Date.now()) / 86400000;
        if (diff <= 0) {
          keys.push(`vencido:${pid}${keySuffix}`);
          hasCritical = true;
          break;
        } else if (diff <= 5) {
          keys.push(`proximo_vencer:${pid}${keySuffix}`);
          break;
        }
      }
    }
  });

  for (const ev of pendingEvents) {
    const prods = ev.evento_productos ?? [];
    const hasIssue = prods.some(ep => {
      const available = totalByProduct.get(ep.producto_id) ?? 0;
      const remaining = available - Number(ep.cantidad);
      const product = products.find(p => p.id === ep.producto_id);
      const minimo = product?.stock_minimo ?? 0;
      return remaining < 0 || remaining === 0 || (remaining > 0 && remaining < minimo);
    });
    if (hasIssue) {
      keys.push(`sin_stock_evento:${ev.id}`);
      hasCritical = true;
    }
  }

  return { keys, hasCritical };
}

export function getSeenKeys(): string[] {
  try {
    return JSON.parse(localStorage.getItem("notif_seen_keys") || "[]");
  } catch {
    return [];
  }
}

export function saveSeenKeys(keys: string[]) {
  localStorage.setItem("notif_seen_keys", JSON.stringify(keys));
}

export function countNewNotifications(currentKeys: string[]): number {
  const seen = new Set(getSeenKeys());
  return currentKeys.filter(k => !seen.has(k)).length;
}
