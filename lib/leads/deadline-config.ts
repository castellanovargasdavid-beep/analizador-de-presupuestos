/**
 * Plazos del ciclo de vida del lead, centralizados aquí y solo aquí.
 * Ningún otro archivo debe hardcodear un número de horas. Cada plazo se
 * puede sobreescribir por variable de entorno sin tocar código — ver
 * docs/PRODUCTION-SETUP.md para cómo ajustarlos en producción.
 */
function hoursFromEnv(envVar: string, fallbackHours: number): number {
  const raw = process.env[envVar];
  if (!raw) return fallbackHours;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackHours;
}

export const DEADLINES = {
  /** Tiempo máximo para que el profesional confirme que ha contactado al usuario, desde que se le notifica. */
  CONTACT_CONFIRMATION_DEADLINE_HOURS: hoursFromEnv("CONTACT_CONFIRMATION_DEADLINE_HOURS", 4),
  /** Cuánto antes del plazo de contacto se envía un aviso preventivo. */
  CONTACT_WARNING_DELAY_HOURS: hoursFromEnv("CONTACT_WARNING_DELAY_HOURS", 1),
  /** Margen de gracia tras vencer el plazo de contacto, antes de iniciar la reasignación. */
  CONTACT_GRACE_PERIOD_HOURS: hoursFromEnv("CONTACT_GRACE_PERIOD_HOURS", 2),
  /** Tiempo máximo para entregar el presupuesto tras confirmar el contacto. */
  QUOTE_SUBMISSION_DEADLINE_HOURS: hoursFromEnv("QUOTE_SUBMISSION_DEADLINE_HOURS", 72),
  /** Cuánto antes del plazo de presupuesto se envía un aviso preventivo. */
  QUOTE_WARNING_DELAY_HOURS: hoursFromEnv("QUOTE_WARNING_DELAY_HOURS", 12),
  /** Margen de gracia tras vencer el plazo de presupuesto, antes de iniciar la reasignación. */
  QUOTE_GRACE_PERIOD_HOURS: hoursFromEnv("QUOTE_GRACE_PERIOD_HOURS", 24),
  /** Tiempo mínimo entre dos reasignaciones del mismo lead, para no encadenar reasignaciones en cascada. */
  REASSIGNMENT_COOLDOWN_HOURS: hoursFromEnv("REASSIGNMENT_COOLDOWN_HOURS", 1),
  /** Tiempo máximo para aceptar o rechazar un lead tras ser notificado, antes de considerarlo sin respuesta. */
  PROFESSIONAL_RESPONSE_WINDOW_HOURS: hoursFromEnv("PROFESSIONAL_RESPONSE_WINDOW_HOURS", 2),
} as const;

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function computeContactDeadline(from: Date): Date {
  return addHours(from, DEADLINES.CONTACT_CONFIRMATION_DEADLINE_HOURS);
}

export function computeQuoteDeadline(from: Date): Date {
  return addHours(from, DEADLINES.QUOTE_SUBMISSION_DEADLINE_HOURS);
}

export function computeResponseDeadline(from: Date): Date {
  return addHours(from, DEADLINES.PROFESSIONAL_RESPONSE_WINDOW_HOURS);
}
