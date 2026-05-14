import { useState, useEffect, useCallback } from "react";
import api from "../../../lib/api";
import type { 
  ExecutiveOverviewData, 
  InsightResponse, 
  MermaByMotivo, 
  ProductoStock 
} from "./types";

export function useExecutiveOverview() {
  const [data, setData] = useState<ExecutiveOverviewData | null>(null);
  const [mermaByMotivo, setMermaByMotivo] = useState<MermaByMotivo[]>([]);
  const [insights, setInsights] = useState<InsightResponse[]>([]);
  const [lowStock, setLowStock] = useState<ProductoStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, mermaMotivoRes, insightsRes, lowStockRes] = await Promise.all([
        api.get("/reports/executive-overview"),
        api.get("/reports/executive-overview/merma/by-motivo"),
        api.get("/reports/executive-overview/insights"),
        api.get("/reports/executive-overview/stock/low"),
      ]);

      setData(overviewRes.data);
      setMermaByMotivo(mermaMotivoRes.data);
      setInsights(insightsRes.data);
      setLowStock(lowStockRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al cargar los datos");
      console.error("Error fetching executive overview:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    mermaByMotivo,
    insights,
    lowStock,
    loading,
    error,
    refresh: fetchData,
  };
}
