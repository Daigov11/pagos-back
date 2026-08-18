import { normalizeName } from '../utils/normalize.js';

/**
 * Config temporal en codigo mientras no migramos esto a MySQL. El "alias" es la
 * palabra por la que se identifica a cada vendedor (nombre o apodo) dentro de su
 * nombre completo (ej: "YULEINY DINELA RIVERO TORRES" contiene "DINELA").
 */
const SUELDOS = [
  { alias: 'ANTHONY', sueldo: 1950 },
  { alias: 'DINELA', sueldo: 3200 },
  { alias: 'ANTONIO', sueldo: 2000 },
  { alias: 'FELIPE', sueldo: 1350 },
  { alias: 'RICARDO', sueldo: 1950 },
  { alias: 'CHRISTIAN', sueldo: 4200 },
];

export function getSueldo(nombrecompleto) {
  const palabras = normalizeName(nombrecompleto).split(' ');
  const encontrado = SUELDOS.find((s) => palabras.includes(s.alias));
  return encontrado?.sueldo ?? null;
}
