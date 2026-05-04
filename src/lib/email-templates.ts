// src/lib/email-templates.ts

export interface EmailVariables {
  restaurante_nombre: string;
  proveedor_nombre: string;
  compra_id: string;
  total: string;
  items_resumen: string;
}

export function interpolateTemplate(template: string, vars: Partial<EmailVariables>): string {
  let result = template;
  
  const mapping: Record<string, string | undefined> = {
    "[Restaurante]": vars.restaurante_nombre,
    "[Proveedor]": vars.proveedor_nombre,
    "[ID_Compra]": vars.compra_id,
    "[Total]": vars.total,
    "[Items]": vars.items_resumen,
  };

  Object.entries(mapping).forEach(([placeholder, value]) => {
    if (value !== undefined) {
      result = result.split(placeholder).join(value);
    }
  });

  return result;
}

export function buildMailto(subject: string, body: string, to?: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${to || ""}?subject=${encodedSubject}&body=${encodedBody}`;
}
