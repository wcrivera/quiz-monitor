// ============================================================================
// SERVER - LTI CANVAS CONTENT VIEWER
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

// app.use(cors({
//   origin: '*',
//   credentials: true
// }));

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

// app.use((req, res, next) => {
//   res.removeHeader('X-Frame-Options');
//   next();
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// ROUTES
// ============================================================================

app.use(routes);

// ============================================================================
// STATIC FILES
// ============================================================================

const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
console.log('📁 Sirviendo archivos estáticos desde:', publicPath);

// Fallback para SPA
app.get('*', (req: Request, res: Response) => {
  if (!req.path.startsWith('/api') &&
    !req.path.startsWith('/lti') &&
    !req.path.startsWith('/health')) {
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ ok: false, error: 'Endpoint not found' });
  }
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use(errorHandler);

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