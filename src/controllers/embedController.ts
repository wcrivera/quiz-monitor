// ============================================================================
// EMBED CONTROLLER - Para iframes sin LTI launch completo
// ============================================================================

import { Request, Response } from 'express';

/**
 * Endpoint para embeds que redirige al monitor con user_id detectado
 * Uso: /embed?quiz_ids=193158,193159
 */
export const handleEmbed = async (req: Request, res: Response): Promise<void> => {
  try {
    const quizIds = req.query.quiz_ids as string;

    if (!quizIds) {
      res.status(400).send('Missing quiz_ids parameter');
      return;
    }

    // Generar HTML que hace un mini-LTI launch
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 0; overflow: hidden; }
          #loading { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            font-family: sans-serif;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div id="loading">Cargando monitor...</div>
        <form id="lti-form" method="POST" action="/lti/launch" style="display: none;">
          <input type="hidden" name="quiz_ids_param" value="${quizIds}">
        </form>
        <script>
          // Auto-submit para hacer LTI launch
          document.getElementById('lti-form').submit();
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('❌ Error en embed:', error);
    res.status(500).send('Error loading embed');
  }
};