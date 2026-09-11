import { NextResponse } from "next/server";
import { authenticateRequest, GatewayAuthError } from "@/lib/gateway/auth";
import { runGateway, GatewayError } from "@/lib/gateway/handler";
import { openAIRequestToUnified, unifiedResultToOpenAIResponse } from "@/lib/gateway/translate";
import type { OpenAIChatRequest } from "@/lib/gateway/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { user, apiKey } = await authenticateRequest(request);
    const body = (await request.json()) as OpenAIChatRequest;

    if (!body?.model || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: { message: "model ও messages আবশ্যক" } },
        { status: 400 }
      );
    }

    const unifiedRequest = openAIRequestToUnified(body);
    const { result } = await runGateway({
      userId: user.id,
      apiKeyId: apiKey.id,
      request: unifiedRequest,
    });

    return NextResponse.json(unifiedResultToOpenAIResponse(result, body.model));
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown) {
  if (err instanceof GatewayAuthError || err instanceof GatewayError) {
    return NextResponse.json({ error: { message: err.message } }, { status: err.status });
  }
  console.error("gateway error", err);
  return NextResponse.json(
    { error: { message: "অভ্যন্তরীণ সার্ভার ত্রুটি" } },
    { status: 500 }
  );
}
