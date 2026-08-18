import {
  actualizarCotizacion,
  crearCotizacion,
  eliminarCotizacion,
  listarCotizacionesUsuario,
  obtenerCotizacionPorId,
} from '../db/cotizaciones.repository.js';
import { obtenerCatalogoEstructurado, obtenerCatalogoTexto } from '../services/catalogo.service.js';
import { elegirAlternativasCotizacion } from '../services/claude.service.js';
import { armarCotizacion } from '../services/cotizacionDocumento.service.js';
import { consultarDocumento } from '../services/documentos.service.js';
import { generarPdfCotizacion } from '../services/pdfCotizacion.service.js';

const VALIDEZ_DIAS_DEFAULT = 1; // igual al documento de ejemplo, confirmado por el negocio
const LETRAS_ALTERNATIVA = ['A', 'B', 'C'];

function numeroCotizacionDe(fila, indiceAlternativa = 0, totalAlternativas = 1) {
  const anio = new Date(fila.creado_en).getFullYear();
  const base = `${anio}${String(fila.id).padStart(8, '0')}`;
  return totalAlternativas > 1 ? `${base}-${LETRAS_ALTERNATIVA[indiceAlternativa] ?? indiceAlternativa}` : base;
}

function parseRespuesta(fila) {
  return typeof fila.respuesta === 'string' ? JSON.parse(fila.respuesta) : fila.respuesta;
}

export async function generar(req, res) {
  const { prompt, cliente, condicionVenta, conIgv } = req.body ?? {};

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ codResponse: '0', message: 'Escribe qué necesita el cliente', data: null });
  }

  try {
    const catalogoTexto = await obtenerCatalogoTexto(req.externalToken);
    const resultado = await elegirAlternativasCotizacion(prompt.trim(), catalogoTexto);

    // Por defecto toda cotizacion nueva es "CLIENTES VARIOS": el vendedor recien
    // asigna el DNI/RUC real despues, sobre una alternativa ya generada (no se le
    // pide el documento del cliente antes de poder cotizar).
    const clienteFinal = cliente?.numeroDocumento
      ? { nombre: cliente.nombre, tipoDocumento: cliente.tipoDocumento, numeroDocumento: cliente.numeroDocumento }
      : { nombre: 'CLIENTES VARIOS', tipoDocumento: null, numeroDocumento: null };

    const alternativas = resultado.alternativas.map((alt) => {
      const cotizacion = armarCotizacion({
        itemsSeleccionados: alt.items,
        cliente: clienteFinal,
        vendedor: req.user.nombrecompleto,
        condicionVenta: condicionVenta === 'CREDITO' ? 'CREDITO' : 'CONTADO',
        validezDias: VALIDEZ_DIAS_DEFAULT,
        conIgv: conIgv !== false,
      });
      return { nombre: alt.nombre, notas: alt.notas, ...cotizacion };
    });

    const totalMasBajo = Math.min(...alternativas.map((a) => a.importeTotal));

    const fila = await crearCotizacion({
      idUsuario: req.user.id_usuario,
      usuario: req.user.usuario,
      nombrecompleto: req.user.nombrecompleto,
      clienteNombre: clienteFinal.nombre,
      clienteTipoDocumento: clienteFinal.tipoDocumento,
      clienteNumeroDocumento: clienteFinal.numeroDocumento,
      prompt: prompt.trim(),
      respuesta: { alternativas },
      total: totalMasBajo,
    });

    const alternativasConNumero = alternativas.map((alt, i) => ({
      ...alt,
      id: fila.id,
      indice: i,
      numeroCotizacion: numeroCotizacionDe(fila, i, alternativas.length),
    }));

    return res.json({ codResponse: '1', message: 'OK', data: { alternativas: alternativasConNumero } });
  } catch (error) {
    if (error.code === 'CHATIA_NOT_CONFIGURED') {
      return res.status(503).json({ codResponse: '0', message: 'El cotizador con IA aún no está configurado (falta la API key)', data: null });
    }
    if (error.code === 'CHATIA_REFUSAL') {
      return res.status(422).json({ codResponse: '0', message: error.message, data: null });
    }
    console.error('Error generando cotización con IA:', error);
    return res.status(502).json({ codResponse: '0', message: 'No se pudo generar la cotización', data: null });
  }
}

export async function historial(req, res) {
  const filas = await listarCotizacionesUsuario(req.user.id_usuario);
  const data = filas.map((f) => {
    const respuesta = parseRespuesta(f);
    const alternativas = (respuesta.alternativas ?? []).map((alt, i) => ({
      ...alt,
      id: f.id,
      indice: i,
      numeroCotizacion: numeroCotizacionDe(f, i, respuesta.alternativas.length),
    }));
    return {
      id: f.id,
      clienteNombre: f.cliente_nombre,
      clienteTipoDocumento: f.cliente_tipo_documento,
      clienteNumeroDocumento: f.cliente_numero_documento,
      prompt: f.prompt,
      alternativas,
      totalMasBajo: f.total,
      creadoEn: f.creado_en,
    };
  });
  return res.json({ codResponse: '1', message: 'OK', data });
}

