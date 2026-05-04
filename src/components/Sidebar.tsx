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
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ logo, name, isOpen, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

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
      <div className="p-6 flex items-center justify-between gap-2 min-w-0 border-b border-border/50">
        <AnimatePresence mode="wait">
          {(!isCollapsed || isOpen) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 min-w-0 flex-1"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {logo ? (
                  <img 
                    src={logo.startsWith("http") ? logo : `${API_URL || "http://localhost:8000"}${logo.startsWith("/") ? "" : "/"}${logo}`} 
                    className="h-full w-full object-contain p-1" 
                    alt="Logo" 
                  />
                ) : (
                  <Package className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-black text-[11px] leading-tight tracking-widest uppercase whitespace-pre-wrap break-words">
                  {name || "SIOCI"}
                </span>
              </div>
            </motion.div>
          )}
          {isCollapsed && !isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shadow-sm">
                {logo ? (
                  <img 
                    src={logo.startsWith("http") ? logo : `${API_URL || "http://localhost:8000"}${logo.startsWith("/") ? "" : "/"}${logo}`} 
                    className="h-full w-full object-contain p-1" 
                    alt="Logo" 
                  />
                ) : (
                  <Package className="h-5 w-5 text-primary" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Toggle Button for Desktop */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-7 w-7 rounded-lg hover:bg-secondary items-center justify-center transition-colors border border-transparent hover:border-border shrink-0 ml-2"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Close Button for Mobile */}
        <button 
          onClick={onClose}
          className="md:hidden h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors border border-border"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative shrink-0">
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

      <div className="p-4 border-t border-border mt-auto bg-background/50 flex flex-col gap-2">
        {(!isCollapsed || isOpen) && (
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">EasyStock v1.0</span>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}
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
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
            />
            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-background border-r border-border z-50 md:hidden flex flex-col shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 260 }}
        className="hidden md:flex flex-col h-screen glass border-r border-border sticky top-0 z-40 transition-all duration-300 ease-in-out"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
