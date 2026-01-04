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

export const enviarRespuestaQuiz: RequestHandler = async (req, res) => {
  // const { curso_id, quiz_id, question_id, answer_id } = req.body;

  const CANVAS_URL = process.env.CANVAS_API_URL;
  const API_TOKEN = process.env.CANVAS_ACCESS_TOKEN;

  const { curso_id: COURSE_ID } = req.body;

  const quizId = 199559
  const questionId = 1819864
  const answerId = "8108"; // Replace with actual answer ID
  const studentId = "189805"; // Replace with actual student ID

  console.log(quizId,questionId, answerId, studentId)

  try {
    const headers = {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json"
    };

    // Paso 1: Iniciar submission SIN preview, actuando como estudiante
    const startRes = await fetch(
      `${CANVAS_URL}/courses/${COURSE_ID}/quizzes/${quizId}/submissions`,
      {
        method: "POST",
        headers: {
          ...headers,
          "As-User-Id": studentId  // Masquerade como estudiante
        },
        body: JSON.stringify({})
      }
    );

    const submission = await startRes.json() as SubmissionResponse;
    console.log('Submission:', JSON.stringify(submission, null, 2));

    if (!submission.quiz_submissions) {
      return res.status(400).json({ error: submission });
    }

    const submissionId = submission.quiz_submissions[0].id;
    const token = submission.quiz_submissions[0].validation_token;
    const attempt = submission.quiz_submissions[0].attempt;

    // Paso 2: Enviar respuesta
    const answerParams = new URLSearchParams({
      attempt: attempt.toString(),
      validation_token: token,
      [`quiz_questions[${questionId}][answer]`]: answerId
    });

    const answerRes = await fetch(
      `${CANVAS_URL}/quiz_submissions/${submissionId}/questions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_TOKEN}`,
          "As-User-Id": studentId
        },
        body: answerParams
      }
    );

    const answerResult = await answerRes.json();
    console.log('Answer:', JSON.stringify(answerResult, null, 2));

    // Paso 3: Completar
    const completeParams = new URLSearchParams({
      attempt: attempt.toString(),
      validation_token: token
    });

    const completeRes = await fetch(
      `${CANVAS_URL}/courses/${COURSE_ID}/quizzes/${quizId}/submissions/${submissionId}/complete`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_TOKEN}`,
          "As-User-Id": studentId
        },
        body: completeParams
      }
    );

    const result = await completeRes.json();
    return res.json(result);

  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }






};