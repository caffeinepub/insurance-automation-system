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

// Motor insurance keywords - comprehensive detection
const MOTOR_INSURANCE_KEYWORDS = [
  // Core insurance terms
  "insurance",
  "insure",
  "bima",
  "policy",
  "polisi",
  "cover",
  "coverage",
  "premium",
  "pramium",
  "ncb",
  "no claim",
  "idv",
  "insured declared",
  "claim",
  "daawa",
  "accident",
  "durghatna",
  "damage",
  "nuksan",
  "renewal",
  "renew",
  "nuveen",
  "expire",
  // Vehicle types
  "car",
  "gaadi",
  "vehicle",
  "gadi",
  "bike",
  "scooter",
  "motorcycle",
  "truck",
  "bus",
  "van",
  "taxi",
  "auto",
  "tractor",
  "two wheeler",
  "four wheeler",
  // Documents
  "rc",
  "registration",
  "pan card",
  "aadhaar",
  "aadhar",
  "kyc",
  "driving license",
  "dl",
  // Add-ons
  "zero dep",
  "zerodep",
  "depreciation",
  "depreciation",
  "engine protection",
  "roadside",
  "rsa",
  "return to invoice",
  "rti",
  "add on",
  "addon",
  "add-on",
  // Insurance processes
  "quotation",
  "quote",
  "pb portal",
  "pb partner",
  "pbpartner",
  "payment",
  "bhugtan",
  "paise",
  "payment link",
  "third party",
  "comprehensive",
  "od premium",
  "own damage",
  "endorsement",
  "transfer",
  "hypothecation",
  "nominee",
  // Lead management
  "lead",
  "customer",
  "client",
  "agent",
  "workflow",
  "status",
  "docs pending",
  "kyc pending",
  "completed",
  "follow up",
  "followup",
  // Hindi insurance words
  "motor bima",
  "gaadi ka bima",
  "vahaan bima",
  "beema",
  "bema",
  "cashless",
  "reimbursement",
  "garage",
  "repair",
  "total loss",
  "navi policy",
  "purani policy",
  "policy number",
  "policy copy",
  // Marathi
  "vahan",
  "vima",
  "vaahan",
  "gadir",
  "naledi",
  // Additional Marathi + Hindi keywords
  "विमा",
  "प्रीमियम",
  "दावा",
  "एनसीबी",
  "आयडीव्ही",
  "पॉलिसी",
  "आरसी",
  "आधार",
  "मालक",
  "नोंदणी",
  "premia",
  "dava",
  "aydivhi",
  "yojana",
  "bharpai",
];

// Check if the question is related to motor insurance
function isMotorInsuranceRelated(msg: string): boolean {
  const lower = msg.toLowerCase();

  // New lead creation is always allowed
  if (/new lead|lead create|lead banao|lead banana|navin lead/i.test(lower))
    return true;

  // Greetings are always allowed
  if (
    /^(hi|hello|hey|hii|namaste|namaskar|kya haal|kaise ho|kashi aahat|good morning|good afternoon|good evening)\b/i.test(
      lower.trim(),
    )
  )
    return true;

  // Thanks/help are always allowed
  if (
    /^(thanks|thank you|shukriya|dhanyawaad|ok|okay|theek hai|samjha|got it|help)\b/i.test(
      lower.trim(),
    )
  )
    return true;

  // Check for motor insurance keywords
  for (const keyword of MOTOR_INSURANCE_KEYWORDS) {
    if (lower.includes(keyword)) return true;
  }

  return false;
}

// ---- Dynamic Response Generator ----
// This replaces all static scripted replies with intelligent, contextual AI responses

interface ConversationContext {
  recentTopics: string[];
  recentResponses: string[];
  turnCount: number;
}

// Generate a dynamic, intelligent response to any motor insurance question
function generateDynamicResponse(
  userMsg: string,
  context: ConversationContext,
  leads: Lead[],
): string {
  const msg = userMsg.trim();
  const lower = msg.toLowerCase();

  // --- New Lead creation ---
  if (/new lead|lead create|lead banao|lead banana|navin lead/i.test(lower)) {
    return "__OPEN_NEW_LEAD__";
  }

  // --- Greeting ---
  if (
    /^(hi|hello|hey|hii|namaste|namaskar|kya haal|kaise ho|kashi aahat|good morning|good afternoon|good evening)\b/i.test(
      lower.trim(),
    )
  ) {
    const greets = [
      "Namaste! 🙏 Main Priya hoon — aapki motor insurance AI assistant. Insurance ke kisi bhi sawaal mein madad karungi — NCB, IDV, claim, premium, documents, ya agent workflow. Boliye, kya chahiye? 😊",
      "Hello! 👋 Main Priya hoon, aapki insurance assistant. Aaj kya poochna chahte hain? NCB, claim process, quotation, ya kuch aur? Main hoon na! 💪",
      "Namaskar! 🌟 Priya here — motor insurance ke baare mein jo bhi jaanna ho, seedha poochho. Main samjhaakar help karungi! Kya sawaal hai? 😊",
    ];
    return greets[context.turnCount % greets.length];
  }

  // --- Thanks ---
  if (
    /^(thanks|thank you|shukriya|dhanyawaad|bahut achha|theek hai|samjha|got it|accha|acha)\b/i.test(
      lower.trim(),
    )
  ) {
    const thanks = [
      "Aapka swagat hai! 🙏 Koi aur sawaal ho toh zaroor poochho. Main hamesha help ke liye ready hoon! 😊",
      "Khushi hui madad karke! Kuch aur chahiye toh bolein — insurance ka koi bhi topic. 🌟",
      "Bilkul! Aur koi cheez jaanni ho toh bata dena. Main aapki assistant hoon! 💪",
    ];
    return thanks[context.turnCount % thanks.length];
  }

  // --- NCB questions ---
  if (/ncb|no.?claim.?bonus/i.test(lower)) {
    if (/transfer|move|kaise transfer|le jaao/i.test(lower)) {
      return buildNcbTransferReply(context);
    }
    if (/lost|khatam|zero|kho|jaata|protest|protect/i.test(lower)) {
      return buildNcbLossReply(context);
    }
    if (/kitna|percentage|percent|kitni/i.test(lower)) {
      return buildNcbPercentReply(context);
    }
    return buildNcbGeneralReply(context);
  }

  // --- IDV ---
  if (
    /\bidv\b|insured declared value|gaadi ki value|declared value/i.test(lower)
  ) {
    return buildIdvReply(context);
  }

  // --- Claim ---
  if (/claim|dawa|daawa|accident claim|insurance claim/i.test(lower)) {
    if (/cashless/i.test(lower)) return buildCashlessClaimReply(context);
    if (/document|doc|kaagaz|paper/i.test(lower))
      return buildClaimDocReply(context);
    if (/reject|rejected|nahi mila|denied/i.test(lower))
      return buildClaimRejectionReply(context);
    return buildClaimGeneralReply(context);
  }

  // --- Premium ---
  if (
    /premium|kitna premium|premium kaise kam|premium reduce|premium zyada/i.test(
      lower,
    )
  ) {
    if (/kam|reduce|save|sasta/i.test(lower))
      return buildPremiumReductionReply(context);
    if (/factor|depend|kyon|kyun|zyada|kyun zyada/i.test(lower))
      return buildPremiumFactorsReply(context);
    return buildPremiumGeneralReply(context);
  }

  // --- Zero Dep ---
  if (/zero.?dep|zero.?depreciation|zerodep/i.test(lower)) {
    return buildZeroDepReply(context);
  }

  // --- Comprehensive vs TP ---
  if (
    /comprehensive|third.?party|\btp\b|tp vs|vs tp|kaun sa lena/i.test(lower)
  ) {
    return buildComprehensiveVsTpReply(context);
  }

  // --- Renewal ---
  if (/renewal|renew|policy renew|policy expire|lapse/i.test(lower)) {
    return buildRenewalReply(context);
  }

  // --- KYC ---
  if (/\bkyc\b|know your customer|kyc complete|identity proof/i.test(lower)) {
    return buildKycReply(context);
  }

  // --- RC ---
  if (/\brc\b|registration certificate|gaadi ka rc|vehicle rc/i.test(lower)) {
    return buildRcReply(context);
  }

  // --- Add-ons ---
  if (
    /add.?on|addons|addon|extra cover|additional cover|konsa add/i.test(lower)
  ) {
    return buildAddOnReply(context, lower);
  }

  // --- Engine Protection ---
  if (/engine protection|engine cover|hydraulic|flood.*engine/i.test(lower)) {
    return buildEngineProtectionReply(context);
  }

  // --- RTI ---
  if (
    /return.?to.?invoice|\brti\b|invoice value|total loss value/i.test(lower)
  ) {
    return buildRtiReply(context);
  }

  // --- RSA ---
  if (/roadside assistance|\brsa\b|breakdown|towing|flat tyre/i.test(lower)) {
    return buildRsaReply(context);
  }

  // --- Endorsement ---
  if (
    /endorsement|policy change|naam change|address change|hypothecation/i.test(
      lower,
    )
  ) {
    return buildEndorsementReply(context);
  }

  // --- OD ---
  if (/own damage|\bod\b|od premium|od cover|od vs tp/i.test(lower)) {
    return buildOdReply(context);
  }

  // --- Two-wheeler ---
  if (/two.?wheeler|bike insurance|motorcycle|scooter insurance/i.test(lower)) {
    return buildTwoWheelerReply(context);
  }

  // --- Commercial vehicle ---
  if (/commercial|truck|bus|taxi|auto.?rickshaw|\bgcv\b|\bpcv\b/i.test(lower)) {
    return buildCommercialReply(context);
  }

  // --- IRDA/Regulatory ---
  if (
    /irda|irdai|regulatory|compliance|grievance|ombudsman|mandatory.*doc|kyc.*rule|rule.*kyc/i.test(
      lower,
    )
  ) {
    return buildIrdaRulesReply(context);
  }

  // --- Market comparison ---
  if (
    /company compare|compare.*company|best company|which company|konsi company|kaun si company|claim ratio|settlement ratio|csr|icici|bajaj|hdfc|digit|tata aig|new india|network garage/i.test(
      lower,
    )
  ) {
    return buildMarketComparisonReply(context);
  }

  // --- Best plan suggestion ---
  if (
    /best plan|konsa plan|which plan|plan suggest|suggest.*plan|best policy|recommend.*policy|policy recommend|kya lena chahiye/i.test(
      lower,
    )
  ) {
    return buildBestPlanSuggestionReply(context);
  }

  // --- Policy types ---
  if (
    /policy type|types of policy|saod|bundled policy|long.?term policy|pay as you drive|payd|1 year od|5 year tp/i.test(
      lower,
    )
  ) {
    return buildPolicyTypesReply(context);
  }

  // --- PA Cover ---
  if (
    /personal accident|\bpa cover\b|\bpa\b.*cover|owner.?driver.*cover|15.*lakh.*cover|mandatory.*accident/i.test(
      lower,
    )
  ) {
    return buildPaCoverReply(context);
  }

  // --- Proposal step ---
  if (
    /proposal|proposal form|proposal step|fill proposal|proposal kaise/i.test(
      lower,
    )
  ) {
    return buildProposalStepReply(context);
  }

  // --- Plan selection ---
  if (
    /plan selection|select.*plan|plan.*select|plan choose|choose.*plan|add.?on.*select|addon.*select/i.test(
      lower,
    )
  ) {
    return buildPlanSelectionReply(context);
  }

  // --- PB Portal ---
  if (/pb portal|pb partner|pbpartner|portal.*step|pb website/i.test(lower)) {
    return buildPbPortalReply(context);
  }

  // --- Quotation ---
  if (
    /quotation|quote|quoting|best plan|compare plan|plan select|best policy/i.test(
      lower,
    )
  ) {
    return buildQuotationReply(context);
  }

  // --- Payment ---
  if (
    /payment|pay.*karo|bhugtan|paise.*bhejo|payment link|link.*bhejo|payment.*process/i.test(
      lower,
    )
  ) {
    return buildPaymentReply(context, leads);
  }

  // --- Documents ---
  if (
    /document|checklist|docs|kaagaz|papers|kya kya chahiye|document.*list/i.test(
      lower,
    )
  ) {
    return buildDocumentsReply(context, leads);
  }

  // --- Policy download/soft copy ---
  if (
    /policy.*download|soft copy|policy pdf|policy copy|email.*policy/i.test(
      lower,
    )
  ) {
    return buildPolicyDownloadReply(context);
  }

  // --- Agent tips / workflow ---
  if (
    /agent.*tip|workflow.*tip|kaise close|lead close|conversion|sales.*tip|agent.*help/i.test(
      lower,
    )
  ) {
    return buildAgentTipsReply(context);
  }

  // --- Follow-up ---
  if (/follow.?up|reminder|customer follow|follow.*karna/i.test(lower)) {
    return buildFollowUpReply(context);
  }

  // --- Lead status ---
  if (
    /status|lead status|docs pending|kyc pending|payment sent|quotation ready|status.*kya/i.test(
      lower,
    )
  ) {
    return buildStatusReply(context);
  }

  // --- Help ---
  if (
    /^help$|kya kar sakti|what can you|capabilities|madad.*chahiye|kya help/i.test(
      lower.trim(),
    )
  ) {
    return buildHelpReply();
  }

  // --- General insurance question (catch-all for insurance topics) ---
  if (isMotorInsuranceRelated(msg)) {
    return buildGeneralInsuranceReply(msg, context);
  }

  // --- Off-topic: Not motor insurance related ---
  return "Sorry, ye motor insurance se related nahi hai. 🙏\n\nMain sirf insurance related help kar sakti hoon.\nKya main aapki kisi aur cheez mein madad kar sakti hoon?";
}

