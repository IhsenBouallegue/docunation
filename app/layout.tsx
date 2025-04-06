import { QueryProvider } from "@/app/providers/QueryProvider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Document Assistant",
  description: "AI-powered document management and analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "antialiased")}>
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
