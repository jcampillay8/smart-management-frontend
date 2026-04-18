import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { toast } from "sonner";

interface UndoAction {
  label: string;
  undo: () => Promise<void>;
}

interface UndoRedoContextType {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  pushAction: (action: UndoAction & { redo: () => Promise<void> }) => void;
}

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined);

type FullAction = UndoAction & { redo: () => Promise<void> };

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const [undoStack, setUndoStack] = useState<FullAction[]>([]);
  const [redoStack, setRedoStack] = useState<FullAction[]>([]);
  const undoRef = useRef(undoStack);
  const redoRef = useRef(redoStack);
  undoRef.current = undoStack;
  redoRef.current = redoStack;

  const pushAction = useCallback((action: FullAction) => {
    setUndoStack(prev => [...prev.slice(-19), action]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(async () => {
    const stack = undoRef.current;
    const action = stack[stack.length - 1];
    if (!action) return;
    try {
      await action.undo();
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, action]);
      toast.success(`Deshecho: ${action.label}`);
    } catch (e: any) {
      toast.error("Error al deshacer: " + e.message);
    }
  }, []);

  const redo = useCallback(async () => {
    const stack = redoRef.current;
    const action = stack[stack.length - 1];
    if (!action) return;
    try {
      await action.redo();
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, action]);
      toast.success(`Rehecho: ${action.label}`);
    } catch (e: any) {
      toast.error("Error al rehacer: " + e.message);
    }
  }, []);

  return (
    <UndoRedoContext.Provider value={{ canUndo: undoStack.length > 0, canRedo: redoStack.length > 0, undo, redo, pushAction }}>
      {children}
    </UndoRedoContext.Provider>
  );
}

export function useUndoRedo() {
  const ctx = useContext(UndoRedoContext);
  if (!ctx) throw new Error("useUndoRedo must be used within UndoRedoProvider");
  return ctx;
}
