import { requireAdmin } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import { formatTaka } from "@/lib/money";
import {
  updateModelPricingAction,
  toggleModelAction,
  toggleModelFreeAction,
  toggleProviderAction,
  manualTopupAction,
} from "@/lib/actions/admin";

export default async function AdminPage() {
  await requireAdmin();

  const [providers, models, users, totals] = await Promise.all([
    prisma.provider.findMany({ orderBy: { name: "asc" } }),
    prisma.model.findMany({
      include: { provider: true },
      orderBy: [{ provider: { name: "asc" } }, { displayName: "asc" }],
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balancePoisha: true,
        createdAt: true,
      },
    }),
    prisma.usageLog.aggregate({ _sum: { costPoisha: true }, _count: true }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">এডমিন</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="মোট আয় (ব্যবহার)" value={formatTaka(totals._sum.costPoisha ?? 0)} />
        <Stat label="মোট রিকোয়েস্ট" value={totals._count.toLocaleString("bn-BD")} />
        <Stat label="মোট ইউজার" value={users.length.toLocaleString("bn-BD")} />
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 font-semibold text-white">প্রোভাইডার</h2>
        <div className="space-y-2">
          {providers.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/50 p-3"
            >
              <div>
                <p className="font-medium text-white">
                  {p.name}{" "}
                  <span className="text-xs text-slate-500">({p.kind})</span>
                </p>
                <p className="text-xs text-slate-500">
                  {p.baseUrl} · key: {p.apiKeyEnv}
                </p>
              </div>
              <form action={toggleProviderAction}>
                <input type="hidden" name="providerId" value={p.id} />
                <button
                  type="submit"
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    p.enabled
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-slate-500/10 text-slate-400"
                  }`}
                >
                  {p.enabled ? "চালু" : "বন্ধ"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-1 font-semibold text-white">মডেল ও দাম</h2>
        <p className="mb-4 text-sm text-slate-400">
          দাম প্রতি ১০ লক্ষ টোকেনে টাকায়। বদলে &ldquo;সেভ&rdquo; চাপুন।
        </p>
        <div className="space-y-3">
          {models.map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-white/10 bg-slate-900/50 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{m.displayName}</p>
                  <p className="font-mono text-xs text-slate-500">
                    {m.modelId} → {m.provider.name}/{m.upstreamModelId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={toggleModelFreeAction}>
                    <input type="hidden" name="modelId" value={m.id} />
                    <button
                      type="submit"
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        m.isFree
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {m.isFree ? "ফ্রি" : "পেইড"}
                    </button>
                  </form>
                  <form action={toggleModelAction}>
                    <input type="hidden" name="modelId" value={m.id} />
                    <button
                      type="submit"
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        m.enabled
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {m.enabled ? "চালু" : "বন্ধ"}
                    </button>
                  </form>
                </div>
              </div>

              <form
                action={updateModelPricingAction}
                className="flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="modelId" value={m.id} />
                <label className="text-xs text-slate-400">
                  ইনপুট (৳/M)
                  <input
                    type="number"
                    name="inputPrice"
                    step="0.01"
                    min="0"
                    defaultValue={Number(m.inputPricePerMTokTaka)}
                    className="mt-1 block w-28 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-400"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  আউটপুট (৳/M)
                  <input
                    type="number"
                    name="outputPrice"
                    step="0.01"
                    min="0"
                    defaultValue={Number(m.outputPricePerMTokTaka)}
                    className="mt-1 block w-28 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-400"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  সেভ
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 font-semibold text-white">ইউজার</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/50 p-3"
            >
              <div>
                <p className="font-medium text-white">
                  {u.name}{" "}
                  {u.role === "ADMIN" && (
                    <span className="ml-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">
                      এডমিন
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">
                  {formatTaka(u.balancePoisha)}
                </span>
                <form action={manualTopupAction} className="flex gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <input
                    type="number"
                    name="amount"
                    min="1"
                    step="1"
                    placeholder="৳"
                    className="w-24 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
                  >
                    যোগ করুন
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
