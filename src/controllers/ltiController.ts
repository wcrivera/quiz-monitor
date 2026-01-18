// ============================================================================
// LTI CONTROLLER - CONTENT VIEWER CON JWT
// ============================================================================

import { Request, Response } from 'express';
import { generateJWT, generateSessionId } from '../utils/jwt';
import Usuario from '../models/usuario';

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
      lis_person_name_full,
      lis_person_name_given, 
      lis_person_name_family, 
      lis_person_contact_email_primary,
      custom_canvas_user_login_id, 
      context_title,
      roles
    } = req.body;


    console.log('👤 User ID (custom):', custom_canvas_user_id);
    console.log('👤 User ID (fallback):', user_id);
    console.log('📚 Course ID (custom):', custom_canvas_course_id);
    console.log('📚 Course ID (fallback):', context_id);
    console.log('👨 Usuario:', lis_person_name_full);
    console.log('👨 Usuario (given):', lis_person_name_given);
    console.log('👨 Usuario (family):', lis_person_name_family);
    console.log('📧 Email:', lis_person_contact_email_primary);
    console.log('👤 User Login ID:', custom_canvas_user_login_id);
    console.log('📖 Curso:', context_title);
    console.log('🎭 Roles:', roles);

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

    // ========================================================================
    // FASE 1: GENERAR JWT TOKEN
    // ========================================================================

    const sessionId = generateSessionId();

    const token = generateJWT({
      userId: canvasUserId,
      courseId: courseId,
      userName: lis_person_name_full,
      courseName: context_title,
      roles: roles,
      sessionId: sessionId
    });

    console.log(token)

    console.log('🔐 JWT Token generado');
    console.log('   📝 Session ID:', sessionId);
    console.log('   ⏰ Expira en: 2 horas');

    // ========================================================================
    // FASE 2: CREAR USUARIO
    // ========================================================================

    console.log('👥 Verificando/creando usuario en base de datos');

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({
      canvas_user_id: parseInt(canvasUserId),
      canvas_course_id: parseInt(courseId)
    });

    if (usuarioExistente) {
      console.log('✅ Usuario ya existe en la base de datos');
    } else {
      console.log('➕ Usuario no encontrado, creando nuevo usuario');
      const nuevoUsuario = new Usuario({
        nombre: lis_person_name_given,
        apellido: lis_person_name_family,
        email: lis_person_contact_email_primary,
        canvas_user_id: parseInt(canvasUserId),
        canvas_course_id: parseInt(courseId)
      });
      await nuevoUsuario.save();
    }

    // ========================================================================
    // ENVIAR TOKEN AL FRONTEND (SIN EXPONER EN URL)
    // ========================================================================

    console.log('🎯 Enviando token al frontend vía script injection');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // HTML que inyecta el token en sessionStorage y redirige
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cargando...</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .loader {
            text-align: center;
            color: white;
          }
          .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h2 {
            margin: 0;
            font-weight: 500;
          }
          p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <h2>Cargando curso...</h2>
          <p>Autenticando con Canvas</p>
        </div>
        
        <script>
          console.log('🔐 LTI Launch - Guardando token de sesión');
          
          // Guardar token en sessionStorage (más seguro que localStorage)
          sessionStorage.setItem('lti_token', '${token}');
          
          // Guardar datos básicos para debug (NO CRÍTICO, solo para consola)
          sessionStorage.setItem('lti_user_id', '${canvasUserId}');
          sessionStorage.setItem('lti_course_id', '${courseId}');
          
          console.log('✅ Token guardado en sessionStorage');
          console.log('📝 User ID:', '${canvasUserId}');
          console.log('📝 Course ID:', '${courseId}');
          
          // Redirigir al frontend SIN exponer datos en URL
          console.log('🎯 Redirigiendo a /curso');
          window.location.href = '/curso';
        </script>
      </body>
      </html>
    `);

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