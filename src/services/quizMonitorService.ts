// ============================================================================
// QUIZ MONITOR SERVICE - MÚLTIPLES INTENTOS
// ============================================================================

import QuizResult from '../models/QuizResult';
import { emitQuizUpdate } from './socketService';
import { QuizSubmission } from '../types';

/**
 * Procesar submission de Canvas y guardar en BD
 * Permite múltiples intentos
 */
export const processQuizSubmission = async (
  submission: QuizSubmission,
  quizTitle: string,
  courseId: string
): Promise<any> => {
  try {
    const userId = submission.user_id.toString();
    const quizId = submission.quiz_id.toString();
    const attempt = submission.attempt || 1;

    console.log(`🔄 Procesando submission: Usuario ${userId}, Quiz ${quizId}, Intento ${attempt}`);

    // Verificar si ya existe este intento específico
    const existing = await QuizResult.findOne({
      userId,
      quizId,
      attempt
    });

    if (existing) {
      console.log(`⚠️ Intento ${attempt} ya existe, actualizando...`);
      
      // Actualizar el existente
      existing.score = submission.score || 0;
      existing.possiblePoints = submission.quiz_points_possible || 0;
      existing.percentageScore = ((submission.score || 0) / (submission.quiz_points_possible || 1)) * 100;
      existing.submittedAt = new Date(submission.finished_at || submission.submitted_at || Date.now());
      existing.workflowState = submission.workflow_state;
      
      await existing.save();
      
      // Emitir actualización
      emitQuizUpdate(userId, quizId, {
        userId,
        quizId,
        quizTitle,
        score: existing.score,
        possiblePoints: existing.possiblePoints,
        percentageScore: existing.percentageScore,
        submittedAt: existing.submittedAt,
        attempt: existing.attempt
      });
      
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
      attempt,
      workflowState: submission.workflow_state,
      submissionId: submission.submission_id?.toString() || submission.id.toString(),
      courseId: courseId,
      studentId: userId,
      studentName: 'Canvas User'
    });

    await quizResult.save();

    console.log(`✅ Quiz result guardado: ${quizTitle} - Usuario ${userId} - Intento ${attempt}`);

    // Emitir a Socket.io
    emitQuizUpdate(userId, quizId, {
      userId,
      quizId,
      quizTitle,
      score: submission.score || 0,
      possiblePoints: submission.quiz_points_possible || 0,
      percentageScore: quizResult.percentageScore,
      submittedAt: quizResult.submittedAt,
      attempt
    });

    return quizResult;
  } catch (error: any) {
    console.error('❌ Error procesando submission:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de un estudiante
 * Calcula correctamente completados vs en progreso
 */
export const getStudentStats = async (userId: string) => {
  try {
    // Obtener todos los resultados del usuario
    const results = await QuizResult.find({ userId }).sort({ submittedAt: -1 });

    // Agrupar por quizId y obtener el último intento de cada uno
    const quizMap = new Map<string, typeof results[0]>();
    
    results.forEach(result => {
      const existing = quizMap.get(result.quizId);
      if (!existing || result.attempt > existing.attempt) {
        quizMap.set(result.quizId, result);
      }
    });

    const latestResults = Array.from(quizMap.values());

    // Calcular stats
    const completados = latestResults.filter(r => r.workflowState === 'complete').length;
    const enProgreso = latestResults.filter(r => 
      r.workflowState === 'pending_review' || 
      r.workflowState === 'untaken'
    ).length;

    const completedResults = latestResults.filter(r => r.workflowState === 'complete');
    const totalPoints = completedResults.reduce((sum, r) => sum + r.score, 0);
    const totalPossible = completedResults.reduce((sum, r) => sum + r.possiblePoints, 0);
    const promedio = totalPossible > 0 ? (totalPoints / totalPossible) * 100 : 0;

    return {
      completados,
      enProgreso,
      totalQuizzes: latestResults.length,
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
 * Retorna solo el último intento de cada quiz
 */
export const getStudentQuizResults = async (userId: string, quizIds: string[]) => {
  try {
    const results = await QuizResult.find({
      userId,
      quizId: { $in: quizIds }
    }).sort({ submittedAt: -1 });

    // Agrupar por quizId y retornar solo el último intento
    const quizMap = new Map<string, typeof results[0]>();
    
    results.forEach(result => {
      const existing = quizMap.get(result.quizId);
      if (!existing || result.attempt > existing.attempt) {
        quizMap.set(result.quizId, result);
      }
    });

    return Array.from(quizMap.values());
  } catch (error) {
    console.error('❌ Error obteniendo resultados:', error);
    return [];
  }
};