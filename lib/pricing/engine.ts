import {
  AJUSTE_ZONA,
  CONDUCTOS_TOTAL,
  EQUIPO,
  EXTRAS,
  INSTALACION_BASE,
  METHODOLOGY_VERSION,
  METROS_LINEA_INCLUIDOS,
  UMBRAL_RITE_KW,
} from "./data";
import type {
  CalculatorInput,
  ComparisonResult,
  DeclaredBudget,
  EstimationLineItem,
  EstimationResult,
  RiteInfo,
  Verdict,
} from "./types";

function scaleRange<T extends { min: number; max: number }>(range: T, factor: number): T {
  return { ...range, min: Math.round(range.min * factor), max: Math.round(range.max * factor) };
}

function sumRanges(ranges: { min: number; max: number }[]) {
  return ranges.reduce(
    (acc, r) => ({ min: acc.min + r.min, max: acc.max + r.max }),
    { min: 0, max: 0 },
  );
}

function getRite(potenciaKw: number): RiteInfo {
  if (potenciaKw > UMBRAL_RITE_KW) {
    return {
      requiereMemoriaTecnica: true,
      requiereRegistroCCAA: true,
      mensaje:
        `Con ${potenciaKw} kW superas el umbral de ${UMBRAL_RITE_KW} kW del RITE: la normativa exige memoria ` +
        "técnica (en vez de proyecto completo, si no superas los 70 kW) y registro del certificado ante tu " +
        "Comunidad Autónoma. Pregunta a tu instalador si este trámite está incluido en el presupuesto.",
    };
  }
  return {
    requiereMemoriaTecnica: false,
    requiereRegistroCCAA: false,
    mensaje:
      `Por debajo de ${UMBRAL_RITE_KW} kW, el RITE no exige documentación técnica adicional para esta instalación.`,
  };
}

export function calculateEstimation(input: CalculatorInput): EstimationResult {
  const advertencias: string[] = [];
  const lineItems: EstimationLineItem[] = [];
  const zonaAjuste = AJUSTE_ZONA[input.zona];

  if (input.systemType === "conductos") {
    // Los conductos se modelan como paquete completo, no por partidas.
    const base = CONDUCTOS_TOTAL.sinPreinstalacion;
    lineItems.push({
      key: "conductos-total",
      label: "Equipo + instalación por conductos (paquete completo)",
      range: base,
      siempreIncluido: true,
    });
    advertencias.push(
      "Para instalaciones por conductos no desglosamos partidas: el mercado no publica un catálogo " +
        "detallado por metro/partida como sí existe para split. El rango es el total de mercado observado.",
    );
    const totalConductos = scaleRange(base, 1 + zonaAjuste.pct);
    return {
      input,
      totalRange: totalConductos,
      lineItems,
      rite: getRite(input.potenciaKw),
      methodologyVersion: METHODOLOGY_VERSION,
      advertencias,
    };
  }

  const equipo = EQUIPO[input.systemType][input.gama];
  const instalacionBase = INSTALACION_BASE[input.systemType];

  lineItems.push({ key: "equipo", label: "Equipo (compra)", range: equipo, siempreIncluido: true });
  lineItems.push({
    key: "instalacion-base",
    label: `Instalación base (incluye hasta ${METROS_LINEA_INCLUIDOS} m de línea frigorífica)`,
    range: instalacionBase,
    siempreIncluido: true,
  });

  if (input.metrosLineaFrigorificaExtra > 0) {
    const extra = scaleRange(EXTRAS.metroLineaFrigorificaAdicional, input.metrosLineaFrigorificaExtra);
    lineItems.push({
      key: "linea-extra",
      label: `${input.metrosLineaFrigorificaExtra} m adicionales de línea frigorífica`,
      range: extra,
      siempreIncluido: false,
    });
    const electricaExtra = scaleRange(EXTRAS.metroLineaElectricaAdicional, input.metrosLineaFrigorificaExtra);
    lineItems.push({
      key: "electrica-extra",
      label: "Línea eléctrica de interconexión adicional (mismo recorrido)",
      range: electricaExtra,
      siempreIncluido: false,
    });
  }

  if (input.canaletaVistaMetros > 0) {
    lineItems.push({
      key: "canaleta",
      label: `Canaleta vista (${input.canaletaVistaMetros} m)`,
      range: scaleRange(EXTRAS.metroCanaletaVista, input.canaletaVistaMetros),
      siempreIncluido: false,
    });
  }

  if (input.necesitaBombaCondensados) {
    lineItems.push({
      key: "bomba-condensados",
      label: "Bomba de condensados (si no hay desagüe por gravedad)",
      range: EXTRAS.bombaCondensados,
      siempreIncluido: false,
    });
  }

  if (input.retiradaEquipo === "desechar") {
    lineItems.push({
      key: "retirada-desechar",
      label: "Retirada de equipo antiguo (a punto autorizado)",
      range: EXTRAS.retiradaEquipoDesechar,
      siempreIncluido: false,
    });
  } else if (input.retiradaEquipo === "reutilizar") {
    lineItems.push({
      key: "retirada-reutilizar",
      label: "Desmontaje de equipo antiguo para reutilizar en otra ubicación",
      range: EXTRAS.retiradaEquipoReutilizar,
      siempreIncluido: false,
    });
  }

  if (input.instalacionElectricaDedicada) {
    lineItems.push({
      key: "electrica-dedicada",
      label: "Circuito eléctrico dedicado nuevo",
      range: EXTRAS.instalacionElectricaDedicada,
      siempreIncluido: false,
    });
  }

  if (input.accesoDificil) {
    lineItems.push({
      key: "acceso-dificil",
      label: "Dificultad de acceso (altura, fachada sin acceso interior)",
      range: EXTRAS.accesoDificil,
      siempreIncluido: false,
    });
    advertencias.push(
      "El sobrecoste por dificultad de acceso no tiene una cifra de mercado consolidada: el rango mostrado " +
        "es orientativo y amplio a propósito. Pide que te lo desglosen expresamente.",
    );
  }

  if (zonaAjuste.pct > 0) {
    advertencias.push(
      "El ajuste por zona (Madrid/Cataluña) se basa en una señal de mercado débil, sin metodología pública " +
        "verificable. Trátalo como orientativo, no como un dato preciso.",
    );
  }

  const subtotal = sumRanges(lineItems.map((li) => li.range));
  const totalRange = scaleRange(subtotal, 1 + zonaAjuste.pct);

  return {
    input,
    totalRange,
    lineItems,
    rite: getRite(input.potenciaKw),
    methodologyVersion: METHODOLOGY_VERSION,
    advertencias,
  };
}

