import { RequestHandler } from "express";
import { ObjectId } from "mongodb";

import Tema from "../models/tema";

export const obtenerTemasCapitulo: RequestHandler = async (req, res) => {
    const { capitulo_id } = req.params;

    try {
        // const temas = await Tema.find({ curso_id: capitulo_id }).sort({ numero: 1 });

        // const temas = await Tema.find({ capitulo_id: capitulo_id }).sort({ numero: 1 });

        const temas = await Tema.aggregate([
            {
                $match: {
                    capitulo_id: new ObjectId(capitulo_id),
                    // activo: true
                },
            },
            {
                $sort: { numero: 1 },
            },
            {
                $lookup: {
                    from: "diapositivas",
                    let: { tema_id: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$tema_id", "$$tema_id"] },
                                        // { $eq: ["$activo", true] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                id: "$_id",
                                _id: 0,
                                curso_id: 1,
                                capitulo_id: 1,
                                clase_id: 1,
                                tema_id: 1,
                                autor: 1,
                                diapositivas: 1,
                                activo: 1
                            }
                        }
                    ],
                    as: "diapositiva"
                }
            },
            {
                $lookup: {
                    from: "videos",
                    let: { tema_id: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$tema_id", "$$tema_id"] },
                                        // { $eq: ["$activo", true] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                id: "$_id",
                                _id: 0,
                                curso_id: 1,
                                capitulo_id: 1,
                                clase_id: 1,
                                tema_id: 1,
                                url: 1,
                                activo: 1
                            }
                        }
                    ],
                    as: "video"
                }
            },
            {
                $lookup: {
                    from: "preguntas",
                    let: { tema_id: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$tema_id", "$$tema_id"] },
                                        // { $eq: ["$activo", true] }
                                    ]
                                }
                            }
                        },
                        {
                            $sort: { numero: 1 }
                        },
                        {
                            $project: {
                                id: "$_id",
                                _id: 0,
                                curso_id: 1,
                                capitulo_id: 1,
                                clase_id: 1,
                                tema_id: 1,
                                numero: 1,
                                enunciado: 1,
                                solucion: 1,
                                video: 1,
                                alternativas: 1,
                                activo: 1
                            }
                        }
                    ],
                    as: "preguntas"
                }
            },
            {
                $unwind: {
                    path: "$diapositiva",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$video",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    id: "$_id",
                    _id: 0,
                    curso_id: 1,
                    capitulo_id: 1,
                    clase_id: 1,
                    numero: 1,
                    nombre: 1,
                    activo: 1,
                    diapositiva: 1,
                    video: 1,
                    preguntas: 1
                }
            }
        ]);

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