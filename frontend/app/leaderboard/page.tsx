'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Zap, 
  Crown, 
  Flame, 
  Sparkles, 
  Coins, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import GamificationBadge, { BadgeType } from '@/components/GamificationBadge';
import API from '@/services/api';
import type { SpeedRunnerEntry, GoldPatronEntry, LeaderboardData } from '@/types';
import Link from 'next/link';

// Fallback preview benchmarks in case campus community is just starting out
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
  const [loading, setLoading] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await API.get<LeaderboardData>('/leaderboard/');
        if (res.data) {
          if (res.data.speed_runners && res.data.speed_runners.length > 0) {
            setSpeedData(res.data.speed_runners);
          }
          if (res.data.gold_patrons && res.data.gold_patrons.length > 0) {
            setPatronsData(res.data.gold_patrons);
          }
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const topThree = activeTab === 'speed' ? speedData.slice(0, 3) : patronsData.slice(0, 3);
  const remainingList = activeTab === 'speed' ? speedData.slice(3) : patronsData.slice(3);

  // Reorder top 3 for Olympic Podium display: [2nd (Silver), 1st (Gold), 3rd (Bronze)]
  const podiumOrder = [
    topThree[1] || null, // Silver (left)
    topThree[0] || null, // Gold (center)
    topThree[2] || null, // Bronze (right)
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-100 px-4 py-8 sm:px-6 lg:px-8 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* ==================== HERO HEADER ==================== */}
        <div className="relative text-center space-y-4 pt-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md text-[11px] font-mono tracking-widest uppercase text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
          >
            <Trophy size={14} className="text-amber-400" />
            <span>Campus Hall of Fame</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold tracking-tight text-white"
          >
            LPU REP & SPEED ARENA
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-sans"
          >
            Compete on verified delivery speed and creator volume. Unlock platform perks, fee discounts, and token multipliers.
          </motion.p>

          {/* RULES TICKER / BANNER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-forge-surface to-cyan-500/10 border border-white/10 text-xs font-mono flex flex-wrap items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-2 text-slate-300">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                ₹
              </span>
              <span><strong>Gold Tier:</strong> 5 posted tasks unlocks <strong>₹50</strong> base rate</span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                ⚡
              </span>
              <span><strong>Speed Streak:</strong> 24hr delivery grants <strong>+1 Token</strong> & <strong>+₹10 Bonus</strong></span>
            </div>

            <button
              onClick={() => setShowRulesModal(true)}
              className="ml-auto inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors underline underline-offset-2"
            >
              <Info size={13} />
              <span>How Perks Work</span>
            </button>
          </motion.div>
        </div>

        {/* ==================== TAB NAVIGATION ==================== */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <button
              onClick={() => setActiveTab('speed')}
              className={`relative px-6 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'speed'
                  ? 'text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeTab === 'speed' && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-cyan-500/20 border border-cyan-400/40 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Zap size={15} className={activeTab === 'speed' ? 'text-cyan-400' : 'text-slate-400'} />
              <span className="relative z-10">Top Speed Runners (Takers)</span>
            </button>

            <button
              onClick={() => setActiveTab('patrons')}
              className={`relative px-6 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'patrons'
                  ? 'text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeTab === 'patrons' && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-amber-500/20 border border-amber-400/40 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Crown size={15} className={activeTab === 'patrons' ? 'text-amber-400' : 'text-slate-400'} />
              <span className="relative z-10">Gold Patrons (Givers)</span>
            </button>
          </div>
        </div>

        {/* ==================== OLYMPIC PODIUM (TOP 3) ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8 pb-4">
          {podiumOrder.map((entry, index) => {
            if (!entry) return null;
            const isFirst = entry.rank === 1;
            const isSecond = entry.rank === 2;
            const isThird = entry.rank === 3;

            const pedestalHeight = isFirst ? 'md:h-80' : isSecond ? 'md:h-72' : 'md:h-64';
            const glowColor = isFirst 
              ? 'shadow-[0_0_35px_rgba(245,158,11,0.2)] border-amber-500/50 from-amber-500/10 via-white/[0.02]' 
              : isSecond 
              ? 'shadow-[0_0_25px_rgba(203,213,225,0.15)] border-slate-300/40 from-slate-300/10 via-white/[0.02]' 
              : 'shadow-[0_0_25px_rgba(217,119,6,0.15)] border-orange-600/40 from-orange-600/10 via-white/[0.02]';

            const crownBadgeColor = isFirst 
              ? 'bg-amber-400 text-amber-950 shadow-amber-400/40' 
              : isSecond 
              ? 'bg-slate-200 text-slate-900 shadow-slate-200/40' 
              : 'bg-amber-700 text-white shadow-amber-700/40';

            return (
              <motion.div
                key={`${activeTab}-${entry.username}-${entry.rank}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative rounded-3xl p-6 bg-gradient-to-b to-black/60 border backdrop-blur-xl flex flex-col justify-between ${glowColor} ${pedestalHeight} transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Podium Rank Pin */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-mono font-bold text-sm shadow-lg ${crownBadgeColor}`}>
                    #{entry.rank}
                  </span>

                  {entry.badge_type && (
                    <GamificationBadge 
                      type={entry.badge_type} 
                      streakCount={'speed_streak' in entry ? entry.speed_streak : undefined}
                      size="sm"
                    />
                  )}
                </div>

                {/* Core User Identity */}
                <div className="my-auto space-y-2 py-4">
                  <div className="flex items-center gap-2">
                    {isFirst && <Crown size={18} className="text-amber-400 animate-bounce" />}
                    {isSecond && <Sparkles size={16} className="text-slate-300" />}
                    {isThird && <Award size={16} className="text-orange-400" />}
                    <h3 className="font-mono font-bold text-lg text-white truncate">
                      {entry.username}
                    </h3>
                  </div>

                  <p className="text-xs font-mono text-slate-400">
                    Reg: <span className="text-slate-300">{entry.reg_no}</span>
                  </p>
                </div>

                {/* Stat Metric Footer */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  {activeTab === 'speed' ? (
                    <>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Flame size={13} className="text-rose-400" /> Speed Streak
                        </span>
                        <span className="font-bold text-rose-300">
                          {'speed_streak' in entry ? `${entry.speed_streak} tasks` : '0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock size={13} className="text-cyan-400" /> Fast Deliveries (&lt;24h)
                        </span>
                        <span className="font-bold text-cyan-300">
                          {'fast_tasks' in entry ? `${entry.fast_tasks}` : '0'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Crown size={13} className="text-amber-400" /> Posted Tasks
                        </span>
                        <span className="font-bold text-amber-300">
                          {'tasks_posted' in entry ? `${entry.tasks_posted}` : '0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Base Rate Unlocked</span>
                        <span className="font-bold text-emerald-400">
                          {'is_gold_patron' in entry && entry.is_gold_patron ? '₹50 / task' : 'Standard ₹60'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ==================== DETAILED RANKING LIST (4+) ==================== */}
        <div className="rounded-3xl border border-white/10 bg-[#111114]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-forge-accent" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                {activeTab === 'speed' ? 'Speed Runners Registry' : 'Patron Creators Tier'}
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Auto-refreshed from verified escrow completions
            </span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {remainingList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-mono text-xs">
                No runners in rank 4+ yet. Be the next to finish and claim your spot!
              </div>
            ) : (
              remainingList.map((entry, idx) => (
                <motion.div
                  key={`${activeTab}-row-${entry.username}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Left: Rank + User + Badge */}
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <span className="font-mono text-xs font-bold text-slate-400 w-6">
                      #{entry.rank}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-white">
                          {entry.username}
                        </span>
                        {entry.badge_type && (
                          <GamificationBadge type={entry.badge_type} size="sm" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {entry.reg_no}
                      </span>
                    </div>
                  </div>

                  {/* Right: Specific stats */}
                  <div className="flex items-center gap-6 text-xs font-mono text-right">
                    {activeTab === 'speed' ? (
                      <>
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase tracking-wider">Streak</p>
                          <p className="font-bold text-rose-400 flex items-center justify-end gap-1">
                            <Flame size={12} />
                            {'speed_streak' in entry ? entry.speed_streak : 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase tracking-wider">Fast (&lt;24h)</p>
                          <p className="font-bold text-cyan-300">
                            {'fast_tasks' in entry ? entry.fast_tasks : 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase tracking-wider">Total Done</p>
                          <p className="font-bold text-slate-200">
                            {'tasks_completed' in entry ? entry.tasks_completed : 0}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase tracking-wider">Tasks Posted</p>
                          <p className="font-bold text-amber-300">
                            {'tasks_posted' in entry ? entry.tasks_posted : 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase tracking-wider">Base Rate</p>
                          <p className={`font-bold ${'is_gold_patron' in entry && entry.is_gold_patron ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {'is_gold_patron' in entry && entry.is_gold_patron ? '₹50' : '₹60'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* ==================== ACTION FOOTER ==================== */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-forge-surface via-[#141418] to-forge-surface border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-mono font-bold text-white text-base">
              Ready to climb the campus ladder?
            </h4>
            <p className="text-xs text-slate-400 font-sans">
              Post high-demand tasks or grab open gigs with instant same-day delivery to earn your tokens.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/create-task"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_18px_rgba(245,158,11,0.3)]"
            >
              Post a Task (Unlock ₹50)
            </Link>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 font-mono font-bold text-xs uppercase tracking-wider transition-all"
            >
              Take Tasks
            </Link>
          </div>
        </div>

      </div>

      {/* ==================== HOW PERKS WORK MODAL ==================== */}
      <AnimatePresence>
        {showRulesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl rounded-3xl bg-[#131317] border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-amber-400" />
                  <h3 className="font-mono font-bold text-base text-white">
                    Campus Gamification & Perks Code
                  </h3>
                </div>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="text-slate-400 hover:text-white font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Crown size={16} />
                    <span>👑 Gold Patron Tier (For Task Givers)</span>
                  </div>
                  <p className="text-slate-300">
                    Standard short tasks on GigHive have a campus floor of ₹60. Once you successfully post and complete <strong>5 tasks</strong>, your profile permanently unlocks the <strong>₹50 Golden Tier</strong> base rate. Save ₹10 on every short gig thereafter!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold">
                    <Zap size={16} />
                    <span>⚡ Speed Streak Ladder (For Task Takers)</span>
                  </div>
                  <p className="text-slate-300">
                    Deliver submitted work within <strong>24 hours</strong> of acceptance to trigger the Speed Streak:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                    <li><strong className="text-slate-200">Every 2nd fast task:</strong> Platform awards you <strong>+1 Commitment Token</strong> back into your account.</li>
                    <li><strong className="text-slate-200">Every 3rd fast task:</strong> Platform awards a <strong>+₹10 cash bonus</strong> automatically topped onto your payout!</li>
                    <li>Failing to deliver within 24 hours resets your active streak to 0.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-forge-accent text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-forge-accent-dim transition-colors"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
