"use client";

import { generateChatResponse } from "@/app/actions/chat";
import type { Document } from "@/app/types/document";
import { Button } from "@/components/ui/button";
import { ChatBubble, ChatBubbleAction, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import type { LanguageModelV1Source } from "@ai-sdk/provider";
import { Bot, CopyIcon, CornerDownLeft, RefreshCcw, Trash2, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import CodeDisplayBlock from "../components/code-display-block";

const ChatAiIcons = [
  {
    icon: CopyIcon,
    label: "Copy",
  },
  {
    icon: RefreshCcw,
    label: "Regenerate",
  },
  {
    icon: Volume2,
    label: "Read Aloud",
  },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  document?: Document;
  timestamp: Date;
  sources?: LanguageModelV1Source[];
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
      id: uuidv4(),
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
          id: uuidv4(),
          role: "assistant",
          content: response.message,
          sources: response.sources,
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
      switch (action) {
        case "Copy":
          await navigator.clipboard.writeText(message.content);
          toast.success("Message copied to clipboard");
          break;
        case "Regenerate":
          if (message.role === "assistant" && messages.length >= 2) {
            const userMessage = messages[messages.length - 2];
            if (userMessage.role === "user") {
              setMessages((prev) => prev.slice(0, -1));
              await handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
            }
          }
          break;
        case "Read Aloud":
          if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(message.content);
            window.speechSynthesis.speak(utterance);
            toast.success("Reading message aloud");
          } else {
            toast.error("Text-to-speech is not supported in your browser");
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error handling action:", error);
      toast.error("Failed to perform action");
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Chat history cleared");
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
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Bot className="size-4 sm:size-5" />
          <h1 className="text-sm sm:text-base font-semibold">Chat Assistant</h1>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearChat} className="size-8 sm:size-9">
            <Trash2 className="size-3.5 sm:size-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-3 sm:p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-4 text-center">
              <Bot className="size-10 sm:size-12 text-muted-foreground" />
              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-2">Welcome to Document Assistant</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Ask questions about your documents and I'll help you find the information you need.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatBubble key={message.id} variant={message.role === "user" ? "sent" : "received"}>
                <ChatBubbleAvatar fallback={message.role === "user" ? "👨🏽" : "🤖"} />
                <ChatBubbleMessage>
                  {renderMessageContent(message.content)}

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 border-t border-border/40 pt-2">
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mb-1">
                        <div className="size-1 rounded-full bg-muted-foreground/70" />
                        <span>Sources</span>
                      </div>
                      <div className="space-y-1">
                        {message.sources.map((source, index) => (
                          <div
                            key={`${message.id}-source-${index}`}
                            className="flex items-start gap-2 text-[10px] sm:text-xs text-muted-foreground/90 hover:text-muted-foreground transition-colors"
                          >
                            <span className="font-medium min-w-[16px]">{index + 1}.</span>
                            <div className="flex-1">
                              <p className="font-medium line-clamp-1">{source.title}</p>
                              {source.url && (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary/70 hover:text-primary truncate block"
                                >
                                  {source.url}
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.role === "assistant" && message.id === messages[messages.length - 1]?.id && (
                    <div className="flex items-center mt-1.5 gap-1">
                      {!isGenerating &&
                        ChatAiIcons.map(({ icon: Icon, label }) => (
                          <ChatBubbleAction
                            key={`${message.id}-${label}`}
                            variant="outline"
                            className="size-4 sm:size-5"
                            icon={<Icon className="size-2.5 sm:size-3" />}
                            onClick={() => handleActionClick(label, message.id)}
                          />
                        ))}
                    </div>
                  )}

                  {message.document && (
                    <div className="mt-2 text-[10px] sm:text-xs opacity-80">
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
            ))
          )}

          {isGenerating && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar fallback="🤖" />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form ref={formRef} onSubmit={handleSubmit} className="p-3 sm:p-4">
          <div className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring">
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about your documents..."
              className="rounded-lg bg-background border-0 shadow-none focus-visible:ring-0 min-h-[44px] sm:min-h-[52px] py-2 sm:py-3 text-sm sm:text-base"
              disabled={isGenerating}
            />
            <div className="flex items-center p-2 sm:p-3 pt-0">
              <Button
                disabled={!input || isGenerating}
                type="submit"
                size="sm"
                className="ml-auto gap-1.5 h-8 sm:h-9 text-xs sm:text-sm"
              >
                Send Message
                <CornerDownLeft className="size-3 sm:size-3.5" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
