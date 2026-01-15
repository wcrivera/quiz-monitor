import { RequestHandler } from "express";
import { ObjectId } from "mongodb";

import Tema from "../models/tema";

export const obtenerTemasCapitulo: RequestHandler = async (req, res) => {
    const { capitulo_id } = req.params;

    console.log(capitulo_id)

    try {
        // const temas = await Tema.find({ curso_id: capitulo_id }).sort({ numero: 1 });

        const temas = await Tema.find({ capitulo_id: capitulo_id }).sort({ numero: 1 });

        console.log(temas)
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