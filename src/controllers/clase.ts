import { RequestHandler } from "express";

import Clase from "../models/clase";

export const obtenerClasesCurso: RequestHandler = async (req, res) => {
    const { curso_id } = req.params;

    try {
        const clases = await Clase.find({ curso_id: curso_id }).sort({ numero: 1 });
        return res.json({
            ok: true,
            msg: "Clase obtenido",
            clases: clases,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
        });
    }
};