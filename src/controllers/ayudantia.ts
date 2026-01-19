import { RequestHandler } from "express";
import Ayudantia from "../models/ayudantia";
import { ObjectId } from "mongodb";

// import Ayudantia from "../models/ayudantia";

export const obtenerAyudantiasCapitulo: RequestHandler = async (req, res) => {
  const { capitulo_id } = req.params;
  const { userId: canvas_usuario_id, courseId: canvas_curso_id } = req

  // ✅ Validar parámetros requeridos
  if (!canvas_usuario_id || !canvas_curso_id) {
    return res.status(400).json({
      ok: false,
      msg: "Faltan parámetros: canvas_usuario_id y canvas_curso_id"
    });
  }

  try {
    const ayudantias = await Ayudantia.aggregate([
      {
        $match: {
          capitulo_id: new ObjectId(capitulo_id),
        },
      },
      {
        $sort: { numero: 1 },
      },
      // ⭐⭐⭐ LOOKUP PARA SCORE - USANDO EL _id DE LA AYUDANTÍA ⭐⭐⭐
      {
        $lookup: {
          from: "scores",
          let: { ayudantia_id: "$_id" },  // ✅ El _id de la ayudantía
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$ejercicio_id", "$$ayudantia_id"] },  // ✅ Compara con el _id de la ayudantía
                    { $eq: ["$canvas_usuario_id", Number(canvas_usuario_id)] },
                    { $eq: ["$canvas_curso_id", Number(canvas_curso_id)] }
                  ]
                }
              }
            },
            {
              $sort: { createdAt: -1 }  // Más reciente primero
            },
            {
              $limit: 1  // Solo el último
            },
            {
              $project: {
                score: 1,
                createdAt: 1,
                _id: 0
              }
            }
          ],
          as: "scoreData"
        }
      },
      // ⭐ Extraer el score del array
      {
        $addFields: {
          score: {
            $ifNull: [
              { $arrayElemAt: ["$scoreData.score", 0] },
              null
            ]
          },
          lastAttemptDate: {
            $ifNull: [
              { $arrayElemAt: ["$scoreData.createdAt", 0] },
              null
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
          enunciado: 1,
          numero: 1,
          solucion: 1,
          video: 1,
          ejercicio: 1,  // ✅ Incluye todo el objeto ejercicio
          score: 1,      // ⭐ Score del último intento
          lastAttemptDate: 1
        }
      }
    ]);

    console.log(`✅ Ayudantías obtenidas: ${ayudantias.length}`);

    // 🔍 DEBUG: Ver si los scores están llegando
    console.log('📊 Ayudantías con scores:', ayudantias.map(a => ({
      numero: a.numero,
      score: a.score
    })));

    return res.json({
      ok: true,
      msg: "Ayudantías obtenidas",
      ayudantias: ayudantias,
    });

  } catch (error) {
    console.error("❌ Error obteniendo ayudantías:", error);
    return res.status(500).json({
      ok: false,
      msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
    });
  }
};

// ADMINISTRADOR
// export const crearEjercicio: RequestHandler = async (req, res) => {
//   try {
//     const { uid } = req.params;
//     const usuario = await Usuario.findById(uid);

//     if (!usuario) {
//       return res.status(404).json({
//         ok: false,
//         msg: "Usuario no registrado",
//       });
//     }

//     const { cid } = req.body;

//     const matricula = await Matricula.findOne({ uid: uid, cid: cid });

//     if (usuario.admin === false && matricula?.rol !== "Administrador") {
//       return res.status(403).json({
//         ok: false,
//         msg: "Usuario sin permiso",
//       });
//     }

//     const nuevoEjercicio = new Ayudantia(req.body);
//     const ejercicioCreado = await nuevoEjercicio.save();

//     return res.json({
//       ok: true,
//       msg: "Ejercicio creado",
//       ejercicioCreado,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       ok: false,
//       msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
//     });
//   }
// };

// export const eliminarEjercicio: RequestHandler = async (req, res) => {
//   try {
//     const { uid } = req.params;
//     const usuario = await Usuario.findById(uid);

