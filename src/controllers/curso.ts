import { RequestHandler } from "express";

// import Usuario from "../models/usuario";
import Curso from "../models/curso";
// import Grupo from "../models/grupo";
// import Matricula from "../models/matricula";
// import mongoose from "mongoose";

export const obtenerCurso: RequestHandler = async (req, res) => {
  const { cid } = req.params;

  try {
    const curso = await Curso.findOne({ _id: cid }).sort("sigla");

    return res.json({
      ok: true,
      msg: "Curso obtenido",
      curso: curso,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
    });
  }
};