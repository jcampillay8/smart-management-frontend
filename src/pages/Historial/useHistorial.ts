// src/pages/Historial/useHistorial.ts
import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../lib/api";
import { RegistroMovimiento, TipoMovimiento, Producto } from "./types";

export function useHistorial(selectedBodegaId: string) {
  const [registros, setRegistros] = useState<RegistroMovimiento[]>([]);
  const [allRecords, setAllRecords] = useState<RegistroMovimiento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroProducto, setFiltroProducto] = useState<string>("all");
  const [filtroTipo, setFiltroTipo] = useState<TipoMovimiento>("all");
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();
  const [filtroUsuario, setFiltroUsuario] = useState<string>("");

  // Soporte para búsqueda por URL (deep linking)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchVal = params.get("search");
    if (searchVal && productos.length > 0) {
      const found = productos.find(p => p.nombre.toLowerCase().includes(searchVal.toLowerCase()));
      if (found) setFiltroProducto(found.id);
    }
  }, [productos]);

  const fetchHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBodegaId !== "all") params.append("bodega_id", selectedBodegaId);
      if (filtroProducto !== "all") params.append("producto_id", filtroProducto);
      if (filtroTipo !== "all") params.append("tipo_movimiento", filtroTipo);
      if (fechaDesde) params.append("fecha_desde", fechaDesde.toISOString().split("T")[0]);
      if (fechaHasta) params.append("fecha_hasta", fechaHasta.toISOString().split("T")[0]);

      const [regRes, allRegRes, prodRes] = await Promise.all([
        api.get(`/inventory/history?${params.toString()}`),
        api.get("/inventory/history?bodega_id=all&tipo_movimiento=all&fecha_desde=1900-01-01"),
        api.get("/inventory/products"),
      ]);

      setRegistros(regRes.data ?? []);
      setAllRecords((allRegRes.data ?? []) as RegistroMovimiento[]);
      setProductos(prodRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [selectedBodegaId, filtroProducto, filtroTipo, fechaDesde, fechaHasta]);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  const prodName = (id: string) => productos.find((p) => p.id === id)?.nombre ?? "—";
  const prodUnit = (id: string) => productos.find((p) => p.id === id)?.unidad ?? "";

  const recordsByPB = useMemo(() => {
    const map = new Map<string, RegistroMovimiento[]>();
    allRecords.forEach((r) => {
      const key = `${r.producto_id}::${r.bodega_id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [allRecords]);

  const computeBeforeAfter = (r: RegistroMovimiento): { before: number; after: number } | null => {
    if (r.tipo_movimiento !== "conteo") return null;
    const list = recordsByPB.get(`${r.producto_id}::${r.bodega_id}`) ?? [];
    const ts = new Date(r.created_at).getTime();
    const BATCH = 5000;
    const sameBatchConteos = list.filter(
      (x) => x.tipo_movimiento === "conteo" && Math.abs(new Date(x.created_at).getTime() - ts) <= BATCH
    );
    const after = sameBatchConteos.reduce((s, x) => s + Number(x.cantidad), 0);
    const earliestInBatch = Math.min(...sameBatchConteos.map((x) => new Date(x.created_at).getTime()));
    const previousConteos = list.filter(
      (x) => x.tipo_movimiento === "conteo" && new Date(x.created_at).getTime() < earliestInBatch - BATCH
    );
    if (previousConteos.length === 0) return { before: 0, after };
    const lastPrevTs = Math.max(...previousConteos.map((x) => new Date(x.created_at).getTime()));
    const lastPrevBatch = previousConteos.filter(
      (x) => Math.abs(new Date(x.created_at).getTime() - lastPrevTs) <= BATCH
    );
    const before = lastPrevBatch.reduce((s, x) => s + Number(x.cantidad), 0);
    return { before, after };
  };

  const filtered = useMemo(() => {
    return registros.filter((r) => {
      const matchBodega = selectedBodegaId === "all" || r.bodega_id === selectedBodegaId;
      const matchProducto = filtroProducto === "all" || r.producto_id === filtroProducto;
      const matchTipo = filtroTipo === "all" || r.tipo_movimiento === filtroTipo;
      
      let matchUsuario = true;
      if (filtroUsuario.trim() !== "") {
        const uName = (r.user_display_name || "Sistema").toLowerCase();
        matchUsuario = uName.includes(filtroUsuario.toLowerCase());
      }
      
      let matchFecha = true;
      if (fechaDesde) {
        const d = new Date(r.fecha_recuento + "T00:00:00");
        if (d < fechaDesde) matchFecha = false;
      }
      if (fechaHasta) {
        const d = new Date(r.fecha_recuento + "T00:00:00");
        if (d > fechaHasta) matchFecha = false;
      }
      return matchBodega && matchProducto && matchTipo && matchFecha && matchUsuario;
    });
  }, [registros, selectedBodegaId, filtroProducto, filtroTipo, fechaDesde, fechaHasta, filtroUsuario]);

  const clearFilters = useCallback(() => {
    setFiltroProducto("all");
    setFiltroTipo("all");
    setFechaDesde(undefined);
    setFechaHasta(undefined);
    setFiltroUsuario("");
  }, []);

  const tipoLabel = (t: string) => {
    const map: Record<string, string> = {
      conteo: "Conteo",
      consumo: "Consumo",
      merma: "Merma",
      ajuste: "Ajuste",
      transferencia: "Transferencia",
    };
    return map[t] ?? t;
  };

  return {
    filtered,
    loading,
    productos,
    filtros: {
      filtroProducto,
      setFiltroProducto,
      filtroTipo,
      setFiltroTipo,
      fechaDesde,
      setFechaDesde,
      fechaHasta,
      setFechaHasta,
      filtroUsuario,
      setFiltroUsuario,
      clearFilters,
    },
    computeBeforeAfter,
    prodName,
    prodUnit,
    tipoLabel,
  };
}