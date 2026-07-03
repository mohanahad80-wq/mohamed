import ProductForm from "@/components/vendor/ProductForm";
import { createProduct } from "@/actions/products";

export default function NewSellerProductPage() {
  const action = createProduct.bind(null, "SELLER");
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">New wholesale product</h1>
      <ProductForm action={action} vendorType="SELLER" />
    </div>
  );
}
