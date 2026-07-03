"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { savePrivateFile, savePublicFile } from "@/lib/upload";
import { District, BusinessCategory, Role, Prisma } from "@/generated/prisma/client";
import type { ActionState } from "@/actions/auth";
import { notify } from "@/lib/notify";

export async function selectCustomer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const fullName = String(formData.get("fullName") || "").trim();
  const district = String(formData.get("district") || "") as District;
  const details = String(formData.get("details") || "").trim();

  if (!fullName) return { error: "Full name is required." };

  const roles = Array.from(new Set([...user.roles, "CUSTOMER" as Role]));

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: user.id },
      data: { fullName, roles, status: "APPROVED" },
    });
    if (district && details) {
      await tx.address.create({
        data: { userId: user.id, district, details, isDefault: true },
      });
    }
  });

  redirect("/shop");
}

export async function submitVendorProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  if (!user.emailVerifiedAt || !user.email) {
    return { error: "Verify your email before submitting." };
  }

  const role = String(formData.get("role") || "") as "SELLER" | "BUSINESS_BUYER";
  if (role !== "SELLER" && role !== "BUSINESS_BUYER") return { error: "Invalid role." };

  const businessName = String(formData.get("businessName") || "").trim();
  const ownerFullName = String(formData.get("ownerFullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const category = String(formData.get("category") || "") as BusinessCategory;
  const district = String(formData.get("district") || "") as District;
  const city = String(formData.get("city") || "Mogadishu").trim();
  const payoutNumber = String(formData.get("payoutNumber") || "").trim();

  const idDoc = formData.get("idDoc") as File | null;
  const license = formData.get("license") as File | null;
  const logo = formData.get("logo") as File | null;

  if (!businessName || !ownerFullName || !phone || !category || !district || !payoutNumber) {
    return { error: "Fill in all required fields." };
  }

  const hasIdDoc = idDoc && idDoc.size > 0;
  const hasLicense = license && license.size > 0;
  if (!hasIdDoc && !hasLicense) {
    return { error: "Upload a National ID or a Business License (at least one)." };
  }

  const idDocFile = hasIdDoc ? await savePrivateFile(idDoc as File) : null;
  const licenseFile = hasLicense ? await savePrivateFile(license as File) : null;
  const logoFile = logo && logo.size > 0 ? await savePublicFile(logo) : null;

  const roles = Array.from(new Set([...user.roles, role as Role]));

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (role === "SELLER") {
      await tx.sellerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          businessName,
          ownerFullName,
          phone,
          email: user.email!,
          category,
          district,
          city,
          payoutNumber,
          idDocFile,
          licenseFile,
          logoFile,
          status: "PENDING",
        },
        update: {
          businessName,
          ownerFullName,
          phone,
          category,
          district,
          city,
          payoutNumber,
          idDocFile: idDocFile ?? undefined,
          licenseFile: licenseFile ?? undefined,
          logoFile: logoFile ?? undefined,
          status: "PENDING",
        },
      });
    } else {
      await tx.businessBuyerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          businessName,
          ownerFullName,
          phone,
          email: user.email!,
          category,
          district,
          city,
          payoutNumber,
          idDocFile,
          licenseFile,
          logoFile,
          storeName: businessName,
          status: "PENDING",
        },
        update: {
          businessName,
          ownerFullName,
          phone,
          category,
          district,
          city,
          payoutNumber,
          idDocFile: idDocFile ?? undefined,
          licenseFile: licenseFile ?? undefined,
          logoFile: logoFile ?? undefined,
          status: "PENDING",
        },
      });
    }

    // Verification is per account: adding a stricter role re-applies pending
    // review to the whole account, even if it was previously approved as Customer.
    await tx.user.update({
      where: { id: user.id },
      data: { roles, status: "PENDING", fullName: user.fullName ?? ownerFullName },
    });
  });

  const admins = await prisma.user.findMany({
    where: { roles: { has: "ADMIN" } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((a: { id: string }) =>
      notify(
        a.id,
        "VENDOR_APPROVAL",
        "New vendor application",
        `${businessName} applied as ${role === "SELLER" ? "Seller" : "Business Buyer"} and needs review.`
      )
    )
  );

  redirect("/pending-approval");
}
