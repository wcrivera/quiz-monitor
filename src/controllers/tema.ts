import { RequestHandler } from "express";
import { ObjectId } from "mongodb";

import Tema from "../models/tema";

export const obtenerTemasCapitulo: RequestHandler = async (req, res) => {
    const { capitulo_id } = req.params;

    try {
        // const temas = await Tema.find({ curso_id: capitulo_id }).sort({ numero: 1 });

        const temas = await Tema.find({ capitulo_id: capitulo_id }).sort({ numero: 1 });

        // ✅ NOTA: Array vacío es válido (capítulo sin temas)
        if (temas.length === 0) {
            console.log(`⚠️ No se encontraron temas para capitulo_id: ${capitulo_id}`);
        }

        return res.json({
            ok: true,
            msg: "Temas obtenidos",
            temas: temas,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
        });
    }
};