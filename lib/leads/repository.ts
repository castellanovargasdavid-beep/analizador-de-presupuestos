/**
 * Capa de datos de leads. `professionals` empieza vacía y sigue vacía
 * hasta que exista una red real verificada — `findMatchingProfessionals`
 * devuelve honestamente un array vacío hoy, nunca un resultado inventado.
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { estimates, leads, professionalServiceAreas, professionals } from "@/db/schema";
import { LEAD_CONSENT_VERSION, type LeadFormValues } from "./validation";

export interface CreateLeadArgs {
  estimateId: string;
  comparisonId?: string | null;
  form: LeadFormValues;
  entryPath?: string | null;
}

export async function createLead(args: CreateLeadArgs): Promise<{ leadId: string; matchedProfessionals: number }> {
  const [estimate] = await db.select().from(estimates).where(eq(estimates.id, args.estimateId)).limit(1);
  if (!estimate) {
    throw new Error("No se encuentra la estimación asociada a esta solicitud.");
  }

  const matches = await findMatchingProfessionals(estimate.serviceTypeId, estimate.regionId);

  const [lead] = await db
    .insert(leads)
    .values({
      estimateId: args.estimateId,
      comparisonId: args.comparisonId ?? null,
      serviceTypeId: estimate.serviceTypeId,
      regionId: estimate.regionId,
      contactName: args.form.contactName,
      contactEmail: args.form.contactEmail,
      contactPhone: args.form.contactPhone ?? null,
      description: args.form.description ?? null,
      desiredTimeframe: args.form.desiredTimeframe ?? null,
      purchaseIntent: args.form.purchaseIntent ?? null,
      rangeAcknowledged: args.form.rangeAcknowledged,
      // "sin_cobertura" se asigna automáticamente porque es un hecho verificable ya
      // (no hay ningún profesional verificado para este servicio/zona); el resto del
      // ciclo de vida (validar, descartar, asignar...) es siempre una decisión humana.
      status: matches.length > 0 ? "nuevo" : "sin_cobertura",
      consentVersion: LEAD_CONSENT_VERSION,
      consentAcceptedAt: new Date(),
      entryPath: args.entryPath ?? null,
    })
    .returning();

  return { leadId: lead.id, matchedProfessionals: matches.length };
}

/**
 * Profesionales verificados y activos para un servicio y región dados.
 * `regionId` null en `professional_service_areas` significa "toda España".
 * Sin red real todavía, esto devuelve `[]` — nunca se simula un match.
 */
export async function findMatchingProfessionals(serviceTypeId: string, regionId: string | null) {
  const rows = await db
    .select({ professional: professionals, area: professionalServiceAreas })
    .from(professionalServiceAreas)
    .innerJoin(professionals, eq(professionalServiceAreas.professionalId, professionals.id))
    .where(
      and(
        eq(professionalServiceAreas.serviceTypeId, serviceTypeId),
        eq(professionals.verificationStatus, "verificado"),
        eq(professionals.isActive, true),
      ),
    );

  return rows.filter((row) => row.area.regionId === null || row.area.regionId === regionId);
}
