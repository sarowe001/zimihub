import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="mb-3 text-lg font-bold text-white">
              জিমি<span className="text-emerald-400">হাব</span>
            </div>
            <p className="text-sm text-slate-400">
              এজেন্ট ও ডেভেলপারদের জন্য এক API-তে সব AI মডেল, সাশ্রয়ী দামে।
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">প্রোডাক্ট</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/#models" className="hover:text-white">
                  মডেল ও দাম
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white">
                  ডকুমেন্টেশন
                </Link>
              </li>
              <li>
                <Link href="/dashboard/billing" className="hover:text-white">
                  ব্যালেন্স যোগ করুন
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">কোম্পানি</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/about" className="hover:text-white">
                  আমাদের সম্পর্কে
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  যোগাযোগ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  শর্তাবলী
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">পেমেন্ট</h3>
            <div className="flex gap-2">
              <span className="rounded-md bg-pink-600/20 px-3 py-1.5 text-xs font-semibold text-pink-300">
                bKash
              </span>
              <span className="rounded-md bg-orange-600/20 px-3 py-1.5 text-xs font-semibold text-orange-300">
                Nagad
              </span>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} জিমিহাব। সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
}
