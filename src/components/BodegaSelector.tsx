import { useBodega } from "@/hooks/useBodega";
import { cn } from "@/lib/utils";
import { Warehouse, ArrowUpDown } from "lucide-react";

interface BodegaSelectorProps {
  className?: string;
  hideAll?: boolean;
}

export default function BodegaSelector({ className, hideAll }: BodegaSelectorProps) {
  const { bodegas, selectedBodegaId, setSelectedBodegaId } = useBodega();

  if (bodegas.length === 0) return null;

  // Order: Tránsito - Principal - Todas
  const transito = bodegas.find(b => b.nombre === "Bodega Tránsito");
  const principal = bodegas.find(b => b.nombre === "Bodega Principal");
  const orderedBodegas = [transito, principal].filter(Boolean) as typeof bodegas;
  const others = bodegas.filter(b => b.id !== transito?.id && b.id !== principal?.id);
  const options = [
    ...orderedBodegas.map(b => ({ id: b.id, label: b.nombre.replace("Bodega ", ""), isTransito: b.nombre === "Bodega Tránsito", isPrincipal: b.nombre === "Bodega Principal" })),
    ...others.map(b => ({ id: b.id, label: b.nombre.replace("Bodega ", ""), isTransito: false, isPrincipal: false })),
    ...(!hideAll ? [{ id: "all", label: "Todas", isTransito: false, isPrincipal: false }] : []),
  ];

  const getIcon = (opt: typeof options[0]) => {
    if (opt.isTransito) return <ArrowUpDown className="h-3.5 w-3.5" />;
    if (opt.isPrincipal) return <Warehouse className="h-3.5 w-3.5" />;
    return null;
  };

  return (
    <div className={cn("flex items-center gap-1 rounded-lg border bg-muted/50 p-0.5", className)}>
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => setSelectedBodegaId(opt.id)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1",
            selectedBodegaId === opt.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {getIcon(opt)}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
