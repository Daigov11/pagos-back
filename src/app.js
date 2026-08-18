import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import comisionesRoutes from './routes/comisiones.routes.js';
import cotizadorRoutes from './routes/cotizador.routes.js';
import ventasRoutes from './routes/ventas.routes.js';

const app = express();

app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  })
);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/comisiones', comisionesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cotizador', cotizadorRoutes);

app.use((req, res) => {
  res.status(404).json({ codResponse: '0', message: 'Ruta no encontrada', data: null });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ codResponse: '0', message: 'Error interno del servidor', data: null });
});

export default app;
