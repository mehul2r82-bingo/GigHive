'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, 
  X, 
  Check, 
  Crown, 
  Sparkles, 
  ArrowRight,
  Flame,
  Zap,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import GamificationBadge from './GamificationBadge';

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
  isLeaderboardView?: boolean;
  username?: string;
}

const ROADMAP_STEPS = [
  { num: 1, label: 'Rookie', color: 'text-zinc-200 border-zinc-500/70 bg-zinc-800/80 font-bold' },
  { num: 2, label: 'Active', color: 'text-emerald-300 border-emerald-400/70 bg-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.35)] font-bold' },
  { num: 3, label: 'Hustler', color: 'text-indigo-300 border-indigo-400/70 bg-indigo-500/25 shadow-[0_0_10px_rgba(99,102,241,0.35)] font-bold' },
  { num: 4, label: 'Recruiter', color: 'text-purple-300 border-purple-400/70 bg-purple-500/25 shadow-[0_0_10px_rgba(168,85,247,0.35)] font-bold' },
  { num: 5, label: 'Master', color: 'text-amber-300 border-amber-400/80 bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.45)] font-bold' },
];

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
  isLeaderboardView = false,
  username,
}: TokenDetailsModalProps) {
  if (!isOpen) return null;

  const currentTier = badgeType || 'ROOKIE';
  const targetToken = nextChallenge?.target_token ?? Math.min(5, (totalTokens || 1) + 1);
  const volumeProgress = Math.min(100, Math.round(((totalVolume || 0) / 250) * 100));

  const getTierIconStyles = (tier: string, tokens: number) => {
    if (tier === 'MASTER' || tokens >= 5) {
      return 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
    }
    if (tier === 'RECRUITER' || tokens === 4) {
      return 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
    }
    if (tier === 'HUSTLER' || tokens === 3) {
      return 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]';
    }
    if (tier === 'ACTIVE' || tokens === 2) {
      return 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    }
    return 'bg-zinc-800 border-zinc-600 text-zinc-300';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 340 }}
          className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[#0E0E13] p-4 shadow-[0_0_50px_rgba(0,0,0,0.85)] text-left"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={14} className="stroke-[2.5]" />
          </button>

          {/* Top Bar: Title & Status */}
          <div className="flex items-center gap-2 mb-2.5 pr-7">
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${getTierIconStyles(currentTier, totalTokens)}`}>
              <Coins size={15} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-white tracking-tight">
                  {username ? `@${username}'s Creds` : 'Hive Creds'}
                </h3>
                <GamificationBadge type={currentTier} size="sm" />
              </div>
              <p className="text-[11px] font-bold text-zinc-300">
                {totalTokens} of 5 Hive Creds Held
              </p>
            </div>
          </div>

          {/* Mini Balances Row: Shown ONLY in user profile/account, REMOVED from leaderboard! Shows only Ready and Staked */}
          {!isLeaderboardView && (
            <div className="grid grid-cols-2 gap-2 py-1.5 px-2 rounded-xl border border-white/10 bg-white/[0.03] mb-2.5 text-center">
              <div>
                <span className="text-[9px] text-zinc-400 block uppercase font-bold tracking-wider leading-none mb-0.5">Ready</span>
                <span className="text-xs font-black text-emerald-400 leading-none">{availableTokens}</span>
              </div>
              <div className="border-l border-white/10">
                <span className="text-[9px] text-zinc-400 block uppercase font-bold tracking-wider leading-none mb-0.5">Staked</span>
                <span className="text-xs font-black text-purple-300 leading-none">{lockedTokens}</span>
              </div>
            </div>
          )}

          {/* ₹250 Campus Volume Bar: REMOVED from leaderboard! Only shown in homepage token account AFTER completing 4th token (totalTokens >= 4) */}
          {!isLeaderboardView && totalTokens >= 4 && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/[0.05] p-2.5 mb-2.5 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-200 font-extrabold flex items-center gap-1.5">
                  <Crown size={12} className="text-amber-400" />
                  Campus Volume Goal
                </span>
                <span className="text-emerald-400 font-black">
                  ₹{totalVolume} / ₹250 <span className="text-[10px] text-zinc-300 font-bold">({volumeProgress}%)</span>
                </span>
              </div>
              
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.7)] transition-all duration-700"
                  style={{ width: `${volumeProgress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-zinc-300 font-semibold pt-0.5">
                <span>Perk 1: Free Homework Pass (₹100)</span>
                <span>Perk 2: +₹50 Bounty Boost</span>
              </div>
            </div>
          )}

          {/* Next Challenge Card (Clean, Bold, Compact) */}
          <div className="rounded-xl border border-indigo-400/40 bg-indigo-500/[0.08] p-2.5 mb-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                <Sparkles size={11} className="text-indigo-400" />
                Next Challenge: Cred #{targetToken}
              </span>
              <span className="text-[9px] font-bold text-zinc-200 bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10">
                {targetToken === 3 ? 'Resets 12 AM' : 'Automatic'}
              </span>
            </div>

            {/* Token 3 Same-Day Challenge */}
            {targetToken === 3 ? (
              <div className="space-y-1.5">
                <p className="text-xs text-white font-bold tracking-tight">
                  Same-Day Double Hustle
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                  <div
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all ${
                      todayPosted
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                        : 'border-white/15 bg-white/[0.04] text-zinc-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${todayPosted ? 'bg-emerald-500 text-black font-black' : 'border border-zinc-400'}`}>
                      {todayPosted && <Check size={10} className="stroke-[3.5]" />}
                    </div>
                    <span className="truncate">Post any gig</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all ${
                      todayCompleted
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                        : 'border-white/15 bg-white/[0.04] text-zinc-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${todayCompleted ? 'bg-emerald-500 text-black font-black' : 'border border-zinc-400'}`}>
                      {todayCompleted && <Check size={10} className="stroke-[3.5]" />}
                    </div>
                    <span className="truncate">Accept & complete gig</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-300 font-semibold leading-snug">
                  Posted gig just needs to be published; accepted gig must be completed today.
                </p>
              </div>
            ) : targetToken === 5 ? (
              <p className="text-xs text-zinc-200 font-semibold">
                Reach ₹250 campus volume to unlock the 5th Golden Cred and both Master perks.
              </p>
            ) : targetToken === 4 ? (
              <p className="text-xs text-zinc-200 font-semibold">
                Refer a classmate who posts their first gig on GigHive to unlock Cred #4.
              </p>
            ) : totalTokens >= 5 ? (
              <p className="text-xs text-amber-300 font-bold">
                Master Status Achieved! All elite perks are active on your account.
              </p>
            ) : (
              <p className="text-xs text-zinc-200 font-semibold">
                Post your first gig or accept an open task on campus to unlock Cred #2.
              </p>
            )}
          </div>

          {/* Horizontal 5-Step Roadmap Tracker (Compact & High Contrast) */}
          <div className="pt-2 border-t border-white/10 mb-2.5">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider mb-1.5 text-zinc-300">
              <span>Cred Roadmap</span>
              <span className="text-white font-black">{totalTokens}/5 Complete</span>
            </div>

            <div className="grid grid-cols-5 gap-1">
              {ROADMAP_STEPS.map((step) => {
                const isUnlocked = totalTokens >= step.num;
                return (
                  <div
                    key={step.num}
                    className={`py-1 px-0.5 rounded-lg border text-center transition-all ${
                      isUnlocked
                        ? step.color
                        : 'border-white/10 bg-white/[0.03] text-zinc-400 font-semibold'
                    }`}
                  >
                    <div className="text-[10px] font-black leading-none mb-0.5">
                      #{step.num}
                    </div>
                    <div className="text-[9px] font-bold truncate leading-none">
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs tracking-wider transition-all cursor-pointer text-center active:scale-95"
          >
            CLOSE
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
