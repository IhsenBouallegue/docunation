"use client";

import { type DocumentAnalysis, analyzeDocument } from "@/app/actions/analyze-document";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
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
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Simulate document analysis response
      const result = await analyzeDocument("https://example.com/example.pdf", "example.pdf");

      if (result.success && result.analysis) {
        const analysis = result.analysis;
        const assistantMessage: Message = {
          role: "assistant",
          content: `I've analyzed your document. Here's what I found:
          - Document Type: ${analysis.documentType}
          - Page Count: ${analysis.pageCount}
          - Language: ${analysis.language}
          - Extracted ${analysis.entities.length} entities
          - Validation Status: ${analysis.isValid ? "Valid" : "Invalid"}
          ${analysis.validationErrors ? `\nValidation Errors:\n${analysis.validationErrors.join("\n")}` : ""}`,
          sources: analysis.entities.map(
            (entity) => `${entity.type}: ${entity.value} (${entity.confidence}% confidence)`,
          ),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || "Failed to analyze document");
      }
    } catch (error) {
      toast.error("Failed to analyze document", {
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Document Analysis Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100vh-12rem)]">
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
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 text-xs opacity-80">
                      <p className="font-medium mb-1">Sources:</p>
                      <ul className="list-disc list-inside">
                        {message.sources.map((source, idx) => (
                          <li key={`source-${idx}-${source}`}>{source}</li>
                        ))}
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
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
