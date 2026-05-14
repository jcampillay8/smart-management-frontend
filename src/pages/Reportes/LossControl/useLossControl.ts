import { useState, useEffect, useCallback } from "react";
import api from "../../../lib/api";
import type { 
  LossControlSummary, 
  MermaByMotivo, 
  MermaByProducto, 
  ProductoAnomalia 
} from "./types";

export function useLossControl() {
  const [summary, setSummary] = useState<LossControlSummary | null>(null);
  const [mermaByMotivo, setMermaByMotivo] = useState<MermaByMotivo[]>([]);
  const [topProductos, setTopProductos] = useState<MermaByProducto[]>([]);
  const [anomalias, setAnomalias] = useState<ProductoAnomalia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, byMotivoRes, byProductoRes, anomaliasRes] = await Promise.all([
        api.get("/reports/loss-control/summary"),
        api.get("/reports/loss-control/by-reason"),
        api.get("/reports/loss-control/by-product"),
        api.get("/reports/loss-control/anomalies"),
      ]);

      setSummary(summaryRes.data);
      setMermaByMotivo(byMotivoRes.data);
      setTopProductos(byProductoRes.data);
      setAnomalias(anomaliasRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al cargar los datos de pérdidas");
      console.error("Error fetching loss control data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    summary,
    mermaByMotivo,
    topProductos,
    anomalias,
    loading,
    error,
    refresh: fetchData,
  };
}
