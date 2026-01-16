// ============================================================================
// LTI CONTROLLER - CONTENT VIEWER
// ============================================================================

import { Request, Response } from 'express';

/**
 * Manejar LTI Launch desde Canvas
 */
export const handleLaunch = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 LTI LAUNCH - CONTENT VIEWER');
    console.log('═══════════════════════════════════════════════════════════');

    const {
      custom_canvas_user_id,
      user_id,
      custom_canvas_course_id,
      context_id,
      lis_person_name_full
    } = req.body;

    console.log('👤 User ID (custom):', custom_canvas_user_id);
    console.log('👤 User ID (fallback):', user_id);
    console.log('📚 Course ID (custom):', custom_canvas_course_id);
    console.log('📚 Course ID (fallback):', context_id);
    console.log('👨 Usuario:', lis_person_name_full);

    // Extraer user_id
    const canvasUserId = custom_canvas_user_id || user_id;
    if (!canvasUserId) {
      console.error('❌ ERROR: No se pudo obtener user_id');
      res.status(400).send('Error: No user_id found in LTI launch');
      return;
    }
    console.log('✅ User ID final:', canvasUserId);

    // Extraer course_id
    const courseId = custom_canvas_course_id || context_id;
    if (!courseId) {
      console.error('❌ ERROR: No se pudo obtener course_id');
      res.status(400).send('Error: No course_id found in LTI launch');
      return;
    }
    console.log('✅ Course ID final:', courseId);

    // Redirigir al frontend
    const frontendUrl = `/curso?user_id=${canvasUserId}&course_id=${courseId}`;
    console.log('🎯 Redirigiendo a:', frontendUrl);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    res.redirect(frontendUrl);

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ ERROR EN LTI LAUNCH:');
    console.error('═══════════════════════════════════════════════════════════');
    console.error(error);
    console.error('═══════════════════════════════════════════════════════════');
    console.error('');
    res.status(500).send('Error processing LTI launch');
  }
};