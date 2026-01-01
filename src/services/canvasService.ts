// ============================================================================
// CANVAS API SERVICE - CON POLLING INTELIGENTE
// ============================================================================

import axios, { AxiosInstance } from 'axios';
import { QuizSubmission, CanvasQuiz } from '../types';
import { processQuizSubmission } from './quizMonitorService';
import { getIO } from './socketService';

let canvasClient: AxiosInstance | null = null;
let monitoredQuizzes: Array<{ courseId: string; quizId: string }> = [];
const processedSubmissions = new Map<string, number>();
let pollingInterval: NodeJS.Timeout | null = null;

/**
 * Inicializar servicio de Canvas
 */
export const initialize = (): void => {
  const canvasApiUrl = process.env.CANVAS_API_URL;
  const canvasToken = process.env.CANVAS_ACCESS_TOKEN;

  if (!canvasApiUrl || !canvasToken) {
    console.error('❌ Canvas API no configurado');
    return;
  }

  canvasClient = axios.create({
    baseURL: canvasApiUrl,
    headers: {
      Authorization: `Bearer ${canvasToken}`
    },
    timeout: 10000
  });

  const quizzesConfig = process.env.MONITORED_QUIZZES || '';
  if (quizzesConfig) {
    monitoredQuizzes = quizzesConfig.split(',').map(pair => {
      const [courseId, quizId] = pair.trim().split(':');
      return { courseId, quizId };
    });
    console.log(`📊 Monitoreando ${monitoredQuizzes.length} quiz(zes)`);
  }

  console.log('✅ Canvas API: Configurado');
};

/**
 * Verificar si el servicio está listo
 */
export const isReady = (): boolean => {
  return canvasClient !== null && monitoredQuizzes.length > 0;
};

/**
 * Obtener detalles de un quiz
 */
export const getQuiz = async (courseId: string, quizId: string): Promise<CanvasQuiz | null> => {
  if (!canvasClient) {
    console.error('❌ Canvas client no inicializado');
    return null;
  }

  if (!courseId || !quizId) {
    console.error('❌ courseId o quizId faltante');
    return null;
  }

  try {
    const response = await canvasClient.get<CanvasQuiz>(`/courses/${courseId}/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error obteniendo quiz ${quizId}:`, error);
    return null;
  }
};

/**
 * Obtener submissions de un quiz
 */
