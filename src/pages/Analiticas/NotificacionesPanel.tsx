// src/pages/Analiticas/NotificacionesPanel.tsx

import { Bell, ChevronRight, AlertTriangle, Info, Package, OctagonAlert } from "lucide-react";
import { SmartNotification } from "./types";
import { cn } from "../../lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";

interface Props {
  notifications: SmartNotification[];
}

export function NotificacionesPanel({ notifications }: Props) {
  return (
    <div className="flex flex-col h-full bg-card border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Bell className="h-4 w-4 text-indigo-500" />
          Centro de Notificaciones
        </h2>
        {notifications.length > 0 && (
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="bg-secondary/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">No hay alertas pendientes por ahora.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = n.type === "critical" ? OctagonAlert : n.type === "warning" ? AlertTriangle : Info;
              
              return (
                <div 
                  key={n.key} 
                  className={cn(
                    "group relative p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                    n.type === "critical" ? "border-l-4 border-l-destructive bg-red-50/20" : 
                    n.type === "warning" ? "border-l-4 border-l-amber-500 bg-amber-50/20" : 
                    "border-l-4 border-l-blue-500 bg-blue-50/20"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "mt-0.5",
                      n.type === "critical" ? "text-destructive" : 
                      n.type === "warning" ? "text-amber-600" : "text-blue-600"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-bold leading-none">{n.title}</p>
                      <div className="space-y-1">
                        {n.details.slice(0, 3).map((detail, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] text-muted-foreground">
                            <span>• {detail.text}</span>
                            {detail.bodega && (
                              <span className="text-[9px] bg-background px-1 rounded border">
                                {detail.bodega}
                              </span>
                            )}
                          </div>
                        ))}
                        {n.details.length > 3 && (
                          <p className="text-[10px] text-indigo-600 font-medium">
                            + {n.details.length - 3} ítems más...
                          </p>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground self-center group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {notifications.length > 0 && (
        <div className="p-3 bg-muted/20 border-t">
          <p className="text-[10px] text-center text-muted-foreground italic">
            Estas alertas se basan en el stock en tiempo real y fechas de vencimiento registradas.
          </p>
        </div>
      )}
    </div>
  );
}