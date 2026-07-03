"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  generateOtp,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

import { getPostLoginPath } from "@/lib/routing";

export type ActionState = { error?: string; success?: string } | undefined;

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");

  if (!/^\+?[0-9]{7,15}$/.test(phone)) {
    return { error: "Enter a valid phone number." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing && existing.phoneVerifiedAt) {
    return { error: "An account with this phone number already exists. Try logging in." };
  }

  const passwordHash = await hashPassword(password);
  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, otpCode, otpExpiresAt },
    });
  } else {
    await prisma.user.create({
      data: { phone, passwordHash, otpCode, otpExpiresAt, status: "UNASSIGNED", roles: [] },
    });
  }

  redirect(`/verify-otp?phone=${encodeURIComponent(phone)}`);
}

export async function resendOtp(phone: string): Promise<ActionState> {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return { error: "No account found." };
  const otpCode = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode, otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  });
  return { success: `Code resent. (Demo code: ${otpCode})` };
}

export async function verifyOtp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const phone = String(formData.get("phone") || "").trim();
  const code = String(formData.get("code") || "").trim();

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.otpCode || !user.otpExpiresAt) {
    return { error: "No pending verification for this number." };
  }
  if (user.otpExpiresAt < new Date()) {
    return { error: "Code expired. Request a new one." };
  }
  if (user.otpCode !== code) {
    return { error: "Incorrect code." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { phoneVerifiedAt: new Date(), otpCode: null, otpExpiresAt: null },
  });

  await createSession(user.id);
  redirect(getPostLoginPath(user));
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return { error: "Invalid phone number or password." };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Invalid phone number or password." };

  if (!user.phoneVerifiedAt) {
    redirect(`/verify-otp?phone=${encodeURIComponent(phone)}`);
  }

  if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
    return { error: "This account has been suspended. Contact support." };
  }

  await createSession(user.id);
  redirect(getPostLoginPath(user));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function sendEmailOtp(email: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };

  const emailTaken = await prisma.user.findFirst({
    where: { email, NOT: { id: user.id } },
  });
  if (emailTaken) return { error: "That email is already in use." };

  const emailOtpCode = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      email,
      emailVerifiedAt: null,
      emailOtpCode,
      emailOtpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  return { success: `Verification code sent to ${email}. (Demo code: ${emailOtpCode})` };
}

export async function verifyEmailOtp(code: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  if (!user.emailOtpCode || !user.emailOtpExpiresAt) {
    return { error: "No pending email verification." };
  }
  if (user.emailOtpExpiresAt < new Date()) return { error: "Code expired." };
  if (user.emailOtpCode !== code) return { error: "Incorrect code." };

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date(), emailOtpCode: null, emailOtpExpiresAt: null },
  });

  return { success: "Email verified." };
}
