/**
 * Registro de guías — fuente única para el índice `/guias` y para generar
 * metadata/schema de cada guía sin duplicar el título/resumen en dos
 * sitios. El CONTENIDO largo de cada guía sigue viviendo en su propio
 * `page.tsx` (forzar prosa extensa a un campo de datos genérico
 * empeoraría la calidad del texto), pero su ficha sí es un dato.
 */
export interface GuideEntry {
  slug: string;
  titulo: string;
  resumen: string;
}

export const GUIAS: GuideEntry[] = [
  {
    slug: "como-comparar-presupuestos-de-instalacion",
    titulo: "Cómo comparar presupuestos de instalación sin equivocarte",
    resumen: "Qué exigir a cada presupuesto para poder compararlos de verdad, y qué señales de alerta buscar.",
  },
];
