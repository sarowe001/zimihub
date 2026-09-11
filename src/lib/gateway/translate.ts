import type {
  AnthropicContentBlock,
  AnthropicRequest,
  AnthropicResponse,
  OpenAIChatRequest,
  OpenAIChatResponse,
  UnifiedMessage,
  UnifiedRequest,
  UnifiedResult,
} from "./types";

const DEFAULT_MAX_TOKENS = 4096;

function blockToText(content: string | AnthropicContentBlock[]): string {
  if (typeof content === "string") return content;
  return content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

// ---------- ইনবাউন্ড: পাবলিক অনুরোধ -> Unified ----------

export function openAIRequestToUnified(body: OpenAIChatRequest): UnifiedRequest {
  const systemParts: string[] = [];
  const messages: UnifiedMessage[] = [];

  for (const m of body.messages ?? []) {
    if (m.role === "system") {
      systemParts.push(m.content);
    } else {
      messages.push({ role: m.role, content: m.content });
    }
  }

  return {
    requestedModel: body.model,
    system: systemParts.length ? systemParts.join("\n") : undefined,
    messages,
    maxTokens: body.max_completion_tokens ?? body.max_tokens ?? DEFAULT_MAX_TOKENS,
    temperature: body.temperature,
    stream: Boolean(body.stream),
  };
}

export function anthropicRequestToUnified(body: AnthropicRequest): UnifiedRequest {
  return {
    requestedModel: body.model,
    system: body.system,
    messages: (body.messages ?? []).map((m) => ({
      role: m.role,
      content: blockToText(m.content),
    })),
    maxTokens: body.max_tokens ?? DEFAULT_MAX_TOKENS,
    temperature: body.temperature,
    stream: Boolean(body.stream),
  };
}

// ---------- আউটবাউন্ড: Unified -> upstream provider request ----------

export function unifiedToOpenAIRequest(
  req: UnifiedRequest,
  upstreamModelId: string
): OpenAIChatRequest {
  const messages: OpenAIChatRequest["messages"] = [];
  if (req.system) messages.push({ role: "system", content: req.system });
  for (const m of req.messages) messages.push({ role: m.role, content: m.content });

  return {
    model: upstreamModelId,
    messages,
    max_tokens: req.maxTokens,
    temperature: req.temperature,
  };
}

export function unifiedToAnthropicRequest(
  req: UnifiedRequest,
  upstreamModelId: string
): AnthropicRequest {
  return {
    model: upstreamModelId,
    system: req.system,
    messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: req.maxTokens,
    temperature: req.temperature,
  };
}

// ---------- upstream response -> Unified ----------

export function openAIResponseToUnified(
  resp: OpenAIChatResponse,
  upstreamModelId: string
): UnifiedResult {
  const choice = resp.choices[0];
  return {
    content: choice?.message?.content ?? "",
    promptTokens: resp.usage?.prompt_tokens ?? 0,
    completionTokens: resp.usage?.completion_tokens ?? 0,
    finishReason: choice?.finish_reason ?? "stop",
    upstreamModelId,
  };
}

export function anthropicResponseToUnified(
  resp: AnthropicResponse,
  upstreamModelId: string
): UnifiedResult {
  return {
    content: blockToText(resp.content ?? []),
    promptTokens: resp.usage?.input_tokens ?? 0,
    completionTokens: resp.usage?.output_tokens ?? 0,
    finishReason: resp.stop_reason ?? "end_turn",
    upstreamModelId,
  };
}

// ---------- Unified result -> পাবলিক রেসপন্স ----------

export function unifiedResultToOpenAIResponse(
  result: UnifiedResult,
  requestedModel: string
): OpenAIChatResponse {
  return {
    id: `chatcmpl-${crypto.randomUUID()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: requestedModel,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: result.content },
        finish_reason: result.finishReason === "end_turn" ? "stop" : result.finishReason,
      },
    ],
    usage: {
      prompt_tokens: result.promptTokens,
      completion_tokens: result.completionTokens,
      total_tokens: result.promptTokens + result.completionTokens,
    },
  };
}

export function unifiedResultToAnthropicResponse(
  result: UnifiedResult,
  requestedModel: string
): AnthropicResponse {
  return {
    id: `msg-${crypto.randomUUID()}`,
    type: "message",
    role: "assistant",
    model: requestedModel,
    content: [{ type: "text", text: result.content }],
    stop_reason: result.finishReason === "stop" ? "end_turn" : result.finishReason,
    usage: {
      input_tokens: result.promptTokens,
      output_tokens: result.completionTokens,
    },
  };
}
