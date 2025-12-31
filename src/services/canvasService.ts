// ============================================================================
// CANVAS API SERVICE - POLLING DE QUIZZES
// ============================================================================

import axios, { AxiosInstance } from 'axios';
import { QuizSubmission, CanvasQuiz } from '../types';
import { processQuizSubmission } from './quizMonitorService';

let canvasClient: AxiosInstance | null = null;
let monitoredQuizzes: Array<{ courseId: string; quizId: string }> = [];
const processedSubmissions = new Set<string>();
let pollingInterval: NodeJS.Timeout | null = null;

/**
 * Inicializar servicio de Canvas
 */
export const initialize = (): void => {
  const canvasApiUrl = process.env.CANVAS_API_URL;
  const canvasToken = process.env.CANVAS_ACCESS_TOKEN;

  if (!canvasApiUrl || !canvasToken) {
    console.error('❌ Canvas API no configurado (falta CANVAS_API_URL o CANVAS_ACCESS_TOKEN)');
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
 * Procesar submissions de un quiz
 */
const pollQuiz = async (courseId: string, quizId: string): Promise<void> => {
  try {
    const quiz = await getQuiz(courseId, quizId);
    if (!quiz) {
      console.error(`❌ No se pudo obtener info del quiz ${quizId}`);
      return;
    }

    const submissions = await getQuizSubmissions(courseId, quizId);
    console.log(`🔍 Polling quiz ${quizId}: ${submissions.length} submissions encontrados`);

    const newCompletedSubmissions = submissions.filter(sub => {
      const key = `${sub.quiz_id}-${sub.user_id}-${sub.attempt}`;
      const isCompleted = sub.workflow_state === 'complete';
      const isNew = !processedSubmissions.has(key);
      
      return isCompleted && isNew;
    });

    for (const submission of newCompletedSubmissions) {
      const key = `${submission.quiz_id}-${submission.user_id}-${submission.attempt}`;
      
      try {
        await processQuizSubmission(submission, quiz.title, courseId);
        processedSubmissions.add(key);
        console.log(`✅ Nueva submission procesada: Quiz ${quizId}, Usuario ${submission.user_id}, Intento ${submission.attempt}`);
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
 */
const runPolling = async (): Promise<void> => {
  if (!isReady()) {
    console.warn('⚠️ Canvas service no está listo para polling');
    return;
  }

  for (const { courseId, quizId } of monitoredQuizzes) {
    await pollQuiz(courseId, quizId);
  }
};

/**
 * Iniciar polling automático
 */
export const startPolling = (): void => {
  if (!canvasClient) {
    initialize();
  }

  if (!isReady()) {
    console.error('❌ No se puede iniciar polling: Canvas service no está configurado correctamente');
    return;
  }

  const intervalSeconds = parseInt(process.env.POLL_INTERVAL_SECONDS || '30', 10);
  const intervalMs = intervalSeconds * 1000;

  console.log(`⏱️  Polling activo cada ${intervalSeconds} segundos`);

  runPolling();

  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

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
    console.log('⏸️  Polling detenido');
  }
};

/**
 * Limpiar cache de submissions procesadas
 */
export const clearProcessedCache = (): void => {
  processedSubmissions.clear();
  console.log('🧹 Cache de submissions limpiado');
};
