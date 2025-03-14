"use client";

import { queryDocuments } from "@/app/actions/query-documents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: string[];
  action?: {
    type: "application_start" | "document_request" | "info_collection" | "application_review";
    applicationId?: string;
    requiredDocs?: string[];
    personalInfo?: string[];
  };
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
    <Card className="w-full h-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Digital Twin
        </CardTitle>
        <CardDescription>
          I'm your digital replica. I understand your documents and can handle applications just like you would.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ScrollArea className="h-[600px] pr-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground p-8">
              <p className="mb-2">👋 Hi! I'm your Digital Twin. I've learned about you from your documents.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-md mx-auto mt-4">
                <Button
                  variant="outline"
                  className="text-sm"
                  onClick={() => setInput("What personal information have you learned about me?")}
                >
                  View My Profile
                </Button>
                <Button
                  variant="outline"
                  className="text-sm"
                  onClick={() => setInput("What applications can you submit on my behalf?")}
                >
                  Available Applications
                </Button>
                <Button
                  variant="outline"
                  className="text-sm"
                  onClick={() => setInput("Can you help me apply for a visa using my existing documents?")}
                >
                  Start Visa Application
                </Button>
                <Button
                  variant="outline"
                  className="text-sm"
                  onClick={() => setInput("What additional documents do you need from me?")}
                >
                  Required Documents
                </Button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{message.role === "assistant" ? "Twin" : "You"}</AvatarFallback>
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
                      <p className="font-medium">Found in:</p>
                      <ul className="list-disc list-inside">
                        {message.sources.map((source) => (
                          <li key={`${message.id}-${source}`} className="truncate">
                            {source}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {message.action && (
                    <div className="flex flex-wrap gap-2 px-4">
                      {message.action.type === "application_start" && (
                        <Button size="sm" variant="secondary">
                          Continue Application
                        </Button>
                      )}
                      {message.action.type === "document_request" && (
                        <Button size="sm" variant="secondary">
                          Upload Missing Documents
                        </Button>
                      )}
                      {message.action.type === "info_collection" && (
                        <Button size="sm" variant="secondary">
                          Review Information
                        </Button>
                      )}
                      {message.action.type === "application_review" && (
                        <Button size="sm" variant="secondary">
                          Review Before Submission
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>Twin</AvatarFallback>
                </Avatar>
                <div className="bg-secondary rounded-lg px-4 py-2 max-w-[80%]">
                  <div className="flex gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what you need help with..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            {isLoading ? "Thinking..." : "Send"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
