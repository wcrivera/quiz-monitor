import { RequestHandler } from "express";

import Clase from "../models/clase";

export const obtenerClasesCurso: RequestHandler = async (req, res) => {
    const { curso_id } = req.params;

    try {
        const clases = await Clase.find({ curso_id: curso_id }).sort({ numero: 1 });

        // ✅ NOTA: Array vacío es válido (curso sin clases)
        if (clases.length === 0) {
            console.log(`⚠️ No se encontraron clases para curso_id: ${curso_id}`);
        }
        
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