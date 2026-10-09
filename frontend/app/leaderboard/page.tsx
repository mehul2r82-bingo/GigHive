'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Coins } from 'lucide-react';
import API from '@/services/api';
import GamificationBadge, { BadgeType } from '@/components/GamificationBadge';
import TokenDetailsModal from '@/components/TokenDetailsModal';

interface LeaderboardEntry {
  rank: number;
  username: string;
  reg_no: string;
  tokens: number;
  badge_type: BadgeType | string;
  tasks_completed: number;
  tasks_posted?: number;
  total_volume?: number;
}

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: 'hero3377', reg_no: '1240****', tokens: 5, badge_type: 'MASTER', tasks_completed: 4, tasks_posted: 1, total_volume: 1622 },
  { rank: 2, username: 'top123', reg_no: '1231****', tokens: 4, badge_type: 'RECRUITER', tasks_completed: 0, tasks_posted: 4, total_volume: 240 },
  { rank: 3, username: 'Rahul_k', reg_no: '7438****', tokens: 3, badge_type: 'HUSTLER', tasks_completed: 1, tasks_posted: 2, total_volume: 110 },
  { rank: 4, username: 'zero2299', reg_no: '1238****', tokens: 2, badge_type: 'ACTIVE', tasks_completed: 0, tasks_posted: 1, total_volume: 0 },
  { rank: 5, username: 'geo', reg_no: '1235****', tokens: 2, badge_type: 'ACTIVE', tasks_completed: 0, tasks_posted: 1, total_volume: 0 },
  { rank: 6, username: 'Vipul', reg_no: '1241****', tokens: 2, badge_type: 'ACTIVE', tasks_completed: 0, tasks_posted: 1, total_volume: 0 },
  { rank: 7, username: 'ajaykumar', reg_no: '1240****', tokens: 2, badge_type: 'ACTIVE', tasks_completed: 0, tasks_posted: 1, total_volume: 0 },
  { rank: 8, username: 'Mehulsharma', reg_no: '1229****', tokens: 1, badge_type: 'ROOKIE', tasks_completed: 0, tasks_posted: 0, total_volume: 0 },
  { rank: 9, username: 'fisker678', reg_no: '1245****', tokens: 1, badge_type: 'ROOKIE', tasks_completed: 0, tasks_posted: 0, total_volume: 0 },
  { rank: 10, username: 'pop345', reg_no: '1248****', tokens: 1, badge_type: 'ROOKIE', tasks_completed: 0, tasks_posted: 0, total_volume: 0 },
];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    API.get<any>(`/leaderboard/?_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    })
      .then((res) => {
        if (res.data) {
          const list = res.data.leaderboard || res.data.speed_runners;
          if (Array.isArray(list) && list.length > 0) {
            setEntries(
              list.map((item: any, idx: number) => {
                const rawTokens = typeof item.tokens === 'number' ? item.tokens : 1;
                const tokens = Math.max(1, Math.min(5, rawTokens));

                // Synchronize badge_type directly from tokens:
                // 5 -> MASTER, 4 -> RECRUITER, 3 -> HUSTLER, 2 -> ACTIVE, 1 -> ROOKIE
                const badgeType: BadgeType =
                  tokens >= 5
                    ? 'MASTER'
                    : tokens === 4
                    ? 'RECRUITER'
                    : tokens === 3
                    ? 'HUSTLER'
                    : tokens === 2
                    ? 'ACTIVE'
                    : 'ROOKIE';

                return {
                  rank: idx + 1,
                  username: item.username,
                  reg_no: item.reg_no || 'Campus Student',
                  tokens,
                  badge_type: badgeType,
                  tasks_completed: item.tasks_completed || 0,
                  tasks_posted: item.tasks_posted || 0,
                  total_volume: item.total_volume || 0,
                };
              })
            );
          }
        }
      })
      .catch((err) => {
        console.warn('Leaderboard fetch fallback active:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#09090B] text-white px-4 py-8 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-500/[0.08] via-white/[0.02] to-transparent p-5 sm:p-6 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.15)]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-[0_0_16px_rgba(99,102,241,0.3)]">
              <Trophy size={22} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Campus Leaderboard
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Every campus hustler ranked by Hive Creds held across campus.
              </p>
            </div>
          </div>
        </div>

        {/* Unified Serial Ranking Table */}
        <div className="space-y-2.5">
          {entries.map((entry) => {
            const isRank1 = entry.rank === 1;
            const isRank2 = entry.rank === 2;
            const isRank3 = entry.rank === 3;

            // Formulate human-friendly activity summary instead of raw "0 gigs done"
            const comp = entry.tasks_completed || 0;
            const post = entry.tasks_posted || 0;
            const activityText =
              comp > 0 && post > 0
                ? `${comp} done · ${post} posted`
                : comp > 0
                ? `${comp} ${comp === 1 ? 'gig done' : 'gigs done'}`
                : post > 0
                ? `${post} ${post === 1 ? 'gig posted' : 'gigs posted'}`
                : 'New to campus';

            return (
              <div
                key={entry.username}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all duration-200 border ${
                  isRank1
                    ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/[0.10] via-amber-500/[0.03] to-transparent shadow-[0_0_24px_rgba(245,158,11,0.18)] hover:border-amber-400'
                    : isRank2
                    ? 'border-slate-200/70 bg-gradient-to-r from-slate-200/[0.14] via-slate-400/[0.05] to-transparent shadow-[0_0_24px_rgba(241,245,249,0.24)] hover:border-white'
                    : isRank3
                    ? 'border-indigo-400/50 bg-gradient-to-r from-indigo-500/[0.12] via-violet-500/[0.04] to-transparent shadow-[0_0_22px_rgba(99,102,241,0.25)] hover:border-indigo-300'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                {/* Left: Rank & User Details */}
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  {/* Rank Indicator */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                      isRank1
                        ? 'bg-amber-500/25 text-amber-300 border-amber-400/60 shadow-[0_0_14px_rgba(245,158,11,0.4)]'
                        : isRank2
                        ? 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-900 border-white shadow-[0_0_16px_rgba(255,255,255,0.4)]'
                        : isRank3
                        ? 'bg-indigo-500/25 text-indigo-200 border-indigo-400/60 shadow-[0_0_14px_rgba(99,102,241,0.35)]'
                        : 'bg-white/5 text-zinc-400 border-white/10'
                    }`}
                  >
                    #{entry.rank}
                  </div>

                  {/* Username & Registration */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-white truncate max-w-[120px] sm:max-w-[180px]">
                        @{entry.username}
                      </p>
                      <GamificationBadge type={entry.badge_type} size="sm" />
                    </div>
                    <p className="text-[11px] font-mono text-zinc-400 mt-0.5 truncate">
                      {entry.reg_no} · {activityText}
                    </p>
                  </div>
                </div>

                {/* Right: Tokens Display matching tier color cleanly */}
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEntry(entry)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 hover:scale-105 ${
                      isRank1 || entry.tokens >= 5
                        ? 'bg-amber-500/15 text-amber-300 border-amber-400/50 shadow-[0_0_14px_rgba(245,158,11,0.25)] hover:border-amber-300'
                        : isRank2 || entry.tokens === 4
                        ? 'bg-slate-200/15 text-slate-100 border-slate-300/50 shadow-[0_0_14px_rgba(241,245,249,0.25)] hover:border-white'
                        : entry.tokens === 3
                        ? 'bg-indigo-500/15 text-indigo-200 border-indigo-400/50 shadow-[0_0_14px_rgba(99,102,241,0.25)] hover:border-indigo-300'
                        : entry.tokens === 2
                        ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40 shadow-[0_0_14px_rgba(16,185,129,0.25)] hover:border-emerald-300'
                        : 'bg-white/5 text-zinc-300 border-white/10 hover:border-white/30'
                    }`}
                    title="Click to view prestige details"
                  >
                    <Coins
                      size={13}
                      className={
                        isRank1 || entry.tokens >= 5
                          ? 'text-amber-400'
                          : isRank2 || entry.tokens === 4
                          ? 'text-slate-200'
                          : entry.tokens === 3
                          ? 'text-indigo-400'
                          : entry.tokens === 2
                          ? 'text-emerald-400'
                          : 'text-zinc-400'
                      }
                    />
                    <span>{entry.tokens}</span>
                    <span className="text-[10px] text-zinc-400 font-sans font-normal hidden sm:inline">
                      {entry.tokens === 1 ? 'Cred' : 'Creds'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {selectedEntry && (
        <TokenDetailsModal
          isOpen={Boolean(selectedEntry)}
          onClose={() => setSelectedEntry(null)}
          totalTokens={selectedEntry.tokens}
          availableTokens={selectedEntry.tokens}
          lockedTokens={0}
          badgeType={selectedEntry.badge_type}
          totalVolume={selectedEntry.total_volume || 0}
          isLeaderboardView={true}
          username={selectedEntry.username}
        />
      )}
    </main>
  );
}
