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

// ---- Speech Recognition types ----

interface ISpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
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

type VoiceState = "idle" | "listening" | "processing" | "speaking";

// ---- Workflow State ----

interface PriyaWorkflow {
  phase:
    | "idle"
    | "app_dashboard"
    | "pb_portal"
    | "quotation"
    | "document_flow"
    | "customer_response"
    | "payment_flow";
  pbPortalStep: number; // 0-5: 0=vehicle_entry, 1=fuel_check, 2=variant_check, 3=rc_match, 4=quote_generation, 5=complete
  activeLead: Lead | null; // currently focused lead
}

export interface PriyaAssistantProps {
  onOpenNewLead?: () => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  inline?: boolean;
}

// ---- Utility ----

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---- Dynamic AI Engine ----
// No static scripts. Priya thinks dynamically based on the question.

// ---- Real AI Engine ----
// Calls Google Gemini API for dynamic, contextual responses.

async function callPriyaAI(
  userMessage: string,
  conversationHistory: ChatMessage[],
  leads: Lead[],
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyD-placeholder";

  const completedLeads = leads.filter(
    (l) => l.workflowStatus === "Completed",
  ).length;
  const pendingLeads = leads.filter(
    (l) => l.workflowStatus !== "Completed",
  ).length;

  // ---- Build rich real-time dashboard context ----
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const todayLeads = leads.filter(
    (l) => l.createdAt && l.createdAt.slice(0, 10) === todayStr,
  );
  const todayCompleted = todayLeads.filter(
    (l) => l.workflowStatus === "Completed",
  );
  const todayBusiness = todayCompleted.reduce(
    (sum, l) => sum + (l.policyAmount || 0),
    0,
  );
  const todayCommission = todayCompleted.reduce(
    (sum, l) =>
      sum + (l.policyAmount || 0) * ((l.commissionPercent || 0) / 100),
    0,
  );

  const totalBusiness = leads
    .filter((l) => l.workflowStatus === "Completed")
    .reduce((sum, l) => sum + (l.policyAmount || 0), 0);
  const totalCommission = leads
    .filter((l) => l.workflowStatus === "Completed")
    .reduce(
      (sum, l) =>
        sum + (l.policyAmount || 0) * ((l.commissionPercent || 0) / 100),
      0,
    );

  const docsIncomplete = leads.filter(
    (l) => !l.docsUploaded?.rcFront || !l.docsUploaded?.rcBack || !l.panUrl,
  ).length;
  const paymentPendingCount = leads.filter(
    (l) =>
      l.workflowStatus === "Quotation Ready" ||
      l.workflowStatus === "PB Action Required",
  ).length;
  const kycPendingCount = leads.filter(
    (l) =>
      l.workflowStatus === "Docs Pending" ||
      l.workflowStatus === "Docs Received",
  ).length;

  const conversionRate =
    leads.length > 0 ? Math.round((completedLeads / leads.length) * 100) : 0;

  // Smart insight: leads that could be closed (in advanced stages)
  const nearClosureLeads = leads.filter(
    (l) =>
      l.workflowStatus === "KYC Completed" ||
      l.workflowStatus === "Payment Sent",
  ).length;

  const systemPrompt = [
    "You are Priya \u2014 a Senior AI Insurance Advisor and Business Performance Assistant for PB Insurance AI platform. You speak in natural Hinglish (Hindi+English mix) and also understand Marathi.",
    "",
    "=== LIVE DASHBOARD DATA (Real-time) ===",
    `TODAY (${todayStr}):`,
    `- Leads received today: ${todayLeads.length}`,
    `- Policies completed today: ${todayCompleted.length}`,
    `- Business done today: \u20b9${todayBusiness.toLocaleString("en-IN")}`,
    `- Commission earned today: \u20b9${Math.round(todayCommission).toLocaleString("en-IN")}`,
    "",
    "ALL TIME:",
    `- Total Leads: ${leads.length} | Completed: ${completedLeads} | Pending: ${pendingLeads}`,
    `- Total Business: \u20b9${totalBusiness.toLocaleString("en-IN")}`,
    `- Total Commission: \u20b9${Math.round(totalCommission).toLocaleString("en-IN")}`,
    `- Conversion Rate: ${conversionRate}%`,
    "",
    "PIPELINE STATUS:",
    `- Documents Incomplete: ${docsIncomplete} leads (RC/PAN missing)`,
    `- Payment/Quote Pending: ${paymentPendingCount} leads`,
    `- KYC/Docs Collection Stage: ${kycPendingCount} leads`,
    `- Near Closure (can close today): ${nearClosureLeads} leads`,
    "",
    "=== DASHBOARD QUERY RULES ===",
    `When user asks "aaj kitna business hua", "aaj ki performance", "kitni leads aayi", "kitni pending hai", "daily report", or similar:`,
    "- Use the LIVE data above to give a specific, personalized answer in Hinglish.",
    `- Example format: "Aaj aapne \u20b925,000 ka business kiya aur ${todayCompleted.length} policies complete ki. ${pendingLeads} leads abhi bhi pending hain."`,
    "- Always end with a smart suggestion or motivation.",
    "",
    `When user asks for insights, performance analysis, or "kya improve kar sakte hain":`,
    "- Compare today vs potential (nearClosureLeads that could be closed)",
    "- Mention follow-up leads and suggest action",
    "- Give 1-2 specific, actionable growth tips based on real data",
    "- Keep it motivating and professional",
    "",
    "=== PB PORTAL MASTERY ===",
    "You guide agents step-by-step through PB Partners Portal (https://www.pbpartners.com):",
    "Step 1 \u2014 Vehicle Entry: Enter vehicle number EXACTLY as on RC. Capital letters, no spaces/dashes. Wrong entry = wrong vehicle data.",
    "Step 2 \u2014 Fuel Check: Select fuel type exactly matching RC (Petrol/Diesel/CNG/Electric/Hybrid). Mismatch = wrong premium + claim rejection risk.",
    "Step 3 \u2014 Variant Check: Select exact model variant (e.g., LXI/VXI/ZXI). Affects IDV calculation. Find on RC or vehicle invoice.",
    "Step 4 \u2014 RC Verification: Match owner name, registration date, vehicle class, engine number, chassis number. Any mismatch = flag a warning.",
    "Step 5 \u2014 Quote Generation: Compare all plans. Best plan = Max IDV + Zero Dep + Engine Protection + RSA + NCB Protector.",
    "Step 6 \u2014 Proposal: Fill customer details, KYC documents, nominee details. Submit proposal.",
    "Step 7 \u2014 Payment Link: Generate link on portal, paste in app lead, send via WhatsApp to customer.",
    "",
    "ALWAYS warn the agent if:",
    "- Fuel type in portal does not match RC",
    "- Variant selected does not match RC description",
    "- Owner name has spelling difference from RC",
    "- CNG vehicle has petrol selected",
    "- Registration date entered incorrectly",
    "",
    "=== FULL WORKFLOW ===",
    "Lead Created \u2192 Documents Collected \u2192 Details Completed \u2192 Quotation Ready \u2192 PB Action Required \u2192 KYC Completed \u2192 Payment Sent \u2192 Policy Completed",
    "At each stage, Priya knows what the agent must do next and says it clearly.",
    "",
    "=== MOTOR INSURANCE EXPERT KNOWLEDGE ===",
    "",
    "VEHICLE TYPES & RULES:",
    "- Private Car (LMV): Comprehensive policy recommended. Annual or multi-year.",
    "- Two-Wheeler (MCWG): IRDAI mandates 5-year TP for new bikes. OD can be annual.",
    "- Commercial Vehicle (GCV/PCV): Route permit and fitness certificate required.",
    "- Taxi/Cab: Yellow number plate = PCV policy mandatory. Seating capacity matters.",
    "- Goods Carrier: GVW (Gross Vehicle Weight) determines premium. Permit type critical.",
    "- Electric Vehicle (EV): RC should show 'ELECTRIC' as fuel. Battery pack coverage important. Low TP premium.",
    "",
    "POLICY TYPES:",
    "- Comprehensive: OD + TP. Full coverage. Recommended for all.",
    "- Third Party Only: Minimum mandatory by law. Only covers damage to third party.",
    "- SAOD (Stand Alone OD): OD only \u2014 for vehicles that already have long-term TP.",
    "- Bundled (New Car): 1-year OD + 3-year TP for new private cars.",
    "- Long-term Comprehensive: 3+3 or 5+5 years. Best for peace of mind.",
    "- PAYD (Pay As You Drive): Usage-based policy. Good for low-mileage vehicles.",
    "",
    "IDV (INSURED DECLARED VALUE):",
    "- IDV = Current market value of vehicle. Higher IDV = higher premium but better claim payout.",
    "- IDV depreciates annually: 0-6 months: 5%, 6-12 months: 15%, 1-2 years: 20%, 2-3 years: 30%, 3-4 years: 40%, 4-5 years: 50%.",
    "- Always recommend maximum IDV to customer for best claim payout.",
    "",
    "NCB (NO CLAIM BONUS):",
    "- NCB is discount on OD premium for claim-free years.",
    "- Slabs: 1 year claim-free = 20%, 2 years = 25%, 3 years = 35%, 4 years = 45%, 5 years = 50%.",
    "- NCB belongs to owner, not vehicle. Transfers on vehicle change.",
    "- NCB is LOST if a claim is made. NCB Protector add-on saves it.",
    "",
    "ADD-ONS (HIGHLY RECOMMENDED):",
    "- Zero Depreciation: No deduction on spare parts in claim. Essential for cars under 5 years.",
    "- Engine Protection: Covers engine damage due to water ingestion, oil leakage, hydrostatic lock.",
    "- Return to Invoice (RTI): Total loss claim pays original invoice price, not depreciated IDV.",
    "- Roadside Assistance (RSA): 24x7 towing, fuel delivery, flat tyre help.",
    "- NCB Protector: Preserves NCB even after one claim.",
    "",
    "CLAIM PROCESS:",
    "- Cashless Claim: Repair at network garage. Insurer pays garage directly.",
    "- Reimbursement Claim: Repair anywhere, then submit bills.",
    "- Documents for claim: FIR (theft/accident), claim form, RC, policy copy, driving license, repair bills, photos.",
    "- Common claim rejections: Drunk driving, unlicensed driver, policy lapsed, wrong fuel type, modified vehicle not declared.",
    "",
    "KYC & IRDA COMPLIANCE:",
    "- Mandatory KYC documents: PAN card + Aadhaar (both sides) + Recent photo.",
    "- IRDA Mandate: PA cover of min \u20b915 lakh mandatory for owner-driver.",
    "- For commercial vehicles: route permit, fitness certificate, driver details mandatory.",
    "",
    "COMPANY COMPARISON (CSR = Claim Settlement Ratio):",
    "- HDFC Ergo: CSR 98.8%, 13,000+ network garages. Best for private cars.",
    "- Bajaj Allianz: CSR 98.5%, 4,000+ garages. Good for two-wheelers.",
    "- ICICI Lombard: CSR 97.9%, 15,600+ garages. Largest network.",
    "- Tata AIG: CSR 99.0%, 7,500+ garages. Best CSR, strong for commercial.",
    "- Reliance General: CSR 98.1%, competitive premium for two-wheelers.",
    "- Recommendation: Best claim settlement \u2192 Tata AIG. Widest network \u2192 ICICI Lombard. Two-wheelers \u2192 Bajaj Allianz.",
    "",
    "=== BEHAVIOR RULES ===",
    "1. Always reply in natural Hinglish. Be warm, professional, like a senior colleague.",
    `2. If question is NOT related to motor insurance or app workflow: "Sorry, ye motor insurance se related nahi hai. \ud83d\ude4f Main sirf insurance related help kar sakti hoon."`,
    "3. Be concise (max 180 words) unless step-by-step guidance is needed.",
    "4. When giving step-by-step guidance, number each step clearly.",
    "5. When detecting errors (mismatch, missing docs, wrong data), give a clear \u26a0\ufe0f warning.",
    "6. Suggest the next action after every response.",
    "7. When giving business performance answers, always use real numbers from the dashboard data above.",
    "8. For smart insights, be specific: name the exact leads, amounts, and actions to take.",
    "9. Keep answers motivating and action-oriented.",
    "10. When comparing insurance companies, always mention CSR% and network garage count.",
  ].join("\n");

  const recentHistory = conversationHistory.slice(-10);

  const contents = [
    ...recentHistory.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 350,
          },
        }),
      },
    );

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response text");
    return text.trim();
  } catch (err) {
    console.error("Priya AI error:", err);
    return "Abhi thodi si technical problem aa gayi hai. 🙏 Kripya ek minute mein dobara try karein. Main ready hoon aapki help ke liye!";
  }
}

