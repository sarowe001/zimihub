import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <Link href="/" className="mb-6 block text-center text-xl font-bold text-white">
          জিমি<span className="text-emerald-400">হাব</span>
        </Link>
        <h1 className="mb-1 text-center text-2xl font-semibold text-white">
          ফ্রি অ্যাকাউন্ট খুলুন
        </h1>
        <p className="mb-6 text-center text-sm text-slate-400">
          সাইনআপ করলেই পাচ্ছেন ২৫ টাকার ফ্রি ব্যালেন্স
        </p>

        <SignupForm />

        <p className="mt-6 text-center text-sm text-slate-400">
          আগে থেকেই অ্যাকাউন্ট আছে?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">
            লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}
