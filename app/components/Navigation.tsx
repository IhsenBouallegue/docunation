"use client";

import { Dock } from "@/components/ui/dock";
import { BoxIcon, FileTextIcon, FolderIcon, HomeIcon, MessageSquare, SearchIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { memo } from "react";

const data = [
  {
    icon: HomeIcon,
    label: "Home",
    href: "/",
  },

  {
    icon: MessageSquare,
    label: "Chat",
    href: "/chat",
  },
];

export const Navigation = memo(function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const items = data.map((item) => ({
    ...item,
    onClick: () => router.push(item.href),
  }));

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <Dock items={items} activePath={pathname} className="h-14" />
    </div>
  );
});
