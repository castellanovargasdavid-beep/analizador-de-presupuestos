/**
 * Seed ADITIVO de la ampliación multi-servicio (17 servicios que estaban
 * en `proximamente`): fuentes de precio citadas, tarifas de IVA, reglas de
 * precio + factores para los 11 servicios con calculadora, y "qué
 * incluye/no incluye" para los 18 servicios no-A/C (los 11 con
 * calculadora + los 7 `solo_solicitud`). Solo al final, y solo si todo lo
 * anterior se ha creado con éxito, se cambia `availabilityStatus`.
 *
 * Nunca borra nada (a diferencia de `db/seed.ts`) y es seguro de
 * re-ejecutar: cada inserción comprueba primero si la fila ya existe.
 *
 * Fuentes: docs/09-investigacion-precios-multi-servicio.md — ninguna
 * cifra de aquí se ha inventado; donde la investigación no encontró una
 * fuente de mercado fiable para un matiz concreto (p. ej. el recargo por
 * tubería empotrada en "reparar una fuga"), el factor correspondiente se
 * marca honestamente como confianza C (estimación propia razonable, sin
 * desglose de mercado), nunca como B.
 *
 * Ejecutar con: npx tsx --env-file=.env.local db/seed-multi-service-calculators.ts
 */
import { and, eq } from "drizzle-orm";
import { db } from "./client";
import { dataSources, pricingFactors, pricingRules, serviceCategories, serviceTypes, vatRates } from "./schema";
import type { FactorCondition } from "../lib/estimation/condition-types";

type Confidence = "A" | "B" | "C";
type FactorKind = "base" | "multiplier" | "additive";

async function getServiceType(categorySlug: string, serviceSlug: string) {
  const [row] = await db
    .select({ service: serviceTypes, category: serviceCategories })
    .from(serviceTypes)
    .innerJoin(serviceCategories, eq(serviceTypes.categoryId, serviceCategories.id))
    .where(and(eq(serviceCategories.slug, categorySlug), eq(serviceTypes.slug, serviceSlug)))
    .limit(1);
  if (!row) throw new Error(`No existe el servicio '${categorySlug}/${serviceSlug}' — ¿se ha ejecutado seed-catalog.ts?`);
  return row.service;
}

async function ensureDataSource(args: {
  name: string;
  url: string;
  sourceType: "oficial" | "catalogo_real" | "mercado" | "heuristica_propia";
  confidence: Confidence;
  geographicScope: string;
  notes: string;
}) {
  const [existing] = await db.select().from(dataSources).where(eq(dataSources.name, args.name)).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(dataSources)
    .values({
      name: args.name,
      url: args.url,
      sourceType: args.sourceType,
      confidence: args.confidence,
      geographicScope: args.geographicScope,
      retrievedOn: "2026-09-16",
      notes: args.notes,
    })
    .returning();
  console.log(`  + fuente "${args.name}"`);
  return created;
}

interface FactorDef {
  key: string;
  label: string;
  kind: FactorKind;
  groupKey: string;
  perUnitOfQuantity?: string;
  valueMin: number;
  valueMax: number;
  condition?: FactorCondition;
  sourceId: string | null;
  confidence: Confidence;
  notes?: string;
}

/** Crea la regla de precio v1 (y sus factores) para un servicio, solo si no existe ya ninguna regla para él. */
async function ensurePricingRule(serviceTypeId: string, ruleName: string, factors: FactorDef[]) {
  const [existingRule] = await db.select().from(pricingRules).where(eq(pricingRules.serviceTypeId, serviceTypeId)).limit(1);
  if (existingRule) return existingRule;

  const [rule] = await db
    .insert(pricingRules)
    .values({ serviceTypeId, version: 1, name: ruleName, isActive: true })
    .returning();

  await db.insert(pricingFactors).values(
    factors.map((f, index) => ({
      ruleId: rule.id,
      key: f.key,
      label: f.label,
      kind: f.kind,
      groupKey: f.groupKey,
      perUnitOfQuantity: f.perUnitOfQuantity ?? null,
      valueMin: f.valueMin,
      valueMax: f.valueMax,
      condition: f.condition ?? null,
      sourceId: f.sourceId,
      confidence: f.confidence,
      sortOrder: index,
      notes: f.notes ?? null,
    })),
  );
  console.log(`  + regla de precio "${ruleName}" (${factors.length} factores)`);
  return rule;
}

