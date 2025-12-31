// ============================================================================
// SOCKET.IO SERVICE - SESIONES ÚNICAS POR IFRAME
// ============================================================================

import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export const initializeSocket = (socketServer: SocketIOServer): void => {
  if (io) {
    console.log('⚠️  Socket.io ya inicializado, omitiendo...');
    return;
  }

  io = socketServer;

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    const quizIds = socket.handshake.query.quizIds as string;

    if (!userId || !quizIds) {
      console.log('❌ Conexión rechazada: falta userId o quizIds');
      socket.disconnect();
      return;
    }

    // Crear ID único: userId-quizId1-quizId2-quizId3 (ordenados)
    const sortedQuizIds = quizIds
      .split(',')
      .map(id => id.trim())
      .sort()
      .join('-');
    
    const uniqueSocketId = `${userId}-${sortedQuizIds}`;
    
    // Asignar como socket.id
    socket.id = uniqueSocketId;

    console.log(`🔌 Iframe conectado: ${uniqueSocketId}`);
    console.log(`   👤 Usuario: ${userId}`);
    console.log(`   📊 Quizzes: ${quizIds}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Iframe desconectado: ${uniqueSocketId}`);
    });
  });

  console.log('✅ Socket.io inicializado (sesiones únicas por iframe)');
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado');
  }
  return io;
};

/**
 * Emitir actualización de quiz a TODOS los iframes que lo monitorean
 */
export const emitQuizUpdate = (userId: string, quizId: string, data: any): void => {
  if (!io) {
    console.error('❌ Socket.io no inicializado');
    return;
  }

  // Encontrar todos los sockets de este usuario que monitorean este quiz
  const sockets = Array.from(io.sockets.sockets.values());
  let emittedCount = 0;

  sockets.forEach((socket: Socket) => {
    // socket.id format: "190276-193158-193159-193160"
    const [socketUserId, ...socketQuizIds] = socket.id.split('-');
    
    // Verificar si este socket pertenece al usuario y monitorea el quiz
    if (socketUserId === userId && socketQuizIds.includes(quizId)) {
      socket.emit('quiz-updated', data);
      emittedCount++;
      console.log(`   ⚡ → Iframe ${socket.id}`);
    }
  });

  if (emittedCount > 0) {
    console.log(`📤 Quiz ${quizId} actualizado → ${emittedCount} iframe(s) de usuario ${userId}`);
  }
};
