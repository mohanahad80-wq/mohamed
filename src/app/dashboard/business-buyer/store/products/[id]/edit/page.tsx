import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductForm from "@/components/vendor/ProductForm";
import { updateProduct } from "@/actions/products";

export default async function EditStoreProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.buyerStoreId !== user.businessBuyerProfile?.id) notFound();

  const action = updateProduct.bind(null, product.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Edit product</h1>
      <ProductForm
        action={action}
        vendorType="BUSINESS_BUYER_STORE"
        defaultValues={{
          name: product.name,
          description: product.description,
          category: product.category,
          price: Number(product.price),
          stock: product.stock,
          minOrderQty: product.minOrderQty,
        }}
      />
    </div>
  );
}
