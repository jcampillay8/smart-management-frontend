// src/pages/Configuracion/UsuariosRoles.tsx

import { UserWithRole } from "./types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, Shield, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  users: UserWithRole[];
  currentUser: any;
  onUpdateRole: (userId: number, newRole: string) => void;
}

export function UsuariosRoles({ users, currentUser, onUpdateRole }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
          <UserCog className="h-4 w-4" /> Gestión de Permisos
        </h3>
        <Badge variant="outline" className="text-[10px]">
          {users.length} Usuarios Registrados
        </Badge>
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
              const isAdmin = u.role === "admin";

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
                    <Badge variant={isAdmin ? "default" : "secondary"} className="capitalize">
                      {isAdmin ? <Shield className="h-3 w-3 mr-1" /> : null}
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {!isSelf ? (
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => onUpdateRole(u.id, isAdmin ? "user" : "admin")}
                        >
                          Cambiar a {isAdmin ? "Usuario" : "Admin"}
                        </Button>
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

      <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
        <p className="text-[11px] text-amber-700 leading-relaxed">
          <strong>Nota de seguridad:</strong> Los administradores pueden gestionar inventario, ver costos financieros y modificar la configuración global. Los usuarios estándar solo pueden realizar operaciones de movimiento de stock.
        </p>
      </div>
    </div>
  );
}