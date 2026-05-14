import { useState, useEffect, useCallback } from "react";
import api from "../../../lib/api";
import type { 
  FinancialVisionSummary, 
  PlatoMenu, 
  BreakEvenResult, 
  PrimeCostResult, 
  VariacionPrecio 
} from "./types";

export function useFinancialVision() {
  const [summary, setSummary] = useState<FinancialVisionSummary | null>(null);
  const [matrizMenu, setMatrizMenu] = useState<PlatoMenu[]>([]);
  const [breakEven, setBreakEven] = useState<BreakEvenResult | null>(null);
  const [primeCost, setPrimeCost] = useState<PrimeCostResult | null>(null);
  const [variacionPrecios, setVariacionPrecios] = useState<VariacionPrecio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, menuRes, breakEvenRes, primeCostRes, variacionRes] = await Promise.all([
        api.get("/reports/financial-vision/summary"),
        api.get("/reports/financial-vision/menu-engineering"),
        api.get("/reports/financial-vision/breakeven"),
        api.get("/reports/financial-vision/prime-cost"),
        api.get("/reports/financial-vision/price-variation"),
      ]);

      setSummary(summaryRes.data);
      setMatrizMenu(menuRes.data);
      setBreakEven(breakEvenRes.data);
      setPrimeCost(primeCostRes.data);
      setVariacionPrecios(variacionRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al cargar los datos financieros");
      console.error("Error fetching financial vision data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    summary,
    matrizMenu,
    breakEven,
    primeCost,
    variacionPrecios,
    loading,
    error,
    refresh: fetchData,
  };
}
