import { cn } from "@/lib/utils";

interface Props {
  processed: boolean;
  confidence?: number | null;
  className?: string;
}

export default function InvoiceStatusBadge({ processed, confidence, className }: Props) {
  if (processed) {
    const pct = confidence != null ? Math.round(confidence * 100) : null;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
          pct != null && pct >= 80
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            : pct != null && pct >= 50
              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
              : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
          className,
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {pct != null ? `${pct}%` : "Procesado"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
        "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      Pendiente
    </span>
  );
}
