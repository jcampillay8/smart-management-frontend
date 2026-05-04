// src/pages/Proveedores/ProveedorDialog.tsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Proveedor } from "./types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Building2 } from "lucide-react";

const formatRut = (value: string): string => {
  // 1. Eliminar todo lo que no sea número o K/k
  let cleaned = value.replace(/[^0-9kK]/g, '');
  
  // 2. Si está vacío, retornar vacío
  if (!cleaned) return "";

  // 3. Separar el último carácter (DV) y el resto (cuerpo)
  // La K solo puede estar en el último carácter
  let body = cleaned.slice(0, -1).replace(/[kK]/g, '');
  let dv = cleaned.slice(-1).toUpperCase();

  // 4. Si el cuerpo tiene más de 8 dígitos, truncar (máximo 99.999.999)
  if (body.length > 8) {
    body = body.slice(0, 8);
  }

  // 5. Re-ensamblar con guion si hay suficientes caracteres
  if (body.length > 0) {
    return `${body}-${dv}`;
  }
  
  return dv;
};

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
    if (rut.trim() && !/^\d{7,8}-[0-9K]$/.test(rut.trim())) {
      toast.error("RUT no válido. Formato: 12345678-9 (sin puntos, 7 u 8 dígitos antes del guion)");
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
          <DialogDescription className="sr-only">
            Complete los datos del proveedor a continuación.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label>Nombre empresa *</Label>
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
              onChange={(e) => setRut(formatRut(e.target.value))}
              placeholder="76123456-7"
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