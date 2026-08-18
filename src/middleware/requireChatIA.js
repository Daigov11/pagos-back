import { env } from '../config/env.js';

export function puedeUsarChatIA(user) {
  return Array.isArray(user?.roles) && user.roles.some((r) => env.chatIA.roles.includes((r.rol ?? '').trim().toUpperCase()));
}

export function requireChatIA(req, res, next) {
  if (!puedeUsarChatIA(req.user)) {
    return res.status(403).json({ codResponse: '0', message: 'No tienes permiso para usar el cotizador con IA', data: null });
  }
  next();
}
