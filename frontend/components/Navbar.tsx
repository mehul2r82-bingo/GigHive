'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import API from '../services/api';

  const NAV_AUTH = [
  { href: '/', label: 'MARKETPLACE' },
  { href: '/create-task', label: 'CREATE TASK' },
  { href: '/my-tasks', label: 'MY TASKS' },
];

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<number | null>(null);
  const [lockedTokens, setLockedTokens] = useState<number | null>(null);
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
      return;
    }

    const loadTokens = async () => {
      try {
        const res = await API.get('/token-account/');

        setAvailableTokens(res.data.available_tokens);
        setLockedTokens(res.data.locked_tokens);
      } catch (err) {
        console.error('Failed to load token balance:', err);
      }
    };

    loadTokens();

    // Keep the navbar balance current after accept/cancel actions.
    const interval = setInterval(loadTokens, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, pathname]);

  useEffect(() => {
  const handleOutsideClick = (event: MouseEvent) => {
    if (
      tokenRef.current &&
      !tokenRef.current.contains(event.target as Node)
    ) {
      setTokenOpen(false);
    }
  };

  document.addEventListener('mousedown', handleOutsideClick);

  return () => {
    document.removeEventListener('mousedown', handleOutsideClick);
  };
}, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'bg-forge-bg/80 backdrop-blur-xl border-forge-border shadow-[0_1px_0_rgba(255,255,255,0.04)]'
          : 'bg-forge-bg/90 backdrop-blur-sm border-forge-border'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand + Token Balance */}
<div className="flex items-center gap-3">
  <Link href="/" className="flex items-center gap-2 group">
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <rect
        width="30"
        height="30"
        rx="6"
        className="fill-forge-accent"
      />
      <path
        d="M12 5.5 L18 9 V15 L12 18.5 L6 15 V9 Z"
        stroke="white"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="12" r="1.8" fill="white" />
    </svg>

    <span className="font-mono font-bold text-forge-text tracking-wider text-sm group-hover:text-forge-accent transition-colors">
      GigHive
    </span>
  </Link>

  {/* Token Balance */}
  {isAuthenticated && (
    <div ref={tokenRef} className="relative">
      <motion.button
        type="button"
        onClick={() => setTokenOpen((prev) => !prev)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-7 px-8 py-5 rounded-lg hover:bg-white/[0.05] transition-colors"
        aria-label="View commitment token balance"
      >
        {/* Token coin */}
        <motion.span
          animate={{
            y: [0, -1.5, 0],
            rotate: [0, 3, 0],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex items-center justify-center w-6 h-6 rounded-full border border-amber-300/60 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 text-[9px] font-bold text-amber-950 shadow-[0_0_10px_rgba(245,158,11,0.18)]"
        >
          ◈
        </motion.span>

        <motion.span
          key={availableTokens ?? "loading"}
          initial={{ scale: 1.25, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-[11px] font-mono font-semibold text-amber-300"
        >
          {availableTokens ?? "—"}
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {tokenOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-3 w-56 rounded-xl border border-white/10 bg-[#111113]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full border border-amber-300/50 bg-amber-400/10 text-amber-300 text-[10px]">
                  ◈
                </span>

                <div>
                  <p className="text-sm font-semibold text-forge-text">
                    Commitment Tokens
                  </p>
                  <p className="text-[10px] text-forge-sub mt-0.5">
                    Your current token balance
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-forge-sub">
                  Available
                </span>
                <span className="text-sm font-mono font-semibold text-emerald-400">
                  {availableTokens ?? "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-forge-sub">
                  Locked
                </span>
                <span className="text-sm font-mono font-semibold text-amber-300">
                  {lockedTokens ?? "—"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )}
</div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                {NAV_AUTH.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-5 py-3 text-[11px] font-mono tracking-widest transition-colors rounded ${
                      pathname === item.href
                        ? 'text-forge-accent bg-forge-accent/10'
                        : 'text-forge-sub hover:text-forge-text'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="w-px h-4 bg-forge-border mx-2" />
                <span className="text-forge-sub text-[11px] font-mono mr-2">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-[11px] font-mono tracking-widest text-forge-sub hover:text-red-400 transition-colors"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-1.5 text-[11px] font-mono tracking-widest text-forge-sub hover:text-forge-text transition-colors">
                  LOGIN
                </Link>
                <Link href="/signup" className="px-3 py-1.5 text-[11px] font-mono tracking-widest bg-forge-accent text-white hover:bg-forge-accent-dim transition-colors rounded">
                  SIGNUP
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-forge-sub" onClick={() => setOpen(!open)}>
            <div className="space-y-1">
              <span className={`block w-5 h-px bg-current transition-transform ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block w-5 h-px bg-current transition-opacity ${open ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-px bg-current transition-transform ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-forge-border py-3 space-y-1 animate-fade-in">
            {isAuthenticated ? (
              <>
                {NAV_AUTH.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className="block px-2 py-2 text-[11px] font-mono tracking-widest text-forge-sub hover:text-forge-text">
                    {item.label}
                  </Link>
                ))}
                <button onClick={handleLogout} className="block w-full text-left px-2 py-2 text-[11px] font-mono tracking-widest text-red-400">
                  LOGOUT
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="block px-2 py-2 text-[11px] font-mono tracking-widest text-forge-sub">LOGIN</Link>
                <Link href="/register" onClick={() => setOpen(false)} className="block px-2 py-2 text-[11px] font-mono tracking-widest text-forge-accent">SIGNUP</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
