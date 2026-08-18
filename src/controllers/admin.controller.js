import { listarReclamos, marcarComoPagado } from '../db/reclamos.repository.js';

export async function listarReclamosAdmin(req, res) {
  const reclamos = await listarReclamos();
  return res.json({ codResponse: '1', message: 'OK', data: reclamos });
}

export async function marcarReclamoPagado(req, res) {
  const { id } = req.params;
  const reclamo = await marcarComoPagado(Number(id));
  if (!reclamo) {
    return res.status(404).json({ codResponse: '0', message: 'Reclamo no encontrado', data: null });
  }
  return res.json({ codResponse: '1', message: 'Reclamo marcado como pagado', data: reclamo });
}
