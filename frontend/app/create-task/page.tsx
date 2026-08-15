
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import API from "../../services/api"

type FormState = {
  title: string
  task_type: number
  band: string
  mode: string
  deadline: string
  price: number
  details: string
  location_hint: string
  availability_window: string
  bonus_tokens: number
}

export default function CreateTaskPage() {

const router = useRouter()

const [error,setError] = useState("")
const [loading,setLoading] = useState(false)
const [nowLocal, setNowLocal] = useState("");


const [form, setForm] = useState<FormState>({
  title: "",
  task_type: 0,
  band: "",
  mode: "",
  deadline: "",
  price: 0,
  details: "",
  location_hint: "",
  availability_window: "",
  bonus_tokens: 0
})

const updateField = (key: keyof FormState,value:any)=>{
setForm(prev=>({...prev,[key]:value}))
}

/* ---------- TASK TYPES (match your DB ids) ---------- */

const TASK_TYPES = [
{ id:1,label:"Assignment"},
{ id:2,label:"Presentation / PPT"},
{ id:3,label:"Coding"},
{ id:4,label:"Video Editing"},
{ id:5,label:"Canva / Design"},
{ id:6,label:"Club / Campus Work"},
{ id:7,label:"Legacy Task"},
{ id:8,label:"Research"}
]

/* ---------- BANDS (your requested pricing) ---------- */

const BANDS = [
  { value: "short", label: "Short (min 60)", min: 60 },
  { value: "medium", label: "Medium (min 120)", min: 120 },
  { value: "long", label: "Long (min 250)", min: 250 }
]

/* ---------- MODES ---------- */

const MODES = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Hybrid" }
]

/* ---------- DISPLAY-ONLY HELPERS (no state, no logic change) ----------
   Display copy per your brief. displayMin matches BANDS[].min exactly (60/120/250). */

const BAND_INFO: Record<string, { title: string; range: string; examples: string; displayMin: number }> = {
  short: { title: "Short", range: "Up to 2 hours", examples: "Notes, Assignments, Quick edits", displayMin: 60 },
  medium: { title: "Medium", range: "2–6 hours", examples: "Presentation, Website edits, Research", displayMin: 120 },
  long: { title: "Long", range: "1–3 days", examples: "Large projects, Design work, Development", displayMin: 250 },
}

const MODE_ICON: Record<string, string> = {
  online: "🌐",
  offline: "📍",
  hybrid: "🔀",
}

const selectedBand = BANDS.find(b => b.value === form.band)
const showElegantWarning = !!selectedBand && form.price > 0 && form.price < selectedBand.min



function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" className="fill-indigo-500/15" />
      <path d="M8 12.5l2.5 2.5L16 9" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
useEffect(() => {
  const now = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);

  setNowLocal(now);
}, []);
/* ---------- SUBMIT ---------- */

const submit = async(e:any)=>{
e.preventDefault()

const band = BANDS.find(b => b.value === form.band)

if (band && form.price < band.min) {
  alert(`Minimum price for ${band.label} band is ${band.min}`)
  return
}

try{

setLoading(true)

const res = await API.post("/tasks/",{
...form,
location_hint: form.mode === "offline" ? form.location_hint : "",
availability_window: form.mode === "offline" ? form.availability_window : ""
})

const taskId = res.data.id

alert("Task created successfully")
console.log(res.data)

router.push(`/pay-escrow/${taskId}`)

}catch(err:any){

console.log(err.response?.data)

setError(JSON.stringify(err.response?.data || "Request failed"))

}

setLoading(false)

}

/* ---------- UI ---------- */
 

