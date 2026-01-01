// ============================================================================
// QUIZ CONTROLLER
// ============================================================================

import { Request, Response } from 'express';
import { getStudentStats, getStudentQuizResults } from '../services/quizMonitorService';
import { getUserQuizSubmissions } from '../services/canvasService';

/**
 * Obtener estadísticas de un estudiante
 */
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    console.log(`📊 Stats Request: User ${userId}`);

    const stats = await getStudentStats(userId);

    res.json(stats);
  } catch (error) {
    console.error('❌ Error obteniendo stats:', error);
    res.status(500).json({
      ok: false,
      error: 'Error obteniendo estadísticas'
    });
  }
};

/**
 * Obtener estado de quizzes específicos
 */
export const getQuizStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.user_id as string;
    const quizIdsParam = req.query.quiz_ids as string;
    
    console.log('📊 Quiz Status Request:');
    console.log('👤 User:', userId);
    console.log('📋 Quizzes:', quizIdsParam);

    if (!userId || !quizIdsParam) {
      res.status(400).json({
        ok: false,
        error: 'Missing user_id or quiz_ids'
      });
      return;
    }

    const quizIds = quizIdsParam.split(',').map(id => id.trim());

    // Extraer courseId del MONITORED_QUIZZES o usar default
    const monitoredQuizzes = process.env.MONITORED_QUIZZES || '';
    const firstPair = monitoredQuizzes.split(',')[0];
    const courseId = firstPair ? firstPair.trim().split(':')[0] : '90302';

    console.log('📚 Course ID:', courseId);

    // Obtener resultados de MongoDB
    const dbResults = await getStudentQuizResults(userId, quizIds);
    
    // Obtener datos actualizados de Canvas API
    const canvasResults = await getUserQuizSubmissions(courseId, userId, quizIds);

    // Combinar resultados
    const combined = quizIds.map(quizId => {
      const dbResult = dbResults.find(r => r.quizId === quizId);
      const canvasResult = canvasResults.find(r => r.quizId === quizId);

      // Si hay datos de Canvas, usarlos (son más recientes)
      if (canvasResult?.submission) {
        return {
          quizId,
          quizTitle: canvasResult.quiz?.title || dbResult?.quizTitle || 'Quiz',
          status: canvasResult.submission.workflow_state,
          score: canvasResult.submission.score || 0,
          possiblePoints: canvasResult.submission.quiz_points_possible || 0,
          attempt: canvasResult.submission.attempt || 1,
          submittedAt: canvasResult.submission.submitted_at || canvasResult.submission.finished_at
        };
      }

      // Fallback a datos de MongoDB
      if (dbResult) {
        return {
          quizId,
          quizTitle: dbResult.quizTitle,
          status: dbResult.workflowState,
          score: dbResult.score,
          possiblePoints: dbResult.possiblePoints,
          attempt: dbResult.attempt,
          submittedAt: dbResult.submittedAt
        };
      }

      // No hay datos
      return {
        quizId,
        quizTitle: canvasResult?.quiz?.title || 'Quiz',
        status: 'not_started',
        score: 0,
        possiblePoints: canvasResult?.quiz?.points_possible || 0,
        attempt: 0,
        submittedAt: null
      };
    });

    res.json({
      ok: true,
      results: combined
    });

  } catch (error) {
    console.error('❌ Error en quiz status:', error);
    res.status(500).json({
      ok: false,
      error: 'Error obteniendo estado de quizzes'
    });
  }
};