import { RequestHandler } from "express";

import Capitulo from "../models/capitulo";

export const obtenerCapitulosCurso: RequestHandler = async (req, res) => {
    const { curso_id } = req.params;

    try {
        const capitulos = await Capitulo.find({ curso_id: curso_id }).sort({ numero: 1 });

        if (capitulos.length === 0) {
            console.log(`⚠️ No se encontraron capítulos para curso_id: ${curso_id}`);
        }
        
        return res.json({
            ok: true,
            msg: "Capitulo obtenido",
            capitulos: capitulos,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
        });
    }
};