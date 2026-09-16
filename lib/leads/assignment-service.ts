/**
 * Selección y asignación de profesionales. Transparente y trazable: cada
 * asignación registra en `lead_status_history.metadata` cuántos
 * candidatos había y por qué se descartó a cada uno — nunca una
 * puntuación opaca.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { leadProfessionalExclusions, leads, professionalServiceAreas, professionals } from "@/db/schema";
import { transitionLead } from "./lifecycle-service";
import { computeContactDeadline } from "./deadline-config";
import { isTerminalStatus, type LeadStatus } from "./state-machine";
import { sendNotification } from "@/lib/notifications/service";

export interface EligibilityCandidate {
  professionalId: string;
  name: string;
  currentLoad: number;
  maxConcurrentLeads: number;
  lastAssignedAt: Date | null;
}

export interface EligibilityResult {
  eligible: EligibilityCandidate[];
  /** Motivo por el que se descartó a cada profesional NO elegible del área de cobertura, para trazabilidad. */
  discarded: { professionalId: string; name: string; reason: string }[];
}

/**
 * Todos los profesionales con cobertura de (servicio, región) del lead,
 * clasificados en elegibles/descartados con el motivo exacto. Un
 * profesional con cobertura "toda España" (`regionId = null` en
 * `professional_service_areas`) es candidato para cualquier región.
 */
export async function evaluateEligibility(leadId: string): Promise<EligibilityResult> {
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return { eligible: [], discarded: [] };

  const areaRows = await db
    .select({ professional: professionals, area: professionalServiceAreas })
    .from(professionalServiceAreas)
    .innerJoin(professionals, eq(professionalServiceAreas.professionalId, professionals.id))
    .where(eq(professionalServiceAreas.serviceTypeId, lead.serviceTypeId));

  const coveringRows = areaRows.filter(
    (row) => row.area.regionId === null || row.area.regionId === lead.regionId,
  );

  // Un mismo profesional puede tener varias filas de área que cubran el lead (p. ej. varias regiones); nos quedamos con una por profesional.
  const byProfessional = new Map<string, (typeof coveringRows)[number]>();
  for (const row of coveringRows) {
    if (!byProfessional.has(row.professional.id)) byProfessional.set(row.professional.id, row);
  }

  const excludedIds = new Set(
    (
      await db
        .select({ professionalId: leadProfessionalExclusions.professionalId })
        .from(leadProfessionalExclusions)
        .where(eq(leadProfessionalExclusions.leadId, leadId))
    ).map((r) => r.professionalId),
  );

  const now = new Date();
  const eligible: EligibilityCandidate[] = [];
  const discarded: EligibilityResult["discarded"] = [];

  for (const { professional: p } of byProfessional.values()) {
    if (!p.isActive) {
      discarded.push({ professionalId: p.id, name: p.name, reason: "inactivo" });
      continue;
    }
    if (p.verificationStatus !== "verificado") {
      discarded.push({ professionalId: p.id, name: p.name, reason: "no verificado" });
      continue;
    }
    if (p.pausedUntil && p.pausedUntil > now) {
      discarded.push({ professionalId: p.id, name: p.name, reason: `pausado hasta ${p.pausedUntil.toISOString()}` });
      continue;
    }
    if (excludedIds.has(p.id)) {
      discarded.push({ professionalId: p.id, name: p.name, reason: "excluido para este lead" });
      continue;
    }

    const assignedLeads = await db
      .select({ status: leads.status, assignedAt: leads.assignedAt })
      .from(leads)
      .where(eq(leads.assignedProfessionalId, p.id));
    const activeLeads = assignedLeads.filter((l) => !isTerminalStatus(l.status as LeadStatus));

    if (activeLeads.length >= p.maxConcurrentLeads) {
      discarded.push({
        professionalId: p.id,
        name: p.name,
        reason: `sin capacidad (${activeLeads.length}/${p.maxConcurrentLeads} leads activos)`,
      });
      continue;
    }

    const lastAssignedAt = assignedLeads.reduce<Date | null>((latest, l) => {
      if (!l.assignedAt) return latest;
      if (!latest || l.assignedAt > latest) return l.assignedAt;
      return latest;
    }, null);

    eligible.push({
      professionalId: p.id,
      name: p.name,
      currentLoad: activeLeads.length,
      maxConcurrentLeads: p.maxConcurrentLeads,
      lastAssignedAt,
    });
  }

  // Rotación: el que lleva más tiempo sin recibir una asignación va primero (nunca asignados, primero de todos).
  eligible.sort((a, b) => {
    if (!a.lastAssignedAt && !b.lastAssignedAt) return 0;
    if (!a.lastAssignedAt) return -1;
    if (!b.lastAssignedAt) return 1;
    return a.lastAssignedAt.getTime() - b.lastAssignedAt.getTime();
  });

  return { eligible, discarded };
}