// ---- Workflow-Aware Reply Builders ----
// These handle structured lead-data queries locally for instant, accurate responses.

function buildAppDashboardReply(
  leads: Lead[],
  _workflow: PriyaWorkflow,
): string {
  if (leads.length === 0) {
    return "Abhi koi lead nahi hai. Naya lead add karne ke liye Dashboard pe 'New Lead' button use karein. 😊";
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayLeads = leads.filter(
    (l) => l.createdAt && l.createdAt.slice(0, 10) === todayStr,
  );
  const todayCompleted = todayLeads.filter(
    (l) => l.workflowStatus === "Completed",
  );
  const todayBusiness = todayCompleted.reduce(
    (sum, l) => sum + (l.policyAmount || 0),
    0,
  );
  const todayCommission = todayCompleted.reduce(
    (sum, l) =>
      sum + (l.policyAmount || 0) * ((l.commissionPercent || 0) / 100),
    0,
  );

  const total = leads.length;
  const completed = leads.filter(
    (l) => l.workflowStatus === "Completed",
  ).length;
  const pending = total - completed;
  const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const totalBusiness = leads
    .filter((l) => l.workflowStatus === "Completed")
    .reduce((sum, l) => sum + (l.policyAmount || 0), 0);
  const totalCommission = leads
    .filter((l) => l.workflowStatus === "Completed")
    .reduce(
      (sum, l) =>
        sum + (l.policyAmount || 0) * ((l.commissionPercent || 0) / 100),
      0,
    );

  const nearClosure = leads.filter(
    (l) =>
      l.workflowStatus === "KYC Completed" ||
      l.workflowStatus === "Payment Sent",
  );
  const paymentPending = leads.filter(
    (l) =>
      l.workflowStatus === "Quotation Ready" ||
      l.workflowStatus === "PB Action Required",
  );
  const docsPending = leads.filter((l) => l.workflowStatus === "Docs Pending");

  // Smart insight line
  let insight = "";
  if (nearClosure.length > 0) {
    const names = nearClosure
      .slice(0, 2)
      .map((l) => l.name || `Mobile ${l.mobileNumber}`)
      .join(", ");
    insight = `💡 Insight: ${nearClosure.length} lead${nearClosure.length > 1 ? "s" : ""} (${names}) aaj close ho sakti hai — inpe focus karein!`;
  } else if (paymentPending.length > 0) {
    insight = `💡 Insight: ${paymentPending.length} lead${paymentPending.length > 1 ? "s" : ""} payment stage pe hain — follow-up karein, conversion badhega!`;
  } else if (docsPending.length > 0) {
    insight = `💡 Insight: ${docsPending.length} lead${docsPending.length > 1 ? "s" : ""} mein documents pending hain — jaldi collect karein!`;
  } else {
    insight = `💡 Insight: Conversion rate ${conversionRate}% — naye leads add karein aur pipeline badhayein!`;
  }

  // Today summary
  const todayLine =
    todayLeads.length > 0
      ? `📅 Aaj: ${todayLeads.length} lead${todayLeads.length > 1 ? "s" : ""} aayi | ${todayCompleted.length} policy complete | ₹${todayBusiness.toLocaleString("en-IN")} business | ₹${Math.round(todayCommission).toLocaleString("en-IN")} commission`
      : "📅 Aaj: Abhi tak koi naya lead nahi aaya.";

  // Next step
  let nextStep = "";
  if (docsPending.length > 0) {
    const name = docsPending[0].name || `Mobile ${docsPending[0].mobileNumber}`;
    nextStep = `${name} ke documents collect karein — ${docsPending.length} lead(s) mein docs missing hain.`;
  } else if (paymentPending.length > 0) {
    nextStep = `${paymentPending.length} lead(s) ke liye payment link send karein — sabse urgent!`;
  } else if (nearClosure.length > 0) {
    nextStep = `${nearClosure[0].name || "Pending lead"} ka payment confirm karein — policy ready hogi!`;
  } else if (completed === total) {
    nextStep = "Sab leads complete hain! Naye leads add karein. 🎉";
  } else {
    nextStep = "Pending leads ke status update karein aur follow-up karein.";
  }

  return `📊 Dashboard Report:\n\n${todayLine}\n\n📈 Overall: ${total} total | ${completed} completed | ${pending} pending | ${conversionRate}% conversion\n💰 Total Business: ₹${totalBusiness.toLocaleString("en-IN")} | Commission: ₹${Math.round(totalCommission).toLocaleString("en-IN")}\n\n${insight}\n\n🎯 Next Step: ${nextStep}\n\nKisi specific lead ka detail chahiye? Naam batayein. 😊`;
}

function buildPbPortalStepReply(step: number, activeLead: Lead | null): string {
  const vehicleNote = activeLead
    ? `\n📋 Lead: ${activeLead.name || "current customer"}`
    : "";

  switch (step) {
    case 0:
      return `🚗 Step 1: Vehicle Number Entry${vehicleNote}\n\nPB Portal pe vehicle number EXACTLY dalein jaise RC mein likha hai.\n✅ Capital letters use karein (MH12AB1234)\n⚠️ Space ya dash mat dalein\n⚠️ Ek bhi character galat hoga toh galat data aayega!${activeLead?.mobileNumber ? `\n\nCustomer mobile: ${activeLead.mobileNumber} — inka RC saath rakhein!` : ""}\n\nHo gaya? 'Done' bolein ➡️`;
    case 1:
      return "⛽ Step 2: Fuel Type Check\n\nRC mein jo fuel type likha hai wahi select karein:\n• Petrol / Diesel / CNG / Electric / Hybrid\n\n⚠️ Fuel type galat select karna = galat premium!\n⚠️ CNG gaadi mein Petrol select mat karna\n\nRC se verify karein aur portal pe match karein.\n\nDone? Aage badhein ➡️";
    case 2:
      return `🔧 Step 3: Variant/Model Check\n\nVehicle ka exact variant select karein:\n• RC mein 'Model' ya 'Vehicle Description' dekhen\n• Variant bilkul match hona chahiye (e.g., 'LXI', 'VXI', 'ZXI')\n\n⚠️ Wrong variant = wrong premium + claim reject ho sakta hai!\n✅ If confused — RC pe clearly mention hota hai exact variant\n\nConfirm karein aur 'Done' bolein ➡️`;
    case 3: {
      const rcUploaded =
        activeLead?.docsUploaded?.rcFront && activeLead?.docsUploaded?.rcBack;
      const rcWarning =
        activeLead && !rcUploaded
          ? "\n⚠️ Warning: RC copy upload nahi hui! Pehle App mein RC upload karein."
          : activeLead && rcUploaded
            ? "\n✅ RC documents uploaded hain — carefully verify karein."
            : "";

      return `📄 Step 4: RC Match Verification${rcWarning}\n\nSab details RC ke saath match karein:\n✅ Owner name exactly same hona chahiye\n✅ Registration date sahi ho\n✅ Vehicle class match kare (LMV, MCWG etc.)\n✅ Engine number match kare\n✅ Chassis number match kare\n\n⚠️ Koi bhi mismatch = policy rejection ya claim issue!\n\nSab sahi? 'Done' bolein ➡️`;
    }
    case 4:
      return `💰 Step 5: Quotation Generation\n\nAb quotes generate karein:\n✅ Sabhi plan options check karein\n✅ Zero Depreciation add-on zaroor dekhen\n✅ Highest IDV wala plan prefer karein\n✅ Engine Protection + RSA add-on recommend karein\n\n⭐ Best Payout: Max IDV + Zero Dep + Engine Protection + RSA\n\nQuote aa gaya? Screenshot lo aur 'Done' bolein ➡️`;
    default:
      return `🎉 PB Portal Steps Complete!\n\nAb next steps:\n1. Quotation screenshot save karein\n2. App mein lead pe document upload karein\n3. Customer ko WhatsApp pe share karein\n\nCustomer ne agree kiya? 'Customer agree' bolein ➡️`;
  }
}

function buildQuotationFlowReply(_step: number): string {
  return `📋 Quotation Review Checklist:\n\n1. Sabhi plans compare karein (TP / OD / Comprehensive)\n2. Highest payout ke liye:\n   ✅ Maximum IDV select karein\n   ✅ Zero Depreciation add karein\n   ✅ Engine Protection add karein\n   ✅ RSA consider karein\n   ✅ NCB Protector agar NCB hai\n3. Screenshot lo → Lead Detail pe upload karo → Customer ko WhatsApp pe bhejo\n\nCustomer ko samjhana:\n'Ye plan best coverage deta hai aur claim mein full amount milega.'\n\nScreenshot ready? 'Upload' ya 'Done' bolein ➡️`;
}

function buildDocumentFlowReply(
  _leads: Lead[],
  activeLead: Lead | null,
): string {
  const leadNote = activeLead
    ? `\n📌 Active Lead: ${activeLead.name || activeLead.mobileNumber} — inka Lead Detail page open karo.`
    : "";

  return `📤 Document Upload Guide:${leadNote}\n\nStep 1: Quotation screenshot/PDF ready karo\nStep 2: App mein Lead Detail page pe jaao\nStep 3: 'Upload Document' button pe click karo\nStep 4: File select karo (JPG/PNG/PDF)\nStep 5: Document type select karo\nStep 6: Save karo — document lead se link ho jaayega\n\nWhatsApp pe bhejne ke liye Lead Detail pe 'WhatsApp' button click karo. ✅`;
}

function buildCustomerResponseReply(): string {
  return `✅ Customer agreed! Ab policy creation ke liye:\n\n1. Lead Detail page open karo\n2. Status 'KYC Completed' pe set karo\n3. PB Portal pe proposal form bharo\n4. Payment link generate karo\n5. Customer ko link send karo via WhatsApp\n\nPayment ke baad status 'Payment Sent' → phir 'Completed' karo. 🎉`;
}

function buildPaymentFlowReply(leads: Lead[], activeLead: Lead | null): string {
  const pendingPayment = leads.filter(
    (l) =>
      l.workflowStatus === "Quotation Ready" ||
      l.workflowStatus === "PB Action Required",
  );
  const leadNote = activeLead
    ? `\n📌 Active Lead: ${activeLead.name || activeLead.mobileNumber}`
    : pendingPayment.length > 0
      ? `\n📌 Payment pending leads: ${pendingPayment
          .map((l) => l.name || l.mobileNumber)
          .slice(0, 3)
          .join(", ")}`
      : "";

  return `💳 Payment Link Guide:${leadNote}\n\nStep 1: PB Portal pe quotation finalize karo\nStep 2: Payment link generate karo\nStep 3: App mein Lead Detail pe payment link paste karo\nStep 4: WhatsApp button se customer ko bhejo\n\nMessage template:\n'Aapka insurance quotation ready hai. Payment ke liye: [link]\nKoi sawaal ho toh batayein.'\n\nPayment confirm hone ke baad lead status 'Payment Sent' update karo. ✅`;
}

// ---- Quick Chips ----

const QUICK_CHIPS = [
  "App Dashboard Check",
  "PB Portal Start",
  "Quotation Guide",
  "Document Upload",
  "Payment Link",
  "NCB kya hai?",
  "Claim Process",
  "Zero Dep",
  "IRDA Rules",
  "Company Compare",
  "Best Plan",
  "PA Cover",
  "Policy Types",
  "Help",
  "Status Check",
  "Vehicle Details Check",
  "RC Verify Karo",
  "Variant Check",
  "Fuel Type",
  "EV Insurance",
  "Taxi Insurance",
  "Goods Carrier",
  "NCB History",
];

// ---- Voice state label ----

function VoiceStateIndicator({ voiceState }: { voiceState: VoiceState }) {
  if (voiceState === "idle") return null;

  const config = {
    listening: {
      label: "Listening...",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.15)",
      border: "rgba(239,68,68,0.40)",
      pulse: true,
    },
    processing: {
      label: "Processing...",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.15)",
      border: "rgba(245,158,11,0.40)",
      pulse: false,
    },
    speaking: {
      label: "Speaking...",
      color: "#10b981",
      bg: "rgba(16,185,129,0.15)",
      border: "rgba(16,185,129,0.40)",
      pulse: true,
    },
  }[voiceState];

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full mx-3 mb-2"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${config.pulse ? "animate-pulse" : ""}`}
        style={{ background: config.color }}
      />
      <span className="text-xs font-semibold" style={{ color: config.color }}>
        {config.label}
      </span>
      {voiceState === "listening" && <WaveformBars />}
    </div>
  );
}

