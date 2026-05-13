import { useState } from "react";
import { Layers, ChevronDown } from "lucide-react";
import { useAreaOperativa } from "../hooks/useAreaOperativa";
import { cn } from "../lib/utils";

interface AreaSelectorProps {
  className?: string;
  buttonClassName?: string;
}

export function AreaSelector({ className, buttonClassName }: AreaSelectorProps) {
  const { areas, selectedAreaId, setSelectedAreaId, selectedArea, loading } = useAreaOperativa();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className={cn("h-10 min-w-[180px] rounded-2xl bg-secondary/30 animate-pulse border border-border/50", buttonClassName)} />
    );
  }

  if (areas.length <= 1) return null;

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen(p => !p)}
        className={cn("flex items-center gap-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all hover:bg-secondary/80 h-10 px-4 min-w-[180px] bg-card", buttonClassName)}
      >
        <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="flex-1 text-left truncate">{selectedArea?.nombre ?? "Área Operativa"}</span>
        <ChevronDown className={cn("h-3 w-3 opacity-50 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[calc(100%+6px)] z-[100] w-64 rounded-2xl p-2 bg-card border border-border shadow-2xl">
            {areas.map(a => (
              <button
                key={a.id}
                onClick={() => { setSelectedAreaId(a.id); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors mb-0.5",
                  selectedAreaId === a.id ? "bg-primary/10 text-primary" : "hover:bg-secondary"
                )}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers size={12} strokeWidth={3} />
                </div>
                <span className="flex-1 text-left truncate">{a.nombre}</span>
                {selectedAreaId === a.id && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
