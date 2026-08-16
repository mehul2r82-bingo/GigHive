"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HeroText from "@/components/ui/hero-shutter-text";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";


type Band = "short" | "medium" | "long";
type Mode = "online" | "offline" | "hybrid";

interface Task {
  id: number;
  title: string;
  band: Band;
  mode: Mode;
  price: number;
  deadline: string;
  details?: string;
  state?: string;

}


const BAND = {
  short: { label: "Short", color: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/20" },
  medium: { label: "Medium", color: "text-amber-300 bg-amber-500/10 ring-amber-500/20" },
  long: { label: "Long", color: "text-red-300 bg-red-500/10 ring-red-500/20" },
};

const MODE = {
  online: { label: "Online", icon: "🌐", color: "text-blue-300 bg-blue-500/10 ring-blue-500/20" },
  offline: { label: "Offline", icon: "📍", color: "text-zinc-300 bg-zinc-500/10 ring-zinc-500/20" },
  hybrid: { label: "Hybrid", icon: "🔀", color: "text-violet-300 bg-violet-500/10 ring-violet-500/20" },
};

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

function formatDeadline(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return date;
}

export default function MarketplacePage() {
  const { isAuthenticated } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    API.get("/tasks/")
      .then((res) => setTasks(res.data))
      .catch(() => setError("Failed to load tasks"))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);
 
const [showIntro, setShowIntro] = useState(true);

useEffect(() => {
  if (typeof window === "undefined") return;

  if (sessionStorage.getItem("gh-intro") === "done") {
    setShowIntro(false);
    return;
  }

  const timer = setTimeout(() => {
    sessionStorage.setItem("gh-intro", "done");
    setShowIntro(false);
  }, 2500);

  return () => clearTimeout(timer);
}, []);
  if (showIntro) {
    return <HeroText />;
}

return (
  <main className="min-h-screen bg-[#09090B] text-white">

      {/* NAV — intentionally left empty. Mount your existing navbar component here, e.g. <Navbar />.
          For the scroll-blur + logo requests, see the snippet provided alongside this file — 
          those changes belong in that navbar component, not here. */}

      {/* HERO */}
      <section className="max-w-3xl mx-auto px-6 pt-28 pb-10 sm:pt-40 sm:pb-14 text-center animate-hero">

        <h1 className="text-[60px] sm:text-[68px] leading-[1.05] font-bold tracking-tight mb-6">
          GigHive
        </h1>

        <p className="text-[32px] sm:text-[38px] font-semibold tracking-tight mb-6">
          Complete campus tasks. Earn with trust.
        </p>

        <p className="text-[18px] text-zinc-400 font-normal max-w-xl mx-auto leading-relaxed">
          Connect with students, complete verified gigs, and get paid securely
          through GigHive&apos;s escrow system.
        </p>

        {!isAuthenticated && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors"
            >
              GET STARTED
            </Link>

            <Link
              href="/login"
              className="px-6 py-3 rounded-lg border border-white/10 hover:border-white/20 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              LOGIN
            </Link>
          </div>
        )}

        </section>

        {isAuthenticated && (
    <>
      {/* AVAILABLE TASKS */}
      <section className="max-w-7xl mx-auto px-6 pb-28">

        <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight mb-8">
          Available Tasks
        </h2>

        {/* LOADING SKELETON */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer rounded-2xl border border-white/10 p-5"
              >
                <div className="h-5 w-3/4 rounded bg-white/10 mb-3" />
                <div className="h-3 w-full rounded bg-white/5 mb-5" />
                <div className="flex gap-2 mb-5">
                  <div className="h-5 w-16 rounded-full bg-white/10" />
                  <div className="h-5 w-16 rounded-full bg-white/10" />
                </div>
                <div className="h-3 w-1/2 rounded bg-white/5 mb-5" />
                <div className="h-6 w-20 rounded bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-6 py-8 text-center max-w-lg mx-auto">
            <p className="text-red-300 font-medium mb-1">{error}</p>
            <p className="text-zinc-500 text-sm font-normal">
              Refresh the page to try again.
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
          {!loading && tasks.filter((task) => task.state === "OPEN").length === 0 && (
          <div className="rounded-2xl border border-white/10 px-6 py-20 text-center max-w-lg mx-auto">
            <svg
              width="120"
              height="96"
              viewBox="0 0 120 96"
              fill="none"
              className="mx-auto mb-6"
            >
              <rect x="10" y="34" width="100" height="52" rx="12" className="fill-white/[0.04]" />
              <rect x="10" y="34" width="100" height="52" rx="12" className="stroke-white/10" strokeWidth="1" />
              <path
                d="M10 46 L60 68 L110 46"
                className="stroke-indigo-400/40"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="60" cy="20" r="14" className="fill-indigo-500/10" />
              <circle cx="60" cy="20" r="14" className="stroke-indigo-400/30" strokeWidth="1.5" />
              <path
                d="M53 20 h14 M60 13 v14"
                className="stroke-indigo-300/50"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-white font-semibold mb-1">
              No tasks available right now
            </p>
            <p className="text-zinc-500 text-sm font-normal">
              New verified campus gigs appear throughout the day.
            </p>
          </div>
        )}

        {/* TASK GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {tasks
          .filter((task) => task.state === "OPEN")
          .map((task, index) => (

            <div
              key={task.id}
              style={{ animationDelay: `${index * 60}ms` }}
              className="animate-card group rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-indigo-500/40 hover:shadow-[0_16px_36px_-8px_rgba(99,102,241,0.4)]"
            >

              {/* TITLE */}

              <h3 className="text-[20px] font-semibold tracking-tight mb-1.5 text-white">
                {task.title}
              </h3>

              {/* ONE-LINE DESCRIPTION */}

              {task.details && (
                <p className="text-[15px] text-zinc-400 font-normal mb-4 leading-relaxed line-clamp-1">
                  {task.details}
                </p>
              )}

              {/* BADGES */}

              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${MODE[task.mode].color}`}
                >
                  {MODE[task.mode].label}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${BAND[task.band].color}`}
                >
                  {BAND[task.band].label}
                </span>
              </div>

              {/* DEADLINE */}

              <p className="text-[15px] text-zinc-400 font-normal mb-5">
                Due {formatDeadline(task.deadline)}
              </p>

              {/* REWARD */}

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <p className="text-xl font-semibold text-emerald-400 tabular-nums">
                  {formatPrice(task.price)}
                </p>

                <Link
                  href={`/task/${task.id}`}
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View Details →
                </Link>
              </div>

            </div>

          ))}

        </div>

          </section>
  </>
        )}
          {!isAuthenticated && (
  <section className="max-w-3xl mx-auto px-6 pb-28 text-center">
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
        Ready to get started?
      </h2>

      <p className="text-zinc-400 text-sm sm:text-base mb-6">
        Join GigHive and start completing campus tasks with a trusted system
        for payments and commitments.
      </p>

      <Link
        href="/signup"
        className="inline-flex px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors"
      >
        GET STARTED
      </Link>
    </div>
  </section>
)}
        <style jsx>{`
        @keyframes heroIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          from {
            background-position: -200% 0;
          }
          to {
            background-position: 200% 0;
          }
        }
        .animate-hero {
          animation: heroIn 0.5s ease-out both;
        }
        .animate-card {
          animation: cardIn 0.4s ease-out both;
        }
        .skeleton-shimmer {
          background-image: linear-gradient(
            100deg,
            rgba(255, 255, 255, 0.02) 0%,
            rgba(255, 255, 255, 0.06) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
      `}</style>

    </main>
  );
}
