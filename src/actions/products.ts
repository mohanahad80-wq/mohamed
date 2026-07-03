"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { savePublicFile } from "@/lib/upload";
import { BusinessCategory, VendorType } from "@/generated/prisma/client";
import type { ActionState } from "@/actions/auth";
import { revalidatePath } from "next/cache";

async function resolveVendorContext(vendorType: VendorType) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." as const };

  if (vendorType === "SELLER") {
    if (!user.sellerProfile || user.sellerProfile.status !== "APPROVED") {
      return { error: "Your seller account is not approved yet." as const };
    }
    return { user, sellerId: user.sellerProfile.id, buyerStoreId: undefined };
  } else {
    if (!user.businessBuyerProfile || user.businessBuyerProfile.status !== "APPROVED") {
      return { error: "Your business buyer account is not approved yet." as const };
    }
    return { user, sellerId: undefined, buyerStoreId: user.businessBuyerProfile.id };
  }
}

export async function createProduct(
  vendorType: VendorType,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await resolveVendorContext(vendorType);
  if ("error" in ctx) return { error: ctx.error };

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "") as BusinessCategory;
  const price = parseFloat(String(formData.get("price") || "0"));
  const stock = parseInt(String(formData.get("stock") || "0"), 10);
  const defaultMinQty = vendorType === "SELLER" ? 10 : 1;
  const minOrderQty = parseInt(String(formData.get("minOrderQty") || defaultMinQty), 10);

  if (!name || !description || !category || !(price > 0) || !(stock >= 0)) {
    return { error: "Fill in all required fields with valid values." };
  }
  if (vendorType === "SELLER" && minOrderQty < 10) {
    return { error: "Wholesale minimum order quantity must be at least 10 units." };
  }
  if (vendorType === "BUSINESS_BUYER_STORE" && minOrderQty < 1) {
    return { error: "Minimum order quantity must be at least 1." };
  }

  const images: string[] = [];
  for (const key of ["image1", "image2", "image3", "image4", "image5"]) {
    const file = formData.get(key) as File | null;
    if (file && file.size > 0) images.push(await savePublicFile(file));
  }
  if (images.length === 0) return { error: "Upload at least 1 product image." };

  await prisma.product.create({
    data: {
      vendorType,
      sellerId: ctx.sellerId,
      buyerStoreId: ctx.buyerStoreId,
      name,
      description,
      category,
      price,
      stock,
      minOrderQty,
      images,
      status: "PENDING",
    },
  });

  const path = vendorType === "SELLER" ? "/dashboard/seller/products" : "/dashboard/business-buyer/store";
  revalidatePath(path);
  redirect(path);
}

export async function updateProduct(
  productId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Product not found." };

  const owns =
    (product.sellerId && product.sellerId === user.sellerProfile?.id) ||
    (product.buyerStoreId && product.buyerStoreId === user.businessBuyerProfile?.id);
  if (!owns) return { error: "You do not own this product." };

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "") as BusinessCategory;
  const price = parseFloat(String(formData.get("price") || "0"));
  const stock = parseInt(String(formData.get("stock") || "0"), 10);
  const minOrderQty = parseInt(String(formData.get("minOrderQty") || "1"), 10);

  if (!name || !description || !category || !(price > 0) || !(stock >= 0)) {
    return { error: "Fill in all required fields with valid values." };
  }

  const newImages: string[] = [];
  for (const key of ["image1", "image2", "image3", "image4", "image5"]) {
    const file = formData.get(key) as File | null;
    if (file && file.size > 0) newImages.push(await savePublicFile(file));
  }
  const images = newImages.length > 0 ? newImages : product.images;

  // Editing price/images/description never requires re-approval once a product
  // has already been approved once; only brand-new products start pending.
  await prisma.product.update({
    where: { id: productId },
    data: { name, description, category, price, stock, minOrderQty, images },
  });

  const path =
    product.vendorType === "SELLER" ? "/dashboard/seller/products" : "/dashboard/business-buyer/store";
  revalidatePath(path);
  redirect(path);
}

export async function deactivateProduct(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Not found." };
  const owns =
    (product.sellerId && product.sellerId === user.sellerProfile?.id) ||
    (product.buyerStoreId && product.buyerStoreId === user.businessBuyerProfile?.id);
  if (!owns) return { error: "You do not own this product." };

  await prisma.product.update({
    where: { id: productId },
    data: { isDeactivated: !product.isDeactivated },
  });

  const path =
    product.vendorType === "SELLER" ? "/dashboard/seller/products" : "/dashboard/business-buyer/store";
  revalidatePath(path);
}
