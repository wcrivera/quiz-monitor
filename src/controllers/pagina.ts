import { RequestHandler } from "express";

// import pagina from "../models/pagina";
// import Usuario from "../models/usuario";
// import Matricula from "../models/matricula";

export const obtenerPaginasCurso: RequestHandler = async (req, res) => {
  const { course_id } = req.params;

  const canvasApiUrl = process.env.CANVAS_API_URL;
  const canvasToken = process.env.CANVAS_ACCESS_TOKEN;

  try {

    const response = await fetch(`${canvasApiUrl}/courses/${course_id}/pages?per_page=1000`, {
      headers: { "Authorization": `Bearer ${canvasToken}` }
    });

    const paginas = await response.json() as any[];

    const all_paginas = paginas.filter((p: any) => p.published === true);

    console.log(all_paginas.length)


    const paginasConContenido = [];

    for (const page of all_paginas) {
      const detailResponse = await fetch(
        `${canvasApiUrl}/courses/${course_id}/pages/${page.url}`,
        {
          headers: { 'Authorization': `Bearer ${canvasToken}` }
        }
      );

      if (detailResponse.ok) {
        const pageDetail = await detailResponse.json();
        paginasConContenido.push(pageDetail);
      }
    }

    console.log(paginasConContenido.length)

    return res.json({
      ok: true,
      msg: "Paginas obtenidos",
      paginas: paginasConContenido,
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