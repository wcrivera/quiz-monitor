// ============================================================================
// CANVAS API SERVICE - SIN POLLING (USA CALIPER)
// ============================================================================

import axios, { AxiosInstance } from 'axios';
import { QuizSubmission, CanvasQuiz } from '../types';

let canvasClient: AxiosInstance | null = null;

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

  console.log('✅ Canvas API: Configurado');
  console.log('📨 Usando Caliper Analytics (polling deshabilitado)');
};

/**
 * Verificar si el servicio está listo
 */
export const isReady = (): boolean => {
  return canvasClient !== null;
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

// Polling deshabilitado
export const startPolling = (): void => {
  console.log('⚠️ Polling deshabilitado - usando Caliper Analytics');
};

export const stopPolling = (): void => {
  console.log('⚠️ Polling ya está deshabilitado');
};