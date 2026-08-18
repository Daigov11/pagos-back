import { getOrdenesServicio } from '../services/externalApi.service.js';
import { getCurrentMonthRange, getMonthRange, getRangeFromMonth } from '../utils/dateRange.js';
import { namesMatch } from '../utils/normalize.js';

async function fetchVentasDelUsuario(req, { fechaInicio, fechaFin }) {
  const rows = await getOrdenesServicio(req.externalToken, { fechaInicio, fechaFin });
  const nombreUsuario = req.user?.nombrecompleto;
  return rows.filter((row) => namesMatch(row.ejecutivo, nombreUsuario));
}

function resumenPorEstado(ventas) {
  const counts = {};
  for (const v of ventas) {
    const key = v.nEstado || 'SIN ESTADO';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function respuestaVentas(res, periodo, ventas) {
  return res.json({
    codResponse: '1',
    message: 'OK',
    data: { periodo, cantidad: ventas.length, resumenPorEstado: resumenPorEstado(ventas), ventas },
  });
}

function handleExternalError(res, error) {
  if (error.response) {
    return res
      .status(error.response.status)
      .json(error.response.data ?? { codResponse: '0', message: 'Error consultando ordenes de servicio', data: null });
  }
  console.error('Error llamando a ordenes de servicio:', error.message);
  return res.status(502).json({ codResponse: '0', message: 'No se pudo contactar el servicio de ordenes', data: null });
}

export async function ventasDelMes(req, res) {
  const periodo = getCurrentMonthRange();
  try {
    const ventas = await fetchVentasDelUsuario(req, periodo);
    return respuestaVentas(res, periodo, ventas);
  } catch (error) {
    return handleExternalError(res, error);
  }
}

export async function ventasHistorial(req, res) {
  const { year, month } = req.query;
  const periodo = year && month
    ? getMonthRange(Number(year), Number(month))
    : getRangeFromMonth(new Date().getFullYear(), 7); // por el momento: desde julio hasta hoy
  try {
    const ventas = await fetchVentasDelUsuario(req, periodo);
    return respuestaVentas(res, periodo, ventas);
  } catch (error) {
    return handleExternalError(res, error);
  }
}
