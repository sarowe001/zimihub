// ডিপ্লয়ের সময় ডাটাবেস migration চালায়।
//
// DATABASE_URL এখনো সেট করা না থাকলে migration বাদ দিয়ে বিল্ড চালিয়ে যায় —
// যাতে ডাটাবেস যোগ করার আগেই সাইটটা একবার ডিপ্লয় করে দেখা যায়। কিন্তু
// DATABASE_URL সেট থাকা অবস্থায় migration ব্যর্থ হলে বিল্ড ফেল করবে, যাতে
// আসল সমস্যা চাপা না পড়ে।

import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim();

if (!url) {
  console.warn(
    "\n⚠️  DATABASE_URL সেট নেই — migration বাদ দেওয়া হলো।\n" +
      "   সাইট ডিপ্লয় হবে, কিন্তু লগইন/সাইনআপ ও মডেলের তালিকা কাজ করবে না।\n" +
      "   Postgres যোগ করে (যেমন neon.tech) DATABASE_URL বসিয়ে আবার ডিপ্লয় করুন।\n"
  );
  process.exit(0);
}

execSync("prisma migrate deploy", { stdio: "inherit" });
