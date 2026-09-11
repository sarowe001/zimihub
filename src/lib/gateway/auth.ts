import { prisma } from "@/lib/prisma";
import { hashApiKey, isValidKeyFormat } from "@/lib/apiKey";

export class GatewayAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
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

  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { user: apiKey.user, apiKey };
}
