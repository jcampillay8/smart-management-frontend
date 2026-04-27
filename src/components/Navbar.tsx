import { useState, useEffect, useRef } from "react";
import { Bell, Search, User, LogOut, Moon, Sun, Settings, Menu, AlertTriangle, Info, OctagonAlert, ChevronRight, Store, Users, Palette, Bell as BellIcon, Warehouse, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useGlobalNotifications } from "../hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

export default function Navbar({ 
  restaurantName, 
  onMenuClick 
}: { 
  restaurantName: string;
  onMenuClick: () => void;
}) {
  const { user, signOut, isAdmin, isSupervisor } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, totalCount, hasCritical } = useGlobalNotifications();
  const navigate = useNavigate();
  
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
      { id: "restaurante", label: "Restaurante", icon: Store, action: () => navigate("/configuracion") },
      { id: "usuarios", label: "Usuarios y Roles", icon: Users, action: () => navigate("/configuracion") },
      { id: "bodegas", label: "Bodegas", icon: Warehouse, action: () => navigate("/configuracion") },
      { id: "alertas", label: "Alertas", icon: BellIcon, action: () => navigate("/configuracion") },
    ] : []),
    { id: "apariencia", label: "Apariencia", icon: Palette, action: () => navigate("/configuracion") },
  ];

  return (
    <header className="h-20 glass border-b border-border sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="h-10 w-10 rounded-xl hover:bg-secondary flex items-center justify-center md:hidden transition-colors border border-border"
        >
          <Menu size={20} className="text-muted-foreground" />
        </button>
        
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input 
            type="text" 
            placeholder="Buscar productos, recetas..."
            className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 relative" ref={dropdownRef}>
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
              <div className="absolute right-0 mt-2 w-80 glass rounded-2xl p-2 shadow-2xl border border-border z-50">
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
                <div className="absolute right-0 mt-2 w-56 glass rounded-2xl p-2 shadow-2xl border border-border z-50">
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

        <div className="h-8 w-[1px] bg-border mx-2" />

        <div className="flex items-center gap-4 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <div className="relative">
            <button 
              onClick={() => toggleDropdown("user")}
              className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 hover:bg-primary/20 transition-all overflow-hidden"
            >
               {user?.username ? (
                 <span className="text-primary font-bold uppercase">{user.username.slice(0, 2)}</span>
               ) : (
                 <User size={20} className="text-primary" />
               )}
            </button>
            
            {openDropdown === "user" && (
              <div className="absolute right-0 mt-2 w-48 glass rounded-2xl p-2 shadow-2xl border border-border z-50">
                <button 
                  onMouseDown={() => {
                    setOpenDropdown(null);
                    navigate("/configuracion");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm font-medium"
                >
                  <User size={16} /> Perfil
                </button>
                {isAdmin && (
                  <button 
                    onMouseDown={() => {
                      setOpenDropdown(null);
                      navigate("/configuracion");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm font-medium"
                  >
                    <Settings size={16} /> Configuración
                  </button>
                )}
                <div className="h-[1px] bg-border my-2 mx-2" />
                <button 
                  onMouseDown={() => {
                    setOpenDropdown(null);
                    setTimeout(() => signOut(), 50);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors text-sm font-bold cursor-pointer"
                >
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
