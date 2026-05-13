import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

interface BodegaBadgeProps {
  nombre: string;
  color?: string;
  icono?: string;
  className?: string;
}

export default function BodegaBadge({ nombre, color, icono, className }: BodegaBadgeProps) {
  const label = (typeof nombre === "string") ? nombre.replace("Bodega ", "") : "S/N";
  
  // Si no hay color, usar lógica anterior como fallback
  const isTransito = nombre.includes("Tránsito");
  const isPrincipal = nombre.includes("Principal");

  const defaultColorClass = isTransito
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50"
    : isPrincipal
    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200/50"
    : "bg-secondary text-muted-foreground border-border";

  const IconComponent = icono && (LucideIcons as any)[icono] ? (LucideIcons as any)[icono] : null;

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold whitespace-nowrap border shadow-sm transition-all", 
        !color && defaultColorClass, 
        className
      )}
      style={color ? { backgroundColor: `${color}15`, color: color, borderColor: `${color}30` } : {}}
    >
      {IconComponent && <IconComponent size={12} strokeWidth={2.5} />}
      {label}
    </span>
  );
}
