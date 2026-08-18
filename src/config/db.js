import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
});

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reclamos_comision (
      id INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario VARCHAR(20) NOT NULL,
      usuario VARCHAR(50) NOT NULL,
      nombrecompleto VARCHAR(150) NOT NULL,
      periodo_inicio DATE NOT NULL,
      periodo_fin DATE NOT NULL,
      suma_venta_sistemas DECIMAL(10, 2) NOT NULL,
      monto_comision DECIMAL(10, 2) NOT NULL,
      estado ENUM('pendiente', 'pagado') NOT NULL DEFAULT 'pendiente',
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      pagado_en DATETIME NULL,
      UNIQUE KEY uniq_usuario_periodo (id_usuario, periodo_inicio, periodo_fin)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cotizaciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario VARCHAR(20) NOT NULL,
      usuario VARCHAR(50) NOT NULL,
      nombrecompleto VARCHAR(150) NOT NULL,
      cliente_nombre VARCHAR(200) NULL,
      cliente_tipo_documento ENUM('DNI', 'RUC') NULL,
      cliente_numero_documento VARCHAR(20) NULL,
      prompt TEXT NOT NULL,
      respuesta JSON NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_usuario (id_usuario)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}
