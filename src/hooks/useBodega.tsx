import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "../lib/api";

export interface Bodega {
  id: string;
  nombre: string;
  color?: string;
  icono?: string;
}

interface BodegaContextType {
  bodegas: Bodega[];         // All bodegas accessible to the user (may be filtered by area)
  allBodegas: Bodega[];      // All bodegas in the system (unfiltered, for admin use)
  selectedBodegaId: string;  // Backward compatibility: returns first or "all"
  selectedBodegaIds: string[]; // ["all"] | ["id1", "id2", ...]
  setSelectedBodegaIds: (ids: string[]) => void;
  toggleBodegaId: (id: string) => void;
  loading: boolean;
  refreshBodegas: () => Promise<void>;
  /** Returns the first selected bodega id or principal if "all" */
  activeBodegaIdForInsert: string;
  /** Filter visible bodegas by a set of allowed IDs (for area context) */
  filterByIds: (ids: string[] | null) => void;
}

const BodegaContext = createContext<BodegaContextType | null>(null);

export function BodegaProvider({ children }: { children: ReactNode }) {
  const [allBodegas, setAllBodegas] = useState<Bodega[]>([]);
  const [allowedIds, setAllowedIds] = useState<string[] | null>(null); // null = show all
  const [selectedBodegaIds, setSelectedBodegaIds] = useState<string[]>(["all"]);
  const [loading, setLoading] = useState(true);

  const loadBodegas = async () => {
    try {
      const res = await api.get("/inventory/bodegas");
      const list = (res.data ?? []) as Bodega[];
      setAllBodegas(list);

      if (selectedBodegaIds.length === 0 || (selectedBodegaIds.length === 1 && selectedBodegaIds[0] === "all")) {
        // keep "all" default
      } else {
        const validIds = selectedBodegaIds.filter(id => list.find(b => b.id === id));
        if (validIds.length === 0) setSelectedBodegaIds(["all"]);
        else setSelectedBodegaIds(validIds);
      }
    } catch (error) {
      console.error("Error fetching bodegas:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBodegaId = (id: string) => {
    setSelectedBodegaIds(prev => {
      if (id === "all") {
        if (prev.length === 1 && prev[0] === "all") return prev;
        return ["all"];
      }

      const isAllSelected = prev.includes("all");
      const isCurrentlySelected = prev.includes(id);

      if (isAllSelected) {
        // Si estamos en modo "Todas", al clickear una específica pasamos a solo esa
        return [id];
      }

      if (isCurrentlySelected) {
        // Si ya está seleccionada y es la única, NO HACEMOS NADA
        if (prev.length === 1) return prev;
        // Si hay más de una, la quitamos
        return prev.filter(i => i !== id);
      } else {
        // Si no está seleccionada, la añadimos
        return [...prev, id];
      }
    });
  };

  const filterByIds = (ids: string[] | null) => {
    setAllowedIds(ids);
    // Reset selection to "all" when area changes
    setSelectedBodegaIds(["all"]);
  };

  useEffect(() => {
    const handleAreaChange = (e: any) => {
      filterByIds(e.detail.bodegas_ids);
    };
    window.addEventListener("area-operativa-change", handleAreaChange);
    return () => window.removeEventListener("area-operativa-change", handleAreaChange);
  }, [allBodegas]); // Depend on allBodegas to ensure we have data when filtering

  useEffect(() => {
    loadBodegas();
  }, []);

  // Bodegas visible in the selector (filtered by allowedIds if set)
  const bodegas = allowedIds ? allBodegas.filter(b => allowedIds.includes(b.id)) : allBodegas;

  const principal = bodegas.find(b => b.nombre === "Bodega Principal");
  const firstValidId = selectedBodegaIds.find(id => id !== "all") || (principal?.id ?? (bodegas[0]?.id ?? ""));
  const activeBodegaIdForInsert = firstValidId;

  // Backward compatibility
  const selectedBodegaId = selectedBodegaIds.length > 0 ? selectedBodegaIds[0] : "all";

  return (
    <BodegaContext.Provider value={{
      bodegas,
      allBodegas,
      selectedBodegaId,
      selectedBodegaIds,
      setSelectedBodegaIds,
      toggleBodegaId,
      loading,
      refreshBodegas: loadBodegas,
      activeBodegaIdForInsert,
      filterByIds,
    }}>
      {children}
    </BodegaContext.Provider>
  );
}

export function useBodega() {
  const ctx = useContext(BodegaContext);
  if (!ctx) throw new Error("useBodega must be used within BodegaProvider");
  return ctx;
}

