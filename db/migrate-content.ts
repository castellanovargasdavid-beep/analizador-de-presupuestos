/**
 * Migración de contenido ÚNICA (no forma parte de `npm run db:seed`, que
 * es para los datos de precios y se re-ejecuta libremente): mueve el
 * contenido editorial que hasta ahora vivía hardcodeado en TypeScript
 * (lib/content/guias.ts, lib/content/preguntas.ts, y los arrays
 * `FAQ_ITEMS`/`FAQS` de cada page.tsx) a las tablas `seo_guides`,
 * `seo_questions` y `faqs`, gestionables desde /admin sin tocar código.
 *
 * Se ejecuta una sola vez con `npx tsx db/migrate-content.ts`. Es
 * idempotente por `slug`/`pageKey` (upsert), así que volver a ejecutarla
 * no duplica filas — pero después de esta migración, el contenido se
 * edita desde /admin, no volviendo a correr este script.
 */
import { eq } from "drizzle-orm";
import { db } from "./client";
import { faqs, seoGuides, seoQuestions } from "./schema";
import type { GuideBlock } from "../lib/content/blocks";

async function upsertGuide(input: {
  slug: string;
  title: string;
  summary: string;
  metaDescription: string;
  intro: string;
  body: GuideBlock[];
  ctaHref?: string;
  ctaLabel?: string;
  relatedLinks: { href: string; label: string; description?: string }[];
}) {
  const [existing] = await db.select({ id: seoGuides.id }).from(seoGuides).where(eq(seoGuides.slug, input.slug)).limit(1);
  if (existing) {
    console.log(`  (ya existe) ${input.slug}`);
    return;
  }
  await db.insert(seoGuides).values({
    ...input,
    ctaHref: input.ctaHref ?? null,
    ctaLabel: input.ctaLabel ?? null,
    status: "publicado",
    version: 1,
    publishedAt: new Date(),
  });
  console.log(`  creada: ${input.slug}`);
}

async function upsertQuestion(input: {
  slug: string;
  question: string;
  shortAnswer: string;
  detail: string[];
  relatedLinks: { href: string; label: string }[];
}) {
  const [existing] = await db.select({ id: seoQuestions.id }).from(seoQuestions).where(eq(seoQuestions.slug, input.slug)).limit(1);
  if (existing) {
    console.log(`  (ya existe) ${input.slug}`);
    return;
  }
  await db.insert(seoQuestions).values({
    ...input,
    status: "publicado",
    version: 1,
    publishedAt: new Date(),
  });
  console.log(`  creada: ${input.slug}`);
}

async function upsertFaqs(pageKey: string, items: { question: string; answer: string }[]) {
  const existing = await db.select({ id: faqs.id }).from(faqs).where(eq(faqs.pageKey, pageKey)).limit(1);
  if (existing.length > 0) {
    console.log(`  (ya existen) ${pageKey}`);
    return;
  }
  await db.insert(faqs).values(
    items.map((item, i) => ({ pageKey, question: item.question, answer: item.answer, sortOrder: i })),
  );
  console.log(`  creadas ${items.length} FAQs: ${pageKey}`);
}

