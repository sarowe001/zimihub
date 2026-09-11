// টাকা <-> পয়সা কনভার্শন হেল্পার। ব্যালেন্স সবসময় Int (পয়সা) হিসেবে DB-তে থাকে
// যাতে ভাসমান-বিন্দু (floating point) সংক্রান্ত হিসাবের ভুল না হয়।

export function takaToPoisha(taka: number): number {
  return Math.round(taka * 100);
}

export function poishaToTaka(poisha: number): number {
  return poisha / 100;
}

export function formatTaka(poisha: number): string {
  const taka = poishaToTaka(poisha);
  return new Intl.NumberFormat("bn-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(taka);
}
