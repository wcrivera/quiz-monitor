import { RequestHandler } from "express";

export const obtenerUsuario: RequestHandler = async (req, res) => {
  const { curso_id, user_id } = req.params;

  const canvasApiUrl = process.env.CANVAS_API_URL;
  const canvasToken = process.env.CANVAS_ACCESS_TOKEN;

  // ✅ Validar variables de entorno
  if (!canvasApiUrl || !canvasToken) {
    console.error('❌ Canvas API no configurado - faltan variables de entorno');
    return res.status(500).json({
      ok: false,
      msg: "Configuración del servidor incompleta",
    });
  }

  try {
    const url = `${canvasApiUrl}/courses/${curso_id}/users/${user_id}`;
    console.log(`📡 Obteniendo usuario de Canvas: ${url}`);

    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${canvasToken}` }
    });

    // ✅ Validar respuesta de Canvas
    if (!response.ok) {
      console.error(`❌ Canvas API error: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({}));

      return res.status(response.status).json({
        ok: false,
        msg: `Error obteniendo usuario de Canvas: ${response.statusText}`,
        error: errorData
      });
    }

    const usuario = await response.json() as any;

    console.log(`✅ Usuario obtenido: ${usuario.name || usuario.short_name || user_id}`);

    return res.json({
      ok: true,
      msg: "Usuario obtenido",
      usuario: usuario
    });
  } catch (error) {
    console.error(`❌ Error obteniendo usuario (curso: ${curso_id}, user: ${user_id}):`, error);
    return res.status(500).json({
      ok: false,
      msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
    });
  }
};