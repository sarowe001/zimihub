import Link from "next/link";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import { formatTaka } from "@/lib/money";
import UsageChart from "./UsageChart";

export default async function DashboardPage() {
  const user = await requireUser();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [activeKeyCount, logsLast7Days, totalRequests, recentLogs] =
    await Promise.all([
      prisma.apiKey.count({ where: { userId: user.id, revoked: false } }),
      prisma.usageLog.findMany({
        where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, costPoisha: true },
      }),
      prisma.usageLog.count({ where: { userId: user.id } }),
      prisma.usageLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const chartMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toLocaleDateString("bn-BD", { month: "short", day: "numeric" });
    chartMap.set(key, 0);
  }
  for (const log of logsLast7Days) {
    const key = log.createdAt.toLocaleDateString("bn-BD", {
      month: "short",
      day: "numeric",
    });
    chartMap.set(key, (chartMap.get(key) ?? 0) + log.costPoisha / 100);
  }
  const chartData = Array.from(chartMap.entries()).map(([day, taka]) => ({
    day,
    taka: Math.round(taka * 100) / 100,
  }));

  const spentLast7Days = logsLast7Days.reduce((sum, l) => sum + l.costPoisha, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">ওভারভিউ</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="বর্তমান ব্যালেন্স" value={formatTaka(user.balancePoisha)} />
        <StatCard label="গত ৭ দিনের খরচ" value={formatTaka(spentLast7Days)} />
        <StatCard
          label="মোট রিকোয়েস্ট"
          value={totalRequests.toLocaleString("bn-BD")}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 font-semibold text-white">গত ৭ দিনের খরচ</h2>
        <UsageChart data={chartData} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/keys"
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06]"
        >
          <h3 className="font-semibold text-white">
            API Key ব্যবস্থাপনা {activeKeyCount > 0 && `(${activeKeyCount})`}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            নতুন API key তৈরি করুন বা পুরনোটি রিভোক করুন
          </p>
        </Link>
        <Link
          href="/dashboard/billing"
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06]"
        >
          <h3 className="font-semibold text-white">ব্যালেন্স যোগ করুন</h3>
          <p className="mt-1 text-sm text-slate-400">
            bKash অথবা Nagad দিয়ে টাকা টপ-আপ করুন
          </p>
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">সাম্প্রতিক ব্যবহার</h2>
          <Link href="/dashboard/usage" className="text-sm text-emerald-400 hover:underline">
            সব দেখুন
          </Link>
        </div>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-slate-500">এখনো কোনো রিকোয়েস্ট হয়নি</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">মডেল</th>
                  <th className="py-2 pr-4 font-medium">টোকেন</th>
                  <th className="py-2 pr-4 font-medium">খরচ</th>
                  <th className="py-2 pr-4 font-medium">সময়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-4">{log.requestedModel}</td>
                    <td className="py-2 pr-4">{log.totalTokens.toLocaleString("bn-BD")}</td>
                    <td className="py-2 pr-4">{formatTaka(log.costPoisha)}</td>
                    <td className="py-2 pr-4 text-slate-500">
                      {log.createdAt.toLocaleString("bn-BD")}
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
