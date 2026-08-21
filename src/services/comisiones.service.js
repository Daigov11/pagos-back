import { getOrdenesServicio } from './externalApi.service.js';
import { obtenerDetalleFacturasEquipo } from './facturacion.service.js';
import { listByOrdenes } from '../db/comisionEquipos.repository.js';
import { comprobantesEquipo, montoEquipo } from '../utils/comision.js';
import {
  APIREVIEW_TRAMOS,
  META_COMISION_SISTEMAS,
  identificarComisionSistema,
} from '../config/comisionSistema.js';
import { namesMatch } from '../utils/normalize.js';
import { parsePlanPrice } from '../utils/planPricing.js';

export async function ventasDelUsuario(req, periodo) {
  const rows = await getOrdenesServicio(req.externalToken, periodo);
  const nombreUsuario = req.user?.nombrecompleto;
  return rows.filter((row) => namesMatch(row.ejecutivo, nombreUsuario));
}

function calcularDetalleBase(venta) {
  const montoVenta = parsePlanPrice(venta.nombrePlan);
  const match = identificarComisionSistema(venta.nombrePlan, venta.nTipoPlan, montoVenta);
  return {
    idOrdenServicio: venta.idOrdenServicio,
    numeroOs: venta.numeroOs,
    fechaFormat: venta.fechaFormat,
    cliente: venta.cliente,
    nombrePlan: venta.nombrePlan,
    nTipoPlan: venta.nTipoPlan,
    nEstado: venta.nEstado,
    montoVenta,
    rubro: match.rubro,
    tier: match.tier,
    mapeoEncontrado: match.mapeoEncontrado,
    comisionUnitariaSistema: match.comisionUnitaria,
    montoEquipoFacturado: montoEquipo(venta),
    comprobantesEquipo: comprobantesEquipo(venta),
  };
}

/**
 * Regla de negocio: para planes MENSUALES, solo la primera venta del periodo en cada
 * rubro genera comision (a precio completo); las demas ventas mensuales del mismo rubro
 * ese mismo mes quedan en 0 pero siguen sumando al monto de venta (meta). Semestral y
 * Anual siempre comisionan por tabla, sin este limite. Se ordena por idOrdenServicio
 * (secuencial) para determinar cual fue "la primera".
 */
function aplicarLimiteMensualPorRubro(detalle) {
  const rubrosMensualesYaComisionados = new Set();

  return detalle
    .slice()
    .sort((a, b) => a.idOrdenServicio - b.idOrdenServicio)
    .map((d) => {
      const periodicidad = (d.nTipoPlan ?? '').trim().toUpperCase();
      if (!d.mapeoEncontrado) return { ...d, comisionSistema: 0, mensualDuplicadoRubro: false };
      if (periodicidad !== 'MENSUAL') {
        return { ...d, comisionSistema: d.comisionUnitariaSistema, mensualDuplicadoRubro: false };
      }
      if (rubrosMensualesYaComisionados.has(d.rubro)) {
        return { ...d, comisionSistema: 0, mensualDuplicadoRubro: true };
      }
      rubrosMensualesYaComisionados.add(d.rubro);
      return { ...d, comisionSistema: d.comisionUnitariaSistema, mensualDuplicadoRubro: false };
    });
}

/** Comision escalonada por volumen acumulado de unidades APIREVIEW vendidas en el periodo. */
function aplicarTramosApireview(detalle) {
  return detalle
    .slice()
    .sort((a, b) => a.idOrdenServicio - b.idOrdenServicio)
    .map((d, index) => {
      const posicion = index + 1;
      const tramo = APIREVIEW_TRAMOS.find((t) => posicion <= t.hasta);
      return { ...d, comisionSistema: tramo.comisionUnitaria, mensualDuplicadoRubro: false };
    });
}

async function adjuntarEquipos(req, detalle, idOrdenesDelPeriodo) {
  const asignaciones = await listByOrdenes(idOrdenesDelPeriodo);
  const porOrden = new Map();
  for (const a of asignaciones) {
    const lista = porOrden.get(a.id_orden_servicio) ?? [];
    lista.push(a);
    porOrden.set(a.id_orden_servicio, lista);
  }

  const todosLosComprobantes = detalle.flatMap((d) => d.comprobantesEquipo);
  const lineasFactura = await obtenerDetalleFacturasEquipo(req.externalToken, todosLosComprobantes);
  const lineasPorNro = new Map();
  for (const linea of lineasFactura) {
    const lista = lineasPorNro.get(linea.nroComprobante) ?? [];
    lista.push(linea);
    lineasPorNro.set(linea.nroComprobante, lista);
  }

  return detalle.map((d) => {
    const equiposAsignados = porOrden.get(d.idOrdenServicio) ?? [];
    return {
      ...d,
      equiposAsignados,
      comisionEquipo: equiposAsignados.reduce((sum, a) => sum + Number(a.comision_total), 0),
      tieneEquipoSinAsignar: d.montoEquipoFacturado > 0 && equiposAsignados.length === 0,
      facturaEquipoDetalle: d.comprobantesEquipo.flatMap((c) => lineasPorNro.get(c.nroComprobante) ?? []),
    };
  });
}

export async function calcularResumenComision(req, periodo) {
  const ventas = await ventasDelUsuario(req, periodo);
  const detalleBase = ventas.map(calcularDetalleBase);

  const apireview = detalleBase.filter((d) => d.rubro === 'APIREVIEW');
  const otros = detalleBase.filter((d) => d.rubro !== 'APIREVIEW');

  const detalleConComisionSistema = [...aplicarLimiteMensualPorRubro(otros), ...aplicarTramosApireview(apireview)];
  const detalle = await adjuntarEquipos(
    req,
    detalleConComisionSistema,
    ventas.map((v) => v.idOrdenServicio)
  );

  const sumaVentaSistemas = Number(detalle.reduce((sum, d) => sum + d.montoVenta, 0).toFixed(2));
  const metaAlcanzada = sumaVentaSistemas >= META_COMISION_SISTEMAS;
  const faltanteParaMeta = Math.max(0, Number((META_COMISION_SISTEMAS - sumaVentaSistemas).toFixed(2)));

  // La comision de sistemas solo se genera una vez que se cruza la meta; ahi aplica
  // sobre el 100% de lo vendido en el periodo (no solo el excedente). La comision de
  // equipos se paga siempre, independiente de si se llego a la meta o no.
  const comisionSistemas = metaAlcanzada
    ? Number(detalle.reduce((sum, d) => sum + d.comisionSistema, 0).toFixed(2))
    : 0;
  const comisionEquipos = Number(detalle.reduce((sum, d) => sum + d.comisionEquipo, 0).toFixed(2));

  return {
    periodo,
    meta: META_COMISION_SISTEMAS,
    sumaVentaSistemas,
    metaAlcanzada,
    faltanteParaMeta,
    comisionSistemas,
    comisionEquipos,
    comisionTotal: Number((comisionSistemas + comisionEquipos).toFixed(2)),
    cantidadVentas: detalle.length,
    ventas: detalle,
  };
}
