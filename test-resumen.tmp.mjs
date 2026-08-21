import 'dotenv/config';
import { calcularResumenComision } from './src/services/comisiones.service.js';

const req = {
  externalToken: process.env.EXTERNAL_API_FALLBACK_TOKEN,
  user: { nombrecompleto: 'LIZARIETH MARIALIS PEÑA CASTELLANOS' },
};
const periodo = { fechaInicio: '2026-02-01', fechaFin: '2026-02-28' };

const resumen = await calcularResumenComision(req, periodo);
console.log('cantidadVentas:', resumen.cantidadVentas, 'sumaVentaSistemas:', resumen.sumaVentaSistemas, 'meta:', resumen.meta, 'metaAlcanzada:', resumen.metaAlcanzada);

const conEquipo = resumen.ventas.filter((v) => v.montoEquipoFacturado > 0);
console.log('ventas con equipo facturado:', conEquipo.length);
for (const v of conEquipo) {
  console.log('---');
  console.log('idOrdenServicio:', v.idOrdenServicio, 'montoEquipoFacturado:', v.montoEquipoFacturado);
  console.log('nrosComprobanteEquipo:', v.nrosComprobanteEquipo);
  console.log('facturaEquipoDetalle:', JSON.stringify(v.facturaEquipoDetalle));
}
