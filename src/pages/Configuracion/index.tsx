import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Navigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Store, Users, Palette, ChevronRight, Mail, Warehouse, HelpCircle, Layers } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { cn } from "../../lib/utils";

import { useConfiguracion } from "./useConfiguracion";
import { RestauranteConfig } from "./RestauranteConfig";
import { UsuariosRoles } from "./UsuariosRoles";
import { AparienciaConfig } from "./AparienciaConfig";
import { PlantillasEmailConfig } from "./PlantillasEmailConfig";
import { BodegasConfig } from "./BodegasConfig";
import { SoporteConfig } from "./SoporteConfig";
import { AreasOperativasConfig } from "./AreasOperativasConfig";

export default function ConfiguracionPage() {
  const { isAdmin, user } = useAuth();
  const { users, settings, updateRole, createUser, deleteUser, refresh } = useConfiguracion(isAdmin);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  useEffect(() => {
    if (tabParam) {
      setOpenSection(tabParam);
    }
  }, [tabParam]);

  if (!isAdmin) return <Navigate to="/" replace />;

  const sections = [
    { id: "restaurante", label: "Restaurante", icon: Store, component: <RestauranteConfig settings={settings} onUpdate={refresh} /> },
    { id: "bodegas", label: "Bodegas", icon: Warehouse, component: <BodegasConfig /> },
    { id: "areas", label: "Áreas Operativas", icon: Layers, component: <AreasOperativasConfig /> },
    { id: "usuarios", label: "Usuarios y Roles", icon: Users, component: <UsuariosRoles users={users} currentUser={user} onUpdateRole={updateRole} onCreateUser={createUser} onDeleteUser={deleteUser} /> },
    { id: "plantillas_email", label: "Plantillas de Email", icon: Mail, component: <PlantillasEmailConfig /> },
    { id: "tema", label: "Apariencia", icon: Palette, component: <AparienciaConfig /> },
    { id: "soporte", label: "Soporte y Ayuda", icon: HelpCircle, component: <SoporteConfig /> },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="space-y-1 px-2">
        <h1 className="text-4xl font-black tracking-tighter">Configuración</h1>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
          Ajustes y Administración del Sistema
        </p>
      </header>
      
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