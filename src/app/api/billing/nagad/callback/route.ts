import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyNagadPayment } from "@/lib/payments/nagad";
import { completeTransaction, failTransaction } from "@/lib/actions/billing";

export async function GET(request: NextRequest) {
  // Nagad সাধারণত payment_ref_id ও status query param দিয়ে ফেরত পাঠায়।
  // আপনার মার্চেন্ট ড্যাশবোর্ডের ডকুমেন্টে নাম মিলিয়ে নিন, ভিন্ন হলে এখানে বদলে দিন।
  const paymentRefId =
    request.nextUrl.searchParams.get("payment_ref_id") ??
    request.nextUrl.searchParams.get("paymentRefId");

  if (!paymentRefId) {
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=missing_payment", request.url)
    );
  }

  const transaction = await prisma.transaction.findUnique({
    where: { providerRef: paymentRefId },
  });
  if (!transaction) {
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=not_found", request.url)
    );
  }

  try {
    const result = await verifyNagadPayment(paymentRefId);

    if (result.status !== "Success") {
      await failTransaction(transaction.id, "FAILED", result);
      return NextResponse.redirect(
        new URL("/dashboard/billing?error=execute_failed", request.url)
      );
    }

    await completeTransaction({
      transactionId: transaction.id,
      trxId: result.issuerPaymentRefNo,
      rawResponse: result,
    });

    return NextResponse.redirect(
      new URL("/dashboard/billing?success=1", request.url)
    );
  } catch (err) {
    console.error("Nagad callback error", err);
    await failTransaction(transaction.id, "FAILED");
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=execute_failed", request.url)
    );
  }
}
