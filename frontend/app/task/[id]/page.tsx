"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../../services/api";

/* ---------- Types ---------- */

type Band = "short" | "medium" | "long";
type Mode = "online" | "offline" | "hybrid";
type AcceptStatus = "idle" | "loading" | "done" | "error";

interface Task {
  id: number;
  title: string;
  band: Band;
  mode: Mode;
  price: number;
  deadline: string;
  details: string;
  preferences?: string;
  location_hint?: string;
  availability_window?: string;
  bonus_tokens?: number;
  state?: string;
}

/* ---------- UI Config ---------- */

const BAND = {
  short: { label: "Short", color: "text-sky-300 bg-sky-500/10 ring-sky-500/20" },
  medium: { label: "Medium", color: "text-amber-300 bg-amber-500/10 ring-amber-500/20" },
  long: { label: "Long", color: "text-rose-300 bg-rose-500/10 ring-rose-500/20" },
};

const MODE = {
  online: { label: "Online", icon: "🌐", color: "text-blue-300 bg-blue-500/10 ring-blue-500/20" },
  offline: { label: "Offline", icon: "📍", color: "text-zinc-300 bg-zinc-500/10 ring-zinc-500/20" },
  hybrid: { label: "Hybrid", icon: "🔀", color: "text-violet-300 bg-violet-500/10 ring-violet-500/20" },
};

/* ---------- Helpers ---------- */

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function deadlineUrgencyColor(iso: string) {
  const diffMs = new Date(iso).getTime() - Date.now();
  const hours = diffMs / (1000 * 60 * 60);
  if (hours < 24) return "text-red-400";
  if (hours < 72) return "text-amber-400";
  return "text-emerald-400";
}

