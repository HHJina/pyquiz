"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { generateQuestions, startQuizFromDB, getDBQuestionCount } from "@/lib/api";
import { useQuizStore } from "@/lib/store";
import { CATEGORY_META, DIFFICULTY_META } from "@/types";
import type { Category, Difficulty, QuizMode } from "@/types";
import { Trophy, Sparkles, Database, Loader2 } from "lucide-react";
import clsx from "clsx";

const COUNTS = [5, 10, 15];

export default function HomePage() {
  const router = useRouter();
  const setSession = useQuizStore((s) => s.setSession);

  const [mode, setMode] = useState<QuizMode>("ai");
  const [category, setCategory] = useState<Category>("basics");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [dbCount, setDbCount] = useState<number | null>(null);
  const [dbCountLoading, setDbCountLoading] = useState(false);

  // DB 모드에서 카테고리/난이도 변경 시 문제 수 조회
  useEffect(() => {
    if (mode !== "db") return;
    setDbCountLoading(true);
    getDBQuestionCount(category, difficulty)
      .then(setDbCount)
      .catch(() => setDbCount(null))
      .finally(() => setDbCountLoading(false));
  }, [mode, category, difficulty]);

  async function handleStart() {
    setLoading(true);

    if (mode === "db") {
      const toastId = toast.loading("문제를 불러오는 중...");
      try {
        const data = await startQuizFromDB(category, difficulty, count);
        setSession({ sessionKey: data.session_key, questions: data.questions, maxScore: data.max_score, category, difficulty, mode: "db" });
        toast.success("퀴즈 시작!", { id: toastId });
        router.push("/quiz");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast.error(msg ?? "문제를 불러오지 못했어요. 다시 시도해주세요.", { id: toastId });
      } finally {
        setLoading(false);
      }
    } else {
      const toastId = toast.loading("AI가 문제를 생성하고 있어요...");
      try {
        const data = await generateQuestions(category, difficulty, count);
        setSession({ sessionKey: data.session_key, questions: data.questions, maxScore: data.max_score, category, difficulty, mode: "ai" });
        toast.success("문제 생성 완료!", { id: toastId });
        router.push("/quiz");
      } catch {
        toast.error("문제 생성에 실패했어요. 다시 시도해주세요.", { id: toastId });
      } finally {
        setLoading(false);
      }
    }
  }

  const dbInsufficient = mode === "db" && dbCount !== null && dbCount < count;

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐍</span>
          <span className="font-mono font-semibold text-lg text-zinc-100">PyQuiz</span>
          <span className="badge bg-python-blue/20 text-blue-400 text-xs ml-1">Python 면접 대비</span>
        </div>
        <button
          onClick={() => router.push("/leaderboard")}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
        >
          <Trophy size={16} />
          리더보드
        </button>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-zinc-100 mb-3">
            Python 면접 <span className="text-python-yellow">완벽 대비</span>
          </h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-zinc-400 text-base"
            >
              {mode === "ai"
                ? "Gemini AI가 실시간으로 문제를 생성하고, 당신의 답변을 평가해드려요."
                : "사전 검수된 고품질 문제로 즉시 시작해 AI 평가까지 받아보세요."}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">출제 방식</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("ai")}
              className={clsx(
                "card p-4 text-left transition-all duration-200 hover:border-zinc-600",
                mode === "ai" ? "border-purple-500 bg-purple-950/40" : "border-zinc-800"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className={mode === "ai" ? "text-purple-400" : "text-zinc-500"} />
                <span className={clsx("font-semibold text-sm", mode === "ai" ? "text-purple-300" : "text-zinc-400")}>
                  AI 생성
                </span>
              </div>
              <p className="text-xs text-zinc-500">Gemini가 매번 새로운 문제를 만들어요</p>
            </button>
            <button
              onClick={() => setMode("db")}
              className={clsx(
                "card p-4 text-left transition-all duration-200 hover:border-zinc-600",
                mode === "db" ? "border-emerald-500 bg-emerald-950/40" : "border-zinc-800"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database size={18} className={mode === "db" ? "text-emerald-400" : "text-zinc-500"} />
                <span className={clsx("font-semibold text-sm", mode === "db" ? "text-emerald-300" : "text-zinc-400")}>
                  DB 문제
                </span>
              </div>
              <p className="text-xs text-zinc-500">검수된 336개 문제 중 랜덤 출제</p>
            </button>
          </div>
        </motion.div>

        {/* Category */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">카테고리</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={clsx(
                  "card p-3 text-left transition-all duration-200 hover:border-zinc-600",
                  category === key
                    ? "border-python-blue bg-python-blue/10"
                    : "border-zinc-800"
                )}
              >
                <div className="text-xl mb-1">{meta.icon}</div>
                <div className="font-medium text-xs text-zinc-100 leading-tight">{meta.label}</div>
                <div className="text-xs text-zinc-600 mt-0.5 truncate">{meta.desc}</div>
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
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">문제 수</p>
            {/* DB 모드 문제 수 표시 */}
            <AnimatePresence>
              {mode === "db" && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={clsx(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    dbCountLoading ? "text-zinc-500" :
                    dbCount === null ? "text-zinc-500" :
                    dbInsufficient ? "bg-red-950 text-red-400 border border-red-800" :
                    "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  )}
                >
                  {dbCountLoading
                    ? "확인 중..."
                    : dbCount === null
                    ? "-"
                    : `${CATEGORY_META[category].label} ${DIFFICULTY_META[difficulty].label} · ${dbCount}문제 보유`}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {COUNTS.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={clsx(
                  "card p-4 text-center transition-all duration-200 hover:border-zinc-600",
                  count === c ? "border-python-blue bg-python-blue/10" : "border-zinc-800",
                  mode === "db" && dbCount !== null && dbCount < c && "opacity-40 cursor-not-allowed"
                )}
                disabled={mode === "db" && dbCount !== null && dbCount < c}
              >
                <div className="text-lg font-bold text-zinc-100">{c}문제</div>
                <div className="text-xs text-zinc-500 mt-1">
                  최대 {c * DIFFICULTY_META[difficulty].points}점
                </div>
              </button>
            ))}
          </div>
          {dbInsufficient && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-xs text-red-400"
            >
              ⚠ 선택한 카테고리·난이도에 문제가 부족해요. 더 적은 문제 수를 선택해주세요.
            </motion.p>
          )}
        </motion.section>

        {/* Start Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleStart}
          disabled={loading || dbInsufficient}
          className={clsx(
            "w-full text-base py-4 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all",
            mode === "ai"
              ? "bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
              : "bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
          )}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {mode === "ai" ? "AI가 문제 생성 중..." : "문제 불러오는 중..."}
            </>
          ) : mode === "ai" ? (
            <>
              <Sparkles size={18} />
              AI 문제 생성 후 시작
            </>
          ) : (
            <>
              <Database size={18} />
              즉시 시작
            </>
          )}
        </motion.button>
      </div>
    </main>
  );
}
