/**
 * Test de integración end-to-end de `calculateGenericEstimateAction` para
 * los 11 servicios con calculadora genérica, contra Postgres real (igual
 * convención que el resto de *.integration.test.ts: se salta si no hay
 * DATABASE_URL). No borramos las filas creadas por las mismas razones que
 * en `repository.integration.test.ts`: son datos de prueba anónimos y de
 * bajo volumen, y el objetivo es verificar el cableado real, no dejar la
 * base impoluta.
 *
 * Incluye una aserción de regresión permanente para el bug de IVA/groupKey
 * ya corregido (ver docs): "instalar-un-termo" e "instalar-un-armario-a-medida"
 * son servicios dominados por el equipo/mueble (como aire acondicionado) y
 * deben tributar SIEMPRE al tipo general (21%), nunca al reducido, aunque el
 * cliente cumpla el resto de requisitos legales — porque los materiales
 * superan el 40% de la base imponible. El resto de servicios de esta tanda
 * son de mano de obra dominante y sí deben ser elegibles al 10% reducido
 * cuando el cliente es persona física, uso particular y vivienda >2 años.
 */
import { describe, expect, it } from "vitest";
import { calculateGenericEstimateAction } from "./actions";
import { getEstimateForDisplay } from "@/lib/estimation/repository";
import type { GenericCalculatorFormValues } from "./validation";

const hasDatabase = Boolean(process.env.DATABASE_URL);

const elegible = { clientePersonaFisicaUsoParticular: true, viviendaMasDeDosAnos: true, regionSlug: null };

interface Case {
  name: string;
  form: GenericCalculatorFormValues;
  expectedVatScenario: "general" | "reducido_vivienda_particular";
}

const CASES: Case[] = [
  {
    name: "cambiar-un-grifo",
    form: {
      categorySlug: "instalaciones",
      serviceSlug: "cambiar-un-grifo",
      selections: { tipoGrifo: "fregadero_lavabo" },
      quantities: {},
      flags: { requiereAdaptacion: false },
      ...elegible,
    },
    expectedVatScenario: "reducido_vivienda_particular",
  },
  {
    name: "cambiar-una-cerradura",
    form: {
      categorySlug: "exterior-y-mantenimiento",
      serviceSlug: "cambiar-una-cerradura",
      selections: { nivelSeguridad: "seguridad" },
      quantities: {},
      flags: { urgente: false },
      ...elegible,
    },
    expectedVatScenario: "reducido_vivienda_particular",
  },
  {
    name: "pintar-una-habitacion",
    form: {
      categorySlug: "reformas",
      serviceSlug: "pintar-una-habitacion",
      selections: {},
      quantities: { m2: 12 },
      flags: { quitarGotele: false },
      ...elegible,
    },
    expectedVatScenario: "reducido_vivienda_particular",
  },
  {
    name: "pintar-una-vivienda",
    form: {
      categorySlug: "reformas",
      serviceSlug: "pintar-una-vivienda",
      selections: {},
      quantities: { m2: 80 },
      flags: { requierePreparacionPrevia: false },
      ...elegible,
    },
    expectedVatScenario: "reducido_vivienda_particular",
  },
  {
    name: "anadir-enchufes",
    form: {
      categorySlug: "instalaciones",
      serviceSlug: "anadir-enchufes",
      selections: { tipoInstalacion: "mecanismo_simple" },
      quantities: { numEnchufes: 2 },
      flags: {},
      ...elegible,
    },
    expectedVatScenario: "reducido_vivienda_particular",
  },
  {
    name: "instalar-puntos-de-luz",
    form: {
      categorySlug: "instalaciones",
      serviceSlug: "instalar-puntos-de-luz",
      selections: { tipoInstalacion: "simple" },
      quantities: { numPuntos: 2 },
      flags: {},
      ...elegible,
    },
    expectedVatScenario: "reducido_vivienda_particular",
  },
  {
    name: "instalar-un-termo",
    form: {
      categorySlug: "instalaciones",
      serviceSlug: "instalar-un-termo",
      selections: {},
      quantities: {},
      flags: { capacidadGrande: false },
      ...elegible,
    },
    expectedVatScenario: "general",
  },
  {
    name: "reparar-una-fuga",
    form: {
      categorySlug: "instalaciones",
      serviceSlug: "reparar-una-fuga",
      selections: {},
      quantities: {},
      flags: { tuberiaEmpotrada: false, urgente: false },
      ...elegible,
    },
    expectedVatScenario: "reducido_vivienda_particular",
  },
  {
    name: "alicatar-un-bano",
    form: {
      categorySlug: "reformas",
      serviceSlug: "alicatar-un-bano",
      selections: {},
      quantities: { m2: 8 },
      flags: { retirarAlicatadoAntiguo: false },
      ...elegible,
    },
    expectedVatScenario: "reducido_vivienda_particular",
  },
  {
    name: "levantar-un-tabique",
    form: {
      categorySlug: "reformas",
      serviceSlug: "levantar-un-tabique",
      selections: { material: "pladur" },
      quantities: { m2: 10 },
      flags: {},
      ...elegible,
    },
    expectedVatScenario: "reducido_vivienda_particular",
  },
  {
    name: "instalar-un-armario-a-medida",
    form: {
      categorySlug: "exterior-y-mantenimiento",
      serviceSlug: "instalar-un-armario-a-medida",
      selections: { material: "mdf_lacado" },
      quantities: { ml: 2.5 },
      flags: {},
      ...elegible,
    },
    expectedVatScenario: "general",
  },
];

