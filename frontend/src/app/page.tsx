"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { generateQuestions } from "@/lib/api";
import { useQuizStore } from "@/lib/store";
import { CATEGORY_META, DIFFICULTY_META } from "@/types";
import type { Category, Difficulty } from "@/types";
import { Trophy } from "lucide-react";
import clsx from "clsx";

const COUNTS = [5, 10, 15];

export default function HomePage() {
  const router = useRouter();
  const setSession = useQuizStore((s) => s.setSession);

  const [category, setCategory] = useState<Category>("basics");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    const toastId = toast.loading("AI가 문제를 생성하고 있어요...");
    try {
      const data = await generateQuestions(category, difficulty, count);
      setSession({ sessionKey: data.session_key, questions: data.questions, maxScore: data.max_score, category, difficulty });
      toast.success("문제 생성 완료!", { id: toastId });
      router.push("/quiz");
    } catch {
      toast.error("문제 생성에 실패했어요. 다시 시도해주세요.", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐍</span>
          <span className="font-mono font-semibold text-lg text-zinc-100">PyQuiz</span>
          <span className="badge bg-python-blue/20 text-blue-400 text-xs ml-1">AI 면접 대비</span>
        </div>
        <button
          onClick={() => router.push("/leaderboard")}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
        >
          <Trophy size={16} />
          리더보드
        </button>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-zinc-100 mb-3">
            Python 면접 <span className="text-python-yellow">완벽 대비</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Gemini AI가 실시간으로 문제를 생성하고, 당신의 답변을 평가해드려요.
          </p>
        </motion.div>

        {/* Category */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">카테고리</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={clsx(
                  "card p-4 text-left transition-all duration-200 hover:border-zinc-600",
                  category === key
                    ? "border-python-blue bg-python-blue/10"
                    : "border-zinc-800"
                )}
              >
                <div className="text-2xl mb-2">{meta.icon}</div>
                <div className="font-medium text-sm text-zinc-100">{meta.label}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{meta.desc}</div>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Difficulty */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">난이도</p>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(DIFFICULTY_META) as [Difficulty, typeof DIFFICULTY_META[Difficulty]][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setDifficulty(key)}
                className={clsx(
                  "card p-4 text-center transition-all duration-200 hover:border-zinc-600",
                  difficulty === key ? "border-python-blue bg-python-blue/10" : "border-zinc-800"
                )}
              >
                <div className={clsx("text-lg font-bold", meta.color)}>{meta.label}</div>
                <div className="text-xs text-zinc-500 mt-1">문제당 {meta.points}점</div>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Count */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">문제 수</p>
          <div className="grid grid-cols-3 gap-3">
            {COUNTS.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={clsx(
                  "card p-4 text-center transition-all duration-200 hover:border-zinc-600",
                  count === c ? "border-python-blue bg-python-blue/10" : "border-zinc-800"
                )}
              >
                <div className="text-lg font-bold text-zinc-100">{c}문제</div>
                <div className="text-xs text-zinc-500 mt-1">
                  최대 {c * DIFFICULTY_META[difficulty].points}점
                </div>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Start */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleStart}
          disabled={loading}
          className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI가 문제 생성 중...
            </>
          ) : (
            <>▶ 퀴즈 시작</>
          )}
        </motion.button>
      </div>
    </main>
  );
}
