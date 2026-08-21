import { pool } from '../config/db.js';

export async function listByOrdenes(idOrdenes) {
  if (!Array.isArray(idOrdenes) || idOrdenes.length === 0) return [];
  const [rows] = await pool.query(
    `SELECT * FROM comision_equipo_asignado WHERE id_orden_servicio IN (?) ORDER BY creado_en ASC`,
    [idOrdenes]
  );
  return rows;
}

export async function crearAsignacion({
  idOrdenServicio,
  idUsuario,
  codigoItem,
  nombreItem,
  cantidad,
  comisionUnitaria,
  comisionTotal,
}) {
  const [result] = await pool.query(
    `INSERT INTO comision_equipo_asignado
      (id_orden_servicio, id_usuario, codigo_item, nombre_item, cantidad, comision_unitaria, comision_total)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [idOrdenServicio, idUsuario, codigoItem, nombreItem, cantidad, comisionUnitaria, comisionTotal]
  );
  const [rows] = await pool.query('SELECT * FROM comision_equipo_asignado WHERE id = ? LIMIT 1', [result.insertId]);
  return rows[0] ?? null;
}

export async function eliminarAsignacion(id, idUsuario) {
  const [result] = await pool.query('DELETE FROM comision_equipo_asignado WHERE id = ? AND id_usuario = ?', [
    id,
    idUsuario,
  ]);
  return result.affectedRows > 0;
}
