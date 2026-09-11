/**
 * Fuente única de verdad de los datos de precio de "Instalación de aire
 * acondicionado" (docs/01). `db/seed.ts` inserta esto en Postgres; los
 * tests del motor (`engine.test.ts`) consumen exactamente lo mismo como
 * fixture, para que un test nunca pueda divergir en silencio de lo que
 * realmente se siembra en la base de datos.
 */
import type { FactorCondition } from "./condition-types";
import type { Confidence } from "./types";

export const SPLIT_SYSTEM_TYPES = ["split-1x1", "split-2x1", "split-3x1"] as const;

/** Umbral RITE (RD 1027/2007 + RD 178/2021) — ver DATA_SOURCES.rite. */
export const RITE_UMBRAL_KW = 5;

export const DATA_SOURCES = {
  leroyMerlin: {
    name: "Catálogo de servicios de instalación de Leroy Merlin",
    url: "https://www.leroymerlin.es/servicios/instalacion-aire-acondicionado/",
    sourceType: "catalogo_real" as const,
    confidence: "A" as Confidence,
    geographicScope: "España (nacional, precio de catálogo de un retailer real)",
    retrievedOn: "2026-09-11",
    notes:
      "Precio real de catálogo, no una estimación de tercero. Discrepancia sin resolver entre 210€ y 249€ " +
      "para el tramo base hasta 4000 BTU: se usa el rango 210-249 hasta verificación puntual adicional.",
  },
  agregadores: {
    name: "Agregadores de mercado (Cronoshare, Habitissimo) y prensa de consumo (OCU)",
    sourceType: "mercado" as const,
    confidence: "B" as Confidence,
    geographicScope: "España (nacional, sin desglose por provincia con metodología pública)",
    retrievedOn: "2026-09-11",
    notes:
      "Metodología de estos agregadores no es pública (sin tamaño de muestra ni fecha de corte declarados). " +
      "Se usan como rango de contraste de mercado, nunca como única fuente.",
  },
  extrapolacion: {
    name: "Extrapolación propia a partir del caso split 1x1",
    sourceType: "heuristica_propia" as const,
    confidence: "C" as Confidence,
    geographicScope: "España (heurística, no una medición directa)",
    retrievedOn: "2026-09-11",
    notes: "Escalado de precio para multisplit de 2 y 3 unidades sin fuente de mercado directa para ese tramo.",
  },
  rite: {
    name: "RITE — RD 1027/2007 y RD 178/2021 (umbral 5 kW)",
    url: "https://www.boe.es/buscar/doc.php?id=BOE-A-2021-4572",
    sourceType: "oficial" as const,
    confidence: "A" as Confidence,
    geographicScope: "España (normativa estatal)",
    publishedOn: "2021-03-23",
    retrievedOn: "2026-09-11",
    notes:
      "Menos de 5 kW: sin documentación exigida. Entre 5 y 70 kW: memoria técnica sustituye al proyecto. " +
      "Registro del certificado ante la Comunidad Autónoma al poner en servicio.",
  },
  aeat: {
    name: "Agencia Tributaria — tipo de IVA en obras de renovación/reparación de vivienda",
    url: "https://sede.agenciatributaria.gob.es/Sede/iva/iva-operaciones-inmobiliarias/que-tipo-se-aplica-obras-viviendas/obras-construccion-rehabilitacion.html",
    sourceType: "oficial" as const,
    confidence: "A" as Confidence,
    geographicScope: "España (normativa estatal, art. 91.Uno.2.10º Ley 37/1992)",
    retrievedOn: "2026-09-11",
    notes:
      "10% si: destinatario persona física que usa la vivienda para sí, vivienda con más de 2 años, y " +
      "materiales aportados por la empresa <=40% de la base imponible. Si falla un requisito, tributa al 21%.",
  },
  canaletaRetail: {
    name: "Precio de catálogo de instaladores/retailers de material (canaleta, línea adicional)",
    sourceType: "catalogo_real" as const,
    confidence: "B" as Confidence,
    geographicScope: "España",
    retrievedOn: "2026-09-11",
    notes: "Convergencia entre varios instaladores para el precio de canaleta vista por metro.",
  },
};

export type DataSourceKey = keyof typeof DATA_SOURCES;

export interface SeedFactorDef {
  key: string;
  label: string;
  kind: "base" | "multiplier" | "additive";
  groupKey: string;
  perUnitOfQuantity?: string;
  valueMin: number;
  valueMax: number;
  confidence: Confidence;
  condition: FactorCondition | null;
  sourceKey: DataSourceKey;
  notes?: string;
}

/**
 * `zona-madrid-cataluna` referencia los slugs reales de región, que se
 * resuelven en `db/seed.ts` tras insertar las 19 CCAA (por eso ahí es
 * `"__MADRID__"` / `"__CATALUNA__"`: marcadores que el seed sustituye por
 * el slug real antes de insertar la fila).
 */
