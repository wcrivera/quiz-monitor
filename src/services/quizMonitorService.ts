// ============================================================================
// QUIZ MONITOR SERVICE
// ============================================================================

import QuizResult from '../models/QuizResult';
import { emitQuizUpdate } from './socketService';
import { QuizSubmission } from '../types';

/**
 * Procesar submission de Canvas y guardar en BD
 */
export const processQuizSubmission = async (
  submission: QuizSubmission,
  quizTitle: string,
  courseId: string
): Promise<any> => {
  try {
    const userId = submission.user_id.toString();
    const quizId = submission.quiz_id.toString();

    // Verificar si ya existe
    const existing = await QuizResult.findOne({
      userId,
      quizId,
      attempt: submission.attempt
    });

    if (existing) {
      console.log(`⚠️  Submission ya existe: Usuario ${userId} - Intento ${submission.attempt}`);
      return existing;
    }

    // Crear nuevo resultado
    const quizResult = new QuizResult({
      userId,
      quizId,
      quizTitle,
      score: submission.score || 0,
      possiblePoints: submission.quiz_points_possible || 0,
      percentageScore: ((submission.score || 0) / (submission.quiz_points_possible || 1)) * 100,
      submittedAt: new Date(submission.finished_at || submission.submitted_at || Date.now()),
      attempt: submission.attempt || 1,
      workflowState: submission.workflow_state,
      submissionId: submission.submission_id?.toString() || submission.id.toString(),
      courseId: courseId,
      studentId: userId,
      studentName: 'Canvas User'
    });

    await quizResult.save();

    console.log(`✅ Quiz result guardado: ${quizTitle} - Usuario ${userId}`);

    // Emitir a Socket.io a TODOS los iframes que monitorean este quiz
    emitQuizUpdate(userId, quizId, {
      userId,
      quizId,
      quizTitle,
      score: submission.score || 0,
      possiblePoints: submission.quiz_points_possible || 0,
      percentageScore: quizResult.percentageScore,
      submittedAt: quizResult.submittedAt,
      attempt: submission.attempt || 1
    });

    return quizResult;
  } catch (error: any) {
    // Si es error de duplicado (E11000), ignorar silenciosamente
    if (error.code === 11000) {
      console.log(`⚠️  Submission duplicada ignorada: Usuario ${submission.user_id} - Intento ${submission.attempt}`);
      return null;
    }
    
    console.error('❌ Error procesando submission:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de un estudiante
 */
export const getStudentStats = async (userId: string) => {
  try {
    const results = await QuizResult.find({ userId });

    const completados = results.length;
    const totalPoints = results.reduce((sum, r) => sum + r.score, 0);
    const totalPossible = results.reduce((sum, r) => sum + r.possiblePoints, 0);
    const promedio = totalPossible > 0 ? (totalPoints / totalPossible) * 100 : 0;

    return {
      completados,
      enProgreso: 0,
      totalQuizzes: completados,
      promedio
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return {
      completados: 0,
      enProgreso: 0,
      totalQuizzes: 0,
      promedio: 0
    };
  }
};

/**
 * Obtener resultados de un estudiante en quizzes específicos
 */
export const getStudentQuizResults = async (userId: string, quizIds: string[]) => {
  try {
    const results = await QuizResult.find({
      userId,
      quizId: { $in: quizIds }
    }).sort({ submittedAt: -1 });

    return results;
  } catch (error) {
    console.error('❌ Error obteniendo resultados:', error);
    return [];
  }
};
