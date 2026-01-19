import { RequestHandler } from "express";
import Ejercicio from "../models/ejercicio";
import { ObjectId } from "mongodb";

// import Ejercicio from "../models/ejercicio";

export const obtenerEjerciciosCapitulo: RequestHandler = async (req, res) => {

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
      const ejercicios = await Ejercicio.aggregate([
        {
          $match: {
            capitulo_id: new ObjectId(capitulo_id),
          },
        },
        {
          $sort: { numero: 1 },
        },
        // ⭐⭐⭐ LOOKUP PARA SCORE - USANDO EL _id DEL EJERCICIO ⭐⭐⭐
        {
          $lookup: {
            from: "scores",
            let: { ejercicio_id: "$_id" },  // ✅ El _id del ejercicio
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$ejercicio_id", "$$ejercicio_id"] },  // ✅ Compara con el _id del ejercicio
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
            alternativas: 1,  // ✅ Incluye todo el objeto ejercicio
            score: 1,      // ⭐ Score del último intento
            lastAttemptDate: 1
          }
        }
      ]);
  
      console.log(`✅ Ejercicios obtenidos: ${ejercicios.length}`);
  
      // 🔍 DEBUG: Ver si los scores están llegando
      console.log('📊 Ejercicios con scores:', ejercicios.map(a => ({
        numero: a.numero,
        score: a.score
      })));
  
      return res.json({
        ok: true,
        msg: "Ejercicios obtenidos",
        ejercicios: ejercicios,
      });
  
    } catch (error) {
      console.error("❌ Error obteniendo ejercicios:", error);
      return res.status(500).json({
        ok: false,
        msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
      });
    }
  // const { capitulo_id } = req.params;

  // try {
  //   const ejercicios = await Ejercicio.find({ capitulo_id: capitulo_id }).sort({ numero: 1 });

  //   if (ejercicios.length === 0) {
  //     console.log(`⚠️ No se encontraron ejercicios para capitulo_id: ${capitulo_id}`);
  //   }

  //   return res.json({
  //     ok: true,
  //     msg: "Ejercicios obtenidas",
  //     ejercicios: ejercicios,
  //   });
  // } catch (error) {
  //   console.log(error);
  //   return res.status(500).json({
  //     ok: false,
  //     msg: "Estamos teniendo problemas, vuelva a intentarlo más tarde",
  //   });
  // }
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

//     const nuevoEjercicio = new Ejercicio(req.body);
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
//     const ejercicio = await Ejercicio.findById(id);

//     const matricula = await Matricula.findOne({
//       uid: uid,
//       cid: ejercicio?.cid,
//     });

//     if (usuario.admin === false && matricula?.rol !== "Administrador") {
//       return res.status(403).json({
//         ok: false,
//         msg: "Usuario sin permiso",
//       });
//     }

//     const ejercicioEliminada = await Ejercicio.findByIdAndDelete(id);

//     if (ejercicioEliminada) {
//       await Ejercicio.updateMany(
//         {
//           cid: ejercicioEliminada.cid,
//           mid: ejercicioEliminada.mid,
//           numero: { $gt: ejercicioEliminada.numero },
//         },
//         { $inc: { numero: -1 } }
//       );

//       const ejerciciosActualizada = await Ejercicio.find({
//         cid: ejercicioEliminada.cid,
//         mid: ejercicioEliminada.mid,
//       }).sort({ numero: 1 });

//       return res.json({
//         ok: true,
//         msg: "Ejercicio eliminado",
//         ejerciciosActualizada,
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

//     const mismaEjercicioEncontrada = await Ejercicio.findOne({ _id: id });

//     if (!mismaEjercicioEncontrada) {
//       return res.json({
//         ok: false,
//         msg: "Ejercicio no existe",
//       });
//     }

//     if (mismaEjercicioEncontrada.numero === numero) {
//       console.log("mismo ejercicio");
//       await Ejercicio.findByIdAndUpdate(id, req.body, { new: true });
//       const ejerciciosActualizada = await Ejercicio.find({
//         cid: cid,
//         mid: mid,
//       }).sort({ numero: 1 });
//       return res.json({
//         ok: true,
//         msg: "Módulo editado",
//         ejerciciosActualizada,
//       });
//     }

//     const diferenteEjercicioEncontrada = await Ejercicio.findOne({
//       cid,
//       mid,
//       numero,
//     });

//     if (!diferenteEjercicioEncontrada) {
//       await Ejercicio.findByIdAndUpdate(id, req.body, { new: true });
//       const ejerciciosActualizada = await Ejercicio.find({
//         cid: cid,
//         mid: mid,
//       }).sort({ numero: 1 });
//       return res.json({
//         ok: true,
//         msg: "Módulo editado",
//         ejerciciosActualizada,
//       });
//     } else {
//       await Ejercicio.findByIdAndUpdate(id, req.body, { new: true });
//       await Ejercicio.findByIdAndUpdate(
//         diferenteEjercicioEncontrada._id,
//         { numero: mismaEjercicioEncontrada.numero },
//         { new: true }
//       );
//       const ejerciciosActualizada = await Ejercicio.find({
//         cid: cid,
//         mid: mid,
//       }).sort({ numero: 1 });
//       return res.json({
//         ok: true,
//         msg: "Módulo editado",
//         ejerciciosActualizada,
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