describe.skipIf(!hasDatabase)("calculateGenericEstimateAction (integración con Postgres real, 11 servicios)", () => {
  for (const { name, form, expectedVatScenario } of CASES) {
    it(`${name}: calcula, persiste y aplica el IVA correcto (${expectedVatScenario})`, async () => {
      const result = await calculateGenericEstimateAction(form);

      expect(result.ok, result.error).toBe(true);
      expect(result.data?.estimateId).toBeTruthy();

      const display = await getEstimateForDisplay(result.data!.estimateId);
      expect(display).not.toBeNull();
      expect(display!.items.length).toBeGreaterThan(0);
      expect(display!.ranges.length).toBeGreaterThan(0);
      expect(display!.estimate.vatScenario).toBe(expectedVatScenario);

      // Ningún rango puede ser negativo ni tener min > max.
      for (const range of display!.ranges) {
        expect(Number(range.min)).toBeGreaterThanOrEqual(0);
        expect(Number(range.max)).toBeGreaterThanOrEqual(Number(range.min));
      }
    });
  }

  it("regresión: termo y armario NUNCA son elegibles al IVA reducido aunque el cliente cumpla el resto de requisitos", async () => {
    const termo = await calculateGenericEstimateAction(CASES.find((c) => c.name === "instalar-un-termo")!.form);
    const armario = await calculateGenericEstimateAction(
      CASES.find((c) => c.name === "instalar-un-armario-a-medida")!.form,
    );
    const termoDisplay = await getEstimateForDisplay(termo.data!.estimateId);
    const armarioDisplay = await getEstimateForDisplay(armario.data!.estimateId);
    expect(termoDisplay!.estimate.vatScenario).toBe("general");
    expect(armarioDisplay!.estimate.vatScenario).toBe("general");
  });

  it("todas las estimaciones tienen confianza máxima B (nunca A): ningún factor de esta tanda es 'oficial'", async () => {
    for (const { form } of CASES) {
      const result = await calculateGenericEstimateAction(form);
      const display = await getEstimateForDisplay(result.data!.estimateId);
      // confidenceScore agregado nunca puede alcanzar el máximo teórico de A (1.0)
      // porque no hay ningún factor de confianza A sembrado en estos servicios.
      expect(Number(display!.estimate.confidenceScore)).toBeLessThan(1);
    }
  });
});
