"use client";

import { TrackOnMount } from "./TrackOnMount";

/**
 * Vista de página para páginas de contenido SEO (precios, comparativas,
 * preguntas, guías, hub de servicio, home...). Las páginas de calculadora
 * y resultado no la usan: allí el evento relevante es
 * `calculator_start`/`estimate_result_view`, no `page_view`.
 */
export function PageViewTracker() {
  return <TrackOnMount eventType="page_view" />;
}
