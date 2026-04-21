// src/pages/Dashboard/useDashboard.ts
import { useState, useEffect } from "react";
import api from "../../lib/api";

export function useDashboard() {
  const [data, setData] = useState({
    stockTotal: 0,
    alertasCriticas: 0,
    eventosSemana: 0,
    movimientos: [],
    loading: true
  });

  const loadDashboard = async () => {
    try {
      const [invRes, eventRes, histRes] = await Promise.all([
        api.get("/inventory/snapshot"),
        api.get("/events/upcoming?days=7"),
        api.get("/inventory/history/?limit=5")
      ]);

      setData({
        stockTotal: invRes.data.total_items || 0,
        alertasCriticas: invRes.data.bajo_minimo || 0,
        eventosSemana: eventRes.data.length || 0,
        movimientos: histRes.data || [],
        loading: false
      });
    } catch (error) {
      console.error("Error cargando dashboard", error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  return { ...data, refresh: loadDashboard };
}