'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Crown, Flame, Trophy } from 'lucide-react';
import GamificationBadge from '@/components/GamificationBadge';
import API from '@/services/api';
import type { SpeedRunnerEntry, GoldPatronEntry, LeaderboardData } from '@/types';

const DEFAULT_SPEED_RUNNERS: SpeedRunnerEntry[] = [
  { rank: 1, username: 'Hostel7_Flash', reg_no: '1240****', speed_streak: 6, fast_tasks: 14, tasks_completed: 18, badge_type: 'SPEED_DEMON' },
  { rank: 2, username: 'CodeNinja_LPU', reg_no: '1231****', speed_streak: 4, fast_tasks: 9, tasks_completed: 11, badge_type: 'SPEED_DEMON' },
  { rank: 3, username: 'Block34_Ace', reg_no: '1220****', speed_streak: 2, fast_tasks: 6, tasks_completed: 8, badge_type: 'FAST_RESPONDER' },
  { rank: 4, username: 'NightOwl_99', reg_no: '1241****', speed_streak: 1, fast_tasks: 3, tasks_completed: 5, badge_type: 'FAST_RESPONDER' },
  { rank: 5, username: 'CampusSprinter', reg_no: '1238****', speed_streak: 0, fast_tasks: 2, tasks_completed: 4, badge_type: 'VERIFIED_RUNNER' },
];

const DEFAULT_GOLD_PATRONS: GoldPatronEntry[] = [
  { rank: 1, username: 'FinTech_Lead', reg_no: '1240****', tasks_posted: 12, is_gold_patron: true, badge_type: 'GOLD_PATRON' },
  { rank: 2, username: 'BBA_Council', reg_no: '1235****', tasks_posted: 7, is_gold_patron: true, badge_type: 'GOLD_PATRON' },
  { rank: 3, username: 'UniClub_Design', reg_no: '1229****', tasks_posted: 5, is_gold_patron: true, badge_type: 'GOLD_PATRON' },
  { rank: 4, username: 'StartupCell', reg_no: '1242****', tasks_posted: 4, is_gold_patron: false, badge_type: 'SILVER_PATRON' },
  { rank: 5, username: 'Robotics_LPU', reg_no: '1234****', tasks_posted: 2, is_gold_patron: false, badge_type: 'BRONZE_PATRON' },
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'speed' | 'patrons'>('speed');
  const [speedData, setSpeedData] = useState<SpeedRunnerEntry[]>(DEFAULT_SPEED_RUNNERS);
  const [patronsData, setPatronsData] = useState<GoldPatronEntry[]>(DEFAULT_GOLD_PATRONS);

  useEffect(() => {
    API.get<LeaderboardData>('/leaderboard/')
      .then((res) => {
        if (res.data) {
          if (res.data.speed_runners?.length) setSpeedData(res.data.speed_runners);
          if (res.data.gold_patrons?.length) setPatronsData(res.data.gold_patrons);
        }
      })
      .catch((err) => {
        console.warn('Leaderboard fetch fallback active:', err);
      });
  }, []);

  const list = activeTab === 'speed' ? speedData : patronsData;

  return (
    <main className="min-h-screen bg-[#09090B] text-white px-4 py-8 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              <h1 className="font-mono text-xl font-bold tracking-tight">CAMPUS LEADERBOARD</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Top speed runners and task creators across LPU.
            </p>
          </div>

          {/* Clean 2-Pill Switcher */}
          <div className="inline-flex p-1 bg-white/[0.04] border border-white/10 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('speed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'speed'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap size={13} />
              <span>Speed (Takers)</span>
            </button>

            <button
              onClick={() => setActiveTab('patrons')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'patrons'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Crown size={13} />
              <span>Gold Patrons (Givers)</span>
            </button>
          </div>
        </div>

        {/* Single Unified Clean Table */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-3 border-b border-white/10 text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5 sm:col-span-5">Student</div>
            <div className="col-span-3 sm:col-span-3">Tier</div>
            <div className="col-span-3 text-right">
              {activeTab === 'speed' ? 'Streak / Fast' : 'Tasks / Rate'}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {list.map((entry) => {
              const isFirst = entry.rank === 1;
              const isSecond = entry.rank === 2;
              const isThird = entry.rank === 3;

              const rankBadge = isFirst
                ? 'text-amber-400 font-bold'
                : isSecond
                ? 'text-slate-300 font-bold'
                : isThird
                ? 'text-amber-600 font-bold'
                : 'text-zinc-500';

              return (
                <div
                  key={`${activeTab}-${entry.rank}-${entry.username}`}
                  className="grid grid-cols-12 px-4 py-3.5 items-center hover:bg-white/[0.02] transition-colors text-xs font-mono"
                >
                  {/* Rank */}
                  <div className={`col-span-1 text-center font-bold ${rankBadge}`}>
                    {entry.rank}
                  </div>

                  {/* Username & Reg */}
                  <div className="col-span-5 sm:col-span-5 min-w-0 pr-2">
                    <p className="font-semibold text-white truncate">{entry.username}</p>
                    <p className="text-[10px] text-zinc-500">{entry.reg_no}</p>
                  </div>

                  {/* Badge */}
                  <div className="col-span-3 sm:col-span-3">
                    {entry.badge_type ? (
                      <GamificationBadge
                        type={entry.badge_type}
                        size="sm"
                        showLabel={true}
                      />
                    ) : (
                      <span className="text-zinc-600 text-[11px]">Unranked</span>
                    )}
                  </div>

                  {/* Key Stats */}
                  <div className="col-span-3 text-right">
                    {activeTab === 'speed' ? (
                      <div>
                        {'speed_streak' in entry && entry.speed_streak > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-400">
                            <Flame size={12} className="fill-rose-500/30" />
                            {entry.speed_streak} streak
                          </span>
                        ) : (
                          <span className="text-zinc-400">
                            {'tasks_completed' in entry ? `${entry.tasks_completed} done` : '—'}
                          </span>
                        )}
                        <p className="text-[10px] text-zinc-500">
                          {'fast_tasks' in entry ? `${entry.fast_tasks} fast (<24h)` : ''}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="font-bold text-amber-300">
                          {'tasks_posted' in entry ? `${entry.tasks_posted} posted` : '—'}
                        </span>
                        <p className={`text-[10px] ${'is_gold_patron' in entry && entry.is_gold_patron ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                          {'is_gold_patron' in entry && entry.is_gold_patron ? '₹50 rate unlocked' : 'Standard ₹60'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimal helper note */}
        <p className="text-center text-[11px] font-mono text-zinc-500">
          Rankings update automatically on task escrow completion.
        </p>

      </div>
    </main>
  );
}
