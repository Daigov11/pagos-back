const ROLES_ADMIN = ['_SISTEMAS', 'ADMINISTRADOR'];

export function esAdmin(user) {
  return Array.isArray(user?.roles) && user.roles.some((r) => ROLES_ADMIN.includes((r.rol ?? '').trim().toUpperCase()));
}

export function requireAdmin(req, res, next) {
  if (!esAdmin(req.user)) {
    return res.status(403).json({ codResponse: '0', message: 'No tienes permiso para acceder a este recurso', data: null });
  }
  next();
}
