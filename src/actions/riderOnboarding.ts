"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { savePrivateFile, savePublicFile } from "@/lib/upload";
import { District, Role } from "@/generated/prisma/client";
import type { ActionState } from "@/actions/auth";
import { notify } from "@/lib/notify";

export async function submitRiderProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const vehicleType = String(formData.get("vehicleType") || "").trim();
  const plateNumber = String(formData.get("plateNumber") || "").trim();
  const payoutNumber = String(formData.get("payoutNumber") || "").trim();
  const serviceDistricts = formData.getAll("serviceDistricts") as District[];

  if (!fullName || !phone || !vehicleType || !plateNumber || !payoutNumber || serviceDistricts.length === 0) {
    return { error: "Fill in all required fields and pick at least one service district." };
  }

  const idDoc = formData.get("idDoc") as File | null;
  const photo = formData.get("photo") as File | null;
  if (!idDoc || idDoc.size === 0) return { error: "Upload your ID or license." };

  const idDocFile = await savePrivateFile(idDoc);
  const photoFile = photo && photo.size > 0 ? await savePublicFile(photo) : null;

  const roles = Array.from(new Set([...user.roles, "RIDER" as Role]));

  await prisma.$transaction(async (tx) => {
    await tx.riderProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fullName,
        phone,
        vehicleType,
        plateNumber,
        idDocFile,
        photoFile,
        serviceDistricts,
        payoutNumber,
        status: "PENDING",
      },
      update: {
        fullName,
        phone,
        vehicleType,
        plateNumber,
        idDocFile,
        photoFile: photoFile ?? undefined,
        serviceDistricts,
        payoutNumber,
        status: "PENDING",
      },
    });
    await tx.user.update({ where: { id: user.id }, data: { roles, status: "PENDING", fullName } });
  });

  const admins = await prisma.user.findMany({ where: { roles: { has: "ADMIN" } }, select: { id: true } });
  await Promise.all(
    admins.map((a) => notify(a.id, "VENDOR_APPROVAL", "New rider application", `${fullName} applied to become a Rider.`))
  );

  redirect("/pending-approval");
}
