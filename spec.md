# PB Insurance AI — Priya Dual Dashboard Training (Version 40)

## Current State

Priya AI (`PriyaAssistant.tsx`) is a unified chat+voice assistant with:
- Dynamic response generation via `generateSmartPriyaReply(userMsg, lastTopic, leads, setLastTopic, conversationHistory)`
- 25+ insurance-topic builders (NCB, IDV, claim, premium, PB Portal text guidance, quotation, payment, documents, etc.)
- `lastTopic` string tracking for basic continuity
- Lead data integration: aggregate-only checks (count of leads with missing docs, count with payment pending)
- No stateful multi-step workflow — all step guidance is embedded in plain text responses
- No per-lead deep inspection (no reading individual lead names, vehicle numbers, NCB values, specific doc status)
- PB Portal guidance is static text only — no step-by-step tracking, no RC mismatch detection

## Requested Changes (Diff)

### Add

1. **Workflow State Engine** inside Priya:
   - A `priyaWorkflow` state object tracking: `{ phase, subStep, activeLead, pbPortalStep, awaitingInput }`
   - Phases: `idle | app_dashboard | pb_portal | quotation | document_flow | customer_response | payment_flow`
   - `pbPortalStep`: 0–5 tracking (vehicle_entry → fuel_check → variant_check → rc_match → quote_ready → complete)

2. **App Dashboard Mode** — when Priya detects "dashboard", "lead", "status", "check" or agent asks about a specific lead:
   - Read the active lead from context (most recent lead or agent's leads)
   - Report: name, vehicle, status, missing documents, next recommended step
   - Alert if critical data missing (no mobile, no RC, no PAN)
   - Suggest exact next action in short, clear Hindi+English

3. **PB Portal Step-by-Step Guide Mode** — when agent says "PB portal start", "quotation leni hai", "portal pe jaana hai", "vehicle number":
   - Track step number in state
   - Step 1: Vehicle Number entry guidance + warn to match RC exactly
   - Step 2: Fuel type check (Petrol/Diesel/CNG/EV) — cross-check with RC data if available
   - Step 3: Variant/model check — warn to match RC exactly
   - Step 4: RC match verification — detect mismatch if lead has RC data
   - Step 5: Quotation generation — prompt to check all plans
   - Warn on each step if lead data is available and a mismatch is likely
   - Advance step on user confirmation ("ho gaya", "done", "next", "aage", "ok")

4. **Quotation Flow Guidance**:
   - After Step 5 (quotation ready), guide agent to compare all plan tiers
   - Suggest highest-payout plan selection criteria (comprehensive, zero dep, higher IDV)
   - Ask agent to take screenshot of quotation

5. **Document Flow**:
   - After quotation confirmed, ask agent to upload screenshot/PDF of quotation
   - Remind to save in lead documents section
   - Guide to send to customer via WhatsApp (with pre-filled message hint)

6. **Customer Response Handling**:
   - If agent reports "customer agreed" / "customer ne haan kaha" / "policy banao":
     - Guide through policy creation steps on PB Portal
     - KYC completion guidance

7. **Payment Flow**:
   - Guide to generate payment link on PB Portal
   - Instruct to paste payment link in the lead's Payment Link field in the app
   - Guide to send via WhatsApp button

8. **Context Awareness** (always knows current step):
   - Store `priyaWorkflow` phase in component state (not just `lastTopic`)
   - Each reply appends: "Next step: [konkret action]" at the bottom
   - If workflow phase is active, every message acknowledges current phase

9. **Error Detection**:
   - In app dashboard mode: detect and alert for missing mobile, missing RC, missing PAN/Aadhaar
   - In PB portal mode: detect fuel/variant mismatch if RC data is in the lead
   - In payment mode: alert if payment link field is empty in lead
   - Alert formatting: "⚠️ Warning: [issue]"

10. **Quick Chips Update**:
    - Add: "App Dashboard Check", "PB Portal Start", "Quotation Guide", "Document Upload", "Payment Link"
    - Keep existing: NCB, Claim, Zero Dep, Premium, Help

### Modify

1. **`generateSmartPriyaReply`** — add `priyaWorkflow` param and `setWorkflow` setter so step tracking integrates into reply generation
2. **`buildPbPortalReply`** — replace static text with dynamic step-specific guidance based on current `pbPortalStep`
3. **`buildDocumentsReply`** — add per-lead detail: show lead name + which specific docs are missing (not just count)
4. **`buildPaymentReply`** — add per-lead detail: show lead name + payment status
5. **Quick chips array** — update with 5 new chips replacing less-used ones
6. **Main `processUserMessage` handler** — advance `priyaWorkflow` state based on confirmation keywords

### Remove

- None — all existing functionality preserved

## Implementation Plan

1. Define `PriyaWorkflow` interface with `phase`, `subStep` (pbPortalStep 0–5), `activeLead`, `awaitingInput`
2. Add `priyaWorkflow` state to `PriyaAssistant` component, initialized to `{ phase: 'idle', subStep: 0 }`
3. Add workflow phase detection in `processUserMessage`:
   - PB portal triggers: set phase to `pb_portal`, subStep to 0
   - Dashboard triggers: set phase to `app_dashboard`
   - Quotation triggers: set phase to `quotation`
   - Confirmation keywords: advance subStep
   - Payment triggers: set phase to `payment_flow`
4. Add `buildAppDashboardReply(ctx, leads, workflow)` — reads leads, returns status summary + next step
5. Upgrade `buildPbPortalReply` → `buildPbPortalStepReply(ctx, step, activeLead)` — returns step-specific instruction
6. Add `buildQuotationFlowReply(ctx, step)` — covers quotation comparison + screenshot guidance
7. Add `buildDocumentFlowReply(ctx, leads, activeLead)` — upload prompt + WhatsApp send guidance
8. Add `buildCustomerResponseReply(ctx)` — policy creation guidance
9. Add `buildPaymentFlowReply(ctx, leads, activeLead)` — payment link generation + WhatsApp guide
10. Add `detectErrors(leads, workflow)` — returns array of error strings to prepend to any reply when in active workflow
11. Update quick chips array with 5 new workflow chips
12. Wire all new builders into `generateSmartPriyaReply` dispatch logic
