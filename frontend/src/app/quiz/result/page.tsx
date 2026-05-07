"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useQuizStore } from "@/lib/store";
import { completeSession } from "@/lib/api";
import { CATEGORY_META, DIFFICULTY_META, RESULT_META } from "@/types";
import { Trophy, RotateCcw } from "lucide-react";
import clsx from "clsx";

function getGrade(pct: number) {
  if (pct >= 90) return { label: "완벽해요! 🎉", color: "text-emerald-400" };
  if (pct >= 70) return { label: "잘 했어요! 👍", color: "text-blue-400" };
  if (pct >= 50) return { label: "절반 이상! 📚", color: "text-amber-400" };
  return { label: "더 공부해봐요 💪", color: "text-red-400" };
}

export default function ResultPage() {
  const router = useRouter();
  const { sessionKey, questions, history = [], maxScore = 0, totalScore = 0, category, difficulty, reset } = useQuizStore();

  const [nickname, setNickname] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const grade = getGrade(percentage);
  const correct = history.filter((h) => h.result === "correct").length;
  const partial = history.filter((h) => h.result === "partial").length;
  const incorrect = history.filter((h) => h.result === "incorrect").length;

  useEffect(() => {
    if (!sessionKey || !questions) router.replace("/");
  }, [sessionKey, questions, router]);

  async function handleSave() {
    if (!nickname.trim()) { toast.error("닉네임을 입력해주세요"); return; }
    setSaving(true);
    try {
      await completeSession(sessionKey!, nickname.trim());
      setSubmitted(true);
      toast.success("리더보드에 등록됐어요!");
    } catch {
      toast.error("저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  if (!sessionKey) return null;

  const catMeta = CATEGORY_META[category ?? "basics"];
  const diffMeta = DIFFICULTY_META[difficulty ?? "easy"];

  return (
    <main className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐍</span>
          <span className="font-mono font-semibold text-zinc-100">PyQuiz</span>
        </div>
        <button
          onClick={() => router.push("/leaderboard")}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
        >
          <Trophy size={16} />
          리더보드
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 text-center mb-6"
        >
          <div className="text-6xl font-bold font-mono text-python-yellow mb-2">
            {percentage}<span className="text-3xl text-zinc-500">%</span>
          </div>
          <div className={clsx("text-xl font-medium mb-1", grade.color)}>{grade.label}</div>
          <div className="text-zinc-500 text-sm">
            {totalScore} / {maxScore}점 · {catMeta.icon} {catMeta.label} · <span className={diffMeta.color}>{diffMeta.label}</span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            { label: "정답", value: correct, color: "text-emerald-400" },
            { label: "부분 정답", value: partial, color: "text-amber-400" },
            { label: "오답", value: incorrect, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className={clsx("text-2xl font-bold font-mono", s.color)}>{s.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Leaderboard save */}
        {!submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-5 mb-6"
          >
            <p className="text-sm font-medium text-zinc-300 mb-3">🏆 리더보드에 등록할까요?</p>
            <div className="flex gap-3">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 입력"
                maxLength={20}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:border-python-blue transition-colors"
              />
              <button onClick={handleSave} disabled={saving} className="btn-primary px-5 py-2.5 text-sm">
                {saving ? "저장 중..." : "등록"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-5 mb-6 bg-emerald-950/40 border-emerald-800/40 text-center text-emerald-400 text-sm"
          >
            ✓ 리더보드에 등록되었어요!
          </motion.div>
        )}

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">문제별 결과</p>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className={clsx("card border p-4", RESULT_META[h.result].bg)}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-sm text-zinc-300 flex-1">Q{i + 1}. {h.question.question_text}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={clsx("text-xs font-medium", RESULT_META[h.result].color)}>
                      {RESULT_META[h.result].label}
                    </span>
                    <span className={clsx("font-mono text-xs font-bold", RESULT_META[h.result].color)}>
                      +{h.score_earned}점
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{h.feedback}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => { reset!(); router.push("/"); }} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <RotateCcw size={16} />
            다시 시작
          </button>
          <button onClick={() => router.push("/leaderboard")} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Trophy size={16} />
            리더보드
          </button>
        </div>
      </div>
    </main>
  );
}
