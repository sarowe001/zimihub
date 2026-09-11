import { prisma } from "@/lib/prisma";

export async function listActiveModels() {
  return prisma.model.findMany({
    where: { enabled: true, provider: { enabled: true } },
    include: { provider: true },
    orderBy: [{ isFree: "desc" }, { inputPricePerMTokTaka: "asc" }],
  });
}
