import { prisma } from "@/lib/prisma";
import type { Model, Provider } from "@prisma/client";
import type { UnifiedRequest, UnifiedResult } from "./types";
import {
  unifiedToOpenAIRequest,
  unifiedToAnthropicRequest,
  openAIResponseToUnified,
  anthropicResponseToUnified,
} from "./translate";
import { callOpenAICompatible, callAnthropic } from "./providers";
import { computeCostPoisha } from "./pricing";

type ModelWithProvider = Model & { provider: Provider };

export class GatewayError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

// রিকোয়েস্ট করা মডেল থেকে শুরু করে fallbackModelId ধরে ধরে একটি চেইন বানায়
// (সর্বোচ্চ ৪টি ধাপ, চক্র এড়াতে visited সেট রাখা হয়)।
async function resolveModelChain(requestedModelId: string): Promise<ModelWithProvider[]> {
  const chain: ModelWithProvider[] = [];
  const visited = new Set<string>();

  let current = await prisma.model.findUnique({
    where: { modelId: requestedModelId },
    include: { provider: true },
  });

  while (
    current &&
    current.enabled &&
    current.provider.enabled &&
    !visited.has(current.id) &&
    chain.length < 4
  ) {
    visited.add(current.id);
    chain.push(current);
    if (!current.fallbackModelId) break;
    current = await prisma.model.findUnique({
      where: { id: current.fallbackModelId },
      include: { provider: true },
    });
  }

  return chain;
}

async function callModel(
  model: ModelWithProvider,
  req: UnifiedRequest
): Promise<UnifiedResult> {
  if (model.provider.slug === "anthropic") {
    const body = unifiedToAnthropicRequest(req, model.upstreamModelId);
    const resp = await callAnthropic(model.provider, body);
    return anthropicResponseToUnified(resp, model.upstreamModelId);
  }
  const body = unifiedToOpenAIRequest(req, model.upstreamModelId);
  const resp = await callOpenAICompatible(model.provider, body);
  return openAIResponseToUnified(resp, model.upstreamModelId);
}

export async function runGateway(params: {
  userId: string;
  apiKeyId: string;
  request: UnifiedRequest;
}): Promise<{ result: UnifiedResult; model: ModelWithProvider }> {
  const chain = await resolveModelChain(params.request.requestedModel);

  if (chain.length === 0) {
    throw new GatewayError(
      404,
      `"${params.request.requestedModel}" নামে কোনো মডেল পাওয়া যায়নি`
    );
  }

  let lastError: unknown;

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    const isFallback = i > 0;
    try {
      const result = await callModel(model, params.request);
      const costPoisha = model.isFree
        ? 0
        : computeCostPoisha(model, result.promptTokens, result.completionTokens);

      await prisma.$transaction([
        prisma.usageLog.create({
          data: {
            userId: params.userId,
            apiKeyId: params.apiKeyId,
            modelDbId: model.id,
            requestedModel: params.request.requestedModel,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            totalTokens: result.promptTokens + result.completionTokens,
            costPoisha,
            status: isFallback ? "FALLBACK" : "SUCCESS",
          },
        }),
        ...(costPoisha > 0
          ? [
              prisma.user.update({
                where: { id: params.userId },
                data: { balancePoisha: { decrement: costPoisha } },
              }),
            ]
          : []),
      ]);

      return { result, model };
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  await prisma.usageLog.create({
    data: {
      userId: params.userId,
      apiKeyId: params.apiKeyId,
      requestedModel: params.request.requestedModel,
      status: "ERROR",
      errorMessage: lastError instanceof Error ? lastError.message : "unknown error",
    },
  });

  throw new GatewayError(502, "সব provider ব্যর্থ হয়েছে, একটু পরে আবার চেষ্টা করুন");
}
