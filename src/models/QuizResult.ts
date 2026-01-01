// ============================================================================
// QUIZ RESULT MODEL - MÚLTIPLES INTENTOS
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizResult extends Document {
  userId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  possiblePoints: number;
  percentageScore: number;
  submittedAt: Date;
  attempt: number;
  workflowState: string;
  submissionId: string;
  courseId: string;
  studentId: string;
  studentName: string;
}

const QuizResultSchema = new Schema<IQuizResult>({
  userId: { type: String, required: true, index: true },
  quizId: { type: String, required: true, index: true },
  quizTitle: { type: String, required: true },
  score: { type: Number, required: true },
  possiblePoints: { type: Number, required: true },
  percentageScore: { type: Number, required: true },
  submittedAt: { type: Date, required: true },
  attempt: { type: Number, required: true },
  workflowState: { type: String, required: true },
  submissionId: { type: String, required: true }, // ← YA NO ES UNIQUE
  courseId: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true }
}, {
  timestamps: true
});

// Índice compuesto único: un resultado por userId + quizId + attempt
QuizResultSchema.index({ userId: 1, quizId: 1, attempt: 1 }, { unique: true });

export default mongoose.model<IQuizResult>('QuizResult', QuizResultSchema);