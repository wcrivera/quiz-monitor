import { RequestHandler } from "express";

// import Bloque from "../models/bloque";
// import Usuario from "../models/usuario";
// import Matricula from "../models/matricula";

export const obtenerBloquesModulo: RequestHandler = async (req, res) => {
  const { cid, mid } = req.params;

  const canvasApiUrl = process.env.CANVAS_API_URL;
  const canvasToken = process.env.CANVAS_ACCESS_TOKEN;

  try {
    const resBloques = await fetch(`${canvasApiUrl}/courses/${cid}/modules/${mid}/items?per_page=1000`, {
      headers: { "Authorization": `Bearer ${canvasToken}` }
    });

    const bloques = await resBloques.json() as any[];  // ← Parsear JSON

    const bloques_publicados = bloques.filter((m: any) => m.published === true);

    return res.json({
      ok: true,
      bloques: bloques_publicados,
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