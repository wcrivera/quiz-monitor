// ============================================================================
// QUIZ RESULT MODEL - CORREGIDO
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
  workflowState: 'untaken' | 'pending_review' | 'complete' | 'settings_only' | 'preview';
  submissionId: string;
  courseId: string;
  studentId: string;
  studentName: string;
}

const QuizResultSchema = new Schema<IQuizResult>({
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  quizId: { 
    type: String, 
    required: true,
    index: true 
  },
  quizTitle: { 
    type: String, 
    required: true 
  },
  score: { 
    type: Number, 
    required: true,
    default: 0
  },
  possiblePoints: { 
    type: Number, 
    required: true,
    default: 0
  },
  percentageScore: { 
    type: Number, 
    default: 0
  },
  submittedAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  attempt: { 
    type: Number, 
    required: true,
    default: 1
  },
  workflowState: { 
    type: String, 
    required: true,
    enum: ['untaken', 'pending_review', 'complete', 'settings_only', 'preview']
  },
  submissionId: { 
    type: String, 
    required: true
    // ❌ NO UNIQUE - porque puede repetirse en diferentes intentos
  },
  courseId: { 
    type: String, 
    required: true 
  },
  studentId: { 
    type: String, 
    required: true 
  },
  studentName: { 
    type: String, 
    default: 'Unknown Student' 
  }
}, {
  timestamps: true
});

// ✅ ÍNDICE ÚNICO CORRECTO: userId + quizId + attempt
// Permite múltiples intentos del mismo quiz por el mismo usuario
QuizResultSchema.index(
  { userId: 1, quizId: 1, attempt: 1 }, 
  { unique: true }
);

// Índice compuesto para búsquedas eficientes
QuizResultSchema.index({ userId: 1, submittedAt: -1 });
QuizResultSchema.index({ quizId: 1, submittedAt: -1 });

export default mongoose.model<IQuizResult>('QuizResult', QuizResultSchema);