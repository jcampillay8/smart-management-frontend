import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "../lib/api";
import { useAuth } from "./useAuth";

export interface AreaOperativa {
  id: string;
  nombre: string;
  bodega_consumo_id: string;
  bodegas_ids: string[];
  usuarios_ids: number[];
}

interface AreaOperativaContextType {
  areas: AreaOperativa[];
  selectedAreaId: string | null;
  setSelectedAreaId: (id: string | null) => void;
  selectedArea: AreaOperativa | null;
  loading: boolean;
  refreshAreas: () => Promise<void>;
}

const AreaOperativaContext = createContext<AreaOperativaContextType | null>(null);

export function AreaOperativaProvider({ children }: { children: ReactNode }) {
  const [areas, setAreas] = useState<AreaOperativa[]>([]);
  const [selectedAreaId, setSelectedAreaIdRaw] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  // Lazy import to avoid circular deps — we trigger filterByIds via custom event
  const handleAreaChange = (area: AreaOperativa | null) => {
    const event = new CustomEvent("area-operativa-change", {
      detail: { bodegas_ids: area?.bodegas_ids ?? null },
    });
    window.dispatchEvent(event);
  };

  const setSelectedAreaId = (id: string | null) => {
    setSelectedAreaIdRaw(id);
    const area = areas.find(a => a.id === id) ?? null;
    handleAreaChange(area);
  };

  const loadAreas = async (retryCount = 0) => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get("/settings/areas");
      const list: AreaOperativa[] = res.data ?? [];
      setAreas(list);
      // Auto-select first area if none selected
      if (!selectedAreaId && list.length > 0) {
        const firstId = list[0].id;
        setSelectedAreaIdRaw(firstId);
        const event = new CustomEvent("area-operativa-change", {
          detail: { bodegas_ids: list[0].bodegas_ids },
        });
        window.dispatchEvent(event);
      }
    } catch (e) {
      console.error("Error loading areas operativas:", e);
      // Retry up to 3 times if it fails
      if (retryCount < 3) {
        setTimeout(() => loadAreas(retryCount + 1), 2000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAreas();
    } else {
      setAreas([]);
      setLoading(false);
    }
  }, [user?.id]); // Use user.id to be more specific

  const selectedArea = areas.find((a) => a.id === selectedAreaId) ?? null;

  return (
    <AreaOperativaContext.Provider
      value={{ areas, selectedAreaId, setSelectedAreaId, selectedArea, loading, refreshAreas: loadAreas }}
    >
      {children}
    </AreaOperativaContext.Provider>
  );
}

export function useAreaOperativa() {
  const ctx = useContext(AreaOperativaContext);
  if (!ctx) throw new Error("useAreaOperativa must be used within AreaOperativaProvider");
  return ctx;
}
