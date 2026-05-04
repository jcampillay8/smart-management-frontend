// src/pages/Configuracion/UsuariosRoles.tsx

import { UserWithRole } from "./types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, Shield, User as UserIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  users: UserWithRole[];
  currentUser: any;
  onUpdateRole: (userId: number, newRole: string) => void;
  onCreateUser: (data: any) => Promise<void>;
  onDeleteUser: (userId: number) => Promise<void>;
}

export function UsuariosRoles({ users, currentUser, onUpdateRole, onCreateUser, onDeleteUser }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", firstName: "", lastName: "", role: "user" });
  const isOwner = currentUser?.role === "propietario";

  const handleCreate = async () => {
    await onCreateUser({ ...formData, username: formData.email });
    setCreateOpen(false);
    setFormData({ email: "", password: "", firstName: "", lastName: "", role: "user" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
          <UserCog className="h-4 w-4" /> Gestión de Permisos
        </h3>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setCreateOpen(true)} className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> Nuevo Usuario
          </Button>
          <Badge variant="outline" className="text-[10px]">
            {users.length} Usuarios Registrados
          </Badge>
        </div>
      </div>

      <div className="rounded-md border bg-background/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px]">Usuario</TableHead>
              <TableHead>Rol Actual</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;

              return (
                <TableRow key={u.id} className={cn(isSelf && "bg-primary/5")}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">
                          {u.email}
                          {isSelf && <span className="ml-2 text-[10px] text-primary font-bold">(Tú)</span>}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={u.role === "propietario" ? "default" : u.role === "admin" ? "secondary" : "outline"} 
                      className={cn(
                        "capitalize gap-1 text-[10px] font-black tracking-widest",
                        u.role === "propietario" && "bg-purple-600 hover:bg-purple-600 text-white border-0 shadow-lg shadow-purple-500/20",
                        u.role === "admin" && "bg-amber-500 hover:bg-amber-500 text-white border-0 shadow-lg shadow-amber-500/20",
                        u.role === "supervisor" && "bg-emerald-500 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/20"
                      )}
                    >
                      {u.role === "propietario" ? <Shield className="h-3 w-3" /> : u.role === "admin" ? <Shield className="h-3 w-3 opacity-70" /> : null}
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {!isSelf && (u.role !== "propietario" || isOwner) ? (
                      <div className="flex justify-end gap-2">
                        <Select
                          defaultValue={u.role}
                          onValueChange={(val) => onUpdateRole(u.id, val)}
                        >
                          <SelectTrigger className="h-8 w-32 text-[10px] font-bold uppercase tracking-wider">
                            <SelectValue placeholder="Rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {isOwner && <SelectItem value="propietario">Propietario</SelectItem>}
                            {isOwner && <SelectItem value="admin">Administrador</SelectItem>}
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="user">Vendedor/Caja</SelectItem>
                          </SelectContent>
                        </Select>

                        {isOwner && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => confirm(`¿Eliminar a ${u.email}?`) && onDeleteUser(u.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] italic text-muted-foreground">Protegido</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg mt-4">
        <p className="text-[11px] text-amber-700 leading-relaxed">
          <strong>Nota de seguridad:</strong> El <strong>Propietario</strong> tiene control total sobre bodegas, usuarios y ajustes masivos. El <strong>Administrador</strong> gestiona inventario y personal. El <strong>Supervisor</strong> coordina movimientos y mermas.
        </p>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter">Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email / Username</Label>
              <Input id="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pass" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña</Label>
              <Input id="pass" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fn" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</Label>
                <Input id="fn" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="h-10" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ln" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Apellido</Label>
                <Input id="ln" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="h-10" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rol Inicial</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                <SelectTrigger className="h-10 font-bold uppercase tracking-wider">
                  <SelectValue placeholder="Seleccionar Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario Estándar</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  {isOwner && <SelectItem value="admin">Administrador</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} className="w-full h-11 bg-primary text-white font-black uppercase tracking-widest">Crear Usuario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}