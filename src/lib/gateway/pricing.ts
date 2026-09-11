import type { Model } from "@prisma/client";

export function computeCostPoisha(
  model: Pick<Model, "inputPricePerMTokTaka" | "outputPricePerMTokTaka">,
  promptTokens: number,
  completionTokens: number
): number {
  const inputTaka = (promptTokens / 1_000_000) * Number(model.inputPricePerMTokTaka);
  const outputTaka =
    (completionTokens / 1_000_000) * Number(model.outputPricePerMTokTaka);
  return Math.round((inputTaka + outputTaka) * 100);
}