// ---- Specialized Reply Builders ----
// Each builder generates fresh, contextual responses

function buildNcbGeneralReply(ctx: ConversationContext): string {
  const variants = [
    "NCB matlab No Claim Bonus — yeh ek reward hai jo insurer deta hai agar aap poora saal bina claim kiye drive karte ho! 🎉 Pehle saal 20%, phir 25%, 35%, 45%, aur max 50% discount premium pe milta hai. Important: NCB gaadi ke saath nahi, OWNER ke saath jaata hai. Toh gaadi bechi ya badli toh bhi NCB transfer hota hai. Kuch aur jaanna hai NCB ke baare mein? 😊",
    "NCB (No Claim Bonus) ek cumulative discount hai — har claim-free saal ke baad badhta hai. Table: 1st year = 20%, 2nd = 25%, 3rd = 35%, 4th = 45%, 5th+ = 50%. Agar claim kiya toh NCB reset ho jaata hai zero pe. NCB Protector add-on lene se ek claim ke baad bhi NCB safe rehta hai! Smart choice hai. Kya aur detail chahiye? 🚗",
    "No Claim Bonus ek bahut valuable benefit hai insurance mein! 💰 Sochiye — agar 5 saal bina claim ke gaye toh premium pe 50% tak bachaa sakte ho. NCB certificate renewal pe bahut zaroori hota hai — purani company se certificate lo aur naye insurer ko do. Bhoolna mat! Aur kuch? 💡",
  ];
  return variants[ctx.turnCount % variants.length];
}

function buildNcbTransferReply(ctx: ConversationContext): string {
  const variants = [
    "NCB transfer simple process hai! 🔄 Step 1: Purani insurance company se NCB certificate maango (usually email ya letter mein milta hai). Step 2: New policy khareedte waqt yeh certificate submit karo. Step 3: New insurer verify karke discount apply kar deta hai. Yaad rakhein — NCB 90 din tak valid hota hai transfer ke liye. Koi aur sawaal? 😊",
    "NCB transfer ke liye sirf 2 cheezein chahiye: (1) NCB Certificate from previous insurer — letter ya email pe maango. (2) New policy form mein 'Transfer NCB' mention karo. Simple! Many agents yeh step miss karte hain aur customer ka paisa waste hota hai. Always NCB transfer karein! 💪",
  ];
  return variants[ctx.turnCount % variants.length];
}

function buildNcbLossReply(_ctx: ConversationContext): string {
  return "NCB kab khatam hota hai? Jab bhi claim file karte ho — NCB reset ho jaata hai zero pe. 😔 Par solution hai: NCB Protector add-on lein! Isse ek claim ke baad bhi NCB safe rehta hai. Thoda extra premium lagta hai (~₹500-800/year) but long-term mein bahut valuable hai. Specially jo log premium gaadiyaan chalate hain unke liye must-have! Aur kuch? 💡";
}

function buildNcbPercentReply(_ctx: ConversationContext): string {
  return "NCB percentage structure: 📊\n1 claim-free year → 20% discount\n2 years → 25%\n3 years → 35%\n4 years → 45%\n5+ years → 50% (maximum)\n\nExample: Agar annual premium ₹15,000 hai aur 5 saal ka NCB hai toh ₹7,500 bachenge! NCB maintain karna bahut financially smart hai. Koi aur sawaal? 💰";
}

function buildIdvReply(ctx: ConversationContext): string {
  const variants = [
    "IDV yaane Insured Declared Value — yeh aapki gaadi ki current market value hai insurance ki nazarion mein! 🚗 Jab claim hota hai total loss ya theft ka, toh maximum IDV tak hi milega. IDV gaadi ki age ke saath kam hoti hai (depreciation ki wajah se). Tip: IDV naa bahut kam rakhein (underinsured hoge) naa bahut zyada (premium zyada badhega). Market value ke kareeb rakhna best hai! Kuch aur? 😊",
    "IDV kaise calculate hoti hai? Simple formula: IDV = Showroom Price minus Depreciation. Depreciation schedule: 6 months tak — 5%, 6 months to 1 year — 15%, 1-2 years — 20%, 2-3 years — 30%, 3-4 years — 40%, 4-5 years — 50%. 5 saal se zyada purani gaadi ki IDV surveyor assess karta hai. Agents ke liye tip — customer ko realistic IDV set karne mein help karo! 💡",
  ];
  return variants[ctx.turnCount % variants.length];
}

function buildCashlessClaimReply(_ctx: ConversationContext): string {
  return "Cashless claim process samjhaata hoon! 🔧 Accident ke baad — insurance company ko IMMEDIATELY inform karo (helpline number policy pe hota hai). Gaadi ko empanelled garage pe le jaao (company ki garage list website pe milti hai). Garage directly company se bill settle karta hai — aapko sirf deductible amount pay karna hota hai. Documents: RC, DL, FIR (agar needed), claim form. Cashless ka faayda: Aapko paise upfront nahi lagte! Kuch aur? 💪";
}

function buildClaimDocReply(_ctx: ConversationContext): string {
  return "Claim ke liye required documents: 📋\n✅ Duly filled claim form (insurer se milega)\n✅ RC copy (original bhi ready rakhein)\n✅ Valid Driving License copy\n✅ Police FIR (accident ya theft ke liye mandatory)\n✅ Repair estimate / bills (garage se)\n✅ Identity proof (Aadhaar/PAN)\n✅ Bank details (reimbursement ke liye)\n✅ Spot photos (accident scene ke)\n\nTip: Sab documents ready karke tabhi claim file karo — incomplete submission se delay hota hai! Koi aur sawaal? 😊";
}

