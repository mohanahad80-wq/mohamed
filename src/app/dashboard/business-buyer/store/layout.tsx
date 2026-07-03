import VendorSidebar from "@/components/vendor/VendorSidebar";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-8">
      <VendorSidebar base="/dashboard/business-buyer/store" title="My Store" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
