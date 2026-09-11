import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ড্যাশবোর্ডের প্রতিটি প্রোটেক্টেড পেজে ব্যবহারকারীর সেশন যাচাই করে
// সাথে সাথে DB থেকে সাম্প্রতিক ব্যালেন্সসহ ইউজার অবজেক্ট রিটার্ন করে।
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}
