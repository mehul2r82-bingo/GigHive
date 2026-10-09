"use client"

import { useParams, useRouter } from "next/navigation"
import API from "@/services/api"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, ChevronDown, ChevronUp, Download, ArrowLeft } from "lucide-react"

export default function PayEscrow() {
  const { taskId } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("")
  const [taskDetails, setTaskDetails] = useState<any>(null)
  const [showQr, setShowQr] = useState(false)

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

  const downloadQr = () => {
    const link = document.createElement("a")
    link.href = "/upi-qr.png"
    link.download = "gighive-escrow-qr.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const upiIntentUrl = `upi://pay?pa=7416063872@axl&pn=GigHive&am=${encodeURIComponent(
    amount || ""
  )}&cu=INR&tn=${encodeURIComponent(`GigHive_Escrow_Task_${taskId}`)}`

  // Poll payment verification status
  useEffect(() => {
    if (!submitted) return

    const interval = setInterval(async () => {
      try {
        const res = await API.get(`/payments/${taskId}/status/`)
        const status = res.data.status
        setPaymentStatus(status)

        if (status === "released" || status === "rejected") {
          clearInterval(interval)
        }
      } catch (err) {
        console.error(err)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [submitted, taskId])

  // Redirect on success
  useEffect(() => {
    if (paymentStatus !== "released") return
    const t = setTimeout(() => {
      router.push("/")
    }, 1500)
    return () => clearTimeout(t)
  }, [paymentStatus, router])

  // Fetch task info
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
    <main className="min-h-screen bg-[#09090B] text-white flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md space-y-4">

        {/* Top Back / Brand Bar */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Escrow Protected</span>
          </div>
        </div>

        {/* Main Compact Payment Card */}
        <div className="rounded-2xl border border-white/10 bg-[#121217] p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.6)] space-y-5">
          
          {/* Task Title & Amount Summary */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Publishing Task
              </span>
              <p className="font-bold text-white text-base truncate max-w-[220px] sm:max-w-[260px]">
                {taskDetails?.title || "GigHive Task"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Amount
              </span>
              <p className="text-2xl font-black text-emerald-400 font-mono leading-none mt-0.5">
                ₹{amount || "—"}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* NOT YET SUBMITTED */}
            {!submitted && (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* 1-Click Pay via UPI App Button */}
                <a
                  href={upiIntentUrl}
                  className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-3.5 px-4 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2.5 text-center text-sm sm:text-base cursor-pointer active:scale-[0.98]"
                >
                  <span className="text-lg">📱</span>
                  <span>Pay via UPI App (GPay / PhonePe)</span>
                </a>

                {/* QR Code Dropdown Toggle */}
                <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className="w-full py-2.5 px-4 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Scan QR code instead</span>
                    {showQr ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  <AnimatePresence>
                    {showQr && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-4 pb-4 pt-1 flex flex-col items-center border-t border-white/5"
                      >
                        <img
                          src="/upi-qr.png"
                          alt="UPI QR Code"
                          className="w-44 h-44 rounded-xl border border-white/10 shadow-md mb-2.5 bg-white p-1"
                        />
                        <button
                          type="button"
                          onClick={downloadQr}
                          className="text-[11px] text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 py-1 px-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.03] cursor-pointer"
                        >
                          <Download size={12} /> Save to Photos
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Confirm Paid Button */}
                <div className="pt-1">
                  <button
                    onClick={submitPayment}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_6px_20px_rgba(99,102,241,0.35)] transition-all text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {loading && (
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    )}
                    <span>{loading ? "Submitting..." : "I've Paid — Confirm"}</span>
                  </button>
                  <p className="text-[11px] text-zinc-500 text-center mt-2">
                    Tap after completing payment in your UPI app.
                  </p>
                </div>
              </motion.div>
            )}

            {/* PENDING VERIFICATION */}
            {submitted && paymentStatus === "pending_verification" && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
                <p className="font-bold text-white text-base mb-1">Verifying Payment</p>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  Hold tight while GigHive confirms your transaction with the bank...
                </p>
              </motion.div>
            )}

            {/* SUCCESS / RELEASED */}
            {paymentStatus === "released" && (
              <motion.div
                key="released"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4 text-2xl text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  ✓
                </div>
                <p className="font-bold text-white text-lg mb-1">Payment Verified!</p>
                <p className="text-xs text-zinc-400 mb-3">
                  Your task is now live on the campus marketplace.
                </p>
                <p className="text-[11px] text-zinc-500 animate-pulse">
                  Redirecting to home...
                </p>
              </motion.div>
            )}

            {/* REJECTED / RETRY */}
            {paymentStatus === "rejected" && (
              <motion.div
                key="rejected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mb-4 text-2xl text-rose-400">
                  ✕
                </div>
                <p className="font-bold text-white text-base mb-1">Payment Not Verified</p>
                <p className="text-xs text-zinc-400 mb-4 max-w-xs">
                  We haven't received confirmation yet. If you already paid, please wait a moment and retry.
                </p>
                <button
                  onClick={handleRetry}
                  className="px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/5 text-xs font-bold transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Micro Footer Note */}
        <p className="text-[11px] text-zinc-500 text-center">
          Funds remain locked in escrow until you approve the completed task.
        </p>

      </div>
    </main>
  )
}
