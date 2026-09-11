import { RITE_UMBRAL_KW } from "./seed-data";

export interface RiteInfo {
  superaUmbral: boolean;
  mensaje: string;
}

/**
 * RITE (RD 1027/2007 + RD 178/2021): por debajo de 5 kW no se exige
 * documentación técnica; por encima, memoria técnica y registro ante la
 * Comunidad Autónoma. Es una norma, igual que el IVA: vive en código, no en
 * `pricing_factors`, porque no es un precio de mercado.
 */
export function evaluateRite(potenciaKw: number): RiteInfo {
  const superaUmbral = potenciaKw > RITE_UMBRAL_KW;
  return {
    superaUmbral,
    mensaje: superaUmbral
      ? `Con ${potenciaKw} kW superas el umbral de ${RITE_UMBRAL_KW} kW del RITE: la normativa exige memoria ` +
        "técnica (en vez de proyecto completo, si no superas los 70 kW) y registro del certificado ante tu " +
        "Comunidad Autónoma. Pregunta a tu instalador si este trámite está incluido en el presupuesto."
      : `Por debajo de ${RITE_UMBRAL_KW} kW, el RITE no exige documentación técnica adicional para esta instalación.`,
  };
}
