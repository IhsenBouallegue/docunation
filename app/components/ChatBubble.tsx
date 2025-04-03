"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MessageCircle, Minimize2, X } from "lucide-react";
import { useState } from "react";

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle chat message submission
    setMessage("");
  };

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
          <div className="flex items-center justify-between border-b px-4 py-2">
            <h3 className="font-semibold">Assistant</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMinimized(true)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">{/* Chat messages will go here */}</div>

          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex gap-2">
              <Input placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} />
              <Button type="submit">Send</Button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}
