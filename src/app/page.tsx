import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { listActiveModels } from "@/lib/models";

const FEATURES = [
  {
    title: "এক API, শতাধিক মডেল",
    desc: "OpenAI ও Anthropic উভয় ফরম্যাটে কল করুন — মডেলের নাম বদলান, কোড বদলাতে হবে না।",
  },
  {
    title: "স্বয়ংক্রিয় ফেইলওভার",
    desc: "কোনো প্রোভাইডার ডাউন বা রেট-লিমিটেড হলে জিমিহাব স্বয়ংক্রিয়ভাবে পরবর্তী রুটে পাঠিয়ে দেয়।",
  },
  {
    title: "টাকায় পেমেন্ট",
    desc: "bKash বা Nagad দিয়ে সরাসরি ব্যালেন্স যোগ করুন — কোনো ডলার কার্ড লাগবে না।",
  },
  {
    title: "নিরাপদ API Key",
    desc: "প্রতিটি key হ্যাশ করে সংরক্ষণ করা হয়, প্রয়োজনে যেকোনো সময় রিভোক করুন।",
  },
  {
    title: "লাইভ ব্যবহার মিটারিং",
    desc: "প্রতিটি রিকোয়েস্টের টোকেন ও খরচ রিয়েল-টাইমে ড্যাশবোর্ডে দেখুন।",
  },
  {
    title: "স্ট্রিমিং সাপোর্ট",
    desc: "stream: true দিলে টোকেন আসার সাথে সাথেই পাবেন — দুই ফরম্যাটেই কাজ করে।",
  },
  {
    title: "খরচের সীমা",
    desc: "প্রতিটি API key-তে মাসিক খরচের সীমা বেঁধে দিন, বাজেট কখনো ছাড়াবে না।",
  },
  {
    title: "ফ্রি টোকেন দিয়ে শুরু",
    desc: "সাইনআপ করলেই ২৫ টাকার ফ্রি ব্যালেন্স, কার্ড ছাড়াই এখনই টেস্ট করুন।",
  },
];

function formatPrice(n: number) {
  if (n === 0) return "ফ্রি";
  return `৳${n.toLocaleString("bn-BD")}`;
}

export default async function Home() {
  const models = await listActiveModels();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pt-20 pb-24 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.15),_transparent_60%)]"
          />
          <div className="mx-auto max-w-4xl text-center">
            <span className="mb-6 inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-xs font-medium text-emerald-300">
              🎉 সাইনআপে ২৫ টাকা ফ্রি ব্যালেন্স
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              এজেন্ট ও ডেভেলপারদের জন্য
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                সেরা দামে AI টোকেন
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              এক API key দিয়ে GPT, Claude, DeepSeek, Gemini সহ শতাধিক মডেল ব্যবহার
              করুন। বাংলাদেশি bKash ও Nagad দিয়ে সরাসরি টাকায় পেমেন্ট করুন।
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="w-full rounded-lg bg-emerald-500 px-6 py-3 text-center font-semibold text-slate-950 transition hover:bg-emerald-400 sm:w-auto"
              >
                ফ্রি শুরু করুন
              </Link>
              <Link
                href="/docs"
                className="w-full rounded-lg border border-white/15 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/5 sm:w-auto"
              >
                ডকুমেন্টেশন দেখুন
              </Link>
            </div>

            <div className="mx-auto mt-14 max-w-2xl rounded-xl border border-white/10 bg-slate-900/70 p-5 text-left shadow-2xl">
              <div className="mb-3 flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <span className="h-3 w-3 rounded-full bg-green-500/70" />
              </div>
              <pre className="overflow-x-auto font-mono text-sm text-emerald-300">
{`curl https://zimihub.com/api/v1/chat/completions \\
  -H "Authorization: Bearer zh_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-5",
    "messages": [{"role": "user", "content": "আসসালামু আলাইকুম!"}]
  }'`}
              </pre>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-white/10 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-white">
              কেন জিমিহাব?
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                  <p className="text-sm text-slate-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Models & pricing */}
        <section id="models" className="border-t border-white/10 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold text-white">
              মডেল ও দাম
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-slate-400">
              দাম প্রতি ১০ লক্ষ (মিলিয়ন) টোকেনে টাকায় দেখানো হয়েছে।
            </p>
            <div className="mt-10 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">মডেল</th>
                    <th className="px-4 py-3 font-medium">প্রোভাইডার</th>
                    <th className="px-4 py-3 font-medium">ইনপুট</th>
                    <th className="px-4 py-3 font-medium">আউটপুট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {models.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 font-medium text-white">
                        {m.displayName}
                        {m.isFree && (
                          <span className="ml-2 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                            ফ্রি
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{m.provider.name}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {formatPrice(Number(m.inputPricePerMTokTaka))}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {formatPrice(Number(m.outputPricePerMTokTaka))}
                      </td>
                    </tr>
                  ))}
                  {models.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        শীঘ্রই মডেল যোগ করা হবে
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="border-t border-white/10 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-10 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              বাংলাদেশি পেমেন্ট মেথডে ব্যালেন্স যোগ করুন
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-400">
              কোনো আন্তর্জাতিক কার্ড ছাড়াই bKash বা Nagad দিয়ে সরাসরি টাকা দিয়ে
              পেমেন্ট করুন, সাথে সাথে ব্যালেন্স যোগ হয়ে যাবে।
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="rounded-lg bg-pink-600 px-5 py-2.5 font-semibold text-white">
                bKash
              </span>
              <span className="rounded-lg bg-orange-600 px-5 py-2.5 font-semibold text-white">
                Nagad
              </span>
            </div>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
            >
              এখনই শুরু করুন
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
