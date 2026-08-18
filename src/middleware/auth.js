import { env } from '../config/env.js';
import { verifySession } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.[env.sessionCookieName];

  if (!token) {
    return res.status(401).json({ codResponse: '0', message: 'No autenticado', data: null });
  }

  try {
    const session = verifySession(token);
    req.user = session.user;
    req.externalToken = session.externalToken;
    next();
  } catch {
    return res.status(401).json({ codResponse: '0', message: 'Sesion invalida o expirada', data: null });
  }
}
