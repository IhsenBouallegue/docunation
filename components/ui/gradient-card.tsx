import { cn } from "@/lib/utils";
import React from "react";

interface GradientProps {
  gradient: string | { from: string; via: string; to: string };
}

interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient: GradientProps["gradient"];
  isActive?: boolean;
}

export function GradientCard({ gradient, isActive = false, className, children, ...props }: GradientCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-0 shadow-lg transition-all",
        isActive ? "ring-2 ring-white/50 shadow-lg scale-[1.02]" : "hover:scale-[1.02]",
        className,
      )}
      {...props}
    >
      <GradientBackground gradient={gradient} isActive={isActive} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

function GradientBackground({
  gradient,
  isActive,
}: {
  gradient: GradientProps["gradient"];
  isActive: boolean;
}) {
  if (typeof gradient === "string") {
    return (
      <>
        <div
          className={cn(
            "absolute inset-0 before:absolute before:inset-0 before:z-0 before:opacity-80 before:blur-sm",
            gradient,
          )}
        />
        <div
          className={cn("absolute inset-0 backdrop-blur-sm transition-colors", isActive ? "bg-white/5" : "bg-black/20")}
        />
      </>
    );
  }

  return (
    <>
      <div
        style={
          {
            "--gradient-from": gradient.from,
            "--gradient-via": gradient.via,
            "--gradient-to": gradient.to,
          } as React.CSSProperties
        }
        className="absolute inset-0 before:absolute before:inset-0 before:z-0 before:opacity-80 before:blur-sm before:[background-image:linear-gradient(to_bottom_right,var(--gradient-from),var(--gradient-via),var(--gradient-to))]"
      />
      <div
        className={cn("absolute inset-0 backdrop-blur-sm transition-colors", isActive ? "bg-white/5" : "bg-black/20")}
      />
    </>
  );
}

export const GradientCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 text-white", className)} {...props} />,
);
GradientCardContent.displayName = "GradientCardContent";

export const GradientCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 pt-2 pb-3 mt-4 border-t border-white/10 text-white/80", className)} {...props} />
  ),
);
GradientCardFooter.displayName = "GradientCardFooter";
