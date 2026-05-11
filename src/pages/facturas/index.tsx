import { useNavigate } from "react-router-dom";
import { FileText, LayoutDashboard, List, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFacturas } from "./useFacturas";
import DashboardTab from "./components/DashboardTab";
import InvoicesTab from "./components/InvoicesTab";
import PipelineTab from "./components/PipelineTab";

const TABS = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard, color: "bg-blue-500" },
  { id: "invoices" as const, label: "Facturas", icon: List, color: "bg-indigo-500" },
  { id: "pipeline" as const, label: "Pipeline", icon: Workflow, color: "bg-emerald-500" },
];

export default function FacturasPage() {
  const navigate = useNavigate();
  const {
    invoices,
    total,
    stats,
    loading,
    statsLoading,
    activeTab,
    setActiveTab,
    selectedIds,
    filters,
    setFilters,
    categories,
    processingIds,
    page,
    setPage,
    pageSize,
    loadInvoices,
    uploadFiles,
    processInvoice,
    bulkProcess,
    deleteInvoice,
    bulkDelete,
    toggleSelect,
    toggleSelectAll,
    exportSelected,
    pushToWebhook,
  } = useFacturas();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          Facturas
        </h1>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-3 items-center rounded-xl bg-secondary/30 p-1 gap-1 border border-border/50 shadow-inner w-full md:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-3 md:px-4 py-2 text-[10px] font-black transition-all duration-300 uppercase tracking-widest min-h-[40px]",
                activeTab === tab.id
                  ? cn(tab.color, "text-white shadow-lg scale-[1.02] md:scale-105")
                  : "text-muted-foreground hover:text-foreground hover:bg-background/80"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "dashboard" && (
        <DashboardTab stats={stats} loading={statsLoading} onUpload={uploadFiles} />
      )}

      {activeTab === "invoices" && (
        <InvoicesTab
          invoices={invoices}
          total={total}
          loading={loading}
          page={page}
          pageSize={pageSize}
          filters={filters}
          categories={categories}
          selectedIds={selectedIds}
          processingIds={processingIds}
          onPageChange={setPage}
          onFiltersChange={setFilters}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onProcess={processInvoice}
          onDelete={deleteInvoice}
          onBulkProcess={bulkProcess}
          onBulkDelete={bulkDelete}
          onExport={exportSelected}
          onWebhook={pushToWebhook}
        />
      )}

      {activeTab === "pipeline" && (
        <PipelineTab
          invoices={invoices}
          loading={loading}
          processingIds={processingIds}
          onUpload={uploadFiles}
          onProcess={processInvoice}
        />
      )}
    </div>
  );
}