/* ---------- Page ---------- */

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = typeof params?.id === "string" ? params.id : "";

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptStatus, setAcceptStatus] = useState<AcceptStatus>("idle");
  const [showUpiPopup, setShowUpiPopup] = useState(false);

  // Real profile-backed UPI state
  const [earningsUpi, setEarningsUpi] = useState<string>("");
  const [profileLoading, setProfileLoading] = useState(true);

  // UPI modal local UI state
  const [upiInput, setUpiInput] = useState("");
  const [upiMode, setUpiMode] = useState<"view" | "edit">("edit");
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiSaveError, setUpiSaveError] = useState("");

  // UI-orchestration only — none of these touch the real accept/UPI logic
  const [flowStep, setFlowStep] = useState<"none" | "rules">("none");
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [showAcceptedScreen, setShowAcceptedScreen] = useState(false);

  // Classifies the same error response acceptTask() already receives —
  // no new API call, just reading the existing message more carefully.
  const [errorModal, setErrorModal] = useState<
    null | "own_task" | "tokens" | "already_accepted" | "expired"
  >(null);

  // Brief disable+spinner transition on the main Accept button, purely
  // cosmetic — no API call happens here, it just delays opening the modal.
  const [openingFlow, setOpeningFlow] = useState(false);

  useEffect(() => {
    if (!id) return;

    API.get(`/tasks/${id}/`)
      .then((res) => setTask(res.data))
      .catch(() => setError("Failed to load task"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    API.get("/profile/")
      .then((res) => {
        const savedUpi = res.data?.earnings_upi_id || "";

setEarningsUpi(savedUpi);
setUpiMode(savedUpi ? "view" : "edit");
      })
      .catch((err) => console.error(err))
      .finally(() => setProfileLoading(false));
  }, []);

  async function acceptTask() {
    if (!task) return;

    setAcceptStatus("loading");

    try {
      await API.post(`/tasks/${task.id}/accept/`);
      setAcceptStatus("done");
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data || "");

      if (
    message.includes("Earnings UPI") ||
    message.includes("receive payments")
) {
    setUpiMode("edit");
    setShowUpiPopup(true);
    setAcceptStatus("idle");
    return;
}

      if (/giver and taker cannot be the same|cannot accept your own task|own task/i.test(message)) {
        setFlowStep("none");
        setAgreedToRules(false);
        setAcceptStatus("idle");
        setErrorModal("own_task");
        return;
      }

      if (/commitment token/i.test(message) && /insufficient|not enough|no.*available/i.test(message)) {
        setFlowStep("none");
        setAgreedToRules(false);
        setAcceptStatus("idle");
        setErrorModal("tokens");
        return;
      }

      if (/already.*accepted/i.test(message)) {
        setFlowStep("none");
        setAgreedToRules(false);
        setAcceptStatus("idle");
        setErrorModal("already_accepted");
        return;
      }

      if (/expired|no longer available/i.test(message)) {
        setFlowStep("none");
        setAgreedToRules(false);
        setAcceptStatus("idle");
        setErrorModal("expired");
        return;
      }

      setAcceptStatus("error");
    }
  }

  // Real profile check: skip the modal entirely if UPI is already on file
  function handleAcceptClick() {
    if (!earningsUpi) {
      setUpiMode("edit");
      setShowUpiPopup(true);
      return;
    }
    acceptTask();
  }

  async function saveUpi() {
    setEarningsUpi(upiInput.trim());

    setSavingUpi(true);
    setUpiSaveError("");

    try {
      await API.patch("/profile/", {
    earnings_upi_id: upiInput.trim(),
});
      setShowUpiPopup(false);
      // Continue directly to acceptance, no extra click required
      acceptTask();
    } catch (err) {
      console.error(err);
      setUpiSaveError("Failed to save UPI. Please try again.");
    } finally {
      setSavingUpi(false);
    }
  }

  // Holds the success animation in the modal for ~1s before handing off
  // to the existing "done" full-page view below, unchanged.
  useEffect(() => {
    if (acceptStatus !== "done") return;
    const t = setTimeout(() => setShowAcceptedScreen(true), 1000);
    return () => clearTimeout(t);
  }, [acceptStatus]);

  // Escape closes the error modal
  useEffect(() => {
    if (!errorModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setErrorModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [errorModal]);

  function handleAcceptButtonClick() {
    setOpeningFlow(true);
    setTimeout(() => {
      setOpeningFlow(false);
      setFlowStep("rules");
    }, 450);
  }

  const ERROR_MODAL_CONTENT: Record<
    "own_task" | "tokens" | "already_accepted" | "expired",
    { title: string; description: string }
  > = {
    own_task: {
      title: "You can't accept your own task",
      description:
        "Tasks are meant for other students. Ask another student to complete this task, or edit/cancel it from My Tasks.",
    },
    tokens: {
      title: "Not enough Commitment Tokens",
      description:
        "You need an available Commitment Token to accept a task. Complete or resolve an ongoing task to free one up, or check your token balance from your profile.",
    },
    already_accepted: {
      title: "Task already accepted",
      description:
        "This task has already been accepted by another student.",
    },
    expired: {
      title: "Task no longer available",
      description:
        "This task is no longer available.",
    },
  };

  /* ---------- LOADING SKELETON ---------- */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090B] text-white">
        <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse">
          <div className="h-4 w-16 bg-white/5 rounded mb-6" />
          <div className="h-10 w-2/3 bg-white/10 rounded-xl mb-4" />
          <div className="flex gap-2 mb-10">
            <div className="h-6 w-20 bg-white/5 rounded-full" />
            <div className="h-6 w-20 bg-white/5 rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
            <div className="space-y-6">
              <div className="h-40 rounded-2xl border border-white/10 bg-white/[0.02]" />
              <div className="h-52 rounded-2xl border border-white/10 bg-white/[0.02]" />
            </div>
            <div className="space-y-5">
              <div className="h-32 rounded-2xl border border-white/10 bg-white/[0.02]" />
              <div className="h-12 rounded-xl bg-white/5" />
              <div className="h-24 rounded-2xl border border-white/10 bg-white/[0.02]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ---------- FRIENDLY ERROR SCREEN ---------- */

  if (error || !task) {
    return (
      <main className="min-h-screen bg-[#09090B] text-white flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">
          🔍
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-1.5">
            {error || "This task couldn't be found"}
          </h2>
          <p className="text-zinc-500 text-sm max-w-sm">
            It may have been removed, already accepted, or the link might be incorrect.
          </p>
        </div>
        <Link
          href="/"
          className="bg-indigo-600 hover:bg-indigo-500 transition-colors px-5 py-2.5 rounded-xl font-medium text-sm"
        >
          Browse Marketplace
        </Link>
      </main>
    );
  }

  if (showAcceptedScreen) {
    return (
      <main className="min-h-screen bg-[#09090B] text-white flex flex-col items-center justify-center gap-6 px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl text-emerald-400"
        >
          ✔
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight">Task Accepted</h2>
        <button
          onClick={() => router.push("/")}
          className="bg-indigo-600 hover:bg-indigo-500 transition-colors px-6 py-3 rounded-xl font-semibold"
        >
          Back to Marketplace
        </button>
      </main>
    );
  }

  const showLocation = task.mode === "offline" || task.mode === "hybrid";

  return (
    <main className="min-h-screen bg-[#09090B] text-white">

      <div className="max-w-6xl mx-auto px-6 py-10 sm:py-12">

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-zinc-400 text-sm hover:text-white hover:-translate-x-0.5 transition-all duration-200"
        >
          ← Back
        </Link>

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-4 mb-8 sm:mb-10"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight mb-4">
            {task.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${MODE[task.mode].color}`}>
              {MODE[task.mode].icon} {MODE[task.mode].label}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${BAND[task.band].color}`}>
              {BAND[task.band].label}
            </span>
            {task.state && (
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset text-emerald-300 bg-emerald-500/10 ring-emerald-500/20">
                {task.state.charAt(0).toUpperCase() + task.state.slice(1)}
              </span>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-10">

          <div className="space-y-6">

            {/* DESCRIPTION */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            >
              <h3 className="text-lg font-semibold tracking-tight mb-3">Task Description</h3>
              <p className={`leading-relaxed whitespace-pre-wrap ${task.details ? "text-zinc-300" : "text-zinc-500 italic"}`}>
                {task.details || "No additional instructions provided."}
              </p>
            </motion.div>

            {/* REQUIREMENTS — mapped from task.preferences, the closest real field */}
            {task.preferences && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
              >
                <h3 className="text-lg font-semibold tracking-tight mb-3">Requirements</h3>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {task.preferences}
                </p>
              </motion.div>
            )}

            {/* TASK INFORMATION */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            >
              <h3 className="text-lg font-semibold tracking-tight mb-5">Task Information</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-zinc-500">Reward</span>
                  <span className="text-emerald-400 font-semibold">{formatPrice(task.price)}</span>
                </div>
                <div className="flex justify-between items-start gap-4 pt-4 border-t border-white/5">
                  <span className="text-zinc-500 flex items-center gap-1.5"><span>📅</span> Deadline</span>
                  <span className={`font-medium ${deadlineUrgencyColor(task.deadline)}`}>{formatDeadline(task.deadline)}</span>
                </div>
                <div className="flex justify-between items-start gap-4 pt-4 border-t border-white/5">
                  <span className="text-zinc-500">Mode</span>
                  <span className="text-zinc-300">{MODE[task.mode].label}</span>
                </div>
                <div className="flex justify-between items-start gap-4 pt-4 border-t border-white/5">
                  <span className="text-zinc-500">Duration</span>
                  <span className="text-zinc-300">{BAND[task.band].label}</span>
                </div>
                {showLocation && task.location_hint && (
                  <div className="flex justify-between items-start gap-4 pt-4 border-t border-white/5">
                    <span className="text-zinc-500">Location</span>
                    <span className="text-zinc-300 text-right">{task.location_hint}</span>
                  </div>
                )}
              </div>
            </motion.div>

          </div>

          {/* SIDEBAR */}
          <aside>
            <div className="lg:sticky lg:top-24 space-y-5">

              {/* REWARD CARD */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.06] to-transparent p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
              >
                <p className="text-xs text-zinc-500 mb-1">You'll Earn</p>
                <motion.p
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-4xl font-bold text-emerald-400 mb-2"
                >
                  {formatPrice(task.price)}
                </motion.p>
                <p className="text-xs text-zinc-500">Payment secured by GigHive Escrow.</p>
              </motion.div>

              {/* ACCEPT BUTTON */}
            {task.state === "OPEN" ? (
              <div>
                <motion.button
                  whileHover={{ scale: openingFlow ? 1 : 1.02 }}
                  whileTap={{ scale: openingFlow ? 1 : 0.98 }}
                  onClick={handleAcceptButtonClick}
                  disabled={acceptStatus === "loading" || profileLoading || openingFlow}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_10px_30px_-8px_rgba(99,102,241,0.5)] transition-all duration-200 p-4 rounded-xl font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {openingFlow && (
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  )}

                  {profileLoading
                    ? "Loading..."
                    : openingFlow
                      ? "Preparing..."
                      : "Accept Task"}
                </motion.button>

                <p className="text-xs text-zinc-500 text-center mt-2.5 flex items-center justify-center gap-1">
                  <span>🔒</span> 1 Commitment Token will be locked until completion.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
                <p className="text-sm font-semibold text-zinc-300">
                  {task.state === "CANCELLED"
                    ? "Task Cancelled"
                    : task.state === "ACCEPTED"
                      ? "Task Already Accepted"
                      : task.state === "SUBMITTED"
                        ? "Task Submitted"
                        : task.state === "COMPLETED"
                          ? "Task Completed"
                          : task.state === "FAILED"
                            ? "Task Failed"
                            : "Task Unavailable"}
                </p>

                <p className="text-xs text-zinc-500 mt-1.5">
                  This task is no longer available for acceptance.
                </p>
              </div>
            )}

              {acceptStatus === "error" && (
                <p className="text-red-400 text-sm text-center">Failed to accept task.</p>
              )}

              {/* COMMITMENT TOKEN CARD */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-indigo-400">🪙</span>
                  <h4 className="text-sm font-semibold tracking-tight">Commitment Token</h4>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  One Commitment Token will be locked until the task is completed.
                </p>
              </div>

              {/* TRUST CARD */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <h4 className="text-sm font-semibold tracking-tight mb-3">Verified & Secure</h4>
                <ul className="space-y-2 text-xs text-zinc-500">
                  <li className="flex gap-2"><span className="text-indigo-400">✓</span> Payment held in escrow</li>
                  <li className="flex gap-2"><span className="text-indigo-400">✓</span> Reward released after verification</li>
                  <li className="flex gap-2"><span className="text-indigo-400">✓</span> GigHive protects both users</li>
                </ul>
              </div>

            </div>
          </aside>

        </div>

        {/* HOW GIGHIVE WORKS */}
        <div className="mt-14 sm:mt-16">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-8 text-center">How GigHive Works</h3>
          <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 max-w-4xl mx-auto">
            {[
              { icon: "✅", label: "Accept Task" },
              { icon: "🛠️", label: "Complete Work" },
              { icon: "📤", label: "Submit Proof" },
              { icon: "🔍", label: "Admin Verification" },
              { icon: "💰", label: "Payment Released" },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-base mx-auto mb-3">
                  {step.icon}
                </div>
                <p className="text-xs text-zinc-400">{step.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-14 sm:mt-16 max-w-2xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-6 text-center">Frequently Asked</h3>
          <FAQ />
        </div>

      </div>

      {/* RULES MODAL */}
      <AnimatePresence>
        {flowStep === "rules" && !showUpiPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="bg-[#0D0D10] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
            >
              <AnimatePresence mode="wait">

                {(acceptStatus === "idle" || acceptStatus === "error") && (
                  <motion.div key="rules-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h2 className="text-2xl font-bold mb-1.5">Before You Accept</h2>
                    <p className="text-zinc-500 text-sm mb-6">Please read these rules carefully.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {[
                        { icon: "🔒", text: "You and the task creator each lock one Commitment Token." },
                        { icon: "⏰", text: "Complete before the deadline to keep your token." },
                        { icon: "❌", text: "Missing the deadline may burn your token." },
                        { icon: "💰", text: "Payment is released after successful completion." },
                      ].map((rule, i) => (
                        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                          <div className="text-lg mb-2">{rule.icon}</div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{rule.text}</p>
                        </div>
                      ))}
                    </div>

                    <label className="flex items-start gap-2.5 mb-6 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToRules}
                        onChange={(e) => setAgreedToRules(e.target.checked)}
                        className="mt-0.5 accent-indigo-500"
                      />
                      <span className="text-sm text-zinc-300">I understand these rules.</span>
                    </label>

                    <div className="flex gap-3">
                      <button
                        onClick={() => { setFlowStep("none"); setAgreedToRules(false); }}
                        className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors px-5 py-2.5 rounded-xl font-medium text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAcceptClick}
                        disabled={!agreedToRules}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-colors px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Accept Task
                      </button>
                    </div>
                  </motion.div>
                )}

                {acceptStatus === "loading" && (
                  <motion.div
                    key="rules-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-8 text-center"
                  >
                    <motion.div
                      className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 mb-5"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="font-semibold">Accepting task...</p>
                  </motion.div>
                )}

                {acceptStatus === "done" && (
                  <motion.div
                    key="rules-success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4 text-2xl text-emerald-400"
                    >
                      ✔
                    </motion.div>
                    <p className="font-semibold">Task Accepted</p>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPI MODAL — real fetch/save via /profile/ */}
      <AnimatePresence>
        {showUpiPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="bg-[#0D0D10] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
            >
              {upiMode === "view" && earningsUpi ? (
                <>
                  <h2 className="text-2xl font-bold mb-1.5">Receiving Payment</h2>
                  <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                    Your earnings for this task will be sent to your saved UPI ID.
                  </p>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-4 mb-6">
                    <p className="text-xs text-zinc-500 mb-1">UPI ID</p>
                    <p className="font-semibold text-white">{earningsUpi}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setUpiMode("edit")}
                      className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors px-5 py-2.5 rounded-xl font-medium text-sm"
                    >
                      Change UPI
                    </button>
                    <button
                      onClick={() => { setShowUpiPopup(false); acceptTask(); }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-colors px-5 py-2.5 rounded-xl font-semibold text-sm"
                    >
                      Use this UPI
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-1.5">Set your UPI ID</h2>
                  <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                    This UPI ID will be used to send your earnings after successful task completion.
                  </p>

                  <label className="block text-xs text-zinc-500 mb-2">UPI ID</label>
                  <input
                    placeholder="yourname@upi"
                    value={upiInput}
                    onChange={(e) => setUpiInput(e.target.value)}
                    className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-base placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 mb-3"
                  />

                  {upiSaveError && (
                    <p className="text-red-400 text-xs mb-3">{upiSaveError}</p>
                  )}

                  <p className="text-xs text-zinc-500 mb-6">
                    Your UPI is stored securely and can be updated later from your profile.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowUpiPopup(false);
                        setUpiInput("");
                        setUpiSaveError("");
                      }}
                      disabled={savingUpi}
                      className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors px-5 py-2.5 rounded-xl font-medium text-sm disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveUpi}
                      disabled={!upiInput.trim() || savingUpi}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-colors px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {savingUpi && (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      )}
                      {savingUpi ? "Saving..." : "Save & Continue"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERROR MODAL — own task / insufficient tokens / already accepted / expired */}
      <AnimatePresence>
        {errorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setErrorModal(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="bg-[#0D0D10] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mx-auto mb-5">
                ⚠️
              </div>

              <h2 className="text-xl font-bold mb-2">
                {ERROR_MODAL_CONTENT[errorModal].title}
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                {ERROR_MODAL_CONTENT[errorModal].description}
              </p>

              <button
                onClick={() => setErrorModal(null)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 transition-colors px-5 py-2.5 rounded-xl font-semibold text-sm"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}

/* ---------- FAQ (static content, no logic) ---------- */

function FAQ() {
  const items = [
    {
      q: "Why do I need a Commitment Token?",
      a: "Encourages both users to honour the agreement.",
    },
    {
      q: "When will I receive payment?",
      a: "After successful completion and admin payment verification.",
    },
    {
      q: "Can I cancel later?",
      a: "Yes. Cancellation follows GigHive's Commitment Token rules.",
    },
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex justify-between items-center text-left px-5 py-4"
          >
            <span className="text-sm font-medium text-white">{item.q}</span>
            <motion.span
              animate={{ rotate: open === i ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-zinc-500 text-lg"
            >
              +
            </motion.span>
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <p className="px-5 pb-4 text-sm text-zinc-500">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
