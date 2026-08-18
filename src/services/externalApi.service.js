import axios from 'axios';
import { env } from '../config/env.js';

const externalApi = axios.create({
  baseURL: env.externalApiBaseUrl,
  headers: {
    Accept: 'text/plain',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Llama al login de la API externa (Centralizador).
 * Lanza el error de axios tal cual si falla, para que el controller decida como mapearlo.
 */
export async function loginExternal(usuario, password) {
  const { data } = await externalApi.post('/User/login', { usuario, password });
  return data;
}

/**
 * Cliente autenticado para futuras llamadas (ventas, comisiones, etc.)
 * reenviando el token guardado en nuestra sesion.
 */
export function externalApiWithToken(token) {
  return axios.create({
    baseURL: env.externalApiBaseUrl,
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    timeout: 15000,
  });
}

/**
 * Trae TODAS las ordenes de servicio en un rango de fechas (sin filtrar por vendedor,
 * la API externa no soporta eso). El filtrado por vendedor se hace despues, en nuestro
 * backend, comparando el campo "ejecutivo" contra el nombrecompleto del usuario logueado.
 *
 * Este endpoint solo lo puede consultar un usuario con rol _SISTEMAS. Si el usuario
 * logueado tiene un rol distinto (vendedor, ejecutivo, etc.) la API responde 403, y en
 * ese caso reintentamos con un token de respaldo (_SISTEMAS) guardado en el servidor.
 * El usuario nunca ve ese token; solo se usa para poder leer sus propias ordenes.
 */
export async function getOrdenesServicio(token, { fechaInicio, fechaFin, plan = 'ALL', estado = 'ALL', allFechas = 0 }) {
  const params = {
    fechaInicio,
    fechaFin,
    plan,
    estado,
    allFechas,
    displayStart: 0,
    // OJO: la API externa tiene un typo real en este parametro ("displaty" en vez de
    // "display"). Si se corrige la ortografia, el filtro deja de aplicarse y la API
    // vuelve a paginar con un tamano de pagina por defecto (~20 filas).
    displatyLength: 1000000,
    // Trae el detalle de comprobantes (pagos) de cada orden, incluyendo los de
    // origen "Administrativo Equipo" que usamos para calcular la comision de equipos.
    incluirPago: 1,
  };

  try {
    return extractRows(await fetchOrdenesServicioRaw(token, params));
  } catch (error) {
    if (error.response?.status !== 403 || !env.externalApiFallbackToken) throw error;
    console.warn('orden-servicio: 403 con el token del usuario, reintentando con el token de respaldo (_SISTEMAS)');
    return extractRows(await fetchOrdenesServicioRaw(env.externalApiFallbackToken, params));
  }
}

async function fetchOrdenesServicioRaw(token, params) {
  const client = externalApiWithToken(token);
  const { data } = await client.get('/Administrativo/orden-servicio', { params });
  return data;
}

/**
 * Reintenta una llamada a la API externa con el token de respaldo (_SISTEMAS) si el
 * token del usuario logueado recibe 403. Mismo patron que orden-servicio.
 */
export async function conFallback(token, fetcher) {
  try {
    return await fetcher(token);
  } catch (error) {
    if (error.response?.status !== 403 || !env.externalApiFallbackToken) throw error;
    console.warn('API externa: 403 con el token del usuario, reintentando con el token de respaldo (_SISTEMAS)');
    return fetcher(env.externalApiFallbackToken);
  }
}

/** Trae todos los planes (licencias de sistemas) con su precio. */
export async function getPlanes(token) {
  return conFallback(token, async (t) => {
    const client = externalApiWithToken(t);
    const { data } = await client.get('/Administrativo/planes', {
      params: { displayStart: 0, displatyLength: 1000 },
    });
    return extractRows(data);
  });
}

/** Trae los productos/equipos fisicos de un almacen. */
export async function getProductos(token, idAlmacen) {
  return conFallback(token, async (t) => {
    const client = externalApiWithToken(t);
    const { data } = await client.get('/Producto', { params: { idAlmacen } });
    return extractRows(data);
  });
}

export function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.aaData)) return payload.aaData;
  console.warn('Respuesta inesperada de orden-servicio: no se encontro un arreglo de filas');
  return [];
}

export default externalApi;
