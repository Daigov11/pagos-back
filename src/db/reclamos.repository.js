import { pool } from '../config/db.js';

export async function findReclamo({ idUsuario, periodoInicio, periodoFin }) {
  const [rows] = await pool.query(
    'SELECT * FROM reclamos_comision WHERE id_usuario = ? AND periodo_inicio = ? AND periodo_fin = ? LIMIT 1',
    [idUsuario, periodoInicio, periodoFin]
  );
  return rows[0] ?? null;
}

export async function crearReclamo({
  idUsuario,
  usuario,
  nombrecompleto,
  periodoInicio,
  periodoFin,
  sumaVentaSistemas,
  montoComision,
}) {
  const [result] = await pool.query(
    `INSERT INTO reclamos_comision
      (id_usuario, usuario, nombrecompleto, periodo_inicio, periodo_fin, suma_venta_sistemas, monto_comision)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [idUsuario, usuario, nombrecompleto, periodoInicio, periodoFin, sumaVentaSistemas, montoComision]
  );
  return findReclamoPorId(result.insertId);
}

export async function findReclamoPorId(id) {
  const [rows] = await pool.query('SELECT * FROM reclamos_comision WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function listarReclamos() {
  const [rows] = await pool.query('SELECT * FROM reclamos_comision ORDER BY creado_en DESC');
  return rows;
}

export async function marcarComoPagado(id) {
  await pool.query(
    "UPDATE reclamos_comision SET estado = 'pagado', pagado_en = NOW() WHERE id = ? AND estado = 'pendiente'",
    [id]
  );
  return findReclamoPorId(id);
}
