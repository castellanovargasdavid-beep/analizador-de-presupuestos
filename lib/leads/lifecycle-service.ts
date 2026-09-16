/**
 * Único punto de escritura de `leads.status`. Cualquier otro código
 * (Server Actions, cron, portal de profesional) debe llamar a
 * `transitionLead()` en vez de hacer `db.update(leads).set({ status })`
 * directamente — así la validación de la máquina de estados y el
 * historial de auditoría nunca se pueden saltar por accidente.
 */
import { eq } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import { leads, leadStatusHistory } from "@/db/schema";
import { assertTransition, type LeadStatus } from "./state-machine";

export type LeadActorType = "sistema" | "admin" | "profesional" | "usuario";

export interface TransitionLeadArgs {
  leadId: string;
  toStatus: LeadStatus;
  actorType: LeadActorType;
  /** Identificador del actor (p. ej. "admin" o el id del profesional). Nunca datos personales libres. */
  actorId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  /** Campos adicionales de `leads` a actualizar en la misma transacción (p. ej. timestamps del nuevo estado). */
  extraFields?: PgUpdateSetSource<typeof leads>;
  /**
   * Escapatoria para un admin humano corrigiendo un estado inconsistente
   * a mano. Nunca disponible para el sistema ni para el profesional —
   * queda igualmente registrada en el historial con `forced: true`.
   */
  force?: boolean;
}

export class LeadNotFoundError extends Error {
  constructor(leadId: string) {
    super(`No existe el lead '${leadId}'.`);
    this.name = "LeadNotFoundError";
  }
}

export async function transitionLead(args: TransitionLeadArgs): Promise<void> {
  const { leadId, toStatus, actorType, actorId, reason, metadata, extraFields, force } = args;

  await db.transaction(async (tx) => {
    const [current] = await tx.select().from(leads).where(eq(leads.id, leadId)).for("update");
    if (!current) {
      throw new LeadNotFoundError(leadId);
    }

    const canForce = force === true && actorType === "admin";
    if (!canForce) {
      assertTransition(current.status, toStatus);
    }

    await tx
      .update(leads)
      .set({ status: toStatus, ...extraFields })
      .where(eq(leads.id, leadId));

    await tx.insert(leadStatusHistory).values({
      leadId,
      fromStatus: current.status,
      toStatus,
      actorType,
      actorId: actorId ?? null,
      reason: reason ?? null,
      metadata: canForce ? { ...metadata, forced: true } : (metadata ?? null),
    });
  });
}

/**
 * Anota el historial sin cambiar de estado (p. ej. una pausa justificada
 * del plazo, o una nota operativa). Usa el mismo estado como origen y
 * destino para dejar constancia sin pasar por la máquina de transiciones.
 */
export async function recordLeadNote(args: {
  leadId: string;
  actorType: LeadActorType;
  actorId?: string;
  reason: string;
  metadata?: Record<string, unknown>;
  extraFields?: PgUpdateSetSource<typeof leads>;
}): Promise<void> {
  await db.transaction(async (tx) => {
    const [current] = await tx.select().from(leads).where(eq(leads.id, args.leadId)).for("update");
    if (!current) throw new LeadNotFoundError(args.leadId);

    if (args.extraFields) {
      await tx.update(leads).set(args.extraFields).where(eq(leads.id, args.leadId));
    }

    await tx.insert(leadStatusHistory).values({
      leadId: args.leadId,
      fromStatus: current.status,
      toStatus: current.status,
      actorType: args.actorType,
      actorId: args.actorId ?? null,
      reason: args.reason,
      metadata: args.metadata ?? null,
    });
  });
}

export async function getLeadHistory(leadId: string) {
  return db
    .select()
    .from(leadStatusHistory)
    .where(eq(leadStatusHistory.leadId, leadId))
    .orderBy(leadStatusHistory.createdAt);
}
