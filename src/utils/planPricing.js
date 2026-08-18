/**
 * El precio del plan no viene como campo separado en orden-servicio, viene embebido
 * al final del texto de nombrePlan (ej: "TIENDA FACTURASAO MENSUAL/29" -> 29,
 * "PLAN RESTO BASICO TRIMESTRAL  350" -> 350). Es fragil si cambia el formato del texto.
 */
export function parsePlanPrice(nombrePlan) {
  const match = (nombrePlan ?? '').match(/(\d+(?:[.,]\d+)?)\s*$/);
  if (!match) return 0;
  return Number(match[1].replace(',', '.'));
}
