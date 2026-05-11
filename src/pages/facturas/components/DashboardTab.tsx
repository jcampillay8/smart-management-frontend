import { useEffect, useState } from "react";
import {
  FileText, Brain, AlertTriangle, DollarSign,
  TrendingUp, TrendingDown, RefreshCw, Upload
} from "lucide-react";
import { DashboardStats } from "../types";
import InvoiceUploader from "./InvoiceUploader";
import { facturasApi } from "../facturasApi";
import { formatMoney } from "@/lib/format";

interface Props {
  stats: DashboardStats | null;
  loading: boolean;
  onUpload: (files: File[]) => Promise<any>;
}

export default function DashboardTab({ stats, loading, onUpload }: Props) {
  const [chatQuery, setChatQuery] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleChat = async () => {
    if (!chatQuery.trim()) return;
    setChatLoading(true);
    try {
      const res = await facturasApi.chat(chatQuery);
      setChatResponse(res.response || res.message || "Sin respuesta");
    } catch {
      setChatResponse("Error al consultar");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Cargando dashboard...
      </div>
    );
  }

  const queue = stats?.queue;
  const perf = stats?.performance;
  const fin = stats?.financial;
  const alerts = stats?.alerts || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Documentos" value={queue?.total ?? 0} />
        <StatCard icon={Brain} label="Procesados" value={queue?.processed ?? 0} color="text-emerald-600" />
        <StatCard icon={RefreshCw} label="Pendientes" value={queue?.pending ?? 0} color="text-amber-600" />
        <StatCard icon={AlertTriangle} label="Alertas" value={stats?.audit?.total_alerts ?? 0} color="text-red-600" />
        <StatCard icon={TrendingUp} label="Ingresos" value={fin?.income ? formatMoney(fin.income) : "$0"} color="text-emerald-600" />
        <StatCard icon={TrendingDown} label="Gastos" value={fin?.expense ? formatMoney(fin.expense) : "$0"} color="text-red-600" />
        <StatCard icon={Brain} label="Confianza Prom." value={perf?.avg_confidence ? `${(perf.avg_confidence * 100).toFixed(0)}%` : "—"} />
        <StatCard icon={DollarSign} label="Costo Prom./Doc" value={perf?.avg_cost_per_doc ? `$${perf.avg_cost_per_doc.toFixed(4)}` : "—"} />
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas
          </h3>
          <div className="space-y-1">
            {alerts.map((a, i) => (
              <div key={i} className={`text-xs px-3 py-2 rounded-lg border ${
                a.severity === "high" ? "bg-red-50 border-red-200 text-red-800" :
                a.severity === "medium" ? "bg-amber-50 border-amber-200 text-amber-800" :
                "bg-blue-50 border-blue-200 text-blue-800"
              }`}>
                {a.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4" /> Subir Facturas
          </h3>
          <InvoiceUploader onUpload={onUpload} />
        </div>

        {showChat && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4" /> CFO Virtual
            </h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChat()}
                  placeholder="Consulta sobre tus finanzas..."
                  className="flex-1 h-9 px-3 rounded-lg border text-sm bg-background"
                />
                <button
                  onClick={handleChat}
                  disabled={chatLoading}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  {chatLoading ? "..." : "Consultar"}
                </button>
              </div>
              {chatResponse && (
                <div className="text-sm p-3 rounded-lg bg-muted/50 border">
                  {chatResponse}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="text-sm text-primary font-medium hover:underline"
        >
          + Consultar CFO Virtual
        </button>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={`text-xl font-bold tabular-nums ${color || ""}`}>
        {value}
      </div>
    </div>
  );
}
