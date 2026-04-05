import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";

interface Message {
  id: string;
  text: string;
  sender: "agent" | "customer";
  time: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FloatingWhatsApp() {
  const { currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [unread, setUnread] = useState(1);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! How can I help you with your insurance policy today?",
      sender: "agent",
      time: formatTime(new Date()),
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        textareaRef.current?.focus();
      }, 50);
    }
  }, [open]);

  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: "agent",
      time: formatTime(new Date()),
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage("");
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      30,
    );

    // Simulate auto-reply after 1.2s
    setTimeout(() => {
      const replies = [
        "Thank you for reaching out! We will process your request shortly.",
        "Got it! Our team is reviewing your policy details.",
        "Your query has been noted. We will follow up with you soon.",
        "Sure, let me check that for you right away.",
      ];
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: "customer",
        time: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, reply]);
      if (!open) setUnread((n) => n + 1);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        30,
      );
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Chat panel */}
      <div
        className={`fixed bottom-20 right-4 z-50 w-[320px] max-w-[calc(100vw-2rem)] transition-all duration-300 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-[#25D366] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {getInitials(currentUser.name)}
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
                  <p className="text-white/80 text-[11px]">Online</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <ChevronDown className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[280px] bg-[#ECE5DD]">
            <div className="p-3 space-y-2">
              {/* Date chip */}
              <div className="flex justify-center">
                <span className="text-[10px] bg-white/70 text-gray-500 px-2.5 py-0.5 rounded-full font-medium shadow-xs">
                  Today
                </span>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "agent" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-xs ${
                      msg.sender === "agent"
                        ? "bg-[#DCF8C6] rounded-br-sm"
                        : "bg-white rounded-bl-sm"
                    }`}
                  >
                    <p className="text-[13px] text-gray-800 leading-snug break-words">
                      {msg.text}
                    </p>
                    <p
                      className={`text-[10px] mt-1 ${
                        msg.sender === "agent"
                          ? "text-gray-400 text-right"
                          : "text-gray-400"
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="bg-[#F0F0F0] px-3 py-2.5 flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 resize-none bg-white border-0 rounded-xl text-sm py-2 px-3 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-xs min-h-[38px] max-h-[90px]"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!message.trim()}
              className="w-9 h-9 flex-shrink-0 rounded-full bg-[#25D366] hover:bg-[#20C157] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20C157] active:scale-95 shadow-lg flex items-center justify-center transition-all duration-200"
        aria-label="Open WhatsApp chat"
        data-ocid="floating.whatsapp.button"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" fill="white" />
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
