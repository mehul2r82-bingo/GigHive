"use client"

import { useParams } from "next/navigation"
import API from "@/services/api"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

/* ---------- DISPLAY-ONLY LOOKUPS (match Marketplace / Create Task pages) ---------- */

const TASK_TYPES: Record<number, string> = {
  1: "Assignment",
  2: "Presentation / PPT",
  3: "Coding",
  4: "Video Editing",
  5: "Canva / Design",
  6: "Club / Campus Work",
  7: "Legacy Task",
  8: "Research",
}

const BAND_LABEL: Record<string, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
}

const MODE_LABEL: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  hybrid: "Hybrid",
}

function formatDeadline(iso?: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function PayEscrow() {

  const { taskId } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("")

  // Additive, display-only — holds the rest of the same task fetch response
  const [taskDetails, setTaskDetails] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const submitPayment = async () => {
    try {
      setLoading(true)

      await API.post(`/payments/${taskId}/submit/`)

      setSubmitted(true)
      setPaymentStatus("pending_verification")

    } catch (err) {
      console.error(err)
      alert("Payment submission failed")
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setSubmitted(false)
    setPaymentStatus("")
  }

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText("7416063872@axl")
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (!submitted) return

    const interval = setInterval(async () => {
      try {
        const res = await API.get(
          `/payments/${taskId}/status/`
        )

        const status = res.data.status

        setPaymentStatus(status)

        if (status === "released") {
          clearInterval(interval)
        }

        if (status === "rejected") {
          clearInterval(interval)
        }
      } catch (err) {
        console.error(err)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [submitted, taskId, router])

  // Additive: delayed redirect so the success animation can play,
  // per the brief's own "show success state for ~1s" recommendation.
  useEffect(() => {
    if (paymentStatus !== "released") return
    const t = setTimeout(() => {
      router.push("/")
    }, 1600)
    return () => clearTimeout(t)
  }, [paymentStatus, router])

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await API.get(`/tasks/${taskId}/`)
        setAmount(res.data.price)
        setTaskDetails(res.data)
      } catch (err) {
        console.error(err)
      }
    }

    if (taskId) {
      fetchTask()
    }
  }, [taskId])

  return (
    <div className="min-h-screen bg-[#09090B] text-white">

      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-12 text-center"
        >
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <span className="text-indigo-400 text-2xl">🛡️</span>
            <h1 className="text-4xl sm:text-[44px] font-bold tracking-tight">
              Secure Escrow Payment
            </h1>
          </div>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Your payment is securely held by GigHive and released only after the task is completed successfully.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

          <div className="space-y-8">

            {/* CARD 1 — TASK SUMMARY */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ scale: 1.01 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            >
              <h2 className="text-lg font-semibold tracking-tight mb-5">Task Summary</h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-zinc-500">Task title</span>
                  <span className="text-white font-medium text-right">{taskDetails?.title || "—"}</span>
                </div>
                <div className="flex justify-between items-start gap-4 pt-4 border-t border-white/5">
                  <span className="text-zinc-500">Category</span>
                  <span className="text-zinc-300 text-right">
                    {taskDetails?.task_type ? (TASK_TYPES[taskDetails.task_type] || "—") : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4 pt-4 border-t border-white/5">
                  <span className="text-zinc-500">Mode</span>
                  <span className="text-zinc-300 text-right">
                    {taskDetails?.mode ? (MODE_LABEL[taskDetails.mode] || "—") : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4 pt-4 border-t border-white/5">
                  <span className="text-zinc-500">Duration band</span>
                  <span className="text-zinc-300 text-right">
                    {taskDetails?.band ? (BAND_LABEL[taskDetails.band] || "—") : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4 pt-4 border-t border-white/5">
                  <span className="text-zinc-500">Price</span>
                  <span className="text-emerald-400 font-semibold text-right">
                    ₹{amount || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4 pt-4 border-t border-white/5">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <span>📅</span> Deadline
                  </span>
                  <span className="text-zinc-300 text-right">
                    {formatDeadline(taskDetails?.deadline)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* CARD 2 — SECURE PAYMENT */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.06] to-transparent p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            >
              <h2 className="text-lg font-semibold tracking-tight mb-5">Secure Payment</h2>

              <div className="flex justify-center mb-6">
                <img
                  src="/upi-qr.png"
                  alt="UPI QR"
                  className="w-56 h-56 rounded-2xl border border-white/10"
                />
              </div>

              <div className="space-y-3">
                <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">GigHive UPI ID</p>
                    <p className="font-semibold text-white">7416063872@axl</p>
                  </div>
                  <button
                    onClick={copyUpi}
                    className="px-3 py-2 rounded-lg text-xs font-medium border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors flex items-center gap-1.5"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copied ? (
                        <motion.span
                          key="copied"
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.6, opacity: 0 }}
                          className="text-emerald-400"
                        >
                          ✓ Copied
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.6, opacity: 0 }}
                        >
                          Copy UPI
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 mb-1">Amount</p>
                  <p className="font-semibold text-emerald-400 text-xl">₹{amount || "—"}</p>
                </div>

                <p className="text-xs text-zinc-500 text-center pt-1">
                  Verify the payment before leaving this page.
                </p>
              </div>
            </motion.div>

            {/* CARD 3 — PAYMENT VERIFICATION */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            >
              <h2 className="text-lg font-semibold tracking-tight mb-5">Payment Verification</h2>

              <AnimatePresence mode="wait">

                {/* IDLE — not yet submitted */}
                {!submitted && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <button
                      onClick={submitPayment}
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 transition-all duration-200 hover:shadow-[0_10px_30px_-8px_rgba(99,102,241,0.5)] p-4 rounded-xl font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                    >
                      {loading && (
                        <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      )}
                      {loading ? "Submitting..." : "I've Paid"}
                    </button>
                  </motion.div>
                )}

                {/* PENDING — polling for verification */}
                {submitted && paymentStatus === "pending_verification" && (
                  <motion.div
                    key="pending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-6 text-center"
                  >
                    <motion.div
                      className="w-14 h-14 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 mb-5"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="font-semibold text-white mb-1.5">Verifying payment...</p>
                    <p className="text-sm text-zinc-500">
                      Please wait while GigHive confirms your payment.
                    </p>
                  </motion.div>
                )}

                {/* SUCCESS */}
                {paymentStatus === "released" && (
                  <motion.div
                    key="released"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-6 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5 text-2xl text-emerald-400"
                    >
                      ✔
                    </motion.div>
                    <p className="font-semibold text-white mb-1.5">Payment Verified</p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-sm text-zinc-500"
                    >
                      Your task is now being published to the GigHive marketplace.
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.0 }}
                      className="text-xs text-zinc-600 mt-3"
                    >
                      Redirecting...
                    </motion.p>
                  </motion.div>
                )}

                {/* REJECTED */}
                {paymentStatus === "rejected" && (
                  <motion.div
                    key="rejected"
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center py-6 text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-5 text-2xl text-red-400">
                      ✕
                    </div>
                    <p className="font-semibold text-white mb-1.5">Payment not verified yet</p>
                    <p className="text-sm text-zinc-500 mb-5 max-w-sm">
                      Sometimes banks take a minute. Please wait and try again.
                    </p>
                    <button
                      onClick={handleRetry}
                      className="px-6 py-2.5 rounded-xl border border-white/15 hover:bg-white/5 text-sm font-medium transition-colors"
                    >
                      Retry
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>

            {/* CARD 4 — HOW ESCROW WORKS */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.01 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            >
              <h2 className="text-lg font-semibold tracking-tight mb-6">How Escrow Works</h2>

              <div className="space-y-0">
                {[
                  { icon: "💳", text: "You pay GigHive" },
                  { icon: "🔒", text: "Payment is securely held" },
                  { icon: "🎓", text: "Student completes task" },
                  { icon: "✅", text: "Money released after successful completion" },
                ].map((step, i, arr) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-sm shrink-0">
                        {step.icon}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="w-px flex-1 bg-white/10 my-1" />
                      )}
                    </div>
                    <div className={i < arr.length - 1 ? "pb-6" : ""}>
                      <p className="text-sm text-zinc-300 pt-1.5">{step.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="sticky top-16 space-y-6">

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              >
                <h3 className="text-sm font-semibold tracking-tight mb-4">Why Escrow?</h3>
                <ul className="space-y-3 text-sm text-zinc-400">
                  <li className="flex gap-2">
                    <span className="text-indigo-400">✓</span>
                    Money stays protected
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400">✓</span>
                    No direct payment to strangers
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400">✓</span>
                    Admin verifies payment
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400">✓</span>
                    Released only after successful completion
                  </li>
                </ul>

                <div className="border-t border-white/5 my-5" />

                <h3 className="text-sm font-semibold tracking-tight mb-2">Need Help?</h3>
                <p className="text-xs text-zinc-500 mb-1">support@gighive.app</p>
                <p className="text-xs text-zinc-500 mb-4">Mon–Sat, 9 AM – 6 PM</p>
                <p className="text-xs text-amber-300/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                  Never send money outside GigHive.
                </p>
              </motion.div>

            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
