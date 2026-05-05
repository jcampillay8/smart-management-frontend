import { useState, useEffect, useRef } from "react";
import { Bell, Search, User, LogOut, Moon, Sun, Settings, Menu, AlertTriangle, Info, OctagonAlert, ChevronRight, Store, Users, Palette, Bell as BellIcon, Warehouse, ShieldCheck, Undo2, Redo2, Package, Mail, HelpCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useGlobalNotifications } from "../hooks/useNotifications";
import { useNavigate, useLocation } from "react-router-dom";
import { useUndoRedo } from "../hooks/useUndoRedo";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

export default function Navbar({ 
  restaurantName, 
  logoUrl,
  onMenuClick 
}: { 
  restaurantName: string;
  logoUrl: string | null;
  onMenuClick: () => void;
}) {
  const { user, signOut, isAdmin, isSupervisor } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, totalCount, hasCritical } = useGlobalNotifications();
  const { undo, redo } = useUndoRedo();
  const navigate = useNavigate();
  const location = useLocation();
  const isConsumo = location.pathname === "/consumo";
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const configSections = [
    ...(isAdmin ? [
      { id: "restaurante", label: "Restaurante", icon: Store, action: () => navigate("/configuracion?tab=restaurante") },
      { id: "bodegas", label: "Bodegas", icon: Warehouse, action: () => navigate("/configuracion?tab=bodegas") },
      { id: "usuarios", label: "Usuarios y Roles", icon: Users, action: () => navigate("/configuracion?tab=usuarios") },
      { id: "plantillas_email", label: "Plantillas de Email", icon: Mail, action: () => navigate("/configuracion?tab=plantillas_email") },
    ] : []),
    { id: "tema", label: "Apariencia", icon: Palette, action: () => navigate("/configuracion?tab=tema") },
    { id: "soporte", label: "Soporte y Ayuda", icon: HelpCircle, action: () => navigate("/configuracion?tab=soporte") },
  ];

  return (
    <header className="h-20 glass border-b border-border sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* IZQUIERDA: Menú (Móvil) */}
      <div className="flex items-center gap-3 md:hidden">
        <button 
          onClick={onMenuClick}
          className="h-10 w-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors border border-border"
        >
          <Menu size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* CENTRO: Barra de Búsqueda */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-[400px] hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
          <input 
            type="text" 
            placeholder="Buscar producto, receta o evento..."
            className="w-full h-10 bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* DERECHA: Perfil de Usuario y Acciones */}
      <div className="flex items-center gap-4">
        {isConsumo && (
          <div className="flex items-center gap-1 shrink-0 bg-secondary/30 p-1 rounded-xl border border-border/50">
            <button 
              onClick={() => confirm("¿Estás seguro de deshacer el último movimiento? Esto revertirá el stock de los productos involucrados.") && undo()}
              title="Deshacer último movimiento"
              className="h-9 w-9 rounded-lg hover:bg-background flex items-center justify-center transition-colors border border-transparent"
            >
              <Undo2 size={18} className="text-muted-foreground" />
            </button>
            <button 
              onClick={redo}
              title="Rehacer movimiento"
              className="h-9 w-9 rounded-lg hover:bg-background flex items-center justify-center transition-colors border border-transparent"
            >
              <Redo2 size={18} className="text-muted-foreground" />
            </button>
          </div>
        )}

         {/* Perfil de Usuario (Ahora a la derecha) */}
         <div className="relative">
           <div 
             className="flex items-center gap-3 shrink-0 px-3 py-1.5 rounded-2xl hover:bg-secondary/50 transition-all cursor-pointer border border-transparent hover:border-border/50"
             onClick={() => toggleDropdown("profile")}
           >
             <div className="flex flex-col items-end min-w-0 hidden sm:flex">
               <span className="font-bold text-xs tracking-tight truncate max-w-[120px]">
                 {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.username}
               </span>
               <span className="text-[9px] text-muted-foreground font-medium capitalize">
                 {user?.role || "Personal"}
               </span>
             </div>
             <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden shrink-0 shadow-inner">
               {user?.userImage ? (
                 <img src={user.userImage} alt="Profile" className="h-full w-full object-cover" />
               ) : (
                 <span className="text-primary font-bold text-xs uppercase">
                   {user?.firstName ? `${user.firstName[0]}${user.lastName?.[0] || ""}` : user?.username?.slice(0, 2).toUpperCase()}
                 </span>
               )}
             </div>
           </div>
           {openDropdown === "profile" && (
             <div className="absolute right-0 mt-2 w-48 bg-card rounded-2xl p-2 shadow-2xl border border-border z-50">
               <button
                 onClick={() => { navigate("/perfil"); setOpenDropdown(null); }}
                 className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-left"
               >
                 <User size={16} className="text-muted-foreground" />
                 Ver Perfil
               </button>
               <button
                 onClick={() => { signOut(); setOpenDropdown(null); }}
                 className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-left text-destructive"
               >
                 <LogOut size={16} className="text-destructive" />
                 Cerrar Sesión
               </button>
             </div>
           )}
         </div>

        <div className="w-[1px] h-8 bg-border mx-1 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => toggleDropdown("notif")}
              className="h-10 w-10 rounded-xl hover:bg-secondary flex items-center justify-center relative transition-colors"
            >
              <Bell size={20} className={cn("text-muted-foreground", hasCritical && "text-destructive")} />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1 border-2 border-background">
                  {totalCount > 9 ? "9+" : totalCount}
                </span>
              )}
            </button>
            
            {openDropdown === "notif" && (
              <div className="absolute right-0 mt-2 w-80 bg-card rounded-2xl p-2 shadow-2xl border border-border z-50">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border mb-2">
                  <span className="text-sm font-bold">Notificaciones</span>
                  {totalCount > 0 && (
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{totalCount} nuevas</span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Sin notificaciones nuevas
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n) => {
                      const Icon = n.type === "critical" ? OctagonAlert : n.type === "warning" ? AlertTriangle : Info;
                      return (
                        <button 
                          key={n.key}
                          onClick={() => { navigate("/analiticas"); setOpenDropdown(null); }}
                          className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                        >
                          <Icon className={cn("h-4 w-4 mt-0.5", n.type === "critical" ? "text-destructive" : "text-amber-500")} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{n.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{n.details.length} ítems</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      );
                    })
                  )}
                </div>
                <button 
                  onClick={() => { navigate("/analiticas"); setOpenDropdown(null); }}
                  className="w-full text-center text-xs text-primary font-medium py-2 border-t border-border mt-2 hover:bg-secondary rounded-lg"
                >
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors"
          >
            {theme === "dark" ? (
              <Sun size={20} className="text-muted-foreground" />
            ) : (
              <Moon size={20} className="text-muted-foreground" />
            )}
          </button>
          {isAdmin && (
            <div className="relative">
              <button 
                onClick={() => toggleDropdown("config")}
                className="h-10 w-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors"
              >
                <Settings size={20} className="text-muted-foreground" />
              </button>
              {openDropdown === "config" && (
                <div className="absolute right-0 mt-2 w-56 bg-card rounded-2xl p-2 shadow-2xl border border-border z-50">
                  <div className="px-3 py-2 border-b border-border mb-2">
                    <span className="text-sm font-bold">Configuración</span>
                  </div>
                  <div className="space-y-1">
                    {configSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => { section.action(); setOpenDropdown(null); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-left"
                      >
                        <section.icon size={16} className="text-muted-foreground" />
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