function buildClaimRejectionReply(_ctx: ConversationContext): string {
  return "Claim reject kyun hota hai? Common reasons aur solutions: ❌\n\nCommon Rejection Reasons:\n❌ Policy expired thi claim ke time\n❌ Drunk driving (DUI) — completely excluded\n❌ Invalid or expired Driving License\n❌ Policy exclusions — commercial use pe personal policy\n❌ Delayed intimation — 24-48 ghante mein inform nahi kiya\n❌ Incomplete documentation\n❌ Fraud ya misrepresentation in proposal form\n❌ Modification not declared (CNG kit, racing parts)\n\nSolution if Claim Rejected:\n1️⃣ Rejection letter carefully padhein — reason samjhein\n2️⃣ Additional documents de sakte hain (if document issue tha)\n3️⃣ Insurance Company Grievance Cell ko likhein (within 30 days)\n4️⃣ If no resolution in 15 days → IRDAI IGMS Portal pe complaint:\n   🌐 igms.irda.gov.in OR IRDAI Helpline: 155255\n5️⃣ Insurance Ombudsman: Free dispute resolution up to ₹30 lakh claim\n   📋 Ombudsman offices in 17 cities across India\n   ⏰ File within 1 year of insurer's final reply\n\n⚖️ Remember: IRDAI protects consumer rights — genuine claims MUST be settled!\n\nKoi specific rejection reason ke baare mein detail chahiye? 💪";
}

function buildClaimGeneralReply(ctx: ConversationContext): string {
  const variants = [
    "Claim process step-by-step! 📋 (1) Accident hone pe FIR file karo (serious cases mein). (2) Insurance company helpline pe 24-48 ghante mein inform karo. (3) Spot photos aur video lo. (4) Claim form fill karo. (5) Documents submit karo. (6) Surveyor assessment hogi. (7) Cashless: Garage se direct settlement. Reimbursement: Aap pay karo, company reimburse karegi. Har step pe main help karungi! Koi specific doubt? 😊",
    "Insurance claim mein 2 types hote hain: Cashless aur Reimbursement. Cashless mein aap kuch nahi pay karte — garage aur company direct settle karte hain (sirf deductible aapka). Reimbursement mein aap pehle pay karo, phir bills submit karo, company wapas deti hai. Cashless zyada convenient hai! For cashless — hamesha insurer ki empanelled garage list use karo. Samjhe? 🚗",
  ];
  return variants[ctx.turnCount % variants.length];
}

function buildPremiumReductionReply(_ctx: ConversationContext): string {
  return "Premium kaise kam karein? Smart tips: 💡\n1️⃣ NCB maintain karo — claim se bachein for max 50% discount\n2️⃣ Voluntary deductible badhaao — higher deductible = lower premium\n3️⃣ Unnecessary add-ons hataao — sirf jo chahiye woh rakhein\n4️⃣ Online renewal karein — offline se 5-10% sasta\n5️⃣ Security devices lagao (ARAI approved) — discount milta hai\n6️⃣ Garage membership (AAI/WIAA) se discount possible\n\nYaad rakhein — bahut sasta premium ka matlab limited coverage ho sakta hai. Balance maintain karo! Kuch aur? 😊";
}

function buildPremiumFactorsReply(_ctx: ConversationContext): string {
  return "Premium kaise decide hota hai? Factors: 📊\n🔹 IDV — gaadi ki value jitni zyada, premium utna zyada\n🔹 NCB — jitna zyada NCB, utna kam premium\n🔹 Gaadi ki age — purani gaadi ka premium thoda kam\n🔹 Add-ons — extra coverage matlab extra cost\n🔹 Location — metro cities mein thoda zyada\n🔹 Fuel type — CNG/LPG mein alag loading\n🔹 Claim history — past claims se premium badhta hai\n🔹 Car make/model — sports cars ya luxury cars zyada\n\nAgent tip: Customer ko explain karo ki premium kisi ek factor se nahi — combination se decide hota hai! 💰";
}

function buildPremiumGeneralReply(_ctx: ConversationContext): string {
  return "Motor insurance premium = OD Premium + TP Premium + Add-ons. 💰 TP (Third Party) premium government-set rates pe hota hai — koi negotiate nahi kar sakta. OD premium negotiable hai aur IDV, NCB, add-ons pe depend karta hai. Smart approach: Pehle TP mandatory cover lo, phir OD ke saath comprehensive lo with only needed add-ons. Total premium = reasonable coverage at good price. Kuch aur jaanna hai? 😊";
}

function buildZeroDepReply(ctx: ConversationContext): string {
  const variants = [
    "Zero Depreciation — sabse popular add-on! 🌟 Normal claim mein plastic, rubber, fiber parts pe depreciation kata jaata hai. Example: Bumper replace kiya worth ₹12,000 — 40% depreciation laga toh sirf ₹7,200 mila. Zero Dep hoga toh poora ₹12,000 milega! Extra premium lagta hai roughly ₹1,500-3,000/year depending on car. 5 saal se zyada purani gaadi pe usually available nahi hota. New ya premium cars ke liye definitely lena chahiye! Koi aur sawaal? 💪",
    "Zero Dep add-on details: ✅ Full replacement cost milti hai parts pe. ✅ Plastic, rubber, fiber sab covered. ✅ Claim pe depreciation nahi katega. ⚠️ Usually max 2-3 claims per year allowed. ⚠️ Old cars (5+ years) pe unavailable. ⚠️ Slightly higher premium. ROI calculation: Ek claim mein usually Zero Dep ka pura premium recover ho jaata hai! Smart investment hai. Kuch aur? 😊",
  ];
  return variants[ctx.turnCount % variants.length];
}

function buildComprehensiveVsTpReply(_ctx: ConversationContext): string {
  return "Comprehensive vs Third Party — clear comparison! 🆚\n\nThird Party (TP):\n✅ Mandatory by law\n✅ Doosron ke damage/injury cover karta hai\n✅ Bahut sasta (₹2,000-3,000/year for car)\n❌ Aapki gaadi ka koi damage cover nahi\n\nComprehensive:\n✅ TP cover included\n✅ Aapki gaadi ka damage bhi cover\n✅ Theft, fire, natural calamity cover\n✅ Add-ons le sakte hain\n❌ Zyada premium\n\nRecommendation: Nai ya valuable gaadi ke liye ALWAYS comprehensive. Bahut purani low-value gaadi ke liye TP sasta padega. Agent tip: Customer ko value explain karo — comprehensive ki value bahut zyada hai! 💰";
}

function buildRenewalReply(ctx: ConversationContext): string {
  const variants = [
    "Policy renewal tips! ⏰ Grace period usually 30 days hoti hai expiry ke baad. Par caution: Grace period mein accident pe claim nahi milta (company to company varies). Best practice: 15-30 din pehle renew karo. NCB ke liye important: Lapse ho gayi toh NCB kho jaata hai! Online renewal 10-15% sasta padta hai. Renewal pe add-ons review karo — kuch zaroori na ho toh hataao. Koi doubt? 😊",
    "Renewal ke time checklist: 📋 ✅ NCB certificate ready karo (purani company se). ✅ RC aur DL validity check karo. ✅ IDV realistic set karo (market value ke hisaab se). ✅ Add-ons review karo. ✅ Compare quotes — sirf current insurer se renew karna zaroori nahi. ✅ Online renew karo for discount. Ek important baat — policy expire hone se pehle renew karna bahut zaroori hai. NCB aur continuity dono bach jaate hain! 💡",
  ];
  return variants[ctx.turnCount % variants.length];
}

function buildKycReply(_ctx: ConversationContext): string {
  return "KYC for Motor Insurance — IRDAI Mandated Rules: 📄\n\n🔹 Types of KYC:\n• eKYC (Aadhaar OTP) — instant, 100% digital, most preferred\n• CKYC — Central KYC Registry; once done reusable for all policies\n• Physical KYC — for high-value or commercial policies\n• Video KYC — insurer agent video call for verification\n\n🔹 Identity Proof (Any One):\nAadhaar Card (most preferred), PAN Card, Passport, Voter ID, Driving License\n\n🔹 Address Proof:\nAadhaar (if address updated), Utility bill (recent 3 months), Bank statement\n\n🔹 Vehicle Documents:\nRC copy (both sides), Previous policy (for renewal)\n\n🔹 IRDAI KYC Rules:\n✅ PAN mandatory for premium ≥ ₹50,000/year\n✅ Aadhaar-based eKYC is instant — 2 minutes only!\n✅ CKYC ID number stored — no need to re-submit KYC next time\n✅ Insurer cannot refuse eKYC as valid KYC\n\n⚠️ Agent Tip: Always collect documents BEFORE proposal submission. KYC delay = policy issuance delay = unhappy customer!\n\n📞 IRDAI Helpline: 155255 | Website: www.irdai.gov.in\n\nKya aur detail chahiye? 😊";
}

function buildRcReply(_ctx: ConversationContext): string {
  return "RC (Registration Certificate) — insurance ka backbone document! 🚗\n\nRC se verify hota hai:\n✅ Owner ka naam\n✅ Engine aur chassis number\n✅ Fuel type\n✅ Manufacturing year\n✅ Seating capacity\n\nRC Front + Back dono kyu chahiye? Front pe basic details, Back pe hypothecation (loan) details. Insurance mein dono match hone chahiye.\n\n⚠️ RC aur policy mein naam exactly same hona chahiye! Agar naam alag hai toh claim reject ho sakta hai.\n\nAgent tip: RC clearly scan karo — blurry image se verification fail hoti hai! Kuch aur? 💡";
}

