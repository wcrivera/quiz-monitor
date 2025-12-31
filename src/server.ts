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

// Cargar variables de entorno
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Crear servidor HTTP
const httpServer = createServer(app);

// Configurar Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Inicializar Socket.io
initializeSocket(io);
console.log('✅ Socket.io inicializado');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (frontend build)
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
console.log('📁 Sirviendo archivos estáticos desde:', publicPath);

// Routes
app.use(routes);

// Ruta para servir frontend en /monitor
app.get('/monitor', (_req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath);
});

// Error handler
app.use(errorHandler);

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-monitor')
  .then(() => {
    console.log('✅ MongoDB: Conectado exitosamente');
    console.log('📊 Base de datos:', mongoose.connection.db?.databaseName);
    
    // Inicializar Canvas API service
    canvasService.initialize();
    
    // Iniciar polling si está habilitado
    if (process.env.ENABLE_POLLING === 'true') {
      canvasService.startPolling();
    }
  })
  .catch((error) => {
    console.error('❌ MongoDB: Error de conexión:', error);
  });

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 QUIZ MONITOR BACKEND v2.0');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📍 Servidor:     http://localhost:${PORT}`);
  console.log(`🔗 Health:       http://localhost:${PORT}/health`);
  console.log(`🎯 LTI Launch:   http://localhost:${PORT}/lti/launch`);
  console.log(`📁 Monitor:      http://localhost:${PORT}/monitor`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

export default app;
