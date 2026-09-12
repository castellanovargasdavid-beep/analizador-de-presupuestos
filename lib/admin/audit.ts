/**
 * Auditoría administrativa: quién cambió qué y cuándo desde /admin. Esta
 * es la mitad "quién tocó qué botón" de la explicabilidad; la otra mitad
 * — "por qué esta estimación dio este rango" — no necesita esta tabla,
 * ver lib/admin/explain.ts.
 *
 * `actor` es siempre "admin" hoy porque solo existe un operador (ver
 * lib/admin/auth.ts). No se registra qué persona concreta hizo el cambio
 * porque ese dato no existe todavía — inventarlo sería peor que omitirlo.
 */
import { db } from "@/db/client";
import { adminAuditLog } from "@/db/schema";

export interface RecordAuditInput {
  action: "create" | "update" | "delete" | "publish" | "archive";
  entityType: string;
  entityId: string;
  summary: string;
}

export async function recordAudit(input: RecordAuditInput): Promise<void> {
  await db.insert(adminAuditLog).values({
    actor: "admin",
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
  });
}
