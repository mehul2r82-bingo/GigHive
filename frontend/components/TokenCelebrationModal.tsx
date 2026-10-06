'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Check, Gift, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface TokenCelebrationModalProps {
  isOpen: boolean;
  type: 'TOKEN_2' | 'TOKEN_5';
  onClose: () => void;
}

export default function TokenCelebrationModal({
  isOpen,
  type,
  onClose,
}: TokenCelebrationModalProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen && type === 'TOKEN_5') {
      const t = setTimeout(() => setProgress(100), 300);
      return () => clearTimeout(t);
    } else {
      setProgress(0);
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0D0D12] p-6 sm:p-8 shadow-[0_0_50px_rgba(99,102,241,0.25)] text-center"
        >
          {/* Ambient Glow */}
          <div
            className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 ${
              type === 'TOKEN_5' ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
          />

          {type === 'TOKEN_2' ? (
            /* TOKEN 2 CELEBRATION */
            <>
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-400/40 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent shadow-[0_0_30px_rgba(99,102,241,0.35)]"
              >
                <Sparkles size={36} className="text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-black border-2 border-[#0D0D12]"
                >
                  +1
                </motion.span>
              </motion.div>

              <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
                +1 Token Unlocked!
              </h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                You took action on GigHive. Your commitment token is now credited and active.
              </p>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-6 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Check size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Tier Upgraded: Active 🥈</p>
                    <p className="text-[11px] text-zinc-400">Post or accept simultaneous gigs without getting locked.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-95 cursor-pointer"
              >
                Continue Hustling
              </button>
            </>
          ) : (
            /* TOKEN 5 MASTER CELEBRATION */
            <>
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border border-amber-400/50 bg-gradient-to-br from-amber-500/25 via-yellow-500/10 to-transparent shadow-[0_0_40px_rgba(245,158,11,0.4)]"
              >
                <Crown size={44} className="text-amber-400 drop-shadow-[0_0_14px_rgba(245,158,11,0.8)] animate-pulse" />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-black border-2 border-[#0D0D12]"
                >
                  <Crown size={15} className="text-black fill-black" />
                </motion.span>
              </motion.div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono text-[11px] font-bold tracking-widest uppercase mb-3">
                Ultimate Tier Reached
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                Campus Master
              </h3>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                You reached ₹250 in total campus volume. The 5th Golden Token is yours.
              </p>

              {/* Animated Progress Bar */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-amber-200">Campus Volume Milestone</span>
                  <span className="font-mono font-bold text-emerald-400">₹250 / ₹250 (100%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Master Perks Revealed */}
              <div className="space-y-2.5 mb-6 text-left">
                <p className="text-[11px] uppercase tracking-wider font-mono font-bold text-zinc-400 pl-1">
                  Unlocked Master Perks
                </p>

                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Gift size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Free Homework Pass</p>
                    <p className="text-[11px] text-zinc-400">Post an assignment up to ₹100 — GigHive sponsors the solver.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Zap size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Bounty Booster (+₹50)</p>
                    <p className="text-[11px] text-zinc-400">Earn up to +₹50 bonus cash on your next completed gig payout.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm transition-all duration-200 shadow-xl shadow-amber-500/30 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Claim Master Status</span>
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
