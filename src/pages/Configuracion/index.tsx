// src/pages/Configuracion/index.tsx
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { ShieldCheck, Store, Users, Palette, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { cn } from "../../lib/utils";

import { useConfiguracion } from "./useConfiguracion";
import { RestauranteConfig } from "./RestauranteConfig";
import { UsuariosRoles } from "./UsuariosRoles";
import { AparienciaConfig } from "./AparienciaConfig";

export default function ConfiguracionPage() {
  const { isAdmin, user } = useAuth();
  const { users, settings, updateRole, refresh } = useConfiguracion(isAdmin);
  const [openSection, setOpenSection] = useState<string | null>("restaurante");

  if (!isAdmin) return <Navigate to="/" replace />;

  const sections = [
    { id: "restaurante", label: "Restaurante", icon: Store, component: <RestauranteConfig settings={settings} onUpdate={refresh} /> },
    { id: "usuarios", label: "Usuarios y Roles", icon: Users, component: <UsuariosRoles users={users} currentUser={user} onUpdateRole={updateRole} /> },
    { id: "tema", label: "Apariencia", icon: Palette, component: <AparienciaConfig /> },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6">
          <ShieldCheck className="h-5 w-5 text-primary" /> Configuración del Sistema
      </h1>
      
      <div className="space-y-3">
        {sections.map((section) => (
          <Collapsible 
            key={section.id}
            open={openSection === section.id} 
            onOpenChange={() => setOpenSection(openSection === section.id ? null : section.id)}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-4 text-left hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold text-sm">{section.label}</span>
                </div>
                <ChevronRight className={cn("h-4 w-4 transition-transform", openSection === section.id && "rotate-90")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-6 py-4 space-y-4 border-x border-b rounded-b-xl bg-card/30">
                {section.component}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}