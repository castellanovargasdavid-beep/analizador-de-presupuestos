/**
 * Test de integración contra Postgres real. Se salta si no hay
 * DATABASE_URL. Crea sus propios profesionales de prueba y los borra al
 * terminar: `professionals` debe quedar vacía entre ejecuciones porque el
 * resto del sistema (y el propio texto de /fuentes, /metodologia) asume
 * honestamente que la red de profesionales verificados no existe todavía.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { professionalServiceAreas, professionals, regions } from "@/db/schema";
import { loadPricingContext } from "@/lib/estimation/repository";
import { findMatchingProfessionals } from "./repository";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("findMatchingProfessionals (integración con Postgres real)", () => {
  let serviceTypeId: string;
  let madridRegionId: string | null;
  const createdProfessionalIds: string[] = [];

  beforeAll(async () => {
    const context = await loadPricingContext("aire-acondicionado", "instalacion");
    serviceTypeId = context.serviceTypeId;
    const [madrid] = await db.select().from(regions).where(eq(regions.slug, "comunidad-de-madrid")).limit(1);
    madridRegionId = madrid?.id ?? null;
  });

  afterAll(async () => {
    for (const id of createdProfessionalIds) {
      await db.delete(professionalServiceAreas).where(eq(professionalServiceAreas.professionalId, id));
      await db.delete(professionals).where(eq(professionals.id, id));
    }
  });

  it("devuelve un array vacío cuando no hay ningún profesional verificado (estado real hoy)", async () => {
    const matches = await findMatchingProfessionals(serviceTypeId, madridRegionId);
    expect(matches).toEqual([]);
  });

  it("no devuelve profesionales pendientes de verificar ni inactivos", async () => {
    const [pendiente] = await db
      .insert(professionals)
      .values({ name: "Pendiente Test", email: "pendiente@test.local", verificationStatus: "pendiente", isActive: true })
      .returning();
    const [inactivo] = await db
      .insert(professionals)
      .values({ name: "Inactivo Test", email: "inactivo@test.local", verificationStatus: "verificado", isActive: false })
      .returning();
    createdProfessionalIds.push(pendiente.id, inactivo.id);
    await db.insert(professionalServiceAreas).values([
      { professionalId: pendiente.id, serviceTypeId, regionId: madridRegionId },
      { professionalId: inactivo.id, serviceTypeId, regionId: madridRegionId },
    ]);

    const matches = await findMatchingProfessionals(serviceTypeId, madridRegionId);
    expect(matches).toEqual([]);
  });

  it("encuentra un profesional verificado y activo con cobertura en la región", async () => {
    const [verificado] = await db
      .insert(professionals)
      .values({ name: "Verificado Test", email: "verificado@test.local", verificationStatus: "verificado", isActive: true })
      .returning();
    createdProfessionalIds.push(verificado.id);
    await db.insert(professionalServiceAreas).values({ professionalId: verificado.id, serviceTypeId, regionId: madridRegionId });

    const matches = await findMatchingProfessionals(serviceTypeId, madridRegionId);
    expect(matches.some((m) => m.professional.id === verificado.id)).toBe(true);
  });

  it("un profesional con cobertura 'toda España' (region null) también hace match en cualquier región", async () => {
    const [nacional] = await db
      .insert(professionals)
      .values({ name: "Nacional Test", email: "nacional@test.local", verificationStatus: "verificado", isActive: true })
      .returning();
    createdProfessionalIds.push(nacional.id);
    await db.insert(professionalServiceAreas).values({ professionalId: nacional.id, serviceTypeId, regionId: null });

    const matches = await findMatchingProfessionals(serviceTypeId, madridRegionId);
    expect(matches.some((m) => m.professional.id === nacional.id)).toBe(true);
  });
});