export const AIRE_ACONDICIONADO_INSTALACION_FACTORS: SeedFactorDef[] = [
  // --- Equipo (base), por tipo de sistema x gama ---
  { key: "equipo-split-1x1-economica", label: "Equipo (compra) — split 1x1, económica", kind: "base", groupKey: "equipo", valueMin: 350, valueMax: 550, confidence: "B", sourceKey: "agregadores", condition: { all: [{ field: "systemType", op: "eq", value: "split-1x1" }, { field: "materialLevel", op: "eq", value: "economica" }] } },
  { key: "equipo-split-1x1-media", label: "Equipo (compra) — split 1x1, media", kind: "base", groupKey: "equipo", valueMin: 550, valueMax: 900, confidence: "B", sourceKey: "agregadores", condition: { all: [{ field: "systemType", op: "eq", value: "split-1x1" }, { field: "materialLevel", op: "eq", value: "media" }] } },
  { key: "equipo-split-1x1-premium", label: "Equipo (compra) — split 1x1, premium", kind: "base", groupKey: "equipo", valueMin: 900, valueMax: 1600, confidence: "B", sourceKey: "agregadores", condition: { all: [{ field: "systemType", op: "eq", value: "split-1x1" }, { field: "materialLevel", op: "eq", value: "premium" }] } },

  { key: "equipo-split-2x1-economica", label: "Equipo (compra) — multisplit 2x1, económica", kind: "base", groupKey: "equipo", valueMin: 900, valueMax: 1300, confidence: "C", sourceKey: "extrapolacion", condition: { all: [{ field: "systemType", op: "eq", value: "split-2x1" }, { field: "materialLevel", op: "eq", value: "economica" }] } },
  { key: "equipo-split-2x1-media", label: "Equipo (compra) — multisplit 2x1, media", kind: "base", groupKey: "equipo", valueMin: 1300, valueMax: 2000, confidence: "C", sourceKey: "extrapolacion", condition: { all: [{ field: "systemType", op: "eq", value: "split-2x1" }, { field: "materialLevel", op: "eq", value: "media" }] } },
  { key: "equipo-split-2x1-premium", label: "Equipo (compra) — multisplit 2x1, premium", kind: "base", groupKey: "equipo", valueMin: 2000, valueMax: 3200, confidence: "C", sourceKey: "extrapolacion", condition: { all: [{ field: "systemType", op: "eq", value: "split-2x1" }, { field: "materialLevel", op: "eq", value: "premium" }] } },

  { key: "equipo-split-3x1-economica", label: "Equipo (compra) — multisplit 3x1, económica", kind: "base", groupKey: "equipo", valueMin: 1400, valueMax: 1900, confidence: "C", sourceKey: "extrapolacion", condition: { all: [{ field: "systemType", op: "eq", value: "split-3x1" }, { field: "materialLevel", op: "eq", value: "economica" }] } },
  { key: "equipo-split-3x1-media", label: "Equipo (compra) — multisplit 3x1, media", kind: "base", groupKey: "equipo", valueMin: 1900, valueMax: 2900, confidence: "C", sourceKey: "extrapolacion", condition: { all: [{ field: "systemType", op: "eq", value: "split-3x1" }, { field: "materialLevel", op: "eq", value: "media" }] } },
  { key: "equipo-split-3x1-premium", label: "Equipo (compra) — multisplit 3x1, premium", kind: "base", groupKey: "equipo", valueMin: 2900, valueMax: 4500, confidence: "C", sourceKey: "extrapolacion", condition: { all: [{ field: "systemType", op: "eq", value: "split-3x1" }, { field: "materialLevel", op: "eq", value: "premium" }] } },

  // --- Conductos: paquete completo (equipo + instalación), sin desglose ---
  { key: "conductos-paquete", label: "Equipo + instalación por conductos (paquete completo)", kind: "base", groupKey: "paquete_conductos", valueMin: 2400, valueMax: 6500, confidence: "B", sourceKey: "agregadores", condition: { field: "systemType", op: "eq", value: "conductos" } },

  // --- Instalación base (mano de obra), por tipo de sistema ---
  { key: "instalacion-base-split-1x1", label: "Instalación base (incluye hasta 3 m de línea frigorífica)", kind: "base", groupKey: "mano_obra", valueMin: 210, valueMax: 249, confidence: "A", sourceKey: "leroyMerlin", condition: { field: "systemType", op: "eq", value: "split-1x1" } },
  { key: "instalacion-base-split-2x1", label: "Instalación base (incluye hasta 3 m de línea frigorífica)", kind: "base", groupKey: "mano_obra", valueMin: 350, valueMax: 450, confidence: "C", sourceKey: "extrapolacion", condition: { field: "systemType", op: "eq", value: "split-2x1" } },
  { key: "instalacion-base-split-3x1", label: "Instalación base (incluye hasta 3 m de línea frigorífica)", kind: "base", groupKey: "mano_obra", valueMin: 500, valueMax: 650, confidence: "C", sourceKey: "extrapolacion", condition: { field: "systemType", op: "eq", value: "split-3x1" } },

  // --- Extras aditivos, por metro ---
  { key: "linea-frigorifica-extra", label: "Metro adicional de línea frigorífica", kind: "additive", groupKey: "mano_obra", perUnitOfQuantity: "metrosLineaFrigorificaExtra", valueMin: 29, valueMax: 29, confidence: "A", sourceKey: "leroyMerlin", condition: { field: "systemType", op: "in", values: [...SPLIT_SYSTEM_TYPES] } },
  { key: "linea-electrica-extra", label: "Metro adicional de línea eléctrica de interconexión", kind: "additive", groupKey: "mano_obra", perUnitOfQuantity: "metrosLineaFrigorificaExtra", valueMin: 6, valueMax: 6, confidence: "A", sourceKey: "leroyMerlin", condition: { field: "systemType", op: "in", values: [...SPLIT_SYSTEM_TYPES] } },
  { key: "canaleta-vista", label: "Canaleta vista", kind: "additive", groupKey: "extras", perUnitOfQuantity: "canaletaVistaMetros", valueMin: 10, valueMax: 15, confidence: "B", sourceKey: "canaletaRetail", condition: { field: "systemType", op: "in", values: [...SPLIT_SYSTEM_TYPES] } },

  // --- Extras aditivos, condicionales (flags) ---
  { key: "bomba-condensados", label: "Bomba de condensados", kind: "additive", groupKey: "extras", valueMin: 160, valueMax: 160, confidence: "A", sourceKey: "leroyMerlin", condition: { all: [{ field: "necesitaBombaCondensados", op: "truthy" }, { field: "systemType", op: "in", values: [...SPLIT_SYSTEM_TYPES] }] } },
  { key: "retirada-desechar", label: "Retirada de equipo antiguo (a punto autorizado)", kind: "additive", groupKey: "extras", valueMin: 90, valueMax: 150, confidence: "B", sourceKey: "leroyMerlin", condition: { field: "retiradaEquipo", op: "eq", value: "desechar" } },
  { key: "retirada-reutilizar", label: "Desmontaje de equipo antiguo para reutilizar en otra ubicación", kind: "additive", groupKey: "extras", valueMin: 200, valueMax: 400, confidence: "B", sourceKey: "agregadores", condition: { field: "retiradaEquipo", op: "eq", value: "reutilizar" } },
  { key: "electrica-dedicada", label: "Circuito eléctrico dedicado nuevo", kind: "additive", groupKey: "extras", valueMin: 150, valueMax: 350, confidence: "C", sourceKey: "extrapolacion", condition: { field: "instalacionElectricaDedicada", op: "truthy" } },
  { key: "acceso-dificil", label: "Dificultad de acceso (altura, fachada sin acceso interior)", kind: "additive", groupKey: "extras", valueMin: 150, valueMax: 400, confidence: "C", sourceKey: "extrapolacion", condition: { field: "accesoDificil", op: "truthy" } },

  // --- Ubicación (multiplicador). "__MADRID__"/"__CATALUNA__" se resuelven en db/seed.ts. ---
  { key: "zona-madrid-cataluna", label: "Ajuste por zona (Madrid/Cataluña)", kind: "multiplier", groupKey: "ubicacion", valueMin: 1.08, valueMax: 1.08, confidence: "C", sourceKey: "agregadores", condition: { field: "regionSlug", op: "in", values: ["__MADRID__", "__CATALUNA__"] }, notes: "Señal débil de variación por ciudad (Cronoshare), sin metodología pública declarada." },
];

