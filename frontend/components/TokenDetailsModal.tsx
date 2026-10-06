'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, 
  X, 
  Check, 
  Zap, 
  Flame, 
  Crown, 
  Shield, 
  Sparkles, 
  Calendar, 
  ArrowRight,
  Gift
} from 'lucide-react';
import Link from 'next/link';
import GamificationBadge, { BadgeType } from './GamificationBadge';

export interface NextChallengeInfo {
  target_token: number;
  tier: string;
  title: string;
  note: string;
  reward: string;
  action_url?: string;
  action_label?: string;
  today_posted?: boolean;
  today_completed?: boolean;
}

interface TokenDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalTokens: number;
  availableTokens: number;
  lockedTokens: number;
  badgeType: string;
  totalVolume: number;
  nextChallenge?: NextChallengeInfo | null;
  todayPosted?: boolean;
  todayCompleted?: boolean;
}

export default function TokenDetailsModal({
  isOpen,
  onClose,
  totalTokens,
  availableTokens,
  lockedTokens,
  badgeType,
  totalVolume,
  nextChallenge,
  todayPosted = false,
  todayCompleted = false,
}: TokenDetailsModalProps) {
  if (!isOpen) return null;

  const currentTier = badgeType || 'ROOKIE';
  const targetToken = nextChallenge?.target_token ?? Math.min(5, (totalTokens || 1) + 1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0E0E13] p-5 sm:p-7 shadow-[0_0_60px_rgba(99,102,241,0.2)] text-left"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3.5 mb-5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Coins size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Commitment Tokens
                </h2>
                <GamificationBadge type={currentTier} size="sm" />
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                {totalTokens} of 5 Tokens Held · Campus Clout
              </p>
            </div>
          </div>

          {/* Token Stats (Available vs Locked) */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04]">
              <span className="text-[11px] font-mono text-zinc-400 block mb-0.5">Available Balance</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-extrabold text-emerald-400">{availableTokens}</span>
                <span className="text-xs text-zinc-500 font-mono">ready</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">Available to bid or post</p>
            </div>

            <div className="p-3.5 rounded-2xl border border-purple-500/25 bg-purple-500/[0.04]">
              <span className="text-[11px] font-mono text-zinc-400 block mb-0.5">Locked in Escrow</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-extrabold text-purple-300">{lockedTokens}</span>
                <span className="text-xs text-zinc-500 font-mono">active</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">Guarantees ongoing tasks</p>
            </div>
          </div>

          {/* ⭐ PROMINENT NOTE: NEXT TOKEN CHALLENGE ⭐ */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-400/40 bg-gradient-to-br from-indigo-500/15 via-purple-500/5 to-transparent p-4 sm:p-5 mb-5 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            {/* Header / Pill */}
            <div className="flex items-center justify-between mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300">
                <Sparkles size={11} className="text-indigo-400" />
                Next Token Challenge
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                Target: Token #{targetToken}
              </span>
            </div>

            {/* Title & Description */}
            <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
              {nextChallenge?.title || `Unlock Token #${targetToken}`}
            </h3>

            <p className="text-xs text-zinc-300 leading-relaxed mb-3">
              {nextChallenge?.note ||
                (targetToken === 3
                  ? "Post a gig AND complete a gig on the SAME DAY to unlock Token #3."
                  : "Complete your campus gig milestones to unlock your next token.")}
            </p>

            {/* SPECIAL SAME-DAY CHALLENGE BOX (FOR TOKEN 3) */}
            {targetToken === 3 && (
              <div className="rounded-xl border border-indigo-500/30 bg-black/40 p-3 mb-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                    <Calendar size={13} className="text-indigo-400" />
                    Same-Day Tracker
                  </span>
                  <span className="text-[10px] text-zinc-400">Resets daily at 12:00 AM</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      todayPosted
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.02] text-zinc-400'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        todayPosted ? 'bg-emerald-500 text-black' : 'border border-zinc-600'
                      }`}
                    >
                      {todayPosted && <Check size={11} className="stroke-[3]" />}
                    </div>
                    <span className="text-[11px]">1. Post a Gig</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      todayCompleted
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.02] text-zinc-400'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        todayCompleted ? 'bg-emerald-500 text-black' : 'border border-zinc-600'
                      }`}
                    >
                      {todayCompleted && <Check size={11} className="stroke-[3]" />}
                    </div>
                    <span className="text-[11px]">2. Solve a Gig</span>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-400 leading-tight">
                  {todayPosted && todayCompleted
                    ? "Both complete today! Your 3rd token is synced."
                    : todayPosted
                    ? "You posted today! Now complete 1 gig before midnight to unlock Token #3."
                    : todayCompleted
                    ? "You solved a gig today! Now post 1 gig before midnight to unlock Token #3."
                    : "Both actions must be completed on the same calendar day."}
                </p>
              </div>
            )}

            {/* SPECIAL VOLUME BAR (FOR TOKEN 5) */}
            {targetToken === 5 && (
              <div className="rounded-xl border border-amber-500/30 bg-black/40 p-3 mb-3 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-amber-300 font-bold">Campus Volume Progress</span>
                  <span className="text-emerald-400 font-bold">₹{totalVolume} / ₹250</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((totalVolume / 250) * 100))}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  Unlocks 2 Master Perks: Free Homework Pass (₹100) & Bounty Booster (+₹50 cash).
                </p>
              </div>
            )}

            {/* Reward Note & CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="text-[11px] font-mono text-zinc-300">
                <span className="text-zinc-500 block text-[10px] uppercase">Reward:</span>
                <span className="text-indigo-300 font-bold">{nextChallenge?.reward || '+1 Commitment Token'}</span>
              </div>

              {nextChallenge?.action_url && (
                <Link
                  href={nextChallenge.action_url}
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>{nextChallenge.action_label || 'Start Challenge'}</span>
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>

          {/* 5-Token Roadmap Overview */}
          <div className="space-y-2 mb-5">
            <p className="text-[11px] uppercase tracking-wider font-mono font-bold text-zinc-400">
              5-Token Roadmap
            </p>

            <div className="space-y-1.5 text-xs font-mono">
              {/* Token 1 */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${totalTokens >= 1 ? 'border-white/10 bg-white/[0.03] text-white' : 'border-white/5 text-zinc-600'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${totalTokens >= 1 ? 'bg-zinc-400 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                    1
                  </div>
                  <div>
                    <p className="font-semibold">Rookie Starter</p>
                    <p className="text-[10px] text-zinc-500">Base commitment token upon verification</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold ${totalTokens >= 1 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                  {totalTokens >= 1 ? 'Unlocked' : 'Locked'}
                </span>
              </div>

              {/* Token 2 */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${totalTokens >= 2 ? 'border-slate-300/30 bg-slate-400/[0.05] text-slate-200' : 'border-white/5 text-zinc-600'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${totalTokens >= 2 ? 'bg-slate-300 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                    2
                  </div>
                  <div>
                    <p className="font-semibold">Active Mover</p>
                    <p className="text-[10px] text-zinc-500">Post 1st gig OR accept 1st gig</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold ${totalTokens >= 2 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                  {totalTokens >= 2 ? 'Unlocked' : '1st Action'}
                </span>
              </div>

              {/* Token 3 */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${totalTokens >= 3 ? 'border-indigo-400/40 bg-indigo-500/[0.08] text-indigo-200' : 'border-white/5 text-zinc-600'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${totalTokens >= 3 ? 'bg-indigo-400 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                    3
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-1.5">
                      Hustler Dual
                      <Zap size={11} className={totalTokens >= 3 ? 'text-indigo-400' : 'text-zinc-600'} />
                    </p>
                    <p className="text-[10px] text-zinc-500">Post & Complete a gig on the SAME DAY</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold ${totalTokens >= 3 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                  {totalTokens >= 3 ? 'Unlocked' : 'Same-Day'}
                </span>
              </div>

              {/* Token 4 */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${totalTokens >= 4 ? 'border-purple-400/40 bg-purple-500/[0.08] text-purple-200' : 'border-white/5 text-zinc-600'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${totalTokens >= 4 ? 'bg-purple-400 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                    4
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-1.5">
                      Campus Recruiter
                      <Flame size={11} className={totalTokens >= 4 ? 'text-purple-400' : 'text-zinc-600'} />
                    </p>
                    <p className="text-[10px] text-zinc-500">Refer a classmate who posts a gig</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold ${totalTokens >= 4 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                  {totalTokens >= 4 ? 'Unlocked' : 'Referral'}
                </span>
              </div>

              {/* Token 5 */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${totalTokens >= 5 ? 'border-amber-400/50 bg-amber-500/[0.1] text-amber-200' : 'border-white/5 text-zinc-600'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${totalTokens >= 5 ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                    5
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-1.5">
                      Campus Master
                      <Crown size={11} className={totalTokens >= 5 ? 'text-amber-400' : 'text-zinc-600'} />
                    </p>
                    <p className="text-[10px] text-zinc-500">₹250 campus volume · Free Homework Pass + Booster</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold ${totalTokens >= 5 ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {totalTokens >= 5 ? 'Master Tier' : '₹250 Vol'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs font-mono tracking-wider transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
