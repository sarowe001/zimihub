import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { error } = await searchParams;

  async function loginAction(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/dashboard",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/login?error=1");
      }
      throw err;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <Link href="/" className="mb-6 block text-center text-xl font-bold text-white">
          জিমি<span className="text-emerald-400">হাব</span>
        </Link>
        <h1 className="mb-1 text-center text-2xl font-semibold text-white">
          লগইন করুন
        </h1>
        <p className="mb-6 text-center text-sm text-slate-400">
          আপনার অ্যাকাউন্টে প্রবেশ করে ড্যাশবোর্ড দেখুন
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে
          </div>
        )}

        <form action={loginAction} className="space-y-4">
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
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            লগইন
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          নতুন এখানে?{" "}
          <Link href="/signup" className="text-emerald-400 hover:underline">
            ফ্রি অ্যাকাউন্ট খুলুন
          </Link>
        </p>
      </div>
    </div>
  );
}
