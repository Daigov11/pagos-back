const TASA_COMISION_SISTEMA_POR_TIPO_PLAN = {
  MENSUAL: 0.3,
  SEMESTRAL: 0.2,
  TRIMESTRAL: 0.15,
  ANUAL: 0.1,
};

export function getTasaComisionSistema(nTipoPlan) {
  const key = (nTipoPlan ?? '').trim().toUpperCase();
  return TASA_COMISION_SISTEMA_POR_TIPO_PLAN[key] ?? 0;
}

const ORIGEN_PAGO_EQUIPO = 'ADMINISTRATIVO EQUIPO';
const TASA_COMISION_EQUIPO = 0.3;

export function montoEquipo(venta) {
  if (!Array.isArray(venta.pagos)) return 0;
  return venta.pagos
    .filter((p) => (p.origen ?? '').trim().toUpperCase() === ORIGEN_PAGO_EQUIPO)
    .reduce((sum, p) => sum + Number(p.total ?? 0), 0);
}

export function comisionEquipo(venta) {
  return montoEquipo(venta) * TASA_COMISION_EQUIPO;
}
