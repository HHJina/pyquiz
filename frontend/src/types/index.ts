export type Category = "basics" | "oop" | "algorithms" | "advanced" | "practical" | "docker" | "git" | "mixed";
export type Difficulty = "easy" | "medium" | "hard";
export type QuizResult = "correct" | "partial" | "incorrect";

export interface Question {
  id: number;
  category: Category;
  difficulty: Difficulty;
  question_text: string;
  hint: string;
  code_snippet: string | null;
}

export interface GenerateResponse {
  session_key: string;
  questions: Question[];
  max_score: number;
}

export interface AnswerResponse {
  result: QuizResult;
  score_earned: number;
  feedback: string;
  model_answer: string;
  session_score: number;
}

export interface AnswerHistory {
  question: Question;
  user_answer: string;
  result: QuizResult;
  score_earned: number;
  feedback: string;
  model_answer: string;
}

export interface QuizState {
  sessionKey: string;
  questions: Question[];
  currentIndex: number;
  maxScore: number;
  totalScore: number;
  history: AnswerHistory[];
  category: Category;
  difficulty: Difficulty;
}

export interface LeaderboardEntry {
  id: number;
  nickname: string;
  category: string;
  difficulty: string;
  score: number;
  max_score: number;
  percentage: number;
  created_at: string;
}

export const CATEGORY_META: Record<Category, { label: string; icon: string; desc: string }> = {
  basics:     { label: "Python 기초",      icon: "📦", desc: "자료형, 함수, 예외처리" },
  oop:        { label: "OOP",              icon: "🧱", desc: "클래스, 상속, 다형성" },
  algorithms: { label: "자료구조/알고리즘", icon: "⚡", desc: "리스트, 정렬, 복잡도" },
  advanced:   { label: "고급 Python",      icon: "🔬", desc: "데코레이터, 제너레이터" },
  practical:  { label: "실무/면접",        icon: "💼", desc: "GIL, 메모리, 최적화" },
  docker:     { label: "Docker",           icon: "🐳", desc: "컨테이너, Compose, 배포" },
  git:        { label: "Git",              icon: "🌿", desc: "버전 관리, 브랜치 전략" },
  mixed:      { label: "랜덤 믹스",        icon: "🎲", desc: "전체 범위 랜덤" },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string; points: number }> = {
  easy:   { label: "입문", color: "text-emerald-400", points: 10 },
  medium: { label: "중급", color: "text-amber-400",   points: 20 },
  hard:   { label: "고급", color: "text-red-400",     points: 30 },
};

export const RESULT_META: Record<QuizResult, { label: string; icon: string; color: string; bg: string }> = {
  correct:   { label: "정답",      icon: "✓", color: "text-emerald-400", bg: "bg-emerald-950 border-emerald-800" },
  partial:   { label: "부분 정답", icon: "△", color: "text-amber-400",   bg: "bg-amber-950 border-amber-800" },
  incorrect: { label: "오답",      icon: "✗", color: "text-red-400",     bg: "bg-red-950 border-red-800" },
};
