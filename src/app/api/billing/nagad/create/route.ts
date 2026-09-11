import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { initializeNagadPayment, completeNagadPayment } from "@/lib/payments/nagad";
import {
  createPendingTransaction,
  MIN_TOPUP_TAKA,
  MAX_TOPUP_TAKA,
} from "@/lib/actions/billing";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const amountTaka = Number(formData.get("amount"));

  if (
    !Number.isFinite(amountTaka) ||
    amountTaka < MIN_TOPUP_TAKA ||
    amountTaka > MAX_TOPUP_TAKA
  ) {
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=amount", request.url)
    );
  }

  const transaction = await createPendingTransaction(
    session.user.id,
    amountTaka,
    "NAGAD"
  );

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  try {
    const init = await initializeNagadPayment({
      orderId: transaction.id,
      clientIp,
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { providerRef: init.paymentReferenceId },
    });

    const complete = await completeNagadPayment({
      paymentReferenceId: init.paymentReferenceId,
      orderId: transaction.id,
      amountTaka,
      challenge: init.challenge,
      clientIp,
    });

    if (!complete.callBackUrl) {
      throw new Error("Nagad callBackUrl পাওয়া যায়নি");
    }

    return NextResponse.redirect(complete.callBackUrl);
  } catch (err) {
    console.error("Nagad create error", err);
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=nagad", request.url)
    );
  }
}