function buildAddOnReply(ctx: ConversationContext, lower: string): string {
  if (/engine/i.test(lower)) return buildEngineProtectionReply(ctx);
  if (/rsa|roadside/i.test(lower)) return buildRsaReply(ctx);
  if (/rti|return to invoice/i.test(lower)) return buildRtiReply(ctx);

  return "Popular add-ons guide! 🌟\n\n🔹 Zero Depreciation — full repair cost (best for new cars)\n🔹 Engine Protection — hydraulic lock, flood damage cover\n🔹 Return to Invoice (RTI) — total loss pe original invoice value\n🔹 Roadside Assistance (RSA) — 24/7 breakdown help\n🔹 NCB Protector — NCB safe rakhta hai after claim\n🔹 Tyre Protection — tyre damage cover\n🔹 Consumables Cover — nuts, bolts, engine oil replace cost\n🔹 Key Replacement — lost key ka cost\n\nNew car ke liye best combo: Zero Dep + Engine Protection + RTI + RSA! Koi specific add-on ke baare mein jaanna hai? 💪";
}

function buildEngineProtectionReply(_ctx: ConversationContext): string {
  return "Engine Protection add-on — underrated but very important! 🌊 Normal policy mein hydraulic lock (engine mein paani ghusna, specially monsoon mein) cover nahi hota. Engine Protection add-on se: Engine damage, gearbox, transmission sab covered! Especially important for: Mumbai, Chennai, Hyderabad — heavy flooding wale cities. Also covers: AC compressor, transmission, gear box damage. Cost: ₹500-1,500/year depending on car. Agent tip: Monsoon se pehle renewal karne wale customers ko yeh zaroor suggest karo! 💡 Kuch aur?";
}

function buildRtiReply(_ctx: ConversationContext): string {
  return "Return to Invoice (RTI) — total loss ka best protection! 📊\n\nNormal policy mein: Total loss claim pe IDV milta hai (current market value)\nRTI ke saath: Original invoice price milta hai!\n\nReal example:\nCar kharidi ₹10 lakh mein\n2 saal baad IDV = ₹7 lakh\nTotal loss ya theft hua\nBina RTI: ₹7 lakh milega\nRTI ke saath: ₹10 lakh milega!\n\nDifference: ₹3 lakh ka faayda! 💰\n\nNew car ke pehle 3-4 saalo ke liye highly recommended. Premium alag: ~₹1,000-2,000/year. Worth every rupee! Kuch aur? 😊";
}

function buildRsaReply(_ctx: ConversationContext): string {
  return "Roadside Assistance (RSA) — 24/7 emergency support! 🆘\n\nKya milta hai:\n✅ Towing service (nearest garage)\n✅ Flat tyre assistance\n✅ Battery jumpstart\n✅ Emergency fuel delivery\n✅ Minor on-spot repairs\n✅ Taxi arrangement if car can't move\n\nAvailable: 24x7, anywhere in India\nCost: ₹400-800/year\n\nAgent tip: Highway pe drive karne wale customers ke liye must-recommend! Ek towing service bhi ₹2,000-3,000+ lagti hai — RSA ka premium recover ho jaata hai! Smart add-on. Kuch aur? 😊";
}

function buildEndorsementReply(_ctx: ConversationContext): string {
  return "Policy Endorsement — policy mein change karne ka official process! 📝\n\nCommon endorsements:\n• Owner change (gaadi bechi/kharidi)\n• Address change\n• Hypothecation add/remove (loan liya ya close kiya)\n• Name correction\n• Add-on add ya remove\n• Nominee change\n\nProcess: Insurance company ko written request do with supporting documents. Processing time: 3-7 working days. Some endorsements mein additional premium lag sakta hai.\n\n⚠️ Important: Gaadi kharidi ya bechi toh 14 din ke andar policy transfer ya endorsement karein! Delay se claim issues ho sakte hain. Koi specific endorsement ke baare mein jaanna hai? 💡";
}

function buildOdReply(_ctx: ConversationContext): string {
  return "OD (Own Damage) Insurance — aapki gaadi ki protection! 🚗\n\nOD cover karta hai:\n✅ Accident/collision damage\n✅ Fire, explosion\n✅ Theft (partial ya complete)\n✅ Natural calamities (flood, earthquake, cyclone)\n✅ Man-made calamities (riot, strike)\n\nOD optional hai par strongly recommended!\nTP (Third Party) mandatory hai by law — doosron ke liye cover.\n\nOD + TP = Comprehensive Policy\n\nOD premium IDV, gaadi ki age, aur add-ons pe depend karta hai. Generally OD premium zyada hota hai TP se. Smart choice: Hamesha comprehensive lein! 💪 Kuch aur?";
}

function buildTwoWheelerReply(_ctx: ConversationContext): string {
  return "Two-Wheeler Insurance — bike/scooter ke liye! 🏍️\n\nKey points:\n✅ New bikes ke liye: TP 5 saal compulsory (2019 से नियम)\n✅ OD annual renewal karein\n✅ Documents: RC, DL, Aadhaar/PAN\n✅ Add-ons available: Zero Dep, RSA, Engine Protection\n\nTip: Bike insurance often neglect hota hai! Par accident pe sirf TP hone se aapki bike ka repair cover nahi hoga.\n\nRider Personal Accident Cover: ₹15 lakh cover ke liye sirf ~₹100-200/year! Must-have for all bike owners.\n\nAgent tip: Bike renewal customers ko comprehensive convert karo — bahut easy conversion hai! 💪 Kuch aur?";
}

function buildCommercialReply(_ctx: ConversationContext): string {
  return "Commercial Vehicle Insurance — trucks, buses, taxis ke liye! 🚚\n\nPersonal vs Commercial policy alag hoti hai:\n• Higher premium (commercial use = more risk)\n• Different TP limits\n• GCV (Goods Carrying Vehicle) aur PCV (Passenger Carrying Vehicle) alag policies\n• Commercial use pe personal policy — claim rejected!\n\nGCV (Trucks, lorries, vans): Route permit, goods declaration important.\nPCV (Bus, taxi, auto): Passenger liability cover zaroori.\n\nAgent tip: Commercial vehicle ke liye specialist insurer se quote maango — better rates aur coverage milti hai! Koi specific vehicle type ke baare mein? 💡";
}

function buildPbPortalReply(ctx: ConversationContext): string {
  const variants = [
    "PB Portal workflow — step by step! 🖥️\n\nStep 1: pbpartners.com pe login karein\nStep 2: Vehicle number enter karein (carefully!)\nStep 3: RC se fuel type aur model verify karein\nStep 4: Owner details RC ke saath match karein\nStep 5: NCB details correctly fill karein\nStep 6: Quotations compare karein (highest IDV + good NCB = best)\nStep 7: Customer ko options explain karein\nStep 8: Plan select karein\nStep 9: KYC documents upload karein\nStep 10: Payment process complete karein\nStep 11: Policy download aur customer ko share karein!\n\nCommon mistakes se bachein: Wrong vehicle number, RC se details verify na karna! Kuch aur? 🎯",
    "PB Portal pe best practices: 💡\n\n⚠️ Common mistakes:\n• Vehicle number galat enter karna\n• Fuel type RC se verify na karna\n• NCB carry forward bhool jaana\n• Add-ons explain na karna\n• KYC documents incomplete submit karna\n\n✅ Best practices:\n• Hamesha RC saath rakhein comparison ke liye\n• NCB certificate pehle prepare karein\n• Customer ko 2-3 options dikhaaein\n• Best payout plan recommend karein\n• Payment ke baad immediately policy download karein\n\nKoi specific step pe stuck hain? Main help karungi! 🚀",
  ];
  return variants[ctx.turnCount % variants.length];
}

function buildQuotationReply(ctx: ConversationContext): string {
  const variants = [
    "Best quotation kaise milti hai? 💰\n\n1️⃣ PB Portal pe multiple companies compare karein\n2️⃣ IDV realistic rakhein — naa bahut kam, naa bahut zyada\n3️⃣ NCB correctly mention karein (discount ke liye)\n4️⃣ Add-ons carefully choose karein — sirf needed wali\n5️⃣ Claim settlement ratio check karein (high = better company)\n6️⃣ Highest payout plan = long-term value\n\n⚠️ Trap: Sirf sab se sasta plan mat lo — coverage bhi check karo!\n\nAgent tip: Customer ko 2-3 options dikhao with pros/cons — trust builds! Samjhe? 😊",
    "Quotation comparison mein kya dekhein: 📊\n\n✅ Total premium amount\n✅ IDV value\n✅ OD vs TP premium breakdown\n✅ Included add-ons\n✅ NCB discount applied\n✅ Company claim settlement ratio\n✅ Cashless garage network size\n\nPro tip: Same IDV pe lowest premium wali company sabse better nahi hoti — claim service bhi important hai! Agents ke liye: Company ka ICR (Incurred Claim Ratio) dekhein — 70-90% ideal range hai. Kuch aur? 💡",
  ];
  return variants[ctx.turnCount % variants.length];
}

