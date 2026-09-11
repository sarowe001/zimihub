import Link from "next/link";
import { requireUser } from "@/lib/requireUser";
import { formatTaka } from "@/lib/money";
import { signOutAction } from "@/lib/actions/signout";

const NAV_ITEMS = [
  { href: "/dashboard", label: "ওভারভিউ" },
  { href: "/dashboard/keys", label: "API Key" },
  { href: "/dashboard/usage", label: "ব্যবহার" },
  { href: "/dashboard/billing", label: "বিলিং" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const navItems =
    user.role === "ADMIN"
      ? [...NAV_ITEMS, { href: "/dashboard/admin", label: "এডমিন" }]
      : NAV_ITEMS;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="hidden w-60 shrink-0 border-r border-white/10 p-4 md:block">
        <Link href="/" className="mb-8 block px-2 text-lg font-bold text-white">
          জিমি<span className="text-emerald-400">হাব</span>
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="text-sm text-slate-400">
            স্বাগতম, <span className="text-white">{user.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-300">
              ব্যালেন্স: {formatTaka(user.balancePoisha)}
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
              >
                লগআউট
              </button>
            </form>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-white/10 px-4 py-2 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
