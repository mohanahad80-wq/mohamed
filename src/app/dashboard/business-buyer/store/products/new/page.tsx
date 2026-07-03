import ProductForm from "@/components/vendor/ProductForm";
import { createProduct } from "@/actions/products";

export default function NewStoreProductPage() {
  const action = createProduct.bind(null, "BUSINESS_BUYER_STORE");
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">New retail product</h1>
      <ProductForm action={action} vendorType="BUSINESS_BUYER_STORE" />
    </div>
  );
}
