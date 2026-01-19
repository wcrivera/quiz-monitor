import { RequestHandler } from "express";
import Score from "../models/score";

export const crearScore: RequestHandler = async (req, res) => {

    const { userId, courseId } = req;
    const { ejercicio_id, score } = req.body;

    try {
        const nuevoScore = new Score({
            ejercicio_id: ejercicio_id,
            canvas_curso_id: Number(courseId),
            canvas_usuario_id: Number(userId),
            score: Number(score)
        });
        const nuevoScoreGuardado = await nuevoScore.save();

        return res.json({
            ok: true,
            msg: "Score creado",
            score: nuevoScoreGuardado,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
        });
    }
};