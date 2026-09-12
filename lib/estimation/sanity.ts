/**
 * Última barrera antes de pintar un resultado: el motor y sus tests ya
 * garantizan que esto nunca ocurre en circunstancias normales, pero una
 * fila corrupta (edición manual en la base de datos, un bug futuro) no
 * debería traducirse en una UI rota — mejor un estado de error explícito
 * ("resultado imposible") que un rango negativo o invertido en pantalla.
 */
export function isPlausibleRange(min: number, max: number): boolean {
  return Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max >= min;
}
