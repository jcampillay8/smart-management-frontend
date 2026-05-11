import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { facturasApi } from "./facturasApi";
import { Invoice, UploadResult, DashboardStats, InvoiceFilters, TabId } from "./types";

export function useFacturas() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<InvoiceFilters>({
    search: "",
    transaction_type: "",
    category: "",
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await facturasApi.list({
        skip: page * pageSize,
        limit: pageSize,
        transaction_type: filters.transaction_type || undefined,
        category: filters.category || undefined,
        search: filters.search || undefined,
      });
      setInvoices(data.invoices || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      toast.error("Error al cargar facturas: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await facturasApi.getStats();
      setStats(data);
    } catch {
      // silent fail for stats
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await facturasApi.getCategories();
      setCategories(data || []);
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    loadStats();
    loadCategories();
  }, [loadStats, loadCategories]);

  const uploadFiles = async (files: File[]): Promise<UploadResult[]> => {
    try {
      const data = await facturasApi.upload(files);
      await loadInvoices();
      await loadStats();
      return data.results || [];
    } catch (e: any) {
      toast.error("Error al subir archivos: " + (e.response?.data?.detail || e.message));
      return [];
    }
  };

  const processInvoice = async (id: string) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      const data = await facturasApi.process(id);
      if (data.invoice) {
        setInvoices((prev) => prev.map((i) => (i.id === id ? data.invoice : i)));
      }
      if (data.message?.includes("exitosa")) {
        toast.success(data.message);
      } else if (data.error) {
        toast.error(data.error);
      }
      await loadStats();
      return data;
    } catch (e: any) {
      toast.error("Error al procesar: " + (e.response?.data?.detail || e.message));
      return null;
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const bulkProcess = async () => {
    if (selectedIds.size === 0) return;
    try {
      const data = await facturasApi.bulkProcess(Array.from(selectedIds));
      toast.success(data.message || "Procesamiento completado");
      setSelectedIds(new Set());
      await loadInvoices();
      await loadStats();
    } catch (e: any) {
      toast.error("Error en procesamiento masivo: " + (e.response?.data?.detail || e.message));
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await facturasApi.delete(id);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      toast.success("Factura eliminada");
      await loadStats();
    } catch (e: any) {
      toast.error("Error al eliminar: " + (e.response?.data?.detail || e.message));
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const data = await facturasApi.bulkDelete(Array.from(selectedIds));
      toast.success(data.message || "Facturas eliminadas");
      setSelectedIds(new Set());
      await loadInvoices();
      await loadStats();
    } catch (e: any) {
      toast.error("Error al eliminar: " + (e.response?.data?.detail || e.message));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map((i) => i.id)));
    }
  };

  const downloadExport = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSelected = async (format: string) => {
    if (selectedIds.size === 0) {
      toast.error("Selecciona al menos una factura");
      return;
    }
    try {
      const blob = await facturasApi.exportInvoices(Array.from(selectedIds), format as any);
      downloadExport(blob, `facturas_${format}_${Date.now()}.${format === "excel" ? "xlsx" : format === "json" ? "json" : "csv"}`);
      toast.success(`Exportación ${format} completada`);
    } catch (e: any) {
      toast.error("Error al exportar: " + (e.response?.data?.detail || e.message));
    }
  };

  const pushToWebhook = async () => {
    if (selectedIds.size === 0) return;
    try {
      const data = await facturasApi.pushWebhook(Array.from(selectedIds));
      toast.success(data.status === "sent" ? "Facturas enviadas a webhook" : "Sin suscriptores");
    } catch (e: any) {
      toast.error("Error al enviar webhook: " + (e.response?.data?.detail || e.message));
    }
  };

  return {
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
    loadStats,
    uploadFiles,
    processInvoice,
    bulkProcess,
    deleteInvoice,
    bulkDelete,
    toggleSelect,
    toggleSelectAll,
    exportSelected,
    pushToWebhook,
    downloadExport,
  };
}
