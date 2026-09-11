import { prisma } from "@/lib/prisma";
import type { Model, Provider } from "@prisma/client";
import type { UnifiedDelta, UnifiedRequest, UnifiedResult } from "./types";
import {
  unifiedToOpenAIRequest,
  unifiedToAnthropicRequest,
  openAIResponseToUnified,
  anthropicResponseToUnified,
} from "./translate";
import {
  callOpenAICompatible,
  callAnthropic,
  openOpenAICompatibleStream,
  openAnthropicStream,
} from "./providers";
import { openAIStreamToUnified, anthropicStreamToUnified } from "./stream";
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

export type GatewayCaller = {
  userId: string;
  apiKeyId: string;
  balancePoisha: number;
};

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

// ব্যালেন্সের চেয়ে বেশি খরচ হয়ে যাওয়া ঠেকাতে আউটপুট টোকেনের সীমা কমিয়ে আনা হয়,
// যাতে সবচেয়ে খারাপ ক্ষেত্রেও বিল ব্যালেন্সের ভেতরেই থাকে।
function affordableMaxTokens(
  model: ModelWithProvider,
  request: UnifiedRequest,
  balancePoisha: number
): number {
  if (model.isFree) return request.maxTokens;

  const outputPricePerMTok = Number(model.outputPricePerMTokTaka);
  if (outputPricePerMTok <= 0) return request.maxTokens;

  // পয়সা -> টাকা -> কত টোকেন কেনা যায়
  const affordable = Math.floor(
    ((balancePoisha / 100) / outputPricePerMTok) * 1_000_000
  );
  return Math.max(1, Math.min(request.maxTokens, affordable));
}

// প্রোভাইডার টোকেন হিসাব না দিলে আনুমানিক হিসাব — ASCII-তে ~৪ অক্ষরে ১ টোকেন,
// বাংলা/ইউনিকোড অক্ষরে গড়ে ১ অক্ষরেই ১ টোকেন ধরা হয়।
function estimateTokens(text: string): number {
  let ascii = 0;
  let wide = 0;
  for (const ch of text) {
    if ((ch.codePointAt(0) ?? 0) < 128) ascii++;
    else wide++;
  }
  return Math.ceil(ascii / 4) + wide;
}

function promptText(request: UnifiedRequest): string {
  return [request.system ?? "", ...request.messages.map((m) => m.content)].join("\n");
}

async function recordUsage(params: {
  caller: GatewayCaller;
  model: ModelWithProvider;
  requestedModel: string;
  promptTokens: number;
  completionTokens: number;
  isFallback: boolean;
}) {
  const { caller, model } = params;
  const costPoisha = model.isFree
    ? 0
    : computeCostPoisha(model, params.promptTokens, params.completionTokens);

  await prisma.$transaction([
    prisma.usageLog.create({
      data: {
        userId: caller.userId,
        apiKeyId: caller.apiKeyId,
        modelDbId: model.id,
        requestedModel: params.requestedModel,
        promptTokens: params.promptTokens,
        completionTokens: params.completionTokens,
        totalTokens: params.promptTokens + params.completionTokens,
        costPoisha,
        status: params.isFallback ? "FALLBACK" : "SUCCESS",
      },
    }),
    ...(costPoisha > 0
      ? [
          prisma.user.update({
            where: { id: caller.userId },
            data: { balancePoisha: { decrement: costPoisha } },
          }),
        ]
      : []),
  ]);
}

async function recordError(caller: GatewayCaller, requestedModel: string, err: unknown) {
  await prisma.usageLog.create({
    data: {
      userId: caller.userId,
      apiKeyId: caller.apiKeyId,
      requestedModel,
      status: "ERROR",
      errorMessage: err instanceof Error ? err.message : "unknown error",
    },
  });
}

async function callModel(
  model: ModelWithProvider,
  req: UnifiedRequest
): Promise<UnifiedResult> {
  if (model.provider.kind === "ANTHROPIC") {
    const body = unifiedToAnthropicRequest(req, model.upstreamModelId);
    const resp = await callAnthropic(model.provider, body);
    return anthropicResponseToUnified(resp, model.upstreamModelId);
  }
  const body = unifiedToOpenAIRequest(req, model.upstreamModelId);
  const resp = await callOpenAICompatible(model.provider, body);
  return openAIResponseToUnified(resp, model.upstreamModelId);
}

