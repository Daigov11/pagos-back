function pad(n) {
  return String(n).padStart(2, '0');
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** month es 1-12 */
export function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { fechaInicio: formatDate(start), fechaFin: formatDate(end) };
}

export function getCurrentMonthRange() {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth() + 1);
}

/** Desde el 1 de "month" (1-12) del año dado hasta el fin del mes actual. */
export function getRangeFromMonth(year, month) {
  const now = new Date();
  const start = new Date(year, month - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { fechaInicio: formatDate(start), fechaFin: formatDate(end) };
}
