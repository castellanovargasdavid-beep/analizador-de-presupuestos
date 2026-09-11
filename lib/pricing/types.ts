/**
 * Tipos del motor de estimación — Aire acondicionado / Instalación.
 *
 * Cada rango de precio lleva su propio nivel de confianza (ver docs/01):
 *  A = fuente externa verificable (normativa, catálogo real de un actor de mercado)
 *  B = fuente de mercado sin metodología pública robusta (agregadores)
 *  C = heurística de sector / extrapolación nuestra, sin respaldo directo
 *
 * El motor nunca colapsa esta distinción: se propaga hasta la UI.
 */

export type Confidence = "A" | "B" | "C";

export interface SourcedRange {
  min: number;
  max: number;
  confidence: Confidence;
  /** Explicación breve de dónde sale el número, para mostrar en la UI. */
  source: string;
}

export type SystemType = "split-1x1" | "split-2x1" | "split-3x1" | "conductos";

export type Gama = "economica" | "media" | "premium";

export type RetiradaEquipo = "no" | "desechar" | "reutilizar";

export type ZonaPrecio = "madrid-cataluna" | "resto-espana";

export interface CalculatorInput {
  systemType: SystemType;
  gama: Gama;
  /** Potencia en kW. Si no se conoce, se puede derivar de superficieM2. */
  potenciaKw: number;
  metrosLineaFrigorificaExtra: number;
  retiradaEquipo: RetiradaEquipo;
  instalacionElectricaDedicada: boolean;
  canaletaVistaMetros: number;
  necesitaBombaCondensados: boolean;
  accesoDificil: boolean;
  zona: ZonaPrecio;
}

export interface EstimationLineItem {
  key: string;
  label: string;
  range: SourcedRange;
  /** false = coste condicional que solo aplica si el usuario marcó esa opción */
  siempreIncluido: boolean;
}

export interface RiteInfo {
  requiereMemoriaTecnica: boolean;
  requiereRegistroCCAA: boolean;
  mensaje: string;
}

export interface EstimationResult {
  input: CalculatorInput;
  totalRange: { min: number; max: number };
  lineItems: EstimationLineItem[];
  rite: RiteInfo;
  methodologyVersion: string;
  advertencias: string[];
}

export type Verdict = "dentro_de_rango" | "por_encima" | "por_debajo";

export interface DeclaredBudget {
  total: number;
  equipo?: number;
  instalacionManoObra?: number;
  materialesExtras?: number;
  metrosLineaDeclarados?: number;
}

export interface BudgetLineVerdict {
  key: string;
  label: string;
  declarado: number;
  rangoEsperado: { min: number; max: number };
  estado: "dentro" | "por_encima" | "no_declarado";
  desviacionPct: number | null;
}

export interface ComparisonResult {
  estimation: EstimationResult;
  declared: DeclaredBudget;
  verdict: Verdict;
  desviacionPct: number;
  desviacionAbsoluta: number;
  lineVerdicts: BudgetLineVerdict[];
  posiblesRazones: string[];
  preguntasRecomendadas: string[];
}
