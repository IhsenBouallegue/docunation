import { Header } from "@/app/components/Header";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/app/components/Navigation";
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
        <QueryProvider>
          <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
            <div className="container mx-auto px-4">
              <Header />
              {children}
              <Navigation />
            </div>
          </div>
        </QueryProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
