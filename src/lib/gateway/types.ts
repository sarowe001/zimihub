// AI Gateway-এর জন্য অভ্যন্তরীণ (unified) request/response টাইপ।
// পাবলিক এন্ডপয়েন্ট দুই ধরনের (OpenAI-style ও Anthropic-style) হলেও,
// ভেতরে সবকিছু এই একই আকারে চলে — এভাবে যেকোনো upstream provider-কে
// যেকোনো পাবলিক ফরম্যাটে সার্ভ করা যায়।

export type UnifiedMessage = {
  role: "user" | "assistant";
  content: string;
};

export type UnifiedRequest = {
  requestedModel: string;
  system?: string;
  messages: UnifiedMessage[];
  maxTokens: number;
  temperature?: number;
  stream: boolean;
};

export type UnifiedResult = {
  content: string;
  promptTokens: number;
  completionTokens: number;
  finishReason: string;
  upstreamModelId: string;
};

// স্ট্রিমিং-এর সময় upstream থেকে আসা ইভেন্টগুলোকেও একই unified আকারে আনা হয়,
// তারপর ক্লায়েন্ট যে ফরম্যাট চেয়েছে সেই SSE ফরম্যাটে সিরিয়ালাইজ করা হয়।
export type UnifiedDelta =
  | { type: "text"; text: string }
  | { type: "usage"; promptTokens?: number; completionTokens?: number }
  | { type: "done"; finishReason: string };

export type OpenAIChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenAIChatRequest = {
  model: string;
  messages: OpenAIChatMessage[];
  max_tokens?: number;
  max_completion_tokens?: number;
  temperature?: number;
  stream?: boolean;
  stream_options?: { include_usage: boolean };
};

export type OpenAIChatResponse = {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: "assistant"; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type AnthropicContentBlock = { type: "text"; text: string };

export type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

export type AnthropicRequest = {
  model: string;
  messages: AnthropicMessage[];
  system?: string;
  max_tokens: number;
  temperature?: number;
  stream?: boolean;
};

export type AnthropicResponse = {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: AnthropicContentBlock[];
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
};
