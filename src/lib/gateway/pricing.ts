import type { Model } from "@prisma/client";

// ছোট রিকোয়েস্টের খরচ ১ পয়সারও কম হতে পারে; round করলে সেটা ০ হয়ে যেত অর্থাৎ
// বিনামূল্যে হয়ে যেত। তাই খরচ থাকলে সর্বনিম্ন ১ পয়সা ধরা হয় (ceil)।
export function computeCostPoisha(
  model: Pick<Model, "inputPricePerMTokTaka" | "outputPricePerMTokTaka">,
  promptTokens: number,
  completionTokens: number
): number {
  const inputTaka = (promptTokens / 1_000_000) * Number(model.inputPricePerMTokTaka);
  const outputTaka =
    (completionTokens / 1_000_000) * Number(model.outputPricePerMTokTaka);
  return Math.ceil((inputTaka + outputTaka) * 100);
}
