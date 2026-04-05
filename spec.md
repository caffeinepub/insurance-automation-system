# Insurance Automation System — Priya AI Professional Insurance Expert Training

## Current State

Priya AI assistant (`PriyaAssistant.tsx`) is a 2009-line component that handles:
- Dynamic response generation via `generateDynamicResponse()` and `generateSmartPriyaReply()`
- Pattern-matched Hindi+English responses for NCB, IDV, claim, premium, zero dep, add-ons, renewal, KYC, RC, PB portal, quotation, payment, documents, follow-up, status, agent tips
- Motor insurance keyword detection via `isMotorInsuranceRelated()`
- Off-topic rejection with Hindi message
- Voice (STT+TTS), 2.5s silence detection, waveform animation
- Workflow phases: app_dashboard, pb_portal, quotation, document_flow, customer_response, payment_flow
- Quick chips: App Dashboard Check, PB Portal Start, Quotation Guide, Document Upload, Payment Link, NCB kya hai?, Claim Process, Zero Dep, Help, Status Check

Gaps vs user's request:
- No IRDA/regulatory knowledge (KYC rules, mandatory docs compliance, IRDAI grievance)
- No market comparison knowledge (compare companies, claim settlement ratio, suggest best insurer)
- No comprehensive PB Partner workflow coverage (proposal step, plan selection nuances)
- No coverage for policy types beyond comprehensive/TP (SAOD, bundled, long-term)
- No PA cover explanation
- No Marathi keyword support in `isMotorInsuranceRelated()`
- No explicit "trainer" mode with structured learning responses
- No IRDA rules section in `buildKycReply`
- Voice style config (rate) could be more calm/slow
- Quick chips don't include IRDA/compliance topics
- No company comparison or payout ratio guidance

## Requested Changes (Diff)

### Add
- `buildIrdaRulesReply()` — IRDA KYC requirements, mandatory documents, compliance rules, IRDAI grievance portal guidance
- `buildMarketComparisonReply()` — compare top insurers (ICICI Lombard, Bajaj Allianz, HDFC ERGO, New India, Tata AIG, Digit), claim settlement ratios, network garages, payout highlights
- `buildBestPlanSuggestionReply()` — guide agent to suggest best plan based on car age, usage, customer profile
- `buildPolicyTypesReply()` — comprehensive coverage of SAOD, Bundled (1yr OD+5yr TP), Long-term policy, Floater policies
- `buildPaCoderReply()` — Personal Accident (PA) cover — mandatory ₹15L PA for owner-driver
- `buildProposalStepReply()` — PB Partner portal proposal step guidance
- `buildPlanSelectionReply()` — plan selection nuance: how to choose, what to compare
- Marathi keywords added to `isMotorInsuranceRelated()` (विमा, प्रीमियम, दावा, एनसीबी, आयडीव्ही, पॉलिसी, आरसी, आधार)
- New quick chips: "IRDA Rules", "Company Compare", "Best Plan", "PA Cover", "Policy Types"
- Trainer mode responses: when user asks "train me" or "sikhaao" — structured step-by-step learning format
- TTS rate changed from 0.85 to 0.80 for calmer voice
- Extended pattern matching in `generateDynamicResponse()` to route to all new builders

### Modify
- `buildKycReply()` — add IRDA-mandated KYC rules: eKYC via Aadhaar OTP, CKYC, PAN mandatory for >₹50K, physical KYC for high-value policies, IRDAI circular references
- `buildHelpReply()` — add new topic categories: IRDA Rules, Company Comparison, Policy Types, PA Cover
- `isMotorInsuranceRelated()` — add Marathi keywords
- `QUICK_CHIPS` — add 3-4 new insurance professional chips
- Voice TTS rate: 0.85 → 0.80
- `buildClaimRejectionReply()` — add IRDAI Ombudsman process detail
- `buildPbPortalReply()` — add proposal step guidance

### Remove
- Nothing removed — all existing functionality preserved

## Implementation Plan

1. Add Marathi keywords to `isMotorInsuranceRelated()` function
2. Add new builder functions after existing builders:
   - `buildIrdaRulesReply()` with KYC requirements and compliance
   - `buildMarketComparisonReply()` with insurer comparison and CSR data
   - `buildBestPlanSuggestionReply()` with profiling-based suggestions
   - `buildPolicyTypesReply()` with all policy type explanations
   - `buildPaCoderReply()` for PA cover mandatory rules
   - `buildProposalStepReply()` for PB portal proposal step
   - `buildPlanSelectionReply()` for plan selection guidance
3. Add routing patterns in `generateDynamicResponse()` for all new topics
4. Update `buildKycReply()` with IRDA compliance detail
5. Update `buildHelpReply()` with new topics
6. Update `buildClaimRejectionReply()` with ombudsman detail
7. Update `buildPbPortalReply()` with proposal step
8. Update `QUICK_CHIPS` array with new professional chips
9. Change TTS rate from 0.85 to 0.80
10. Validate and build
