'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Compass, 
  Trophy, 
  Plus, 
  ClipboardList, 
  User, 
  LogOut, 
  Coins, 
  X,
  ChevronRight,
  ShieldCheck,
  Zap,
  Crown
} from 'lucide-react';
import API from '../services/api';
import NotificationBell from './NotificationBell';
import GamificationBadge from './GamificationBadge';

const NAV_DESKTOP = [
  { href: '/', label: 'MARKETPLACE' },
  { href: '/leaderboard', label: 'LEADERBOARD' },
  { href: '/create-task', label: 'CREATE TASK' },
  { href: '/my-tasks', label: 'MY TASKS' },
];

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<number | null>(null);
  const [lockedTokens, setLockedTokens] = useState<number | null>(null);
  const [totalTokens, setTotalTokens] = useState<number | null>(null);
  const [badgeType, setBadgeType] = useState<string | null>(null);
  const [totalVolume, setTotalVolume] = useState<number | null>(null);
  const tokenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setAvailableTokens(null);
      setLockedTokens(null);
      setTotalTokens(null);
      setBadgeType(null);
      setTotalVolume(null);
      return;
    }

    const loadTokens = async () => {
      try {
        const res = await API.get('/token-account/');
        setAvailableTokens(res.data.available_tokens);
        setLockedTokens(res.data.locked_tokens);
        setTotalTokens(res.data.total_tokens);
        setBadgeType(res.data.badge_type || 'ROOKIE');
        setTotalVolume(res.data.total_volume || 0);
      } catch (err) {
        console.error('Failed to load token balance:', err);
      }
    };

    loadTokens();
    const interval = setInterval(loadTokens, 6000);
    return () => clearInterval(interval);
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (tokenRef.current && !tokenRef.current.contains(event.target as Node)) {
        setTokenOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    logout();
    setMobileProfileOpen(false);
    router.push('/');
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* TOP NAVBAR (DESKTOP & MOBILE HEADER) */}
      {/* ========================================================================= */}
      <nav
        className={`sticky top-0 z-40 border-b transition-all duration-200 ${
          scrolled
            ? 'bg-[#09090B]/90 backdrop-blur-xl border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
            : 'bg-[#09090B]/95 backdrop-blur-md border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Left: Brand + Token Balance */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-white/40 transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 4 L19 8 V16 L12 20 L5 16 V8 Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="2.5" fill="white" />
                  </svg>
                </div>
                <span className="font-mono font-bold text-white tracking-wider text-base sm:text-lg group-hover:text-zinc-300 transition-colors">
                  GigHive
                </span>
              </Link>

              {/* Token Balance Pill */}
              {isAuthenticated && (
                <div ref={tokenRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setTokenOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-all text-xs font-semibold"
                    aria-label="View token balance"
                  >
                    <span className="text-purple-400 font-bold">◈</span>
                    <span className="font-mono">{availableTokens ?? '—'}</span>
                    <span className="text-[10px] text-purple-400/70 hidden sm:inline">tokens</span>
                  </button>

                  <AnimatePresence>
                    {tokenOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-white/10 bg-[#121217]/95 backdrop-blur-xl shadow-2xl p-4 z-50 text-left"
                      >
                        {/* Header with Badge */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <Coins size={16} className="text-indigo-400" />
                            <div>
                              <p className="text-xs font-bold text-white">Commitment Tokens</p>
                              <p className="text-[10px] text-zinc-400 font-mono">{totalTokens ?? 1}/5 Tokens Claimed</p>
                            </div>
                          </div>
                          {badgeType && <GamificationBadge type={badgeType} size="sm" />}
                        </div>

                        {/* Available vs Locked */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
                            <span className="text-[10px] text-zinc-400 font-mono block">Available</span>
                            <span className="text-emerald-400 font-bold font-mono text-sm">{availableTokens ?? 0}</span>
                          </div>
                          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
                            <span className="text-[10px] text-zinc-400 font-mono block">Locked</span>
                            <span className="text-purple-300 font-bold font-mono text-sm">{lockedTokens ?? 0}</span>
                          </div>
                        </div>

                        {/* Progression Roadmap */}
                        <div className="space-y-1 mb-3 text-[11px] font-mono border-t border-white/5 pt-2.5">
                          <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider font-sans mb-1.5">
                            5-Token Roadmap
                          </p>
                          <div className={`flex items-center justify-between px-2 py-1 rounded-lg ${(totalTokens ?? 1) >= 1 ? 'bg-white/[0.05] text-zinc-200' : 'text-zinc-600'}`}>
                            <span className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${(totalTokens ?? 1) >= 1 ? 'bg-zinc-400' : 'bg-zinc-700'}`} />
                              1. Rookie Starter
                            </span>
                            <span className="text-[10px]">Unlocked</span>
                          </div>
                          <div className={`flex items-center justify-between px-2 py-1 rounded-lg ${(totalTokens ?? 1) >= 2 ? 'bg-white/[0.05] text-slate-200' : 'text-zinc-600'}`}>
                            <span className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${(totalTokens ?? 1) >= 2 ? 'bg-slate-400' : 'bg-zinc-700'}`} />
                              2. Active Mover
                            </span>
                            <span className="text-[10px]">1st Action</span>
                          </div>
                          <div className={`flex items-center justify-between px-2 py-1 rounded-lg ${(totalTokens ?? 1) >= 3 ? 'bg-indigo-950/40 text-indigo-300' : 'text-zinc-600'}`}>
                            <span className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${(totalTokens ?? 1) >= 3 ? 'bg-indigo-400' : 'bg-zinc-700'}`} />
                              3. Hustler Dual
                            </span>
                            <span className="text-[10px]">Post + Solve</span>
                          </div>
                          <div className={`flex items-center justify-between px-2 py-1 rounded-lg ${(totalTokens ?? 1) >= 4 ? 'bg-purple-950/40 text-purple-300' : 'text-zinc-600'}`}>
                            <span className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${(totalTokens ?? 1) >= 4 ? 'bg-purple-400' : 'bg-zinc-700'}`} />
                              4. Recruiter
                            </span>
                            <span className="text-[10px]">Referral</span>
                          </div>
                          <div className={`flex items-center justify-between px-2 py-1 rounded-lg ${(totalTokens ?? 1) >= 5 ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30' : 'text-zinc-600'}`}>
                            <span className="flex items-center gap-1.5">
                              <Crown size={11} className={(totalTokens ?? 1) >= 5 ? 'text-amber-400' : 'text-zinc-700'} />
                              5. Campus Master
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold">₹250 Vol</span>
                          </div>
                        </div>

                        {/* Campus Volume Progress towards ₹250 */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 mb-2.5">
                          <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                            <span className="text-zinc-400">Campus Volume</span>
                            <span className="text-amber-400 font-bold">₹{totalVolume ?? 0} / ₹250</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.round(((totalVolume ?? 0) / 250) * 100))}%` }}
                            />
                          </div>
                        </div>

                        <Link
                          href="/leaderboard"
                          onClick={() => setTokenOpen(false)}
                          className="flex items-center justify-between w-full py-1.5 px-2 rounded-lg text-[11px] font-semibold text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        >
                          <span>View Campus Leaderboard</span>
                          <ChevronRight size={13} />
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Right: Desktop Links */}
            <div className="hidden md:flex items-center gap-1">
              {isAuthenticated ? (
                <>
                  {NAV_DESKTOP.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-1.5 text-xs font-mono tracking-wider transition-colors rounded-lg ${
                        pathname === item.href
                          ? 'text-indigo-400 bg-indigo-500/10 font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <NotificationBell />
                  <div className="w-px h-4 bg-white/10 mx-2" />
                  <span className="text-zinc-400 text-xs font-mono mr-2">
                    {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs font-mono tracking-wider text-zinc-400 hover:text-rose-400 transition-colors"
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/leaderboard"
                    className="px-3 py-1.5 text-xs font-mono tracking-wider text-zinc-400 hover:text-white transition-colors"
                  >
                    LEADERBOARD
                  </Link>
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-xs font-mono tracking-wider text-zinc-400 hover:text-white transition-colors"
                  >
                    LOGIN
                  </Link>
                  <Link
                    href="/signup"
                    className="px-3.5 py-1.5 text-xs font-mono tracking-wider bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors rounded-xl shadow-lg shadow-indigo-500/20"
                  >
                    SIGN UP
                  </Link>
                </>
              )}
            </div>

            {/* Right: Mobile Header Quick Actions */}
            <div className="flex items-center gap-2 md:hidden">
              <NotificationBell />
              {isAuthenticated ? (
                <button
                  onClick={() => setMobileProfileOpen(true)}
                  className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs uppercase"
                  aria-label="User profile"
                >
                  {user?.name ? user.name[0] : 'U'}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
                >
                  Login
                </Link>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (FIXED AT BOTTOM FOR PHONES) */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c11]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 safe-bottom shadow-[0_-4px_25px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-around max-w-md mx-auto">

          {/* 1. Marketplace */}
          <Link
            href="/"
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              pathname === '/'
                ? 'text-indigo-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Compass size={20} className={pathname === '/' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[10px] mt-1">Gigs</span>
          </Link>

          {/* 2. Leaderboard */}
          <Link
            href="/leaderboard"
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              pathname === '/leaderboard'
                ? 'text-indigo-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Trophy size={20} className={pathname === '/leaderboard' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[10px] mt-1">Leaders</span>
          </Link>

          {/* 3. Center Action: Post Gig (+) */}
          <Link
            href="/create-task"
            className="flex flex-col items-center -mt-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(99,102,241,0.4)] group-active:scale-95 transition-transform border-2 border-[#09090B]">
              <Plus size={24} className="stroke-[3]" />
            </div>
            <span className="text-[10px] font-bold text-indigo-400 mt-0.5">Post Gig</span>
          </Link>

          {/* 4. My Tasks */}
          <Link
            href={isAuthenticated ? '/my-tasks' : '/login'}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              pathname === '/my-tasks'
                ? 'text-indigo-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ClipboardList size={20} className={pathname === '/my-tasks' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[10px] mt-1">My Tasks</span>
          </Link>

          {/* 5. Profile / Account */}
          {isAuthenticated ? (
            <button
              onClick={() => setMobileProfileOpen(true)}
              className="flex flex-col items-center py-1 px-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 transition-all"
            >
              <User size={20} className="stroke-2" />
              <span className="text-[10px] mt-1">Profile</span>
            </button>
          ) : (
            <Link
              href="/login"
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                pathname === '/login'
                  ? 'text-indigo-400 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <User size={20} className={pathname === '/login' ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-[10px] mt-1">Login</span>
            </Link>
          )}

        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE PROFILE / ACCOUNT SLIDE-UP SHEET */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {mobileProfileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileProfileOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative bg-[#121217] border-t border-white/10 rounded-t-3xl p-5 space-y-4 shadow-2xl safe-bottom"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-base uppercase">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{user?.name || 'Student'}</p>
                      {badgeType && <GamificationBadge type={badgeType} size="sm" />}
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">LPU · {totalTokens ?? 1}/5 Tokens</p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileProfileOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Token Stats Card */}
              <div className="p-3.5 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Coins size={18} className="text-purple-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Commitment Tokens</p>
                    <p className="text-[11px] text-zinc-400">Protects active claimed tasks</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-emerald-400">{availableTokens ?? '0'} Ready</p>
                  <p className="text-[10px] text-zinc-500 font-mono">{lockedTokens ?? '0'} Locked</p>
                </div>
              </div>

              {/* Navigation Links inside Sheet */}
              <div className="divide-y divide-white/5">
                <Link
                  href="/my-tasks"
                  onClick={() => setMobileProfileOpen(false)}
                  className="flex items-center justify-between py-3 text-sm text-zinc-200 hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <ClipboardList size={18} className="text-indigo-400" />
                    My Active Gigs & History
                  </span>
                  <ChevronRight size={16} className="text-zinc-500" />
                </Link>

                <Link
                  href="/create-task"
                  onClick={() => setMobileProfileOpen(false)}
                  className="flex items-center justify-between py-3 text-sm text-zinc-200 hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <Plus size={18} className="text-indigo-400" />
                    Post a New Gig
                  </span>
                  <ChevronRight size={16} className="text-zinc-500" />
                </Link>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut size={16} />
                LOG OUT OF GIGHIVE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