async function main() {
  console.log("Migrando guías...");
  await upsertGuide({
    slug: "como-comparar-presupuestos-de-instalacion",
    title: "Cómo comparar presupuestos de instalación sin equivocarte",
    summary: "Qué exigir a cada presupuesto para poder compararlos de verdad, y qué señales de alerta buscar.",
    metaDescription:
      "Qué exigir a cada presupuesto de instalación para poder compararlos de verdad, y las señales de alerta más habituales.",
    intro:
      "El presupuesto más barato y el más caro suelen dejar de serlo en cuanto describen exactamente el mismo trabajo. Antes de comparar el número final, asegúrate de que todos los presupuestos midan lo mismo.",
    body: [
      { type: "heading", text: "Exige lo mismo a todos los presupuestos" },
      {
        type: "list",
        items: [
          "Desglose por partidas, con mano de obra y material separados.",
          "Marca y modelo exacto del equipo, no solo “aire acondicionado gama media”.",
          "Metros de línea frigorífica incluidos, y precio del metro adicional.",
          "Si incluye retirada del equipo antiguo y certificado/boletín de la instalación.",
          "Plazo de ejecución y condiciones de pago por escrito.",
        ],
      },
      { type: "heading", text: "Señales de alerta" },
      {
        type: "list",
        items: [
          "Partidas agrupadas en una sola línea (“instalación completa”) sin desglose.",
          "Descripciones vagas (“primera marca”, “calidad estándar”).",
          "Anticipos grandes (más del 30-50%) sin justificar con compras concretas.",
          "Ninguna mención a certificado, boletín o garantía de la instalación (no solo del equipo).",
        ],
      },
      { type: "heading", text: "No decidas solo por el precio" },
      {
        type: "paragraph",
        text: "Dos presupuestos con el mismo total pero condiciones de pago o garantías distintas no son equivalentes. Un precio más bajo que omite la retirada del equipo antiguo o el certificado puede acabar costando más.",
      },
    ],
    ctaHref: "/aire-acondicionado/instalacion/analizar-presupuesto",
    ctaLabel: "Analiza tu presupuesto de aire acondicionado",
    relatedLinks: [
      { href: "/aire-acondicionado/instalacion", label: "Calculadora de instalación de aire acondicionado" },
      { href: "/metodologia", label: "Metodología" },
    ],
  });

  console.log("Migrando preguntas...");
  await upsertQuestion({
    slug: "necesito-certificado-rite-aire-acondicionado",
    question: "¿Necesito el certificado RITE para instalar aire acondicionado?",
    shortAnswer:
      "Solo si la potencia nominal de tu instalación supera los 5 kW. Por debajo de ese umbral, el RITE no exige documentación técnica adicional.",
    detail: [
      "El RITE (Reglamento de Instalaciones Térmicas en los Edificios, RD 1027/2007 modificado por el RD 178/2021) fija un umbral de 5 kW de potencia nominal.",
      "Por debajo de 5 kW no se exige ni memoria técnica ni proyecto — es el caso habitual de un split de una sola unidad para una habitación.",
      "Entre 5 y 70 kW, una memoria técnica puede sustituir al proyecto completo. Por encima de 70 kW, se exige proyecto.",
      "Además, poner en servicio una instalación nueva o reformada requiere registrar el certificado ante tu Comunidad Autónoma — pregúntale a tu instalador si esto está incluido en el presupuesto.",
    ],
    relatedLinks: [
      { href: "/aire-acondicionado/instalacion", label: "Calcular mi instalación" },
      { href: "/metodologia", label: "Ver metodología completa" },
    ],
  });
  await upsertQuestion({
    slug: "iva-10-o-21-instalacion-aire-acondicionado",
    question: "¿Por qué mi presupuesto de aire acondicionado tiene IVA del 21% y no del 10%?",
    shortAnswer:
      "Porque el 10% reducido exige tres requisitos a la vez, y en instalaciones de aire acondicionado el equipo suele superar el límite del 40% que impone uno de ellos.",
    detail: [
      "El art. 91.Uno.2.10º de la Ley 37/1992 permite un IVA reducido del 10% en obras de renovación/reparación de vivienda particular.",
      "Los tres requisitos que deben cumplirse a la vez: el destinatario es una persona física que usa la vivienda para sí, la vivienda tiene más de 2 años, y los materiales aportados por la empresa no superan el 40% de la base imponible.",
      "En una instalación de aire acondicionado, el equipo (el 'material') suele representar más del 40% del total, así que aunque se cumplan los otros dos requisitos, se aplica el 21% general a todo el presupuesto.",
      "Una posible vía para acceder al 10%: comprar el equipo por separado y contratar solo la mano de obra de instalación, que si se factura aparte sí podría tributar al tipo reducido.",
    ],
    relatedLinks: [
      { href: "/aire-acondicionado/instalacion", label: "Calcular mi instalación" },
      { href: "/aire-acondicionado/instalacion/analizar-presupuesto", label: "Analizar mi presupuesto" },
    ],
  });
  await upsertQuestion({
    slug: "cuanto-cuesta-retirar-aire-acondicionado-antiguo",
    question: "¿Cuánto cuesta retirar un equipo de aire acondicionado antiguo?",
    shortAnswer:
      "Depende de si el equipo se desecha o se desmonta para reutilizarlo en otra ubicación — son dos servicios distintos con precios distintos.",
    detail: [
      "Retirar un equipo para desecharlo en un punto autorizado es la opción más habitual y más económica dentro del presupuesto total.",
      "Desmontar el equipo con cuidado para reinstalarlo en otra ubicación (por ejemplo, en una segunda vivienda) es un trabajo más delicado y suele costar más.",
      "Pide siempre que esta partida aparezca desglosada por separado en el presupuesto, no incluida de forma ambigua en 'instalación completa'.",
    ],
    relatedLinks: [
      { href: "/guias/como-comparar-presupuestos-de-instalacion", label: "Cómo comparar presupuestos" },
      { href: "/aire-acondicionado/instalacion/analizar-presupuesto", label: "Analizar mi presupuesto" },
    ],
  });

  console.log("Migrando FAQs por página...");
  await upsertFaqs("home", [
    {
      question: "¿Esto es una tasación oficial?",
      answer:
        "No. Es una estimación orientativa basada en rangos de mercado y, cuando existen, en normativa oficial. No sustituye un peritaje ni una tasación profesional, y no tiene validez legal.",
    },
    {
      question: "¿De dónde salen los rangos de precio?",
      answer:
        "De una combinación de normativa oficial (RITE), precios de catálogo reales de instaladores y agregadores de mercado. Cada cifra de la calculadora indica su nivel de confianza. Todo el detalle está en la página de metodología.",
    },
    {
      question: "Si mi presupuesto está por encima del rango, ¿significa que me están engañando?",
      answer:
        "No necesariamente. Puede haber diferencias por la gama del equipo, dificultad de acceso, materiales o garantías incluidas que nuestro formulario no ha capturado. Por eso mostramos posibles razones y preguntas recomendadas, nunca una acusación.",
    },
    {
      question: "¿Tengo que registrarme para usar la herramienta?",
      answer: "No. Puedes calcular y comparar tu presupuesto sin crear ninguna cuenta.",
    },
  ]);

  await upsertFaqs("precios-aire-acondicionado-instalacion", [
    {
      question: "¿Cuál es el precio medio de instalar aire acondicionado en España?",
      answer:
        "Depende sobre todo del tipo de sistema y de la gama del equipo: un split de una unidad en gama media suele moverse en un rango bastante más bajo que un multisplit de tres unidades en gama premium. Usa la herramienta de esta página para ver el rango de tu caso.",
    },
    {
      question: "¿Por qué varía tanto el precio entre presupuestos?",
      answer:
        "Porque casi ningún presupuesto describe exactamente lo mismo: cambia la gama del equipo, los metros de línea frigorífica, si hay que retirar un equipo antiguo, y el tipo de IVA aplicado. Dos presupuestos 'del mismo trabajo' pueden no serlo en absoluto.",
    },
    {
      question: "¿Estos precios incluyen IVA?",
      answer:
        "Sí, el rango mostrado es con IVA incluido (21% en la mayoría de los casos de instalación de A/C, o 10% si se cumplen los tres requisitos legales — ver metodología).",
    },
  ]);

  await upsertFaqs("comparativas-split-vs-conductos", [
    {
      question: "¿Los conductos son siempre más caros que un split?",
      answer:
        "Para una sola estancia, casi siempre sí: un sistema por conductos es un paquete completo que cubre varias zonas y requiere más obra (falso techo, rejillas), mientras que un split de una unidad cubre una sola habitación con mucha menos obra.",
    },
    {
      question: "¿Cuándo compensa instalar conductos en vez de varios splits?",
      answer:
        "Cuando quieres climatizar una vivienda completa con una estética unificada (sin unidades visibles en las paredes) y ya tienes o vas a hacer un falso techo. Para 1-2 estancias sueltas, un split o multisplit suele salir más ajustado.",
    },
    {
      question: "¿El mantenimiento es distinto entre uno y otro?",
      answer:
        "Los conductos suelen requerir revisión de la red de conductos además del propio equipo, mientras que un split es más sencillo de mantener por ser una unidad autocontenida por estancia.",
    },
  ]);

  await upsertFaqs("aire-acondicionado-instalacion", [
    {
      question: "¿Necesito el certificado RITE para instalar aire acondicionado?",
      answer:
        "Solo si la potencia nominal supera los 5 kW: en ese caso el RITE exige memoria técnica y registro del certificado ante tu Comunidad Autónoma. Por debajo de ese umbral no se exige documentación adicional.",
    },
    {
      question: "¿Por qué mi presupuesto tiene un IVA del 21% y no del 10%?",
      answer:
        "El 10% reducido exige tres requisitos a la vez: persona física con uso particular, vivienda de más de 2 años, y que el equipo no supere el 40% del presupuesto. En instalaciones de aire acondicionado el equipo suele superar ese 40%, así que se aplica el 21% general salvo que compres el equipo por separado y contrates solo la instalación.",
    },
    {
      question: "¿Cuánto cuesta retirar un equipo antiguo?",
      answer:
        "Si es para desecharlo, es una partida relativamente pequeña dentro del presupuesto. Si necesitas que lo desmonten para reutilizarlo en otra ubicación, suele costar más. Pídelo siempre como partida separada en el presupuesto.",
    },
    {
      question: "¿Se puede confiar en el precio que da la calculadora?",
      answer:
        "Es una estimación orientativa, no una tasación. Cada partida indica si sale de normativa oficial, de catálogo real de mercado o de una heurística propia — con el detalle completo en la metodología.",
    },
  ]);

  await upsertFaqs("analizar-presupuesto", [
    {
      question: "¿Esto significa que mi instalador me está cobrando de más?",
      answer:
        "No necesariamente. Un presupuesto por encima del rango puede deberse a materiales de más calidad, dificultad de acceso, garantías incluidas o desplazamiento. La herramienta señala una diferencia, no juzga al profesional.",
    },
    {
      question: "¿Qué partidas debería pedir que me desglosen?",
      answer:
        "Como mínimo: equipo (marca y modelo), mano de obra/instalación, metros de línea frigorífica incluidos, y si se incluye la retirada del equipo antiguo y el certificado de la instalación.",
    },
    {
      question: "¿Necesito subir el PDF del presupuesto?",
      answer:
        "No. Escribes las partidas principales tú mismo (nombre, categoría e importe) — no hace falta ni cuenta ni subir ningún archivo.",
    },
  ]);

  console.log("Migración de contenido completada.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
