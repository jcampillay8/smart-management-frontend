import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../lib/api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { User, Mail, Shield, BadgeCheck, Briefcase, Camera, Banknote, Utensils, ConciergeBell, Search, Box, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import * as LucideIcons from "lucide-react";

const CARGOS = [
  { id: "Cajero", label: "Cajero", icon: Banknote },
  { id: "Cocinero", label: "Cocinero", icon: Utensils },
  { id: "Garzón", label: "Garzón", icon: ConciergeBell },
  { id: "Administrador", label: "Administrador", icon: Shield },
  { id: "Supervisor", label: "Supervisor", icon: Search },
  { id: "Bodeguero", label: "Bodeguero", icon: Box },
  { id: "Dueño", label: "Dueño", icon: BadgeCheck },
];

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [occupation, setOccupation] = useState(user?.occupation || "");
  const [userImage, setUserImage] = useState(user?.userImage || "");

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/user/profile/", {
        first_name: firstName,
        last_name: lastName,
        occupation: occupation,
        user_image: userImage
      });
      await refreshProfile();
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      toast.error("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter">Mi Perfil</h1>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
          Gestiona tu información personal y cargo en el restaurante
        </p>
      </div>

      <div className="grid gap-8">
        <Card className="rounded-[2.5rem] border-white/5 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-4">
               <div className="relative group">
                  <div className="h-24 w-24 rounded-3xl overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center">
                    {userImage ? (
                      <img src={userImage} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <button 
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                    onClick={() => {
                      const url = prompt("Ingresa la URL de tu nueva foto de perfil:", userImage);
                      if (url !== null) setUserImage(url);
                    }}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
               </div>
               <div className="space-y-1">
                  <CardTitle className="text-2xl font-black">{user?.username}</CardTitle>
                  <CardDescription className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest">
                    <Mail className="h-3 w-3" /> {user?.email}
                  </CardDescription>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase">
                    <Shield className="h-3 w-3" /> {user?.role || "Usuario"}
                  </div>
               </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</Label>
                <Input 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  placeholder="Tu nombre"
                  className="rounded-2xl border-2 font-bold h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Apellido</Label>
                <Input 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  placeholder="Tu apellido"
                  className="rounded-2xl border-2 font-bold h-12"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cargo / Posición</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CARGOS.map((cargo) => {
                  const isActive = occupation === cargo.id;
                  return (
                    <button
                      key={cargo.id}
                      type="button"
                      onClick={() => setOccupation(cargo.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-2 group",
                        isActive 
                          ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10 scale-105" 
                          : "border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <cargo.icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", isActive && "animate-bounce")} />
                      <span className="text-[10px] font-black uppercase tracking-tight">{cargo.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="relative">
                 <Input 
                  value={occupation} 
                  onChange={e => setOccupation(e.target.value)} 
                  placeholder="O ingresa otro cargo..."
                  className="rounded-2xl border-2 font-bold h-12 pr-10"
                />
                <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full h-14 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 mt-4"
            >
              {loading ? "Sincronizando..." : "Guardar Cambios"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
