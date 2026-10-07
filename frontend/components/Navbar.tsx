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
import TokenDetailsModal, { NextChallengeInfo } from './TokenDetailsModal';

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
  const [nextChallenge, setNextChallenge] = useState<NextChallengeInfo | null>(null);
  const [todayPosted, setTodayPosted] = useState<boolean>(false);
  const [todayCompleted, setTodayCompleted] = useState<boolean>(false);
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
      setNextChallenge(null);
      setTodayPosted(false);
      setTodayCompleted(false);
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
        setNextChallenge(res.data.next_challenge || null);
        setTodayPosted(Boolean(res.data.today_posted));
        setTodayCompleted(Boolean(res.data.today_completed));
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
                    className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border transition-all text-xs font-semibold ${
                      badgeType === 'MASTER' || (totalTokens !== null && totalTokens >= 5)
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                        : badgeType === 'RECRUITER' || totalTokens === 4
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                        : badgeType === 'HUSTLER' || totalTokens === 3
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                        : badgeType === 'ACTIVE' || totalTokens === 2
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                        : 'bg-zinc-500/10 border-zinc-500/30 text-zinc-300 hover:bg-zinc-500/20'
                    }`}
                    aria-label="View token balance"
                  >
                    <Coins
                      size={13}
                      className={
                        badgeType === 'MASTER' || (totalTokens !== null && totalTokens >= 5)
                          ? 'text-amber-400'
                          : badgeType === 'RECRUITER' || totalTokens === 4
                          ? 'text-purple-400'
                          : badgeType === 'HUSTLER' || totalTokens === 3
                          ? 'text-indigo-400'
                          : badgeType === 'ACTIVE' || totalTokens === 2
                          ? 'text-emerald-400'
                          : 'text-zinc-400'
                      }
                    />
                    <span className="font-mono">{availableTokens ?? '—'}</span>
                    <span className="text-[10px] opacity-70 hidden sm:inline">creds</span>
                  </button>

                  <TokenDetailsModal
                    isOpen={tokenOpen}
                    onClose={() => setTokenOpen(false)}
                    totalTokens={totalTokens ?? 1}
                    availableTokens={availableTokens ?? 0}
                    lockedTokens={lockedTokens ?? 0}
                    badgeType={badgeType || 'ROOKIE'}
                    totalVolume={totalVolume ?? 0}
                    nextChallenge={nextChallenge}
                    todayPosted={todayPosted}
                    todayCompleted={todayCompleted}
                    isLeaderboardView={false}
                  />
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
                    <p className="text-xs text-zinc-400 font-mono">LPU · {totalTokens ?? 1}/5 Creds</p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileProfileOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Token Stats Card: Only Ready and Staked, compact */}
              <div
                onClick={() => {
                  setMobileProfileOpen(false);
                  setTokenOpen(true);
                }}
                className="p-3 bg-black/40 border border-white/5 hover:border-white/15 rounded-xl flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Coins size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Hive Creds</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Click to view challenges</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block leading-none">Ready</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 leading-tight">{availableTokens ?? 0}</span>
                  </div>
                  <div className="text-right px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block leading-none">Staked</span>
                    <span className="text-xs font-mono font-bold text-purple-300 leading-tight">{lockedTokens ?? 0}</span>
                  </div>
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
