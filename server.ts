import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import vocabRoutes from './server/modules/vocab-by-topic/vocab.routes.ts';
import videoRoutes from './server/modules/video-vocab/video.routes.ts';
import translateRoutes from './server/modules/translation/translate.service.ts';
import authRoutes from './server/auth/auth.routes.ts';
import { pool } from './server/db/pool.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', async (req, res) => {
    try {
      const starttime = Date.now();
      const dbRes = await pool.query('SELECT current_database() AS db, NOW() AS time,version() AS version');
      const latency = Date.now() - starttime;
      console.log({
        status: 'ok',
        database: {
          connected: true,
          name: dbRes.rows[0].db,
          latency_ms: latency,
          sever_time: dbRes.rows[0].time,

        }
      })
      res.json({ status: 'ok' });
    } catch (error) {
      console.log({
        status: error,
        database: {
          connected: false,
          error_message: error.message,
        }
      })
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.use('/api/vocab', vocabRoutes);
  app.use('/api/video', videoRoutes);
  app.use('/api/translate', translateRoutes);
  app.use('/api/auth', authRoutes);

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