export interface AssignLeadResult {
  assigned: boolean;
  professionalId?: string;
  eligibleCount: number;
  discarded?: EligibilityResult["discarded"];
}

/**
 * Asigna el lead al primer candidato elegible (rotación por antigüedad de
 * última asignación). Usa un bloqueo advisory de Postgres con clave
 * derivada del `leadId` para que dos llamadas concurrentes (un admin y el
 * cron a la vez, por ejemplo) nunca asignen el mismo lead dos veces.
 */
export async function assignLead(leadId: string): Promise<AssignLeadResult> {
  const result = await db.transaction(async (tx) => {
    // hashtextextended da un bigint estable a partir del uuid, válido como clave de pg_advisory_xact_lock.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${leadId}, 0))`);

    const [lead] = await tx.select().from(leads).where(eq(leads.id, leadId)).for("update");
    if (!lead || lead.assignedProfessionalId) {
      return { assigned: false, eligibleCount: 0 } satisfies AssignLeadResult;
    }

    const { eligible, discarded } = await evaluateEligibility(leadId);
    if (eligible.length === 0) {
      return { assigned: false, eligibleCount: 0, discarded } satisfies AssignLeadResult;
    }

    const chosen = eligible[0];
    const now = new Date();

    await tx
      .update(leads)
      .set({ assignedProfessionalId: chosen.professionalId, assignedAt: now })
      .where(eq(leads.id, leadId));

    return {
      assigned: true,
      professionalId: chosen.professionalId,
      eligibleCount: eligible.length,
      discarded,
    } satisfies AssignLeadResult;
  });

  if (!result.assigned || !result.professionalId) {
    return result;
  }

  await transitionLead({
    leadId,
    toStatus: "asignado",
    actorType: "sistema",
    reason: "Asignación automática por rotación",
    metadata: { eligibleCount: result.eligibleCount, discarded: result.discarded },
  });

  await notifyProfessionalOfAssignment(leadId, result.professionalId);
  return result;
}

async function notifyProfessionalOfAssignment(leadId: string, professionalId: string): Promise<void> {
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  const [professional] = await db.select().from(professionals).where(eq(professionals.id, professionalId)).limit(1);
  if (!lead || !professional) return;

  const now = new Date();
  const contactDeadline = computeContactDeadline(now);

  await transitionLead({
    leadId,
    toStatus: "notificado",
    actorType: "sistema",
    extraFields: { notifiedAt: now, contactDeadlineAt: contactDeadline },
  });

  await sendNotification({
    templateKey: "lead_asignado",
    channel: "email",
    recipient: professional.email,
    context: { professionalName: professional.name, leadDescription: lead.description ?? undefined, deadline: contactDeadline },
    leadId,
    professionalId,
  });
}

/** Profesionales con cobertura de (servicio, región), sin filtrar por elegibilidad — usado por el selector manual de /admin. */
export async function listCoveringProfessionals(serviceTypeId: string, regionId: string | null) {
  const rows = await db
    .select({ professional: professionals, area: professionalServiceAreas })
    .from(professionalServiceAreas)
    .innerJoin(professionals, eq(professionalServiceAreas.professionalId, professionals.id))
    .where(eq(professionalServiceAreas.serviceTypeId, serviceTypeId));
  return rows.filter((r) => r.area.regionId === null || r.area.regionId === regionId).map((r) => r.professional);
}
