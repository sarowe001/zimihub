"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

const signupSchema = z.object({
  name: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"),
  email: z.string().trim().email("সঠিক ইমেইল দিন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

export type SignupState = {
  error?: string;
  success?: boolean;
};

// নতুন ব্যবহারকারীদের ২৫ টাকার ফ্রি ব্যালেন্স দিয়ে শুরু করানো হয় (xKiro-র মতো ফ্রি টোকেন)
const SIGNUP_BONUS_POISHA = 2500;

export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "তথ্য সঠিক নয়" };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return { error: "এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      balancePoisha: SIGNUP_BONUS_POISHA,
    },
  });

  await signIn("credentials", {
    email: normalizedEmail,
    password,
    redirectTo: "/dashboard",
  });

  return { success: true };
}
