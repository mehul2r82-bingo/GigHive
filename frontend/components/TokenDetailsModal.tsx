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
}

const ROADMAP_STEPS = [
  { num: 1, label: 'Rookie', color: 'text-zinc-400 border-zinc-600 bg-zinc-800/40' },
  { num: 2, label: 'Active', color: 'text-emerald-300 border-emerald-500/50 bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
  { num: 3, label: 'Hustler', color: 'text-indigo-300 border-indigo-500/50 bg-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.3)]' },
  { num: 4, label: 'Recruiter', color: 'text-purple-300 border-purple-500/50 bg-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.3)]' },
  { num: 5, label: 'Master', color: 'text-amber-300 border-amber-400/60 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.4)]' },
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
}: TokenDetailsModalProps) {
  if (!isOpen) return null;

  const currentTier = badgeType || 'ROOKIE';
  const targetToken = nextChallenge?.target_token ?? Math.min(5, (totalTokens || 1) + 1);
  const volumeProgress = Math.min(100, Math.round(((totalVolume || 0) / 250) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0E0E13] p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-left"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={15} />
          </button>

          {/* Top Bar: Title & Status */}
          <div className="flex items-center gap-2.5 mb-3 pr-8">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Coins size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Token Pass
                </h3>
                <GamificationBadge type={currentTier} size="sm" />
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                {totalTokens} of 5 Tokens Held
              </p>
            </div>
          </div>

          {/* Mini Balances Row */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border border-white/10 bg-white/[0.02] mb-3.5 text-center font-mono">
            <div>
              <span className="text-[10px] text-zinc-400 block uppercase">Ready</span>
              <span className="text-sm font-extrabold text-emerald-400">{availableTokens}</span>
            </div>
            <div className="border-x border-white/10">
              <span className="text-[10px] text-zinc-400 block uppercase">In Escrow</span>
              <span className="text-sm font-extrabold text-purple-300">{lockedTokens}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block uppercase">Volume</span>
              <span className="text-sm font-extrabold text-amber-300">₹{totalVolume}</span>
            </div>
          </div>

          {/* ₹250 Campus Volume Bar (Highlighted & Clean) */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-3 mb-3.5 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-amber-200 font-bold flex items-center gap-1.5">
                <Crown size={13} className="text-amber-400" />
                Campus Volume Goal
              </span>
              <span className="text-emerald-400 font-extrabold">
                ₹{totalVolume} / ₹250 <span className="text-[10px] text-zinc-400 font-normal">({volumeProgress}%)</span>
              </span>
            </div>
            
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.6)] transition-all duration-700"
                style={{ width: `${volumeProgress}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-0.5">
              <span>Perk 1: Free Homework Pass (₹100)</span>
              <span>Perk 2: +₹50 Bounty Boost</span>
            </div>
          </div>

          {/* Next Challenge Card (Clean, Simple, 0 Clutter) */}
          <div className="rounded-xl border border-indigo-400/35 bg-indigo-500/[0.06] p-3 mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300">
                <Sparkles size={11} className="text-indigo-400" />
                Next Challenge: Token #{targetToken}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {targetToken === 3 ? 'Resets 12 AM' : 'Automatic'}
              </span>
            </div>

            {/* Token 3 Same-Day Challenge */}
            {targetToken === 3 ? (
              <div className="space-y-2">
                <p className="text-xs text-white font-medium leading-snug">
                  Same-Day Double Hustle
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${
                      todayPosted
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.02] text-zinc-400'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${todayPosted ? 'bg-emerald-500 text-black' : 'border border-zinc-600'}`}>
                      {todayPosted && <Check size={10} className="stroke-[3]" />}
                    </div>
                    <span className="truncate">Post any gig</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${
                      todayCompleted
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.02] text-zinc-400'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${todayCompleted ? 'bg-emerald-500 text-black' : 'border border-zinc-600'}`}>
                      {todayCompleted && <Check size={10} className="stroke-[3]" />}
                    </div>
                    <span className="truncate">Solve a gig</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Posted gig just needs to be published; accepted gig must be completed today.
                </p>
              </div>
            ) : targetToken === 5 ? (
              <p className="text-xs text-zinc-300">
                Reach ₹250 campus volume to unlock the 5th Golden Token and both Master perks.
              </p>
            ) : targetToken === 4 ? (
              <p className="text-xs text-zinc-300">
                Refer a classmate who posts their first gig on GigHive.
              </p>
            ) : totalTokens >= 5 ? (
              <p className="text-xs text-amber-200 font-semibold">
                Master Status Achieved! All elite perks are active on your account.
              </p>
            ) : (
              <p className="text-xs text-zinc-300">
                Post your first gig or accept an open task on campus to unlock Token #2.
              </p>
            )}
          </div>

          {/* Horizontal 5-Step Roadmap Tracker (Compact 32px height) */}
          <div className="pt-2 border-t border-white/10 mb-4">
            <div className="flex items-center justify-between text-[10px] font-mono mb-2 text-zinc-400">
              <span>Token Roadmap</span>
              <span className="text-white font-bold">{totalTokens}/5 Complete</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {ROADMAP_STEPS.map((step) => {
                const isUnlocked = totalTokens >= step.num;
                return (
                  <div
                    key={step.num}
                    className={`p-1.5 rounded-xl border text-center transition-all ${
                      isUnlocked
                        ? step.color
                        : 'border-white/5 bg-white/[0.02] text-zinc-600'
                    }`}
                  >
                    <div className="text-[11px] font-mono font-bold leading-none mb-0.5">
                      #{step.num}
                    </div>
                    <div className="text-[9px] font-mono truncate leading-none">
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
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs font-mono tracking-wider transition-all cursor-pointer text-center"
          >
            CLOSE
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
