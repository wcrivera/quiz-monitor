// ============================================================================
// SOCKET.IO SERVICE - SESIONES ÚNICAS POR IFRAME
// ============================================================================

import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

// Mapa para trackear qué socket maneja qué quizzes
const socketQuizMap = new Map<string, { userId: string; quizIds: string[] }>();

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

    // Crear ID único de room: userId-quizId1-quizId2-quizId3 (ordenados)
    const sortedQuizIds = quizIds
      .split(',')
      .map(id => id.trim())
      .sort();
    
    const uniqueRoomId = `${userId}-${sortedQuizIds.join('-')}`;
    
    // Unir socket a la room única
    socket.join(uniqueRoomId);
    
    // Guardar mapping para este socket
    socketQuizMap.set(socket.id, {
      userId,
      quizIds: sortedQuizIds
    });

    console.log(`🔌 Iframe conectado:`);
    console.log(`   🆔 Socket ID: ${socket.id}`);
    console.log(`   🏠 Room: ${uniqueRoomId}`);
    console.log(`   👤 Usuario: ${userId}`);
    console.log(`   📊 Quizzes: ${quizIds}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Iframe desconectado: ${socket.id}`);
      socketQuizMap.delete(socket.id);
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

  let emittedCount = 0;

  // Iterar sobre todos los sockets conectados
  socketQuizMap.forEach((socketData, socketId) => {
    // Verificar si este socket pertenece al usuario y monitorea el quiz
    if (socketData.userId === userId && socketData.quizIds.includes(quizId)) {
      // Emitir al socket específico
      io!.to(socketId).emit('quiz-updated', data);
      emittedCount++;
      
      const roomId = `${userId}-${socketData.quizIds.join('-')}`;
      console.log(`   ⚡ → Room ${roomId}`);
    }
  });

  if (emittedCount > 0) {
    console.log(`📤 Quiz ${quizId} actualizado → ${emittedCount} iframe(s) de usuario ${userId}`);
  } else {
    console.log(`⚠️  Quiz ${quizId} - Usuario ${userId} no tiene iframes conectados`);
  }
};