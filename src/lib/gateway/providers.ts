import type { AnthropicRequest, AnthropicResponse, OpenAIChatRequest, OpenAIChatResponse } from "./types";

export class UpstreamError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function resolveProviderKey(apiKeyEnv: string): string {
  const key = process.env[apiKeyEnv];
  if (!key) {
    throw new UpstreamError(
      500,
      `প্রোভাইডারের জন্য ${apiKeyEnv} সেট করা নেই — .env-এ আসল API key বসান`
    );
  }
  return key;
}

// OpenAI, DeepSeek, ও Google-এর OpenAI-compatible এন্ডপয়েন্ট — সবাই একই
// চ্যাট কমপ্লিশন্স শেপ ব্যবহার করে, তাই একই ফাংশন দিয়ে কল করা যায়।
export async function callOpenAICompatible(
  provider: { baseUrl: string; apiKeyEnv: string },
  body: OpenAIChatRequest
): Promise<OpenAIChatResponse> {
  const apiKey = resolveProviderKey(provider.apiKeyEnv);

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new UpstreamError(res.status, text || `আপস্ট্রিম ত্রুটি: ${res.status}`);
  }

  return (await res.json()) as OpenAIChatResponse;
}

export async function callAnthropic(
  provider: { baseUrl: string; apiKeyEnv: string },
  body: AnthropicRequest
): Promise<AnthropicResponse> {
  const apiKey = resolveProviderKey(provider.apiKeyEnv);

  const res = await fetch(`${provider.baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new UpstreamError(res.status, text || `আপস্ট্রিম ত্রুটি: ${res.status}`);
  }

  return (await res.json()) as AnthropicResponse;
}