export async function runGateway(params: {
  caller: GatewayCaller;
  request: UnifiedRequest;
}): Promise<{ result: UnifiedResult; model: ModelWithProvider }> {
  const { caller, request } = params;
  const chain = await resolveModelChain(request.requestedModel);

  if (chain.length === 0) {
    throw new GatewayError(404, `"${request.requestedModel}" নামে কোনো মডেল পাওয়া যায়নি`);
  }

  let lastError: unknown;

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    try {
      const result = await callModel(model, {
        ...request,
        maxTokens: affordableMaxTokens(model, request, caller.balancePoisha),
      });

      await recordUsage({
        caller,
        model,
        requestedModel: request.requestedModel,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        isFallback: i > 0,
      });

      return { result, model };
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  await recordError(caller, request.requestedModel, lastError);
  throw new GatewayError(502, "সব provider ব্যর্থ হয়েছে, একটু পরে আবার চেষ্টা করুন");
}

// স্ট্রিম থেকে আসা delta গুলো পাস-থ্রু করে, সাথে সাথে টোকেন গুনে রাখে এবং
// স্ট্রিম শেষ হলে (ক্লায়েন্ট মাঝপথে কেটে দিলেও) ব্যবহার লগ ও বিল করে।
async function* meteredStream(params: {
  body: ReadableStream<Uint8Array>;
  model: ModelWithProvider;
  caller: GatewayCaller;
  request: UnifiedRequest;
  isFallback: boolean;
}): AsyncGenerator<UnifiedDelta> {
  const { body, model, caller, request, isFallback } = params;
  const source =
    model.provider.kind === "ANTHROPIC"
      ? anthropicStreamToUnified(body)
      : openAIStreamToUnified(body);

  let promptTokens = 0;
  let completionTokens = 0;
  let text = "";

  try {
    for await (const delta of source) {
      if (delta.type === "usage") {
        if (delta.promptTokens != null) promptTokens = delta.promptTokens;
        if (delta.completionTokens != null) completionTokens = delta.completionTokens;
      } else if (delta.type === "text") {
        text += delta.text;
      }
      yield delta;
    }
  } finally {
    if (promptTokens === 0) promptTokens = estimateTokens(promptText(request));
    if (completionTokens === 0 && text) completionTokens = estimateTokens(text);

    // বিলিং ব্যর্থ হলেও ক্লায়েন্টের স্ট্রিম নষ্ট করা যাবে না — লগ করে ছেড়ে দেওয়া হয়
    await recordUsage({
      caller,
      model,
      requestedModel: request.requestedModel,
      promptTokens,
      completionTokens,
      isFallback,
    }).catch((err) => console.error("স্ট্রিমের বিলিং লিখতে ব্যর্থ", err));
  }
}

export async function runGatewayStream(params: {
  caller: GatewayCaller;
  request: UnifiedRequest;
}): Promise<{ deltas: AsyncGenerator<UnifiedDelta>; model: ModelWithProvider }> {
  const { caller, request } = params;
  const chain = await resolveModelChain(request.requestedModel);

  if (chain.length === 0) {
    throw new GatewayError(404, `"${request.requestedModel}" নামে কোনো মডেল পাওয়া যায়নি`);
  }

  let lastError: unknown;

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    const boundedRequest = {
      ...request,
      maxTokens: affordableMaxTokens(model, request, caller.balancePoisha),
    };

    try {
      const body =
        model.provider.kind === "ANTHROPIC"
          ? await openAnthropicStream(
              model.provider,
              unifiedToAnthropicRequest(boundedRequest, model.upstreamModelId)
            )
          : await openOpenAICompatibleStream(
              model.provider,
              unifiedToOpenAIRequest(boundedRequest, model.upstreamModelId)
            );

      return {
        model,
        deltas: meteredStream({
          body,
          model,
          caller,
          request: boundedRequest,
          isFallback: i > 0,
        }),
      };
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  await recordError(caller, request.requestedModel, lastError);
  throw new GatewayError(502, "সব provider ব্যর্থ হয়েছে, একটু পরে আবার চেষ্টা করুন");
}
