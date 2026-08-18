import { numeroALetras } from '../utils/numeroALetras.js';

const IGV_RATE = 0.18;

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatFechaPeru(date) {
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

// La IA a veces copia el codigo/UM del catalogo incluyendo el prefijo literal
// ("CODIGO:xxx", "UM:xxx") en vez de solo el valor. Se limpia aca, no se confia
// en que el prompt sea suficiente por si solo para un campo que va en un PDF.
function limpiarPrefijo(valor, prefijo) {
  return (valor ?? '').replace(new RegExp(`^${prefijo}\\s*`, 'i'), '').trim();
}

/** Arma el documento de cotizacion final. Toda la aritmetica va aqui, no en la IA. */
export function armarCotizacion({ itemsSeleccionados, cliente, vendedor, condicionVenta, validezDias, conIgv = true }) {
  const items = itemsSeleccionados.map((it) => ({
    codigo: limpiarPrefijo(it.codigo, 'CODIGO:'),
    articulo: it.articulo,
    unidadMedida: limpiarPrefijo(it.unidadMedida, 'UM:'),
    tipo: it.tipo,
    cantidad: it.cantidad,
    precioUnitario: it.precioUnitario,
    precioTotal: Number((it.cantidad * it.precioUnitario).toFixed(2)),
  }));

  const opGravada = Number(items.reduce((sum, it) => sum + it.precioTotal, 0).toFixed(2));
  const igv = conIgv ? Number((opGravada * IGV_RATE).toFixed(2)) : 0;
  const importeTotal = Number((opGravada + igv).toFixed(2));

  const hoy = new Date();
  const fechaValidez = new Date(hoy);
  fechaValidez.setDate(fechaValidez.getDate() + validezDias);

  return {
    vendedor,
    fechaEmision: formatFechaPeru(hoy),
    validezDias,
    validezFecha: formatFechaPeru(fechaValidez),
    condicionVenta,
    cliente,
    items,
    conIgv,
    etiquetaOperacion: conIgv ? 'OP. GRAVADA' : 'OP. EXONERADA',
    etiquetaIgv: conIgv ? 'TOTAL IGV (18%)' : 'IGV (EXONERADO)',
    opGravada,
    igv,
    importeTotal,
    montoEnLetras: numeroALetras(importeTotal),
  };
}