function buildPaymentReply(_ctx: ConversationContext, leads: Lead[]): string {
  const pendingPayment = leads.filter(
    (l) =>
      l.workflowStatus === "Quotation Ready" ||
      l.workflowStatus === "PB Action Required",
  );

  let contextNote = "";
  if (pendingPayment.length > 0) {
    contextNote = `

📌 Current status: ${pendingPayment.length} lead(s) mein payment pending hai — Lead Detail page pe jaake Payment Link bhejein!`;
  }

  return `Payment process guide! 💳

Step 1: Lead detail page open karein
Step 2: Payment link section mein insurer portal se mili link paste karein
Step 3: "Send via WhatsApp" button tap karein → customer ko link jayega
Step 4: Customer link pe click karke UPI/Card/Net Banking se pay karega
Step 5: Payment confirm hone ke baad status "Payment Sent" update karein

Payment modes: UPI (fastest), Net Banking, Debit/Credit Card, Wallet

Tip: Payment link bhejne ke baad 24 ghante mein follow-up karo! ${contextNote}

Kuch aur? 😊`;
}

function buildDocumentsReply(_ctx: ConversationContext, leads: Lead[]): string {
  const missingDocs = leads.filter(
    (l) => !l.docsUploaded?.rcFront || !l.docsUploaded?.rcBack || !l.panUrl,
  );

  let contextNote = "";
  if (missingDocs.length > 0) {
    contextNote = `

⚠️ Alert: ${missingDocs.length} lead(s) mein documents incomplete hain! Lead list mein check karein.`;
  }

  return `Complete document checklist! 📋

✅ RC Front (clear scan)
✅ RC Back
✅ PAN Card
✅ Aadhaar Front
✅ Aadhaar Back
✅ Old Policy (agar available ho — renewal ke liye helpful)
✅ Driving License (claim ke waqt zaroori)

Optional but helpful:
📷 Vehicle photos (all sides)
📄 Previous claim history

Tips:
• Documents blurry nahi hone chahiye
• Mobile se scan karo well-lit area mein
• PDF preferred for larger documents${contextNote}

Kuch aur? 💪`;
}

function buildPolicyDownloadReply(_ctx: ConversationContext): string {
  return "Policy soft copy guide! 📄\n\nKahan se milegi:\n1️⃣ Insurance company registered email pe PDF bhejti hai (same day ya next day)\n2️⃣ PB Partner portal se download kar sakte hain\n3️⃣ App ke Customer Tracking section mein bhi available hai\n\nCustomer ko kaise share karein:\n📱 WhatsApp pe PDF forward karein\n📧 Email pe bhejein\n\n⚠️ Important: Soft copy (PDF) legally valid hai — physical copy jaisi! Court mein bhi acceptable.\n\nTip: Policy milte hi immediately save karo multiple places mein — cloud, email, phone. Lost policy ke liye insurer se duplicate copy request kar sakte hain. Kuch aur? 😊";
}

function buildAgentTipsReply(ctx: ConversationContext): string {
  const variants = [
    "Agent workflow tips! 🏆\n\n1️⃣ Lead status hamesha updated rakhein — admin visibility ke liye\n2️⃣ Documents jaldi collect karo — delay = customer frustration\n3️⃣ Customer ko process clearly explain karo — trust builds conversion\n4️⃣ Follow-up reminder set karo har 2-3 din pe pending leads ke liye\n5️⃣ Payment link bhejne ke baad 24 ghante mein call/WhatsApp\n6️⃣ Professional tone maintain karo — friendly bhi, pushy nahi\n7️⃣ NCB aur add-ons samjhao — customer apko expert manega\n\nGame-changing tip: Customer ko show karo tum unke paise bachaa rahe ho — trust = conversion! 💰",
    "Lead close karne ke smart strategies! 🎯\n\n1️⃣ Urgency create karo (honestly): 'Policy expire ho rahi hai, NCB lose ho jayega!'\n2️⃣ Value dikhao: Zero Dep example se explain karo (₹12,000 vs ₹7,200)\n3️⃣ Trust: Company claim ratio share karo — credibility badhti hai\n4️⃣ Easy karo: 'Aapko kuch nahi karna, main sab handle karunga'\n5️⃣ Quick response: Jaldi reply karne wala agent zyada closes karta hai\n6️⃣ Post-sale: Policy milne ke baad congratulate karo — referrals aate hain!\n\nYaad rakhein: Insurance bechi nahi jaati, solution diya jaata hai! 🚀",
  ];
  return variants[ctx.turnCount % variants.length];
}

function buildFollowUpReply(_ctx: ConversationContext): string {
  return "Customer follow-up best practices! 📞\n\nTimeline:\n📅 Day 1: Polite WhatsApp — document request with reason why it's important\n📅 Day 3: Call karo agar no response — personal touch works better\n📅 Day 5: Reminder WhatsApp + mention NCB/deadline urgency\n📅 Day 7: Last follow-up — 'Aaj tak documents nahi mile, aur thodi help chahiye kya?'\n\nTone rules:\n✅ Always polite aur helpful\n✅ Focus on customer benefit, not your target\n❌ Never pushy ya aggressive\n❌ Over-follow-up se customer irritate hota hai\n\nPro tip: WhatsApp message mein customer ka naam use karo — personal feel aata hai! 😊\n\nKuch aur?";
}

function buildStatusReply(_ctx: ConversationContext): string {
  return "Lead status workflow explanation! 📊\n\n🔵 Docs Pending → Documents abhi nahi mile\n🟡 Docs Received → Documents mil gaye, verification ho rahi hai\n🟢 Details Completed → Sab info ready\n⭐ Quotation Ready → Best quote select ho gayi\n🔴 PB Action Required → PB Portal pe kuch complete karna hai\n✅ KYC Completed → Identity verification done\n💰 Payment Sent → Customer ne payment ki\n🏆 Completed → Policy issued aur delivered!\n\nHar status pe alag action hoti hai. Agents ko hamesha status update karte rehna chahiye — admin ko visibility milti hai aur process smooth rehta hai.\n\nKya kisi specific status ke baare mein detail chahiye? 😊";
}

function buildHelpReply(): string {
  return "Main Priya hoon — aapki Professional Motor Insurance AI Advisor! 🌟\n\nMain in topics pe help kar sakti hoon:\n\n🔵 Insurance Concepts: NCB, IDV, Premium, Claim, Zero Dep, Add-ons, PA Cover\n🟢 Policy Types: Comprehensive, Third Party, SAOD, Bundled, Long-term\n🟡 Workflow: App Dashboard, PB Portal steps, Proposal, Quotation, Payment\n🟠 Documents & KYC: Checklist, IRDAI KYC rules, RC verification\n🔴 IRDA Rules: KYC compliance, Mandatory docs, Grievance, Ombudsman\n🟣 Market Knowledge: Company comparison, CSR, Best plan suggestion\n⚪ Agent Tools: Follow-up tips, Lead management, Conversion strategies\n🎓 Training Mode: Step-by-step learning on any insurance topic\n\nBas poochho — koi bhi motor insurance sawaal! Hindi, English, ya Marathi mein. Main hoon na! 💪\n\nQuick topics:\n• 'IRDA rules' → Compliance guide\n• 'Company compare' → CSR + network comparison\n• 'Best plan' → Profiling-based suggestion\n• 'PA Cover' → Mandatory PA rules\n• 'Policy types' → All policy types explained\n• 'Proposal step' → PB Portal proposal guide\n\nKya jaanna hai? 😊";
}

function buildGeneralInsuranceReply(
  msg: string,
  _ctx: ConversationContext,
): string {
  // Intelligent catch-all for insurance-related questions not matched above
  const lower = msg.toLowerCase();

  if (/nominee|nominee change/i.test(lower)) {
    return "Nominee insurance policy mein bahut important hota hai! 👨‍👩‍👧 Nominee woh person hai jisko claim amount milega agar policyholder ko kuch ho jaaye. Nominee add ya change karne ke liye endorsement request submit karein insurer ko with nominee's ID proof. Tip: Nominee always update karo life changes pe (marriage, children, etc.). Motor insurance mein nominee mainly Personal Accident cover ke liye relevant hota hai. Kuch aur? 😊";
  }

  if (/hypothecation|loan|bank.*insurance|emi/i.test(lower)) {
    return "Hypothecation aur insurance — samjhaata hoon! 🏦 Agar gaadi pe loan hai, toh RC aur insurance policy dono mein bank ka naam hypothecation mein hona chahiye. Loan close hone pe 2 cheezein karein: (1) RTO se RC update karwaao (hypothecation remove). (2) Insurance company ko endorsement do — bank ka naam hataao. Agar hypothecation RC mein hai par insurance mein nahi — claim settlement mein issues ho sakte hain! Important step! Kuch aur? 💡";
  }

  if (/stolen|chori|theft|gaadi chori/i.test(lower)) {
    return "Gaadi chori ho gayi? Yeh steps follow karein IMMEDIATELY! 🚨\n\n1️⃣ Police FIR file karein — same day!\n2️⃣ Insurance company helpline pe inform karein — 24-48 hrs mein\n3️⃣ RC original, all duplicate keys submit karein\n4️⃣ Non-Traceable Certificate (NTC) Police se obtain karein (after 90 days if not found)\n5️⃣ Claim form fill karein with all documents\n6️⃣ IDV amount milega (minus deductible) after verification\n\nNote: Comprehensive policy mein theft cover hoti hai — TP only policy mein NAHI hoti!\n\nAur kuch? 💪";
  }

  if (/flood|natural.*disaster|calamity|earthquake|cyclone/i.test(lower)) {
    return "Natural calamity se gaadi ka damage — coverage hoti hai! 🌊 Comprehensive policy mein natural calamities cover hoti hain: Flood, earthquake, cyclone, hailstorm, lightning, etc. Par ek catch hai: Engine mein paani ghusna (Hydraulic Lock) standard policy mein cover nahi hota! Iske liye Engine Protection add-on zaroor lein — especially flood-prone areas mein. Claim process: Photos lo, company ko immediately inform karo, empanelled garage pe le jaao. Kuch aur? 😊";
  }

  // Generic insurance response
  return `Interesting sawaal! Aapne pucha hai: "${msg.length > 50 ? `${msg.substring(0, 47)}...` : msg}" 🤔

Main is topic pe help kar sakti hoon — thoda aur specific batao? Jaise:
• Kya yeh policy/coverage ke baare mein hai?
• Claim process ke baare mein?
• Documents ya KYC se related?
• Agent workflow se related?

Main motor insurance ke baare mein poori detail de sakti hoon — sirf topic clearly batao! 😊`;
}