// Animated waveform bars for listening state
function WaveformBars() {
  return (
    <div className="flex items-center gap-0.5 ml-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-0.5 rounded-full bg-red-400"
          style={{
            height: `${8 + Math.sin(i * 1.2) * 4}px`,
            animation: "waveBar 0.8s ease-in-out infinite",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// ---- usePriyaVoice hook ----

function usePriyaVoice(onSpeakStart?: () => void, onSpeakEnd?: () => void) {
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
        voices.find((v) => v.lang === "en-IN") ||
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
      u.rate = 0.8;
      u.pitch = 1.1;
      if (voiceRef.current) u.voice = voiceRef.current;
      u.onstart = () => onSpeakStart?.();
      u.onend = () => {
        onSpeakEnd?.();
        onEnd?.();
      };
      u.onerror = () => {
        onSpeakEnd?.();
        onEnd?.();
      };
      window.speechSynthesis.speak(u);
    },
    [voiceEnabled, onSpeakStart, onSpeakEnd],
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, stopSpeaking, voiceEnabled, setVoiceEnabled };
}

// ---- usePriyaSpeech hook ----

function usePriyaSpeech(
  onResult: (text: string) => void,
  onListenStart?: () => void,
  onListenEnd?: () => void,
) {
  const [isListening, setIsListening] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  onResultRef.current = onResult;

  // Clear the silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Start (or reset) the 2.5-second silence timer
  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // Silence detected — stop recognition and fire the result
      recognitionRef.current?.stop();
    }, 2500);
  }, [clearSilenceTimer]);

  const startListening = useCallback(() => {
    if (!micEnabled) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    // Reset accumulated transcript for a fresh session
    accumulatedTranscriptRef.current = "";
    clearSilenceTimer();

    const recognition = new SR();
    recognition.lang = "hi";
    recognition.interimResults = true; // get interim results to detect active speech
    recognition.maxAlternatives = 1;
    recognition.continuous = true; // keep listening through natural pauses

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      // Use native event result length via any cast
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nativeResults = (event as any)
        .results as SpeechRecognitionResultList;
      let finalText = "";
      for (let i = 0; i < nativeResults.length; i++) {
        if (nativeResults[i].isFinal) {
          finalText += `${nativeResults[i][0].transcript} `;
        }
      }
      if (finalText.trim()) {
        accumulatedTranscriptRef.current = finalText.trim();
      }
      // Every time we get any speech (interim or final), reset the silence timer
      resetSilenceTimer();
    };

    recognition.onerror = () => {
      clearSilenceTimer();
      setIsListening(false);
      onListenEnd?.();
      // Still fire result if we accumulated something
      const accumulated = accumulatedTranscriptRef.current.trim();
      if (accumulated) {
        onResultRef.current(accumulated);
        accumulatedTranscriptRef.current = "";
      }
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
      onListenEnd?.();
      // Fire the accumulated transcript as the final result
      const accumulated = accumulatedTranscriptRef.current.trim();
      if (accumulated) {
        onResultRef.current(accumulated);
        accumulatedTranscriptRef.current = "";
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    onListenStart?.();
    // Start initial silence timer — if user says nothing for 8 seconds, stop
    silenceTimerRef.current = setTimeout(() => {
      recognitionRef.current?.stop();
    }, 8000);
  }, [
    micEnabled,
    onListenStart,
    onListenEnd,
    clearSilenceTimer,
    resetSilenceTimer,
  ]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    setIsListening(false);
    onListenEnd?.();
  }, [onListenEnd, clearSilenceTimer]);

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

