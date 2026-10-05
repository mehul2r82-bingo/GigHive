'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if dismissed previously in session
    if (sessionStorage.getItem('pwa_prompt_dismissed')) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 bg-[#121217] border border-indigo-500/30 p-3.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg shrink-0">
            📱
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">Install GigHive App</p>
            <p className="text-[11px] text-zinc-400 truncate">Add to home screen for instant alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
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
    </AnimatePresence>
  );
}
