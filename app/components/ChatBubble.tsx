"use client";

import Chat from "@/app/components/Chat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) {
    return (
      <Button className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg" onClick={() => setIsOpen(true)}>
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed right-6 shadow-lg transition-all duration-200",
        isMinimized ? "bottom-6 h-12 w-12 rounded-full" : "bottom-6 h-[500px] w-[400px] rounded-2xl",
      )}
    >
      {isMinimized ? (
        <Button variant="ghost" className="h-12 w-12 rounded-full" onClick={() => setIsMinimized(false)}>
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex justify-between items-center p-2 border-b">
            <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)}>
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Chat />
        </div>
      )}
    </Card>
  );
}
