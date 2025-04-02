"use client";

import { generateChatResponse } from "@/app/actions/chat";
import type { Document } from "@/app/types/document";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  document?: Document;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    startTransition(async () => {
      try {
        const response = await generateChatResponse(input);

        if (response.success && response.message) {
          const assistantMessage: Message = {
            role: "assistant",
            content: response.message,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          toast.error(`Failed to get response: ${response.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error in chat:", error);
        toast.error("Failed to get response from the assistant");
      }
    });
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Document Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-full">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`message-${index}-${message.role}`}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.document && (
                    <div className="mt-2 text-xs opacity-80">
                      <p className="font-medium mb-1">Document Details:</p>
                      <ul className="list-disc list-inside">
                        <li>Name: {message.document.name}</li>
                        <li>Type: {message.document.type}</li>
                        {message.document.tags && <li>Tags: {message.document.tags.join(", ")}</li>}
                      </ul>
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your documents..."
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
