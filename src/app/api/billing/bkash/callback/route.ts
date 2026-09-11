import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeBkashPayment } from "@/lib/payments/bkash";
import { completeTransaction, failTransaction } from "@/lib/actions/billing";

export async function GET(request: NextRequest) {
  const paymentID = request.nextUrl.searchParams.get("paymentID");
  const status = request.nextUrl.searchParams.get("status");

  if (!paymentID) {
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=missing_payment", request.url)
    );
  }

  const transaction = await prisma.transaction.findUnique({
    where: { providerRef: paymentID },
  });
  if (!transaction) {
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=not_found", request.url)
    );
  }

  if (status !== "success") {
    await failTransaction(
      transaction.id,
      status === "cancel" ? "CANCELLED" : "FAILED"
    );
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=cancelled", request.url)
    );
  }

  try {
    const result = await executeBkashPayment(paymentID);

    if (result.statusCode !== "0000" || result.transactionStatus !== "Completed") {
      await failTransaction(transaction.id, "FAILED", result);
      return NextResponse.redirect(
        new URL("/dashboard/billing?error=execute_failed", request.url)
      );
    }

    await completeTransaction({
      transactionId: transaction.id,
      trxId: result.trxID,
      rawResponse: result,
    });

    return NextResponse.redirect(
      new URL("/dashboard/billing?success=1", request.url)
    );
  } catch (err) {
    console.error("bKash callback error", err);
    await failTransaction(transaction.id, "FAILED");
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=execute_failed", request.url)
    );
  }
}
