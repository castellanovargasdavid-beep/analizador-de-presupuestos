/**
 * Seed ADITIVO del catálogo multi-servicio — a diferencia de `seed.ts`
 * (que borra y reconstruye desde cero el conjunto de precios de aire
 * acondicionado), este script nunca borra nada: solo crea, si no existen
 * ya, la profesión del servicio de A/C existente (backfill de la
 * jerarquía categoría → profesión → servicio) y el catálogo de
 * categorías/profesiones/servicios todavía sin calculadora.
 *
 * Ejecutar con: npx tsx --env-file=.env.local db/seed-catalog.ts
 * Seguro de re-ejecutar: cada inserción comprueba primero si la fila ya
 * existe por su slug.
 */
import { and, eq } from "drizzle-orm";
import { db } from "./client";
import { professions, serviceCategories, serviceTypes } from "./schema";

async function ensureCategory(slug: string, name: string, description: string, iconKey: string) {
  const [existing] = await db.select().from(serviceCategories).where(eq(serviceCategories.slug, slug)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(serviceCategories).values({ slug, name, description, iconKey }).returning();
  console.log(`  + categoría "${name}"`);
  return created;
}

async function ensureProfession(
  categoryId: string,
  slug: string,
  name: string,
  description: string,
  iconKey: string | null,
) {
  const [existing] = await db
    .select()
    .from(professions)
    .where(and(eq(professions.categoryId, categoryId), eq(professions.slug, slug)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(professions)
    .values({ categoryId, slug, name, description, iconKey, status: "publicado" })
    .returning();
  console.log(`    + profesión "${name}"`);
  return created;
}

async function ensureServiceType(
  categoryId: string,
  professionId: string,
  slug: string,
  name: string,
  description: string,
  availabilityStatus: "disponible" | "solo_solicitud" | "proximamente",
) {
  const [existing] = await db
    .select()
    .from(serviceTypes)
    .where(and(eq(serviceTypes.categoryId, categoryId), eq(serviceTypes.slug, slug)))
    .limit(1);
  if (existing) {
    // Backfill: si ya existe (p. ej. la instalación de A/C, sembrada por seed.ts,
    // que no conocía profesión ni disponibilidad porque esas columnas no existían
    // todavía) y le falta profesión o su disponibilidad no coincide con la
    // deseada, se corrige sin tocar el resto de la fila (precios, IVA, etc.).
    const needsUpdate = !existing.professionId || existing.availabilityStatus !== availabilityStatus;
    if (needsUpdate) {
      await db
        .update(serviceTypes)
        .set({ professionId, availabilityStatus })
        .where(eq(serviceTypes.id, existing.id));
      console.log(`      = servicio "${name}" ya existía, backfill de profesión/disponibilidad aplicado`);
    }
    return existing;
  }
  const [created] = await db
    .insert(serviceTypes)
    .values({
      categoryId,
      professionId,
      slug,
      name,
      description,
      availabilityStatus,
      vatReducedEligible: true,
      isActive: true,
    })
    .returning();
  console.log(`      + servicio "${name}" (${availabilityStatus})`);
  return created;
}

async function main() {
  console.log("Backfill: profesión del servicio de aire acondicionado existente...");
  const aireAcondicionado = await ensureCategory(
    "aire-acondicionado",
    "Aire acondicionado",
    "Instalación y mantenimiento de equipos de climatización.",
    "ac",
  );
  const instaladorAC = await ensureProfession(
    aireAcondicionado.id,
    "instalador-de-aire-acondicionado",
    "Instalador de aire acondicionado",
    "Instala equipos split, multisplit y por conductos, con o sin retirada de equipo antiguo.",
    "ac",
  );
  await ensureServiceType(
    aireAcondicionado.id,
    instaladorAC.id,
    "instalacion",
    "Instalación de aire acondicionado",
    "Instalación completa de un equipo nuevo.",
    "disponible",
  );

  console.log("Catálogo: Reformas...");
  const reformas = await ensureCategory(
    "reformas",
    "Reformas",
    "Trabajos de albañilería, pintura y reforma integral en viviendas.",
    "trowel",
  );
  const albanil = await ensureProfession(
    reformas.id,
    "albanil",
    "Albañil",
    "Trabajos de obra: tabiquería, alicatado y reformas parciales de una estancia.",
    "trowel",
  );
  await ensureServiceType(reformas.id, albanil.id, "levantar-un-tabique", "Levantar un tabique", "Construcción de un tabique nuevo de separación.", "proximamente");
  await ensureServiceType(reformas.id, albanil.id, "alicatar-un-bano", "Alicatar un baño", "Colocación de azulejo en paredes y/o suelo de un baño.", "proximamente");
  await ensureServiceType(reformas.id, albanil.id, "reformar-una-habitacion", "Reformar una habitación", "Reforma parcial de una habitación (suelo, paredes, instalaciones básicas).", "proximamente");

  const pintor = await ensureProfession(
    reformas.id,
    "pintor",
    "Pintor",
    "Pintura interior de habitaciones o de la vivienda completa.",
    "paint",
  );
  await ensureServiceType(reformas.id, pintor.id, "pintar-una-habitacion", "Pintar una habitación", "Pintura de paredes y techo de una habitación.", "proximamente");
  await ensureServiceType(reformas.id, pintor.id, "pintar-una-vivienda", "Pintar una vivienda completa", "Pintura de todas las estancias de una vivienda.", "proximamente");

  const reformista = await ensureProfession(
    reformas.id,
    "reformista",
    "Reformista",
    "Coordinación de una reforma integral de vivienda, con varios oficios implicados.",
    "trowel",
  );
  await ensureServiceType(reformas.id, reformista.id, "reforma-integral-de-vivienda", "Reforma integral de vivienda", "Reforma completa que afecta a toda la vivienda.", "proximamente");

  console.log("Catálogo: Instalaciones...");
  const instalaciones = await ensureCategory(
    "instalaciones",
    "Instalaciones",
    "Fontanería, electricidad y calefacción.",
    "wrench",
  );
  const fontanero = await ensureProfession(
    instalaciones.id,
    "fontanero",
    "Fontanero",
    "Reparaciones y pequeñas instalaciones de fontanería en el hogar.",
    "wrench",
  );
  await ensureServiceType(
    instalaciones.id,
    fontanero.id,
    "reparar-una-fuga",
    "Reparar una fuga",
    "Localización y reparación de una fuga de agua.",
    "solo_solicitud",
  );
  await ensureServiceType(instalaciones.id, fontanero.id, "cambiar-un-grifo", "Cambiar un grifo", "Sustitución de un grifo de cocina o baño.", "proximamente");
  await ensureServiceType(instalaciones.id, fontanero.id, "instalar-un-termo", "Instalar un termo", "Instalación de un termo eléctrico o de gas.", "proximamente");

  const electricista = await ensureProfession(
    instalaciones.id,
    "electricista",
    "Electricista",
    "Instalación y modificación de puntos de luz, enchufes y cuadros eléctricos.",
    "bolt",
  );
  await ensureServiceType(instalaciones.id, electricista.id, "instalar-puntos-de-luz", "Instalar puntos de luz", "Añadir o modificar puntos de luz en una estancia.", "proximamente");
  await ensureServiceType(instalaciones.id, electricista.id, "cambiar-el-cuadro-electrico", "Cambiar el cuadro eléctrico", "Sustitución del cuadro eléctrico de la vivienda.", "proximamente");
  await ensureServiceType(instalaciones.id, electricista.id, "anadir-enchufes", "Añadir enchufes", "Instalación de enchufes adicionales.", "proximamente");

  const tecnicoCalefaccion = await ensureProfession(
    instalaciones.id,
    "tecnico-de-calefaccion",
    "Técnico de calefacción",
    "Instalación de calderas y sistemas de calefacción.",
    "bolt",
  );
  await ensureServiceType(instalaciones.id, tecnicoCalefaccion.id, "instalar-una-caldera", "Instalar una caldera", "Instalación de una caldera de gas o eléctrica nueva.", "proximamente");

  console.log("Catálogo: Exterior y mantenimiento...");
  const exterior = await ensureCategory(
    "exterior-y-mantenimiento",
    "Exterior y mantenimiento",
    "Jardinería, cerrajería, carpintería, limpieza y persianas.",
    "tree",
  );
  const jardinero = await ensureProfession(exterior.id, "jardinero", "Jardinero", "Mantenimiento de jardines y espacios exteriores.", "tree");
  await ensureServiceType(exterior.id, jardinero.id, "mantenimiento-de-jardin", "Mantenimiento de jardín", "Poda, siega y mantenimiento periódico de un jardín.", "proximamente");

  const cerrajero = await ensureProfession(exterior.id, "cerrajero", "Cerrajero", "Apertura de puertas y cambio de cerraduras.", "key");
  await ensureServiceType(exterior.id, cerrajero.id, "cambiar-una-cerradura", "Cambiar una cerradura", "Sustitución de una cerradura de puerta de vivienda.", "proximamente");

  const carpintero = await ensureProfession(exterior.id, "carpintero", "Carpintero", "Fabricación e instalación de muebles y elementos de madera a medida.", "trowel");
  await ensureServiceType(exterior.id, carpintero.id, "instalar-un-armario-a-medida", "Instalar un armario a medida", "Fabricación e instalación de un armario empotrado.", "proximamente");

  const limpiador = await ensureProfession(exterior.id, "limpiador", "Limpiador", "Limpieza profunda de vivienda.", "tree");
  await ensureServiceType(exterior.id, limpiador.id, "limpieza-profunda-de-vivienda", "Limpieza profunda de vivienda", "Limpieza a fondo de toda la vivienda.", "proximamente");

  const tecnicoPersianas = await ensureProfession(exterior.id, "tecnico-de-persianas", "Técnico de persianas", "Reparación y motorización de persianas.", "wrench");
  await ensureServiceType(exterior.id, tecnicoPersianas.id, "reparar-una-persiana", "Reparar una persiana", "Reparación de una persiana enrollable.", "proximamente");

  console.log("Catálogo sembrado (aditivo, sin borrar nada existente).");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
