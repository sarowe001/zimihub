import type { UnifiedDelta } from "./types";

// ---------- সাধারণ SSE পার্সার ----------

type SSEEvent = { event: string | null; data: string };

function parseEventBlock(block: string): SSEEvent | null {
  let event: string | null = null;
  const dataLines: string[] = [];

  for (const line of block.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

async function* parseSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<SSEEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

      let idx = buffer.indexOf("\n\n");
      while (idx !== -1) {
        const parsed = parseEventBlock(buffer.slice(0, idx));
        buffer = buffer.slice(idx + 2);
        if (parsed) yield parsed;
        idx = buffer.indexOf("\n\n");
      }
    }

    const tail = parseEventBlock(buffer);
    if (tail) yield tail;
  } finally {
    reader.cancel().catch(() => {});
  }
}

// ---------- upstream SSE -> Unified delta ----------

export async function* openAIStreamToUnified(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<UnifiedDelta> {
  let finishReason = "stop";

  for await (const ev of parseSSE(body)) {
    if (ev.data === "[DONE]") break;

    let chunk: {
      choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    try {
      chunk = JSON.parse(ev.data);
    } catch {
      continue;
    }

    const choice = chunk.choices?.[0];
    if (typeof choice?.delta?.content === "string" && choice.delta.content) {
      yield { type: "text", text: choice.delta.content };
    }
    if (choice?.finish_reason) finishReason = choice.finish_reason;
    if (chunk.usage) {
      yield {
        type: "usage",
        promptTokens: chunk.usage.prompt_tokens,
        completionTokens: chunk.usage.completion_tokens,
      };
    }
  }

  yield { type: "done", finishReason };
}

export async function* anthropicStreamToUnified(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<UnifiedDelta> {
  let finishReason = "end_turn";

  for await (const ev of parseSSE(body)) {
    let payload: {
      type?: string;
      message?: { usage?: { input_tokens?: number; output_tokens?: number } };
      delta?: { text?: string; stop_reason?: string | null };
      usage?: { output_tokens?: number };
    };
    try {
      payload = JSON.parse(ev.data);
    } catch {
      continue;
    }

    const type = payload.type ?? ev.event;

    if (type === "message_start") {
      const usage = payload.message?.usage;
      if (usage) {
        yield {
          type: "usage",
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
        };
      }
    } else if (type === "content_block_delta") {
      if (typeof payload.delta?.text === "string" && payload.delta.text) {
        yield { type: "text", text: payload.delta.text };
      }
    } else if (type === "message_delta") {
      if (payload.delta?.stop_reason) finishReason = payload.delta.stop_reason;
      if (payload.usage) {
        yield { type: "usage", completionTokens: payload.usage.output_tokens };
      }
    } else if (type === "message_stop") {
      break;
    }
  }

  yield { type: "done", finishReason };
}

// ---------- Unified delta -> পাবলিক SSE ----------

function sse(payload: unknown, event?: string) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  return event ? `event: ${event}\n${data}` : data;
}

export function unifiedToOpenAISSE(
  deltas: AsyncGenerator<UnifiedDelta>,
  requestedModel: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const id = `chatcmpl-${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);
  let roleSent = false;
  let promptTokens = 0;
  let completionTokens = 0;

  const chunk = (
    delta: Record<string, unknown>,
    finishReason: string | null = null
  ) => ({
    id,
    object: "chat.completion.chunk",
    created,
    model: requestedModel,
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  });

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await deltas.next();

      if (done) {
        controller.close();
        return;
      }

      if (value.type === "text") {
        if (!roleSent) {
          roleSent = true;
          controller.enqueue(encoder.encode(sse(chunk({ role: "assistant" }))));
        }
        controller.enqueue(encoder.encode(sse(chunk({ content: value.text }))));
      } else if (value.type === "usage") {
        if (value.promptTokens != null) promptTokens = value.promptTokens;
        if (value.completionTokens != null) completionTokens = value.completionTokens;
      } else {
        const finishReason =
          value.finishReason === "end_turn" ? "stop" : value.finishReason;
        controller.enqueue(
          encoder.encode(
            sse({
              ...chunk({}, finishReason),
              usage: {
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: promptTokens + completionTokens,
              },
            })
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        // জেনারেটরটি শেষ করা জরুরি — এর finally ব্লকেই ব্যবহার লগ ও বিলিং হয়
        await deltas.return(undefined);
        controller.close();
      }
    },
    async cancel() {
      await deltas.return(undefined);
    },
  });
}

export function unifiedToAnthropicSSE(
  deltas: AsyncGenerator<UnifiedDelta>,
  requestedModel: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const id = `msg-${crypto.randomUUID()}`;
  let blockOpen = false;
  let promptTokens = 0;
  let completionTokens = 0;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          sse(
            {
              type: "message_start",
              message: {
                id,
                type: "message",
                role: "assistant",
                model: requestedModel,
                content: [],
                stop_reason: null,
                usage: { input_tokens: 0, output_tokens: 0 },
              },
            },
            "message_start"
          )
        )
      );
    },
    async pull(controller) {
      const { value, done } = await deltas.next();

      if (done) {
        controller.close();
        return;
      }

      if (value.type === "text") {
        if (!blockOpen) {
          blockOpen = true;
          controller.enqueue(
            encoder.encode(
              sse(
                {
                  type: "content_block_start",
                  index: 0,
                  content_block: { type: "text", text: "" },
                },
                "content_block_start"
              )
            )
          );
        }
        controller.enqueue(
          encoder.encode(
            sse(
              {
                type: "content_block_delta",
                index: 0,
                delta: { type: "text_delta", text: value.text },
              },
              "content_block_delta"
            )
          )
        );
      } else if (value.type === "usage") {
        if (value.promptTokens != null) promptTokens = value.promptTokens;
        if (value.completionTokens != null) completionTokens = value.completionTokens;
      } else {
        if (blockOpen) {
          controller.enqueue(
            encoder.encode(
              sse({ type: "content_block_stop", index: 0 }, "content_block_stop")
            )
          );
        }
        const stopReason =
          value.finishReason === "stop" ? "end_turn" : value.finishReason;
        controller.enqueue(
          encoder.encode(
            sse(
              {
                type: "message_delta",
                delta: { stop_reason: stopReason, stop_sequence: null },
                usage: { input_tokens: promptTokens, output_tokens: completionTokens },
              },
              "message_delta"
            )
          )
        );
        controller.enqueue(
          encoder.encode(sse({ type: "message_stop" }, "message_stop"))
        );
        // জেনারেটরটি শেষ করা জরুরি — এর finally ব্লকেই ব্যবহার লগ ও বিলিং হয়
        await deltas.return(undefined);
        controller.close();
      }
    },
    async cancel() {
      await deltas.return(undefined);
    },
  });
}
