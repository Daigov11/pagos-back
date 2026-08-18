const DIACRITICS_REGEX = /[̀-ͯ]/g;

export function normalizeName(str) {
  return (str ?? '')
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

/**
 * Compara nombres sin importar el orden de nombres/apellidos: la API de login
 * devuelve "NOMBRES APELLIDOS" y la de ordenes de servicio "APELLIDOS NOMBRES".
 */
export function namesMatch(a, b) {
  const wordsA = normalizeName(a).split(' ').filter(Boolean).sort().join(' ');
  const wordsB = normalizeName(b).split(' ').filter(Boolean).sort().join(' ');
  return Boolean(wordsA) && wordsA === wordsB;
}
