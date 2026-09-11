import { prisma } from "@/lib/prisma";
import { takaToPoisha } from "@/lib/money";

export const MIN_TOPUP_TAKA = 20;
export const MAX_TOPUP_TAKA = 25000;

export async function createPendingTransaction(
  userId: string,
  amountTaka: number,
  method: "BKASH" | "NAGAD"
) {
  return prisma.transaction.create({
    data: {
      userId,
      method,
      amountTaka,
      status: "PENDING",
    },
  });
}

// gateway থেকে সফল কনফার্মেশন পাওয়ার পর ব্যালেন্স যোগ করে —
// idempotent: একই transaction দুইবার COMPLETE করলে দ্বিতীয়বার ব্যালেন্স যোগ হবে না।
export async function completeTransaction(params: {
  transactionId: string;
  trxId?: string;
  rawResponse?: unknown;
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findUnique({
      where: { id: params.transactionId },
    });
    if (!existing || existing.status === "COMPLETED") return existing;

    const updated = await tx.transaction.update({
      where: { id: params.transactionId },
      data: {
        status: "COMPLETED",
        trxId: params.trxId,
        rawResponse: params.rawResponse
          ? JSON.stringify(params.rawResponse)
          : undefined,
      },
    });

    await tx.user.update({
      where: { id: existing.userId },
      data: {
        balancePoisha: { increment: takaToPoisha(Number(existing.amountTaka)) },
      },
    });

    return updated;
  });
}

export async function failTransaction(
  transactionId: string,
  status: "FAILED" | "CANCELLED",
  rawResponse?: unknown
) {
  return prisma.transaction.updateMany({
    where: { id: transactionId, status: "PENDING" },
    data: {
      status,
      rawResponse: rawResponse ? JSON.stringify(rawResponse) : undefined,
    },
  });
}
