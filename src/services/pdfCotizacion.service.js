import PDFDocument from 'pdfkit';
import { EMPRESA } from '../data/empresa.js';

const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const money = (n) => `${Number(n ?? 0).toFixed(2)}`;

function drawTableRow(doc, x, y, columns, rowHeight, { bold = false, fill = null, borderColor = '#333333' } = {}) {
  if (fill) {
    doc.save().fillColor(fill).rect(x, y, columns.reduce((s, c) => s + c.width, 0), rowHeight).fill().restore();
  }

  let cx = x;
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).fillColor('#000000');
  for (const col of columns) {
    doc
      .rect(cx, y, col.width, rowHeight)
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .stroke();
    doc.text(col.text ?? '', cx + 4, y + 4, {
      width: col.width - 8,
      align: col.align ?? 'left',
    });
    cx += col.width;
  }
}

/**
 * Genera el PDF de una cotizacion (mismo formato que las cotizaciones reales de
 * apiworking.pe: encabezado, datos del cliente, tabla de items, totales y monto
 * en letras, y datos bancarios).
 */
export function generarPdfCotizacion(cotizacion, numeroCotizacion) {
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });

  // ---------- Encabezado ----------
  const boxWidth = 150;
  const boxX = PAGE_WIDTH - MARGIN - boxWidth;

  doc.font('Helvetica-Bold').fontSize(11).text(EMPRESA.nombre, MARGIN, MARGIN, {
    width: CONTENT_WIDTH - boxWidth - 10,
    align: 'center',
  });
  doc.font('Helvetica').fontSize(8).text(EMPRESA.direccion, MARGIN, doc.y + 4, {
    width: CONTENT_WIDTH - boxWidth - 10,
    align: 'center',
  });
  doc.text(`${EMPRESA.telefono}   •   ${EMPRESA.email}`, MARGIN, doc.y + 2, {
    width: CONTENT_WIDTH - boxWidth - 10,
    align: 'center',
  });

  doc.rect(boxX, MARGIN, boxWidth, 55).strokeColor('#333333').lineWidth(0.5).stroke();
  doc.font('Helvetica-Bold').fontSize(9).text(`R.U.C. ${EMPRESA.ruc}`, boxX, MARGIN + 6, { width: boxWidth, align: 'center' });
  doc.fontSize(11).text('COTIZACIÓN', boxX, MARGIN + 20, { width: boxWidth, align: 'center' });
  doc.fontSize(10).text(numeroCotizacion, boxX, MARGIN + 36, { width: boxWidth, align: 'center' });

  let y = MARGIN + 75;

  // ---------- Datos del cliente ----------
  const infoBoxHeight = 86;
  doc.rect(MARGIN, y, CONTENT_WIDTH, infoBoxHeight).strokeColor('#333333').lineWidth(0.5).stroke();

  const col1LabelX = MARGIN + 8;
  const col1ValueX = MARGIN + 90;
  const col2LabelX = MARGIN + CONTENT_WIDTH / 2 + 8;
  const col2ValueX = MARGIN + CONTENT_WIDTH / 2 + 90;
  const rowH = 16;
  const rowGapExtra = 8; // espacio extra tras la fila 1, que puede envolver a 2 lineas (razon social larga)

  function campo(labelX, valueX, rowY, label, valor) {
    doc.font('Helvetica-Bold').fontSize(8).text(label, labelX, rowY);
    doc.font('Helvetica').fontSize(8).text(valor ?? '', valueX, rowY, { width: CONTENT_WIDTH / 2 - 100 });
  }

  const clienteNombre = cotizacion.cliente?.nombre || 'CLIENTES VARIOS';
  const clienteDni = cotizacion.cliente?.tipoDocumento === 'DNI' ? cotizacion.cliente.numeroDocumento : '';
  const clienteRuc = cotizacion.cliente?.tipoDocumento === 'RUC' ? cotizacion.cliente.numeroDocumento : '';

  campo(col1LabelX, col1ValueX, y + 8, 'RAZÓN SOCIAL', `${clienteRuc || clienteDni || ''} ${clienteNombre}`.trim());
  campo(col2LabelX, col2ValueX, y + 8, 'D.N.I.', clienteDni);

  campo(col1LabelX, col1ValueX, y + 8 + rowH + rowGapExtra, 'DIRECCIÓN', '');
  campo(col2LabelX, col2ValueX, y + 8 + rowH + rowGapExtra, 'FECHA EMISIÓN', cotizacion.fechaEmision);

  campo(col1LabelX, col1ValueX, y + 8 + rowH * 2 + rowGapExtra, 'VENDEDOR', cotizacion.vendedor);
  campo(col2LabelX, col2ValueX, y + 8 + rowH * 2 + rowGapExtra, 'COND. VENTA', cotizacion.condicionVenta);

  campo(col1LabelX, col1ValueX, y + 8 + rowH * 3 + rowGapExtra, 'VALIDEZ', `${cotizacion.validezFecha} | ${cotizacion.validezDias} día(s)`);

  y += infoBoxHeight + 12;

  // ---------- Tabla de items ----------
  const columnas = [
    { key: 'item', width: 36, align: 'center' },
    { key: 'codigo', width: 60, align: 'center' },
    { key: 'articulo', width: 182, align: 'left' },
    { key: 'um', width: 40, align: 'center' },
    { key: 'cant', width: 42, align: 'right' },
    { key: 'precioUnitario', width: 75, align: 'right' },
    { key: 'precioTotal', width: 80, align: 'right' },
  ];

  const headerRow = [
    { text: 'ITEM', width: columnas[0].width, align: 'center' },
    { text: 'CÓDIGO', width: columnas[1].width, align: 'center' },
    { text: 'ARTICULO', width: columnas[2].width, align: 'left' },
    { text: 'U.M.', width: columnas[3].width, align: 'center' },
    { text: 'CANT.', width: columnas[4].width, align: 'right' },
    { text: 'P. UNIT.', width: columnas[5].width, align: 'right' },
    { text: 'P. TOTAL', width: columnas[6].width, align: 'right' },
  ];

  drawTableRow(doc, MARGIN, y, headerRow, 18, { bold: true, fill: '#eeeeee' });
  y += 18;

  cotizacion.items.forEach((item, i) => {
    const alturaTexto = doc.font('Helvetica').fontSize(8.5).heightOfString(item.articulo, { width: columnas[2].width - 8 });
    const rowHeight = Math.max(18, alturaTexto + 8);

    if (y + rowHeight > 780) {
      doc.addPage({ size: 'A4', margin: MARGIN });
      y = MARGIN;
    }

    const fila = [
      { text: String(i + 1), width: columnas[0].width, align: 'center' },
      { text: item.codigo, width: columnas[1].width, align: 'center' },
      { text: item.articulo, width: columnas[2].width, align: 'left' },
      { text: item.unidadMedida, width: columnas[3].width, align: 'center' },
      { text: item.cantidad.toFixed(2), width: columnas[4].width, align: 'right' },
      { text: money(item.precioUnitario), width: columnas[5].width, align: 'right' },
      { text: money(item.precioTotal), width: columnas[6].width, align: 'right' },
    ];
    drawTableRow(doc, MARGIN, y, fila, rowHeight);
    y += rowHeight;
  });

  y += 10;

  // ---------- Monto en letras + totales ----------
  const totalesWidth = 200;
  const totalesX = MARGIN + CONTENT_WIDTH - totalesWidth;

  doc.font('Helvetica-Bold').fontSize(8.5).text('SON:', MARGIN, y);
  doc.font('Helvetica-Bold').fontSize(8.5).text(cotizacion.montoEnLetras, MARGIN + 26, y, { width: totalesX - MARGIN - 34 });

  const totalesFilas = [
    [cotizacion.etiquetaOperacion ?? 'OP. GRAVADA', money(cotizacion.opGravada), false],
    [cotizacion.etiquetaIgv ?? 'TOTAL IGV (18%)', money(cotizacion.igv), false],
    ['IMPORTE TOTAL', money(cotizacion.importeTotal), true],
  ];

  let ty = y;
  totalesFilas.forEach(([label, valor, bold]) => {
    const rowH2 = 16;
    drawTableRow(
      doc,
      totalesX,
      ty,
      [
        { text: label, width: 110, align: 'left' },
        { text: valor, width: 90, align: 'right' },
      ],
      rowH2,
      { bold }
    );
    ty += rowH2;
  });

  y = Math.max(doc.y, ty) + 20;

  // ---------- Datos bancarios ----------
  const bancoColumnas = [
    { header: 'BANCO', text: EMPRESA.banco.nombre, width: 160 },
    { header: 'MONEDA', text: EMPRESA.banco.moneda, width: 60 },
    { header: 'NÚMERO DE CUENTA', text: EMPRESA.banco.numeroCuenta, width: 145 },
    { header: 'CCI', text: EMPRESA.banco.cci, width: 150 },
  ];

  drawTableRow(
    doc,
    MARGIN,
    y,
    bancoColumnas.map((c) => ({ text: c.header, width: c.width, align: 'left' })),
    16,
    { bold: true, fill: '#eeeeee' }
  );
  y += 16;
  drawTableRow(
    doc,
    MARGIN,
    y,
    bancoColumnas.map((c) => ({ text: c.text, width: c.width, align: 'left' })),
    16
  );

  return doc;
}