export async function documento(req, res) {
  const { tipo, numero } = req.params;

  if (!['dni', 'ruc'].includes(tipo)) {
    return res.status(400).json({ codResponse: '0', message: 'Tipo de documento invalido (usa dni o ruc)', data: null });
  }

  try {
    const resultado = await consultarDocumento(tipo, numero);
    if (!resultado) {
      return res.status(404).json({ codResponse: '0', message: 'No se encontró el documento', data: null });
    }
    return res.json({ codResponse: '1', message: 'OK', data: resultado });
  } catch (error) {
    if (error.code === 'DOCUMENTOS_NOT_CONFIGURED') {
      return res.status(503).json({ codResponse: '0', message: 'La consulta de DNI/RUC aún no está configurada', data: null });
    }
    console.error('Error consultando documento:', error.message);
    return res.status(502).json({ codResponse: '0', message: 'No se pudo consultar el documento', data: null });
  }
}

export async function catalogo(req, res) {
  try {
    const items = await obtenerCatalogoEstructurado(req.externalToken);
    return res.json({ codResponse: '1', message: 'OK', data: items });
  } catch (error) {
    console.error('Error obteniendo catálogo:', error.message);
    return res.status(502).json({ codResponse: '0', message: 'No se pudo obtener el catálogo', data: null });
  }
}

export async function editarAlternativa(req, res) {
  const { id, indice } = req.params;
  const { items, condicionVenta, cliente, conIgv } = req.body ?? {};
  const indiceNum = Number(indice);

  if (items !== undefined && (!Array.isArray(items) || items.length === 0)) {
    return res.status(400).json({ codResponse: '0', message: 'La cotización debe tener al menos un ítem', data: null });
  }

  const fila = await obtenerCotizacionPorId(id, req.user.id_usuario);
  if (!fila) {
    return res.status(404).json({ codResponse: '0', message: 'Cotización no encontrada', data: null });
  }

  const respuesta = parseRespuesta(fila);
  const original = respuesta.alternativas?.[indiceNum];
  if (!original) {
    return res.status(404).json({ codResponse: '0', message: 'Alternativa no encontrada', data: null });
  }

  const itemsFinal = Array.isArray(items) && items.length > 0 ? items : original.items;
  const clienteFinal = cliente?.numeroDocumento
    ? { nombre: cliente.nombre, tipoDocumento: cliente.tipoDocumento, numeroDocumento: cliente.numeroDocumento }
    : original.cliente;

  // Recalculamos TODO (precioTotal por item, IGV, total, monto en letras) en el
  // servidor a partir de los items que mando el vendedor. Nunca se confia en
  // numeros que vengan calculados desde el navegador.
  const documento = armarCotizacion({
    itemsSeleccionados: itemsFinal,
    cliente: clienteFinal,
    vendedor: original.vendedor,
    condicionVenta: condicionVenta === 'CREDITO' || condicionVenta === 'CONTADO' ? condicionVenta : original.condicionVenta,
    validezDias: original.validezDias,
    conIgv: conIgv !== undefined ? conIgv !== false : original.conIgv !== false,
  });

  const alternativaActualizada = { nombre: original.nombre, notas: original.notas, ...documento };
  respuesta.alternativas[indiceNum] = alternativaActualizada;
  const totalMasBajo = Math.min(...respuesta.alternativas.map((a) => a.importeTotal));

  await actualizarCotizacion(id, req.user.id_usuario, respuesta, totalMasBajo);

  return res.json({
    codResponse: '1',
    message: 'OK',
    data: {
      ...alternativaActualizada,
      id: fila.id,
      indice: indiceNum,
      numeroCotizacion: numeroCotizacionDe(fila, indiceNum, respuesta.alternativas.length),
    },
  });
}

export async function eliminar(req, res) {
  const { id } = req.params;
  const eliminado = await eliminarCotizacion(id, req.user.id_usuario);
  if (!eliminado) {
    return res.status(404).json({ codResponse: '0', message: 'Cotización no encontrada', data: null });
  }
  return res.json({ codResponse: '1', message: 'OK', data: null });
}

export async function descargarPdf(req, res) {
  const { id } = req.params;
  const indice = Number(req.query.alternativa ?? 0);

  const fila = await obtenerCotizacionPorId(id, req.user.id_usuario);
  if (!fila) {
    return res.status(404).json({ codResponse: '0', message: 'Cotización no encontrada', data: null });
  }

  const respuesta = parseRespuesta(fila);
  const alternativa = respuesta.alternativas?.[indice];
  if (!alternativa) {
    return res.status(404).json({ codResponse: '0', message: 'Alternativa no encontrada', data: null });
  }

  const numero = numeroCotizacionDe(fila, indice, respuesta.alternativas.length);
  const doc = generarPdfCotizacion(alternativa, numero);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="cotizacion-${numero}.pdf"`);
  doc.pipe(res);
  doc.end();
}
