"use client";

import type { AnalyticsEventType } from "./events";

/**
 * Atribución de primer toque: la primera ruta que vio esta sesión de
 * navegador, guardada una sola vez en sessionStorage. Sin cookies
 * persistentes ni scripts de terceros — por eso no hace falta un banner
 * de consentimiento de analítica todavía.
 */
const SESSION_ID_KEY = "pc_session_id";
const ENTRY_PATH_KEY = "pc_entry_path";

function readOrCreate(key: string, create: () => string): string {
  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const value = create();
    window.sessionStorage.setItem(key, value);
    return value;
  } catch {
    // sessionStorage no disponible (navegación privada, storage bloqueado): degradamos sin romper la página.
    return create();
  }
}

export function getSessionId(): string {
  return readOrCreate(SESSION_ID_KEY, () => crypto.randomUUID());
}

export function getEntryPath(): string {
  return readOrCreate(ENTRY_PATH_KEY, () => window.location.pathname);
}

export interface TrackEventArgs {
  eventType: AnalyticsEventType;
  estimateId?: string;
  comparisonId?: string;
  leadId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Envía un evento al backend. Usa `navigator.sendBeacon` cuando está
 * disponible para que funcione también al abandonar la página
 * (`wizard_abandoned` en `beforeunload`), y cae a `fetch(..., {keepalive})`
 * si no. Nunca lanza: un fallo de analítica no debe romper la UX.
 */
export function trackEvent(args: TrackEventArgs): void {
  try {
    const payload = JSON.stringify({
      eventType: args.eventType,
      sessionId: getSessionId(),
      entryPath: getEntryPath(),
      path: window.location.pathname,
      estimateId: args.estimateId,
      comparisonId: args.comparisonId,
      leadId: args.leadId,
      metadata: args.metadata,
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/events", blob);
      if (sent) return;
    }

    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Best-effort: si falla la petición, no interrumpimos al usuario por esto.
    });
  } catch {
    // Igual: la analítica nunca debe poder romper la página.
  }
}
