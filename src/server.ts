// ============================================================================
// SERVER - QUIZ MONITOR BACKEND
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

const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
console.log('📁 Sirviendo archivos estáticos desde:', publicPath);

app.use(routes);

app.get('/monitor', (_req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath);
});

app.use(errorHandler);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-monitor')
  .then(() => {
    console.log('✅ MongoDB: Conectado exitosamente');
    console.log('📊 Base de datos:', mongoose.connection.db?.databaseName);
    
    canvasService.initialize();
    
    // Polling deshabilitado - usamos webhooks
    console.log('📨 Canvas Webhooks: Activo');
    console.log('⚠️ Polling: Deshabilitado (usando webhooks)');
  })
  .catch((error) => {
    console.error('❌ MongoDB: Error de conexión:', error);
  });

httpServer.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 QUIZ MONITOR BACKEND v2.0 - WEBHOOKS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📍 Servidor:     http://localhost:${PORT}`);
  console.log(`🔗 Health:       http://localhost:${PORT}/health`);
  console.log(`🎯 LTI Launch:   http://localhost:${PORT}/lti/launch`);
  console.log(`📨 Webhook:      http://localhost:${PORT}/webhooks/canvas`);
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