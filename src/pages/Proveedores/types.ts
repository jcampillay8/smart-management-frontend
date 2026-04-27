// src/pages/Proveedores/types.ts
export interface Proveedor {
  id: string;
  nombre_empresa: string;
  rut: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}