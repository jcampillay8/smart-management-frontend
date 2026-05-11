import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Invoice, InvoiceFilters as Filters, ExportFormat } from "../types";
import InvoiceFilters from "./InvoiceFilters";
import InvoiceTable from "./InvoiceTable";
import BulkActionsBar from "./BulkActionsBar";
import EmptyState from "./EmptyState";

interface Props {
  invoices: Invoice[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  filters: Filters;
  categories: string[];
  selectedIds: Set<string>;
  processingIds?: Set<string>;
  onPageChange: (page: number) => void;
  onFiltersChange: (filters: Filters) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onProcess: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkProcess: () => void;
  onBulkDelete: () => void;
  onExport: (format: ExportFormat) => void;
  onWebhook: () => void;
}

export default function InvoicesTab({
  invoices,
  total,
  loading,
  page,
  pageSize,
  filters,
  categories,
  selectedIds,
  processingIds,
  onPageChange,
  onFiltersChange,
  onToggleSelect,
  onToggleSelectAll,
  onProcess,
  onDelete,
  onBulkProcess,
  onBulkDelete,
  onExport,
  onWebhook,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <InvoiceFilters
        filters={filters}
        onChange={onFiltersChange}
        categories={categories}
      />

      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onProcess={onBulkProcess}
          onExport={onExport}
          onWebhook={onWebhook}
          onDelete={onBulkDelete}
        />
      )}

      {invoices.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <>
          <InvoiceTable
            invoices={invoices}
            selectedIds={selectedIds}
            processingIds={processingIds}
            onToggleSelect={onToggleSelect}
            onToggleSelectAll={onToggleSelectAll}
            onProcess={onProcess}
            onDelete={onDelete}
            loading={loading}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} de {total}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 0}
                  onClick={() => onPageChange(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-2">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages - 1}
                  onClick={() => onPageChange(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
