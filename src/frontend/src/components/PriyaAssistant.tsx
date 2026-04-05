import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  StopCircle,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import type { Lead } from "../types";

// ---- Speech Recognition types (not always in TS lib) ----

interface ISpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

// ---- Component types ----

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  time: string;
}

type ConversationState =
  | "idle"
  | "collecting_vehicle"
  | "pb_portal_step1"
  | "pb_portal_step2"
  | "pb_portal_step3"
  | "rc_check"
  | "document_check"
  | "quote_stage"
  | "payment_stage";

export interface PriyaAssistantProps {
  onOpenNewLead?: () => void;
}

// ---- Utility ----

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---- Knowledge base ----

const INSURANCE_QA: Record<string, string> = {
  ncb: "NCB matlab No Claim Bonus. Agar aapne last year koi claim nahi kiya, toh aapko premium mein discount milta hai. NCB 20% se shuru hokar 50% tak ja sakta hai.",
  idv: "IDV matlab Insured Declared Value. Yeh aapki gaadi ki current market value hoti hai. Claim ke waqt isi amount tak milta hai.",
  claim:
    "Claim ek request hai jo aap insurance company ko dete hain accident ya damage ke baad. Claim file karne ke liye RC, driving license, FIR copy chahiye.",
  premium:
    "Premium woh amount hai jo aap insurance ke liye har saal pay karte hain. Yeh IDV, NCB, age of vehicle aur add-ons pe depend karta hai.",
  policy:
    "Insurance policy ek agreement hai aapke aur insurance company ke beech. Isme coverage details, premium, aur terms hoti hain.",
  renewal:
    "Policy renewal tab hoti hai jab aapki purani policy expire ho rahi ho. Renewal se NCB maintain rehta hai.",
  odp: "Own Damage Premium vehicle ke physical damage ke liye hota hai. Third party alag hota hai jo dusron ke nuqsaan ke liye hota hai.",
  tp: "Third Party insurance mandatory hai India mein. Yeh doosre logon ke damage ya injury cover karta hai agar aapki galti se accident ho.",
  addon:
    "Add-ons extra coverage hote hain jaise zero depreciation, roadside assistance, engine protection. Yeh premium thoda badhate hain but coverage better karte hain.",
  zerodep:
    "Zero Depreciation add-on se claim amount mein depreciation nahi katata. Matlab aapko purana value nahi milega, full repair cost milega.",
};

// ---- Reply generator ----

