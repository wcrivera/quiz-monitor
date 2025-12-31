// ============================================================================
// LTI CONTROLLER
// ============================================================================

import { Request, Response } from 'express';

/**
 * Manejar LTI Launch desde Canvas
 */
export const handleLaunch = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      custom_canvas_user_id,
      user_id,
      lis_person_name_full,
      custom_canvas_course_id,
      context_id
    } = req.body;

    // IMPORTANTE: Leer quiz_ids del query parameter
    const quizIdsFromQuery = req.query.quiz_ids as string | undefined;

    console.log('📝 Procesando LTI Launch...');
    console.log('👤 Usuario:', lis_person_name_full);
    console.log('📚 Curso:', custom_canvas_course_id || context_id);
    console.log('🆔 Canvas User ID:', custom_canvas_user_id);
    console.log('🆔 LTI User ID:', user_id);
    console.log('📊 Quiz IDs (query):', quizIdsFromQuery);

    const canvasUserId = custom_canvas_user_id || user_id;

    // Determinar quiz_ids con prioridad:
    // 1. Query parameter (desde iframe)
    // 2. Fallback a MONITORED_QUIZZES del .env
    let quizIds: string[] = [];
    
    if (quizIdsFromQuery) {
      quizIds = quizIdsFromQuery.split(',').map(id => id.trim());
      console.log('✅ Usando quiz_ids del query parameter:', quizIds);
    } else {
      // Fallback a MONITORED_QUIZZES del .env
      const monitoredQuizzes = process.env.MONITORED_QUIZZES || '';
      quizIds = monitoredQuizzes.split(',').map(pair => {
        const [, quizId] = pair.trim().split(':');
        return quizId;
      }).filter(Boolean);
      console.log('✅ Usando quiz_ids del .env (fallback):', quizIds);
    }

    if (quizIds.length === 0) {
      console.error('❌ No hay quizzes configurados');
      res.status(500).send('No quizzes configured. Pass quiz_ids as query parameter.');
      return;
    }

    const frontendUrl = `/monitor?user_id=${canvasUserId}&quiz_ids=${quizIds.join(',')}`;
    console.log('🔄 Redirigiendo a:', frontendUrl);

    res.redirect(frontendUrl);

  } catch (error) {
    console.error('❌ Error en LTI launch:', error);
    res.status(500).json({
      ok: false,
      error: 'Error procesando LTI launch'
    });
  }
};