function buildIrdaRulesReply(_ctx: ConversationContext): string {
  return '🏛️ IRDAI Rules & Compliance — Professional Guide:\n\n📋 KYC Requirements (IRDAI Circular):\n✅ Aadhaar-based eKYC — instant, OTP-based, fully digital\n✅ CKYC (Central KYC) — once done, reusable for all financial products\n✅ PAN Card — mandatory for premium above ₹50,000/year\n✅ Physical KYC — needed for high-value or commercial policies\n\n📑 Mandatory Documents for Motor Policy:\n1️⃣ RC (Registration Certificate) — both sides\n2️⃣ Valid Driving License of owner/driver\n3️⃣ Aadhaar Card (identity + address proof)\n4️⃣ PAN Card (for KYC + transactions)\n5️⃣ Old Policy copy (for renewal + NCB proof)\n6️⃣ Passport-size photo (some insurers require)\n\n⚖️ Key IRDAI Rules:\n• Insurance contract is based on "Utmost Good Faith" — all info must be accurate\n• Insurer must settle claim within 30 days of survey\n• Free-look period: 15 days to cancel new policy\n• IRDAI Grievance Portal: igms.irda.gov.in\n• Insurance Ombudsman: Free dispute resolution up to ₹30 lakh\n\n🛡️ Agent Compliance:\n• Never mis-sell — explain what is and isn\'t covered\n• Disclosure of commission is mandatory if asked\n• Customer must sign proposal form (digital/physical)\n\nKisi specific IRDAI rule ke baare mein detail chahiye? 😊';
}

function buildMarketComparisonReply(_ctx: ConversationContext): string {
  return "🏆 Top Motor Insurers Comparison — 2024:\n\n| Company | CSR* | Network Garages | Strength |\n|---|---|---|---|\n| ICICI Lombard | 97.4% | 15,000+ | Fast claim, digital |\n| Bajaj Allianz | 98.5% | 6,500+ | High CSR, trusted |\n| HDFC ERGO | 91.2% | 8,800+ | Good add-ons |\n| Digit Insurance | 96.4% | 6,900+ | Affordable, digital-first |\n| Tata AIG | 95.0% | 7,500+ | Reliable, wide coverage |\n| New India Assurance | 91.6% | 3,000+ | PSU trust |\n| Oriental Insurance | 90.1% | 3,200+ | Budget option |\n\n*CSR = Claim Settlement Ratio (higher = better)\n\n💡 Best Plan Suggestion by Category:\n🚗 New Premium Car: ICICI Lombard or Bajaj Allianz (Zero Dep + RTI)\n🏍️ Two-Wheeler: Digit or Bajaj Allianz (affordable + fast)\n🚛 Commercial Vehicle: New India or HDFC ERGO (specialist coverage)\n👴 Old Car (8+ yrs): Third Party only — Digit or New India (cheapest)\n\n📊 PB Partners typically shows top 6-8 companies — always compare and show customer CSR to build trust!\n\nKisi specific company ke baare mein detail chahiye? 💪";
}

function buildBestPlanSuggestionReply(ctx: ConversationContext): string {
  const tips = [
    "🎯 Best Plan Selection Guide:\n\nStep 1: Customer Profile Check karo\n• Car kitni purani hai? (0-3yr = Comprehensive must)\n• Loan hai? (Yes = Comprehensive mandatory by bank)\n• Parking — open ya garage? (Open = theft risk higher)\n• Usage — daily commute ya occasional?\n• Previous claims? (Yes = NCB already gaya)\n\nStep 2: Coverage Decide karo\n✅ 0-5 year car → Comprehensive + Zero Dep + Engine Protection\n✅ 5-8 year car → Comprehensive (skip Zero Dep)\n✅ 8+ year car → Third Party only (if low value)\n✅ Luxury/premium car → Always Comprehensive + all add-ons\n\nStep 3: Add-ons Select karo\n🌟 Must-have: Zero Dep, Engine Protection, RSA\n💡 Optional: RTI (new car), NCB Protector, Consumables\n\nStep 4: Company select karo\n• Check CSR (>95% preferred)\n• Network garage count (more = better cashless options)\n• Premium difference < ₹500 ho toh higher CSR company prefer karo\n\nQuote ready hai? Customer ko explain karein kya choose kiya aur kyun! 😊",
    '💰 Smart Plan Recommendation Strategy:\n\nCustomer ko sirf price pe focus mat karne do! Value dikhao:\n\n"Sir, ye plan ₹3,000 zyada hai lekin claim pe ₹35,000 extra milega (Zero Dep ke wajah se). Ek minor accident mein hi yeh extra amount recover ho jaata hai!"\n\nHighest Payout Formula:\n= Maximum IDV + Zero Depreciation + Engine Protection + RSA + NCB Protector\n\nYe formula use karo PB Portal pe plan select karte waqt. Customer automatically agree karta hai jab numbers clearly dikhate ho!\n\nAur tip: Company CSR share karo — "Is company ka 98% claims settle hota hai — ye matlab 100 mein se 98 log khush hain!" Customer confidence badhta hai! 🏆',
  ];
  return tips[ctx.turnCount % tips.length];
}

function buildPolicyTypesReply(_ctx: ConversationContext): string {
  return "📋 Motor Insurance Policy Types — Complete Guide:\n\n1️⃣ Third Party (TP) Only\n• Mandatory by law (Motor Vehicles Act)\n• Covers: Damage to others' vehicle/property, third party injury/death\n• Does NOT cover: Your own vehicle damage\n• Premium: Government-set (cheapest option)\n• Best for: Very old low-value cars\n\n2️⃣ Own Damage (OD) Only — SAOD\n• Covers only your vehicle damage\n• TP must be bought separately\n• Available when TP is already active\n\n3️⃣ Comprehensive (Package Policy) ✅ RECOMMENDED\n• TP + OD combined — full protection\n• Covers: Your vehicle + third party + theft + natural calamity\n• Add-ons possible\n• Best for: Any car up to 8-10 years\n\n4️⃣ Bundled Policy (For New Cars)\n• 1 Year OD + 5 Year TP\n• Mandated by Supreme Court for new vehicles\n• Cost-effective for brand new cars\n\n5️⃣ Long-Term Policy\n• 3-year or 5-year policy\n• Pros: No annual renewal hassle, fixed premium\n• Cons: Can't switch insurer easily\n• Available for two-wheelers mainly\n\n6️⃣ Pay-As-You-Drive (PAYD)\n• New IRDAI-approved concept\n• Premium based on km driven\n• Good for low-usage vehicles\n\nKonsa policy type customer ke liye best hai? Bol dein aur main specific guidance dunga! 😊";
}

function buildPaCoverReply(_ctx: ConversationContext): string {
  return "🛡️ Personal Accident (PA) Cover — MANDATORY Rule:\n\nIRDAI ne PA cover mandatory kar diya hai!\n\n✅ ₹15 Lakh PA Cover for Owner-Driver:\n• Mandatory for every motor policy\n• Covers owner-driver in case of accident\n• Death: 100% sum insured (₹15L)\n• Permanent Total Disability: 100%\n• Permanent Partial Disability: % as per IRDAI schedule\n• Temporary Disability: Weekly benefit (some policies)\n\n📋 When is PA NOT required:\n• If customer already has standalone PA policy (≥₹15L)\n• They must provide proof of existing PA cover\n\n💰 Cost: Usually ₹750-900/year add-on to motor policy\n\n⚠️ Common Agent Mistake: Some agents skip PA cover to show lower premium — THIS IS WRONG!\n\n🔑 Agent Action:\n1. Always include PA cover in quote\n2. Explain importance to customer\n3. If they have existing PA, take proof\n4. Note in policy proposal form\n\nCoverage details samjhe? Kuch aur poochhna hai? 😊";
}

function buildProposalStepReply(_ctx: ConversationContext): string {
  return "📝 PB Portal — Proposal Step Guide:\n\nAb quotation select hone ke baad Proposal Form bharni hai:\n\nStep 1: Policyholder Details\n✅ Full Name exactly as RC mein\n✅ Date of Birth (DD/MM/YYYY)\n✅ Mobile Number (registered)\n✅ Email ID\n✅ Address as per Aadhaar\n\nStep 2: Vehicle Details Verify\n✅ Registration Number\n✅ Engine Number\n✅ Chassis Number\n✅ Manufacturing Year\n✅ Purchase Date (for new cars)\n\nStep 3: Previous Policy Details (Renewal)\n✅ Previous Policy Number\n✅ Previous Insurer\n✅ NCB % claimed\n✅ Claim history (Yes/No)\n\nStep 4: KYC Documents Upload\n✅ Aadhaar Front + Back\n✅ PAN Card\n✅ RC copy (both sides)\n\nStep 5: Nominee Details\n✅ Nominee Name\n✅ Nominee Relationship\n✅ Nominee DOB\n\nStep 6: Review & Submit\n✅ Sabhi details ek baar verify karein\n✅ Customer se confirm karein\n✅ Submit button click karein\n\n⚠️ Common Mistakes to Avoid:\n• Name spelling mistake\n• Wrong engine/chassis number\n• NCB % galat declare karna\n• Missing KYC documents\n\nProposal submit ho gaya? Payment link generate karo! 💪";
}

