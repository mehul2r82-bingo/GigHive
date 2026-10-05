'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // If already installed or dismissed this session, don't show
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('pwa_prompt_dismissed')) return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Detect iOS (iPhone/iPad/iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOSDevice) {
      // Delay slightly so it doesn't flash immediately on initial page paint
      const timer = setTimeout(() => {
        setShowIOSPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Android & Chrome beforeinstallprompt handler
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleAndroidInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowAndroidPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowAndroidPrompt(false);
    setShowIOSPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {/* ANDROID / DESKTOP 1-TAP INSTALL */}
      {showAndroidPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-18 left-3 right-3 sm:bottom-5 sm:left-auto sm:right-6 sm:w-84 z-50 bg-[#121217]/95 backdrop-blur-md border border-indigo-500/30 p-3.5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)] flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
              <Image
                src="/gighive_icon_192.png"
                alt="GigHive"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Install GigHive App</p>
              <p className="text-[11px] text-zinc-400 truncate">1-tap home screen access & alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAndroidInstallClick}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 text-xs transition-colors"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      {/* iOS SMART SAFARI INSTALL SHEET */}
      {showIOSPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-18 left-3 right-3 sm:bottom-5 sm:left-auto sm:right-6 sm:w-96 z-50 bg-[#121217]/95 backdrop-blur-xl border border-indigo-500/40 p-4 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                <Image
                  src="/gighive_icon_192.png"
                  alt="GigHive"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  Install GigHive on iPhone
                </p>
                <p className="text-[11px] text-zinc-400">Add to Home Screen for instant alerts</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white text-xs transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 flex flex-col gap-2.5 text-xs text-zinc-300">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                1
              </span>
              <span>
                Tap the <strong className="text-white">Share</strong> button in Safari's toolbar{' '}
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-zinc-800 text-blue-400 font-bold border border-zinc-700">
                  <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                2
              </span>
              <span>
                Scroll down and select <strong className="text-white">Add to Home Screen</strong>{' '}
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold border border-zinc-700">
                  <span className="text-indigo-400 mr-1">➕</span> Add
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
            <span>✨ No App Store download needed • 0 MB</span>
            <button
              onClick={handleDismiss}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Got it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
