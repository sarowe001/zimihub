import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import { formatTaka } from "@/lib/money";
import { MIN_TOPUP_TAKA, MAX_TOPUP_TAKA } from "@/lib/actions/billing";
import AmountInput from "./AmountInput";

const ERROR_MESSAGES: Record<string, string> = {
  amount: `সঠিক পরিমাণ দিন (৳${MIN_TOPUP_TAKA} থেকে ৳${MAX_TOPUP_TAKA})`,
  bkash: "bKash পেমেন্ট শুরু করা যায়নি, আবার চেষ্টা করুন",
  nagad: "Nagad পেমেন্ট শুরু করা যায়নি, আবার চেষ্টা করুন",
  cancelled: "পেমেন্ট বাতিল করা হয়েছে",
  execute_failed: "পেমেন্ট নিশ্চিত করা যায়নি",
  not_found: "লেনদেন খুঁজে পাওয়া যায়নি",
  missing_payment: "পেমেন্ট তথ্য পাওয়া যায়নি",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "অপেক্ষমাণ",
  COMPLETED: "সম্পন্ন",
  FAILED: "ব্যর্থ",
  CANCELLED: "বাতিল",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { success, error } = await searchParams;

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">বিলিং</h1>

      {success && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          পেমেন্ট সফল হয়েছে, ব্যালেন্স যোগ হয়েছে ✅
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {ERROR_MESSAGES[error] ?? "কিছু একটা সমস্যা হয়েছে"}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-slate-400">বর্তমান ব্যালেন্স</p>
        <p className="mt-1 text-3xl font-bold text-white">
          {formatTaka(user.balancePoisha)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TopupCard
          title="bKash দিয়ে টাকা যোগ করুন"
          color="pink"
          action="/api/billing/bkash/create"
        />
        <TopupCard
          title="Nagad দিয়ে টাকা যোগ করুন"
          color="orange"
          action="/api/billing/nagad/create"
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 font-semibold text-white">লেনদেনের ইতিহাস</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-500">এখনো কোনো লেনদেন হয়নি</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">মেথড</th>
                  <th className="py-2 pr-4 font-medium">পরিমাণ</th>
                  <th className="py-2 pr-4 font-medium">অবস্থা</th>
                  <th className="py-2 pr-4 font-medium">সময়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 pr-4">{t.method}</td>
                    <td className="py-2 pr-4">৳{Number(t.amountTaka).toLocaleString("bn-BD")}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-2 pr-4 text-slate-500">
                      {t.createdAt.toLocaleString("bn-BD")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TopupCard({
  title,
  color,
  action,
}: {
  title: string;
  color: "pink" | "orange";
  action: string;
}) {
  const buttonColor =
    color === "pink"
      ? "bg-pink-600 hover:bg-pink-500"
      : "bg-orange-600 hover:bg-orange-500";

  return (
    <form
      action={action}
      method="POST"
      className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
    >
      <h3 className="mb-4 font-semibold text-white">{title}</h3>
      <AmountInput min={MIN_TOPUP_TAKA} max={MAX_TOPUP_TAKA} />
      <button
        type="submit"
        className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white transition ${buttonColor}`}
      >
        এগিয়ে যান
      </button>
    </form>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-400/10 text-yellow-300",
    COMPLETED: "bg-emerald-400/10 text-emerald-300",
    FAILED: "bg-red-500/10 text-red-300",
    CANCELLED: "bg-slate-500/10 text-slate-400",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] ?? "bg-slate-500/10 text-slate-400"
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
