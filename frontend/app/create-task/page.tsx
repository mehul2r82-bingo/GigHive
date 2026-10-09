
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import API from "../../services/api"
import { Crown } from "lucide-react"

type FormState = {
  title: string
  task_type: number
  band: string
  mode: string
  deadline: string
  price: number
  details: string
  deliverable_format: string
  scope_length: string
  criteria: string
  location_hint: string
  availability_window: string
  bonus_tokens: number
}

const DELIVERABLE_FORMATS = [
  { id: "Handwritten", label: "Handwritten", icon: "✍️", hint: "Sheets / Files / Registers" },
  { id: "Typed Document", label: "Typed Doc", icon: "📄", hint: "Word / PDF / Report" },
  { id: "Code / Script", label: "Code / Script", icon: "💻", hint: "Python, C++, Java, Web" },
  { id: "Presentation", label: "Presentation", icon: "📊", hint: "PPT / Canva slides" },
  { id: "Other", label: "Other", icon: "📁", hint: "Custom work" },
];

const SCOPE_SUGGESTIONS = [
  "1–2 Pages",
  "3–5 Pages",
  "1–3 Questions",
  "4–8 Questions",
  "10–15 Slides",
  "Full Lab File",
];

export default function CreateTaskPage() {

const router = useRouter()

const [error,setError] = useState("")
const [loading,setLoading] = useState(false)
const [nowLocal, setNowLocal] = useState("");
const [isGoldPatron, setIsGoldPatron] = useState(false);
const [tasksPostedCount, setTasksPostedCount] = useState(0);
const [userTotalTokens, setUserTotalTokens] = useState(1);

useEffect(() => {
  API.get('/profile/')
    .then((res) => {
      if (res.data) {
        setIsGoldPatron(Boolean(res.data.is_gold_patron));
        setTasksPostedCount(res.data.tasks_posted_count || 0);
        setUserTotalTokens(res.data.total_tokens || 1);
      }
    })
    .catch((err) => {
      console.warn('Failed to load profile for tier check:', err);
    });
}, []);

const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
const [attachmentError, setAttachmentError] = useState<string>("");

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const [form, setForm] = useState<FormState>({
  title: "",
  task_type: 0,
  band: "",
  mode: "online",
  deadline: "",
  price: 0,
  details: "",
  deliverable_format: "Handwritten",
  scope_length: "",
  criteria: "",
  location_hint: "",
  availability_window: "",
  bonus_tokens: 0
})

const updateField = (key: keyof FormState,value:any)=>{
setForm(prev=>({...prev,[key]:value}))
}

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    setAttachmentError("File size exceeds 10MB limit. Please compress or choose a smaller file.");
    setAttachmentFile(null);
    return;
  }

  setAttachmentError("");
  setAttachmentFile(file);
};

const removeFile = () => {
  setAttachmentFile(null);
  setAttachmentError("");
};

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

const shortMin = isGoldPatron ? 50 : 60;

