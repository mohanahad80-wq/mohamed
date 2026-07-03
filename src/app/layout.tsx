import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "MAMA SACDIYA",
  description: "Somali B2B2C wholesale & retail marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 font-sans">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
          MAMA SACDIYA — Mogadishu marketplace
        </footer>
      </body>
    </html>
  );
}
