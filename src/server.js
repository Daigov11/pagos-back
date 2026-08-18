import app from './app.js';
import { env } from './config/env.js';
import { migrate } from './config/db.js';

migrate()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Backend escuchando en http://localhost:${env.port}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo preparar la base de datos:', error);
    process.exit(1);
  });
