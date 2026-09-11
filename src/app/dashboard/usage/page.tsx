import Link from "next/link";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import { formatTaka } from "@/lib/money";

const PAGE_SIZE = 25;

const STATUS_LABEL: Record<string, string> = {
  SUCCESS: "সফল",
  ERROR: "ব্যর্থ",
  FALLBACK: "ফলব্যাক",
};

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [logs, total] = await Promise.all([
    prisma.usageLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.usageLog.count({ where: { userId: user.id } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">ব্যবহারের ইতিহাস</h1>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">মডেল</th>
              <th className="px-4 py-3 font-medium">প্রম্পট টোকেন</th>
              <th className="px-4 py-3 font-medium">কমপ্লিশন টোকেন</th>
              <th className="px-4 py-3 font-medium">খরচ</th>
              <th className="px-4 py-3 font-medium">অবস্থা</th>
              <th className="px-4 py-3 font-medium">সময়</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-300">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3">{log.requestedModel}</td>
                <td className="px-4 py-3">{log.promptTokens.toLocaleString("bn-BD")}</td>
                <td className="px-4 py-3">
                  {log.completionTokens.toLocaleString("bn-BD")}
                </td>
                <td className="px-4 py-3">{formatTaka(log.costPoisha)}</td>
                <td className="px-4 py-3">{STATUS_LABEL[log.status] ?? log.status}</td>
                <td className="px-4 py-3 text-slate-500">
                  {log.createdAt.toLocaleString("bn-BD")}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  এখনো কোনো রিকোয়েস্ট হয়নি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard/usage?page=${p}`}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                p === page
                  ? "bg-emerald-500 text-slate-950 font-semibold"
                  : "text-slate-400 hover:bg-white/5"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
