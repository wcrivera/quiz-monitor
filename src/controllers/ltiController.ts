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

    console.log('📝 Procesando LTI Launch...');
    console.log('👤 Usuario:', lis_person_name_full);
    console.log('📚 Curso:', custom_canvas_course_id || context_id);
    console.log('🆔 Canvas User ID:', custom_canvas_user_id);
    console.log('🆔 LTI User ID:', user_id);

    // Usar custom_canvas_user_id si está disponible, sino user_id
    const canvasUserId = custom_canvas_user_id || user_id;

    // Obtener quiz_ids de MONITORED_QUIZZES
    const monitoredQuizzes = process.env.MONITORED_QUIZZES || '';
    const quizIds = monitoredQuizzes.split(',').map(pair => {
      const [, quizId] = pair.trim().split(':');
      return quizId;
    }).filter(Boolean);

    if (quizIds.length === 0) {
      console.error('❌ No hay quizzes configurados en MONITORED_QUIZZES');
      res.status(500).send('No quizzes configured');
      return;
    }

    // Construir URL de redirect con parámetros
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
