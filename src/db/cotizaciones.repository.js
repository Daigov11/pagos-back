import { pool } from '../config/db.js';

export async function crearCotizacion({
  idUsuario,
  usuario,
  nombrecompleto,
  clienteNombre,
  clienteTipoDocumento,
  clienteNumeroDocumento,
  prompt,
  respuesta,
  total,
}) {
  const [result] = await pool.query(
    `INSERT INTO cotizaciones
      (id_usuario, usuario, nombrecompleto, cliente_nombre, cliente_tipo_documento, cliente_numero_documento, prompt, respuesta, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idUsuario,
      usuario,
      nombrecompleto,
      clienteNombre ?? null,
      clienteTipoDocumento ?? null,
      clienteNumeroDocumento ?? null,
      prompt,
      JSON.stringify(respuesta),
      total,
    ]
  );
  const [rows] = await pool.query('SELECT * FROM cotizaciones WHERE id = ? LIMIT 1', [result.insertId]);
  return rows[0];
}

export async function listarCotizacionesUsuario(idUsuario, limit = 50) {
  const [rows] = await pool.query(
    'SELECT * FROM cotizaciones WHERE id_usuario = ? ORDER BY creado_en DESC LIMIT ?',
    [idUsuario, limit]
  );
  return rows;
}

export async function obtenerCotizacionPorId(id, idUsuario) {
  const [rows] = await pool.query('SELECT * FROM cotizaciones WHERE id = ? AND id_usuario = ? LIMIT 1', [id, idUsuario]);
  return rows[0] ?? null;
}

export async function actualizarCotizacion(id, idUsuario, respuesta, total) {
  await pool.query('UPDATE cotizaciones SET respuesta = ?, total = ? WHERE id = ? AND id_usuario = ?', [
    JSON.stringify(respuesta),
    total,
    id,
    idUsuario,
  ]);
  return obtenerCotizacionPorId(id, idUsuario);
}

export async function eliminarCotizacion(id, idUsuario) {
  const [result] = await pool.query('DELETE FROM cotizaciones WHERE id = ? AND id_usuario = ?', [id, idUsuario]);
  return result.affectedRows > 0;
}
