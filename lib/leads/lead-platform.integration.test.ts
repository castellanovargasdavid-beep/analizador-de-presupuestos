/**
 * Test de integración contra Postgres real para el sistema de leads
 * automatizado (ciclo de vida, asignación, reasignación, notificaciones).
 * Se salta si no hay DATABASE_URL. Usa una categoría/servicio de prueba
 * dedicados (nunca los reales del catálogo) para no interferir con otros
 * tests de integración que corren contra el mismo Postgres, y limpia todo
 * lo creado (leads y profesionales) después de cada `it` — la elegibilidad
 * se calcula sobre TODOS los profesionales con cobertura de un servicio, así
 * que dejar datos de un test para el siguiente falsearía los resultados.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  leadProfessionalExclusions,
  leadQuotes,
  leadStatusHistory,
  leads,
  notifications,
  professionalServiceAreas,
  professionals,
  serviceCategories,
  serviceTypes,
} from "@/db/schema";
import { LEAD_CONSENT_VERSION } from "./validation";
import { InvalidLeadTransitionError } from "./state-machine";
import { transitionLead, recordLeadNote, getLeadHistory, LeadNotFoundError } from "./lifecycle-service";
import { assignLead, evaluateEligibility } from "./assignment-service";
import { reassignLead, processDeadlines } from "./reassignment-service";
import { processNewLead } from "./intake-service";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("plataforma de leads (integración: ciclo de vida, asignación, reasignación)", () => {
  let categoryId: string;
  let serviceTypeId: string;

  beforeAll(async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const [category] = await db
      .insert(serviceCategories)
      .values({ slug: `test-cat-${suffix}`, name: "Categoría de test (integración)" })
      .returning();
    categoryId = category.id;
    const [serviceType] = await db
      .insert(serviceTypes)
      .values({ categoryId, slug: `test-servicio-${suffix}`, name: "Servicio de test", availabilityStatus: "disponible" })
      .returning();
    serviceTypeId = serviceType.id;
  });

  /** Borra todo lo creado bajo `serviceTypeId` en este test — aísla cada `it` del resto. */
  async function resetSandbox() {
    const leadRows = await db.select({ id: leads.id }).from(leads).where(eq(leads.serviceTypeId, serviceTypeId));
    for (const { id } of leadRows) {
      await db.delete(leadQuotes).where(eq(leadQuotes.leadId, id));
      await db.delete(leadStatusHistory).where(eq(leadStatusHistory.leadId, id));
      await db.delete(leadProfessionalExclusions).where(eq(leadProfessionalExclusions.leadId, id));
      await db.delete(notifications).where(eq(notifications.leadId, id));
    }
    await db.delete(leads).where(eq(leads.serviceTypeId, serviceTypeId));

    const areaRows = await db
      .select({ professionalId: professionalServiceAreas.professionalId })
      .from(professionalServiceAreas)
      .where(eq(professionalServiceAreas.serviceTypeId, serviceTypeId));
    await db.delete(professionalServiceAreas).where(eq(professionalServiceAreas.serviceTypeId, serviceTypeId));
    for (const { professionalId } of areaRows) {
      await db.delete(notifications).where(eq(notifications.professionalId, professionalId));
      await db.delete(professionals).where(eq(professionals.id, professionalId));
    }
  }

  afterEach(resetSandbox);

  afterAll(async () => {
    await resetSandbox();
    await db.delete(serviceTypes).where(eq(serviceTypes.id, serviceTypeId));
    await db.delete(serviceCategories).where(eq(serviceCategories.id, categoryId));
  });

  async function makeProfessional(overrides: Partial<typeof professionals.$inferInsert> = {}) {
    const [p] = await db
      .insert(professionals)
      .values({
        name: "Profesional Test",
        email: `pro-${Math.random().toString(36).slice(2)}@test.local`,
        verificationStatus: "verificado",
        isActive: true,
        maxConcurrentLeads: 5,
        ...overrides,
      })
      .returning();
    await db.insert(professionalServiceAreas).values({ professionalId: p.id, serviceTypeId, regionId: null });
    return p;
  }

  async function makeLead(overrides: Partial<typeof leads.$inferInsert> = {}) {
    const [lead] = await db
      .insert(leads)
      .values({
        serviceTypeId,
        regionId: null,
        contactName: "Usuario Test",
        contactEmail: `user-${Math.random().toString(36).slice(2)}@test.local`,
        consentVersion: LEAD_CONSENT_VERSION,
        consentAcceptedAt: new Date(),
        status: "nuevo",
        ...overrides,
      })
      .returning();
    return lead;
  }

  /** `assignLead` solo es válido sobre un lead ya validado (contrato real: intake-service/reassignLead siempre validan antes). */
  async function makeValidatedLead(overrides: Partial<typeof leads.$inferInsert> = {}) {
    const lead = await makeLead(overrides);
    await transitionLead({ leadId: lead.id, toStatus: "validado", actorType: "sistema" });
    return lead;
  }

  describe("lifecycle-service", () => {
    it("registra cada transición en el historial de auditoría", async () => {
      const lead = await makeLead();
      await transitionLead({ leadId: lead.id, toStatus: "validado", actorType: "sistema", reason: "test" });

      const history = await getLeadHistory(lead.id);
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({ fromStatus: "nuevo", toStatus: "validado", actorType: "sistema", reason: "test" });

      const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      expect(updated.status).toBe("validado");
    });

    it("rechaza una transición no permitida por el grafo de estados", async () => {
      const lead = await makeLead();
      await expect(
        transitionLead({ leadId: lead.id, toStatus: "ganado", actorType: "sistema" }),
      ).rejects.toThrow(InvalidLeadTransitionError);
    });

    it("un admin puede forzar una transición inválida, y queda marcada como forzada en el historial", async () => {
      const lead = await makeLead();
      await transitionLead({ leadId: lead.id, toStatus: "ganado", actorType: "admin", reason: "corrección manual", force: true });

      const history = await getLeadHistory(lead.id);
      expect(history[0].metadata).toMatchObject({ forced: true });
    });

    it("el sistema y el profesional NUNCA pueden forzar una transición inválida, solo el admin", async () => {
      const lead = await makeLead();
      await expect(
        transitionLead({ leadId: lead.id, toStatus: "ganado", actorType: "sistema", force: true }),
      ).rejects.toThrow(InvalidLeadTransitionError);
      await expect(
        transitionLead({ leadId: lead.id, toStatus: "ganado", actorType: "profesional", force: true }),
      ).rejects.toThrow(InvalidLeadTransitionError);
    });

    it("recordLeadNote deja constancia sin cambiar de estado", async () => {
      const lead = await makeLead();
      await recordLeadNote({ leadId: lead.id, actorType: "admin", reason: "nota operativa" });

      const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      expect(updated.status).toBe("nuevo");

      const history = await getLeadHistory(lead.id);
      expect(history[0]).toMatchObject({ fromStatus: "nuevo", toStatus: "nuevo", reason: "nota operativa" });
    });

    it("lanza LeadNotFoundError sobre un id inexistente", async () => {
      await expect(
        transitionLead({ leadId: "00000000-0000-0000-0000-000000000000", toStatus: "validado", actorType: "sistema" }),
      ).rejects.toThrow(LeadNotFoundError);
    });
  });

  describe("assignment-service: elegibilidad", () => {
    it("descarta profesionales inactivos, no verificados y pausados; nunca inventa una asignación", async () => {
      const lead = await makeLead();
      const inactivo = await makeProfessional({ isActive: false });
      const pendiente = await makeProfessional({ verificationStatus: "pendiente" });
      const pausado = await makeProfessional({ pausedUntil: new Date(Date.now() + 60 * 60 * 1000) });

      const { eligible, discarded } = await evaluateEligibility(lead.id);
      expect(eligible).toHaveLength(0);

      const reasons = Object.fromEntries(discarded.map((d) => [d.professionalId, d.reason]));
      expect(reasons[inactivo.id]).toBe("inactivo");
      expect(reasons[pendiente.id]).toBe("no verificado");
      expect(reasons[pausado.id]).toMatch(/^pausado/);
    });

    it("descarta a un profesional manualmente excluido para ese lead concreto", async () => {
      const lead = await makeLead();
      const excluido = await makeProfessional();
      await db.insert(leadProfessionalExclusions).values({ leadId: lead.id, professionalId: excluido.id, reason: "test" });

      const { eligible, discarded } = await evaluateEligibility(lead.id);
      expect(eligible).toHaveLength(0);
      expect(discarded[0]).toMatchObject({ professionalId: excluido.id, reason: "excluido para este lead" });
    });

    it("descarta a un profesional sin capacidad disponible", async () => {
      const lleno = await makeProfessional({ maxConcurrentLeads: 1 });
      await makeLead({ assignedProfessionalId: lleno.id, assignedAt: new Date(), status: "asignado" });

      const nuevoLead = await makeLead();
      const { eligible, discarded } = await evaluateEligibility(nuevoLead.id);
      expect(eligible).toHaveLength(0);
      expect(discarded[0].reason).toMatch(/sin capacidad/);
    });

    it("un lead activo cuenta para la capacidad, pero uno cerrado (terminal) no", async () => {
      const pro = await makeProfessional({ maxConcurrentLeads: 1 });
      await makeLead({ assignedProfessionalId: pro.id, assignedAt: new Date(), status: "cerrado" });

      const nuevoLead = await makeLead();
      const { eligible } = await evaluateEligibility(nuevoLead.id);
      expect(eligible.map((c) => c.professionalId)).toContain(pro.id);
    });
  });

  describe("assignment-service: asignación y bloqueo transaccional", () => {
    it("asigna al profesional elegible y avanza a 'notificado' con plazo de contacto calculado", async () => {
      const lead = await makeValidatedLead();
      const pro = await makeProfessional();

      const result = await assignLead(lead.id);
      expect(result.assigned).toBe(true);
      expect(result.professionalId).toBe(pro.id);

      const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      expect(updated.status).toBe("notificado");
      expect(updated.assignedProfessionalId).toBe(pro.id);
      expect(updated.contactDeadlineAt).not.toBeNull();
      expect(updated.notifiedAt).not.toBeNull();
    });

    it("rotación: prioriza al profesional que nunca ha recibido un lead frente a uno ya asignado antes", async () => {
      const yaAsignado = await makeProfessional();
      const nuncaAsignado = await makeProfessional();
      // Le damos a `yaAsignado` una asignación previa (assignedAt en el pasado).
      await makeLead({ assignedProfessionalId: yaAsignado.id, assignedAt: new Date(Date.now() - 60 * 60 * 1000), status: "cerrado" });

      const lead = await makeValidatedLead();
      const result = await assignLead(lead.id);
      expect(result.professionalId).toBe(nuncaAsignado.id);
    });

    it("nunca asigna el mismo lead a dos profesionales a la vez (bloqueo advisory concurrente)", async () => {
      const lead = await makeValidatedLead();
      await makeProfessional();
      await makeProfessional();

      const [r1, r2] = await Promise.all([assignLead(lead.id), assignLead(lead.id)]);
      const assignedCount = [r1, r2].filter((r) => r.assigned).length;
      expect(assignedCount).toBe(1);

      const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      expect(updated.assignedProfessionalId).not.toBeNull();
    });

    it("sin ningún profesional elegible, no asigna nada (nunca fuerza un match falso)", async () => {
      const lead = await makeValidatedLead();
      const result = await assignLead(lead.id);
      expect(result.assigned).toBe(false);

      const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      expect(updated.assignedProfessionalId).toBeNull();
      expect(updated.status).toBe("validado"); // assignLead no cambia el estado si no asigna
    });

    it("la notificación de asignación queda registrada como 'simulado', nunca como 'enviado', sin proveedor real", async () => {
      const lead = await makeValidatedLead();
      const pro = await makeProfessional();
      await assignLead(lead.id);

      const [notification] = await db.select().from(notifications).where(eq(notifications.leadId, lead.id)).limit(1);
      expect(notification).toBeDefined();
      expect(notification.professionalId).toBe(pro.id);
      expect(notification.status).toBe("simulado");
      expect(notification.sentAt).toBeNull();
    });
  });

  describe("reassignment-service", () => {
    it("reasignLead excluye al profesional anterior y lo notifica, y asigna a otro elegible si existe", async () => {
      const lead = await makeValidatedLead();
      const original = await makeProfessional();
      const suplente = await makeProfessional();
      await assignLead(lead.id); // se asigna a uno de los dos por rotación
      const [afterFirstAssign] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      const originalAssignedId = afterFirstAssign.assignedProfessionalId!;

      await reassignLead(lead.id, "Motivo de prueba de reasignación");

      const [exclusion] = await db
        .select()
        .from(leadProfessionalExclusions)
        .where(eq(leadProfessionalExclusions.leadId, lead.id))
        .limit(1);
      expect(exclusion.professionalId).toBe(originalAssignedId);

      const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      expect(updated.reassignmentCount).toBe(1);
      expect(updated.assignedProfessionalId).not.toBe(originalAssignedId);
      const otherProfessional = originalAssignedId === original.id ? suplente.id : original.id;
      expect(updated.assignedProfessionalId).toBe(otherProfessional);
    });

    it("si no queda ningún profesional elegible tras excluir al actual, el lead queda honestamente 'sin_cobertura'", async () => {
      const lead = await makeValidatedLead();
      await makeProfessional();
      await assignLead(lead.id);

      await reassignLead(lead.id, "Único profesional, sin alternativa");

      const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      expect(updated.status).toBe("sin_cobertura");
      expect(updated.assignedProfessionalId).toBeNull();
    });

    it("processDeadlines reasigna un contacto vencido más allá del periodo de gracia", async () => {
      const lead = await makeValidatedLead();
      await makeProfessional();
      await makeProfessional();
      await assignLead(lead.id);
      const [beforeExpiry] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      const originalAssignedId = beforeExpiry.assignedProfessionalId;

      // Forzamos manualmente un plazo de contacto muy vencido, como si el cron llevara horas sin ejecutarse.
      await db
        .update(leads)
        .set({ contactDeadlineAt: new Date(Date.now() - 24 * 60 * 60 * 1000) })
        .where(eq(leads.id, lead.id));

      const summary = await processDeadlines();
      expect(summary.contactReassignments).toBeGreaterThanOrEqual(1);

      const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      expect(updated.reassignmentCount).toBeGreaterThanOrEqual(1);
      // Se ha reasignado a otro profesional (el original queda excluido para este lead).
      expect(updated.assignedProfessionalId).not.toBe(originalAssignedId);
    });

    it("no reasigna automáticamente un lead solo porque el usuario no lo haya contratado (sin plazo vencido, no se toca)", async () => {
      const lead = await makeValidatedLead();
      await makeProfessional();
      await assignLead(lead.id);
      // Simulamos que el profesional ya contactó y confirmó, y el usuario simplemente no ha respondido — sin plazo pendiente.
      await transitionLead({ leadId: lead.id, toStatus: "aceptado", actorType: "profesional", reason: "aceptado" });
      await transitionLead({ leadId: lead.id, toStatus: "contacto_pendiente", actorType: "profesional" });
      await transitionLead({
        leadId: lead.id,
        toStatus: "contacto_confirmado",
        actorType: "profesional",
        extraFields: { contactConfirmedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      });

      await processDeadlines();

      const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      expect(updated.status).toBe("contacto_confirmado");
      expect(updated.reassignmentCount).toBe(0);
    });
  });

  describe("intake-service (processNewLead)", () => {
    it("detecta un posible duplicado (mismo email y servicio en 24h) sin bloquear la creación", async () => {
      const email = `dup-${Math.random().toString(36).slice(2)}@test.local`;
      const first = await makeLead({ contactEmail: email });
      await processNewLead(first.id);

      const second = await makeLead({ contactEmail: email });
      await processNewLead(second.id);

      const [updatedSecond] = await db.select().from(leads).where(eq(leads.id, second.id)).limit(1);
      expect(updatedSecond.duplicateOfLeadId).toBe(first.id);
    });

    it("valida y asigna automáticamente cuando hay un profesional elegible", async () => {
      const pro = await makeProfessional();
      const lead = await makeLead();
      await processNewLead(lead.id);

      const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      expect(updated.assignedProfessionalId).toBe(pro.id);
      expect(updated.status).toBe("notificado");
    });

    it("sin profesionales elegibles, el lead queda honestamente en 'sin_cobertura' (nunca se inventa una asignación)", async () => {
      const lead = await makeLead();
      await processNewLead(lead.id);

      const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
      expect(updated.status).toBe("sin_cobertura");
      expect(updated.assignedProfessionalId).toBeNull();
    });
  });
});
