'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle, PlusCircle, Users } from 'lucide-react';
import API from '@/services/api';
import type { LeaderboardData } from '@/types';

interface SimpleLeaderboardEntry {
  rank: number;
  username: string;
  reg_no: string;
  tasks_count: number;
  label: string;
}

const DEFAULT_SOLVERS: SimpleLeaderboardEntry[] = [
  { rank: 1, username: 'Hostel7_Flash', reg_no: '1240****', tasks_count: 18, label: 'Top Solver 👑' },
  { rank: 2, username: 'CodeNinja_LPU', reg_no: '1231****', tasks_count: 11, label: 'Star Solver' },
  { rank: 3, username: 'Block34_Ace', reg_no: '1220****', tasks_count: 8, label: 'Star Solver' },
  { rank: 4, username: 'NightOwl_99', reg_no: '1241****', tasks_count: 5, label: 'Active Helper' },
  { rank: 5, username: 'CampusSprinter', reg_no: '1238****', tasks_count: 4, label: 'Active Helper' },
];

const DEFAULT_GIVERS: SimpleLeaderboardEntry[] = [
  { rank: 1, username: 'FinTech_Lead', reg_no: '1240****', tasks_count: 12, label: 'Top Poster 👑' },
  { rank: 2, username: 'BBA_Council', reg_no: '1235****', tasks_count: 7, label: 'Frequent Poster' },
  { rank: 3, username: 'UniClub_Design', reg_no: '1229****', tasks_count: 5, label: 'Frequent Poster' },
  { rank: 4, username: 'StartupCell', reg_no: '1242****', tasks_count: 4, label: 'Task Creator' },
  { rank: 5, username: 'Robotics_LPU', reg_no: '1234****', tasks_count: 2, label: 'Task Creator' },
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'solvers' | 'givers'>('solvers');
  const [solvers, setSolvers] = useState<SimpleLeaderboardEntry[]>(DEFAULT_SOLVERS);
  const [givers, setGivers] = useState<SimpleLeaderboardEntry[]>(DEFAULT_GIVERS);

  useEffect(() => {
    API.get<LeaderboardData>('/leaderboard/')
      .then((res) => {
        if (res.data) {
          if (res.data.speed_runners?.length) {
            setSolvers(
              res.data.speed_runners.map((item, idx) => ({
                rank: idx + 1,
                username: item.username,
                reg_no: item.reg_no,
                tasks_count: item.tasks_completed || 0,
                label: idx === 0 ? 'Top Solver 👑' : idx < 3 ? 'Star Solver' : 'Active Helper',
              }))
            );
          }
          if (res.data.gold_patrons?.length) {
            setGivers(
              res.data.gold_patrons.map((item, idx) => ({
                rank: idx + 1,
                username: item.username,
                reg_no: item.reg_no,
                tasks_count: item.tasks_posted || 0,
                label: idx === 0 ? 'Top Poster 👑' : idx < 3 ? 'Frequent Poster' : 'Task Creator',
              }))
            );
          }
        }
      })
      .catch((err) => {
        console.warn('Leaderboard fetch fallback active:', err);
      });
  }, []);

  const list = activeTab === 'solvers' ? solvers : givers;

  return (
    <main className="min-h-screen bg-[#09090B] text-white px-4 py-8 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Trophy size={18} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Campus Leaderboard
              </h1>
              <p className="text-xs text-zinc-400">
                Top students completing gigs & helping classmates at LPU.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection: Solvers vs Givers */}
        <div className="grid grid-cols-2 p-1 bg-zinc-900 border border-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab('solvers')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'solvers'
                ? 'bg-amber-400 text-black shadow-sm font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle size={14} />
            <span>Top Solvers (Earners)</span>
          </button>

          <button
            onClick={() => setActiveTab('givers')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'givers'
                ? 'bg-amber-400 text-black shadow-sm font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PlusCircle size={14} />
            <span>Top Posters (Givers)</span>
          </button>
        </div>

        {/* Clear, Simple List */}
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          {list.map((item) => {
            const isFirst = item.rank === 1;
            const isSecond = item.rank === 2;
            const isThird = item.rank === 3;

            return (
              <div
                key={`${activeTab}-${item.rank}-${item.username}`}
                className="px-4 py-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
              >
                {/* Left: Rank & User Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isFirst
                        ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                        : isSecond
                        ? 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/40'
                        : isThird
                        ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                        : 'bg-white/5 text-zinc-500'
                    }`}
                  >
                    {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : item.rank}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">
                        {item.username}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 shrink-0">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">LPU • {item.reg_no}</p>
                  </div>
                </div>

                {/* Right: Tasks Count */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-amber-300">
                    {item.tasks_count} {activeTab === 'solvers' ? 'Completed' : 'Posted'}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {activeTab === 'solvers' ? 'Tasks done' : 'Gigs created'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Simple Note */}
        <p className="text-center text-xs text-zinc-500">
          Rankings update automatically when tasks are marked complete.
        </p>

      </div>
    </main>
  );
}