//     if (!usuario) {
//       return res.status(404).json({
//         ok: false,
//         msg: "Usuario no registrado",
//       });
//     }

//     const { id } = req.params;
//     const ayudantia = await Ayudantia.findById(id);

//     const matricula = await Matricula.findOne({
//       uid: uid,
//       cid: ayudantia?.cid,
//     });

//     if (usuario.admin === false && matricula?.rol !== "Administrador") {
//       return res.status(403).json({
//         ok: false,
//         msg: "Usuario sin permiso",
//       });
//     }

//     const ayudantiaEliminada = await Ayudantia.findByIdAndDelete(id);

//     if (ayudantiaEliminada) {
//       await Ayudantia.updateMany(
//         {
//           cid: ayudantiaEliminada.cid,
//           mid: ayudantiaEliminada.mid,
//           numero: { $gt: ayudantiaEliminada.numero },
//         },
//         { $inc: { numero: -1 } }
//       );

//       const ayudantiasActualizada = await Ayudantia.find({
//         cid: ayudantiaEliminada.cid,
//         mid: ayudantiaEliminada.mid,
//       }).sort({ numero: 1 });

//       return res.json({
//         ok: true,
//         msg: "Ejercicio eliminado",
//         ayudantiasActualizada,
//       });
//     } else {
//       return res.json({
//         ok: false,
//         msg: "Ejercicio no existe",
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       ok: false,
//       msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
//     });
//   }
// };

// export const editarEjercicio: RequestHandler = async (req, res) => {
//   try {
//     const { uid } = req.params;
//     const usuario = await Usuario.findById(uid);

//     if (!usuario) {
//       return res.status(404).json({
//         ok: false,
//         msg: "Usuario no registrado",
//       });
//     }

//     const { cid } = req.body;

//     const matricula = await Matricula.findOne({ uid: uid, cid: cid });

//     if (usuario.admin === false && matricula?.rol !== "Administrador") {
//       return res.status(403).json({
//         ok: false,
//         msg: "Usuario sin permiso",
//       });
//     }

//     const { id, mid, numero } = req.body;

//     const mismaAyudantiaEncontrada = await Ayudantia.findOne({ _id: id });

//     if (!mismaAyudantiaEncontrada) {
//       return res.json({
//         ok: false,
//         msg: "Ejercicio no existe",
//       });
//     }

//     if (mismaAyudantiaEncontrada.numero === numero) {
//       console.log("mismo ejercicio");
//       await Ayudantia.findByIdAndUpdate(id, req.body, { new: true });
//       const ayudantiasActualizada = await Ayudantia.find({
//         cid: cid,
//         mid: mid,
//       }).sort({ numero: 1 });
//       return res.json({
//         ok: true,
//         msg: "Módulo editado",
//         ayudantiasActualizada,
//       });
//     }

//     const diferenteAyudantiaEncontrada = await Ayudantia.findOne({
//       cid,
//       mid,
//       numero,
//     });

//     if (!diferenteAyudantiaEncontrada) {
//       await Ayudantia.findByIdAndUpdate(id, req.body, { new: true });
//       const ayudantiasActualizada = await Ayudantia.find({
//         cid: cid,
//         mid: mid,
//       }).sort({ numero: 1 });
//       return res.json({
//         ok: true,
//         msg: "Módulo editado",
//         ayudantiasActualizada,
//       });
//     } else {
//       await Ayudantia.findByIdAndUpdate(id, req.body, { new: true });
//       await Ayudantia.findByIdAndUpdate(
//         diferenteAyudantiaEncontrada._id,
//         { numero: mismaAyudantiaEncontrada.numero },
//         { new: true }
//       );
//       const ayudantiasActualizada = await Ayudantia.find({
//         cid: cid,
//         mid: mid,
//       }).sort({ numero: 1 });
//       return res.json({
//         ok: true,
//         msg: "Módulo editado",
//         ayudantiasActualizada,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       ok: false,
//       msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
//     });
//   }
// };
