import { RequestHandler } from "express";

import Bloque from "../models/bloque";
// import Usuario from "../models/usuario";
// import Matricula from "../models/matricula";

interface QuizSubmission {
  id: number;
  validation_token: string;
  attempt: number;
}

interface SubmissionResponse {
  quiz_submissions: QuizSubmission[];
}

interface Student {
  id: number;
}

// ============================================================================
// ENVIAR CALIFICACIÓN A CANVAS - CÓDIGO CORREGIDO
// ============================================================================
export const obtenerScoreQuizzes: RequestHandler = async (req, res) => {
  const { curso_id, user_id } = req.params;

  const CANVAS_URL = process.env.CANVAS_API_URL;
  const API_TOKEN = process.env.CANVAS_ACCESS_TOKEN;

  try {
    const response_quiz = await fetch(
      `${CANVAS_URL}/courses/${curso_id}/quizzes`,
      {
        headers: { "Authorization": `Bearer ${API_TOKEN}` }
      }
    );

    const quizzes = await response_quiz.json() as any;

    const submissions: any[] = [];

    for (const quiz of quizzes) {
      const url_submissions = `${CANVAS_URL}/courses/${curso_id}/assignments/${quiz.assignment_id}/submissions/${user_id}`;
      // 1. Obtener las submissions del quiz para el usuario

      const response_submissions = await fetch(url_submissions,
        {
          headers: { "Authorization": `Bearer ${API_TOKEN}` }
        }
      );

      const submissionsData = await response_submissions.json() as any;

      // console.log(submissionsData)

      if (submissionsData.errors) continue;

      submissionsData.quiz_id = quiz.id;
      submissions.push(submissionsData)
    }

    // console.log("submissions", submissions)

    return res.json({
      ok: true,
      msg: "Submission obtenida exitosamente",
      scores: submissions
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const obtenerScoreQuiz: RequestHandler = async (req, res) => {
  const { curso_id, quiz_id, user_id } = req.params;

  // console.log(curso_id, quiz_id, user_id)

  const CANVAS_URL = process.env.CANVAS_API_URL;
  const API_TOKEN = process.env.CANVAS_ACCESS_TOKEN;

  try {
    const response_quiz = await fetch(
      `${CANVAS_URL}/courses/${curso_id}/quizzes/${quiz_id}`,
      {
        headers: { "Authorization": `Bearer ${API_TOKEN}` }
      }
    );

    const quiz = await response_quiz.json() as any;

    const url = `${CANVAS_URL}/courses/${curso_id}/assignments/${quiz.assignment_id}/submissions/${user_id}`;
    // 1. Obtener las submissions del quiz para el usuario

    const response_submissions = await fetch(url,
      {
        headers: { "Authorization": `Bearer ${API_TOKEN}` }
      }
    );

    const submissionsData = await response_submissions.json() as any;

    return res.json({
      ok: true,
      msg: "Submission obtenida exitosamente",
      data: submissionsData
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const enviarRespuestaQuiz: RequestHandler = async (req, res) => {
  const { user_id, curso_id, quiz_id, question_id, answer_id, weight } = req.body;

  // console.log('📝 Datos recibidos:', { user_id, curso_id, quiz_id, question_id, answer_id, weight });

  const CANVAS_URL = process.env.CANVAS_API_URL;
  const API_TOKEN = process.env.CANVAS_ACCESS_TOKEN;
  const COURSE_ID = curso_id;

  try {
    // 1. Obtener el quiz para sacar el assignment_id
    const response_quiz = await fetch(
      `${CANVAS_URL}/courses/${COURSE_ID}/quizzes/${quiz_id}`,
      {
        headers: { "Authorization": `Bearer ${API_TOKEN}` }
      }
    );

    const quiz = await response_quiz.json() as any;

    // 2. Enviar calificación (FORMATO CORRECTO)
    const url = `${CANVAS_URL}/courses/${COURSE_ID}/assignments/${quiz.assignment_id}/submissions/${user_id}`;

    // POST /courses/{curso_id}/quizzes/{quiz_id}/submissions

    const response_assignment = await fetch(url,
      {
        headers: { "Authorization": `Bearer ${API_TOKEN}` }
      }
    );

    const assignment = await response_assignment.json() as any;
    // console.log("assignment", assignment)

    // ⭐ ESTE ES EL FORMATO CORRECTO ⭐
    const data = {
      submission: {
        posted_grade: weight === '0' ? 0.0 : 1.0,  // ← Calificación fija por ahora
      }
    };

    // console.log('🔗 URL:', url);
    // console.log('📦 Enviando:', JSON.stringify(data, null, 2));

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json() as any;

    // console.log('✅ Respuesta de Canvas:', JSON.stringify(result, null, 2));
    // console.log('📊 Score actualizado:', result.score);

    if (!response.ok) {
      console.error('❌ Error de Canvas:', result);
      return res.status(response.status).json({
        ok: false,
        msg: "Error al enviar calificación",
        error: result
      });
    }

    result.quiz_id = quiz.id;

    return res.json({
      ok: true,
      msg: "Calificación enviada exitosamente",
      score: result
      // grade: result.grade,
      // user_id: result.user_id,
      // data: result
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// VERSIÓN CON CALIFICACIÓN DINÁMICA
// ============================================================================

export const enviarCalificacionQuiz: RequestHandler = async (req, res) => {
  const { user_id, curso_id, quiz_id, score } = req.body;  // score viene del cálculo

  const CANVAS_URL = process.env.CANVAS_API_URL;
  const API_TOKEN = process.env.CANVAS_ACCESS_TOKEN;

  try {
    // 1. Obtener assignment_id del quiz
    const response_quiz = await fetch(
      `${CANVAS_URL}/courses/${curso_id}/quizzes/${quiz_id}`,
      {
        headers: { "Authorization": `Bearer ${API_TOKEN}` }
      }
    );

    const quiz = await response_quiz.json() as any;

    // 2. Enviar calificación
    const url = `${CANVAS_URL}/courses/${curso_id}/assignments/${quiz.assignment_id}/submissions/${user_id}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        submission: {
          posted_grade: score  // ← Calificación dinámica
        }
      })
    });

    const result = await response.json() as any;

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        msg: "Error al enviar calificación",
        error: result
      });
    }

    return res.json({
      ok: true,
      msg: "Calificación enviada exitosamente",
      score: result.score
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// VERSIÓN CON COMENTARIO
// ============================================================================

export const enviarCalificacionConComentario: RequestHandler = async (req, res) => {
  const { user_id, curso_id, quiz_id, score, comentario } = req.body;

  const CANVAS_URL = process.env.CANVAS_API_URL;
  const API_TOKEN = process.env.CANVAS_ACCESS_TOKEN;

  try {
    const response_quiz = await fetch(
      `${CANVAS_URL}/courses/${curso_id}/quizzes/${quiz_id}`,
      {
        headers: { "Authorization": `Bearer ${API_TOKEN}` }
      }
    );

    const quiz = await response_quiz.json() as any;
    const url = `${CANVAS_URL}/courses/${curso_id}/assignments/${quiz.assignment_id}/submissions/${user_id}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        submission: {
          posted_grade: score
        },
        comment: {
          text_comment: comentario  // ← Agregar comentario
        }
      })
    });

    const result = await response.json();

    return res.json({
      ok: true,
      msg: "Calificación y comentario enviados",
      data: result
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};