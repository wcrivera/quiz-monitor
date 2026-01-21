// ============================================================================
// SERVER - LTI CANVAS CONTENT VIEWER - CORREGIDO
// ============================================================================

import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://tu-app.herokuapp.com']  // Producción
    : ['http://localhost:3000', 'http://localhost:5173'], // Desarrollo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// También permitir iframe
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// ROUTES
// ============================================================================

app.use(routes);

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use(errorHandler);

// ============================================================================
// STATIC FILES (SOLO EN PRODUCCIÓN)
// ============================================================================

// ⚠️ IMPORTANTE: En desarrollo NO servir archivos estáticos
// El frontend corre en su propio servidor Vite (puerto 3000)
// Solo en producción se sirven archivos estáticos desde /public

if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));
  console.log('📁 Sirviendo archivos estáticos desde:', publicPath);
}

// ============================================================================
// FALLBACK PARA SPA
// ============================================================================

app.get('*', (req: Request, res: Response) => {
  // Si es una ruta de API que no existe, devolver 404 JSON
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/lti') || 
      req.path.startsWith('/debug')) {
    return res.status(404).json({ 
      ok: false, 
      error: 'Endpoint not found',
      path: req.path,
      availableEndpoints: [
        'GET /health',
        'GET /api/debug/token',
        'GET /debug/login',
        'POST /lti/launch',
        'GET /api/usuario/obtener/:curso_id/:user_id',
        'GET /api/curso/obtener/:curso_id',
        'GET /api/capitulo/obtener/:curso_id'
      ]
    });
  }
  
  // En producción, servir SPA
  if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(__dirname, '../public');
    const indexPath = path.join(publicPath, 'index.html');
    return res.sendFile(indexPath);
  }
  
  // En desarrollo, no servir nada (frontend está en puerto 3000)
  res.status(404).json({ 
    ok: false, 
    error: 'This is the backend API server. Frontend runs on port 3000.',
    path: req.path,
    message: 'If you want to access the frontend, go to http://localhost:3000'
  });
});

// ============================================================================
// MONGODB CONNECTION
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lti-content-viewer';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB: Conectado exitosamente');
    const dbName = mongoose.connection.db?.databaseName || 'unknown';
    console.log('📊 Base de datos:', dbName);
  })
  .catch((error) => {
    console.error('❌ MongoDB: Error de conexión:', error);
    process.exit(1);
  });

// ============================================================================
// START SERVER
// ============================================================================

httpServer.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 LTI CANVAS CONTENT VIEWER - BACKEND');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📍 Servidor:     http://localhost:${PORT}`);
  console.log(`🔗 Health:       http://localhost:${PORT}/health`);
  console.log(`🎯 LTI Launch:   http://localhost:${PORT}/lti/launch`);
  console.log(`🐛 Debug Token:  http://localhost:${PORT}/api/debug/token`);
  console.log(`🐛 Debug Login:  http://localhost:${PORT}/debug/login`);
  console.log('───────────────────────────────────────────────────────────');
  console.log(`🌍 Modo:         ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Static files: ${process.env.NODE_ENV === 'production' ? 'ENABLED' : 'DISABLED'}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

export default app;