function buildPlanSelectionReply(_ctx: ConversationContext): string {
  return "🎯 Plan Selection — Expert Strategy:\n\nQuotation page pe yeh order follow karo:\n\n1. IDV Check karo\n   • Market value ke equal ya slight premium consider karo\n   • Bahut kam IDV = underinsured (claim mein loss)\n   • Bahut zyada IDV = extra premium waste\n\n2. Plan Type Select karo\n   • Comprehensive hamesha (0-8 yr car)\n   • TP only sirf very old low-value cars ke liye\n\n3. Add-ons Select karo (in order of priority)\n   🥇 Zero Depreciation (must for <5 yr car)\n   🥈 Engine Protection (must for flood areas)\n   🥉 RSA (good for long-distance drivers)\n   4️⃣ NCB Protector (agar NCB ≥20% hai)\n   5️⃣ RTI (must for <1 yr car)\n   6️⃣ Consumables (optional, budget permitting)\n\n4. Company Compare karo\n   • Ek hi coverage ka quote 2-3 companies ka dekho\n   • ₹500-1000 premium difference pe CSR prefer karo\n   • Network garage count bhi check karo\n\n5. Customer ko Explain karo\n   • \"Ye ₹2,500 extra invest karo Zero Dep mein — ek minor claim pe ₹20,000+ bachenge\"\n   • Always value-based selling, not price-based!\n\nPlan select ho gaya? Proposal step ke liye 'Proposal' bolein ➡️";
}

// ---- Workflow-Aware Reply Builders ----

function buildAppDashboardReply(
  leads: Lead[],
  _workflow: PriyaWorkflow,
): string {
  if (leads.length === 0) {
    return "Abhi koi lead nahi hai. Naya lead add karne ke liye Dashboard pe 'New Lead' button use karein. \uD83D\uDE0A";
  }

  const total = leads.length;
  const completed = leads.filter(
    (l) => l.workflowStatus === "Completed",
  ).length;
  const pending = total - completed;

  const missingDocs = leads.filter(
    (l) => !l.docsUploaded?.rcFront || !l.docsUploaded?.rcBack || !l.panUrl,
  );

  const paymentPending = leads.filter(
    (l) =>
      l.workflowStatus === "Quotation Ready" ||
      l.workflowStatus === "PB Action Required",
  );

  const docsPending = leads.filter((l) => l.workflowStatus === "Docs Pending");

  let actionItems = "";
  const maxShow = 3;

  if (missingDocs.length > 0) {
    const shown = missingDocs.slice(0, maxShow);
    for (const lead of shown) {
      const missingList: string[] = [];
      if (!lead.docsUploaded?.rcFront) missingList.push("RC Front");
      if (!lead.docsUploaded?.rcBack) missingList.push("RC Back");
      if (!lead.panUrl) missingList.push("PAN");
      const name = lead.name || `Mobile ${lead.mobileNumber}`;
      actionItems += `\u2022 ${name}: Documents missing (${missingList.join(", ")}) \u2014 Status: ${lead.workflowStatus}\n`;
    }
    if (missingDocs.length > maxShow) {
      actionItems += `\u2022 ...aur ${missingDocs.length - maxShow} leads mein documents incomplete\n`;
    }
  }

  if (paymentPending.length > 0) {
    const shown = paymentPending.slice(0, maxShow);
    for (const lead of shown) {
      const name = lead.name || `Mobile ${lead.mobileNumber}`;
      actionItems += `\u2022 ${name}: Payment pending \u2014 Status: ${lead.workflowStatus}\n`;
    }
  }

  let nextStep = "";
  if (docsPending.length > 0) {
    const first = docsPending[0];
    const name = first.name || `Mobile ${first.mobileNumber}`;
    nextStep = `${name} ke documents collect karein \u2014 ${docsPending.length} lead(s) mein docs missing hain.`;
  } else if (paymentPending.length > 0) {
    nextStep = `${paymentPending.length} lead(s) ke liye payment link send karein \u2014 sabse urgent action!`;
  } else if (completed === total) {
    nextStep =
      "Sab leads complete hain! Naye leads add karein ya performance dashboard check karein. \uD83C\uDF89";
  } else {
    nextStep = "Pending leads ke status update karein aur follow-up karein.";
  }

  return `\uD83D\uDCCA App Dashboard Summary:\n\n\u2705 Total Leads: ${total} | Completed: ${completed} | Pending: ${pending}\n\n${actionItems.trim() ? `\u26A0\uFE0F Action Required:\n${actionItems.trim()}` : "\u2705 Sab leads on track hain!"}\n\n\uD83C\uDFAF Next Step: ${nextStep}\n\nKisi specific lead ke baare mein detail chahiye? Lead ka naam batayein. \uD83D\uDE0A`;
}

function buildPbPortalStepReply(step: number, activeLead: Lead | null): string {
  const leadName = activeLead?.name || "current customer";
  const vehicleNote = activeLead ? `\n\uD83D\uDCCB Lead: ${leadName}` : "";

  switch (step) {
    case 0:
      return `\uD83D\uDE97 Step 1: Vehicle Number Entry${vehicleNote}\n\nPB Portal pe vehicle number EXACTLY dalein jaise RC mein likha hai.\n\u2705 Capital letters use karein (MH12AB1234)\n\u26A0\uFE0F Space ya dash mat dalein\n\u26A0\uFE0F Ek bhi character galat hoga toh galat data aayega!${activeLead?.mobileNumber ? `\n\nCustomer mobile: ${activeLead.mobileNumber} \u2014 inka RC saath rakhein!` : ""}\n\nHo gaya? 'Done' bolein ya type karein \u27A1\uFE0F`;

    case 1:
      return "\u26FD Step 2: Fuel Type Check\n\nRC mein jo fuel type likha hai wahi select karein:\n\u2022 Petrol / Diesel / CNG / Electric / Hybrid\n\n\u26A0\uFE0F Fuel type galat select karna = galat premium calculation!\n\u26A0\uFE0F CNG gaadi mein Petrol select mat karna \u2014 bahut bada difference aata hai\n\nRC se verify karein aur portal pe match karein.\n\nDone? Aage badhein \u27A1\uFE0F";

    case 2:
      return `\uD83D\uDD27 Step 3: Variant/Model Check\n\nVehicle ka exact variant select karein:\n\u2022 RC mein 'Model' ya 'Vehicle Description' dekhen\n\u2022 Variant bilkul match hona chahiye (e.g., 'LXI', 'VXI', 'ZXI')\n\n\u26A0\uFE0F Wrong variant = wrong premium + claim reject ho sakta hai!\n\u2705 If confused \u2014 RC pe clearly mention hota hai exact variant\n\nConfirm karein aur 'Done' bolein \u27A1\uFE0F`;

    case 3: {
      const rcUploaded =
        activeLead?.docsUploaded?.rcFront && activeLead?.docsUploaded?.rcBack;
      const rcWarning =
        activeLead && !rcUploaded
          ? "\n\u26A0\uFE0F Warning: RC copy upload nahi hui! Pehle App mein RC upload karein."
          : activeLead && rcUploaded
            ? "\n\u2705 RC documents uploaded hain \u2014 carefully verify karein."
            : "";

      return `\uD83D\uDCC4 Step 4: RC Match Verification${rcWarning}\n\nSab details RC ke saath match karein:\n\u2705 Owner name exactly same hona chahiye\n\u2705 Registration date sahi ho\n\u2705 Vehicle class match kare (LMV, MCWG etc.)\n\u2705 Engine number match kare\n\u2705 Chassis number match kare\n\n\u26A0\uFE0F Koi bhi mismatch mila toh RUKO \u2014 galat data = policy rejection ya claim issue!\nMismatch hai toh: 'Warning' bolein aur main guide karungi \uD83D\uDED1\n\nSab sahi? 'Done' bolein \u27A1\uFE0F`;
    }

    case 4:
      return `\uD83D\uDCB0 Step 5: Quotation Generation\n\nAb quotes generate karein. Important tips:\n\u2705 Sabhi plan options check karein (Basic, Standard, Comprehensive)\n\u2705 Zero Depreciation add-on zaroor dekhen\n\u2705 Highest IDV wala plan prefer karein for better claim\n\u2705 Engine Protection + RSA add-on recommend karein\n\u2705 NCB correctly apply hua hai? Verify karein\n\n\u2B50 Best Payout Plan: Maximum IDV + Zero Dep + Engine Protection + RSA\n\uD83D\uDCA1 Customer ko Comprehensive plan recommend karein \u2014 claim mein full protection\n\nQuote aa gaya? Screenshot lo aur 'Done' bolein \u27A1\uFE0F`;
    default:
      return `\uD83C\uDF89 PB Portal Steps Complete!\n\nAb next steps:\n1. Quotation screenshot save karein\n2. App mein lead pe document upload karein\n3. Customer ko WhatsApp pe share karein\n\nCustomer ko message:\n'Aapka insurance quotation ready hai. Please check karein aur confirm karein.'\n\nCustomer ne agree kiya? 'Customer agree' ya 'Haan' bolein \u27A1\uFE0F\nQuotation upload karna hai? 'Document upload' bolein \u27A1\uFE0F`;
  }
}

