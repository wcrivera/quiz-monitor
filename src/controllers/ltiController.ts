// ============================================================================
// LTI CONTROLLER - MÚLTIPLES RUTAS
// ============================================================================

import { Request, Response } from 'express';

/**
 * Manejar LTI Launch genérico
 */
const handleLaunchWithQuizIds = (quizIds: string[]) => {
  return async (req: Request, res: Response): Promise<void> => {
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
      console.log('🆔 Canvas User ID:', custom_canvas_user_id);
      console.log('📊 Quiz IDs:', quizIds);

      const canvasUserId = custom_canvas_user_id || user_id;

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
};

// Exportar controladores para diferentes conjuntos de quizzes
export const handleLaunchQuiz1 = handleLaunchWithQuizIds(['193158']);
export const handleLaunchQuiz2 = handleLaunchWithQuizIds(['193190']);
export const handleLaunchQuiz3 = handleLaunchWithQuizIds(['193158', '193190']);
export const handleLaunchQuiz4 = handleLaunchWithQuizIds(['193161']);
// Agrega más según necesites...