return(

<div className="min-h-screen bg-[#09090B] text-white">

  <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

    <div>

      {/* HERO */}
      <div className="fade-up mb-12">
        <h1 className="text-4xl sm:text-[44px] font-bold tracking-tight mb-3">
          Create a Task
        </h1>
        <p className="text-zinc-400 text-lg mb-2">
          Need help? Post your task and let trusted students complete it.
        </p>
        <p className="text-zinc-500 text-sm flex items-center gap-1.5">
          <span className="text-indigo-400">🔒</span>
          Your payment is held securely until work is completed.
        </p>
      </div>

      {error && (
        <div className="fade-up bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl mb-8">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-8">

        {/* CARD 1 — TASK DETAILS */}
        <div className="fade-up rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.15)]">
          <h2 className="text-lg font-semibold tracking-tight mb-5">Task Details</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-xs text-zinc-500 mb-2">Task title</label>
              <input
                placeholder="e.g. Solve 10 calculus questions"
                className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-base placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                value={form.title}
                onChange={(e)=>updateField("title",e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2">Task category</label>
              <select
                className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-base outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                value={form.task_type || ""}
                onChange={(e)=>updateField("task_type",Number(e.target.value))}
              >
                <option value="">Select task type</option>
                {TASK_TYPES.map(t=>(
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs text-zinc-500">Task description</label>
                <span className="text-xs text-zinc-600">{form.details.length} characters</span>
              </div>
              <textarea
                placeholder="Describe what needs to be done..."
                rows={4}
                className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-base placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                value={form.details}
                onChange={(e)=>updateField("details",e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-3">Mode</label>
              <div className="flex flex-wrap gap-2">
                {MODES.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={()=>updateField("mode", m.value)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      form.mode === m.value
                        ? "border-indigo-500 bg-indigo-500/15 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_0_20px_-4px_rgba(99,102,241,0.5)] scale-[1.03]"
                        : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span>{MODE_ICON[m.value]}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {(form.mode === "offline" || form.mode === "hybrid") && (
              <div>
                <label className="block text-xs text-zinc-500 mb-2">Location</label>
                <input
                  placeholder="e.g. Block A, Library, 2nd floor"
                  className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-base placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                  value={form.location_hint}
                  onChange={(e)=>updateField("location_hint",e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* CARD 2 — DURATION BAND */}
        <div className="fade-up rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.15)]">
          <h2 className="text-lg font-semibold tracking-tight mb-5">Duration Band</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {BANDS.map(b => {
              const info = BAND_INFO[b.value]
              const isSelected = form.band === b.value
              return (
                <button
                  key={b.value}
                  type="button"
                  onClick={()=>updateField("band", b.value)}
                  className={`text-left rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.02] ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/[0.08] shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_8px_30px_-8px_rgba(99,102,241,0.5)]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <p className="text-base font-semibold text-white mb-1">{info.title}</p>
                  <p className="text-sm text-indigo-300 mb-3">{info.range}</p>
                  <p className="text-xs text-zinc-500 mb-4 leading-relaxed">{info.examples}</p>
                  <p className="text-xs text-zinc-500">
                    Minimum Price: <span className="text-emerald-400 font-semibold">₹{info.displayMin}</span>
                  </p>
                </button>
              )
            })}
          </div>

          <p className="text-xs text-zinc-500 mt-4">
            Select the duration that best represents the expected effort. This automatically determines the minimum allowed reward.
          </p>
        </div>

        {/* CARD 3 — PRICE */}
        <div className="fade-up rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.06] to-transparent p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.2)]">
          <h2 className="text-lg font-semibold tracking-tight mb-5">Price</h2>

          <label className="block text-xs text-zinc-500 mb-2">Task Price</label>
          <div className="relative mb-0">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">₹</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              className="w-full p-4 pl-9 bg-black/40 border border-white/10 rounded-xl text-2xl font-semibold outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
              value={form.price || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                updateField("price", value === "" ? 0 : Number(value));
              }}
            />
          </div>

        

          {showElegantWarning && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-start gap-2.5">
              <span className="text-amber-300">✨</span>
              <p className="text-sm text-amber-200">
                For the {selectedBand ? BAND_INFO[selectedBand.value].title : ""} band, the minimum reward is{" "}
                <span className="font-semibold">₹{selectedBand?.min}</span>. You can still submit,
                but you may be asked to raise the price.
              </p>
            </div>
          )}
        </div>

        {/* CARD 4 — DEADLINE */}
        <div className="fade-up rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.15)]">
          <h2 className="text-lg font-semibold tracking-tight mb-5">Deadline</h2>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              📅
            </span>
            <input
              type="datetime-local"
              min={nowLocal}
              placeholder="Select deadline"
              className="w-full p-4 pl-11 bg-black/40 border border-white/10 rounded-xl text-base outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 [color-scheme:dark]"
              value={form.deadline}
              onChange={(e)=>updateField("deadline",e.target.value)}
            />
          </div>

          <p className="text-xs text-zinc-500 mt-3">
            Choose the final date and time before which the task must be completed. Only future dates are allowed.
          </p>
        </div>

        {/* CARD 5 — BONUS TOKEN */}
        <div className="fade-up rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.15)]">
          <h2 className="text-lg font-semibold tracking-tight mb-1">Bonus Token (Optional)</h2>
          <p className="text-sm text-zinc-500 mb-5">
            Reward exceptional work with extra Commitment Tokens.
          </p>

          <label className="block text-xs text-zinc-500 mb-2">Bonus Tokens</label>
          <input
            type="number"
            placeholder="0"
            className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-base placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 mb-4"
            value={form.bonus_tokens}
            onChange={(e)=>updateField("bonus_tokens",Number(e.target.value))}
          />

          <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3.5">
            <p className="text-xs text-zinc-400 font-medium mb-2">Why give Bonus Tokens?</p>
            <ul className="space-y-1 text-xs text-zinc-500">
              <li>• Motivate better quality work</li>
              <li>• Reward fast completion</li>
              <li>• Appreciate extra effort</li>
            </ul>
          </div>
        </div>

        {/* PUBLISH TASK */}
        <div className="fade-up pt-2 pb-4 flex justify-center">
          <button
            disabled={loading}
            className="group relative px-10 py-4 rounded-xl text-base font-semibold bg-indigo-600 text-white transition-all duration-200 hover:bg-indigo-500 hover:scale-[1.02] hover:shadow-[0_10px_30px_-8px_rgba(99,102,241,0.5)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center gap-2.5"
          >
            {loading && (
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
            {loading ? "Publishing..." : "Publish Task"}
          </button>
        </div>

      </form>
    </div>

    {/* SIDEBAR — desktop only */}
    <aside className="hidden lg:block">
      <div className="sticky top-16 space-y-6">

        <div className="fade-up rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.15)]">
          <h3 className="text-sm font-semibold tracking-tight mb-4">Why GigHive?</h3>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex gap-2.5">
              <CheckIcon />
              Payment is verified before a task becomes visible.
            </li>
            <li className="flex gap-2.5">
              <CheckIcon />
              Only verified students can participate.
            </li>
            <li className="flex gap-2.5">
              <CheckIcon />
              Deadlines keep everyone accountable.
            </li>
            <li className="flex gap-2.5">
              <CheckIcon />
              Money is released only after successful completion.
            </li>
          </ul>
          <p className="text-xs text-zinc-500 mt-4 pt-4 border-t border-white/5">
            Built for trust, not uncertainty.
          </p>
        </div>

        <div className="fade-up rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.15)]">
          <h3 className="text-sm font-semibold tracking-tight mb-1">Pricing Guide</h3>
          <p className="text-xs text-zinc-500 mb-4">Choose a fair reward based on effort.</p>
          <ul className="space-y-2.5 text-sm">
            {BANDS.map(b => {
              const info = BAND_INFO[b.value]
              return (
                <li key={b.value} className="flex items-center justify-between">
                  <span className="text-zinc-400">{info.title} ({info.range === "Up to 2 hours" ? "Up to 2 hrs" : info.range.replace("hours","hrs")})</span>
                  <span className="text-emerald-400 font-medium">₹{info.displayMin}+</span>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-zinc-500 mt-4 pt-4 border-t border-white/5">
            You can always offer more than the minimum.
          </p>
        </div>

      </div>
    </aside>

  </div>

  <style jsx>{`
    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .fade-up {
      animation: fadeUp 0.5s ease-out both;
    }
  `}</style>

</div>

)

}
