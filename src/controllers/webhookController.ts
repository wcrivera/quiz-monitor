// ============================================================================
// WEBHOOK CONTROLLER - CANVAS WEBHOOKS
// ============================================================================

import { Request, Response } from 'express';
import { processQuizSubmission } from '../services/quizMonitorService';
import { getQuiz } from '../services/canvasService';

/**
 * Manejar webhooks de Canvas
 * Canvas envía eventos cuando se completa un quiz
 */
export const handleCanvasWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📨 Webhook recibido de Canvas');
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));

    const event = req.body;

    // Validar que sea un evento de submission
    if (!event || !event.metadata) {
      console.log('⚠️ Webhook sin metadata, ignorando');
      res.status(200).send('OK');
      return;
    }

    const { event_name, metadata } = event;

    // Solo procesar eventos de quiz submission
    if (!event_name?.includes('submission')) {
      console.log('⚠️ Evento no es de submission, ignorando');
      res.status(200).send('OK');
      return;
    }

    // Extraer datos del evento
    const submissionData = metadata?.body || event.body;
    
    if (!submissionData) {
      console.log('⚠️ Webhook sin datos de submission');
      res.status(200).send('OK');
      return;
    }

    console.log('📊 Submission data:', {
      quiz_id: submissionData.quiz_id,
      user_id: submissionData.user_id,
      workflow_state: submissionData.workflow_state,
      attempt: submissionData.attempt
    });

    // Solo procesar si está completado
    if (submissionData.workflow_state !== 'complete') {
      console.log('⏳ Submission no completada aún, ignorando');
      res.status(200).send('OK');
      return;
    }

    // Obtener info del quiz
    const courseId = submissionData.course_id?.toString() || 
                     process.env.MONITORED_QUIZZES?.split(',')[0]?.split(':')[0] || '';
    
    const quiz = await getQuiz(courseId, submissionData.quiz_id.toString());
    
    if (!quiz) {
      console.error('❌ No se pudo obtener info del quiz');
      res.status(200).send('OK');
      return;
    }

    // Procesar submission (guarda en MongoDB y emite por Socket.io)
    await processQuizSubmission(submissionData, quiz.title, courseId);

    console.log('✅ Webhook procesado exitosamente');
    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    // Siempre retornar 200 para que Canvas no reintente
    res.status(200).send('OK');
  }
};

/**
 * Endpoint de verificación para Canvas
 * Canvas puede hacer un GET para verificar que el webhook está activo
 */
export const verifyWebhook = (_req: Request, res: Response): void => {
  res.status(200).json({
    ok: true,
    message: 'Canvas Webhook endpoint is ready'
  });
};