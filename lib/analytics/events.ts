/**
 * Taxonomía de eventos — compartida entre cliente y servidor. Cerrada a
 * propósito (union de literales, no un `string` libre): un evento nuevo se
 * añade aquí, nunca se inventa sobre la marcha desde un componente.
 *
 * `internal_search` está declarado para cuando exista una búsqueda interna
 * real en el sitio — hoy no hay ninguna, así que este evento simplemente
 * no se dispara todavía. Declararlo sin usarlo es honesto; construir un
 * buscador falso solo para poder dispararlo no lo sería.
 */
export type AnalyticsEventType =
  | "page_view"
  | "calculator_start"
  | "calculator_step"
  | "estimate_result_view"
  | "comparison_result_view"
  | "lead_form_opened"
  | "lead_submitted"
  | "wizard_abandoned"
  | "internal_search";

export interface AnalyticsEventPayload {
  eventType: AnalyticsEventType;
  sessionId: string;
  entryPath: string;
  path: string;
  estimateId?: string;
  comparisonId?: string;
  leadId?: string;
  metadata?: Record<string, unknown>;
}
