import { NextResponse } from "next/server";
import { authenticateRequest, GatewayAuthError } from "@/lib/gateway/auth";
import { listActiveModels } from "@/lib/models";

export const runtime = "nodejs";

// OpenAI-compatible মডেল তালিকা — সাথে টাকায় দামও দেওয়া হয় (pricing ফিল্ড)
export async function GET(request: Request) {
  try {
    await authenticateRequest(request);
    const models = await listActiveModels();

    return NextResponse.json({
      object: "list",
      data: models.map((m) => ({
        id: m.modelId,
        object: "model",
        owned_by: m.provider.name,
        display_name: m.displayName,
        is_free: m.isFree,
        pricing: {
          currency: "BDT",
          input_per_million_tokens: Number(m.inputPricePerMTokTaka),
          output_per_million_tokens: Number(m.outputPricePerMTokTaka),
        },
      })),
    });
  } catch (err) {
    if (err instanceof GatewayAuthError) {
      return NextResponse.json({ error: { message: err.message } }, { status: err.status });
    }
    console.error("models list error", err);
    return NextResponse.json(
      { error: { message: "অভ্যন্তরীণ সার্ভার ত্রুটি" } },
      { status: 500 }
    );
  }
}
