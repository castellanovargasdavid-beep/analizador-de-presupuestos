/**
 * Test de integración: comprobaciones de propiedad (ownership) del portal
 * de profesional. Un profesional NUNCA debe poder actuar sobre un lead que
 * no tiene asignado — es la defensa principal contra manipulación de ids
 * desde el cliente (ver AGENTS/mission: "protección contra... acceso a
 * datos de otro usuario"). Se mockea `getCurrentProfessionalId` (identidad
 * de sesión) y `revalidatePath` (solo funciona dentro de una request real
 * de Next.js) para poder invocar las Server Actions directamente aquí.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./actions", () => ({ getCurrentProfessionalId: vi.fn() }));

const { getCurrentProfessionalId } = await import("./actions");
const { acceptLeadAction, rejectLeadAction, submitQuoteAction } = await import("./lead-actions");

import { db } from "@/db/client";
import { leadQuotes, leadStatusHistory, leads, professionalServiceAreas, professionals, serviceCategories, serviceTypes } from "@/db/schema";
import { LEAD_CONSENT_VERSION } from "@/lib/leads/validation";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const mockedGetCurrentProfessionalId = vi.mocked(getCurrentProfessionalId);

describe.skipIf(!hasDatabase)("portal de profesional: comprobación de propiedad (integración)", () => {
  let categoryId: string;
  let serviceTypeId: string;

  beforeAll(async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const [category] = await db
      .insert(serviceCategories)
      .values({ slug: `test-own-cat-${suffix}`, name: "Categoría de test (ownership)" })
      .returning();
    categoryId = category.id;
    const [serviceType] = await db
      .insert(serviceTypes)
      .values({ categoryId, slug: `test-own-servicio-${suffix}`, name: "Servicio de test", availabilityStatus: "disponible" })
      .returning();
    serviceTypeId = serviceType.id;
  });

  async function resetSandbox() {
    const leadRows = await db.select({ id: leads.id }).from(leads).where(eq(leads.serviceTypeId, serviceTypeId));
    for (const { id } of leadRows) {
      await db.delete(leadQuotes).where(eq(leadQuotes.leadId, id));
      await db.delete(leadStatusHistory).where(eq(leadStatusHistory.leadId, id));
    }
    await db.delete(leads).where(eq(leads.serviceTypeId, serviceTypeId));
    await db.delete(professionalServiceAreas).where(eq(professionalServiceAreas.serviceTypeId, serviceTypeId));
    await db.delete(professionals).where(eq(professionals.email, "own-a@test.local"));
    await db.delete(professionals).where(eq(professionals.email, "own-b@test.local"));
  }

  afterEach(resetSandbox);

  afterAll(async () => {
    await resetSandbox();
    await db.delete(serviceTypes).where(eq(serviceTypes.id, serviceTypeId));
    await db.delete(serviceCategories).where(eq(serviceCategories.id, categoryId));
  });

  async function makeLead(overrides: Partial<typeof leads.$inferInsert> = {}) {
    const [lead] = await db
      .insert(leads)
      .values({
        serviceTypeId,
        contactName: "Usuario Test",
        contactEmail: `user-${Math.random().toString(36).slice(2)}@test.local`,
        consentVersion: LEAD_CONSENT_VERSION,
        consentAcceptedAt: new Date(),
        status: "notificado",
        ...overrides,
      })
      .returning();
    return lead;
  }

  it("un profesional no puede aceptar un lead que no tiene asignado", async () => {
    const proA = (await db.insert(professionals).values({ name: "A", email: "own-a@test.local", verificationStatus: "verificado", isActive: true }).returning())[0];
    const proB = (await db.insert(professionals).values({ name: "B", email: "own-b@test.local", verificationStatus: "verificado", isActive: true }).returning())[0];
    const lead = await makeLead({ assignedProfessionalId: proA.id });

    mockedGetCurrentProfessionalId.mockResolvedValue(proB.id);
    const result = await acceptLeadAction(lead.id);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no está asignada a tu cuenta/i);

    const [unchanged] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
    expect(unchanged.status).toBe("notificado");
  });

  it("el profesional propietario sí puede aceptar su propio lead", async () => {
    const proA = (await db.insert(professionals).values({ name: "A", email: "own-a@test.local", verificationStatus: "verificado", isActive: true }).returning())[0];
    const lead = await makeLead({ assignedProfessionalId: proA.id });

    mockedGetCurrentProfessionalId.mockResolvedValue(proA.id);
    const result = await acceptLeadAction(lead.id);

    expect(result.ok).toBe(true);
    const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
    expect(updated.status).toBe("contacto_pendiente");
  });

  it("sin sesión válida, cualquier acción se rechaza sin tocar el lead", async () => {
    const proA = (await db.insert(professionals).values({ name: "A", email: "own-a@test.local", verificationStatus: "verificado", isActive: true }).returning())[0];
    const lead = await makeLead({ assignedProfessionalId: proA.id });

    mockedGetCurrentProfessionalId.mockResolvedValue(null);
    const result = await acceptLeadAction(lead.id);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/sesión/i);
  });

  it("rechazar un lead ajeno tampoco funciona (no filtra el motivo antes de comprobar propiedad)", async () => {
    const proA = (await db.insert(professionals).values({ name: "A", email: "own-a@test.local", verificationStatus: "verificado", isActive: true }).returning())[0];
    const proB = (await db.insert(professionals).values({ name: "B", email: "own-b@test.local", verificationStatus: "verificado", isActive: true }).returning())[0];
    const lead = await makeLead({ assignedProfessionalId: proA.id });

    mockedGetCurrentProfessionalId.mockResolvedValue(proB.id);
    const formData = new FormData();
    formData.set("reason", "intento no autorizado");
    const result = await rejectLeadAction(lead.id, formData);

    expect(result.ok).toBe(false);
    const [unchanged] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
    expect(unchanged.status).toBe("notificado");
  });

  it("no se puede enviar un presupuesto para un lead ajeno, y no se inserta ninguna fila en lead_quotes", async () => {
    const proA = (await db.insert(professionals).values({ name: "A", email: "own-a@test.local", verificationStatus: "verificado", isActive: true }).returning())[0];
    const proB = (await db.insert(professionals).values({ name: "B", email: "own-b@test.local", verificationStatus: "verificado", isActive: true }).returning())[0];
    const lead = await makeLead({ assignedProfessionalId: proA.id, status: "presupuesto_pendiente" });

    mockedGetCurrentProfessionalId.mockResolvedValue(proB.id);
    const formData = new FormData();
    formData.set("amount", "500");
    const result = await submitQuoteAction(lead.id, formData);

    expect(result.ok).toBe(false);
    const quotes = await db.select().from(leadQuotes).where(eq(leadQuotes.leadId, lead.id));
    expect(quotes).toHaveLength(0);
  });
});