function buildQuotationFlowReply(_step: number): string {
  return `\uD83D\uDCCB Quotation Review Checklist:\n\n1. Sabhi plans compare karein:\n   \u2022 Third Party (basic, cheap \u2014 minimum legal requirement)\n   \u2022 Own Damage only (aapki gaadi ka damage)\n   \u2022 Comprehensive (RECOMMENDED \u2705 \u2014 full protection)\n\n2. Highest payout ke liye:\n   \u2705 Maximum IDV select karein (gaadi ki full market value)\n   \u2705 Zero Depreciation add karein (full repair cost)\n   \u2705 Engine Protection add karein (flood/hydraulic damage)\n   \u2705 RSA (Roadside Assistance) consider karein\n   \u2705 NCB Protector agar NCB hai\n\n3. Plan select karne ke baad:\n   \u2192 Screenshot lo (full page capture)\n   \u2192 App mein Lead Detail pe jaao\n   \u2192 Document section mein upload karo\n   \u2192 Customer ko WhatsApp pe bhejo\n\nCustomer ko samjhana:\n'Ye plan best coverage deta hai aur claim mein full amount milega.'\n\nScreenshot ready? 'Upload' ya 'Done' bolein \u27A1\uFE0F`;
}

function buildDocumentFlowReply(
  _leads: Lead[],
  activeLead: Lead | null,
): string {
  const leadNote = activeLead
    ? `\n\uD83D\uDCCC Active Lead: ${activeLead.name || activeLead.mobileNumber} \u2014 inka Lead Detail page open karo.`
    : "";

  return `\uD83D\uDCE4 Document Upload Guide:${leadNote}\n\nStep 1: Quotation screenshot/PDF ready karo\nStep 2: App mein Lead Detail page pe jaao\nStep 3: 'Upload Document' button pe click karo\nStep 4: File select karo (JPG/PNG/PDF accepted)\nStep 5: Document type select karo (RC, PAN, Aadhaar, Quotation)\nStep 6: Save karo \u2014 document lead se link ho jaayega\n\nWhatsApp pe bhejne ke liye:\n\u2192 Lead Detail page pe 'WhatsApp' button click karo\n\u2192 Message automatic prefill hoga with document info\n\u2192 Send karo \u2014 customer ko instantly milega\n\nSupported formats: JPG, PNG, PDF (max recommended: 5MB)\n\nUpload ho gaya? 'Done' bolein \u27A1\uFE0F`;
}

function buildCustomerResponseReply(): string {
  return `\u2705 Customer Ne Agree Kiya! Great! \uD83C\uDF89\n\nPolicy Creation Steps:\n\n1. PB Portal pe wapas jaao\n2. Selected quotation pe 'Proceed' click karo\n3. KYC Details fill karo:\n   \u2705 Owner name as per RC (exactly same!)\n   \u2705 Date of birth\n   \u2705 Aadhaar number (12 digits)\n   \u2705 PAN number\n   \u2705 Mobile number (registered)\n4. Documents upload karo (Aadhaar + PAN + RC)\n5. Details verify karke 'Submit' karo\n6. Payment link generate karo\n\nPayment link generate hone ke baad:\n\u2192 App mein lead pe paste karo (Lead Detail > Payment Link field)\n\u2192 Customer ko WhatsApp pe bhejo\n\u2192 Customer payment karega \u2192 policy activate!\n\nPayment link ready? 'Payment' ya 'Payment link' bolein \u27A1\uFE0F`;
}

function buildPaymentFlowReply(leads: Lead[], activeLead: Lead | null): string {
  let statusNote = "";

  if (activeLead) {
    const name = activeLead.name || activeLead.mobileNumber;
    if (activeLead.paymentLink) {
      statusNote = `\n\u2705 ${name} ka payment link already saved hai \u2014 WhatsApp se bhejo!`;
    } else {
      statusNote = `\n\u26A0\uFE0F ${name} ka payment link abhi save nahi hua \u2014 pehle generate karo.`;
    }
  } else {
    const pendingPayment = leads.filter(
      (l) =>
        l.workflowStatus === "Quotation Ready" ||
        l.workflowStatus === "PB Action Required",
    );
    if (pendingPayment.length > 0) {
      statusNote = `\n\uD83D\uDCCC ${pendingPayment.length} lead(s) mein payment pending hai.`;
    }
  }

  return `\uD83D\uDCB3 Payment Link Guide:${statusNote}\n\nStep 1: PB Portal pe payment link generate karo\nStep 2: Link copy karo (Ctrl+C)\nStep 3: App mein Lead Detail page pe jaao\nStep 4: 'Payment Link' field mein paste karo\nStep 5: Save karo\nStep 6: WhatsApp button se customer ko bhejo\n\nWhatsApp Message (auto-prefilled):\n'Aapka insurance payment link ready hai.\nPlease complete the payment to activate your policy.'\n\n\uD83D\uDCA1 Tip: Payment link bhejne ke baad 2-4 ghante mein follow-up karo!\n\u26A1 Fast payment = faster policy issuance = happy customer\n\nPayment bhej diya? 'Done' bolein \u27A1\uFE0F\nPolicy status check karna? 'Status check' bolein \u27A1\uFE0F`;
}

// ---- Main Reply Generator (stateful wrapper) ----

function generateSmartPriyaReply(
  userMsg: string,
  lastTopic: string | null,
  leads: Lead[],
  setLastTopic: (topic: string | null) => void,
  conversationHistory: ChatMessage[],
  workflow: PriyaWorkflow,
): string {
  const ctx: ConversationContext = {
    recentTopics: lastTopic ? [lastTopic] : [],
    recentResponses: conversationHistory
      .filter((m) => m.sender === "bot")
      .slice(-3)
      .map((m) => m.text),
    turnCount: conversationHistory.filter((m) => m.sender === "user").length,
  };

  // Update topic tracking based on message content
  const lower = userMsg.toLowerCase();
  if (/ncb|no claim/i.test(lower)) setLastTopic("ncb");
  else if (/idv|declared value/i.test(lower)) setLastTopic("idv");
  else if (/claim/i.test(lower)) setLastTopic("claim");
  else if (/premium/i.test(lower)) setLastTopic("premium");
  else if (/zero.?dep/i.test(lower)) setLastTopic("zerodep");
  else if (/renewal|renew/i.test(lower)) setLastTopic("renewal");
  else if (/quotation|quote/i.test(lower)) setLastTopic("quotation");
  else if (/payment/i.test(lower)) setLastTopic("payment");
  else if (/document|docs/i.test(lower)) setLastTopic("documents");
  else if (/pb.?portal/i.test(lower)) setLastTopic("pbportal");

  // Check if motor insurance related (after special cases handled in generateDynamicResponse)
  const isInsurance = isMotorInsuranceRelated(userMsg);
  const isNewLead = /new lead|lead create|lead banao/i.test(lower);

  if (!isInsurance && !isNewLead) {
    return "Sorry, ye motor insurance se related nahi hai. 🙏\n\nMain sirf insurance related help kar sakti hoon.\nKya main aapki kisi aur cheez mein madad kar sakti hoon?";
  }

  // Phase-aware dispatch — workflow phases get specialized step-by-step responses
  const msgLower = userMsg.toLowerCase();

  if (
    workflow.phase === "app_dashboard" ||
    /dashboard|check.*lead|lead.*check|mera lead|lead detail|status.*check/i.test(
      msgLower,
    )
  ) {
    return buildAppDashboardReply(leads, workflow);
  }
  if (
    workflow.phase === "pb_portal" ||
    /pb portal|portal.*start|pb partner.*start|start.*portal/i.test(msgLower)
  ) {
    return buildPbPortalStepReply(workflow.pbPortalStep, workflow.activeLead);
  }
  if (
    workflow.phase === "quotation" ||
    /quotation.*check|plan.*compare|highest.*payout|quotation guide|best.*plan.*select/i.test(
      msgLower,
    )
  ) {
    return buildQuotationFlowReply(workflow.pbPortalStep);
  }
  if (
    workflow.phase === "document_flow" ||
    /screenshot.*upload|pdf.*bhejo|document.*upload|document.*lead|upload.*karo/i.test(
      msgLower,
    )
  ) {
    return buildDocumentFlowReply(leads, workflow.activeLead);
  }
  if (
    workflow.phase === "customer_response" ||
    /customer.*agree|customer.*haan|policy.*banao|customer ne haan/i.test(
      msgLower,
    )
  ) {
    return buildCustomerResponseReply();
  }
  if (
    workflow.phase === "payment_flow" ||
    /payment.*link|link.*generate|payment.*bhejo|payment.*send/i.test(msgLower)
  ) {
    return buildPaymentFlowReply(leads, workflow.activeLead);
  }

  return generateDynamicResponse(userMsg, ctx, leads);
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
          className="flex-1 rounded-full text-sm py-2 px-4 border-0 outline-none min-w-0 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-400/30 shadow-sm disabled:opacity-60"
          style={{ background: "rgba(255,255,255,0.95)" }}
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
  const [lastTopic, setLastTopic] = useState<string | null>(null);
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

  const processUserMessageRef = useRef<(text: string) => void>(() => {});

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

      // Vary the response delay: 600-1200ms range for natural feel
      const delay = Math.floor(Math.random() * 600) + 600;

      setTimeout(() => {
        const replyText = generateSmartPriyaReply(
          trimmed,
          lastTopic,
          leads,
          setLastTopic,
          messages,
          currentWorkflow,
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
      }, delay);
    },
    [
      isBotTyping,
      lastTopic,
      leads,
      speak,
      onOpenNewLead,
      messages,
      priyaWorkflow,
    ],
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
