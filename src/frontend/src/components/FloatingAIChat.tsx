import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import type { Lead } from "../types";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  time: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generateBotReply(userMsg: string, leads: Lead[]): string {
  const msg = userMsg.trim();

  // Rule 1: Greeting
  if (/^(hi|hello|hey)$/i.test(msg)) {
    return "Please upload RC copy";
  }

  // Rule 2: RC missing
  if (/rc|registration certificate|vehicle/i.test(msg)) {
    const hasRCIssue = leads.some(
      (l) => !l.docsUploaded.rcFront || !l.docsUploaded.rcBack,
    );
    if (hasRCIssue) {
      return "Please send RC front and back";
    }
  }

  // Rule 3: Documents missing
  if (/document|doc|kyc|pan|aadhaar/i.test(msg)) {
    const hasDocIssue = leads.some(
      (l) =>
        (!l.panUrl && !l.kycData.pan) ||
        (!l.aadhaarFrontUrl && !l.kycData.aadhaar),
    );
    if (hasDocIssue) {
      return "Please upload your documents:\n\u2022 PAN Card\n\u2022 Aadhaar Card (front and back)";
    }
  }

  // Rule 4: Payment pending
  if (/payment|pay|link/i.test(msg)) {
    const pendingLead = leads.find(
      (l) => l.paymentStatus === "Payment Pending",
    );
    if (pendingLead) {
      const link = pendingLead.paymentLink?.trim();
      if (link) {
        return `Please complete payment using the link below:\n${link}`;
      }
      return "Please complete payment. Please ask your agent for the payment link.";
    }
  }

  // Fallback
  return "I'm here to help with your insurance process. You can ask about your documents, RC upload, KYC, or payment status.";
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-[#128C7E] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
          isUser
            ? "bg-[#DCF8C6] rounded-br-sm"
            : "bg-white rounded-bl-sm border border-gray-100"
        }`}
      >
        <p className="text-[13px] text-gray-800 leading-snug break-words whitespace-pre-line">
          {msg.text}
        </p>
        <p
          className={`text-[10px] mt-1 text-gray-400 ${isUser ? "text-right" : ""}`}
        >
          {msg.time}
        </p>
      </div>
    </div>
  );
}

const QUICK_REPLIES = ["Hi", "RC upload", "Documents", "Payment"];

export default function FloatingAIChat() {
  const { leads } = useApp();
  const [open, setOpen] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [scrollTick, setScrollTick] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Proactive greeting when panel opens for the first time
  useEffect(() => {
    if (open && !greeted) {
      setGreeted(true);
      const greeting: ChatMessage = {
        id: "greeting",
        text: "Hello! \ud83d\udc4b I'm your PB Insurance AI assistant. How can I help you today?",
        sender: "bot",
        time: formatTime(new Date()),
      };
      setMessages([greeting]);
      setScrollTick((n) => n + 1);
    }
  }, [open, greeted]);

  // Scroll to bottom when scrollTick changes
  useEffect(() => {
    if (open && scrollTick > 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 30);
    }
  }, [open, scrollTick]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || isBotTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: "user",
      time: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsBotTyping(true);
    setScrollTick((n) => n + 1);

    // Simulate typing delay
    setTimeout(() => {
      const replyText = generateBotReply(text, leads);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: "bot",
        time: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsBotTyping(false);
      setScrollTick((n) => n + 1);
    }, 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (chip: string) => {
    handleSend(chip);
  };

  return (
    <>
      {/* Chat Panel */}
      <div
        className={`fixed bottom-20 right-20 z-[60] w-[320px] max-w-[calc(90vw-1rem)] transition-all duration-300 origin-bottom-right ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-90 pointer-events-none"
        }`}
        data-ocid="ai_chat.panel"
        aria-hidden={!open}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
          style={{ height: "min(480px, calc(100dvh - 96px))" }}
        >
          {/* Header */}
          <div className="bg-[#128C7E] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">
                  PB Insurance AI
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                  <p className="text-white/80 text-[11px]">Online</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Close AI chat"
              data-ocid="ai_chat.close_button"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 bg-[#ECE5DD]">
            <div className="p-3 space-y-2">
              {/* Date chip */}
              <div className="flex justify-center">
                <span className="text-[10px] bg-white/70 text-gray-500 px-2.5 py-0.5 rounded-full font-medium">
                  Today
                </span>
              </div>

              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {/* Typing indicator */}
              {isBotTyping && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-[#128C7E] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex gap-1 items-center h-4">
                      <span
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Quick reply chips */}
          <div className="bg-white px-3 pt-2 pb-1 border-t border-gray-100 flex gap-2 overflow-x-auto flex-shrink-0">
            {QUICK_REPLIES.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleQuickReply(chip)}
                disabled={isBotTyping}
                className="flex-shrink-0 text-[11px] font-medium text-[#128C7E] border border-[#128C7E]/40 rounded-full px-2.5 py-1 hover:bg-[#128C7E]/10 disabled:opacity-40 transition-colors whitespace-nowrap"
                data-ocid="ai_chat.tab"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input area */}
          <div className="bg-[#F0F0F0] px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about RC, KYC, payment\u2026"
              className="flex-1 bg-white rounded-full text-sm py-2 px-4 border-0 outline-none focus:ring-2 focus:ring-[#128C7E]/30 shadow-sm min-w-0"
              data-ocid="ai_chat.input"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isBotTyping}
              className="w-9 h-9 flex-shrink-0 rounded-full bg-[#128C7E] hover:bg-[#0e7a6e] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
              aria-label="Send message"
              data-ocid="ai_chat.submit_button"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating AI Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`fixed bottom-4 right-20 z-[60] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 ${
          open
            ? "bg-gray-600 hover:bg-gray-700"
            : "bg-[#128C7E] hover:bg-[#0e7a6e]"
        }`}
        aria-label="Open AI assistant"
        data-ocid="ai_chat.open_modal_button"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Bot className="w-6 h-6 text-white" />
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-yellow-400 text-yellow-900 px-1 py-0.5 rounded-full border-2 border-white leading-none">
            AI
          </span>
        )}
      </button>
    </>
  );
}
