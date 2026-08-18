import { env } from '../config/env.js';
import { getPlanes, getProductos } from './externalApi.service.js';

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = { datos: null, timestamp: 0 };

// Las descripciones de equipo suelen venir con este sufijo (viene asi de la API
// externa); en el documento de cotizacion NO va en el articulo, va aparte en U.M.
const SUFIJO_NIU_REGEX = /\s*\(NIU\)\s*$/i;

function parsePrecio(valor) {
  if (typeof valor === 'number') return valor;
  return Number(String(valor).replace(/,/g, ''));
}

/**
 * Trae planes + productos de la API externa. Cacheado en memoria unos minutos
 * porque son ~250 planes y no cambian a cada rato; evita golpear la API externa
 * en cada cotizacion generada o cada vez que el vendedor busca un producto.
 */
async function obtenerDatosCrudos(token) {
  const ahora = Date.now();
  if (cache.datos && ahora - cache.timestamp < CACHE_TTL_MS) {
    return cache.datos;
  }

  const [planes, categoriasProductos] = await Promise.all([
    getPlanes(token),
    getProductos(token, env.almacenIdDefault),
  ]);

  const datos = { planes, categoriasProductos };
  cache = { datos, timestamp: ahora };
  return datos;
}

function formatearPlanes(planes) {
  return planes
    .filter((p) => p.estado === 'A')
    .map(
      (p) =>
        `- CODIGO:${p.id_planes} | UM:${p.unidadMedida} | ${p.nombrecorto} | ${p.descripcion} | S/.${parsePrecio(p.precio_venta).toFixed(2)} | periodicidad: ${p.ntipo} | sistema: ${p.nsistema}`
    )
    .join('\n');
}

function formatearProductos(categorias) {
  return categorias
    .flatMap((cat) =>
      (cat.productos ?? []).map((prod) => {
        const descripcionLimpia = prod.descripcion.replace(SUFIJO_NIU_REGEX, '');
        return `- CODIGO:${prod.id_producto} | UM:NIU | ${descripcionLimpia} | S/.${parsePrecio(prod.precio_venta).toFixed(2)} | categoria: ${cat.descripcion}`;
      })
    )
    .join('\n');
}

/** Texto del catalogo que se inyecta en el prompt del cotizador. */
export async function obtenerCatalogoTexto(token) {
  const { planes, categoriasProductos } = await obtenerDatosCrudos(token);

  return `PLANES (licencias de sistemas; el precio ya esta sin IGV; "periodicidad" define cada cuanto se cobra):
${formatearPlanes(planes)}

EQUIPOS Y PRODUCTOS FISICOS (venta de hardware, no son licencias):
${formatearProductos(categoriasProductos)}`;
}

/** Catalogo estructurado (para que el vendedor busque/agregue productos a mano en el frontend). */
export async function obtenerCatalogoEstructurado(token) {
  const { planes, categoriasProductos } = await obtenerDatosCrudos(token);

  const itemsPlanes = planes
    .filter((p) => p.estado === 'A')
    .map((p) => ({
      codigo: String(p.id_planes),
      articulo: p.descripcion,
      unidadMedida: p.unidadMedida,
      tipo: 'plan',
      precioUnitario: parsePrecio(p.precio_venta),
      detalle: `${p.ntipo} · ${p.nsistema}`,
    }));

  const itemsProductos = categoriasProductos.flatMap((cat) =>
    (cat.productos ?? []).map((prod) => ({
      codigo: String(prod.id_producto),
      articulo: prod.descripcion.replace(SUFIJO_NIU_REGEX, ''),
      unidadMedida: 'NIU',
      tipo: 'equipo',
      precioUnitario: parsePrecio(prod.precio_venta),
      detalle: cat.descripcion,
    }))
  );

  return [...itemsPlanes, ...itemsProductos];
}
