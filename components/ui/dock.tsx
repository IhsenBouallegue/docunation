import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import * as React from "react";

interface DockProps {
  className?: string;
  items: {
    icon: LucideIcon;
    label: string;
    href?: string;
    onClick?: () => void;
  }[];
  activePath?: string;
}

interface DockIconButtonProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
}

const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
  ({ icon: Icon, label, onClick, className, isActive }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative group p-3 rounded-xl transition-colors duration-200",
          "backdrop-blur-md",
          isActive ? "text-primary" : "text-muted-foreground hover:text-primary",
          className,
        )}
      >
        <Icon className="relative z-10 w-5 h-5" />
        <span
          className={cn(
            "absolute -top-8 left-1/2 -translate-x-1/2",
            "px-2 py-1 rounded-md text-xs",
            "bg-background/80 backdrop-blur-sm border border-border/50",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity whitespace-nowrap",
            "shadow-sm",
          )}
        >
          {label}
        </span>
      </motion.button>
    );
  },
);
DockIconButton.displayName = "DockIconButton";

const Dock = React.forwardRef<HTMLDivElement, DockProps>(({ items, className, activePath }, ref) => {
  const activeIndex = React.useMemo(() => {
    return items.findIndex((item) => item.href === activePath);
  }, [items, activePath]);

  return (
    <motion.div
      ref={ref}
      className={cn("flex items-center justify-center", className)}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={cn(
          "flex items-center gap-1 p-2 rounded-2xl relative",
          "bg-background/80 backdrop-blur-md",
          "border border-border/50",
          "shadow-lg hover:shadow-xl",
          "transition-all duration-300",
        )}
      >
        {/* Animated background for active item */}
        {activeIndex !== -1 && (
          <motion.div
            className="absolute w-[44px] h-[44px] rounded-xl bg-primary/20"
            initial={false}
            animate={{
              x: `calc(${activeIndex} * (44px + 4px))`,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            style={{
              top: "8px",
              left: "8px",
            }}
          />
        )}

        {items.map((item) => (
          <DockIconButton key={item.label} {...item} isActive={activePath === item.href} />
        ))}
      </div>
    </motion.div>
  );
});
Dock.displayName = "Dock";

export { Dock };
