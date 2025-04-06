"use client";

import { generateChatResponse } from "@/app/actions/chat";
import type { Document } from "@/app/types/document";
import { Button } from "@/components/ui/button";
import { ChatBubble, ChatBubbleAction, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import { CopyIcon, CornerDownLeft, RefreshCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import CodeDisplayBlock from "../components/code-display-block";

const ChatAiIcons = [
  {
    icon: CopyIcon,
    label: "Copy",
  },
  {
    icon: RefreshCcw,
    label: "Refresh",
  },
  {
    icon: Volume2,
    label: "Volume",
  },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  document?: Document;
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      } catch (error) {
        console.error("Error scrolling to bottom:", error);
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    try {
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsGenerating(true);

      const response = await generateChatResponse(input);

      if (response.success && response.message) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        toast.error(`Failed to get response: ${response.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error in chat:", error);
      toast.error("Failed to get response from the assistant");
    } finally {
      setIsGenerating(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isGenerating || !input) return;
      formRef.current?.requestSubmit();
    }
  };

  const handleActionClick = async (action: string, messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    try {
      if (action === "Copy" && message.role === "assistant") {
        await navigator.clipboard.writeText(message.content);
        toast.success("Message copied to clipboard");
      }
    } catch (error) {
      console.error("Error handling action:", error);
      toast.error("Failed to perform action");
    }
  };

  const renderMessageContent = (content: string) => {
    try {
      return content.split("```").map((part, i) => {
        const key = `${i}-${part.slice(0, 20)}`;
        if (i % 2 === 0) {
          return (
            <Markdown key={key} remarkPlugins={[remarkGfm]}>
              {part}
            </Markdown>
          );
        }
        return (
          <pre className="whitespace-pre-wrap pt-2" key={key}>
            <CodeDisplayBlock code={part} lang="" />
          </pre>
        );
      });
    } catch (error) {
      console.error("Error rendering message:", error);
      return <p className="text-destructive">Error rendering message content</p>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 w-full">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="w-full bg-background shadow-sm border rounded-lg p-8 flex flex-col gap-2">
              <h1 className="font-bold">Welcome to Document Assistant</h1>
              <p className="text-muted-foreground text-sm">
                Ask questions about your documents and I'll help you find the information you need.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatBubble key={message.id} variant={message.role === "user" ? "sent" : "received"}>
              <ChatBubbleAvatar fallback={message.role === "user" ? "👨🏽" : "🤖"} />
              <ChatBubbleMessage>
                {renderMessageContent(message.content)}

                {message.role === "assistant" && message.id === messages[messages.length - 1]?.id && (
                  <div className="flex items-center mt-1.5 gap-1">
                    {!isGenerating &&
                      ChatAiIcons.map(({ icon: Icon, label }) => (
                        <ChatBubbleAction
                          key={`${message.id}-${label}`}
                          variant="outline"
                          className="size-5"
                          icon={<Icon className="size-3" />}
                          onClick={() => handleActionClick(label, message.id)}
                        />
                      ))}
                  </div>
                )}

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
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {isGenerating && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar fallback="🤖" />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about your documents..."
            className="rounded-lg bg-background border-0 shadow-none focus-visible:ring-0"
            disabled={isGenerating}
          />
          <div className="flex items-center p-3 pt-0">
            <Button disabled={!input || isGenerating} type="submit" size="sm" className="ml-auto gap-1.5">
              Send Message
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