function generatePriyaReply(
  userMsg: string,
  state: ConversationState,
  leads: Lead[],
  setState: (s: ConversationState) => void,
): string {
  const msg = userMsg.toLowerCase().trim();

  // Commands
  if (/quotation|quote|quoting/i.test(msg)) {
    setState("collecting_vehicle");
    return "Bilkul! Main quotation mein madad karungi. Pehle aapka vehicle number batayein please.";
  }
  if (/lead|new lead|create lead/i.test(msg)) {
    return "__OPEN_NEW_LEAD__";
  }
  if (/payment|pay|bhugtan/i.test(msg)) {
    setState("payment_stage");
    return "Main payment process mein madad karungi. Payment link aapke lead detail page mein save hai. Wahan jaayein aur 'Send Payment Link' button use karein WhatsApp pe bhejne ke liye.";
  }
  if (/help|madad|what can you|kya kar/i.test(msg)) {
    return "Main Priya hoon, aapki insurance assistant! Main yeh kar sakti hoon:\n\n• Quotation process guide\n• New lead create karna\n• Payment process help\n• NCB, IDV, claim explain karna\n• Document checklist\n\nKoi bhi command try karein ya seedha poochh lein!";
  }

  // Insurance Q&A keyword checks
  if (/ncb/i.test(msg)) return INSURANCE_QA.ncb;
  if (/idv/i.test(msg)) return INSURANCE_QA.idv;
  if (/claim/i.test(msg)) return INSURANCE_QA.claim;
  if (/premium/i.test(msg)) return INSURANCE_QA.premium;
  if (/zero.?dep|zero.?depreciation/i.test(msg)) return INSURANCE_QA.zerodep;
  if (/add.?on/i.test(msg)) return INSURANCE_QA.addon;
  if (/third.?party|\btp\b/i.test(msg)) return INSURANCE_QA.tp;
  if (/renewal|renew/i.test(msg)) return INSURANCE_QA.renewal;
  if (/\bodp\b/i.test(msg)) return INSURANCE_QA.odp;
  if (/policy/i.test(msg)) return INSURANCE_QA.policy;

  // State machine flows
  if (state === "collecting_vehicle") {
    if (
      /[A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,2}[-\s]?\d{4}/i.test(msg) ||
      msg.length > 3
    ) {
      setState("pb_portal_step1");
      return `Vehicle number note kar liya: ${userMsg.toUpperCase()}. Ab PB Portal pe jaayein https://www.pbpartners.com. Step 1: Vehicle number enter karein aur details check karein. Kya details aa gaye?`;
    }
    return "Kripya sahi vehicle number batayein, jaise MH12AB1234.";
  }

  if (state === "pb_portal_step1") {
    if (/ha|yes|haan|aa gaye|done|ok/i.test(msg)) {
      setState("pb_portal_step2");
      return "Acha! Step 2: Fuel type aur vehicle model check karein. RC ke hisaab se match hona chahiye. Kya fuel type aur model sahi hai?";
    }
    return "Portal pe jaake vehicle number enter karein. Kya help chahiye?";
  }

  if (state === "pb_portal_step2") {
    if (/no|nahi|mismatch|galat/i.test(msg)) {
      setState("rc_check");
      return "\u26a0\ufe0f Warning: Fuel type ya model mismatch hai! RC copy se dobara verify karein. Sahi details enter karein portal pe, phir confirm karein.";
    }
    if (/ha|yes|haan|match|sahi/i.test(msg)) {
      setState("rc_check");
      return "Bahut acha! Step 3: RC ke hisaab se saari details match karein — owner name, engine number, chassis number. Kya sab match kar raha hai?";
    }
    return "Fuel type aur model check karke batayein — match hai ya nahi?";
  }

  if (state === "rc_check") {
    if (/no|nahi|mismatch|galat|nhi/i.test(msg)) {
      return "\u26a0\ufe0f RC Mismatch Warning! RC aur entered details match nahi kar rahe. Kripya RC dobara check karein aur sahi details update karein. Bina match ke quotation accurate nahi hoga.";
    }
    if (/ha|yes|haan|match|sahi/i.test(msg)) {
      setState("document_check");
      return "Sab details match hain. Ab documents check karte hain. Kya yeh documents upload hain?\n\n\u2705 RC Front\n\u2705 RC Back\n\ud83d\udccb PAN Card\n\ud83d\udccb Aadhaar Front\n\ud83d\udccb Aadhaar Back\n\nKoi document missing hai?";
    }
  }

  if (state === "document_check") {
    if (/no|nahi|missing|nhi/i.test(msg)) {
      return "Please missing documents collect karein:\n• RC Front aur Back (PDF/JPG)\n• PAN Card (PDF/JPG)\n• Aadhaar Front aur Back (PDF/JPG)\n\nSab documents milne ke baad lead detail page mein upload karein.";
    }
    if (/ha|yes|haan|sab|all|complete/i.test(msg)) {
      setState("quote_stage");
      return "Sab documents complete hain! Ab quotation process start hoti hai. Quotation aa gaya hai — sabhi options check karein aur highest payout plan select karein.";
    }
  }

  if (state === "quote_stage") {
    setState("payment_stage");
    return "Quotation select ho gayi! Ab payment stage: Main payment process mein madad karungi. Payment link generate karein aur customer ko WhatsApp pe bhejein.";
  }

  // Document check triggers
  if (/document|rc|pan|aadhaar|kyc|docs/i.test(msg)) {
    const missingLeads = leads.filter(
      (l) => !l.docsUploaded.rcFront || !l.docsUploaded.rcBack,
    );
    if (missingLeads.length > 0) {
      setState("document_check");
      return `${missingLeads.length} lead(s) mein RC documents missing hain. Kripya RC front aur back upload karein. PAN aur Aadhaar bhi confirm karein.`;
    }
    return "Aapke saare active leads mein documents uploaded hain. Koi specific document check karna hai?";
  }

  // Greeting
  if (/^(hi|hello|hey|hii|helo|namaste|namaskar)$/i.test(msg)) {
    return "Namaste! Main Priya hoon. Aaj main aapki kya madad kar sakti hoon? Quotation, lead create, payment ya koi insurance question?";
  }

  // Fallback
  return "Main samajh gayi. Aap insurance process ke baare mein kuch aur poochhna chahte hain? Main NCB, IDV, claim, premium ya quotation ke baare mein bata sakti hoon. Ya koi command use karein.";
}

