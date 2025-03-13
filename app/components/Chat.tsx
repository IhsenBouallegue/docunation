"use client";

import { queryDocuments } from "@/app/actions/query-documents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: string[];
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await queryDocuments(userMessage.content);

      if (result.success) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          content: result.answer || "I could not find a relevant answer in the documents.",
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error("Failed to get answer", {
        description: "Please try again",
      });
      console.error("Error getting answer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Chat with Your Documents</CardTitle>
        <CardDescription>Ask questions about your uploaded documents</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{message.role === "assistant" ? "AI" : "You"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2 max-w-[80%]">
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === "assistant" ? "bg-secondary" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <time className="text-xs opacity-50">{message.timestamp.toLocaleTimeString()}</time>
                  </div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="text-xs text-muted-foreground px-4">
                      <p className="font-medium">Sources:</p>
                      <ul className="list-disc list-inside">
                        {message.sources.map((source) => (
                          <li key={source}>{source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="bg-secondary rounded-lg px-4 py-2 max-w-[80%]">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
