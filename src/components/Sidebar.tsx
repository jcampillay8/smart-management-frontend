import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, ClipboardList, Boxes, Settings, 
  UtensilsCrossed, TrendingUp, History, 
  CalendarDays, ChevronLeft, ChevronRight, 
  Bell, BarChart3, AlertTriangle,
  X
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import api from "../lib/api";

const API_URL = api.defaults.baseURL;

const menuItems = [
  { path: "/consumo", label: "Consumo", icon: UtensilsCrossed },
  { path: "/", label: "Inventario", icon: ClipboardList, exact: true },
  { path: "/gestion", label: "Gestión", icon: Boxes },
  { path: "/eventos", label: "Eventos", icon: CalendarDays },
  { path: "/proyeccion", label: "Proyección", icon: TrendingUp },
  { path: "/historial", label: "Historial", icon: History },
  { path: "/actividades", label: "Panel de actividades", icon: BarChart3 },
  { path: "/alertas", label: "Alertas", icon: Bell, hasBadge: true },
];

interface SidebarProps {
  logo: string | null;
  name?: string;
  tipoNegocio?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ logo, name, tipoNegocio, isOpen, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();

  // Notif badge from localStorage
  const [hasCritical, setHasCritical] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const read = () => {
      const count = parseInt(localStorage.getItem("notif_total_count") || "0", 10);
      const critical = localStorage.getItem("notif_has_critical") === "true";
      setNotifCount(count);
      setHasCritical(critical);
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("notif-updated", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("notif-updated", read);
    };
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  // Derive initials and display name from user
  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ""}`.toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || "U";

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.username || "Usuario";

  const sidebarContent = (
    <>
      <div className="relative px-5 flex items-center h-[89px] flex-none border-b border-border/50 overflow-hidden group/header">
        {/* Toggle Button - Synchronized Animation */}
        <motion.button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          initial={false}
          animate={{ 
            right: isCollapsed && !isOpen ? 20 : 12,
            backgroundColor: isCollapsed && !isOpen ? "hsl(var(--primary) / 0.1)" : "hsl(var(--secondary) / 0.5)",
            width: isCollapsed && !isOpen ? 40 : 32,
            height: isCollapsed && !isOpen ? 40 : 32,
            borderRadius: isCollapsed && !isOpen ? "0.75rem" : "0.5rem",
          }}
          className={cn(
            "absolute hidden md:flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 z-50 text-primary border border-border/50 backdrop-blur-sm",
            !isCollapsed && "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={18} />}
        </motion.button>

        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={cn(
            "h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden shrink-0 shadow-inner relative transition-opacity duration-300",
            isCollapsed && !isOpen && "group-hover:opacity-0"
          )}>
            {logo ? (
              <img 
                src={logo.startsWith("http") ? logo : `${API_URL || "http://localhost:8000"}${logo.startsWith("/") ? "" : "/"}${logo}`} 
                className="h-full w-full object-contain" 
                alt="Logo" 
              />
            ) : (
              <Package className="h-6 w-6 text-primary" />
            )}
          </div>
          
          <AnimatePresence>
            {(!isCollapsed || isOpen) && (
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="flex flex-col min-w-0 overflow-hidden"
              >
                {(() => {
                  const n = name || "SIOCI";
                  const isLight = theme === "light";
                  const isCosmic = theme === "cosmic-blue";
                  const hoverShadow = isLight 
                    ? "2px 2px 12px rgba(0,0,0,0.12), 0 0 18px rgba(0,0,0,0.04)"
                    : isCosmic
                      ? "0 0 15px rgba(255,255,255,0.5), 0 0 30px rgba(255,255,255,0.25), 0 0 50px rgba(255,255,255,0.1)"
                      : "0 0 15px hsl(var(--primary) / 0.5), 0 0 30px hsl(var(--primary) / 0.25), 0 0 50px hsl(var(--primary) / 0.1)";

                  if (tipoNegocio) {
                    return (
                      <motion.div 
                        whileHover={{ 
                          textShadow: hoverShadow,
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex flex-col -space-y-0.5 cursor-default group/name"
                      >
                        <span className="text-[11px] font-semibold text-primary uppercase tracking-[0.15em] leading-none">
                          {tipoNegocio}
                        </span>
                        <span className="font-bold text-base tracking-tight uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                          {n}
                        </span>
                      </motion.div>
                    );
                  }
                  
                  return (
                    <motion.span 
                      whileHover={{ 
                        textShadow: hoverShadow,
                      }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="font-bold text-base leading-tight tracking-tight uppercase whitespace-nowrap overflow-hidden text-ellipsis cursor-default"
                    >
                      {n}
                    </motion.span>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Close Button for Mobile (always visible on mobile) */}
        <button 
          onClick={onClose}
          className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors border border-border"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1 mt-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          const showBadge = item.hasBadge && notifCount > 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative shrink-0 w-10 flex justify-center">
                <item.icon size={20} className={cn(
                  isActive ? "text-primary-foreground" : "group-hover:text-primary transition-colors"
                )} />
                {showBadge && (
                  <span className={cn(
                    "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold border-2 border-background px-0.5",
                    hasCritical
                      ? "bg-destructive text-destructive-foreground animate-pulse"
                      : "bg-amber-500 text-white"
                  )}>
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </div>
              
              {(!isCollapsed || isOpen) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium text-sm whitespace-nowrap flex-1"
                >
                  {item.label}
                </motion.span>
              )}

              {isActive && (
                <motion.div 
                   layoutId="active-pill"
                   className="absolute left-0 w-1 h-5 bg-primary-foreground rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto bg-background/50 h-[53px] flex items-center overflow-x-hidden overflow-y-hidden shrink-0">
        <AnimatePresence>
          {(!isCollapsed || isOpen) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between w-full px-2"
            >
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest whitespace-nowrap">
                EasyStock v1.0
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse cosmic-star shrink-0 ml-2" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] md:hidden"
            />
            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-background border-r border-border z-[100] md:hidden flex flex-col shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 260 }}
        className="hidden md:flex flex-col h-screen glass border-r border-border sticky top-0 z-40 overflow-hidden group"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
