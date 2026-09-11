"use client";

import { useState } from "react";

const AMOUNT_PRESETS = [50, 100, 300, 500, 1000];

export default function AmountInput({
  min,
  max,
}: {
  min: number;
  max: number;
}) {
  const [amount, setAmount] = useState<string>("");

  return (
    <div className="mb-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {AMOUNT_PRESETS.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => setAmount(String(amt))}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              amount === String(amt)
                ? "border-emerald-400 text-emerald-300"
                : "border-white/10 text-slate-300 hover:border-white/30"
            }`}
          >
            ৳{amt}
          </button>
        ))}
      </div>
      <input
        type="number"
        name="amount"
        min={min}
        max={max}
        step="1"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={`টাকার পরিমাণ (৳${min}-৳${max})`}
        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
      />
    </div>
  );
}
