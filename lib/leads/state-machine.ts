/**
 * Máquina de estados formal de un lead. Una única tabla de transiciones
 * válidas — todo cambio de estado (automático o manual) pasa por
 * `canTransition()`/`assertTransition()`, nunca se escribe `leads.status`
 * directamente desde una Server Action o una ruta.
 *
 * Los 9 estados heredados (`nuevo`, `validado`, `descartado`, `asignado`,
 * `enviado`, `contactado`, `sin_cobertura`, `cerrado`, `con_incidencia`)
 * se mantienen como nodos válidos del grafo por compatibilidad con leads
 * ya existentes — ver docs/LEAD-LIFECYCLE.md para el diagrama completo.
 */
import type { leads } from "@/db/schema";

export type LeadStatus = (typeof leads.$inferSelect)["status"];

export const TERMINAL_STATUSES: LeadStatus[] = [
  "cerrado",
  "descartado",
  "ganado",
  "perdido",
  "cancelado",
  "invalido",
];

export function isTerminalStatus(status: LeadStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Grafo de transiciones permitidas. Toda clave debe listarse aunque sea con array vacío (estado terminal). */
const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  nuevo: ["en_validacion", "validado", "descartado", "invalido", "cancelado"],
  en_validacion: ["validado", "invalido", "descartado", "cancelado"],
  validado: ["en_cola", "asignado", "sin_cobertura", "descartado", "cancelado"],
  en_cola: ["asignado", "sin_cobertura", "cancelado", "descartado"],
  sin_cobertura: ["en_cola", "asignado", "cancelado", "descartado"],
  asignado: ["notificado", "reasignacion_pendiente", "cancelado", "con_incidencia"],
  notificado: ["visto", "aceptado", "rechazado", "expirado", "reasignacion_pendiente", "con_incidencia"],
  visto: ["aceptado", "rechazado", "expirado", "reasignacion_pendiente", "con_incidencia"],
  aceptado: ["contacto_pendiente", "con_incidencia"],
  contacto_pendiente: ["contacto_confirmado", "reasignacion_pendiente", "con_incidencia", "cancelado"],
  contacto_confirmado: ["presupuesto_pendiente", "cerrado", "perdido", "con_incidencia"],
  presupuesto_pendiente: ["presupuesto_enviado", "reasignacion_pendiente", "con_incidencia", "cancelado"],
  presupuesto_enviado: ["en_revision_usuario", "ganado", "perdido", "con_incidencia"],
  en_revision_usuario: ["ganado", "perdido", "cerrado"],
  reasignacion_pendiente: ["reasignado", "contacto_pendiente", "presupuesto_pendiente", "cancelado"],
  reasignado: ["en_cola", "asignado", "sin_cobertura"],
  rechazado: ["reasignacion_pendiente", "en_cola", "cancelado"],
  expirado: ["reasignacion_pendiente", "en_cola", "cancelado"],
  con_incidencia: ["validado", "asignado", "contacto_pendiente", "presupuesto_pendiente", "cancelado", "invalido"],
  // Legado (preservado para leads ya existentes, gestionados a mano desde /admin):
  enviado: ["contactado", "con_incidencia"],
  contactado: ["cerrado", "con_incidencia"],
  // Terminales:
  ganado: ["cerrado"],
  perdido: ["cerrado"],
  cerrado: [],
  cancelado: [],
  invalido: [],
  descartado: [],
};

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  if (from === to) return false;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export class InvalidLeadTransitionError extends Error {
  constructor(from: LeadStatus, to: LeadStatus) {
    super(`Transición de lead no permitida: '${from}' -> '${to}'.`);
    this.name = "InvalidLeadTransitionError";
  }
}

export function assertTransition(from: LeadStatus, to: LeadStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidLeadTransitionError(from, to);
  }
}
