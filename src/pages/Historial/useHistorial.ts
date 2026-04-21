// src/pages/Historial/useHistorial.ts
import { useState, useEffect, useMemo } from "react";
import api from "../../lib/api";
import { RegistroMovimiento, TipoMovimiento } from "./types";
import { isSameDay, parseISO } from "date-fns";

export function useHistorial(selectedBodegaId: string) {
  const [registros, setRegistros] = useState<RegistroMovimiento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de filtros
  const [tipo, setTipo] = useState<TipoMovimiento>("all");
  const [fecha, setFecha] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const fetchHistorial = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/inventory/history/");
        setRegistros(data);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, []);

  const filtered = useMemo(() => {
    return registros.filter((r) => {
      const matchBodega = selectedBodegaId === "all" || r.bodega_id === selectedBodegaId;
      const matchTipo = tipo === "all" || r.tipo_movimiento === tipo;
      const matchFecha = !fecha || isSameDay(parseISO(r.created_at), fecha);
      return matchBodega && matchTipo && matchFecha;
    });
  }, [registros, selectedBodegaId, tipo, fecha]);

  return { 
    filtered, 
    loading, 
    filtros: { tipo, setTipo, fecha, setFecha } 
  };
}