// ---- Shared chat body ----

interface ChatBodyProps {
  messages: ChatMessage[];
  isBotTyping: boolean;
  inputText: string;
  isListening: boolean;
  micEnabled: boolean;
  voiceEnabled: boolean;
  voiceState: VoiceState;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onMicToggle: () => void;
  onChipClick: (chip: string) => void;
  onVoiceToggle: () => void;
  onMicEnabledToggle: () => void;
  onStop: () => void;
  onClose?: () => void;
  inline?: boolean;
}

function ChatBody({
  messages,
  isBotTyping,
  inputText,
  isListening,
  micEnabled,
  voiceEnabled,
  voiceState,
  bottomRef,
  inputRef,
  onInputChange,
  onKeyDown,
  onSend,
  onMicToggle,
  onChipClick,
  onVoiceToggle,
  onMicEnabledToggle,
  onStop,
  onClose,
  inline,
}: ChatBodyProps) {
  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.20)",
                  borderColor:
                    voiceState === "speaking"
                      ? "#10b981"
                      : voiceState === "listening"
                        ? "#ef4444"
                        : "rgba(255,255,255,0.40)",
                  boxShadow:
                    voiceState === "speaking"
                      ? "0 0 12px rgba(16,185,129,0.6)"
                      : voiceState === "listening"
                        ? "0 0 12px rgba(239,68,68,0.6)"
                        : "none",
                  transition: "border-color 0.3s, box-shadow 0.3s",
                }}
              >
                <img
                  src="/assets/generated/priya-avatar-transparent.dim_200x200.png"
                  alt="Priya"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
                <Sparkles className="w-5 h-5 text-white absolute" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-purple-700 animate-pulse" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">
                Priya AI
              </p>
              <p className="text-purple-200 text-[11px]">
                {voiceState === "listening"
                  ? "\ud83d\udd34 Listening..."
                  : voiceState === "processing"
                    ? "\ud83d\udfe1 Processing..."
                    : voiceState === "speaking"
                      ? "\ud83d\udfe2 Speaking..."
                      : "Insurance Assistant \u2022 Active \ud83d\udfe2"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onVoiceToggle}
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
              onClick={onMicEnabledToggle}
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
              onClick={onStop}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              aria-label="Stop assistant"
              data-ocid="priya.secondary_button"
              title="Stop"
            >
              <StopCircle className="w-3.5 h-3.5" />
            </button>

            {!inline && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                aria-label="Close Priya"
                data-ocid="priya.close_button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 bg-[#1a1040]/60" style={{ minHeight: 0 }}>
        <div className="p-3 space-y-2">
          <div className="flex justify-center">
            <span className="text-[10px] bg-white/10 text-purple-200 px-2.5 py-0.5 rounded-full font-medium">
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

      {/* Voice state indicator - shown above input area */}
      {voiceState !== "idle" && <VoiceStateIndicator voiceState={voiceState} />}

      {/* Quick reply chips */}
      <div
        className="px-3 pt-2 pb-1 flex gap-2 overflow-x-auto flex-shrink-0"
        style={{
          background: "rgba(88,28,135,0.25)",
          borderTop: "1px solid rgba(139,92,246,0.20)",
        }}
      >
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onChipClick(chip)}
            disabled={isBotTyping || voiceState === "listening"}
            className="flex-shrink-0 text-[11px] font-medium text-purple-200 border border-purple-500/40 rounded-full px-2.5 py-1 hover:bg-purple-500/20 disabled:opacity-40 transition-colors whitespace-nowrap"
            data-ocid="priya.tab"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div
        className="px-3 py-2.5 flex items-center gap-2 flex-shrink-0"
        style={{
          background: "rgba(49,46,129,0.40)",
          borderTop: "1px solid rgba(139,92,246,0.25)",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            voiceState === "listening"
              ? "Bol rahe hain..."
              : voiceState === "processing"
                ? "Processing..."
                : voiceState === "speaking"
                  ? "Priya bol rahi hai..."
                  : "Kuch bhi poochein Priya se\u2026"
          }
          disabled={voiceState === "listening" || voiceState === "speaking"}
          className="flex-1 rounded-full text-sm py-2 px-4 border-0 outline-none min-w-0 font-medium focus:ring-2 focus:ring-purple-400/50 shadow-sm disabled:opacity-60"
          style={{
            background: "#1e1e3f",
            color: "#ffffff",
            caretColor: "#a78bfa",
            border: "1px solid rgba(139,92,246,0.5)",
          }}
          data-ocid="priya.input"
        />

        {/* Mic button — big and prominent for voice-first interaction */}
        <button
          type="button"
          onClick={onMicToggle}
          disabled={
            !micEnabled ||
            voiceState === "processing" ||
            voiceState === "speaking"
          }
          className={`relative w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg ${
            isListening
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-gradient-to-br from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
          }`}
          aria-label={isListening ? "Stop listening" : "Tap to speak"}
          data-ocid="priya.upload_button"
        >
          {/* Outer pulse ring */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-50" />
              <span className="absolute inset-[-4px] rounded-full border-2 border-red-400 animate-ping opacity-30" />
            </>
          )}
          {isListening ? (
            <MicOff className="w-4 h-4 relative z-10" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={
            !inputText.trim() || isBotTyping || voiceState === "listening"
          }
          className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm active:scale-95"
          aria-label="Send message"
          data-ocid="priya.submit_button"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </>
  );
}

