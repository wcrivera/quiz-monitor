// ============================================================================
// LTI CONTROLLER - CON PARÁMETROS DINÁMICOS
// ============================================================================

import { Request, Response } from 'express';

/**
 * Manejar LTI Launch con quiz_ids desde parámetro de ruta
 * Ejemplo: /lti/launch/193158,193190
 */
export const handleLaunch = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      custom_canvas_user_id,
      user_id,
      lis_person_name_full,
    } = req.body;

    // Leer quiz_ids del parámetro de ruta
    const quizIdsParam = req.params.quizIds || req.params[0];
    
    console.log('📝 Procesando LTI Launch...');
    console.log('👤 Usuario:', lis_person_name_full);
    console.log('🆔 Canvas User ID:', custom_canvas_user_id);
    console.log('📊 Quiz IDs (param):', quizIdsParam);

    const canvasUserId = custom_canvas_user_id || user_id;

    let quizIds: string[] = [];
    
    if (quizIdsParam) {
      // Parsear quiz_ids del parámetro (pueden venir separados por comas)
      quizIds = quizIdsParam.split(',').map(id => id.trim()).filter(Boolean);
      console.log('✅ Usando quiz_ids del parámetro de ruta:', quizIds);
    } else {
      // Fallback a .env
      const monitoredQuizzes = process.env.MONITORED_QUIZZES || '';
      quizIds = monitoredQuizzes.split(',').map(pair => {
        const [, quizId] = pair.trim().split(':');
        return quizId;
      }).filter(Boolean);
      console.log('✅ Usando quiz_ids del .env (fallback):', quizIds);
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