export const VAT_RATES_DEF = [
  {
    scenario: "reducido_vivienda_particular",
    ratePct: 0.1,
    description:
      "Art. 91.Uno.2.10º Ley 37/1992: destinatario persona física para uso particular, vivienda con más de " +
      "2 años, y materiales aportados por la empresa que no superen el 40% de la base imponible.",
    sourceKey: "aeat" as DataSourceKey,
  },
  {
    scenario: "general",
    ratePct: 0.21,
    description: "Tipo general: se aplica si no se cumple alguno de los requisitos del tipo reducido.",
    sourceKey: "aeat" as DataSourceKey,
  },
];

export const UNCERTAINTY_BANDS_DEF = [
  {
    label: "Predominan fuentes verificables (A)",
    minConfidenceScore: 0.75,
    maxConfidenceScore: 1.0,
    paddingPct: 0.05,
    notes: "Normativa oficial o catálogo real de mercado.",
  },
  {
    label: "Mezcla de fuentes de mercado y verificables",
    minConfidenceScore: 0.45,
    maxConfidenceScore: 0.75,
    paddingPct: 0.1,
    notes: "Combinación de fuentes B y A.",
  },
  {
    label: "Predominan heurísticas propias (C)",
    minConfidenceScore: 0.0,
    maxConfidenceScore: 0.45,
    paddingPct: 0.18,
    notes: "Extrapolaciones sin fuente de mercado directa.",
  },
];