const POSIBLES_RAZONES_ENCIMA = [
  "Equipo de una gama superior a la considerada en la estimación (marca, eficiencia energética, nivel de ruido).",
  "Dificultad de instalación no capturada en el formulario (accesos complicados, fachada protegida, altura).",
  "Trabajos adicionales incluidos que no se han indicado (obra, refuerzo de instalación eléctrica, andamiaje).",
  "Desplazamiento o urgencia del servicio.",
  "Garantía ampliada o mantenimiento incluido en el precio.",
];

const POSIBLES_RAZONES_DEBAJO = [
  "Puede faltar alcance: revisa que el presupuesto incluya retirada del equipo antiguo, materiales y puesta en marcha.",
  "Equipo de gama más económica de lo esperado.",
  "Posible ausencia de garantía por escrito o de certificado/boletín de la instalación.",
];

const PREGUNTAS_BASE = [
  "¿El precio incluye la retirada y reciclaje del equipo antiguo?",
  "¿Cuántos metros de línea frigorífica están incluidos en el precio, y cuánto cuesta cada metro adicional?",
  "¿Qué marca y modelo exacto de equipo se va a instalar?",
  "¿El presupuesto incluye el certificado/boletín de la instalación?",
  "¿Qué garantía tiene la instalación (no solo el equipo) y quién responde si falla en los primeros meses?",
];

function verdictFromRange(total: number, range: { min: number; max: number }): { verdict: Verdict; desviacionPct: number } {
  if (total > range.max) {
    return { verdict: "por_encima", desviacionPct: (total - range.max) / range.max };
  }
  if (total < range.min) {
    return { verdict: "por_debajo", desviacionPct: (range.min - total) / range.min };
  }
  return { verdict: "dentro_de_rango", desviacionPct: 0 };
}

export function analyzeBudget(input: CalculatorInput, declared: DeclaredBudget): ComparisonResult {
  const estimation = calculateEstimation(input);
  const { verdict, desviacionPct } = verdictFromRange(declared.total, estimation.totalRange);
  const desviacionAbsoluta =
    verdict === "por_encima"
      ? declared.total - estimation.totalRange.max
      : verdict === "por_debajo"
        ? estimation.totalRange.min - declared.total
        : 0;

  const lineVerdicts = [];

  if (declared.equipo !== undefined) {
    const equipoRange =
      input.systemType === "conductos"
        ? estimation.totalRange // conductos no desglosa equipo aparte
        : EQUIPO[input.systemType][input.gama];
    lineVerdicts.push({
      key: "equipo",
      label: "Equipo",
      declarado: declared.equipo,
      rangoEsperado: equipoRange,
      estado: (declared.equipo > equipoRange.max ? "por_encima" : "dentro") as "dentro" | "por_encima",
      desviacionPct: declared.equipo > equipoRange.max ? (declared.equipo - equipoRange.max) / equipoRange.max : 0,
    });
  }

  const preguntasRecomendadas = [...PREGUNTAS_BASE];
  if (estimation.rite.requiereRegistroCCAA) {
    preguntasRecomendadas.unshift(
      "Esta instalación supera 5 kW: ¿el presupuesto incluye la memoria técnica y el registro ante la Comunidad Autónoma?",
    );
  }

  return {
    estimation,
    declared,
    verdict,
    desviacionPct,
    desviacionAbsoluta,
    lineVerdicts,
    posiblesRazones: verdict === "por_encima" ? POSIBLES_RAZONES_ENCIMA : verdict === "por_debajo" ? POSIBLES_RAZONES_DEBAJO : [],
    preguntasRecomendadas,
  };
}

/** Heurística de dimensionamiento (100 fg/m², 130 si mucho vidrio). Confianza C — declarada como tal en la UI. */
export function estimatePotenciaKwFromSuperficie(superficieM2: number, muchoVidrioOSur: boolean): number {
  const frigoriasPorM2 = muchoVidrioOSur ? 130 : 100;
  const frigorias = superficieM2 * frigoriasPorM2;
  const kw = frigorias / 860;
  return Math.round(kw * 10) / 10;
}
