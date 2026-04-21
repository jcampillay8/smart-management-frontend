// src/pages/Login/LoginBranding.tsx
import { Package, ShieldCheck, Zap } from "lucide-react";

export function LoginBranding() {
  return (
    <div className="hidden lg:flex flex-col justify-center p-12 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 space-y-6">
        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md">
          <Package size={32} />
        </div>
        <h1 className="text-5xl font-black tracking-tighter leading-tight">
          EASY <br /> STOCK <br /> CONTROL
        </h1>
        <p className="text-xl opacity-80 font-medium">Gestión inteligente para la industria hotelera y restaurantes.</p>
      </div>
    </div>
  );
}