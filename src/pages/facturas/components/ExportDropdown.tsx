import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExportFormat } from "../types";

interface Props {
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
}

const FORMATS: { value: ExportFormat; label: string; group: string }[] = [
  { value: "csv", label: "CSV Genérico", group: "Generales" },
  { value: "excel", label: "Excel (XLSX)", group: "Generales" },
  { value: "json", label: "JSON", group: "Generales" },
  { value: "sii_compras", label: "SII Libro Compras", group: "Chile SII" },
  { value: "sii_ventas", label: "SII Libro Ventas", group: "Chile SII" },
  { value: "quickbooks", label: "QuickBooks Desktop", group: "Contabilidad" },
  { value: "quickbooks_bills", label: "QuickBooks Online", group: "Contabilidad" },
  { value: "xero", label: "Xero", group: "Contabilidad" },
  { value: "odoo", label: "Odoo", group: "Contabilidad" },
  { value: "contaplus", label: "Contaplus", group: "Contabilidad" },
];

export default function ExportDropdown({ onExport, disabled }: Props) {
  const groups = FORMATS.reduce(
    (acc, f) => {
      if (!acc[f.group]) acc[f.group] = [];
      acc[f.group].push(f);
      return acc;
    },
    {} as Record<string, typeof FORMATS>,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(groups).map(([group, formats], gi) => (
          <div key={group}>
            {gi > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground">{group}</DropdownMenuLabel>
            {formats.map((f) => (
              <DropdownMenuItem key={f.value} onClick={() => onExport(f.value)} className="text-sm cursor-pointer">
                {f.label}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
