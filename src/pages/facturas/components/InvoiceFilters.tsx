import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { InvoiceFilters as Filters } from "../types";

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  categories: string[];
}

export default function InvoiceFilters({ filters, onChange, categories }: Props) {
  const clear = () => onChange({ search: "", transaction_type: "", category: "" });

  const hasFilters = filters.search || filters.transaction_type || filters.category;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por proveedor, folio..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <Select
        value={filters.transaction_type}
        onValueChange={(v) => onChange({ ...filters, transaction_type: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-[140px] h-9 text-sm">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="expense">Gasto</SelectItem>
          <SelectItem value="income">Ingreso</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.category}
        onValueChange={(v) => onChange({ ...filters, category: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-[160px] h-9 text-sm">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="h-9 text-xs gap-1">
          <X className="h-3 w-3" /> Limpiar
        </Button>
      )}
    </div>
  );
}
