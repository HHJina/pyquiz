import { create } from "zustand";
import type { QuizState, Question, AnswerHistory, Category, Difficulty } from "@/types";

interface QuizStore extends Partial<QuizState> {
  setSession: (data: {
    sessionKey: string;
    questions: Question[];
    maxScore: number;
    category: Category;
    difficulty: Difficulty;
  }) => void;
  addAnswer: (answer: AnswerHistory, scoreEarned: number) => void;
  nextQuestion: () => void;
  reset: () => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
  sessionKey: undefined,
  questions: undefined,
  currentIndex: 0,
  maxScore: 0,
  totalScore: 0,
  history: [],
  category: undefined,
  difficulty: undefined,

  setSession: ({ sessionKey, questions, maxScore, category, difficulty }) =>
    set({ sessionKey, questions, maxScore, category, difficulty, currentIndex: 0, totalScore: 0, history: [] }),

  addAnswer: (answer, scoreEarned) =>
    set((s) => ({
      history: [...(s.history ?? []), answer],
      totalScore: (s.totalScore ?? 0) + scoreEarned,
    })),

  nextQuestion: () =>
    set((s) => ({ currentIndex: (s.currentIndex ?? 0) + 1 })),

  reset: () =>
    set({
      sessionKey: undefined,
      questions: undefined,
      currentIndex: 0,
      maxScore: 0,
      totalScore: 0,
      history: [],
      category: undefined,
      difficulty: undefined,
    }),
}));
