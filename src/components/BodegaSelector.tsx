import { useState } from "react";
import { useBodega } from "@/hooks/useBodega";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { ChevronDown, MapPin } from "lucide-react";

interface BodegaSelectorProps {
  className?: string;
  hideAll?: boolean;
}

export default function BodegaSelector({ className, hideAll }: BodegaSelectorProps) {
  const { bodegas, selectedBodegaIds, toggleBodegaId } = useBodega();
  const [open, setOpen] = useState(false);

  if (bodegas.length === 0) return null;

  const allSelected = selectedBodegaIds.includes("all");
  const selectedBodegasData = allSelected
    ? bodegas
    : bodegas.filter(b => selectedBodegaIds.includes(b.id));

  const getLabel = () => {
    if (allSelected) return "Todas";
    if (selectedBodegaIds.length === 1) {
      const b = bodegas.find(b => b.id === selectedBodegaIds[0]);
      return b ? b.nombre.replace("Bodega ", "") : "Seleccionar";
    }
    return `${selectedBodegaIds.length} Bodegas`;
  };

  const getActiveColor = () => {
    if (allSelected || selectedBodegaIds.length !== 1) return undefined;
    return bodegas.find(b => b.id === selectedBodegaIds[0])?.color;
  };

  const currentColor = getActiveColor();

  return (
    <div className="relative">
      {/* TRIGGER */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all hover:bg-secondary/80 focus:outline-none overflow-hidden h-10 min-w-[160px]",
          className
        )}
        style={
          !allSelected && selectedBodegaIds.length === 1 && currentColor
            ? { backgroundColor: `${currentColor}15`, color: currentColor, borderColor: `${currentColor}30` }
            : {}
        }
      >
        {/* MULTI-BODEGA VISUALIZER */}
        {allSelected || selectedBodegaIds.length > 1 ? (
          <div className="flex h-full flex-1 items-stretch">
            {selectedBodegasData.slice(0, 4).map((b) => {
              const Icon = b.icono && (LucideIcons as any)[b.icono] ? (LucideIcons as any)[b.icono] : LucideIcons.MapPin;
              return (
                <div
                  key={b.id}
                  className="flex-1 flex items-center justify-center border-r border-white/10 last:border-0"
                  style={{ backgroundColor: b.color ? `${b.color}25` : undefined, color: b.color }}
                >
                  <Icon size={12} strokeWidth={3} />
                </div>
              );
            })}
            {selectedBodegasData.length > 4 && (
              <div className="flex-1 flex items-center justify-center bg-secondary/50 text-muted-foreground text-[8px]">
                +{selectedBodegasData.length - 4}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 w-full">
            {(() => {
              const b = bodegas.find(b => b.id === selectedBodegaIds[0]);
              const Icon = b?.icono && (LucideIcons as any)[b.icono] ? (LucideIcons as any)[b.icono] : MapPin;
              return <Icon size={14} strokeWidth={3} />;
            })()}
            <span className="flex-1 text-left truncate">{getLabel()}</span>
          </div>
        )}
        <ChevronDown size={12} className={cn("mr-3 opacity-50 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {/* DROPDOWN PANEL — controlled manually so it never closes on item click */}
      {open && (
        <>
          {/* Backdrop to close when clicking outside */}
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />

          <div className="absolute left-0 top-[calc(100%+6px)] z-[100] w-64 rounded-2xl p-2 bg-card border border-border shadow-2xl">
            {!hideAll && (
              <button
                onClick={() => toggleBodegaId("all")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors mb-1",
                  allSelected ? "bg-primary/10 text-primary" : "hover:bg-secondary"
                )}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-border bg-secondary/50">
                  <LucideIcons.Layers size={12} strokeWidth={allSelected ? 3 : 2} />
                </div>
                Todas las Bodegas
                {allSelected && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            )}

            <div className="space-y-1">
              {bodegas.map(b => {
                const isActive = selectedBodegaIds.includes(b.id);
                const Icon = b.icono && (LucideIcons as any)[b.icono] ? (LucideIcons as any)[b.icono] : MapPin;
                return (
                  <button
                    key={b.id}
                    onClick={() => toggleBodegaId(b.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "hover:bg-secondary"
                    )}
                  >
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-border/50"
                      style={b.color ? { backgroundColor: `${b.color}20`, color: b.color } : {}}
                    >
                      <Icon size={12} strokeWidth={isActive ? 3 : 2} />
                    </div>
                    {b.nombre.replace("Bodega ", "")}
                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
