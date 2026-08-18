import dotenv from 'dotenv';

dotenv.config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendOrigin: required('FRONTEND_ORIGIN', 'http://localhost:5173'),
  externalApiBaseUrl: required('EXTERNAL_API_BASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? 'vendedores_session',
  externalApiFallbackToken: process.env.EXTERNAL_API_FALLBACK_TOKEN ?? null,
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: required('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    database: required('DB_NAME'),
  },
  almacenIdDefault: Number(process.env.ALMACEN_ID_DEFAULT ?? 8),
  documentos: {
    baseUrl: process.env.DOCUMENTOS_API_BASE_URL ?? 'https://apilatam.com/api',
    token: process.env.DOCUMENTOS_API_TOKEN ?? null,
  },
  chatIA: {
    apiKey: process.env.CHATIA_API_KEY ?? null,
    model: process.env.CHATIA_MODEL ?? 'claude-opus-5',
    roles: (process.env.CHATIA_ROLES ?? '_SISTEMAS,ADMINISTRADOR,POSTVENTA')
      .split(',')
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean),
  },
};

export const isProduction = env.nodeEnv === 'production';