export const getQuizSubmissions = async (
  courseId: string,
  quizId: string
): Promise<QuizSubmission[]> => {
  if (!canvasClient) {
    console.error('❌ Canvas client no inicializado');
    return [];
  }

  if (!courseId || !quizId) {
    console.error('❌ courseId o quizId faltante');
    return [];
  }

  try {
    const response = await canvasClient.get<{ quiz_submissions: QuizSubmission[] }>(
      `/courses/${courseId}/quizzes/${quizId}/submissions`,
      {
        params: {
          per_page: 100
        }
      }
    );

    return response.data.quiz_submissions || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ Error obteniendo submissions del quiz ${quizId}:`, error.message);
    }
    return [];
  }
};

/**
 * Obtener submissions de un usuario específico en múltiples quizzes
 */
export const getUserQuizSubmissions = async (
  courseId: string,
  userId: string,
  quizIds: string[]
): Promise<Array<{ quizId: string; submission: QuizSubmission | null; quiz: CanvasQuiz | null }>> => {
  if (!courseId) {
    console.error('❌ courseId es requerido');
    return [];
  }

  const results = [];

  for (const quizId of quizIds) {
    const quiz = await getQuiz(courseId, quizId);
    const submissions = await getQuizSubmissions(courseId, quizId);
    const userSubmission = submissions.find(s => s.user_id.toString() === userId) || null;

    results.push({
      quizId,
      quiz,
      submission: userSubmission
    });
  }

  return results;
};

/**
 * Polling de un quiz específico
 */
const pollQuiz = async (courseId: string, quizId: string): Promise<void> => {
  try {
    const quiz = await getQuiz(courseId, quizId);
    if (!quiz) {
      return;
    }

    const submissions = await getQuizSubmissions(courseId, quizId);

    const newCompletedSubmissions = submissions.filter(sub => {
      const key = `${sub.quiz_id}-${sub.user_id}-${sub.attempt}`;
      const lastProcessed = processedSubmissions.get(key);
      const now = Date.now();
      
      // Considerar "nueva" si nunca se procesó o si han pasado más de 5 minutos
      const isNew = !lastProcessed || (now - lastProcessed) > 300000;
      
      return sub.workflow_state === 'complete' && isNew;
    });

    if (newCompletedSubmissions.length > 0) {
      console.log(`📥 ${newCompletedSubmissions.length} nuevas submissions completadas en quiz ${quizId}`);
    }

    for (const submission of newCompletedSubmissions) {
      const key = `${submission.quiz_id}-${submission.user_id}-${submission.attempt}`;
      
      try {
        await processQuizSubmission(submission, quiz.title, courseId);
        processedSubmissions.set(key, Date.now());
      } catch (error) {
        console.error(`❌ Error procesando submission ${key}:`, error);
      }
    }
  } catch (error) {
    console.error(`❌ Error en polling del quiz ${quizId}:`, error);
  }
};

/**
 * Ejecutar polling de todos los quizzes monitoreados
 * SOLO si hay usuarios conectados
 */
const runPolling = async (): Promise<void> => {
  if (!isReady()) {
    return;
  }

  // Obtener número de sockets conectados
  const io = getIO();
  const connectedSockets = io.sockets.sockets.size;

  if (connectedSockets === 0) {
    console.log('⏸️ No hay usuarios conectados, omitiendo polling');
    return;
  }

  console.log(`🔄 Polling activo - ${connectedSockets} usuario(s) conectado(s)`);

  for (const { courseId, quizId } of monitoredQuizzes) {
    await pollQuiz(courseId, quizId);
  }
};

/**
 * Iniciar polling inteligente
 */
export const startPolling = (): void => {
  if (!canvasClient) {
    initialize();
  }

  if (!isReady()) {
    console.error('❌ No se puede iniciar polling - Canvas API no configurado');
    return;
  }

  const enablePolling = process.env.ENABLE_POLLING === 'true';
  if (!enablePolling) {
    console.log('⏸️ Polling deshabilitado en configuración');
    return;
  }

  const intervalSeconds = parseInt(process.env.POLL_INTERVAL_SECONDS || '10');
  const intervalMs = intervalSeconds * 1000;

  console.log(`⏱️ Polling inteligente activado cada ${intervalSeconds} segundos`);
  console.log('💡 Solo hace polling cuando hay usuarios conectados');

  // Ejecutar inmediatamente
  runPolling();

  // Limpiar intervalo previo si existe
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  // Configurar intervalo
  pollingInterval = setInterval(() => {
    runPolling();
  }, intervalMs);
};

/**
 * Detener polling
 */
export const stopPolling = (): void => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('⏸️ Polling detenido');
  }
};


// // ============================================================================
// // CANVAS API SERVICE - SIN POLLING (USA WEBHOOKS)
// // ============================================================================

// import axios, { AxiosInstance } from 'axios';
// import { QuizSubmission, CanvasQuiz } from '../types';

// let canvasClient: AxiosInstance | null = null;

// /**
//  * Inicializar servicio de Canvas
//  */
// export const initialize = (): void => {
//   const canvasApiUrl = process.env.CANVAS_API_URL;
//   const canvasToken = process.env.CANVAS_ACCESS_TOKEN;

//   if (!canvasApiUrl || !canvasToken) {
//     console.error('❌ Canvas API no configurado');
//     return;
//   }

//   canvasClient = axios.create({
//     baseURL: canvasApiUrl,
//     headers: {
//       Authorization: `Bearer ${canvasToken}`
//     },
//     timeout: 10000
//   });

//   console.log('✅ Canvas API: Configurado');
//   console.log('📨 Usando Canvas Webhooks (polling deshabilitado)');
// };

// /**
//  * Verificar si el servicio está listo
//  */
// export const isReady = (): boolean => {
//   return canvasClient !== null;
// };

// /**
//  * Obtener detalles de un quiz
//  */
// export const getQuiz = async (courseId: string, quizId: string): Promise<CanvasQuiz | null> => {
//   if (!canvasClient) {
//     console.error('❌ Canvas client no inicializado');
//     return null;
//   }

//   try {
//     const response = await canvasClient.get<CanvasQuiz>(`/courses/${courseId}/quizzes/${quizId}`);
//     return response.data;
//   } catch (error) {
//     console.error(`❌ Error obteniendo quiz ${quizId}:`, error);
//     return null;
//   }
// };

// /**
//  * Obtener submissions de un quiz
//  */
// export const getQuizSubmissions = async (
//   courseId: string,
//   quizId: string
// ): Promise<QuizSubmission[]> => {
//   if (!canvasClient) {
//     console.error('❌ Canvas client no inicializado');
//     return [];
//   }

//   try {
//     const response = await canvasClient.get<{ quiz_submissions: QuizSubmission[] }>(
//       `/courses/${courseId}/quizzes/${quizId}/submissions`,
//       {
//         params: {
//           per_page: 100
//         }
//       }
//     );

//     return response.data.quiz_submissions || [];
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       console.error(`❌ Error obteniendo submissions del quiz ${quizId}:`, error.message);
//     }
//     return [];
//   }
// };

// /**
//  * Obtener submissions de un usuario específico en múltiples quizzes
//  */
// export const getUserQuizSubmissions = async (
//   courseId: string,
//   userId: string,
//   quizIds: string[]
// ): Promise<Array<{ quizId: string; submission: QuizSubmission | null; quiz: CanvasQuiz | null }>> => {
//   const results = [];

//   for (const quizId of quizIds) {
//     const quiz = await getQuiz(courseId, quizId);
//     const submissions = await getQuizSubmissions(courseId, quizId);
//     const userSubmission = submissions.find(s => s.user_id.toString() === userId) || null;

//     results.push({
//       quizId,
//       quiz,
//       submission: userSubmission
//     });
//   }

//   return results;
// };

// // Polling deshabilitado - ahora usamos webhooks
// export const startPolling = (): void => {
//   console.log('⚠️ Polling deshabilitado - usando Canvas Webhooks');
// };

// export const stopPolling = (): void => {
//   console.log('⚠️ Polling ya está deshabilitado');
// };