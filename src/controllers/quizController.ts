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

    if (!userId) {
      res.status(400).json({
        ok: false,
        error: 'userId requerido'
      });
      return;
    }

    const stats = await getStudentStats(userId);

    res.json({
      ok: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error en getStats:', error);
    res.status(500).json({
      ok: false,
      error: 'Error obteniendo estadísticas'
    });
  }
};

/**
 * Obtener estado de quizzes para un usuario
 * Combina datos de MongoDB (caché) y Canvas API (source of truth)
 */
export const getQuizStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, quiz_ids } = req.query;

    if (!user_id || !quiz_ids) {
      res.status(400).json({
        ok: false,
        error: 'user_id y quiz_ids requeridos'
      });
      return;
    }

    const userId = user_id as string;
    const quizIdsArray = (quiz_ids as string).split(',').map(id => id.trim());

    console.log(`📊 Quiz Status Request:`);
    console.log(`   👤 User: ${userId}`);
    console.log(`   📋 Quizzes: ${quizIdsArray.join(', ')}`);

    // 1. Obtener datos de MongoDB (histórico/caché)
    const mongoResults = await getStudentQuizResults(userId, quizIdsArray);

    // 2. Obtener datos de Canvas API (actualizado)
    const courseId = process.env.MONITORED_QUIZZES?.split(',')[0]?.split(':')[0] || '';
    const canvasResults = await getUserQuizSubmissions(courseId, userId, quizIdsArray);

    // 3. Combinar y formatear respuesta
    const combinedResults = quizIdsArray.map(quizId => {
      const canvasData = canvasResults.find(r => r.quizId === quizId);
      const mongoData = mongoResults.find(r => r.quizId === quizId);

      return {
        quizId,
        quizTitle: canvasData?.quiz?.title || mongoData?.quizTitle || 'Quiz',
        currentSubmission: canvasData?.submission || null,
        lastResult: mongoData || null,
        fromCache: !!mongoData
      };
    });

    res.json({
      ok: true,
      data: combinedResults
    });

  } catch (error) {
    console.error('❌ Error en getQuizStatus:', error);
    res.status(500).json({
      ok: false,
      error: 'Error obteniendo estado de quizzes'
    });
  }
};
