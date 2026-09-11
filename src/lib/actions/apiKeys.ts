"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";
import { generateApiKey } from "@/lib/apiKey";
import { takaToPoisha } from "@/lib/money";

export type CreateKeyState = {
  error?: string;
  fullKey?: string;
};

const nameSchema = z.string().trim().min(1).max(60);

export async function createApiKeyAction(
  _prev: CreateKeyState,
  formData: FormData
): Promise<CreateKeyState> {
  const user = await requireUser();
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { error: "একটি নাম দিন (৬০ অক্ষরের কম)" };
  }

  const limitRaw = formData.get("monthlyLimit");
  let monthlyLimitPoisha: number | null = null;
  if (typeof limitRaw === "string" && limitRaw.trim() !== "") {
    const limitTaka = Number(limitRaw);
    if (!Number.isFinite(limitTaka) || limitTaka <= 0) {
      return { error: "মাসিক সীমা একটি ধনাত্মক সংখ্যা হতে হবে" };
    }
    monthlyLimitPoisha = takaToPoisha(limitTaka);
  }

  const { fullKey, keyHash, keyPrefix } = generateApiKey();

  await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: parsed.data,
      keyHash,
      keyPrefix,
      monthlyLimitPoisha,
    },
  });

  revalidatePath("/dashboard/keys");
  return { fullKey };
}

export async function revokeApiKeyAction(formData: FormData) {
  const user = await requireUser();
  const id = formData.get("id") as string;

  await prisma.apiKey.updateMany({
    where: { id, userId: user.id },
    data: { revoked: true },
  });

  revalidatePath("/dashboard/keys");
}
