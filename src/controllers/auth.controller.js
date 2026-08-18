import { env, isProduction } from '../config/env.js';
import { loginExternal } from '../services/externalApi.service.js';
import { signSession } from '../utils/jwt.js';

const SESSION_COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8h, alineado con JWT_EXPIRES_IN por defecto

function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

export async function login(req, res) {
  const { usuario, password } = req.body ?? {};

  if (!usuario || !password) {
    return res.status(400).json({ codResponse: '0', message: 'Usuario y contraseña son requeridos', data: null });
  }

  let externalResponse;
  try {
    externalResponse = await loginExternal(usuario, password);
  } catch (error) {
    if (error.response) {
      // La API externa respondio con error (credenciales invalidas, etc.)
      return res.status(error.response.status).json(
        error.response.data ?? { codResponse: '0', message: 'Credenciales invalidas', data: null }
      );
    }
    console.error('Error llamando a la API externa de login:', error.message);
    return res.status(502).json({ codResponse: '0', message: 'No se pudo contactar el servicio de autenticacion', data: null });
  }

  if (externalResponse.codResponse !== '1' || !externalResponse.data?.token) {
    return res.status(401).json(externalResponse);
  }

  const { token: externalToken, ...user } = externalResponse.data;

  const sessionToken = signSession({ user, externalToken });
  res.cookie(env.sessionCookieName, sessionToken, cookieOptions());

  return res.json({ codResponse: '1', message: externalResponse.message, data: user });
}

export async function me(req, res) {
  return res.json({ codResponse: '1', message: 'OK', data: req.user });
}

export async function logout(req, res) {
  res.clearCookie(env.sessionCookieName, { ...cookieOptions(), maxAge: undefined });
  return res.json({ codResponse: '1', message: 'Sesion cerrada', data: null });
}
