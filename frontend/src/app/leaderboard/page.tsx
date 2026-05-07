"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { fetchLeaderboard } from "@/lib/api";
import { CATEGORY_META, DIFFICULTY_META } from "@/types";
import type { LeaderboardEntry, Category, Difficulty } from "@/types";
import { ArrowLeft, Trophy } from "lucide-react";
import clsx from "clsx";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | "">("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard(category || undefined, difficulty || undefined)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [category, difficulty]);

  return (
    <main className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">홈으로</span>
        </button>
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-python-yellow" />
          <span className="font-mono font-semibold text-zinc-100">리더보드</span>
        </div>
        <div className="w-20" />
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "")}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-python-blue"
          >
            <option value="">전체 카테고리</option>
            {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-python-blue"
          >
            <option value="">전체 난이도</option>
            {(Object.entries(DIFFICULTY_META) as [Difficulty, typeof DIFFICULTY_META[Difficulty]][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-zinc-700 border-t-python-blue rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <Trophy size={40} className="mx-auto mb-3 opacity-30" />
            <p>아직 기록이 없어요. 첫 번째 도전자가 되어보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-4 flex items-center gap-4"
              >
                <div className="text-2xl w-8 text-center">
                  {i < 3 ? MEDALS[i] : <span className="font-mono text-sm text-zinc-500">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-100 truncate">{entry.nickname}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5 flex-wrap">
                    <span>{CATEGORY_META[entry.category as Category]?.icon} {CATEGORY_META[entry.category as Category]?.label ?? entry.category}</span>
                    <span className={DIFFICULTY_META[entry.difficulty as Difficulty]?.color ?? "text-zinc-400"}>
                      {DIFFICULTY_META[entry.difficulty as Difficulty]?.label ?? entry.difficulty}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={clsx("font-mono font-bold text-lg", entry.percentage >= 80 ? "text-emerald-400" : entry.percentage >= 50 ? "text-amber-400" : "text-red-400")}>
                    {entry.percentage}%
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">{entry.score}/{entry.max_score}점</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
