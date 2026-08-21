/**
 * Catalogo de comisiones por equipo (Comisiones Equipos.pdf, APIWORKING INTERNATIONAL
 * S.A.C.). El vendedor asigna manualmente estos items a una orden de servicio porque la
 * API externa solo trae el total facturado de "Administrativo Equipo", no el producto.
 */
export const CATALOGO_COMISION_EQUIPOS = [
  { codigo: '1', nombre: 'IMPRESORA TERMICA APIPOS LN-POS80-CX-UE 80MM (USB+Ethernet)', comisionUnitaria: 22.5 },
  { codigo: '2', nombre: 'TICKETERA IMPRESORA TERMICA DE 80MM REDPOS RED-E803', comisionUnitaria: 22.5 },
  { codigo: '3', nombre: 'TICKETERA IMPRESORA TERMICA DE 80MM CBX POS-89E', comisionUnitaria: 22.5 },
  { codigo: '4', nombre: 'IMPRESORA TERMICA APIPOS LN-POS80-CX-UE 80MM (USB+BT)', comisionUnitaria: 22.5 },
  { codigo: '5', nombre: 'TICKETERA RECEIPT BLUETOOTH PRINTER JK-5801H 58MM', comisionUnitaria: 10 },
  { codigo: '6', nombre: 'IMPRESORA TERMICA HOIN HOP-H58', comisionUnitaria: 10 },
  { codigo: '7', nombre: 'LECTOR LASER API-AW-6900', comisionUnitaria: 9 },
  { codigo: '8', nombre: 'LECTOR LASER NETUM NT-1228BC PISTOLA INALAMBRICA', comisionUnitaria: 12 },
  { codigo: '9', nombre: 'LECTOR LASER API-A60 DE MESA', comisionUnitaria: 11 },
  { codigo: '10', nombre: 'GAVETA DE DINERO MEDIANA POS-D CD-30', comisionUnitaria: 10 },
  { codigo: '11', nombre: 'IMPRESORA TERMICA XPRINTER XP-470B (GENERADORA DE CODIGOS)', comisionUnitaria: 25, disponible: false },
  { codigo: '12', nombre: 'IMPRESORA TERMICA XPRINTER XP-237B (GENERADORA DE CODIGOS)', comisionUnitaria: 20, disponible: false },
  { codigo: '13', nombre: 'IMPRESORA TERMICA XPRINTER XP-350B', comisionUnitaria: 20 },
  { codigo: '14', nombre: 'CONTOMETRO TERMICO DE 80X40 POR UNIDAD', comisionUnitaria: 0 },
  { codigo: '15', nombre: 'CONTOMETROS DE 58MM X 20 UNIDADES', comisionUnitaria: 5 },
  { codigo: '16', nombre: 'CONTOMETROS DE 80MM POR CAJA', comisionUnitaria: 10 },
  { codigo: '17', nombre: 'CONTOMETROS DE 80MM POR UNIDAD', comisionUnitaria: 0 },
  { codigo: '18', nombre: 'MONITOR TOUCH SCREEN REDPOS RED-1501 15"', comisionUnitaria: 50 },
  { codigo: '19', nombre: 'MONITOR TOUCH SCREEN REDPOS RED-1701 17"', comisionUnitaria: 60 },
  { codigo: '20', nombre: 'ALL IN ONE API-D180', comisionUnitaria: 50 },
  { codigo: '21', nombre: 'ALL IN ONE iMIN 120D01', comisionUnitaria: 80 },
  { codigo: '22', nombre: 'Terminal Inteligente todo en 1 NEW POS (alternativa de tablet)', comisionUnitaria: 20 },
  { codigo: '23', nombre: 'TABLET LENOVO DE 8" (sin base)', comisionUnitaria: 30 },
  { codigo: '24', nombre: 'ALL IN ONE iMIN POS FALCON 1', comisionUnitaria: 30 },
  { codigo: '25', nombre: 'PACK NEGOCIOS (PC + Mouse + Teclado + Monitor + Impresora Ticketera 80mm)', comisionUnitaria: 50 },
  { codigo: '26', nombre: 'PACK REACTIVA (PC i5, 8RAM, 500GB + Impresora Ticketera 80mm + Teclado + Mouse)', comisionUnitaria: 80 },
  { codigo: '27', nombre: 'PACK CAJA DE DINERO (PC i5, 4RAM, 240GB + Impresora Ticketera 80mm + Teclado + Mouse + Gaveta)', comisionUnitaria: 100 },
  { codigo: '28', nombre: "PACK TOUCH (Monitor Touch 15' + CPU + Impresora Ticketera 80mm + Teclado + Mouse)", comisionUnitaria: 150 },
  { codigo: '29', nombre: "PACK TOUCH 2 (Monitor Touch 17' + CPU + Impresora Ticketera 80mm + Teclado + Mouse)", comisionUnitaria: 150 },
  { codigo: 'COMBO_POS_TICKETERA_RESTOPRO', nombre: 'COMBO: POS + Ticketera + Sistema Resto Pro', comisionUnitaria: 179 },
  { codigo: 'COMBO_RESTOPRO_TERMINAL_ANDROID', nombre: 'COMBO: Sistema Resto Pro + Terminal Android todo en 1', comisionUnitaria: 150 },
  { codigo: 'COMBO_DOBLE_PANTALLA_RESTOPRO', nombre: 'COMBO: Doble pantalla todo en 1 + Sistema Resto Pro', comisionUnitaria: 320 },
  { codigo: 'COMBO_RESTOPRO_CAJA_TERMINAL_CODBARRA', nombre: 'COMBO: Sistema Resto Pro + Caja de dinero + Terminal Android + Codigo de barra', comisionUnitaria: 185 },
];

export function buscarItemEquipo(codigo) {
  return CATALOGO_COMISION_EQUIPOS.find((item) => item.codigo === codigo) ?? null;
}
