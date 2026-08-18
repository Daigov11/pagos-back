import { getSueldo } from '../config/sueldos.js';
import { getOrdenesServicio } from './externalApi.service.js';
import { comisionEquipo, getTasaComisionSistema, montoEquipo } from '../utils/comision.js';
import { namesMatch } from '../utils/normalize.js';
import { parsePlanPrice } from '../utils/planPricing.js';

async function ventasDelUsuario(req, periodo) {
  const rows = await getOrdenesServicio(req.externalToken, periodo);
  const nombreUsuario = req.user?.nombrecompleto;
  return rows.filter((row) => namesMatch(row.ejecutivo, nombreUsuario));
}

function calcularDetalle(venta) {
  const montoVenta = parsePlanPrice(venta.nombrePlan);
  const tasaComisionSistema = getTasaComisionSistema(venta.nTipoPlan);
  const equipo = montoEquipo(venta);
  return {
    idOrdenServicio: venta.idOrdenServicio,
    numeroOs: venta.numeroOs,
    fechaFormat: venta.fechaFormat,
    cliente: venta.cliente,
    nombrePlan: venta.nombrePlan,
    nTipoPlan: venta.nTipoPlan,
    nEstado: venta.nEstado,
    montoVenta,
    tasaComisionSistema,
    montoEquipo: equipo,
    comisionEquipo: comisionEquipo(venta),
  };
}

export async function calcularResumenComision(req, periodo) {
  const ventas = await ventasDelUsuario(req, periodo);
  const detalle = ventas.map(calcularDetalle);

  const sumaVentaSistemas = detalle.reduce((sum, d) => sum + d.montoVenta, 0);
  const sueldo = getSueldo(req.user?.nombrecompleto);
  const meta = sueldo != null ? sueldo * 2.5 : null;
  const metaAlcanzada = meta != null && sumaVentaSistemas >= meta;
  const faltanteParaMeta = meta != null ? Math.max(0, meta - sumaVentaSistemas) : null;

  // La comision de sistemas solo se genera una vez que se cruza la meta; ahi aplica
  // sobre el 100% de lo vendido en el periodo (no solo el excedente). La comision de
  // equipos se paga siempre, independiente de si se llego a la meta o no.
  const comisionSistemas = metaAlcanzada
    ? detalle.reduce((sum, d) => sum + d.montoVenta * d.tasaComisionSistema, 0)
    : 0;
  const comisionEquipos = detalle.reduce((sum, d) => sum + d.comisionEquipo, 0);

  return {
    periodo,
    sueldo,
    meta,
    sumaVentaSistemas,
    metaAlcanzada,
    faltanteParaMeta,
    comisionSistemas,
    comisionEquipos,
    comisionTotal: comisionSistemas + comisionEquipos,
    cantidadVentas: detalle.length,
    ventas: detalle,
  };
}
