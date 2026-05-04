import { createContext, useContext, useCallback, ReactNode } from "react";
import { toast } from "sonner";
import api from "../lib/api";

interface UndoRedoContextType {
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined);

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const undo = useCallback(async () => {
    try {
      const res = await api.post("/api/inventory/stock/undo");
      toast.success(res.data.message || "Movimientos deshechos con éxito.");
      // Opcional: disparar evento para refrescar
      window.dispatchEvent(new CustomEvent("inventory_refresh"));
    } catch (e: any) {
      if (e.response?.status === 404) {
         toast.error("No hay movimientos recientes para deshacer.");
      } else {
         toast.error("Error al deshacer: " + (e.response?.data?.detail || e.message));
      }
    }
  }, []);

  const redo = useCallback(async () => {
    try {
      const res = await api.post("/api/inventory/stock/redo");
      toast.success(res.data.message || "Movimientos rehechos con éxito.");
      window.dispatchEvent(new CustomEvent("inventory_refresh"));
    } catch (e: any) {
      if (e.response?.status === 404) {
         toast.error("No hay movimientos para rehacer.");
      } else {
         toast.error("Error al rehacer: " + (e.response?.data?.detail || e.message));
      }
    }
  }, []);

  return (
    <UndoRedoContext.Provider value={{ undo, redo }}>
      {children}
    </UndoRedoContext.Provider>
  );
}

export function useUndoRedo() {
  const ctx = useContext(UndoRedoContext);
  if (!ctx) throw new Error("useUndoRedo must be used within UndoRedoProvider");
  return ctx;
}
