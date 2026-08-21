import { crearReclamo, findReclamo } from '../db/reclamos.repository.js';
import { crearAsignacion, eliminarAsignacion } from '../db/comisionEquipos.repository.js';
import { calcularResumenComision, ventasDelUsuario } from '../services/comisiones.service.js';
import { buscarItemEquipo, CATALOGO_COMISION_EQUIPOS } from '../config/equiposComision.js';
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

export function catalogoEquiposComision(_req, res) {
  return res.json({ codResponse: '1', message: 'OK', data: CATALOGO_COMISION_EQUIPOS });
}

export async function asignarEquipoComision(req, res) {
  const idOrdenServicio = Number(req.params.idOrdenServicio);
  const { codigoItem, cantidad = 1 } = req.body;

  const item = buscarItemEquipo(codigoItem);
  if (!item) {
    return res.status(400).json({ codResponse: '0', message: 'Equipo no encontrado en el catálogo', data: null });
  }
  const cantidadNum = Number(cantidad);
  if (!Number.isFinite(cantidadNum) || cantidadNum <= 0) {
    return res.status(400).json({ codResponse: '0', message: 'Cantidad inválida', data: null });
  }

  try {
    const ventas = await ventasDelUsuario(req, getCurrentMonthRange());
    const venta = ventas.find((v) => v.idOrdenServicio === idOrdenServicio);
    if (!venta) {
      return res.status(404).json({ codResponse: '0', message: 'Orden de servicio no encontrada', data: null });
    }

    const comisionTotal = Number((item.comisionUnitaria * cantidadNum).toFixed(2));
    const asignacion = await crearAsignacion({
      idOrdenServicio,
      idUsuario: req.user.id_usuario,
      codigoItem: item.codigo,
      nombreItem: item.nombre,
      cantidad: cantidadNum,
      comisionUnitaria: item.comisionUnitaria,
      comisionTotal,
    });
    return res.status(201).json({ codResponse: '1', message: 'Equipo asignado', data: asignacion });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function eliminarAsignacionEquipoComision(req, res) {
  const id = Number(req.params.id);
  const eliminado = await eliminarAsignacion(id, req.user.id_usuario);
  if (!eliminado) {
    return res.status(404).json({ codResponse: '0', message: 'Asignación no encontrada', data: null });
  }
  return res.json({ codResponse: '1', message: 'Asignación eliminada', data: null });
}
