/**
 * Ayuda de dimensionamiento (frigorías/m²). Heurística de sector muy
 * extendida, sin respaldo normativo — se ofrece como ayuda opcional en el
 * formulario, nunca como un dato objetivo (confianza C, ver docs/01).
 */
export function estimatePotenciaKwFromSuperficie(superficieM2: number, muchoVidrioOSur: boolean): number {
  const frigoriasPorM2 = muchoVidrioOSur ? 130 : 100;
  const frigorias = superficieM2 * frigoriasPorM2;
  const kw = frigorias / 860;
  return Math.round(kw * 10) / 10;
}
