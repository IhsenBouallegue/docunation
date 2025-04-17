import { Header } from "@/app/components/Header";
import { Navigation } from "@/app/components/Navigation";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Docunation",
  description: "Your personal document companion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "antialiased")}>
        <QueryProvider>
          <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
            <Header />
            <div className="container pt-2 mx-auto px-4">{children}</div>
            <Navigation />
          </div>
        </QueryProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
