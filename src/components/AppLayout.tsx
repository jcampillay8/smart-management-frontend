import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { motion } from "framer-motion";
import api from "../lib/api";

export default function AppLayout() {
  const [restaurantConfig, setRestaurantConfig] = useState<{ nombre: string; logo_url: string | null }>({
    nombre: "EasyStock Control",
    logo_url: null
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await api.get("/settings/restaurant");
        setRestaurantConfig(res.data);
      } catch (e) {
        console.error("Error loading restaurant config:", e);
      }
    };
    loadConfig();
    
    // Escuchar cambios locales si se actualiza en la página de configuración
    window.addEventListener("restaurant-config-changed", loadConfig);
    return () => window.removeEventListener("restaurant-config-changed", loadConfig);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar logo={restaurantConfig.logo_url} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar restaurantName={restaurantConfig.nombre} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-[1400px] mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
