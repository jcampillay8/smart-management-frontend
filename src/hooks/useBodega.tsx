import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "../lib/api";

export interface Bodega {
  id: string;
  nombre: string;
}

interface BodegaContextType {
  bodegas: Bodega[];
  selectedBodegaId: string; // "all" | bodega id
  setSelectedBodegaId: (id: string) => void;
  selectedBodega: Bodega | null; // null when "all"
  loading: boolean;
  /** Returns the bodega_id to use for inserts (defaults to principal if "all") */
  activeBodegaIdForInsert: string;
}

const BodegaContext = createContext<BodegaContextType | null>(null);

export function BodegaProvider({ children }: { children: ReactNode }) {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [selectedBodegaId, setSelectedBodegaId] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/inventory/bodegas");
        const list = (res.data ?? []) as Bodega[];
        setBodegas(list);
        
        // Default to Bodega Tránsito (first in order or specific name)
        const transito = list.find(b => b.nombre === "Bodega Tránsito");
        if (transito) setSelectedBodegaId(transito.id);
        else if (list.length > 0) setSelectedBodegaId(list[0].id);
      } catch (error) {
        console.error("Error fetching bodegas:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedBodega = selectedBodegaId === "all" ? null : bodegas.find(b => b.id === selectedBodegaId) ?? null;
  const principal = bodegas.find(b => b.nombre === "Bodega Principal");
  const activeBodegaIdForInsert = selectedBodegaId === "all" ? (principal?.id ?? "") : selectedBodegaId;

  return (
    <BodegaContext.Provider value={{ bodegas, selectedBodegaId, setSelectedBodegaId, selectedBodega, loading, activeBodegaIdForInsert }}>
      {children}
    </BodegaContext.Provider>
  );
}

export function useBodega() {
  const ctx = useContext(BodegaContext);
  if (!ctx) throw new Error("useBodega must be used within BodegaProvider");
  return ctx;
}
