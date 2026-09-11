import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import { revokeApiKeyAction } from "@/lib/actions/apiKeys";
import { monthlySpendPoisha } from "@/lib/gateway/auth";
import { formatTaka } from "@/lib/money";
import CreateKeyForm from "./CreateKeyForm";

export default async function KeysPage() {
  const user = await requireUser();
  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const spendByKey = new Map(
    await Promise.all(
      keys.map(
        async (key) => [key.id, await monthlySpendPoisha(key.id)] as const
      )
    )
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">API Key</h1>

      <CreateKeyForm />

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 font-semibold text-white">আপনার Key সমূহ</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-slate-500">এখনো কোনো key তৈরি হয়নি</p>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/50 p-4"
              >
                <div>
                  <p className="font-medium text-white">{key.name}</p>
                  <p className="font-mono text-xs text-slate-500">
                    {key.keyPrefix}••••••••
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    এ মাসে খরচ: {formatTaka(spendByKey.get(key.id) ?? 0)}
                    {key.monthlyLimitPoisha != null &&
                      ` / সীমা ${formatTaka(key.monthlyLimitPoisha)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {key.revoked ? (
                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                      রিভোকড
                    </span>
                  ) : (
                    <>
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        সক্রিয়
                      </span>
                      <form action={revokeApiKeyAction}>
                        <input type="hidden" name="id" value={key.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                        >
                          রিভোক করুন
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
