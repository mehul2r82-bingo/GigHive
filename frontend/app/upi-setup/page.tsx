"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import API from "@/services/api"

export default function UpiSetupPage() {
  const [upiId, setUpiId] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get("type") ?? "earnings"



  const saveUpi = async () => {
    try {
      setLoading(true)

      await API.patch("/profile/", {
      [type === "refund"
      ? "refund_upi_id"
      : "earnings_upi_id"]: upiId,
    })

      alert(
    type === "refund"
      ? "Refund UPI saved successfully."
      : "Earnings UPI saved successfully."
  )
      router.push("/my-tasks")
    } catch (err) {
      console.error(err)
      alert("Failed to save UPI")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl">
        <h1 className="text-3xl font-bold mb-2">
      {type === "refund"
        ? "Add Refund UPI"
        : "Add Earnings UPI"}
    </h1>

    <p className="text-zinc-400 mb-6">
      {type === "refund"
        ? "This UPI will be used only for refunds."
        : "This UPI will be used to receive task payments."}
    </p>

        <input
          type="text"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          placeholder="yourupi@bank"
          className="w-full bg-zinc-800 p-3 rounded-lg mb-6"
        />

        <button
          onClick={saveUpi}
          disabled={loading}
          className="w-full bg-orange-500 py-3 rounded-lg"
        >
          {loading ? "Saving..." : "Save UPI"}
        </button>
      </div>
    </main>
  )
}