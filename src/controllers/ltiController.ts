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
      context_id,
      custom_quiz_ids  // ← NUEVO: Leer quiz_ids del custom field
    } = req.body;

    console.log('📝 Procesando LTI Launch...');
    console.log('👤 Usuario:', lis_person_name_full);
    console.log('📚 Curso:', custom_canvas_course_id || context_id);
    console.log('🆔 Canvas User ID:', custom_canvas_user_id);
    console.log('📊 Custom Quiz IDs:', custom_quiz_ids);

    const canvasUserId = custom_canvas_user_id || user_id;

    // Determinar quiz_ids: primero custom_quiz_ids, luego MONITORED_QUIZZES del .env
    let quizIds: string[] = [];
    
    if (custom_quiz_ids) {
      // Viene del custom field del LTI
      quizIds = custom_quiz_ids.split(',').map((id: string) => id.trim());
      console.log('✅ Usando quiz_ids del custom field');
    } else {
      // Fallback a MONITORED_QUIZZES del .env
      const monitoredQuizzes = process.env.MONITORED_QUIZZES || '';
      quizIds = monitoredQuizzes.split(',').map(pair => {
        const [, quizId] = pair.trim().split(':');
        return quizId;
      }).filter(Boolean);
      console.log('✅ Usando quiz_ids del .env');
    }

    if (quizIds.length === 0) {
      console.error('❌ No hay quizzes configurados');
      res.status(500).send('No quizzes configured');
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
