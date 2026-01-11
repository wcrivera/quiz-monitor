import { RequestHandler } from "express";

export const obtenerUsuario: RequestHandler = async (req, res) => {
  const { course_id, user_id } = req.params;

  const canvasApiUrl = process.env.CANVAS_API_URL;
  const canvasToken = process.env.CANVAS_ACCESS_TOKEN;

  console.log(course_id, user_id)

  try {

    const response = await fetch(`${canvasApiUrl}/courses/${course_id}/users/${user_id}`, {
      headers: { "Authorization": `Bearer ${canvasToken}` }
    });

    const usuario = await response.json() as any[]
    return res.json({
      ok: true,
      msg: "Usuario obtenido",
      usuario: usuario
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
    });
  }
};