import Link from "next/link";
import { auth } from "@/auth";

export default async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-bold text-white">
          জিমি<span className="text-emerald-400">হাব</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <Link href="/#models" className="hover:text-white">
            মডেল ও দাম
          </Link>
          <Link href="/#features" className="hover:text-white">
            ফিচার
          </Link>
          <Link href="/docs" className="hover:text-white">
            ডকুমেন্টেশন
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              ড্যাশবোর্ড
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-slate-300 hover:text-white sm:block"
              >
                লগইন
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                ফ্রি শুরু করুন
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
