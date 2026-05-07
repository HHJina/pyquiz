"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useQuizStore } from "@/lib/store";
import { submitAnswer } from "@/lib/api";
import { CATEGORY_META, DIFFICULTY_META, RESULT_META } from "@/types";
import type { AnswerResponse } from "@/types";
import { Lightbulb, ChevronRight, RotateCcw } from "lucide-react";
import clsx from "clsx";

export default function QuizPage() {
  const router = useRouter();
  const { sessionKey, questions, currentIndex = 0, maxScore = 0, difficulty, category, addAnswer, nextQuestion, reset } = useQuizStore();

  const [answer, setAnswer] = useState("");
  const [hintVisible, setHintVisible] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const question = questions?.[currentIndex];
  const isLast = currentIndex === (questions?.length ?? 0) - 1;
  const progress = questions ? ((currentIndex) / questions.length) * 100 : 0;

  useEffect(() => {
    if (!sessionKey || !questions) router.replace("/");
  }, [sessionKey, questions, router]);

  useEffect(() => {
    setAnswer("");
    setHintVisible(false);
    setEvaluation(null);
  }, [currentIndex]);

  if (!question || !sessionKey) return null;

  async function handleSubmit() {
    if (!answer.trim()) { toast.error("답변을 입력해주세요"); return; }
    setLoading(true);
    const toastId = toast.loading("AI가 답변을 평가 중...");
    try {
      const res = await submitAnswer(sessionKey!, question!.id, answer.trim());
      setEvaluation(res);
      addAnswer!({
        question: question!,
        user_answer: answer.trim(),
        result: res.result,
        score_earned: res.score_earned,
        feedback: res.feedback,
        model_answer: res.model_answer,
      }, res.score_earned);
      toast.success(RESULT_META[res.result].label + "!", { id: toastId });
    } catch {
      toast.error("평가 중 오류가 발생했어요.", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (isLast) {
      router.push("/quiz/result");
    } else {
      nextQuestion!();
    }
  }

  const diffMeta = DIFFICULTY_META[difficulty ?? "easy"];
  const catMeta = CATEGORY_META[category ?? "basics"];

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐍</span>
          <span className="font-mono font-semibold text-zinc-100">PyQuiz</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span>{catMeta.icon} {catMeta.label}</span>
          <span className={diffMeta.color}>{diffMeta.label}</span>
          <button onClick={() => { reset!(); router.push("/"); }} className="hover:text-zinc-100 transition-colors">
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800">
        <motion.div
          className="h-full bg-python-blue"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        {/* Counter */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-mono text-sm text-zinc-500">
            {currentIndex + 1} / {questions?.length}
          </span>
          <span className="text-sm text-zinc-500">
            최대 <span className="text-zinc-300 font-medium">{maxScore}점</span>
          </span>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="card p-6 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="badge bg-zinc-800 text-zinc-400">{catMeta.icon} {catMeta.label}</span>
                <span className={clsx("badge bg-zinc-800", diffMeta.color)}>{diffMeta.label}</span>
                <span className="badge bg-zinc-800 text-zinc-400 ml-auto">+{diffMeta.points}점</span>
              </div>

              <p className="text-lg font-medium text-zinc-100 leading-relaxed mb-4">
                {question.question_text}
              </p>

              {question.code_snippet && (
                <pre className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm font-mono text-zinc-300 overflow-x-auto mb-4">
                  <code>{question.code_snippet}</code>
                </pre>
              )}

              {/* Hint */}
              <button
                onClick={() => setHintVisible(!hintVisible)}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-400 transition-colors"
              >
                <Lightbulb size={14} />
                {hintVisible ? "힌트 숨기기" : "힌트 보기"}
              </button>

              <AnimatePresence>
                {hintVisible && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 bg-amber-950/40 border border-amber-800/40 rounded-xl p-3 text-sm text-amber-300"
                  >
                    💡 {question.hint}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Answer area */}
            {!evaluation && (
              <div className="card p-5 mb-4">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">내 답변</p>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="여기에 답변을 자유롭게 작성하세요..."
                  rows={5}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-zinc-100 text-sm placeholder-zinc-600 resize-none focus:outline-none focus:border-python-blue transition-colors"
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading || !answer.trim()}
                  className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI 평가 중...
                    </>
                  ) : "답변 제출"}
                </button>
              </div>
            )}

            {/* Feedback */}
            <AnimatePresence>
              {evaluation && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Result */}
                  <div className={clsx("card border p-5", RESULT_META[evaluation.result].bg)}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={clsx("font-bold text-lg", RESULT_META[evaluation.result].color)}>
                        {RESULT_META[evaluation.result].icon} {RESULT_META[evaluation.result].label}
                      </span>
                      <span className={clsx("font-mono font-bold", RESULT_META[evaluation.result].color)}>
                        +{evaluation.score_earned}점
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{evaluation.feedback}</p>
                  </div>

                  {/* Model answer */}
                  <div className="card p-5">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">모범 답변</p>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{evaluation.model_answer}</p>
                  </div>

                  {/* My answer summary */}
                  <div className="card p-5">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">내 답변</p>
                    <p className="text-sm text-zinc-400 leading-relaxed">{answer}</p>
                  </div>

                  <button onClick={handleNext} className="btn-primary w-full flex items-center justify-center gap-2">
                    {isLast ? "결과 보기" : "다음 문제"}
                    <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
