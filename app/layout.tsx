import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/contexts/locale-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCP Gateway",
  description: "Api.ToMCP Gateway - birleşik yönetim arayüzü",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <LocaleProvider>{children}</LocaleProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
