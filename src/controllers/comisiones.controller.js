import { crearReclamo, findReclamo } from '../db/reclamos.repository.js';
import { calcularResumenComision } from '../services/comisiones.service.js';
import { getCurrentMonthRange, getMonthRange } from '../utils/dateRange.js';

function handleError(res, error) {
  if (error.response) {
    return res
      .status(error.response.status)
      .json(error.response.data ?? { codResponse: '0', message: 'Error consultando ordenes de servicio', data: null });
  }
  console.error('Error en comisiones:', error.message);
  return res.status(502).json({ codResponse: '0', message: 'No se pudo contactar el servicio de ordenes', data: null });
}

export async function comisionesResumen(req, res) {
  const { year, month } = req.query;
  const periodo = year && month ? getMonthRange(Number(year), Number(month)) : getCurrentMonthRange();

  try {
    const resumen = await calcularResumenComision(req, periodo);
    const reclamo = await findReclamo({
      idUsuario: req.user.id_usuario,
      periodoInicio: periodo.fechaInicio,
      periodoFin: periodo.fechaFin,
    });
    return res.json({ codResponse: '1', message: 'OK', data: { ...resumen, reclamo } });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reclamarComision(req, res) {
  const periodo = getCurrentMonthRange();

  try {
    const resumen = await calcularResumenComision(req, periodo);

    if (!resumen.metaAlcanzada) {
      return res.status(400).json({ codResponse: '0', message: 'Aún no alcanzas tu meta de este mes.', data: null });
    }
    if (resumen.comisionTotal <= 0) {
      return res.status(400).json({ codResponse: '0', message: 'No tienes comisión generada este mes.', data: null });
    }

    const existente = await findReclamo({
      idUsuario: req.user.id_usuario,
      periodoInicio: periodo.fechaInicio,
      periodoFin: periodo.fechaFin,
    });
    if (existente) {
      return res.status(409).json({ codResponse: '0', message: 'Ya reclamaste tu comisión de este mes.', data: existente });
    }

    const reclamo = await crearReclamo({
      idUsuario: req.user.id_usuario,
      usuario: req.user.usuario,
      nombrecompleto: req.user.nombrecompleto,
      periodoInicio: periodo.fechaInicio,
      periodoFin: periodo.fechaFin,
      sumaVentaSistemas: resumen.sumaVentaSistemas,
      montoComision: resumen.comisionTotal,
    });
    return res.status(201).json({ codResponse: '1', message: 'Comisión reclamada correctamente', data: reclamo });
  } catch (error) {
    return handleError(res, error);
  }
}
