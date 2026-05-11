import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  warnings: string[];
}

function getWarningInfo(flag: string): { icon: typeof AlertTriangle; color: string; label: string } {
  const lower = flag.toLowerCase();
  if (lower.includes("duplicado")) return { icon: AlertCircle, color: "text-destructive", label: flag };
  if (lower.includes("fiscal") || lower.includes("rut") || lower.includes("tax")) return { icon: AlertTriangle, color: "text-amber-500", label: flag };
  if (lower.includes("antigua") || lower.includes("fecha")) return { icon: AlertTriangle, color: "text-amber-500", label: flag };
  if (lower.includes("iva") || lower.includes("impuesto")) return { icon: AlertTriangle, color: "text-orange-500", label: flag };
  return { icon: Info, color: "text-blue-500", label: flag };
}

export default function AuditWarnings({ warnings }: Props) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {warnings.map((w, i) => {
        const info = getWarningInfo(w);
        const Icon = info.icon;
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs ${info.color} cursor-help`}>
                <Icon className="h-3 w-3" />
                {w.length > 30 ? w.slice(0, 30) + "..." : w}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm text-xs">
              {w}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
