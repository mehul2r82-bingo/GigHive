'use client';

import React from 'react';
import { Crown, Zap, Flame, ShieldCheck, Sparkles } from 'lucide-react';

export type BadgeType =
  | 'GOLD_PATRON'
  | 'SILVER_PATRON'
  | 'BRONZE_PATRON'
  | 'SPEED_DEMON'
  | 'FAST_RESPONDER'
  | 'VERIFIED_RUNNER'
  | 'STREAK';

interface GamificationBadgeProps {
  type: BadgeType;
  streakCount?: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function GamificationBadge({
  type,
  streakCount,
  size = 'sm',
  showLabel = true,
}: GamificationBadgeProps) {
  const isSm = size === 'sm';
  const iconSize = isSm ? 12 : 14;

  switch (type) {
    case 'GOLD_PATRON':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold tracking-wider uppercase transition-all duration-300 bg-amber-500/10 text-amber-300 border border-amber-500/40 shadow-[0_0_14px_rgba(245,158,11,0.2)] hover:border-amber-400 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
          title="Gold Patron: Unlocked ₹50 Short Task Rate!"
        >
          <Crown size={iconSize} className="text-amber-400 animate-pulse" />
          {showLabel && <span>Gold 👑</span>}
        </span>
      );

    case 'SILVER_PATRON':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium tracking-wide uppercase transition-all bg-slate-300/10 text-slate-200 border border-slate-300/30 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
          title="Silver Patron"
        >
          <Sparkles size={iconSize} className="text-slate-300" />
          {showLabel && <span>Silver</span>}
        </span>
      );

    case 'BRONZE_PATRON':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium tracking-wide uppercase transition-all bg-orange-700/10 text-orange-300 border border-orange-600/30 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
          title="Bronze Patron"
        >
          <ShieldCheck size={iconSize} className="text-orange-400" />
          {showLabel && <span>Bronze</span>}
        </span>
      );

    case 'SPEED_DEMON':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold tracking-wider uppercase transition-all duration-300 bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 shadow-[0_0_14px_rgba(6,182,212,0.25)] hover:border-cyan-400 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
          title="Speed Demon: Same-Day Completion Master!"
        >
          <Zap size={iconSize} className="text-cyan-400 fill-cyan-400/30" />
          {showLabel && <span>Speed Demon ⚡</span>}
        </span>
      );

    case 'FAST_RESPONDER':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium tracking-wide uppercase transition-all bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)] ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
          title="Fast Responder"
        >
          <Zap size={iconSize} className="text-emerald-400" />
          {showLabel && <span>Fast</span>}
        </span>
      );

    case 'VERIFIED_RUNNER':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium tracking-wide uppercase transition-all bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
          title="Verified Runner"
        >
          <ShieldCheck size={iconSize} className="text-indigo-400" />
          {showLabel && <span>Runner</span>}
        </span>
      );

    case 'STREAK':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-mono font-bold tracking-tight transition-all bg-rose-500/10 text-rose-300 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)] ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
          title={`${streakCount || 0} Task Speed Streak!`}
        >
          <Flame size={iconSize} className="text-rose-400 fill-rose-500/40" />
          <span>{streakCount || 0}</span>
        </span>
      );

    default:
      return null;
  }
}
