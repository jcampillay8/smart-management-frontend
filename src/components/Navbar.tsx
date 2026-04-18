import { Bell, Search, User, LogOut, Moon, Sun, Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { motion } from "framer-motion";

export default function Navbar({ restaurantName }: { restaurantName: string }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-20 glass border-b border-border sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
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
        <div className="flex items-center gap-2">
          <button className="h-10 w-10 rounded-xl hover:bg-secondary flex items-center justify-center relative transition-colors">
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border-2 border-background" />
          </button>
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
        </div>

        <div className="h-8 w-[1px] bg-border mx-2" />

        <div className="flex items-center gap-4 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <div className="group relative">
            <button className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 hover:bg-primary/20 transition-all overflow-hidden">
               {user?.username ? (
                 <span className="text-primary font-bold uppercase">{user.username.slice(0, 2)}</span>
               ) : (
                 <User size={20} className="text-primary" />
               )}
            </button>
            
            <div className="absolute right-0 mt-2 w-48 glass rounded-2xl p-2 shadow-2xl border border-border opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm font-medium">
                <User size={16} /> Perfil
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm font-medium">
                <Settings size={16} /> Ajustes
              </button>
              <div className="h-[1px] bg-border my-2 mx-2" />
              <button 
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors text-sm font-bold"
              >
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
