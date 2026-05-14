import { useState, useEffect, useCallback } from "react";
import api from "../../../lib/api";
import type { 
  OperationalEfficiencySummary, 
  RotacionProducto, 
  TransferenciaReporte, 
  PuntoPedidoAlerta 
} from "./types";

export function useOperationalEfficiency() {
  const [summary, setSummary] = useState<OperationalEfficiencySummary | null>(null);
  const [rotacionProductos, setRotacionProductos] = useState<RotacionProducto[]>([]);
  const [transferencias, setTransferencias] = useState<TransferenciaReporte[]>([]);
  const [alertasPuntoPedido, setAlertasPuntoPedido] = useState<PuntoPedidoAlerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, rotacionRes, transferenciasRes, alertasRes] = await Promise.all([
        api.get("/reports/operational-efficiency/summary"),
        api.get("/reports/operational-efficiency/rotation"),
        api.get("/reports/operational-efficiency/transfers"),
        api.get("/reports/operational-efficiency/reorder-points"),
      ]);

      setSummary(summaryRes.data);
      setRotacionProductos(rotacionRes.data);
      setTransferencias(transferenciasRes.data);
      setAlertasPuntoPedido(alertasRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al cargar los datos de eficiencia operacional");
      console.error("Error fetching operational efficiency data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    summary,
    rotacionProductos,
    transferencias,
    alertasPuntoPedido,
    loading,
    error,
    refresh: fetchData,
  };
}
