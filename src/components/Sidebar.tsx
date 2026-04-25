import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, ClipboardList, Boxes, Settings, 
  UtensilsCrossed, TrendingUp, History, 
  CalendarDays, ChevronLeft, ChevronRight, 
  Bell, BarChart3, AlertTriangle,
  ShoppingCart, ClipboardCheck, X
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";

const menuItems = [
  { path: "/", label: "Inventario", icon: ClipboardList },
  { path: "/consumo", label: "Consumo", icon: UtensilsCrossed },
  { path: "/compras", label: "Compras", icon: ShoppingCart },
  { path: "/contar-inventario", label: "Conteos", icon: ClipboardCheck },
  { path: "/analiticas", label: "Novedades", icon: Bell },
  { path: "/proyeccion", label: "Proyección", icon: TrendingUp },
  { path: "/eventos", label: "Eventos", icon: CalendarDays },
  { path: "/gestion", label: "Gestión", icon: Boxes },
  { path: "/gestionar-merma", label: "Mermas", icon: AlertTriangle },
  { path: "/historial", label: "Historial", icon: History },
  { path: "/informes", label: "Informes", icon: BarChart3 },
  { path: "/configuracion", label: "Configuración", icon: Settings, adminOnly: true },
];

interface SidebarProps {
  logo: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ logo, isOpen, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuth();

  // Close mobile menu when location changes
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  const visibleItems = menuItems;

  const sidebarContent = (
    <>
      <div className="p-6 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {(!isCollapsed || isOpen) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center overflow-hidden border border-primary/20">
                {logo ? <img src={logo} className="h-full w-full object-contain" /> : <Package className="h-5 w-5 text-primary" />}
              </div>
              <span className="font-bold text-lg tracking-tight">EasyStock</span>
            </motion.div>
          )}
          {isCollapsed && !isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto"
            >
              <Package className="h-7 w-7 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Toggle Button for Desktop */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-7 w-7 rounded-lg hover:bg-secondary items-center justify-center transition-colors border border-transparent hover:border-border"
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
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
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
              <item.icon size={20} className={cn(
                "shrink-0",
                isActive ? "text-primary-foreground" : "group-hover:text-primary transition-colors"
              )} />
              
              {(!isCollapsed || isOpen) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium text-sm whitespace-nowrap"
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

      <div className="p-4 border-t border-border mt-auto bg-background/50">
          <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  AD
              </div>
              {(!isCollapsed || isOpen) && (
                  <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate">Admin</span>
                      <span className="text-[10px] text-muted-foreground truncate">EasyStock v1.0</span>
                  </div>
              )}
          </div>
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
