import { RequestHandler } from "express";

// import item from "../models/item";
// import Usuario from "../models/usuario";
// import Matricula from "../models/matricula";

export const obtenerItemsCurso: RequestHandler = async (req, res) => {
  const { course_id } = req.params;

  const canvasApiUrl = process.env.CANVAS_API_URL;
  const canvasToken = process.env.CANVAS_ACCESS_TOKEN;

  try {

    const response_modulos = await fetch(`${canvasApiUrl}/courses/${course_id}/modules?per_page=1000`, {
      headers: { "Authorization": `Bearer ${canvasToken}` }
    });

    const modulos = await response_modulos.json() as any[];

    let all_items: any[] = [];

    for (const modulo of modulos) {
      const resitems = await fetch(`${canvasApiUrl}/courses/${course_id}/modules/${modulo.id}/items?per_page=1000`, {
        headers: { "Authorization": `Bearer ${canvasToken}` }
      });

      const items = await resitems.json() as any[];  // ← Parsear JSON

      const items_publicados = items.filter((m: any) => m.published === true);

      all_items = all_items.concat(items_publicados);
    }

    console.log("items", all_items.length)

    return res.json({
      ok: true,
      msg: "Items obtenidos",
      items: all_items,
    });
  } catch (error) {
    console.log(error);
    const date = new Date();
    return res.status(500).json({
      ok: false,
      msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
    });
  }
}

export const obteneritemsModulo: RequestHandler = async (req, res) => {
  const { cid, mid } = req.params;

  const canvasApiUrl = process.env.CANVAS_API_URL;
  const canvasToken = process.env.CANVAS_ACCESS_TOKEN;

  try {
    const resitems = await fetch(`${canvasApiUrl}/courses/${cid}/modules/${mid}/items?per_page=1000`, {
      headers: { "Authorization": `Bearer ${canvasToken}` }
    });

    const items = await resitems.json() as any[];  // ← Parsear JSON

    const items_publicados = items.filter((m: any) => m.published === true);

    return res.json({
      ok: true,
      items: items_publicados,
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