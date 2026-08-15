"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();

  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  console.log("SUBMIT CLICKED");

  setLoading(true);
  setError("");

  try {

    console.log("CALLING REGISTER");

    await register(
      username,
      password,
      confirmPassword
    );

    console.log("REGISTER SUCCESS");

    router.push("/login");

  } catch (err: any) {

    console.error("REGISTER ERROR", err);

    setError(err.message || "Signup failed");

  } finally {
    setLoading(false);
  }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-500/[0.06] blur-[120px] rounded-full pointer-events-none" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-white/[0.025] border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-5">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect
                width="24"
                height="24"
                rx="6"
                className="fill-forge-accent"
              />
              <path
                d="M12 5.5 L18 9 V15 L12 18.5 L6 15 V9 Z"
                stroke="white"
                strokeWidth="1.4"
                strokeLinejoin="round"
                fill="none"
              />
              <circle
                cx="12"
                cy="12"
                r="1.8"
                fill="white"
              />
            </svg>

            <span className="font-mono font-extrabold text-xl tracking-wider">
              GigHive
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight">
            Create your account
          </h1>

          <p className="text-sm text-zinc-500 mt-2">
            Join GigHive and start completing campus gigs.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Username */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-zinc-200 mb-1.5">
            Username
          </label>

          <p className="text-xs text-zinc-500 mb-2">
            Choose the username you'll use to log in to GigHive.
          </p>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            required
          />
        </div>

        {/* Password */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-zinc-200 mb-1.5">
            Password
          </label>

          <p className="text-xs text-zinc-500 mb-2">
            Create a password you'll use to access your account.
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            required
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-7">
          <label className="block text-sm font-semibold text-zinc-200 mb-1.5">
            Confirm Password
          </label>

          <p className="text-xs text-zinc-500 mb-2">
            Re-enter your password to make sure both match.
          </p>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            required
          />
        </div>

        {/* Signup */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/10"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        {/* Login */}
        <p className="text-center text-sm text-zinc-500 mt-6">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            Log in
          </a>
        </p>
      </form>
    </main>
  );
}