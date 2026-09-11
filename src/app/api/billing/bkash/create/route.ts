import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createBkashPayment } from "@/lib/payments/bkash";
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
    "BKASH"
  );

  try {
    const payment = await createBkashPayment({
      amountTaka,
      merchantInvoiceNumber: transaction.id,
      payerReference: session.user.id,
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { providerRef: payment.paymentID },
    });

    return NextResponse.redirect(payment.bkashURL);
  } catch (err) {
    console.error("bKash create error", err);
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=bkash", request.url)
    );
  }
}
