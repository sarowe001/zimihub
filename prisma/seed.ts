import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// দাম বাজারদর অনুযায়ী আনুমানিক ধরা হয়েছে (প্রতি ১০ লক্ষ টোকেনে টাকা)।
// এডমিন প্যানেল/DB থেকে এই দাম যেকোনো সময় বদলানো যাবে।
async function main() {
  const openai = await prisma.provider.upsert({
    where: { slug: "openai" },
    update: {},
    create: {
      slug: "openai",
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      apiKeyEnv: "OPENAI_API_KEY",
    },
  });

  const anthropic = await prisma.provider.upsert({
    where: { slug: "anthropic" },
    update: {},
    create: {
      slug: "anthropic",
      name: "Anthropic",
      baseUrl: "https://api.anthropic.com/v1",
      apiKeyEnv: "ANTHROPIC_API_KEY",
    },
  });

  const deepseek = await prisma.provider.upsert({
    where: { slug: "deepseek" },
    update: {},
    create: {
      slug: "deepseek",
      name: "DeepSeek",
      baseUrl: "https://api.deepseek.com",
      apiKeyEnv: "DEEPSEEK_API_KEY",
    },
  });

  // Google-এর OpenAI-compatible এন্ডপয়েন্ট ব্যবহার করা হয়েছে যাতে একই
  // callOpenAICompatible() ফাংশন দিয়ে কল করা যায় (আলাদা adapter লাগে না)।
  const google = await prisma.provider.upsert({
    where: { slug: "google" },
    update: {},
    create: {
      slug: "google",
      name: "Google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKeyEnv: "GOOGLE_API_KEY",
    },
  });

  const models = [
    {
      providerId: openai.id,
      modelId: "gpt-5-mini",
      upstreamModelId: "gpt-5-mini",
      displayName: "GPT-5 Mini",
      inputPricePerMTokTaka: 25,
      outputPricePerMTokTaka: 100,
    },
    {
      providerId: openai.id,
      modelId: "gpt-5",
      upstreamModelId: "gpt-5",
      displayName: "GPT-5",
      inputPricePerMTokTaka: 150,
      outputPricePerMTokTaka: 600,
    },
    {
      providerId: anthropic.id,
      modelId: "claude-sonnet-5",
      upstreamModelId: "claude-sonnet-5",
      displayName: "Claude Sonnet 5",
      inputPricePerMTokTaka: 350,
      outputPricePerMTokTaka: 1750,
    },
    {
      providerId: anthropic.id,
      modelId: "claude-haiku-4-5",
      upstreamModelId: "claude-haiku-4-5-20251001",
      displayName: "Claude Haiku 4.5",
      inputPricePerMTokTaka: 100,
      outputPricePerMTokTaka: 500,
    },
    {
      providerId: deepseek.id,
      modelId: "deepseek-chat",
      upstreamModelId: "deepseek-chat",
      displayName: "DeepSeek Chat",
      inputPricePerMTokTaka: 0,
      outputPricePerMTokTaka: 0,
      isFree: true,
    },
    {
      providerId: google.id,
      modelId: "gemini-2.5-flash",
      upstreamModelId: "gemini-2.5-flash",
      displayName: "Gemini 2.5 Flash",
      inputPricePerMTokTaka: 30,
      outputPricePerMTokTaka: 120,
    },
  ];

  const createdByModelId: Record<string, string> = {};
  for (const m of models) {
    const created = await prisma.model.upsert({
      where: { modelId: m.modelId },
      update: {
        displayName: m.displayName,
        upstreamModelId: m.upstreamModelId,
        inputPricePerMTokTaka: m.inputPricePerMTokTaka,
        outputPricePerMTokTaka: m.outputPricePerMTokTaka,
        isFree: m.isFree ?? false,
      },
      create: {
        ...m,
        isFree: m.isFree ?? false,
      },
    });
    createdByModelId[m.modelId] = created.id;
  }

  // gpt-5-mini ব্যর্থ/আনরিচেবল হলে বিনামূল্যের deepseek-chat-এ স্বয়ংক্রিয় fallback
  await prisma.model.update({
    where: { modelId: "gpt-5-mini" },
    data: { fallbackModelId: createdByModelId["deepseek-chat"] },
  });

  console.log("সিড সম্পন্ন হয়েছে ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