const BANDS = [
  { value: "short", label: isGoldPatron ? "Short (min 50 Master)" : "Short (min 60)", min: shortMin },
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
   Display copy per your brief. displayMin matches BANDS[].min exactly (50/60/120/250). */

const BAND_INFO: Record<string, { title: string; range: string; examples: string; displayMin: number }> = {
  short: { title: "Short", range: "Up to 2 hours", examples: "Notes, Assignments, Quick edits", displayMin: shortMin },
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

if (!form.title.trim()) {
  alert("Please enter a task title")
  return
}

if (!form.task_type) {
  alert("Please select a task category")
  return
}

if (!form.band) {
  alert("Please select a duration band")
  return
}

const band = BANDS.find(b => b.value === form.band)

if (band && form.price < band.min) {
  alert(`Minimum price for ${band.label} band is ${band.min}`)
  return
}

if (!form.deadline) {
  alert("Please select a deadline")
  return
}

// Mode-specific validation
if (form.mode === "online") {
  if (!attachmentFile && !form.details.trim() && !form.criteria.trim()) {
    alert("Please upload your assignment document or provide specific task criteria/instructions.")
    return
  }
} else {
  if (!form.details.trim() && !form.criteria.trim()) {
    alert("Please provide task instructions or criteria.")
    return
  }
  if (!form.location_hint.trim()) {
    alert("Please enter the campus location for this offline task.")
    return
  }
}

if (attachmentFile && attachmentFile.size > 10 * 1024 * 1024) {
  alert("Attachment exceeds the 10MB size limit. Please compress or choose a smaller file.")
  return
}

try{

setLoading(true)
setError("")

const formData = new FormData()
formData.append("title", form.title.trim())
formData.append("task_type", String(form.task_type))
formData.append("band", form.band)
formData.append("mode", form.mode || "online")
formData.append("deadline", form.deadline)
formData.append("price", String(form.price))

const specs = {
  deliverable_format: form.deliverable_format || "Unspecified",
  scope_length: form.scope_length.trim() || "See attached brief",
  criteria: form.criteria.trim() || form.details.trim() || "Follow assignment brief and guidelines",
}
formData.append("preferences", JSON.stringify(specs))

const finalDetails = form.criteria.trim() || form.details.trim() || (attachmentFile ? `Assignment Document: ${attachmentFile.name}` : "")
formData.append("details", finalDetails)

if (form.mode === "offline" || form.mode === "hybrid") {
  formData.append("location_hint", form.location_hint.trim())
  if (form.availability_window) {
    formData.append("availability_window", form.availability_window.trim())
  }
}

if (attachmentFile) {
  formData.append("attachment", attachmentFile)
}

const res = await API.post("/tasks/", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
})

const taskId = res.data.id
router.push(`/pay-escrow/${taskId}`);

}catch(err:any){

console.error("Task creation failed:", err.response?.data)
const errData = err.response?.data
if (typeof errData === "string" && (errData.includes("<!doctype html>") || errData.includes("<html"))) {
  setError("Server encountered an issue creating your gig. Please try again in a moment.");
} else if (typeof errData === "object" && errData !== null) {
  const msg = errData.detail || Object.values(errData).flat().join(" ") || "Request failed";
  setError(String(msg));
} else {
  setError(errData || "Request failed. Please try again.");
}

}finally{
setLoading(false)
}

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

            {/* MODE SELECTION (FIRST) */}
            <div>
              <label className="block text-xs text-zinc-500 mb-2">Task Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={()=>updateField("mode", m.value)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      form.mode === m.value
                        ? "border-indigo-500 bg-indigo-500/15 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_0_20px_-4px_rgba(99,102,241,0.5)] scale-[1.01]"
                        : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white bg-black/20"
                    }`}
                  >
                    <span>{MODE_ICON[m.value]}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* STRUCTURED TASK SPECS & SCOPE */}
            <div className="space-y-4 pt-3 border-t border-white/5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs text-zinc-400 font-medium">
                    Deliverable Format <span className="text-indigo-400">*</span>
                  </label>
                  <span className="text-[11px] text-zinc-500">How solver must deliver</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {DELIVERABLE_FORMATS.map((fmt) => {
                    const isSelected = form.deliverable_format === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => updateField("deliverable_format", fmt.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-indigo-600/15 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.25)] scale-[1.01]"
                            : "bg-black/30 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                        }`}
                      >
                        <div className="text-xl mb-1">{fmt.icon}</div>
                        <div className="text-xs font-semibold">{fmt.label}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{fmt.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs text-zinc-400 font-medium">
                    Work Scope / Volume <span className="text-zinc-500">(e.g. pages, questions, slides)</span>
                  </label>
                  <span className="text-[11px] text-zinc-500">Clear expectations</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 3 Questions / ~4 Pages, or 10 Slides..."
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                  value={form.scope_length}
                  onChange={(e) => updateField("scope_length", e.target.value)}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SCOPE_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateField("scope_length", s)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        form.scope_length === s
                          ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-medium"
                          : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CONDITIONAL: ONLINE (FILE UPLOAD) vs OFFLINE / HYBRID (DESCRIPTION + LOCATION) */}
            {form.mode === "online" ? (
              <div className="space-y-5 pt-3 border-t border-white/5">
                {/* PRIVACY & ACADEMIC SAFETY BANNER */}
                <div className="flex items-start gap-3 p-3.5 bg-amber-500/[0.08] border border-amber-500/25 rounded-xl text-xs text-amber-200/95 leading-relaxed">
                  <span className="text-base shrink-0 mt-0.5">🛡️</span>
                  <div>
                    <span className="font-semibold text-amber-200">Privacy & Academic Safety Tip:</span>
                    <p className="text-zinc-300/90 mt-0.5">
                      Before uploading, please ensure your personal Name, Registration/Roll Number, or Section are removed from the document for your own privacy.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs text-zinc-400 font-medium">
                      Assignment Document / Task File <span className="text-indigo-400">*</span>
                    </label>
                    <span className="text-[11px] text-zinc-500">Max 10 MB</span>
                  </div>

                  {!attachmentFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-36 px-4 transition bg-black/30 border-2 border-dashed border-white/15 rounded-xl cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/[0.02] group">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4 text-center">
                        <span className="text-2xl mb-1.5 text-zinc-400 group-hover:text-indigo-400 group-hover:scale-110 transition-all">📎</span>
                        <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                          <span className="text-indigo-400 font-semibold">Click to upload assignment</span> or drag & drop
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          PDF, Word (.docx), PPT, TXT, ZIP, Images (up to 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-lg shrink-0">
                          📄
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[240px] sm:max-w-md">
                            {attachmentFile.name}
                          </p>
                          <p className="text-xs text-indigo-300 font-mono">
                            {formatFileSize(attachmentFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs font-semibold"
                        title="Remove file"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  )}

                  {attachmentError && (
                    <p className="text-xs text-red-400 mt-2">{attachmentError}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs text-zinc-400 font-medium">
                      Specific Criteria & Instructions <span className="text-indigo-400">*</span>
                    </label>
                    <span className="text-xs text-zinc-500">{form.criteria.length} chars</span>
                  </div>
                  <textarea
                    placeholder="e.g. Include step-by-step working, neat diagrams, comment code thoroughly, follow professor's format guidelines..."
                    rows={3}
                    className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    value={form.criteria}
                    onChange={(e)=>updateField("criteria",e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5 pt-3 border-t border-white/5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs text-zinc-400 font-medium">
                      Specific Criteria & Instructions <span className="text-indigo-400">*</span>
                    </label>
                    <span className="text-xs text-zinc-500">{form.criteria.length} characters</span>
                  </div>
                  <textarea
                    placeholder="Describe specific task instructions, format requirements, and guidelines..."
                    rows={4}
                    className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    value={form.criteria}
                    onChange={(e)=>updateField("criteria",e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 font-medium mb-2">
                    Campus Location <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    placeholder="e.g. Block 34, Central Library, 2nd floor"
                    className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                    value={form.location_hint}
                    onChange={(e)=>updateField("location_hint",e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2 — DURATION & REWARD (FUSED) */}
        <div className="fade-up rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.15)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Duration & Reward</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Select effort level and set your reward amount.</p>
            </div>
            {isGoldPatron ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <Crown size={13} className="text-amber-400 animate-pulse" />
                Gold Tier: ₹50 Short Base Unlocked!
              </span>
            ) : (
              <span className="text-[11px] font-mono text-zinc-400">
                Gold Tier unlocks at 5 tasks ({tasksPostedCount}/5)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {BANDS.map(b => {
              const info = BAND_INFO[b.value]
              const isSelected = form.band === b.value
              return (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => {
                    updateField("band", b.value);
                    if (!form.price || form.price < b.min) {
                      updateField("price", b.min);
                    }
                  }}
                  className={`text-left rounded-xl border p-4 transition-all duration-200 hover:scale-[1.01] ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/[0.1] shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_8px_20px_-8px_rgba(99,102,241,0.4)]"
                      : "border-white/10 hover:border-white/20 bg-black/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-white">{info.title}</p>
                    <span className="text-xs font-mono font-bold text-emerald-400">min ₹{info.displayMin}</span>
                  </div>
                  <p className="text-xs text-indigo-300 mb-2">{info.range}</p>
                  <p className="text-[11px] text-zinc-500 leading-snug">{info.examples}</p>
                </button>
              )
            })}
          </div>

          {/* Embedded Task Price */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-zinc-400 font-medium">Task Reward Amount (₹)</label>
              {selectedBand && (
                <span className="text-[11px] font-mono text-zinc-500">
                  Minimum: <strong className="text-emerald-400">₹{selectedBand.min}</strong>
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">₹</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder={selectedBand ? String(selectedBand.min) : "0"}
                className="w-full p-3.5 pl-9 bg-black/40 border border-white/10 rounded-xl text-xl font-semibold outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                value={form.price || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  updateField("price", value === "" ? 0 : Number(value));
                }}
              />
            </div>

            {showElegantWarning && (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 flex items-center gap-2">
                <span className="text-amber-300 text-xs">⚠️</span>
                <p className="text-xs text-amber-200">
                  Minimum price for this duration is{" "}
                  <span className="font-semibold">₹{selectedBand?.min}</span>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CARD 3 — DEADLINE */}
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
