/**
 * Ciclo de avisos y reasignación por incumplimiento de plazo. Pensado
 * para ejecutarse periódicamente desde `app/api/cron/lead-deadlines` —
 * cada función es idempotente (solo actúa sobre filas cuyo aviso/plazo
 * todavía no se ha procesado) y usa `FOR UPDATE SKIP LOCKED` para que dos
 * ejecuciones solapadas nunca procesen la misma fila dos veces.
 */
import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { leadProfessionalExclusions, leads, professionals } from "@/db/schema";
import { transitionLead, type LeadActorType } from "./lifecycle-service";
import { assignLead } from "./assignment-service";
import { DEADLINES } from "./deadline-config";
import { sendNotification } from "@/lib/notifications/service";

function isPaused(lead: typeof leads.$inferSelect, now: Date): boolean {
  return Boolean(lead.deadlinePausedUntil && lead.deadlinePausedUntil > now);
}

export interface ReassignmentRunSummary {
  contactWarningsSent: number;
  contactReassignments: number;
  quoteWarningsSent: number;
  quoteReassignments: number;
  errors: string[];
}

/** Punto de entrada único del cron. Procesa avisos y reasignaciones de contacto y de presupuesto. */
export async function processDeadlines(): Promise<ReassignmentRunSummary> {
  const summary: ReassignmentRunSummary = {
    contactWarningsSent: 0,
    contactReassignments: 0,
    quoteWarningsSent: 0,
    quoteReassignments: 0,
    errors: [],
  };

  try {
    summary.contactWarningsSent = await sendContactWarnings();
  } catch (err) {
    summary.errors.push(`contact warnings: ${err instanceof Error ? err.message : String(err)}`);
  }
  try {
    summary.contactReassignments = await reassignOverdueContacts();
  } catch (err) {
    summary.errors.push(`contact reassignment: ${err instanceof Error ? err.message : String(err)}`);
  }
  try {
    summary.quoteWarningsSent = await sendQuoteWarnings();
  } catch (err) {
    summary.errors.push(`quote warnings: ${err instanceof Error ? err.message : String(err)}`);
  }
  try {
    summary.quoteReassignments = await reassignOverdueQuotes();
  } catch (err) {
    summary.errors.push(`quote reassignment: ${err instanceof Error ? err.message : String(err)}`);
  }

  return summary;
}

async function sendContactWarnings(): Promise<number> {
  const now = new Date();
  const warningThreshold = new Date(now.getTime() + DEADLINES.CONTACT_WARNING_DELAY_HOURS * 60 * 60 * 1000);

  // `sendNotification` usa su propia conexión del pool (no `tx`, ver
  // lib/notifications/service.ts) e inserta una fila en `notifications`
  // cuya FK a `leads` tendría que esperar a que esta transacción libere el
  // `FOR UPDATE` del lead — si se llamara aquí dentro, cada conexión
  // esperaría a la otra y el proceso se quedaría colgado indefinidamente
  // (Postgres no lo detecta como deadlock porque esta transacción no está
  // bloqueada en el gestor de bloqueos, solo esperando al cliente). Por
  // eso se marca el aviso y se recopila a quién notificar dentro de la
  // transacción, y las notificaciones se envían después de que confirme.
  const toNotify: { leadId: string; contactDeadlineAt: Date; professionalEmail: string; professionalName: string; professionalId: string }[] = [];

  const sent = await db.transaction(async (tx) => {
    const candidates = await tx
      .select()
      .from(leads)
      .where(
        and(
          or(eq(leads.status, "notificado"), eq(leads.status, "visto"), eq(leads.status, "contacto_pendiente")),
          lte(leads.contactDeadlineAt, warningThreshold),
          isNull(leads.contactWarningSentAt),
        ),
      )
      .for("update", { skipLocked: true });

    let count = 0;
    for (const lead of candidates) {
      if (isPaused(lead, now) || !lead.assignedProfessionalId || !lead.contactDeadlineAt) continue;
      const [professional] = await tx.select().from(professionals).where(eq(professionals.id, lead.assignedProfessionalId)).limit(1);
      if (!professional) continue;

      await tx.update(leads).set({ contactWarningSentAt: now }).where(eq(leads.id, lead.id));
      toNotify.push({
        leadId: lead.id,
        contactDeadlineAt: lead.contactDeadlineAt,
        professionalEmail: professional.email,
        professionalName: professional.name,
        professionalId: professional.id,
      });
      count += 1;
    }
    return count;
  });

  for (const n of toNotify) {
    await sendNotification({
      templateKey: "advertencia_reasignacion",
      channel: "email",
      recipient: n.professionalEmail,
      context: { professionalName: n.professionalName, deadline: n.contactDeadlineAt },
      leadId: n.leadId,
      professionalId: n.professionalId,
    });
  }

  return sent;
}

async function reassignOverdueContacts(): Promise<number> {
  const now = new Date();
  const graceThreshold = new Date(now.getTime() - DEADLINES.CONTACT_GRACE_PERIOD_HOURS * 60 * 60 * 1000);

  const candidates = await db
    .select()
    .from(leads)
    .where(
      and(
        or(eq(leads.status, "notificado"), eq(leads.status, "visto"), eq(leads.status, "contacto_pendiente")),
        lte(leads.contactDeadlineAt, graceThreshold),
      ),
    );

  let reassigned = 0;
  for (const lead of candidates) {
    if (isPaused(lead, now)) continue;
    if (lead.reassignedAt && lead.reassignedAt.getTime() > now.getTime() - DEADLINES.REASSIGNMENT_COOLDOWN_HOURS * 60 * 60 * 1000) {
      continue; // periodo de enfriamiento tras la última reasignación
    }
    await reassignLead(lead.id, "No se confirmó el contacto dentro del plazo establecido.");
    reassigned += 1;
  }
  return reassigned;
}

