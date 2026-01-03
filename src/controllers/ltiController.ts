// ============================================================================
// LTI CONTROLLER - CON LOGS COMPLETOS PARA DEBUG
// ============================================================================

import { Request, Response } from 'express';

export const handleLaunch = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 LTI LAUNCH - DATOS COMPLETOS DE CANVAS');
    console.log('═══════════════════════════════════════════════════════════');
    
    // 🔍 MOSTRAR TODO EL BODY
    console.log('📦 req.body COMPLETO:');
    console.log(JSON.stringify(req.body, null, 2));
    
    console.log('');
    console.log('───────────────────────────────────────────────────────────');
    console.log('📋 CAMPOS IMPORTANTES:');
    console.log('───────────────────────────────────────────────────────────');
    
    const {
      custom_canvas_user_id,
      user_id,
      custom_canvas_course_id,
      context_id,
      lis_person_name_full,
      lis_person_name_given,
      lis_person_name_family,
      lis_person_contact_email_primary,
      roles,
      resource_link_title,
      resource_link_description,
      launch_presentation_return_url,
      tool_consumer_instance_name
    } = req.body;

    console.log('👤 custom_canvas_user_id:', custom_canvas_user_id);
    console.log('👤 user_id (fallback):', user_id);
    console.log('📚 custom_canvas_course_id:', custom_canvas_course_id);
    console.log('📚 context_id (fallback):', context_id);
    console.log('👨 Nombre completo:', lis_person_name_full);
    console.log('👨 Nombre:', lis_person_name_given);
    console.log('👨 Apellido:', lis_person_name_family);
    console.log('📧 Email:', lis_person_contact_email_primary);
    console.log('👔 Roles:', roles);
    console.log('📌 Resource title:', resource_link_title);
    console.log('📝 Resource description:', resource_link_description);
    console.log('🔙 Return URL:', launch_presentation_return_url);
    console.log('🏫 Institution:', tool_consumer_instance_name);
    
    console.log('');
    console.log('───────────────────────────────────────────────────────────');
    console.log('⚙️ EXTRACCIÓN DE IDs:');
    console.log('───────────────────────────────────────────────────────────');

    // Extraer user_id
    const canvasUserId = custom_canvas_user_id || user_id;
    console.log('✅ User ID final:', canvasUserId);
    
    if (!canvasUserId) {
      console.error('❌ ERROR: No se pudo obtener user_id');
      console.log('═══════════════════════════════════════════════════════════');
      res.status(400).send('Error: No user_id found');
      return;
    }

    // Extraer course_id
    const courseId = custom_canvas_course_id || context_id || '90302';
    console.log('✅ Course ID final:', courseId);

    // Extraer quiz_ids de la ruta
    const quizIdsParam = req.params.quizIds || req.params[0];
    console.log('📊 Quiz IDs (de ruta):', quizIdsParam);
    
    let quizIds: string[] = [];
    
    if (quizIdsParam) {
      quizIds = quizIdsParam.split(',').map(id => id.trim()).filter(Boolean);
      console.log('✅ Quiz IDs parseados:', quizIds);
    } else {
      const monitoredQuizzes = process.env.MONITORED_QUIZZES || '';
      quizIds = monitoredQuizzes.split(',').map(pair => {
        const [, quizId] = pair.trim().split(':');
        return quizId;
      }).filter(Boolean);
      console.log('⚠️ Quiz IDs desde .env:', quizIds);
    }

    console.log('');
    console.log('───────────────────────────────────────────────────────────');
    console.log('🔄 REDIRECCIÓN:');
    console.log('───────────────────────────────────────────────────────────');
    
    const frontendUrl = `/monitor?user_id=${canvasUserId}&course_id=${courseId}&quiz_ids=${quizIds.join(',')}`;
    console.log('🎯 URL destino:', frontendUrl);
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