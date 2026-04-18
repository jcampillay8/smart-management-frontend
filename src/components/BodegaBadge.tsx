import { cn } from "@/lib/utils";

interface BodegaBadgeProps {
  nombre: string;
  className?: string;
}

export default function BodegaBadge({ nombre, className }: BodegaBadgeProps) {
  const label = nombre.replace("Bodega ", "");
  const isTransito = nombre.includes("Tránsito");
  const isPrincipal = nombre.includes("Principal");

  const colorClass = isTransito
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400"
    : isPrincipal
    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-400"
    : "bg-secondary text-muted-foreground";

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", colorClass, className)}>
      {label}
    </span>
  );
}