async function sendQuoteWarnings(): Promise<number> {
  const now = new Date();
  const warningThreshold = new Date(now.getTime() + DEADLINES.QUOTE_WARNING_DELAY_HOURS * 60 * 60 * 1000);

  // Mismo motivo que en sendContactWarnings: nunca llamar a sendNotification
  // dentro de esta transacción (colgaría esperando el FOR UPDATE del lead).
  const toNotify: { leadId: string; quoteDeadlineAt: Date; professionalEmail: string; professionalName: string; professionalId: string }[] = [];

  const sent = await db.transaction(async (tx) => {
    const candidates = await tx
      .select()
      .from(leads)
      .where(
        and(
          or(eq(leads.status, "presupuesto_pendiente")),
          lte(leads.quoteDeadlineAt, warningThreshold),
          isNull(leads.quoteWarningSentAt),
        ),
      )
      .for("update", { skipLocked: true });

    let count = 0;
    for (const lead of candidates) {
      if (isPaused(lead, now) || !lead.assignedProfessionalId || !lead.quoteDeadlineAt) continue;
      const [professional] = await tx.select().from(professionals).where(eq(professionals.id, lead.assignedProfessionalId)).limit(1);
      if (!professional) continue;

      await tx.update(leads).set({ quoteWarningSentAt: now }).where(eq(leads.id, lead.id));
      toNotify.push({
        leadId: lead.id,
        quoteDeadlineAt: lead.quoteDeadlineAt,
        professionalEmail: professional.email,
        professionalName: professional.name,
        professionalId: professional.id,
      });
      count += 1;
    }
    return count;
  });

  for (const n of toNotify) {
    await sendNotification({
      templateKey: "advertencia_reasignacion",
      channel: "email",
      recipient: n.professionalEmail,
      context: { professionalName: n.professionalName, deadline: n.quoteDeadlineAt },
      leadId: n.leadId,
      professionalId: n.professionalId,
    });
  }

  return sent;
}

async function reassignOverdueQuotes(): Promise<number> {
  const now = new Date();
  const graceThreshold = new Date(now.getTime() - DEADLINES.QUOTE_GRACE_PERIOD_HOURS * 60 * 60 * 1000);

  const candidates = await db
    .select()
    .from(leads)
    .where(and(eq(leads.status, "presupuesto_pendiente"), lte(leads.quoteDeadlineAt, graceThreshold)));

  let reassigned = 0;
  for (const lead of candidates) {
    if (isPaused(lead, now)) continue;
    if (lead.reassignedAt && lead.reassignedAt.getTime() > now.getTime() - DEADLINES.REASSIGNMENT_COOLDOWN_HOURS * 60 * 60 * 1000) {
      continue;
    }
    await reassignLead(lead.id, "No se entregó el presupuesto dentro del plazo establecido.");
    reassigned += 1;
  }
  return reassigned;
}

/**
 * Reasignación real: excluye al profesional actual para este lead
 * (nunca vuelve a recibirlo por esta misma incidencia), lo notifica, y
 * busca un nuevo candidato. Si no hay ninguno elegible, el lead queda
 * honestamente en `sin_cobertura`, nunca forzado a un profesional no apto.
 */
export async function reassignLead(leadId: string, reason: string, actorType: LeadActorType = "sistema"): Promise<void> {
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return;

  const previousProfessionalId = lead.assignedProfessionalId;

  await transitionLead({
    leadId,
    toStatus: "reasignacion_pendiente",
    actorType,
    reason,
    force: actorType === "admin",
    extraFields: { reassignmentPendingAt: new Date() },
  });

  if (previousProfessionalId) {
    await db.insert(leadProfessionalExclusions).values({
      leadId,
      professionalId: previousProfessionalId,
      reason,
    });

    const [professional] = await db.select().from(professionals).where(eq(professionals.id, previousProfessionalId)).limit(1);
    if (professional) {
      await sendNotification({
        templateKey: "lead_reasignado",
        channel: "email",
        recipient: professional.email,
        context: { professionalName: professional.name, reason },
        leadId,
        professionalId: professional.id,
      });
    }
  }

  await transitionLead({
    leadId,
    toStatus: "reasignado",
    actorType,
    reason,
    extraFields: {
      assignedProfessionalId: null,
      reassignedAt: new Date(),
      reassignmentCount: sql`${leads.reassignmentCount} + 1`,
      reassignmentReason: reason,
      contactDeadlineAt: null,
      contactWarningSentAt: null,
      quoteDeadlineAt: null,
      quoteWarningSentAt: null,
    },
  });

  await transitionLead({ leadId, toStatus: "en_cola", actorType, reason: "Buscando nuevo profesional" });

  await assignLead(leadId);

  const [after] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (after && after.status === "en_cola") {
    // Sin candidatos elegibles: estado honesto, no se fuerza ninguna asignación.
    await transitionLead({ leadId, toStatus: "sin_cobertura", actorType, reason: "Sin profesionales elegibles tras la reasignación" });
  }
}
