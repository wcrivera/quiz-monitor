// ============================================================================
// DEBUG CONTROLLER - API JSON (NO HTML)
// backend/src/controllers/debugController.ts
// ============================================================================

import { Request, Response } from 'express';
import { generateJWT, generateSessionId } from '../utils/jwt';
import Usuario from '../models/usuario';

/**
 * Endpoint que devuelve JWT como JSON
 * USO: GET /api/debug/token?user_id=13656&course_id=104914
 */
export const getDebugToken = async (req: Request, res: Response): Promise<void> => {
  console.log('HOLA')
  // Solo en desarrollo
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Debug endpoint disabled in production' });
    return;
  }

  try {
    const { user_id, course_id } = req.query;

    if (!user_id || !course_id) {
      res.status(400).json({
        error: 'Missing parameters',
        usage: '/api/debug/token?user_id=13656&course_id=104914'
      });
      return;
    }

    console.log('🐛 DEBUG: Generando JWT para desarrollo');
    console.log('   User ID:', user_id);
    console.log('   Course ID:', course_id);

    const sessionId = generateSessionId();

    const token = generateJWT({
      userId: user_id as string,
      courseId: course_id as string,
      userName: 'Debug User',
      courseName: 'Debug Course',
      roles: 'StudentEnrollment',
      sessionId: sessionId
    });

    console.log('✅ JWT generado para frontend');

    // ========================================================================
    // FASE 2: CREAR USUARIO
    // ========================================================================

    console.log('👥 Verificando/creando usuario en base de datos');

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({
      canvas_user_id: parseInt(user_id as string),
      canvas_course_id: parseInt(course_id as string)
    });

    if (usuarioExistente) {
      console.log('✅ Usuario ya existe en la base de datos');
    } else {
      console.log('➕ Usuario no encontrado, creando nuevo usuario');
      const nuevoUsuario = new Usuario({
        nombre: 'Claudio',
        apellido: 'Rivera',
        email: 'wcrivera@uc.cl',
        canvas_user_id: parseInt(user_id as string),
        canvas_course_id: parseInt(course_id as string)
      });
      await nuevoUsuario.save();
    }

    // Devolver como JSON
    res.json({
      ok: true,
      token: token,
      userId: user_id,
      courseId: course_id,
      sessionId: sessionId,
      expiresIn: '2h'
    });

  } catch (error) {
    console.error('❌ Error generando token:', error);
    res.status(500).json({ error: 'Error generating token' });
  }
};

/**
 * Página HTML simple para testing
 * USO: GET /debug/login?user_id=13656&course_id=104914
 */
export const debugLogin = async (req: Request, res: Response): Promise<void> => {

  console.log(process.env.NODE_ENV)
  console.log(req)
  console.log(res)

  if (process.env.NODE_ENV === 'production') {
    res.status(403).send('Debug endpoint disabled in production');
    return;
  }

  const { user_id, course_id } = req.query;
  const userId = user_id || '13656';
  const courseId = course_id || '104914';

  console.log(userId)
  console.log(courseId)

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>🐛 Debug JWT</title>
      <style>
        body {
          font-family: monospace;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #1e1e1e;
          color: #d4d4d4;
        }
        .box {
          background: #2d2d2d;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        button {
          background: #007acc;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
        }
        button:hover {
          background: #005a9e;
        }
        pre {
          background: #1e1e1e;
          padding: 15px;
          border-radius: 3px;
          overflow-x: auto;
        }
        .success { color: #4ec9b0; }
        .error { color: #f48771; }
      </style>
    </head>
    <body>
      <h1>🐛 Debug JWT Generator</h1>
      
      <div class="box">
        <h3>📝 Parámetros:</h3>
        <p>User ID: <strong>${userId}</strong></p>
        <p>Course ID: <strong>${courseId}</strong></p>
        <button onclick="generateToken()">🔐 Generar JWT</button>
      </div>

      <div class="box" id="result" style="display: none;">
        <h3>✅ Token Generado:</h3>
        <pre id="token"></pre>
        <button onclick="copyToken()">📋 Copiar Token</button>
        <button onclick="openFrontend()">🚀 Abrir Frontend</button>
      </div>

      <div class="box">
        <h3>📖 Instrucciones:</h3>
        <ol>
          <li>Click en "Generar JWT"</li>
          <li>Click en "Abrir Frontend"</li>
          <li>El JWT se inyectará automáticamente</li>
        </ol>
      </div>

      <script>
        let currentToken = '';

        async function generateToken() {
          try {
            const response = await fetch('/api/debug/token?user_id=${userId}&course_id=${courseId}');
            const data = await response.json();
            
            if (data.ok) {
              currentToken = data.token;
              document.getElementById('token').textContent = data.token;
              document.getElementById('result').style.display = 'block';
              console.log('✅ Token generado:', data);
            } else {
              alert('❌ Error: ' + data.error);
            }
          } catch (error) {
            alert('❌ Error: ' + error.message);
          }
        }

        function copyToken() {
          navigator.clipboard.writeText(currentToken);
          alert('✅ Token copiado al portapapeles');
        }

        function openFrontend() {
          if (!currentToken) {
            alert('❌ Primero genera el token');
            return;
          }

          // Abrir frontend e inyectar token
          const frontendWindow = window.open('http://localhost:3000/curso', '_blank');
          
          setTimeout(() => {
            if (frontendWindow) {
              frontendWindow.postMessage({
                type: 'INJECT_JWT',
                token: currentToken,
                userId: '${userId}',
                courseId: '${courseId}'
              }, 'http://localhost:3000');
              
              console.log('📤 Token enviado a frontend');
            }
          }, 1000);
        }
      </script>
    </body>
    </html>
  `);
};