import axios from "axios";
import type { GenerateResponse, AnswerResponse, LeaderboardEntry } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export async function startQuizFromDB(
  category: string,
  difficulty: string,
  count: number
): Promise<GenerateResponse> {
  const { data } = await api.post("/api/quiz/start/", { category, difficulty, count });
  return data;
}

export async function getDBQuestionCount(
  category?: string,
  difficulty?: string
): Promise<number> {
  const params: Record<string, string> = {};
  if (category) params.category = category;
  if (difficulty) params.difficulty = difficulty;
  const { data } = await api.get("/api/quiz/db-count/", { params });
  return data.count;
}


export async function submitAnswer(
  session_key: string,
  question_id: number,
  user_answer: string
): Promise<AnswerResponse> {
  const { data } = await api.post("/api/quiz/answer/", { session_key, question_id, user_answer });
  return data;
}

export async function completeSession(session_key: string, nickname?: string) {
  const { data } = await api.post("/api/quiz/complete/", { session_key, nickname });
  return data;
}

export async function fetchLeaderboard(
  category?: string,
  difficulty?: string
): Promise<LeaderboardEntry[]> {
  const params: Record<string, string> = {};
  if (category) params.category = category;
  if (difficulty) params.difficulty = difficulty;
  const { data } = await api.get("/api/leaderboard/", { params });
  return data;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await api.get("/api/health/");
    return true;
  } catch {
    return false;
  }
}
