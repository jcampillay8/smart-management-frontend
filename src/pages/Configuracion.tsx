import { useEffect, useState, useRef } from "react";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { Shield, ShieldCheck, Users, Palette, ChevronRight, Sun, Moon, Store, Upload } from "lucide-react";
import { cn } from "../lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";

interface UserWithRole {
  id: number;
  email: string;
  role: string;
  hasMermaPermiso?: boolean;
}

type Theme = "light" | "dark";

export default function Configuracion() {
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [openSection, setOpenSection] = useState<string | null>("restaurante");
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "light");

  // Restaurant config
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadRestaurantConfig();
    }
  }, [isAdmin]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const loadRestaurantConfig = async () => {
    try {
        const res = await api.get("/settings/restaurant");
        setRestaurantName(res.data.nombre || "");
        setRestaurantLogoUrl(res.data.logo_url || null);
    } catch (e) {
        console.error(e);
    }
  };

  const saveRestaurantName = async () => {
    setSavingConfig(true);
    try {
        await api.put("/settings/restaurant", { nombre: restaurantName.trim() });
        toast.success("Nombre actualizado");
        window.dispatchEvent(new Event("restaurant-config-changed"));
    } catch (e) {
        toast.error("Error al guardar");
    } finally {
        setSavingConfig(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
        const res = await api.post("/settings/restaurant/logo", formData);
        setRestaurantLogoUrl(res.data.logo_url);
        toast.success("Logo actualizado");
        window.dispatchEvent(new Event("restaurant-config-changed"));
    } catch (e) {
        toast.error("Error al subir logo");
    } finally {
        setUploadingLogo(false);
    }
  };

  const loadUsers = async () => {
    setLoadingData(true);
    try {
        const res = await api.get("/user/admin/all/");
        setUsers(res.data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingData(false);
    }
  };

  const updateRole = async (userId: number, newRole: string) => {
    try {
        await api.put(`/user/admin/${userId}/role`, { role: newRole });
        toast.success("Rol actualizado");
        loadUsers();
    } catch (e) {
        toast.error("Error al actualizar rol");
    }
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Configuración del Sistema
      </h1>
      
      <div className="space-y-2">
        <Collapsible open={openSection === "restaurante"} onOpenChange={() => setOpenSection(openSection === "restaurante" ? null : "restaurante")}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left">
                <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-sm">Restaurante</span>
                </div>
                <ChevronRight className={cn("h-4 w-4 transition-transform", openSection === "restaurante" && "rotate-90")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-4 space-y-4 border-x border-b rounded-b-lg">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Nombre del Negocio</label>
                    <div className="flex gap-2">
                        <Input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} />
                        <Button onClick={saveRestaurantName} disabled={savingConfig}>Guardar</Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Logo Principal</label>
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center overflow-hidden">
                            {restaurantLogoUrl ? <img src={restaurantLogoUrl} className="h-full w-full object-contain" /> : <Store className="h-6 w-6 text-muted-foreground" />}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}>
                            <Upload className="h-4 w-4 mr-2" /> {uploadingLogo ? "Subiendo..." : "Cambiar Logo"}
                        </Button>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleLogoUpload} />
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>

        <Collapsible open={openSection === "usuarios"} onOpenChange={() => setOpenSection(openSection === "usuarios" ? null : "usuarios")}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left">
                <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-sm">Usuarios y Roles</span>
                </div>
                <ChevronRight className={cn("h-4 w-4 transition-transform", openSection === "usuarios" && "rotate-90")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-4 border-x border-b rounded-b-lg overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs uppercase text-muted-foreground">
                            <th className="pb-2">Email</th>
                            <th className="pb-2">Rol Actual</th>
                            <th className="pb-2 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map(u => (
                            <tr key={u.id}>
                                <td className="py-2">{u.email}</td>
                                <td className="py-2">
                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", 
                                        u.role === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary"
                                    )}>{u.role}</span>
                                </td>
                                <td className="py-2 text-right">
                                    {u.id !== user?.id && (
                                        <div className="flex justify-end gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => updateRole(u.id, "admin")} disabled={u.role === "admin"}>Hacer Admin</Button>
                                            <Button size="sm" variant="ghost" onClick={() => updateRole(u.id, "user")} disabled={u.role === "user"}>Hacer Usuario</Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CollapsibleContent>
        </Collapsible>

        <Collapsible open={openSection === "tema"} onOpenChange={() => setOpenSection(openSection === "tema" ? null : "tema")}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left">
                <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-sm">Apariencia</span>
                </div>
                <ChevronRight className={cn("h-4 w-4 transition-transform", openSection === "tema" && "rotate-90")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-4 border-x border-b rounded-b-lg flex gap-4">
                <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} className="flex-1 gap-2"><Sun className="h-4 w-4" /> Claro</Button>
                <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} className="flex-1 gap-2"><Moon className="h-4 w-4" /> Oscuro</Button>
            </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
