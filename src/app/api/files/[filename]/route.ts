import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { privateFilePath } from "@/lib/upload";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  // Reject path traversal — filenames are always a bare randomUUID + extension.
  if (filename.includes("/") || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = user.roles.includes("ADMIN");
  if (!isAdmin) {
    const [seller, buyer, rider] = await Promise.all([
      prisma.sellerProfile.findFirst({
        where: { userId: user.id, OR: [{ idDocFile: filename }, { licenseFile: filename }] },
      }),
      prisma.businessBuyerProfile.findFirst({
        where: { userId: user.id, OR: [{ idDocFile: filename }, { licenseFile: filename }] },
      }),
      prisma.riderProfile.findFirst({ where: { userId: user.id, idDocFile: filename } }),
    ]);
    if (!seller && !buyer && !rider) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const buffer = await readFile(privateFilePath(filename));
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
          ? "image/png"
          : [".jpg", ".jpeg"].includes(ext)
            ? "image/jpeg"
            : "application/octet-stream";
    return new NextResponse(new Uint8Array(buffer), { headers: { "Content-Type": contentType } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
