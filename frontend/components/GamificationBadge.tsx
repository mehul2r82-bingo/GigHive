'use client';

import React from 'react';
import { Crown, Zap, Flame, ShieldCheck, Sparkles, Shield } from 'lucide-react';

export type BadgeType =
  | 'MASTER'
  | 'RECRUITER'
  | 'HUSTLER'
  | 'ACTIVE'
  | 'ROOKIE'
  | 'GOLD_PATRON'
  | 'SILVER_PATRON'
  | 'BRONZE_PATRON'
  | 'SPEED_DEMON'
  | 'FAST_RESPONDER'
  | 'VERIFIED_RUNNER'
  | 'STREAK';

interface GamificationBadgeProps {
  type: BadgeType | string;
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
    case 'MASTER':
    case 'GOLD_PATRON':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold tracking-wider uppercase transition-all duration-300 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/10 text-amber-200 border border-amber-400/50 shadow-[0_0_16px_rgba(245,158,11,0.3)] hover:border-amber-300 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
          title="Master Tier: 5 Tokens & Maximum Campus Clout"
        >
          <Crown size={iconSize} className="text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
          {showLabel && <span>Master</span>}
        </span>
      );

    case 'RECRUITER':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-mono font-semibold tracking-wider uppercase transition-all duration-300 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/15 to-purple-500/10 text-purple-200 border border-purple-400/40 shadow-[0_0_14px_rgba(168,85,247,0.25)] hover:border-purple-300 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
          title="Recruiter Tier: 4 Tokens & Network Pioneer"
        >
          <Flame size={iconSize} className="text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
          {showLabel && <span>Recruiter</span>}
        </span>
      );

    case 'HUSTLER':
    case 'SPEED_DEMON':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-mono font-semibold tracking-wider uppercase transition-all duration-300 bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-indigo-500/10 text-indigo-200 border border-indigo-400/40 shadow-[0_0_14px_rgba(99,102,241,0.25)] hover:border-indigo-300 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
          title="Hustler Tier: 3 Tokens & Active Campus Mover"
        >
          <Zap size={iconSize} className="text-indigo-400 fill-indigo-400/40 drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
          {showLabel && <span>Hustler</span>}
        </span>
      );

    case 'ACTIVE':
    case 'FAST_RESPONDER':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium tracking-wide uppercase transition-all duration-300 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/10 text-emerald-200 border border-emerald-400/40 shadow-[0_0_14px_rgba(16,185,129,0.25)] hover:border-emerald-300 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
          title="Active Tier: 2 Tokens"
        >
          <Sparkles size={iconSize} className="text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          {showLabel && <span>Active</span>}
        </span>
      );

    case 'ROOKIE':
    case 'BRONZE_PATRON':
    case 'VERIFIED_RUNNER':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium tracking-wide uppercase transition-all bg-slate-500/10 text-zinc-300 border border-white/15 hover:border-white/25 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
          title="Rookie Tier: 1 Token Starter"
        >
          <Shield size={iconSize} className="text-zinc-400" />
          {showLabel && <span>Rookie</span>}
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