// ---- Main Component ----

export default function PriyaAssistant({
  onOpenNewLead,
  externalOpen,
  onExternalOpenChange,
  inline = false,
}: PriyaAssistantProps) {
  const { leads } = useApp();
  const [open, setOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  useEffect(() => {
    if (externalOpen !== undefined) {
      setOpen(externalOpen);
    }
  }, [externalOpen]);

  const [greeted, setGreeted] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [_lastTopic, setLastTopic] = useState<string | null>(null);
  const [priyaWorkflow, setPriyaWorkflow] = useState<PriyaWorkflow>({
    phase: "idle",
    pbPortalStep: 0,
    activeLead: null,
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice state callbacks
  const handleSpeakStart = useCallback(() => setVoiceState("speaking"), []);
  const handleSpeakEnd = useCallback(() => setVoiceState("idle"), []);
  const handleListenStart = useCallback(() => setVoiceState("listening"), []);
  const handleListenEnd = useCallback(() => {
    // Transition to processing state — result handler will take it from there
    // If no result comes (empty speech), go back to idle after a short check
    setVoiceState("processing");
  }, []);

  const { speak, stopSpeaking, voiceEnabled, setVoiceEnabled } = usePriyaVoice(
    handleSpeakStart,
    handleSpeakEnd,
  );

  const processUserMessageRef = useRef<(text: string) => void | Promise<void>>(
    () => {},
  );

  const handleSpeechResult = useCallback((text: string) => {
    if (!text.trim()) return;
    setVoiceState("processing");
    setInputText(text);
    processUserMessageRef.current(text);
  }, []);

  const {
    isListening,
    startListening,
    stopListening,
    micEnabled,
    setMicEnabled,
  } = usePriyaSpeech(handleSpeechResult, handleListenStart, handleListenEnd);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  const isActive = inline || open;

  useEffect(() => {
    if (isActive && !greeted) {
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
      setTimeout(() => {
        speak(
          "Hello, main Priya hoon. Main aapki insurance assistant hoon. Aapko kis cheez mein madad chahiye?",
        );
      }, 500);
    }
  }, [isActive, greeted, speak, scrollToBottom]);

  useEffect(() => {
    if (!inline && open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, inline]);

  useEffect(() => {
    if (isActive && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isActive, scrollToBottom]);

  const processUserMessage = useCallback(
    async (text: string) => {
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
      setVoiceState("processing");

      // ---- Phase detection & workflow transitions ----
      const lower = trimmed.toLowerCase();

      // Quick chip triggers for workflow phases
      const isAppDashboardChip = /^app dashboard check$/i.test(trimmed);
      const isPbPortalChip = /^pb portal start$/i.test(trimmed);
      const isQuotationChip = /^quotation guide$/i.test(trimmed);
      const isDocumentChip = /^document upload$/i.test(trimmed);
      const isPaymentChip = /^payment link$/i.test(trimmed);
      const isStatusChip = /^status check$/i.test(trimmed);

      let updatedWorkflow = { ...priyaWorkflow };

      // Phase transitions
      if (
        isPbPortalChip ||
        /pb portal|portal.*start|quotation leni|vehicle number|vehicle entry|portal pe|portal guide/i.test(
          lower,
        )
      ) {
        updatedWorkflow = {
          ...updatedWorkflow,
          phase: "pb_portal",
          pbPortalStep: 0,
        };
      } else if (
        isAppDashboardChip ||
        isStatusChip ||
        /dashboard|lead.*check|check.*lead|status.*check|mera lead|lead detail|documents.*check/i.test(
          lower,
        )
      ) {
        updatedWorkflow = { ...updatedWorkflow, phase: "app_dashboard" };
      } else if (
        isQuotationChip ||
        /quotation aa|quote aa|plan.*select|highest.*payout|best.*plan|quotation guide/i.test(
          lower,
        )
      ) {
        updatedWorkflow = { ...updatedWorkflow, phase: "quotation" };
      } else if (
        isDocumentChip ||
        /screenshot.*upload|pdf.*upload|upload.*karo|document.*bhejo|quote.*screenshot/i.test(
          lower,
        )
      ) {
        updatedWorkflow = { ...updatedWorkflow, phase: "document_flow" };
      } else if (
        /customer.*haan|customer.*agree|customer.*ok\b|policy.*banao|customer ne haan/i.test(
          lower,
        )
      ) {
        updatedWorkflow = { ...updatedWorkflow, phase: "customer_response" };
      } else if (
        isPaymentChip ||
        /payment.*link|link.*generate|payment.*bhejo|payment.*send/i.test(lower)
      ) {
        updatedWorkflow = { ...updatedWorkflow, phase: "payment_flow" };
      } else if (
        updatedWorkflow.phase === "pb_portal" &&
        /ho gaya|done|next|aage|^ok$|theek|sahi hai|complete/i.test(lower)
      ) {
        // Advance PB portal step (max 5)
        const nextStep = Math.min(updatedWorkflow.pbPortalStep + 1, 5);
        updatedWorkflow = { ...updatedWorkflow, pbPortalStep: nextStep };
      } else if (/stop|band karo|reset|nayi baat/i.test(lower)) {
        updatedWorkflow = { phase: "idle", pbPortalStep: 0, activeLead: null };
      }

      // Capture updated workflow synchronously for use in reply
      const currentWorkflow = updatedWorkflow;
      setPriyaWorkflow(updatedWorkflow);

      // Handle "new lead" intent directly without AI call
      if (/new lead|lead create|lead banao/i.test(trimmed)) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: "Ab main New Lead form open kar rahi hoon. Form fill karein!",
          sender: "bot",
          time: formatTime(new Date()),
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsBotTyping(false);
        setVoiceState("idle");
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

      // For workflow-phase chips, use local context-aware builders for instant guidance
      // For all other queries, use real Gemini AI
      let replyText: string;

      if (
        currentWorkflow.phase === "app_dashboard" ||
        /^app dashboard check$/i.test(trimmed) ||
        /dashboard|lead.*check|check.*lead|status.*check|mera lead/i.test(
          trimmed,
        )
      ) {
        replyText = buildAppDashboardReply(leads, currentWorkflow);
      } else if (
        currentWorkflow.phase === "pb_portal" ||
        /^pb portal start$/i.test(trimmed)
      ) {
        replyText = buildPbPortalStepReply(
          currentWorkflow.pbPortalStep,
          currentWorkflow.activeLead,
        );
      } else if (
        currentWorkflow.phase === "quotation" ||
        /^quotation guide$/i.test(trimmed)
      ) {
        replyText = buildQuotationFlowReply(currentWorkflow.pbPortalStep);
      } else if (
        currentWorkflow.phase === "document_flow" ||
        /^document upload$/i.test(trimmed)
      ) {
        replyText = buildDocumentFlowReply(leads, currentWorkflow.activeLead);
      } else if (currentWorkflow.phase === "customer_response") {
        replyText = buildCustomerResponseReply();
      } else if (
        currentWorkflow.phase === "payment_flow" ||
        /^payment link$/i.test(trimmed)
      ) {
        replyText = buildPaymentFlowReply(leads, currentWorkflow.activeLead);
      } else {
        // Real AI call for all other questions
        replyText = await callPriyaAI(trimmed, messages, leads);
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: "bot",
        time: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsBotTyping(false);
      // Speak will set voiceState to "speaking" via callback
      speak(replyText);
    },
    [isBotTyping, leads, speak, onOpenNewLead, messages, priyaWorkflow],
  );

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
    setLastTopic(null);
    setIsBotTyping(false);
    setVoiceState("idle");
    setPriyaWorkflow({ phase: "idle", pbPortalStep: 0, activeLead: null });
  };

  const handleClose = () => {
    handleStop();
    setOpen(false);
    onExternalOpenChange?.(false);
  };

  const handleOpen = () => {
    setOpen(true);
    onExternalOpenChange?.(true);
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      setVoiceState("idle");
    } else {
      startListening();
    }
  };

  const sharedProps: ChatBodyProps = {
    messages,
    isBotTyping,
    inputText,
    isListening,
    micEnabled,
    voiceEnabled,
    voiceState,
    bottomRef,
    inputRef,
    onInputChange: setInputText,
    onKeyDown: handleKeyDown,
    onSend: handleSend,
    onMicToggle: handleMicToggle,
    onChipClick: handleQuickChip,
    onVoiceToggle: () => setVoiceEnabled(!voiceEnabled),
    onMicEnabledToggle: () => {
      if (isListening) stopListening();
      setMicEnabled(!micEnabled);
    },
    onStop: handleStop,
    onClose: handleClose,
    inline,
  };

  // ── INLINE MODE ──
  if (inline) {
    return (
      <div
        className="rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(88,28,135,0.35), rgba(49,46,129,0.35))",
          border: "1.5px solid rgba(139,92,246,0.40)",
          boxShadow: "0 8px 32px rgba(139,92,246,0.18)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          height: "480px",
          maxHeight: "480px",
        }}
        data-ocid="priya.panel"
      >
        <ChatBody {...sharedProps} />
      </div>
    );
  }

  // ── FLOATING POPUP MODE ──
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
          className="rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            background:
              "linear-gradient(135deg, rgba(88,28,135,0.97), rgba(49,46,129,0.97))",
            border: "1.5px solid rgba(139,92,246,0.50)",
            height: "min(520px, calc(100dvh - 160px))",
          }}
        >
          <ChatBody {...sharedProps} />
        </div>
      </div>

      {/* ---- Floating Priya Button ---- */}
      <button
        type="button"
        onClick={() => (open ? handleClose() : handleOpen())}
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