// ---- usePriyaVoice hook ----

function usePriyaVoice() {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(
          (v) => v.lang === "hi-IN" && v.name.toLowerCase().includes("female"),
        ) ||
        voices.find((v) => v.lang === "hi-IN") ||
        voices.find((v) => v.lang.startsWith("hi")) ||
        voices[0] ||
        null;
      voiceRef.current = preferred;
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!voiceEnabled) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "hi-IN";
      u.rate = 0.85;
      u.pitch = 1.1;
      if (voiceRef.current) u.voice = voiceRef.current;
      u.onend = () => onEnd?.();
      window.speechSynthesis.speak(u);
    },
    [voiceEnabled],
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, stopSpeaking, voiceEnabled, setVoiceEnabled };
}

// ---- usePriyaSpeech hook ----

function usePriyaSpeech(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const startListening = useCallback(() => {
    if (!micEnabled) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onResultRef.current(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [micEnabled]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    micEnabled,
    setMicEnabled,
  };
}

// ---- Message bubble ----

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 shadow-sm">
          <span className="text-white text-[10px] font-bold">P</span>
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

// ---- Quick chips ----

const QUICK_CHIPS = [
  "Quotation",
  "Lead Create",
  "Payment",
  "NCB kya hai?",
  "IDV kya hai?",
  "Claim",
  "Help",
];

// ---- Main Component ----

export default function PriyaAssistant({ onOpenNewLead }: PriyaAssistantProps) {
  const { leads } = useApp();
  const [open, setOpen] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [convState, setConvState] = useState<ConversationState>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { speak, stopSpeaking, voiceEnabled, setVoiceEnabled } =
    usePriyaVoice();

  // Keep processUserMessage in a ref so speech result handler can use it
  const processUserMessageRef = useRef<(text: string) => void>(() => {});

  const handleSpeechResult = useCallback((text: string) => {
    if (!text.trim()) return;
    setInputText(text);
    setTimeout(() => {
      processUserMessageRef.current(text);
    }, 100);
  }, []);

  const {
    isListening,
    startListening,
    stopListening,
    micEnabled,
    setMicEnabled,
  } = usePriyaSpeech(handleSpeechResult);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  // Welcome greeting on first open
  useEffect(() => {
    if (open && !greeted) {
      setGreeted(true);
      const welcomeText =
        "Hello \ud83d\udc4b Main Priya hoon. Main aapki insurance assistant hoon. Aapko kis cheez mein madad chahiye?";
      const greeting: ChatMessage = {
        id: "greeting",
        text: welcomeText,
        sender: "bot",
        time: formatTime(new Date()),
      };
      setMessages([greeting]);
      scrollToBottom();
      speak(
        "Hello, main Priya hoon. Main aapki insurance assistant hoon. Aapko kis cheez mein madad chahiye?",
      );
    }
  }, [open, greeted, speak, scrollToBottom]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  // Scroll on new messages
  useEffect(() => {
    if (open && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, open, scrollToBottom]);

  const processUserMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isBotTyping) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        text: trimmed,
        sender: "user",
        time: formatTime(new Date()),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setIsBotTyping(true);

      setTimeout(() => {
        const replyText = generatePriyaReply(
          trimmed,
          convState,
          leads,
          setConvState,
        );

        if (replyText === "__OPEN_NEW_LEAD__") {
          const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: "Ab main New Lead form open kar rahi hoon. Form fill karein!",
            sender: "bot",
            time: formatTime(new Date()),
          };
          setMessages((prev) => [...prev, botMsg]);
          setIsBotTyping(false);
          speak("Ab main New Lead form open kar rahi hoon. Form fill karein!");
          if (onOpenNewLead) {
            onOpenNewLead();
          } else {
            setTimeout(() => {
              const note: ChatMessage = {
                id: (Date.now() + 2).toString(),
                text: "Dashboard pe 'New Lead' button tap karein form open karne ke liye.",
                sender: "bot",
                time: formatTime(new Date()),
              };
              setMessages((prev) => [...prev, note]);
            }, 800);
          }
          return;
        }

        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: replyText,
          sender: "bot",
          time: formatTime(new Date()),
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsBotTyping(false);
        speak(replyText);
      }, 700);
    },
    [isBotTyping, convState, leads, speak, onOpenNewLead],
  );

  // Keep ref in sync
  processUserMessageRef.current = processUserMessage;

  const handleSend = () => {
    processUserMessage(inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickChip = (chip: string) => {
    processUserMessage(chip);
  };

  const handleStop = () => {
    stopSpeaking();
    stopListening();
    setConvState("idle");
    setIsBotTyping(false);
  };

  const handleClose = () => {
    handleStop();
    setOpen(false);
  };

  return (
    <>
      {/* ---- Chat Panel ---- */}
      <div
        className={`fixed bottom-36 right-4 z-[60] w-[340px] max-w-[calc(100vw-2rem)] transition-all duration-300 origin-bottom-right ${
          open
            ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
            : "opacity-0 scale-90 pointer-events-none translate-y-4"
        }`}
        data-ocid="priya.panel"
        aria-hidden={!open}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col"
          style={{ height: "min(520px, calc(100dvh - 160px))" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">
                    Priya
                  </p>
                  <p className="text-purple-200 text-[11px]">
                    Insurance Assistant • Online
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    voiceEnabled
                      ? "bg-white/20 hover:bg-white/30 text-white"
                      : "bg-red-400/80 hover:bg-red-400 text-white"
                  }`}
                  aria-label={voiceEnabled ? "Mute voice" : "Unmute voice"}
                  data-ocid="priya.toggle"
                  title={voiceEnabled ? "Voice ON" : "Voice OFF"}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isListening) stopListening();
                    setMicEnabled(!micEnabled);
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    micEnabled
                      ? "bg-white/20 hover:bg-white/30 text-white"
                      : "bg-red-400/80 hover:bg-red-400 text-white"
                  }`}
                  aria-label={micEnabled ? "Disable mic" : "Enable mic"}
                  data-ocid="priya.switch"
                  title={micEnabled ? "Mic ON" : "Mic OFF"}
                >
                  {micEnabled ? (
                    <Mic className="w-3.5 h-3.5" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleStop}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  aria-label="Stop assistant"
                  data-ocid="priya.secondary_button"
                  title="Stop"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  aria-label="Close Priya"
                  data-ocid="priya.close_button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 bg-[#ECE5DD]">
            <div className="p-3 space-y-2">
              <div className="flex justify-center">
                <span className="text-[10px] bg-white/70 text-gray-500 px-2.5 py-0.5 rounded-full font-medium">
                  Today
                </span>
              </div>

              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {isBotTyping && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <span className="text-white text-[10px] font-bold">P</span>
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex gap-1 items-center h-4">
                      <span
                        className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
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
          <div className="bg-white px-3 pt-2 pb-1 border-t border-purple-100 flex gap-2 overflow-x-auto flex-shrink-0">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleQuickChip(chip)}
                disabled={isBotTyping}
                className="flex-shrink-0 text-[11px] font-medium text-purple-600 border border-purple-300/60 rounded-full px-2.5 py-1 hover:bg-purple-50 disabled:opacity-40 transition-colors whitespace-nowrap"
                data-ocid="priya.tab"
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
              placeholder="Kuch bhi poochein Priya se\u2026"
              className="flex-1 bg-white rounded-full text-sm py-2 px-4 border-0 outline-none focus:ring-2 focus:ring-purple-400/30 shadow-sm min-w-0"
              data-ocid="priya.input"
            />

            <button
              type="button"
              onClick={() => (isListening ? stopListening() : startListening())}
              disabled={!micEnabled}
              className={`relative w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg"
                  : "bg-purple-100 hover:bg-purple-200 text-purple-600"
              }`}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
              data-ocid="priya.upload_button"
            >
              {isListening && (
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-60" />
              )}
              {isListening ? (
                <MicOff className="w-4 h-4 relative z-10" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim() || isBotTyping}
              className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm active:scale-95"
              aria-label="Send message"
              data-ocid="priya.submit_button"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ---- Floating Priya Button ---- */}
      <button
        type="button"
        onClick={() => (open ? handleClose() : setOpen(true))}
        className={`fixed bottom-20 right-4 z-[60] w-14 h-14 rounded-full shadow-xl flex flex-col items-center justify-center transition-all duration-300 active:scale-95 relative ${
          open
            ? "bg-gray-700 hover:bg-gray-800 shadow-gray-400/40"
            : "bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-400/50"
        }`}
        aria-label="Open Priya AI assistant"
        data-ocid="priya.open_modal_button"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-white" />
            <span className="text-[8px] font-bold text-white/90 leading-none mt-0.5">
              Priya
            </span>
          </>
        )}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20" />
        )}
      </button>
    </>
  );
}
