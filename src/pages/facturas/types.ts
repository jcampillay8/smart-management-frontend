export interface Invoice {
  id: string;
  user_id: number;
  filename: string;
  file_path?: string;
  file_type: "image" | "pdf";
  vendor_name?: string | null;
  vendor_tax_id?: string | null;
  vendor_fiscal_address?: string | null;
  vendor_country?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  total_amount?: number | null;
  tax_amount?: number | null;
  currency: string;
  transaction_type?: "income" | "expense" | null;
  category?: string | null;
  description?: string | null;
  goods_services_type?: string | null;
  confidence_score?: number | null;
  audit_flags: string[];
  line_items: LineItem[];
  country_detection_method?: string | null;
  country_confidence?: number | null;
  gemini_tokens_used: number;
  gemini_cost_usd: number;
  gemini_model_used?: string | null;
  gemini_processing_time?: number | null;
  processed: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface LineItem {
  description?: string;
  quantity?: number;
  unit_price?: number;
  total?: number;
}

export interface UploadResult {
  filename: string;
  success: boolean;
  invoice_id?: string;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  queue: { total: number; processed: number; pending: number; processing_rate: number };
  performance: { daily_processed: number; avg_confidence: number; avg_cost_per_doc: number };
  audit: { total_alerts: number };
  costs: Record<string, any>;
  financial: { income: number; expense: number; net: number };
  alerts: Array<{ severity: string; message: string }>;
}

export interface InvoiceFilters {
  search: string;
  transaction_type: string;
  category: string;
}

export interface InvoiceSetting {
  key: string;
  value: any;
  type: string;
  category: string;
  description?: string;
  source: "user" | "default";
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  description?: string;
  events: string[];
  is_active: boolean;
  created_at?: string;
}

export interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  data?: string;
  read: boolean;
  created_at?: string;
}

export type ExportFormat =
  | "csv"
  | "excel"
  | "json"
  | "quickbooks"
  | "quickbooks_bills"
  | "xero"
  | "odoo"
  | "contaplus"
  | "sii_compras"
  | "sii_ventas";

export type TabId = "dashboard" | "invoices" | "pipeline";
