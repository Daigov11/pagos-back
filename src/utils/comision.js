const ORIGEN_PAGO_EQUIPO = 'ADMINISTRATIVO EQUIPO';

function pagosEquipo(venta) {
  if (!Array.isArray(venta.pagos)) return [];
  return venta.pagos.filter((p) => (p.origen ?? '').trim().toUpperCase() === ORIGEN_PAGO_EQUIPO);
}

export function montoEquipo(venta) {
  return pagosEquipo(venta).reduce((sum, p) => sum + Number(p.total ?? 0), 0);
}

/**
 * Comprobantes de equipo de una orden (nroComprobante + su fechaEmitido real), para
 * buscarlos en /Facturacion. OJO: la factura de equipo puede emitirse en un mes distinto
 * al de la orden de servicio (ej. OS de febrero facturada en marzo), asi que hay que
 * consultar /Facturacion por la fecha real del comprobante, NUNCA por el periodo de la
 * venta — si no, se pierde el detalle de items en esos casos.
 */
export function comprobantesEquipo(venta) {
  return pagosEquipo(venta)
    .filter((p) => p.nroComprobante)
    .map((p) => ({ nroComprobante: p.nroComprobante, fechaEmitido: p.fechaEmitido }));
}
