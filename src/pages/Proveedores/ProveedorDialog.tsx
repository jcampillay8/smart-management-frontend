// src/pages/Proveedores/ProveedorDialog.tsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Proveedor } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Building2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProveedor: Proveedor | null;
  onSave: (data: Partial<Proveedor>) => Promise<void>;
  saving: boolean;
}

export function ProveedorDialog({ open, onOpenChange, editingProveedor, onSave, saving }: Props) {
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [rut, setRut] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (open) {
      if (editingProveedor) {
        setNombreEmpresa(editingProveedor.nombre_empresa);
        setRut(editingProveedor.rut ?? "");
        setNombreContacto(editingProveedor.nombre_contacto ?? "");
        setTelefono(editingProveedor.telefono ?? "");
        setDireccion(editingProveedor.direccion ?? "");
        setEmail(editingProveedor.email ?? "");
      } else {
        setNombreEmpresa("");
        setRut("");
        setNombreContacto("");
        setTelefono("");
        setDireccion("");
        setEmail("");
      }
    }
  }, [open, editingProveedor]);

  const handleSave = async () => {
    if (!nombreEmpresa.trim()) {
      toast.error("El nombre de la empresa es obligatorio");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Correo electrónico no válido");
      return;
    }

    await onSave({
      nombre_empresa: nombreEmpresa.trim(),
      rut: rut.trim() || null,
      nombre_contacto: nombreContacto.trim() || null,
      telefono: telefono.trim() || null,
      direccion: direccion.trim() || null,
      email: email.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {editingProveedor ? "Editar proveedor" : "Nuevo proveedor"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label>Nombre de la empresa *</Label>
            <Input
              value={nombreEmpresa}
              onChange={(e) => setNombreEmpresa(e.target.value)}
              placeholder="Ej: Distribuidora ABC"
            />
          </div>
          <div className="space-y-1">
            <Label>RUT</Label>
            <Input
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="76.123.456-7"
            />
          </div>
          <div className="space-y-1">
            <Label>Nombre del contacto</Label>
            <Input
              value={nombreContacto}
              onChange={(e) => setNombreContacto(e.target.value)}
              placeholder="Juan Pérez"
            />
          </div>
          <div className="space-y-1">
            <Label>Teléfono</Label>
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+56 9 1234 5678"
            />
          </div>
          <div className="space-y-1">
            <Label>Dirección</Label>
            <Input
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Av. Principal 123, Santiago"
            />
          </div>
          <div className="space-y-1">
            <Label>Correo electrónico</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@empresa.cl"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Guardando..." : editingProveedor ? "Guardar cambios" : "Crear proveedor"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}