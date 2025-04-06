import { cn } from "@/lib/utils";
import type React from "react";

interface IconNumberCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon: React.ReactNode;
  number?: number;
  isActive?: boolean;
  gradient?: string;
}

export function IconNumberCard({
  title,
  description,
  icon,
  number,
  isActive,
  className,
  ...props
}: IconNumberCardProps) {
  return (
    <div
      className={cn("p-4 sm:p-6 md:p-8 relative min-h-[120px] sm:min-h-[140px] overflow-hidden", className)}
      {...props}
    >
      {number !== undefined && (
        <div
          className={cn(
            "absolute rtl:right-2 left-2 -bottom-4 sm:-bottom-8 text-[100px] sm:text-[140px] md:text-[180px] font-bold transition-colors",
            isActive ? "text-black/40" : "text-white/10",
          )}
        >
          {number}
        </div>
      )}
      <div className="flex h-full flex-col justify-between gap-2 sm:gap-4 relative">
        <div className="flex items-start justify-between">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">{title}</h3>
          <div className="relative shrink-0 ml-2 sm:ml-3">
            <div
              className={cn(
                "absolute inset-0 rounded-full backdrop-blur-md transition-colors",
                isActive ? "bg-white/30" : "bg-white/20",
              )}
            />
            <div className={cn("relative p-2 sm:p-2.5 md:p-3 text-white")}>
              <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10">{icon}</div>
            </div>
          </div>
        </div>
        <p
          className={cn(
            "text-sm sm:text-base md:text-lg transition-colors leading-tight",
            isActive ? "text-white" : "text-white/80",
          )}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
