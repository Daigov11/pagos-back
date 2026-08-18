import axios from 'axios';
import { env } from '../config/env.js';

const client = axios.create({
  baseURL: env.documentos.baseUrl,
  timeout: 10000,
});

/**
 * Consulta DNI o RUC en apilatam.com. OJO: cada endpoint espera el header
 * Authorization con un formato distinto (comprobado contra la API real):
 * - ruc_pro: "Authorization: <token>" (sin "Bearer")
 * - dni_pro: "Authorization: Bearer <token>"
 */
export async function consultarDocumento(tipo, numero) {
  if (!env.documentos.token) {
    const error = new Error('DOCUMENTOS_API_TOKEN no configurado');
    error.code = 'DOCUMENTOS_NOT_CONFIGURED';
    throw error;
  }

  if (tipo === 'ruc') {
    const { data } = await client.get(`/ruc_pro/${numero}`, {
      headers: { Authorization: env.documentos.token },
    });
    if (!data.success) return null;
    return {
      tipoDocumento: 'RUC',
      numeroDocumento: data.data.ruc,
      nombre: data.data.nombre_o_razon_social,
      estado: data.data.estado,
    };
  }

  if (tipo === 'dni') {
    const { data } = await client.get(`/dni_pro/${numero}`, {
      headers: { Authorization: `Bearer ${env.documentos.token}` },
    });
    if (!data.success) return null;
    return {
      tipoDocumento: 'DNI',
      numeroDocumento: data.data.numero,
      nombre: data.data.nombre_completo,
      estado: null,
    };
  }

  const error = new Error('Tipo de documento invalido');
  error.code = 'TIPO_INVALIDO';
  throw error;
}
