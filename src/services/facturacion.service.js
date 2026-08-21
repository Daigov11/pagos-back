import { getFacturacion } from './externalApi.service.js';

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = { rangoKey: null, mapa: null, timestamp: 0 };

/** "DD-MM-YYYY" (formato real de pago.fechaEmitido) -> Date. */
function parseFechaEmitido(fechaEmitido) {
  const [d, m, y] = (fechaEmitido ?? '').split('-').map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function formatFecha(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * La factura de un equipo puede emitirse en un mes distinto al de la orden de servicio
 * (ej. OS de febrero facturada recien en marzo), asi que el rango de busqueda en
 * /Facturacion se calcula a partir de la fecha REAL de emision de los comprobantes que
 * hay que resolver (con unos dias de margen), nunca del periodo de la venta.
 */
function calcularRangoBusqueda(comprobantes) {
  const fechas = comprobantes.map((c) => parseFechaEmitido(c.fechaEmitido)).filter(Boolean);
  if (fechas.length === 0) return null;

  const MARGEN_DIAS = 3;
  const minMs = Math.min(...fechas.map((f) => f.getTime())) - MARGEN_DIAS * 86400000;
  const maxMs = Math.max(...fechas.map((f) => f.getTime())) + MARGEN_DIAS * 86400000;
  return { fechaInicio: formatFecha(new Date(minMs)), fechaFin: formatFecha(new Date(maxMs)) };
}

async function obtenerMapaFacturacion(token, rango) {
  const key = `${rango.fechaInicio}_${rango.fechaFin}`;
  const ahora = Date.now();
  if (cache.mapa && cache.rangoKey === key && ahora - cache.timestamp < CACHE_TTL_MS) {
    return cache.mapa;
  }

  const filas = await getFacturacion(token, rango);
  const mapa = new Map(filas.map((f) => [f.nroComprobante, f]));
  cache = { rangoKey: key, mapa, timestamp: ahora };
  return mapa;
}

/**
 * Dado un listado de { nroComprobante, fechaEmitido } (de pagos "Administrativo Equipo"
 * de una o mas ordenes), devuelve las lineas de detalle reales (cantidad/nombre/precio)
 * tal cual aparecen en la factura, para mostrarlas de referencia al vendedor. No confia
 * en este texto libre para calcular comision (ver comisionSistema.js / equiposComision.js)
 * porque puede ser ambiguo (ej. "ALL IN ONE ..." matchea varios productos con distinta
 * comision) — el vendedor confirma manualmente el item exacto del catalogo.
 */
export async function obtenerDetalleFacturasEquipo(token, comprobantes) {
  if (!comprobantes || comprobantes.length === 0) return [];

  const rango = calcularRangoBusqueda(comprobantes);
  if (!rango) return [];

  const mapa = await obtenerMapaFacturacion(token, rango);

  return comprobantes.flatMap(({ nroComprobante }) => {
    const factura = mapa.get(nroComprobante);
    if (!factura) return [];
    return (factura.detalle ?? []).map((linea) => ({
      nroComprobante,
      cantidad: linea.cantidad,
      nombre: linea.nombre,
      precio: linea.precio,
    }));
  });
}
