import { RequestHandler } from "express";

import Bloque from "../models/bloque";
// import Usuario from "../models/usuario";
// import Matricula from "../models/matricula";

export const obtenerQuestionsSection: RequestHandler = async (req, res) => {
  const { cid, sid } = req.params;

  const canvasApiUrl = process.env.CANVAS_API_URL;
  const canvasToken = process.env.CANVAS_ACCESS_TOKEN;

  try {
    const resQuestions = await fetch(`${canvasApiUrl}/courses/${cid}/quizzes/${sid}/questions?per_page=1000`, {
      headers: { "Authorization": `Bearer ${canvasToken}` }
    });

    const questions = await resQuestions.json() as any[];  // ← Parsear JSON
    // const questions_publicadas = questions.filter((m: any) => m.published === true && String(m.module_id) === String(sid));

    return res.json({
      ok: true,
      questions: questions,
    });
  } catch (error) {
    console.log(error);
    const date = new Date();
    return res.status(500).json({
      ok: false,
      msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
    });
  }
};