import { MissingPricingDataError, InvalidEstimationInputError } from "@/lib/estimation/errors";

/**
 * Errores de dominio cuyo `.message` se escribió a propósito para
 * enseñárselo a un usuario final (sin detalles de Postgres, rutas de
 * archivo, ni trazas). Cualquier otro error (fallo de conexión a la base
 * de datos, un bug no previsto...) NUNCA debe reenviarse tal cual al
 * cliente: se registra en el log del servidor y se devuelve un mensaje
 * genérico en su lugar.
 */
const KNOWN_USER_FACING_ERRORS = [MissingPricingDataError, InvalidEstimationInputError];

export type ErrorKind = "validation" | "missing_data" | "unavailable" | "unknown";

export interface SafeError {
  kind: ErrorKind;
  message: string;
}

/**
 * `context` identifica de dónde viene el error en el log del servidor
 * (nunca llega al cliente) — para poder diagnosticar sin tener que
 * adivinar qué Server Action falló.
 */
export function toSafeError(err: unknown, context: string, fallback: string): SafeError {
  if (err instanceof MissingPricingDataError) {
    return { kind: "missing_data", message: err.message };
  }
  if (err instanceof InvalidEstimationInputError) {
    return { kind: "validation", message: err.message };
  }

  const isKnown = KNOWN_USER_FACING_ERRORS.some((cls) => err instanceof cls);
  if (!isKnown) {
    // Único sitio donde se ve el error real (stdout del servidor); nunca llega al cliente.
    console.error(`[${context}]`, err);
  }

  const isConnectionIssue =
    err instanceof Error && /ECONNREFUSED|ETIMEDOUT|connect|pool/i.test(err.message) && !isKnown;

  return {
    kind: isConnectionIssue ? "unavailable" : "unknown",
    message: fallback,
  };
}
