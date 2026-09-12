/**
 * Plantilla "Preguntas": una página por intención de pregunta única y
 * real (no relleno). El registro es la fuente de verdad; la ruta
 * `/preguntas/[slug]` genera solo estas páginas (`generateStaticParams`),
 * nunca una combinatoria abierta — añadir una pregunta nueva es añadir una
 * entrada aquí, no crear cientos.
 */
export interface PreguntaEntry {
  slug: string;
  pregunta: string;
  respuestaCorta: string;
  detalle: string[];
  relacionadas: { href: string; label: string }[];
}

export const PREGUNTAS: PreguntaEntry[] = [
  {
    slug: "necesito-certificado-rite-aire-acondicionado",
    pregunta: "¿Necesito el certificado RITE para instalar aire acondicionado?",
    respuestaCorta:
      "Solo si la potencia nominal de tu instalación supera los 5 kW. Por debajo de ese umbral, el RITE no exige documentación técnica adicional.",
    detalle: [
      "El RITE (Reglamento de Instalaciones Térmicas en los Edificios, RD 1027/2007 modificado por el RD 178/2021) fija un umbral de 5 kW de potencia nominal.",
      "Por debajo de 5 kW no se exige ni memoria técnica ni proyecto — es el caso habitual de un split de una sola unidad para una habitación.",
      "Entre 5 y 70 kW, una memoria técnica puede sustituir al proyecto completo. Por encima de 70 kW, se exige proyecto.",
      "Además, poner en servicio una instalación nueva o reformada requiere registrar el certificado ante tu Comunidad Autónoma — pregúntale a tu instalador si esto está incluido en el presupuesto.",
    ],
    relacionadas: [
      { href: "/aire-acondicionado/instalacion", label: "Calcular mi instalación" },
      { href: "/metodologia", label: "Ver metodología completa" },
    ],
  },
  {
    slug: "iva-10-o-21-instalacion-aire-acondicionado",
    pregunta: "¿Por qué mi presupuesto de aire acondicionado tiene IVA del 21% y no del 10%?",
    respuestaCorta:
      "Porque el 10% reducido exige tres requisitos a la vez, y en instalaciones de aire acondicionado el equipo suele superar el límite del 40% que impone uno de ellos.",
    detalle: [
      "El art. 91.Uno.2.10º de la Ley 37/1992 permite un IVA reducido del 10% en obras de renovación/reparación de vivienda particular.",
      "Los tres requisitos que deben cumplirse a la vez: el destinatario es una persona física que usa la vivienda para sí, la vivienda tiene más de 2 años, y los materiales aportados por la empresa no superan el 40% de la base imponible.",
      "En una instalación de aire acondicionado, el equipo (el 'material') suele representar más del 40% del total, así que aunque se cumplan los otros dos requisitos, se aplica el 21% general a todo el presupuesto.",
      "Una posible vía para acceder al 10%: comprar el equipo por separado y contratar solo la mano de obra de instalación, que si se factura aparte sí podría tributar al tipo reducido.",
    ],
    relacionadas: [
      { href: "/aire-acondicionado/instalacion", label: "Calcular mi instalación" },
      { href: "/aire-acondicionado/instalacion/analizar-presupuesto", label: "Analizar mi presupuesto" },
    ],
  },
  {
    slug: "cuanto-cuesta-retirar-aire-acondicionado-antiguo",
    pregunta: "¿Cuánto cuesta retirar un equipo de aire acondicionado antiguo?",
    respuestaCorta:
      "Depende de si el equipo se desecha o se desmonta para reutilizarlo en otra ubicación — son dos servicios distintos con precios distintos.",
    detalle: [
      "Retirar un equipo para desecharlo en un punto autorizado es la opción más habitual y más económica dentro del presupuesto total.",
      "Desmontar el equipo con cuidado para reinstalarlo en otra ubicación (por ejemplo, en una segunda vivienda) es un trabajo más delicado y suele costar más.",
      "Pide siempre que esta partida aparezca desglosada por separado en el presupuesto, no incluida de forma ambigua en 'instalación completa'.",
    ],
    relacionadas: [
      { href: "/guias/como-comparar-presupuestos-de-instalacion", label: "Cómo comparar presupuestos" },
      { href: "/aire-acondicionado/instalacion/analizar-presupuesto", label: "Analizar mi presupuesto" },
    ],
  },
];

export function getPregunta(slug: string): PreguntaEntry | undefined {
  return PREGUNTAS.find((p) => p.slug === slug);
}
