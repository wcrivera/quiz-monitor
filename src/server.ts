// ============================================================================
// SERVER - QUIZ MONITOR BACKEND CON CALIPER
// ============================================================================

import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initializeSocket } from './services/socketService';
import * as canvasService from './services/canvasService';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

initializeSocket(io);
console.log('✅ Socket.io inicializado');

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMPORTANTE: Routes ANTES de static files
app.use(routes);

// Static files
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
console.log('📁 Sirviendo archivos estáticos desde:', publicPath);

// Ruta catch-all para SPA - DEBE IR AL FINAL
app.get('*', (req, res) => {
  // Solo servir index.html para rutas que no sean API
  if (!req.path.startsWith('/api') && 
      !req.path.startsWith('/lti') && 
      !req.path.startsWith('/caliper') &&
      !req.path.startsWith('/health') &&
      !req.path.startsWith('/config.xml')) {
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.use(errorHandler);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-monitor')
  .then(() => {
    console.log('✅ MongoDB: Conectado exitosamente');
    console.log('📊 Base de datos:', mongoose.connection.db?.databaseName);
    
    canvasService.initialize();
    
    console.log('📨 Canvas Caliper Analytics: Activo');
    console.log('⚠️ Polling: Deshabilitado (usando webhooks)');
  })
  .catch((error) => {
    console.error('❌ MongoDB: Error de conexión:', error);
  });

httpServer.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 QUIZ MONITOR BACKEND v2.0 - CALIPER ANALYTICS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📍 Servidor:     http://localhost:${PORT}`);
  console.log(`🔗 Health:       http://localhost:${PORT}/health`);
  console.log(`🎯 LTI Launch:   http://localhost:${PORT}/lti/launch`);
  console.log(`📨 Caliper:      http://localhost:${PORT}/caliper`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

export default app;