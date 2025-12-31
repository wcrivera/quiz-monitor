// ============================================================================
// TYPES - QUIZ MONITOR BACKEND
// ============================================================================

export interface QuizSubmission {
  id: number;
  quiz_id: number;
  user_id: number;
  submission_id: number;
  started_at: string | null;
  finished_at: string | null;
  end_at: string | null;
  attempt: number;
  score: number | null;
  workflow_state: 'untaken' | 'pending_review' | 'complete' | 'settings_only' | 'preview';
  quiz_points_possible: number;
  submitted_at: string | null;
}

export interface CanvasQuiz {
  id: number;
  title: string;
  description: string;
  points_possible: number;
  published: boolean;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface QuizResultData {
  userId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  possiblePoints: number;
  percentageScore: number;
  submittedAt: Date;
  attempt: number;
}
