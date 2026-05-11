import api from "@/lib/api";
import { ExportFormat, InvoiceFilters, InvoiceSetting } from "./types";

const BASE = "/invoices";

export const facturasApi = {
  list: (params?: { skip?: number; limit?: number; transaction_type?: string; category?: string; search?: string }) =>
    api.get(`${BASE}`, { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get(`${BASE}/${id}`).then((r) => r.data),

  upload: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    return api.post(`${BASE}/upload`, formData).then((r) => r.data);
  },

  process: (id: string) =>
    api.post(`${BASE}/${id}/process`).then((r) => r.data),

  update: (id: string, data: Record<string, any>) =>
    api.put(`${BASE}/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`${BASE}/${id}`).then((r) => r.data),

  bulkProcess: (ids: string[]) =>
    api.post(`${BASE}/bulk-process`, { invoice_ids: ids }).then((r) => r.data),

  bulkDelete: (ids: string[]) =>
    api.post(`${BASE}/bulk-delete`, { invoice_ids: ids }).then((r) => r.data),

  exportInvoices: (ids: string[], format: ExportFormat) =>
    api.post(`${BASE}/export`, { invoice_ids: ids, format }, { responseType: "blob" }).then((r) => r.data),

  exportCsv: (params?: { transaction_type?: string; category?: string }) =>
    api.get(`${BASE}/export/csv`, { params, responseType: "blob" }).then((r) => r.data),

  exportSiiCompras: () =>
    api.get(`${BASE}/export/sii/compras`, { responseType: "blob" }).then((r) => r.data),

  exportSiiVentas: () =>
    api.get(`${BASE}/export/sii/ventas`, { responseType: "blob" }).then((r) => r.data),

  getStats: () =>
    api.get(`${BASE}/stats`).then((r) => r.data),

  getCategories: () =>
    api.get(`${BASE}/categories`).then((r) => r.data),

  getSettings: () =>
    api.get(`${BASE}/settings`).then((r) => r.data),

  updateSettings: (settings: InvoiceSetting[]) =>
    api.post(`${BASE}/settings`, settings).then((r) => r.data),

  getNotifications: (params?: { limit?: number; unread_only?: boolean }) =>
    api.get(`${BASE}/notifications`, { params }).then((r) => r.data),

  markNotificationRead: (id: number) =>
    api.post(`${BASE}/notifications/${id}/read`).then((r) => r.data),

  markAllNotificationsRead: () =>
    api.post(`${BASE}/notifications/read-all`).then((r) => r.data),

  chat: (query: string) =>
    api.post(`${BASE}/chat`, { query }).then((r) => r.data),

  getWebhooks: () =>
    api.get(`${BASE}/webhooks`).then((r) => r.data),

  createWebhook: (data: { url: string; description?: string; events: string[] }) =>
    api.post(`${BASE}/webhooks`, data).then((r) => r.data),

  deleteWebhook: (id: string) =>
    api.delete(`${BASE}/webhooks/${id}`).then((r) => r.data),

  testWebhook: (id: string) =>
    api.post(`${BASE}/webhooks/${id}/test`).then((r) => r.data),

  pushWebhook: (ids: string[], event?: string) =>
    api.post(`${BASE}/invoices/push-webhook`, { invoice_ids: ids, event }).then((r) => r.data),

  getOptimizedImage: (id: string) =>
    api.get(`${BASE}/${id}/optimized-image`).then((r) => r.data),
};
