"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireUser";
import { takaToPoisha } from "@/lib/money";

const priceSchema = z.object({
  modelId: z.string().min(1),
  inputPrice: z.coerce.number().min(0),
  outputPrice: z.coerce.number().min(0),
});

export async function updateModelPricingAction(formData: FormData) {
  await requireAdmin();

  const parsed = priceSchema.safeParse({
    modelId: formData.get("modelId"),
    inputPrice: formData.get("inputPrice"),
    outputPrice: formData.get("outputPrice"),
  });
  if (!parsed.success) return;

  await prisma.model.update({
    where: { id: parsed.data.modelId },
    data: {
      inputPricePerMTokTaka: parsed.data.inputPrice,
      outputPricePerMTokTaka: parsed.data.outputPrice,
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/");
}

export async function toggleModelAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("modelId") as string;

  const model = await prisma.model.findUnique({ where: { id } });
  if (!model) return;

  await prisma.model.update({
    where: { id },
    data: { enabled: !model.enabled },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/");
}

export async function toggleModelFreeAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("modelId") as string;

  const model = await prisma.model.findUnique({ where: { id } });
  if (!model) return;

  await prisma.model.update({
    where: { id },
    data: { isFree: !model.isFree },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/");
}

export async function toggleProviderAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("providerId") as string;

  const provider = await prisma.provider.findUnique({ where: { id } });
  if (!provider) return;

  await prisma.provider.update({
    where: { id },
    data: { enabled: !provider.enabled },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/");
}

// সহায়তার প্রয়োজনে ইউজারের ব্যালেন্সে ম্যানুয়ালি টাকা যোগ করা
// (যেমন: পেমেন্ট হয়েছে কিন্তু গেটওয়ে কলব্যাক ব্যর্থ হয়েছে)
export async function manualTopupAction(formData: FormData) {
  const admin = await requireAdmin();

  const userId = formData.get("userId") as string;
  const amountTaka = Number(formData.get("amount"));
  if (!userId || !Number.isFinite(amountTaka) || amountTaka <= 0) return;

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId,
        method: "MANUAL",
        status: "COMPLETED",
        amountTaka,
        rawResponse: JSON.stringify({ byAdmin: admin.email }),
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { balancePoisha: { increment: takaToPoisha(amountTaka) } },
    }),
  ]);

  revalidatePath("/dashboard/admin");
}
