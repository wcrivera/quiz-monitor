// ============================================================================
// CALIPER ANALYTICS CONTROLLER
// ============================================================================

import { Request, Response } from 'express';
import { processQuizSubmission } from '../services/quizMonitorService';
import { getQuiz } from '../services/canvasService';

/**
 * Manejar eventos Caliper de Canvas
 */
export const handleCaliperEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📨 Evento Caliper recibido');
    
    const events = Array.isArray(req.body) ? req.body : [req.body];
    
    for (const event of events) {
      console.log('📦 Tipo de evento:', event.type);
      console.log('📦 Acción:', event.action);
      
      // Procesar eventos de Assessment (Quiz)
      if (event.type === 'AssessmentEvent' || event.type === 'GradeEvent') {
        await processCaliperAssessmentEvent(event);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error procesando evento Caliper:', error);
    res.status(200).json({ received: true }); // Siempre 200 para Canvas
  }
};

/**
 * Procesar evento de Assessment/Grade
 */
const processCaliperAssessmentEvent = async (event: any): Promise<void> => {
  try {
    // Extraer datos del evento Caliper
    const actor = event.actor; // Estudiante
    const object = event.object; // Quiz/Assignment
    const generated = event.generated; // Resultado/Score
    
    console.log('🎯 Actor:', actor?.id);
    console.log('📝 Object:', object?.id);
    console.log('📊 Generated:', generated);

    // Solo procesar si es "Submitted" o "Graded"
    if (event.action !== 'Submitted' && event.action !== 'Graded') {
      console.log('⏭️ Acción no relevante, omitiendo');
      return;
    }

    // Extraer IDs de Canvas
    const actorId = extractCanvasId(actor?.id);
    const objectId = extractCanvasId(object?.id);
    
    if (!actorId || !objectId) {
      console.log('⚠️ No se pudieron extraer IDs del evento');
      return;
    }

    // Obtener información del quiz desde Canvas API
    const courseId = extractCourseId(object?.id) || 
                     process.env.MONITORED_QUIZZES?.split(',')[0]?.split(':')[0] || '';
    
    const quiz = await getQuiz(courseId, objectId);
    
    if (!quiz) {
      console.log('⚠️ No se pudo obtener información del quiz');
      return;
    }

    // Construir objeto submission compatible
    const submission = {
      id: Date.now(),
      quiz_id: parseInt(objectId),
      user_id: parseInt(actorId),
      submission_id: Date.now(),
      started_at: event.eventTime,
      finished_at: event.eventTime,
      end_at: event.eventTime,
      attempt: generated?.attempt || 1,
      score: generated?.scoreGiven || 0,
      workflow_state: 'complete' as const,
      quiz_points_possible: generated?.scoreMaximum || quiz.points_possible || 0,
      submitted_at: event.eventTime
    };

    // Procesar submission
    await processQuizSubmission(submission, quiz.title, courseId);
    
    console.log('✅ Evento Caliper procesado exitosamente');
    
  } catch (error) {
    console.error('❌ Error procesando evento de assessment:', error);
  }
};

/**
 * Extraer ID numérico de Canvas desde URI
 * Ejemplo: "https://cursos.canvas.uc.cl/users/13656" -> "13656"
 */
const extractCanvasId = (uri: string | undefined): string | null => {
  if (!uri) return null;
  const match = uri.match(/\/(\d+)$/);
  return match ? match[1] : null;
};

/**
 * Extraer Course ID desde URI
 */
const extractCourseId = (uri: string | undefined): string | null => {
  if (!uri) return null;
  const match = uri.match(/\/courses\/(\d+)\//);
  return match ? match[1] : null;
};

/**
 * Endpoint de verificación
 */
export const verifyCaliperEndpoint = (_req: Request, res: Response): void => {
  res.status(200).json({
    ok: true,
    message: 'Caliper endpoint is ready',
    accepting: ['AssessmentEvent', 'GradeEvent']
  });
};