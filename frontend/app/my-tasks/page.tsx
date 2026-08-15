"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function MyTasksPage() {
  const [activeTab, setActiveTab] = useState("posted");
  const [tasks, setTasks] = useState([]);
  const [revisionTaskId, setRevisionTaskId] = useState<number | null>(null);
  const [revisionNote, setRevisionNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const { user } = useAuth();
  const router = useRouter();


    const tabs = [
    "posted",
    "accepted",
    "completed",
    "failed",
  ];
    useEffect(() => {
    API.get("/my-tasks/")
        .then((res) => {
            console.log("MY TASKS:", res.data);
            setTasks(res.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
}, []);
  // Poll while a refund is pending so the UI updates automatically
  useEffect(() => {
    const hasPendingRefund = tasks.some(
      (task: any) => task.payment_status === "refund_pending"
    );

    if (!hasPendingRefund) return;

    const interval = setInterval(async () => {
      try {
        const res = await API.get("/my-tasks/");
        setTasks(res.data);
      } catch (err) {
        console.error("Refund status polling failed:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [tasks]);
   const postedTasks = tasks.filter(
    (task: any) => task.giver === user?.username
  );

    const acceptedTasks = tasks.filter(
    (task: any) =>
    task.taker === user?.username &&
    (task.state === "ACCEPTED" ||
     task.state === "SUBMITTED")
);
    

    const completedTasks = tasks.filter(
    (task: any) =>
    task.taker === user?.username &&
    task.state === "COMPLETED"
);

    const failedTasks = tasks.filter(
    (task: any) =>
    task.taker === user?.username &&
    task.state === "FAILED"
);
    const handleSubmitTask = async () => {
  if (!selectedTask) return;

  const formData = new FormData();

  formData.append(
    "submission_note",
    submissionNote
  );

  if (submissionFile) {
    formData.append(
      "submission_file",
      submissionFile
    );
  }

  try {
    await API.post(
      `/tasks/${selectedTask.id}/submit/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    alert("Task submitted successfully");

    setSelectedTask(null);

    window.location.reload();

  } catch (err: any) {
    console.error(err);
    console.log(err.response?.data);
    alert(JSON.stringify(err.response?.data));
}
  };const handleRevisionRequest = async () => {
    if (!revisionTaskId) return;

    try {
      await API.post(
        `/tasks/${revisionTaskId}/request-revision/`,
        {
          revision_note: revisionNote,
        }
      );

      const res = await API.get("/my-tasks/");
      setTasks(res.data);

      setRevisionTaskId(null);
      setRevisionNote("");

    } catch (err) {
      console.error(err);
      alert("Failed to send revision request.");
    }
};
  const handleCompleteTask = async (taskId: number) => {
  try {
    await API.post(`/tasks/${taskId}/complete/`);

    const res = await API.get("/my-tasks/");
    setTasks(res.data);
  } catch (err) {
    console.error(err);
    alert("Failed to approve task.");
  }
};
  const handleCancelTask = async (
  taskId: number,
  role: "taker" | "giver",
  state: string 
) => {
  const message =
  role === "taker"
    ? "Cancel this task? Your commitment token will be burned, and the giver's payment will be marked for refund."
    : state === "OPEN"
      ? "Cancel this task? Your payment will be refunded."
      : "Cancel this task? Your commitment token will be burned, and your payment will be marked for refund.";
  const confirmed = window.confirm(message);

  if (!confirmed) return;

  try {
    await API.post(`/tasks/${taskId}/cancel/`);

    const res = await API.get("/my-tasks/");
    setTasks(res.data);

    alert("Task cancelled successfully.");
  } catch (err: any) {
    console.error(err);
    console.log(err.response?.data);

    alert(
      err.response?.data?.detail ||
      "Failed to cancel task."
    );
  }
};

  // ---------- Presentation-only helpers (no business logic, no new state) ----------

  const statusStyles: Record<string, string> = {
    ACCEPTED: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    SUBMITTED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    COMPLETED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    FAILED: "bg-red-500/10 text-red-300 border-red-500/30",
  };

  const getStatusStyle = (state: string) =>
    statusStyles[state] ||
    "bg-zinc-500/10 text-zinc-300 border-zinc-500/30";

  const tabLabels: Record<string, string> = {
    posted: "Posted",
    accepted: "Accepted",
    completed: "Completed",
    failed: "Failed",
  };

  const tabCounts: Record<string, number> = {
    posted: postedTasks.length,
    accepted: acceptedTasks.length,
    completed: completedTasks.length,
    failed: failedTasks.length,
  };

  // Formats an existing deadline field, if the backend provides one. Returns
  // null (renders nothing) when the field is absent or unparseable.
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Purely presentational countdown derived from an existing deadline value.
  const getDeadlineCountdown = (dateStr: string) => {
    const deadline = new Date(dateStr);
    if (isNaN(deadline.getTime())) return null;
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: "Expired", expired: true };
    if (diffDays === 0) return { label: "Due today", expired: false };
    return {
      label: `${diffDays} day${diffDays === 1 ? "" : "s"} left`,
      expired: false,
    };
  };

  // Mode / Band pills — only render when the backend already provides them.
  const TaskPills = ({ task }: { task: any }) => {
    if (!task.mode && !task.band) return null;
    return (
      <div className="flex flex-wrap gap-2 mb-3">
        {task.mode && (
          <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {task.mode}
          </span>
        )}
        {task.band && (
          <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
            {task.band}
          </span>
        )}
      </div>
    );
  };

  // Deadline + counterpart (giver / taker) meta grid — only shows fields
  // that already exist on the task object.
  const TaskMeta = ({
    task,
    personLabel,
    personValue,
  }: {
    task: any;
    personLabel: string;
    personValue: any;
  }) => {
    const deadlineFormatted = task.deadline ? formatDate(task.deadline) : null;
    const countdown =
      task.deadline && task.state === "ACCEPTED"
        ? getDeadlineCountdown(task.deadline)
        : null;

    return (
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-800/70 text-sm">
        {deadlineFormatted && (
          <div>
            <p className="text-zinc-500 text-xs mb-1">🗓 Deadline</p>
            <p className="text-zinc-200">{deadlineFormatted}</p>
            {countdown && (
              <p
                className={`text-xs mt-1 font-medium ${
                  countdown.expired ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {countdown.label}
              </p>
            )}
          </div>
        )}
        <div>
          <p className="text-zinc-500 text-xs mb-1">{personLabel}</p>
          <p className="text-zinc-200">{personValue}</p>
        </div>
      </div>
    );
  };

  const RewardTag = ({ price }: { price: number }) => (
    <div>
      <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">
        Reward
      </p>
      <p className="text-2xl font-bold text-white">
        ₹<span className="bg-gradient-to-r from-purple-300 to-white bg-clip-text text-transparent">{price}</span>
      </p>
    </div>
  );

  const cardHoverClass =
    "hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all";

  const EmptyState = ({ message }: { message: string }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center py-20 px-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30"
    >
      <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-7 h-7 text-purple-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 13h6m-6 4h6M9 5h6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z"
          />
        </svg>
      </div>
      <p className="text-zinc-200 font-medium">{message}</p>
      <p className="text-zinc-500 text-sm mt-1">
        Nothing to show here yet.
      </p>
    </motion.div>
  );

  const SkeletonCard = ({ i }: { i: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: i * 0.05 }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 mb-4 animate-pulse"
    >
      <div className="h-4 w-1/3 bg-zinc-800 rounded mb-3" />
      <div className="h-3 w-1/4 bg-zinc-800 rounded mb-2" />
      <div className="h-3 w-1/5 bg-zinc-800 rounded" />
    </motion.div>
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-10 md:px-10 lg:px-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            My Tasks
          </h1>
          <p className="text-zinc-400 mt-2">
            View and manage all your current and previous tasks.
          </p>
          {user?.username && (
            <p className="text-zinc-600 text-sm mt-1">@{user.username}</p>
          )}
        </div>

        {/* Stats — derived only from data already loaded */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {tabs.map((tab) => (
            <div
              key={tab}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 shadow-sm"
            >
              <p className="text-zinc-500 text-xs uppercase tracking-wide">
                {tabLabels[tab]}
              </p>
              <p className="text-2xl font-semibold mt-1 text-white">
                {tabCounts[tab]}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="relative flex gap-2 mb-8 border-b border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-3 text-sm font-medium transition-colors duration-200 rounded-t-xl ${
                activeTab === tab
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tabLabels[tab]}
              {activeTab === tab && (
                <motion.div
                  layoutId="myTasksActiveTab"
                  className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-purple-500 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div>
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} i={i} />
            ))}
          </div>
        )}

        {!loading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "posted" && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-semibold text-zinc-100">
                      Total Paid: ₹
                      {postedTasks.reduce(
                        (sum: number, task: any) => sum + task.price,
                        0
                      )}
                    </h2>
                  </div>

                  {postedTasks.length === 0 ? (
                    <EmptyState message="No posted tasks yet." />
                  ) : (
                    postedTasks.map((task: any, i: number) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        whileHover={{ y: -2 }}
                        className={`border border-zinc-800 bg-zinc-900/40 rounded-2xl p-5 mb-4 shadow-sm ${cardHoverClass}`}
                      >
                        <TaskPills task={task} />

                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <h3 className="font-semibold text-lg text-white">
                            {task.title}
                          </h3>
                          <span
                            className={`text-xs font-medium px-3 py-1 rounded-full border ${getStatusStyle(
                              task.state
                            )}`}
                          >
                            {task.state}
                          </span>
                        </div>

                        <div className="mt-3">
                          <RewardTag price={task.price} />
                        </div>

                        <TaskMeta
                          task={task}
                          personLabel="Accepted By"
                          personValue={task.taker || "No one yet"}
                        />
                         {(task.state === "OPEN" || task.state === "ACCEPTED") && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCancelTask(task.id, "giver", task.state)}
                            className="bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-medium mt-4 transition-colors"
                          >
                            Cancel Task
                          </motion.button>
                        )}

                        {/* PAYMENT REJECTED */}
                          {task.payment_status === "rejected" && (
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                              <p className="text-red-400 font-medium">
                                Payment Rejected
                              </p>

                              <p className="text-zinc-400 text-sm mt-2">
                                Payment not verified. Please check your payment details and try again.
                              </p>
                            </div>
                          )}

                    {/* ---------------- REFUND STATUS ---------------- */}

                        {task.payment_status === "refund_pending" && (
                          <div className="mt-4 pt-4 border-t border-zinc-800">
                            {!task.refund_upi_id ? (
                              <>
                                <p className="text-amber-400 font-medium">
                                  Refund Available
                                </p>

                                <p className="text-zinc-500 text-sm mt-2">
                                  Add your Refund UPI to receive your refund.
                                </p>

                                <button
                                  onClick={() => router.push("/upi-setup?type=refund")}
                                  className="mt-3 bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-medium"
                                >
                                  Add Refund UPI
                                </button>
                              </>
                            ) : (
                              <>
                                <p className="text-amber-400 font-medium">
                                  Refund Pending
                                </p>

                                <p className="text-zinc-500 text-sm mt-2">
                                  Waiting for admin to process your refund.
                                </p>
                              </>
                            )}
                          </div>
                        )}

                        {task.payment_status === "refunded" && (
                          <div className="mt-4 pt-4 border-t border-zinc-800">
                            <p className="text-emerald-400 font-medium">
                              Refund Completed
                            </p>

                            <p className="text-zinc-500 text-sm mt-2">
                              Refund sent to:
                            </p>

                            <p className="text-zinc-300 text-sm">
                              {task.refund_upi_id}
                            </p>
                          </div>
                        )}
                        {task.state === "SUBMITTED" && (
                          <div className="mt-4 pt-4 border-t border-zinc-800">
                            <p className="text-emerald-400 text-sm font-medium">
                              ✓ Work Submitted
                            </p>

                            <p className="mt-3 text-sm text-zinc-500">
                              Submission Notes
                            </p>
                            <p className="text-zinc-300 text-sm mt-1">
                              {task.submission_note || "No notes"}
                            </p>

                            {task.submission_file && (
                              <a
                                href={task.submission_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 underline underline-offset-2 text-sm block mt-3 transition-colors"
                              >
                                Download Submission
                              </a>
                            )}

                            <div className="flex flex-wrap items-start gap-3 mt-4">
                              {task.revision_count >= 2 ? (
                                <div className="flex flex-col gap-1.5">
                                  <button
                                    disabled
                                    title="Maximum of 2 revision requests reached."
                                    className="bg-zinc-800/50 text-zinc-500 border border-zinc-700/60 px-4 py-2 rounded-xl text-sm font-medium cursor-not-allowed"
                                  >
                                    Request Changes (Disabled)
                                  </button>
                                  <p className="text-xs text-zinc-600">
                                    Maximum of 2 revision requests reached.
                                  </p>
                                </div>
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setRevisionTaskId(task.id)}
                                  className="bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                                >
                                  Request Changes
                                </motion.button>
                              )}

                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleCompleteTask(task.id)}
                                className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                              >
                                Approve Task
                              </motion.button>
                            </div>
                          </div>
                        )}

                        {task.state === "ACCEPTED" &&
                          task.revision_count > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                              <p className="text-amber-400 font-medium text-sm">
                                Revision Request Sent
                              </p>

                              <p className="text-zinc-500 text-sm mt-2">
                                Waiting for updated submission...
                              </p>

                              <p className="mt-3 text-sm text-zinc-400 font-medium">
                                Last Revision
                              </p>

                              <p className="text-zinc-300 text-sm mt-1">
                                {task.revision_note}
                              </p>

                              <p className="text-xs text-zinc-600 mt-2">
                                Revision {task.revision_count}/2
                              </p>
                            </div>
                          )}

                        <AnimatePresence>
                          {revisionTaskId === task.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="mt-4 pt-4 border-t border-zinc-800 overflow-hidden"
                            >
                              <p className="mb-2 text-sm text-zinc-300">
                                Describe the required changes
                              </p>

                              <textarea
                                value={revisionNote}
                                onChange={(e) =>
                                  setRevisionNote(e.target.value)
                                }
                                placeholder="Describe the required changes..."
                                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-600 transition-colors"
                                rows={4}
                              />

                              <div className="flex gap-3 mt-3">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={handleRevisionRequest}
                                  className="bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                                >
                                  Send Revision Request
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setRevisionTaskId(null);
                                    setRevisionNote("");
                                  }}
                                  className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                                >
                                  Cancel
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "accepted" && (
                <div>
                  {acceptedTasks.length === 0 ? (
                    <EmptyState message="No accepted tasks." />
                  ) : (
                    acceptedTasks.map((task: any, i: number) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        whileHover={{ y: -2 }}
                        className={`border border-zinc-800 bg-zinc-900/40 rounded-2xl p-5 mb-4 shadow-sm ${cardHoverClass}`}
                      >
                        <TaskPills task={task} />

                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <h3 className="font-semibold text-lg text-white">
                            {task.title}
                          </h3>
                          <span
                            className={`text-xs font-medium px-3 py-1 rounded-full border ${getStatusStyle(
                              task.state
                            )}`}
                          >
                            {task.state}
                          </span>
                        </div>

                        <div className="mt-3">
                          <RewardTag price={task.price} />
                        </div>

                        <TaskMeta
                          task={task}
                          personLabel="Giver"
                          personValue={task.giver || "Unknown"}
                        />

                        {/* ---------------- NORMAL ACCEPTED ---------------- */}
                        {task.state === "ACCEPTED" &&
                          task.revision_count === 0 && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedTask(task)}
                              className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-medium mt-4 transition-colors"
                            >
                              Submit Work
                            </motion.button>
                          )}

                        {/* ---------------- REVISION REQUESTED ---------------- */}
                        {task.state === "ACCEPTED" &&
                          task.revision_count > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                              <p className="text-amber-400 font-medium text-sm">
                                ⚠ Revision Requested ({task.revision_count}
                                /2)
                              </p>

                              <p className="text-zinc-300 text-sm mt-2">
                                {task.revision_note}
                              </p>

                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedTask(task)}
                                className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-medium mt-4 transition-colors"
                              >
                                Submit Updated Work
                              </motion.button>
                            </div>
                          )}

                        {task.state === "ACCEPTED" && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleCancelTask(task.id, "taker", task.state)}
                              className="bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-medium mt-4 transition-colors"
                            >
                              Cancel Task
                            </motion.button>
                          )}

                        {/* ---------------- SUBMITTED ---------------- */}
                        {task.state === "SUBMITTED" && (
                          <div className="mt-4 pt-4 border-t border-zinc-800">
                            <p className="text-emerald-400 text-sm font-medium">
                              ✓ Work Submitted
                            </p>

                            <p className="text-zinc-400 text-sm mt-1">
                              Waiting for task owner review.
                            </p>

                            <p className="text-zinc-600 text-xs mt-1">
                              Auto-completes after 24 hours if no action is
                              taken.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "completed" && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-100 mb-5">
                    Total Earnings: ₹
                    {completedTasks.reduce(
                      (sum: number, task: any) => sum + task.price,
                      0
                    )}
                  </h2>

                  {completedTasks.length === 0 ? (
                    <EmptyState message="No completed tasks." />
                  ) : (
                    completedTasks.map((task: any, i: number) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        whileHover={{ y: -2 }}
                        className={`border border-zinc-800 bg-zinc-900/40 rounded-2xl p-5 mb-4 shadow-sm ${cardHoverClass}`}
                      >
                        <TaskPills task={task} />

                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <h3 className="font-semibold text-lg text-white">
                            {task.title}
                          </h3>
                          <span className="text-xs font-medium px-3 py-1 rounded-full border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                            Completed
                          </span>
                        </div>

                        <div className="mt-3">
                          <RewardTag price={task.price} />
                        </div>

                        <TaskMeta
                          task={task}
                          personLabel="Giver"
                          personValue={task.giver}
                        />

                        <p className="text-emerald-400 text-sm mt-4">
                          ✓ Work Approved
                        </p>

                        <div className="mt-4 pt-4 border-t border-zinc-800">
                          <p className="text-zinc-500 text-sm mb-2">
                            Payment Status
                          </p>

                          {task.payment_status === "paid_out" ? (
                            <>
                              <p className="text-emerald-400 font-medium text-sm">
                                🟢 Completed
                              </p>
                              <p className="text-zinc-500 text-sm mt-1">
                                Your payment has been successfully
                                transferred to your registered UPI-ID.
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-amber-400 font-medium text-sm">
                                🟡 Processing
                              </p>
                              <p className="text-zinc-500 text-sm mt-1">
                                Your payment request has been initiated. the
                                amount will be transferred to your registered
                                UPI-ID.
                              </p>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "failed" && (
                <div>
                  {failedTasks.length === 0 ? (
                    <EmptyState message="No failed tasks." />
                  ) : (
                    failedTasks.map((task: any, i: number) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        whileHover={{ y: -2 }}
                        className={`border border-zinc-800 bg-zinc-900/40 rounded-2xl p-5 mb-4 shadow-sm ${cardHoverClass}`}
                      >
                        <TaskPills task={task} />

                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <h3 className="font-semibold text-lg text-white">
                            {task.title}
                          </h3>
                          <span className="text-xs font-medium px-3 py-1 rounded-full border bg-red-500/10 text-red-300 border-red-500/30">
                            Failed
                          </span>
                        </div>

                        <div className="mt-3">
                          <RewardTag price={task.price} />
                        </div>

                        <TaskMeta
                          task={task}
                          personLabel="Giver"
                          personValue={task.giver}
                        />

                        <p className="text-red-400 text-sm mt-4">
                          Deadline Missed
                        </p>

                        <p className="text-zinc-500 text-sm mt-1">
                          Commitment token deducted.
                        </p>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* Submit Work modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-[500px] shadow-2xl"
            >
              <h2 className="text-xl font-semibold mb-4 text-white">
                Submit Work
              </h2>

              <label className="block text-sm text-zinc-400 mb-2">
                Submission Note *
              </label>
              <textarea
                value={submissionNote}
                onChange={(e) => setSubmissionNote(e.target.value)}
                placeholder="Add submission note"
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 outline-none rounded-xl p-3 mb-4 text-sm text-zinc-100 placeholder-zinc-600 transition-colors"
              />

              <label className="block text-sm text-zinc-400 mb-2">
                Attach File (optional)
              </label>
              <label className="flex items-center justify-between gap-3 border border-dashed border-zinc-700 hover:border-purple-500/40 rounded-xl px-4 py-3 cursor-pointer transition-colors">
                <span className="text-sm text-zinc-400 truncate">
                  {submissionFile ? submissionFile.name : "Choose a file"}
                </span>
                <span className="text-xs font-medium text-purple-400 shrink-0">
                  Browse
                </span>
                <input
                  type="file"
                  onChange={(e) =>
                    setSubmissionFile(
                      e.target.files ? e.target.files[0] : null
                    )
                  }
                  className="hidden"
                />
              </label>
              <p className="text-xs text-zinc-600 mt-2">
                Accepted: PDF · ZIP · DOCX · Images
              </p>

              <div className="flex gap-3 mt-5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitTask}
                  className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Submit
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTask(null)}
                  className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
