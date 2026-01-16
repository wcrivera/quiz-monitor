import { RequestHandler } from "express";
import Curso from "../models/curso";

export const obtenerCurso: RequestHandler = async (req, res) => {

  const { curso_id } = req.params;

  try {
    const curso = await Curso.findOne({
      "canvas.curso_id": Number(curso_id)
    });

    // ✅ VALIDAR si el curso existe
    if (!curso) {
      return res.status(404).json({
        ok: false,
        msg: `Curso con ID ${curso_id} no encontrado en la base de datos`,
      });
    }

    return res.json({
      ok: true,
      msg: "Curso obtenido",
      curso: curso,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
    });
  }
  // const { course_id } = req.params;

  // const canvasApiUrl = process.env.CANVAS_API_URL;
  // const canvasToken = process.env.CANVAS_ACCESS_TOKEN;

  // try {

  //   const response = await fetch(`${canvasApiUrl}/courses/${course_id}`, {
  //     headers: { "Authorization": `Bearer ${canvasToken}` }
  //   });

  //   const curso = await response.json() as any[]
  //   return res.json({
  //     ok: true,
  //     msg: "Curso obtenido",
  //     curso: curso,
  //     // bloques: bloques,
  //     // module: module
  //   });
  // } catch (error) {
  //   console.log(error);
  //   return res.status(500).json({
  //     ok: false,
  //     msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
  //   });
  // }
};