export const META_COMISION_SISTEMAS = 3250;

/**
 * Tabla de comisiones de sistemas (comisiones.png, Agosto 2026). El lookup se hace por
 * (rubro, periodicidad, precio de venta) y NO por nombre de tier: los nombres reales de
 * nombrePlan en la API externa son inconsistentes (typos, formatos legacy sin palabra de
 * tier como "RESTO/120"), pero el precio ya viene embebido al final del texto
 * (parsePlanPrice) y es mucho mas estable que el nombre. El "tier" de cada entrada es
 * solo para mostrar en UI/logs, nunca se usa para matchear.
 *
 * Cada plan trae precioVenta (columna "+IGV" de la imagen, lo que paga el cliente) y
 * comision (lo que cobra el vendedor). Para Mensual, precioVenta === comision siempre
 * (la comision mensual es el 100% del precio del plan).
 *
 * IMPORTANTE: el orden de RUBROS_SISTEMA importa. HOTELES se evalua antes que
 * RESTAURANTES porque "PLAN RESTO HOTEL" contiene la palabra "RESTO" y matchearia el
 * rubro equivocado si RESTAURANTES se evaluara primero.
 */
export const RUBROS_SISTEMA = [
  {
    rubro: 'HOTELES',
    keywords: ['HOTEL'],
    planes: [
      {
        tier: 'HOTEL_BASICO',
        precioVenta: { MENSUAL: 99, SEMESTRAL: 689, ANUAL: 1150 },
        comision: { MENSUAL: 99, SEMESTRAL: 110, ANUAL: 150 },
      },
      {
        tier: 'RESTO_HOTEL',
        precioVenta: { MENSUAL: 169, SEMESTRAL: 899, ANUAL: 1690 },
        comision: { MENSUAL: 169, SEMESTRAL: 150, ANUAL: 200 },
      },
    ],
  },
  {
    rubro: 'RESTAURANTES',
    keywords: ['RESTO'],
    planes: [
      {
        tier: 'LITE',
        precioVenta: { MENSUAL: 79, SEMESTRAL: 550, ANUAL: 950 },
        comision: { MENSUAL: 79, SEMESTRAL: 90, ANUAL: 120 },
      },
      {
        tier: 'BASIC',
        precioVenta: { MENSUAL: 99, SEMESTRAL: 689, ANUAL: 1150 },
        comision: { MENSUAL: 99, SEMESTRAL: 110, ANUAL: 150 },
      },
      {
        tier: 'PRO',
        precioVenta: { MENSUAL: 120, SEMESTRAL: 799, ANUAL: 1450 },
        comision: { MENSUAL: 120, SEMESTRAL: 140, ANUAL: 200 },
      },
      {
        tier: 'PLUS',
        precioVenta: { MENSUAL: 150, SEMESTRAL: 990, ANUAL: 1750 },
        comision: { MENSUAL: 150, SEMESTRAL: 190, ANUAL: 225 },
      },
      {
        tier: 'PRODUCCION_LOGISTICA',
        precioVenta: { MENSUAL: 180, SEMESTRAL: 1050, ANUAL: 2100 },
        comision: { MENSUAL: 180, SEMESTRAL: 200, ANUAL: 250 },
      },
    ],
  },
  {
    rubro: 'TIENDAS',
    keywords: ['TIENDA'],
    planes: [
      {
        tier: 'LITE',
        precioVenta: { MENSUAL: 29, SEMESTRAL: 160, ANUAL: 290 },
        comision: { MENSUAL: 29, SEMESTRAL: 40, ANUAL: 50 },
      },
      {
        tier: 'BASIC',
        precioVenta: { MENSUAL: 49, SEMESTRAL: 250, ANUAL: 450 },
        comision: { MENSUAL: 49, SEMESTRAL: 65, ANUAL: 85 },
      },
      {
        tier: 'COMPLETO',
        precioVenta: { MENSUAL: 79, SEMESTRAL: 450, ANUAL: 850 },
        comision: { MENSUAL: 79, SEMESTRAL: 90, ANUAL: 115 },
      },
      {
        tier: 'PREMIUM',
        precioVenta: { MENSUAL: 99, SEMESTRAL: 599, ANUAL: 999 },
        comision: { MENSUAL: 99, SEMESTRAL: 110, ANUAL: 125 },
      },
    ],
  },
  {
    rubro: 'LOYALTY',
    keywords: ['LOYALTY'],
    planes: [
      {
        tier: 'BASICO',
        precioVenta: { MENSUAL: 49, SEMESTRAL: 245, ANUAL: 490 },
        comision: { MENSUAL: 49, SEMESTRAL: 65, ANUAL: 80 },
      },
      {
        tier: 'PUSH_WHATSAPP',
        precioVenta: { MENSUAL: 79, SEMESTRAL: 395, ANUAL: 790 },
        comision: { MENSUAL: 79, SEMESTRAL: 80, ANUAL: 120 },
      },
      {
        tier: 'ENTRADAS_QR_1_EVENTO',
        precioVenta: { MENSUAL: 79, SEMESTRAL: 395, ANUAL: 790 },
        comision: { MENSUAL: 79, SEMESTRAL: 80, ANUAL: 120 },
      },
      {
        tier: 'ENTRADAS_QR_ILIMITADO',
        precioVenta: { MENSUAL: 129, SEMESTRAL: 645, ANUAL: 1290 },
        comision: { MENSUAL: 129, SEMESTRAL: 150, ANUAL: 250 },
      },
      {
        tier: 'DISCOTECAS',
        precioVenta: { MENSUAL: 199, SEMESTRAL: 995, ANUAL: 1990 },
        comision: { MENSUAL: 199, SEMESTRAL: 180, ANUAL: 350 },
      },
    ],
  },
  {
    rubro: 'ASISTENCIA',
    keywords: ['ASISTENCIA'],
    planes: [
      {
        tier: 'ASISTENCIA',
        precioVenta: { MENSUAL: 29, SEMESTRAL: 145, ANUAL: 290 },
        comision: { MENSUAL: 29, SEMESTRAL: 75, ANUAL: 85 },
      },
    ],
  },
];

