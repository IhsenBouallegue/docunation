import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/Docunation_logo_text.png"
        alt="Docunation Logo"
        width={showText ? 200 : 40}
        height={40}
        className="object-contain"
        priority
      />
    </div>
  );
}