async function ensureVatRates(serviceTypeId: string, aeatSourceId: string) {
  const existing = await db.select().from(vatRates).where(eq(vatRates.serviceTypeId, serviceTypeId));
  if (existing.length > 0) return;
  await db.insert(vatRates).values([
    {
      serviceTypeId,
      scenario: "reducido_vivienda_particular",
      ratePct: 0.1,
      description:
        "Art. 91.Uno.2.10º Ley 37/1992: destinatario persona física para uso particular, vivienda con más de " +
        "2 años, y materiales aportados por la empresa que no superen el 40% de la base imponible.",
      sourceId: aeatSourceId,
    },
    {
      serviceTypeId,
      scenario: "general",
      ratePct: 0.21,
      description: "Tipo general: se aplica si no se cumple alguno de los requisitos del tipo reducido.",
      sourceId: aeatSourceId,
    },
  ]);
}

async function setServiceCopy(
  serviceTypeId: string,
  whatIncluded: string,
  whatExcluded: string,
  availabilityStatus: "disponible" | "solo_solicitud",
) {
  await db.update(serviceTypes).set({ whatIncluded, whatExcluded, availabilityStatus }).where(eq(serviceTypes.id, serviceTypeId));
}

async function main() {
  console.log("Sembrando ampliación multi-servicio (aditivo)...\n");

  const [aeat] = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.name, "Agencia Tributaria — tipo de IVA en obras de renovación/reparación de vivienda"))
    .limit(1);
  if (!aeat) {
    throw new Error("No existe la fuente AEAT — ejecuta primero db/seed.ts (crea el catálogo base de aire acondicionado).");
  }

  const heuristica = await ensureDataSource({
    name: "Estimación propia — ajuste sin desglose de mercado publicado",
    url: "",
    sourceType: "heuristica_propia",
    confidence: "C",
    geographicScope: "España (extrapolación propia, sin fuente agregada)",
    notes:
      "Usada solo para factores modificadores (recargos por dificultad, urgencia sin cifra propia citada, " +
      "retirada de materiales viejos...) cuando la investigación de mercado no encontró una fuente que desglosara " +
      "esa variable en concreto. Nunca se usa para el precio base de un servicio — ver docs/09-investigacion-precios-multi-servicio.md.",
  });

  const habitissimoGrifo = await ensureDataSource({
    name: "Habitissimo — cambiar grifo",
    url: "https://www.habitissimo.es/presupuestos/cambiar-grifo",
    sourceType: "mercado",
    confidence: "B",
    geographicScope: "España",
    notes: "Agregador de presupuestos reales, sin metodología ni tamaño de muestra publicados.",
  });
  const cronoshareCerrajero = await ensureDataSource({
    name: "Cronoshare — cerrajero",
    url: "https://www.cronoshare.com/cuanto-cuesta/cerrajero",
    sourceType: "mercado",
    confidence: "B",
    geographicScope: "España",
    notes: "Agregador de presupuestos reales, sin metodología ni tamaño de muestra publicados.",
  });
  const cronoisharePintarHabitacion = await ensureDataSource({
    name: "Cronoshare — pintar habitación",
    url: "https://www.cronoshare.com/cuanto-cuesta/pintar-habitacion",
    sourceType: "mercado",
    confidence: "B",
    geographicScope: "España",
    notes: "Agregador de presupuestos reales, sin metodología ni tamaño de muestra publicados.",
  });
  const habitissimoPintarPiso = await ensureDataSource({
    name: "Habitissimo — pintar piso completo",
    url: "https://www.habitissimo.es/presupuestos/pintar-piso",
    sourceType: "mercado",
    confidence: "B",
    geographicScope: "España",
    notes: "Agregador de presupuestos reales, sin metodología ni tamaño de muestra publicados.",
  });
  const habitissimoEnchufes = await ensureDataSource({
    name: "Habitissimo — instalar enchufes",
    url: "https://www.habitissimo.es/presupuestos/instalar-enchufes",
    sourceType: "mercado",
    confidence: "B",
    geographicScope: "España",
    notes: "Agregador de presupuestos reales, sin metodología ni tamaño de muestra publicados.",
  });
  const cronosharePuntoLuz = await ensureDataSource({
    name: "Cronoshare — instalar punto de luz",
    url: "https://www.cronoshare.com/cuanto-cuesta/instalar-punto-luz",
    sourceType: "mercado",
    confidence: "B",
    geographicScope: "España",
    notes: "Agregador de presupuestos reales, sin metodología ni tamaño de muestra publicados.",
  });
  const habitissimoTermo = await ensureDataSource({
    name: "Habitissimo — instalar o cambiar termo eléctrico",
    url: "https://www.habitissimo.es/presupuestos/instalar-o-cambiar-termo-electrico",
    sourceType: "mercado",
    confidence: "B",
    geographicScope: "España",
    notes: "Agregador de presupuestos reales, sin metodología ni tamaño de muestra publicados.",
  });
  const habitissimoFuga = await ensureDataSource({
    name: "Habitissimo — reparar fuga de agua",
    url: "https://www.habitissimo.es/presupuestos/reparar-fuga-de-agua",
    sourceType: "mercado",
    confidence: "B",
    geographicScope: "España",
    notes: "Agregador de presupuestos reales, sin metodología ni tamaño de muestra publicados.",
  });
  const cronoshareAlicatar = await ensureDataSource({
    name: "Cronoshare — alicatar baño",
    url: "https://www.cronoshare.com/cuanto-cuesta/alicatar-bano",
    sourceType: "mercado",
    confidence: "B",
    geographicScope: "España",
    notes: "Agregador de presupuestos reales, sin metodología ni tamaño de muestra publicados.",
  });
  const habitissimoTabique = await ensureDataSource({
    name: "Habitissimo — construir tabique",
    url: "https://www.habitissimo.es/presupuestos/construir-tabique",
    sourceType: "mercado",
    confidence: "B",
    geographicScope: "España",
    notes: "Agregador de presupuestos reales, sin metodología ni tamaño de muestra publicados. Dispersión notable frente a otras fuentes consultadas.",
  });
  const habitissimoArmario = await ensureDataSource({
    name: "Habitissimo — armario a medida",
    url: "https://precio.habitissimo.es/hacer-armario-a-medida",
    sourceType: "mercado",
    confidence: "B",
    geographicScope: "España",
    notes: "Agregador de presupuestos reales, sin metodología ni tamaño de muestra publicados.",
  });

  console.log("\nCreando reglas de precio...");

  // 1. Cambiar un grifo
  const grifo = await getServiceType("instalaciones", "cambiar-un-grifo");
  await ensurePricingRule(grifo.id, "Cambiar un grifo v1", [
    {
      key: "base_fregadero_lavabo",
      label: "Grifo de fregadero o lavabo",
      kind: "base",
      groupKey: "servicio",
      valueMin: 60,
      valueMax: 100,
      condition: { field: "tipoGrifo", op: "eq", value: "fregadero_lavabo" },
      sourceId: habitissimoGrifo.id,
      confidence: "B",
    },
    {
      key: "base_ducha_banera",
      label: "Grifo de ducha o bañera",
      kind: "base",
      groupKey: "servicio",
      valueMin: 80,
      valueMax: 240,
      condition: { field: "tipoGrifo", op: "eq", value: "ducha_banera" },
      sourceId: habitissimoGrifo.id,
      confidence: "B",
    },
    {
      key: "adaptacion_tuberia",
      label: "Adaptación de tubería / pequeña albañilería",
      kind: "additive",
      groupKey: "extras",
      valueMin: 20,
      valueMax: 60,
      condition: { field: "requiereAdaptacion", op: "truthy" },
      sourceId: heuristica.id,
      confidence: "C",
      notes: "Sin desglose de mercado específico para esta variante; estimación propia razonable.",
    },
  ]);
  await ensureVatRates(grifo.id, aeat.id);
  await setServiceCopy(
    grifo.id,
    "El precio del grifo (monomando o termostático), la mano de obra de desmontar el antiguo y montar el nuevo, y un ajuste si hace falta adaptar la tubería o repicar un poco de alicatado.",
    "El propio grifo si tú lo compras aparte (aquí se estima el conjunto), reformas de fontanería más amplias, ni el IVA de materiales si los aporta el usuario.",
    "disponible",
  );

  // 2. Cambiar una cerradura
  const cerradura = await getServiceType("exterior-y-mantenimiento", "cambiar-una-cerradura");
  await ensurePricingRule(cerradura.id, "Cambiar una cerradura v1", [
    {
      key: "base_estandar",
      label: "Cerradura estándar",
      kind: "base",
      groupKey: "servicio",
      valueMin: 80,
      valueMax: 200,
      condition: { field: "nivelSeguridad", op: "eq", value: "estandar" },
      sourceId: cronoshareCerrajero.id,
      confidence: "B",
    },
    {
      key: "base_seguridad",
      label: "Cerradura de seguridad / blindada",
      kind: "base",
      groupKey: "servicio",
      valueMin: 200,
      valueMax: 500,
      condition: { field: "nivelSeguridad", op: "eq", value: "seguridad" },
      sourceId: cronoshareCerrajero.id,
      confidence: "B",
    },
    {
      key: "base_electronica",
      label: "Cerradura electrónica",
      kind: "base",
      groupKey: "servicio",
      valueMin: 350,
      valueMax: 600,
      condition: { field: "nivelSeguridad", op: "eq", value: "electronica" },
      sourceId: cronoshareCerrajero.id,
      confidence: "B",
    },
    {
      key: "recargo_urgencia",
      label: "Recargo por urgencia / fuera de horario",
      kind: "additive",
      groupKey: "extras",
      valueMin: 50,
      valueMax: 150,
      condition: { field: "urgente", op: "truthy" },
      sourceId: cronoshareCerrajero.id,
      confidence: "B",
    },
  ]);
  await ensureVatRates(cerradura.id, aeat.id);
  await setServiceCopy(
    cerradura.id,
    "La cerradura según el nivel de seguridad elegido, el desmontaje de la antigua y la instalación de la nueva, y el recargo si necesitas que venga con urgencia.",
    "Reparar o reforzar el marco de la puerta si está dañado, cambiar la puerta completa, ni cerraduras adicionales (solo una unidad).",
    "disponible",
  );

  // 3. Pintar una habitación
  const pintarHab = await getServiceType("reformas", "pintar-una-habitacion");
  await ensurePricingRule(pintarHab.id, "Pintar una habitación v1", [
    {
      key: "base_m2",
      label: "Pintura por m²",
      kind: "base",
      groupKey: "servicio",
      perUnitOfQuantity: "m2",
      valueMin: 4,
      valueMax: 6,
      sourceId: cronoisharePintarHabitacion.id,
      confidence: "B",
    },
    {
      key: "ajuste_gotele",
      label: "Quitar gotelé / alisar mucho antes de pintar",
      kind: "multiplier",
      groupKey: "ajuste",
      valueMin: 1.4,
      valueMax: 1.8,
      condition: { field: "quitarGotele", op: "truthy" },
      sourceId: cronoisharePintarHabitacion.id,
      confidence: "B",
    },
  ]);
  await ensureVatRates(pintarHab.id, aeat.id);
  await setServiceCopy(
    pintarHab.id,
    "Pintura de paredes (y el recargo si hay que quitar gotelé o alisar mucho antes), con el número de manos habitual para un acabado normal.",
    "El techo salvo que lo indiques al pedir presupuesto, la pintura de puertas/marcos/radiadores, ni tratamientos especiales de humedad.",
    "disponible",
  );

  // 4. Pintar una vivienda completa
  const pintarViv = await getServiceType("reformas", "pintar-una-vivienda");
  await ensurePricingRule(pintarViv.id, "Pintar una vivienda completa v1", [
    {
      key: "base_m2",
      label: "Pintura por m² de vivienda",
      kind: "base",
      groupKey: "servicio",
      perUnitOfQuantity: "m2",
      valueMin: 5,
      valueMax: 15,
      sourceId: habitissimoPintarPiso.id,
      confidence: "B",
    },
    {
      key: "preparacion_previa",
      label: "Tratamiento previo de humedad, grietas o desconchones",
      kind: "additive",
      groupKey: "extras",
      valueMin: 100,
      valueMax: 300,
      condition: { field: "requierePreparacionPrevia", op: "truthy" },
      sourceId: heuristica.id,
      confidence: "C",
      notes: "Sin desglose de mercado específico; estimación propia razonable según alcance típico de este tipo de tratamiento.",
    },
  ]);
  await ensureVatRates(pintarViv.id, aeat.id);
  await setServiceCopy(
    pintarViv.id,
    "Pintura de todas las estancias de la vivienda, con el recargo si las paredes necesitan un tratamiento previo por humedad o grietas.",
    "Mobiliario a mover/proteger si es muy voluminoso, pintura exterior/fachada, ni reformas de otro tipo (electricidad, fontanería...).",
    "disponible",
  );

  // 5. Añadir enchufes
  const enchufes = await getServiceType("instalaciones", "anadir-enchufes");
  await ensurePricingRule(enchufes.id, "Añadir enchufes v1", [
    {
      key: "base_mecanismo_simple",
      label: "Sobre cableado ya existente",
      kind: "base",
      groupKey: "servicio",
      perUnitOfQuantity: "numEnchufes",
      valueMin: 30,
      valueMax: 60,
      condition: { field: "tipoInstalacion", op: "eq", value: "mecanismo_simple" },
      sourceId: habitissimoEnchufes.id,
      confidence: "B",
    },
    {
      key: "base_cableado_nuevo",
      label: "Con cableado nuevo hasta el punto",
      kind: "base",
      groupKey: "servicio",
      perUnitOfQuantity: "numEnchufes",
      valueMin: 80,
      valueMax: 150,
      condition: { field: "tipoInstalacion", op: "eq", value: "cableado_nuevo" },
      sourceId: heuristica.id,
      confidence: "C",
      notes: "La investigación solo dio un precio por metro de cableado (~80€/m), no por enchufe con cableado nuevo — este rango es una combinación propia razonable, no una cifra de mercado directa.",
    },
  ]);
  await ensureVatRates(enchufes.id, aeat.id);
  await setServiceCopy(
    enchufes.id,
    "El mecanismo y la instalación de cada enchufe nuevo, con o sin cableado nuevo hasta el punto.",
    "Ampliar la potencia contratada, cambiar el cuadro eléctrico (es un servicio aparte), ni obra de albañilería para ocultar rozas si son extensas.",
    "disponible",
  );

  // 6. Instalar puntos de luz
  const puntosLuz = await getServiceType("instalaciones", "instalar-puntos-de-luz");
  await ensurePricingRule(puntosLuz.id, "Instalar puntos de luz v1", [
    {
      key: "base_simple",
      label: "Instalación accesible, sin rozas",
      kind: "base",
      groupKey: "servicio",
      perUnitOfQuantity: "numPuntos",
      valueMin: 40,
      valueMax: 120,
      condition: { field: "tipoInstalacion", op: "eq", value: "simple" },
      sourceId: cronosharePuntoLuz.id,
      confidence: "B",
    },
    {
      key: "base_con_rozas",
      label: "Con rozas o cableado nuevo",
      kind: "base",
      groupKey: "servicio",
      perUnitOfQuantity: "numPuntos",
      valueMin: 150,
      valueMax: 350,
      condition: { field: "tipoInstalacion", op: "eq", value: "con_rozas" },
      sourceId: cronosharePuntoLuz.id,
      confidence: "B",
    },
  ]);
  await ensureVatRates(puntosLuz.id, aeat.id);
  await setServiceCopy(
    puntosLuz.id,
    "El punto de luz (mecanismo + instalación), con o sin apertura de rozas para el cableado nuevo.",
    "La lámpara o luminaria en sí, el reguetado eléctrico general de la vivienda, ni el repintado de la zona afectada por las rozas.",
    "disponible",
  );

  // 7. Instalar un termo eléctrico
  const termo = await getServiceType("instalaciones", "instalar-un-termo");
  await ensurePricingRule(termo.id, "Instalar un termo eléctrico v1", [
    {
      key: "base",
      label: "Termo eléctrico (equipo + instalación + retirada del antiguo)",
      kind: "base",
      // "equipo" (no "servicio"): el termo en sí domina el coste, igual que el
      // equipo en aire acondicionado — así el cálculo del IVA reducido (que
      // exige que los materiales no superen el 40% de la base imponible) no
      // asume por defecto un 0% de materiales cuando en realidad es al revés.
      groupKey: "equipo",
      valueMin: 200,
      valueMax: 400,
      sourceId: habitissimoTermo.id,
      confidence: "B",
    },
    {
      key: "capacidad_grande",
      label: "Termo de gran capacidad (más de 100 litros)",
      kind: "multiplier",
      groupKey: "ajuste",
      valueMin: 1.2,
      valueMax: 1.5,
      condition: { field: "capacidadGrande", op: "truthy" },
      sourceId: heuristica.id,
      confidence: "C",
      notes: "La investigación no desglosó el precio por capacidad; ajuste propio razonable para equipos grandes.",
    },
  ]);
  await ensureVatRates(termo.id, aeat.id);
  await setServiceCopy(
    termo.id,
    "La mano de obra de instalar el termo nuevo y retirar el antiguo si lo hay, con un ajuste si necesitas uno de gran capacidad.",
    "El propio termo si lo compras aparte (aquí se estima el conjunto), adaptar la instalación eléctrica si no cumple la normativa, ni el desagüe si hay que crearlo desde cero.",
    "disponible",
  );

  // 8. Reparar una fuga (pasa de solo_solicitud a disponible)
  const fuga = await getServiceType("instalaciones", "reparar-una-fuga");
  await ensurePricingRule(fuga.id, "Reparar una fuga v1", [
    {
      key: "base",
      label: "Fuga visible y accesible",
      kind: "base",
      groupKey: "servicio",
      valueMin: 80,
      valueMax: 180,
      sourceId: habitissimoFuga.id,
      confidence: "B",
    },
    {
      key: "tuberia_empotrada",
      label: "Tubería empotrada (hay que picar y reponer acabados)",
      kind: "additive",
      groupKey: "extras",
      valueMin: 100,
      valueMax: 300,
      condition: { field: "tuberiaEmpotrada", op: "truthy" },
      sourceId: heuristica.id,
      confidence: "C",
      notes: "La investigación no encontró un rango de mercado agregado para este caso; es la propia recomendación del análisis modelarlo como recargo estimado.",
    },
    {
      key: "urgencia",
      label: "Urgencia (fuga activa, hoy)",
      kind: "multiplier",
      groupKey: "ajuste",
      valueMin: 1.5,
      valueMax: 2.0,
      condition: { field: "urgente", op: "truthy" },
      sourceId: habitissimoFuga.id,
      confidence: "B",
    },
  ]);
  await ensureVatRates(fuga.id, aeat.id);
  await setServiceCopy(
    fuga.id,
    "Localización y reparación de la fuga, con recargo si la tubería está empotrada (hay que picar) o si necesitas que venga con urgencia.",
    "Reponer el acabado final (alicatado, pintura...) más allá de un arreglo básico, sustituir tramos largos de tubería, ni daños ya causados por la fuga (humedades, muebles...).",
    "disponible",
  );

  // 9. Alicatar un baño
  const alicatar = await getServiceType("reformas", "alicatar-un-bano");
  await ensurePricingRule(alicatar.id, "Alicatar un baño v1", [
    {
      key: "base_m2",
      label: "Alicatado por m²",
      kind: "base",
      groupKey: "servicio",
      perUnitOfQuantity: "m2",
      valueMin: 25,
      valueMax: 60,
      sourceId: cronoshareAlicatar.id,
      confidence: "B",
    },
    {
      key: "retirar_antiguo",
      label: "Retirar el alicatado viejo",
      kind: "additive",
      groupKey: "extras",
      valueMin: 100,
      valueMax: 250,
      condition: { field: "retirarAlicatadoAntiguo", op: "truthy" },
      sourceId: heuristica.id,
      confidence: "C",
      notes: "Sin desglose de mercado específico para la retirada; estimación propia razonable.",
    },
  ]);
  await ensureVatRates(alicatar.id, aeat.id);
  await setServiceCopy(
    alicatar.id,
    "El material de agarre y la colocación del alicatado por m², con el recargo si hay que retirar uno viejo antes.",
    "El azulejo en sí (su precio varía mucho según gama y no está incluido), impermeabilización si hace falta, ni fontanería/sanitarios.",
    "disponible",
  );

  // 10. Levantar un tabique
  const tabique = await getServiceType("reformas", "levantar-un-tabique");
  await ensurePricingRule(tabique.id, "Levantar un tabique v1", [
    {
      key: "base_pladur",
      label: "Tabique de pladur, por m²",
      kind: "base",
      groupKey: "servicio",
      perUnitOfQuantity: "m2",
      valueMin: 20,
      valueMax: 50,
      condition: { field: "material", op: "eq", value: "pladur" },
      sourceId: habitissimoTabique.id,
      confidence: "B",
    },
    {
      key: "base_ladrillo",
      label: "Tabique de ladrillo, por m²",
      kind: "base",
      groupKey: "servicio",
      perUnitOfQuantity: "m2",
      valueMin: 12,
      valueMax: 40,
      condition: { field: "material", op: "eq", value: "ladrillo" },
      sourceId: habitissimoTabique.id,
      confidence: "B",
    },
  ]);
  await ensureVatRates(tabique.id, aeat.id);
  await setServiceCopy(
    tabique.id,
    "Material y mano de obra de levantar el tabique según el material elegido, por metro cuadrado.",
    "El acabado final (pintura, alicatado...), la instalación eléctrica dentro del tabique si la necesitas, ni permisos/licencias si la obra los requiere.",
    "disponible",
  );

  // 11. Instalar un armario a medida
  const armario = await getServiceType("exterior-y-mantenimiento", "instalar-un-armario-a-medida");
  await ensurePricingRule(armario.id, "Instalar un armario a medida v1", [
    {
      key: "base_laminado",
      label: "Melamina / laminado, por metro lineal",
      kind: "base",
      // "equipo" (no "servicio"): el mueble en sí domina el coste — ver nota
      // igual en "Instalar un termo eléctrico" sobre el cálculo del IVA.
      groupKey: "equipo",
      perUnitOfQuantity: "ml",
      valueMin: 250,
      valueMax: 450,
      condition: { field: "material", op: "eq", value: "laminado" },
      sourceId: habitissimoArmario.id,
      confidence: "B",
    },
    {
      key: "base_mdf_lacado",
      label: "MDF lacado, por metro lineal",
      kind: "base",
      groupKey: "equipo",
      perUnitOfQuantity: "ml",
      valueMin: 400,
      valueMax: 700,
      condition: { field: "material", op: "eq", value: "mdf_lacado" },
      sourceId: habitissimoArmario.id,
      confidence: "B",
    },
    {
      key: "base_madera_maciza",
      label: "Madera maciza, por metro lineal",
      kind: "base",
      groupKey: "equipo",
      perUnitOfQuantity: "ml",
      valueMin: 600,
      valueMax: 900,
      condition: { field: "material", op: "eq", value: "madera_maciza" },
      sourceId: habitissimoArmario.id,
      confidence: "B",
    },
  ]);
  await ensureVatRates(armario.id, aeat.id);
  await setServiceCopy(
    armario.id,
    "El armario a medida completo (estructura, puertas, interior básico) según el material del frente, por metro lineal.",
    "Interiores muy elaborados (cajoneras especiales, iluminación integrada...), el desmontaje de un armario anterior, ni remates de obra si el hueco no es regular.",
    "disponible",
  );

  console.log("\nActivando los 7 servicios sin calculadora (solo_solicitud)...");

  const requestOnlyServices: { categorySlug: string; serviceSlug: string; included: string; excluded: string }[] = [
    {
      categorySlug: "instalaciones",
      serviceSlug: "cambiar-el-cuadro-electrico",
      included: "Tu solicitud llega a un electricista verificado con la descripción, ubicación y el resto de datos que indiques (nº de circuitos, si necesitas boletín, etc.).",
      excluded: "Todavía no calculamos un rango de precio orientativo: el coste depende demasiado del estado de tu instalación actual para dar una cifra fiable sin verla.",
    },
    {
      categorySlug: "instalaciones",
      serviceSlug: "instalar-una-caldera",
      included: "Tu solicitud llega a un técnico de calefacción verificado con la descripción del sistema que quieres y el resto de datos que indiques.",
      excluded: "Todavía no calculamos un rango de precio: el coste varía muchísimo según si es sustitución simple o instalación completa con radiadores.",
    },
    {
      categorySlug: "reformas",
      serviceSlug: "reformar-una-habitacion",
      included: "Tu solicitud llega a un profesional verificado con el alcance que describas (suelo, pintura, electricidad...).",
      excluded: "Todavía no calculamos un rango de precio: el alcance de una reforma de habitación varía demasiado para un cálculo fiable sin ver el espacio.",
    },
    {
      categorySlug: "reformas",
      serviceSlug: "reforma-integral-de-vivienda",
      included: "Tu solicitud llega a un profesional verificado con la descripción y superficie que indiques.",
      excluded: "Todavía no calculamos un rango de precio: una reforma integral depende del estado del edificio, la superficie y la calidad deseada de forma demasiado variable para un cálculo fiable.",
    },
    {
      categorySlug: "exterior-y-mantenimiento",
      serviceSlug: "mantenimiento-de-jardin",
      included: "Tu solicitud llega a un jardinero verificado con el tamaño y tipo de jardín que describas.",
      excluded: "Todavía no calculamos un precio: el mantenimiento de jardín se cobra normalmente por visita/hora y varía mucho según la vegetación.",
    },
    {
      categorySlug: "exterior-y-mantenimiento",
      serviceSlug: "limpieza-profunda-de-vivienda",
      included: "Tu solicitud llega a un profesional de limpieza verificado con los metros cuadrados y el estado que describas.",
      excluded: "Todavía no calculamos un precio: el coste depende mucho del estado de partida de la vivienda.",
    },
    {
      categorySlug: "exterior-y-mantenimiento",
      serviceSlug: "reparar-una-persiana",
      included: "Tu solicitud llega a un técnico de persianas verificado con el tipo de avería que describas.",
      excluded: "Todavía no calculamos un precio: el coste depende del tipo exacto de avería (cinta, lamas, eje o motor), que es difícil de determinar sin verlo.",
    },
  ];

  for (const s of requestOnlyServices) {
    const service = await getServiceType(s.categorySlug, s.serviceSlug);
    await setServiceCopy(service.id, s.included, s.excluded, "solo_solicitud");
    console.log(`  + activado (solo_solicitud) "${service.name}"`);
  }

  console.log("\nSeed de ampliación multi-servicio completado.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
