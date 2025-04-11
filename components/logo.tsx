import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2 relative h-6 w-6", className)}>
      <Image src="/Docunation_logo_text.png" alt="Docunation Logo" fill className="object-contain" priority />
    </div>
  );
}