export const APIREVIEW_KEYWORDS = ['APIREVIEW'];

/** Tramos de comision por volumen acumulado de unidades vendidas en el periodo (marginal, no acumulativo). */
export const APIREVIEW_TRAMOS = [
  { hasta: 10, comisionUnitaria: 44.7 },
  { hasta: 25, comisionUnitaria: 59.6 },
  { hasta: Infinity, comisionUnitaria: 74.5 },
];

function contieneKeyword(textoUpper, keywords) {
  return keywords.some((k) => textoUpper.includes(k));
}

/**
 * Identifica rubro/tier/comision de una venta de sistema a partir de (nombrePlan,
 * nTipoPlan, montoVenta ya parseado). Nunca inventa una tasa: si el rubro, la
 * periodicidad o el precio no matchean ninguna celda conocida de la tabla, devuelve
 * mapeoEncontrado:false y comisionUnitaria:0 para que quede visible en la UI ("sin
 * mapear") en vez de pagar mal silenciosamente.
 */
export function identificarComisionSistema(nombrePlan, nTipoPlan, montoVenta) {
  const textoUpper = (nombrePlan ?? '').toUpperCase();
  const periodicidad = (nTipoPlan ?? '').trim().toUpperCase();

  if (contieneKeyword(textoUpper, APIREVIEW_KEYWORDS)) {
    return { rubro: 'APIREVIEW', tier: 'APIREVIEW', comisionUnitaria: 0, mapeoEncontrado: false };
  }

  for (const { rubro, keywords, planes } of RUBROS_SISTEMA) {
    if (!contieneKeyword(textoUpper, keywords)) continue;

    for (const plan of planes) {
      const precioEsperado = plan.precioVenta[periodicidad];
      const comisionEsperada = plan.comision[periodicidad];
      if (precioEsperado != null && precioEsperado === Number(montoVenta)) {
        return { rubro, tier: plan.tier, comisionUnitaria: comisionEsperada, mapeoEncontrado: true };
      }
    }

    return { rubro, tier: null, comisionUnitaria: 0, mapeoEncontrado: false };
  }

  return { rubro: null, tier: null, comisionUnitaria: 0, mapeoEncontrado: false };
}
