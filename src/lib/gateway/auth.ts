import { prisma } from "@/lib/prisma";
import { hashApiKey, isValidKeyFormat } from "@/lib/apiKey";
import { formatTaka } from "@/lib/money";

export class GatewayAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// চলতি মাসে একটি নির্দিষ্ট key দিয়ে কত খরচ হয়েছে (পয়সায়)
export async function monthlySpendPoisha(apiKeyId: string): Promise<number> {
  const result = await prisma.usageLog.aggregate({
    where: { apiKeyId, createdAt: { gte: startOfMonth() } },
    _sum: { costPoisha: true },
  });
  return result._sum.costPoisha ?? 0;
}

export async function authenticateRequest(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const key = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!key || !isValidKeyFormat(key)) {
    throw new GatewayAuthError(401, "সঠিক API key দেওয়া হয়নি (Authorization: Bearer ...)");
  }

  const keyHash = hashApiKey(key);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!apiKey || apiKey.revoked) {
    throw new GatewayAuthError(401, "API key সঠিক নয় বা রিভোক করা হয়েছে");
  }

  if (apiKey.user.balancePoisha <= 0) {
    throw new GatewayAuthError(402, "ব্যালেন্স শেষ — দয়া করে টাকা যোগ করুন");
  }

  if (apiKey.monthlyLimitPoisha != null) {
    const spent = await monthlySpendPoisha(apiKey.id);
    if (spent >= apiKey.monthlyLimitPoisha) {
      throw new GatewayAuthError(
        429,
        `এই key-এর মাসিক খরচের সীমা (${formatTaka(apiKey.monthlyLimitPoisha)}) শেষ হয়ে গেছে`
      );
    }
  }

  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { user: apiKey.user, apiKey };
}
