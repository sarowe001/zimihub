"use client";

import { useActionState, useState } from "react";
import { createApiKeyAction, type CreateKeyState } from "@/lib/actions/apiKeys";

const initialState: CreateKeyState = {};

export default function CreateKeyForm() {
  const [state, formAction, pending] = useActionState(
    createApiKeyAction,
    initialState
  );
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 font-semibold text-white">নতুন API Key তৈরি করুন</h2>

      {state.fullKey ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            এই key শুধু একবারই দেখানো হবে — এখনই কপি করে নিরাপদে সংরক্ষণ করুন।
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 p-3">
            <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-emerald-300">
              {state.fullKey}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(state.fullKey ?? "");
                setCopied(true);
              }}
              className="shrink-0 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
            >
              {copied ? "কপি হয়েছে!" : "কপি করুন"}
            </button>
          </div>
        </div>
      ) : (
        <form action={formAction} className="space-y-3">
          {state.error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {state.error}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              name="name"
              required
              placeholder="যেমন: আমার প্রোডাকশন key"
              className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />
            <input
              type="number"
              name="monthlyLimit"
              min={1}
              step="1"
              placeholder="মাসিক সীমা ৳ (ঐচ্ছিক)"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400 sm:w-56"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {pending ? "তৈরি হচ্ছে..." : "তৈরি করুন"}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            মাসিক সীমা দিলে ওই key দিয়ে প্রতি মাসে তার বেশি খরচ হবে না।
          </p>
        </form>
      )}
    </div>
  );
}
