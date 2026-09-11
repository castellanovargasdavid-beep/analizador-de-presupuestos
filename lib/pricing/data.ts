/**
 * Datos base del motor de estimación — Aire acondicionado / Instalación.
 *
 * Fuente completa y clasificación de fiabilidad en
 * docs/01-investigacion-precios-aire-acondicionado.md. Este archivo es la
 * traducción a código de esa investigación: cada número cita su origen y su
 * nivel de confianza (A/B/C). No se ha añadido ningún dato que no estuviera
 * ya documentado allí.
 *
 * methodologyVersion: cuando estos números cambien, se incrementa. Cada
 * Estimation guardada referencia la versión con la que se calculó.
 */

import type { Gama, SourcedRange, SystemType, ZonaPrecio } from "./types";

export const METHODOLOGY_VERSION = "2026.09.0";

const LEROY_MERLIN = "Precio de catálogo real (Leroy Merlin, servicio de instalación)";
const AGREGADORES = "Rango triangulado entre agregadores de mercado (Cronoshare, Habitissimo) y fuentes independientes (OCU)";
const EXTRAPOLACION = "Extrapolación propia a partir del caso split 1x1, sin fuente de mercado directa para este tramo";

/** Coste del equipo (compra) según tipología y gama. Confianza B/C. */
export const EQUIPO: Record<SystemType, Record<Gama, SourcedRange>> = {
  "split-1x1": {
    economica: { min: 350, max: 550, confidence: "B", source: AGREGADORES },
    media: { min: 550, max: 900, confidence: "B", source: AGREGADORES },
    premium: { min: 900, max: 1600, confidence: "B", source: AGREGADORES },
  },
  "split-2x1": {
    economica: { min: 900, max: 1300, confidence: "C", source: EXTRAPOLACION },
    media: { min: 1300, max: 2000, confidence: "C", source: EXTRAPOLACION },
    premium: { min: 2000, max: 3200, confidence: "C", source: EXTRAPOLACION },
  },
  "split-3x1": {
    economica: { min: 1400, max: 1900, confidence: "C", source: EXTRAPOLACION },
    media: { min: 1900, max: 2900, confidence: "C", source: EXTRAPOLACION },
    premium: { min: 2900, max: 4500, confidence: "C", source: EXTRAPOLACION },
  },
  // Conductos se modela como paquete completo (equipo + instalación) — ver CONDUCTOS_TOTAL.
  conductos: {
    economica: { min: 0, max: 0, confidence: "C", source: "No aplica: ver rango total de conductos" },
    media: { min: 0, max: 0, confidence: "C", source: "No aplica: ver rango total de conductos" },
    premium: { min: 0, max: 0, confidence: "C", source: "No aplica: ver rango total de conductos" },
  },
};

/**
 * Conductos: al no existir desglose de catálogo por partida, se usa
 * directamente el rango total de mercado (equipo + instalación) según haya
 * o no preinstalación previa. Confianza B (Cronoshare/Habitissimo).
 */
export const CONDUCTOS_TOTAL = {
  conPreinstalacion: { min: 1500, max: 4000, confidence: "B" as const, source: AGREGADORES },
  sinPreinstalacion: { min: 2400, max: 6500, confidence: "B" as const, source: AGREGADORES },
};

/** Mano de obra/instalación base (incluye ~3m de línea frigorífica). */
export const INSTALACION_BASE: Record<Exclude<SystemType, "conductos">, SourcedRange> = {
  "split-1x1": { min: 210, max: 249, confidence: "A", source: LEROY_MERLIN },
  "split-2x1": { min: 350, max: 450, confidence: "C", source: EXTRAPOLACION },
  "split-3x1": { min: 500, max: 650, confidence: "C", source: EXTRAPOLACION },
};

/** Metros de línea frigorífica incluidos en la instalación base antes de facturar extra. */
export const METROS_LINEA_INCLUIDOS = 3;

export const EXTRAS = {
  metroLineaFrigorificaAdicional: { min: 29, max: 29, confidence: "A" as const, source: LEROY_MERLIN },
  metroLineaElectricaAdicional: { min: 6, max: 6, confidence: "A" as const, source: LEROY_MERLIN },
  metroCanaletaVista: { min: 10, max: 15, confidence: "B" as const, source: "Precio de catálogo de instaladores/retailers de material" },
  bombaCondensados: { min: 160, max: 160, confidence: "A" as const, source: LEROY_MERLIN },
  retiradaEquipoDesechar: { min: 90, max: 150, confidence: "B" as const, source: `${LEROY_MERLIN} + agregadores` },
  retiradaEquipoReutilizar: { min: 200, max: 400, confidence: "B" as const, source: AGREGADORES },
  instalacionElectricaDedicada: { min: 150, max: 350, confidence: "C" as const, source: "Necesidad normativa real (circuito dedicado REBT); importe sin fuente de catálogo directa" },
  accesoDificil: { min: 150, max: 400, confidence: "C" as const, source: "Mención cualitativa recurrente en fuentes de mercado, sin consenso numérico" },
};

/**
 * Ajuste regional. Señal débil (solo Cronoshare aporta variación por
 * ciudad, sin metodología pública) — por eso el ajuste es un porcentaje
 * amplio y no una tabla precisa por provincia. Confianza C.
 */
export const AJUSTE_ZONA: Record<ZonaPrecio, { pct: number; confidence: "C"; source: string }> = {
  "madrid-cataluna": {
    pct: 0.08,
    confidence: "C",
    source: "Señal débil de variación por ciudad (Cronoshare), sin metodología pública declarada",
  },
  "resto-espana": { pct: 0, confidence: "C", source: "Sin señal suficiente para ajustar; se usa el rango nacional" },
};

/** Umbral normativo RITE (RD 1027/2007 + RD 178/2021). Confianza A. */
export const UMBRAL_RITE_KW = 5;
