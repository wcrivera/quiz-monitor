// ============================================================================
// SOCKET SERVICE - CORREGIDO
// ============================================================================

import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer;

export const initializeSocket = (socketServer: SocketIOServer): void => {
  io = socketServer;

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    const quizIds = socket.handshake.query.quizIds as string;

    if (!userId || !quizIds) {
      console.log('⚠️ Conexión sin userId o quizIds');
      return;
    }

    const room = `${userId}-${quizIds}`;
    socket.join(room);

    console.log('🔌 Iframe conectado:');
    console.log('🆔 Socket ID:', socket.id);
    console.log('🏠 Room:', room);
    console.log('👤 Usuario:', userId);
    console.log('📊 Quizzes:', quizIds);

    socket.on('disconnect', () => {
      console.log('🔌 Iframe desconectado:', socket.id);
    });
  });

  console.log('✅ Socket.io inicializado (sesiones únicas por iframe)');
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io no inicializado');
  }
  return io;
};

export const emitQuizUpdate = (userId: string, quizId: string, data: any): void => {
  if (!io) {
    console.error('❌ Socket.io no disponible para emitir');
    return;
  }

  console.log(`📡 Intentando emitir actualización para userId: ${userId}, quizId: ${quizId}`);

  // Obtener todas las salas activas
  const rooms = Array.from(io.sockets.adapter.rooms.keys());
  console.log('🏠 Salas activas:', rooms);

  let emitted = false;

  // Emitir a todas las salas que coincidan
  rooms.forEach(roomName => {
    // Verificar si el room contiene este userId y quizId
    if (roomName.includes(userId) && roomName.includes(quizId)) {
      console.log(`📡 Emitiendo a room: ${roomName}`);
      io.to(roomName).emit('quiz-update', data);
      emitted = true;
    }
  });

  if (!emitted) {
    console.log('⚠️ No se emitió a ninguna sala');
  }
};