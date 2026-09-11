"use client";

import { useActionState } from "react";
import { signupAction, type SignupState } from "@/lib/actions/auth";

const initialState: SignupState = {};

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm text-slate-300">নাম</label>
        <input
          type="text"
          name="name"
          required
          placeholder="আপনার নাম"
          className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-300">ইমেইল</label>
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-300">পাসওয়ার্ড</label>
        <input
          type="password"
          name="password"
          required
          placeholder="কমপক্ষে ৬ অক্ষর"
          className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {pending ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "ফ্রি অ্যাকাউন্ট খুলুন"}
      </button>
    </form>
  );
}
