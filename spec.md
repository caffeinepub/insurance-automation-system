# Insurance Automation System — Priya Real AI Engine

## Current State
Priya's response logic is entirely a large keyword-matching function (`generateDynamicResponse` + `generateSmartPriyaReply`) in `PriyaAssistant.tsx`. It uses ~1500 lines of if/else keyword detection and hardcoded reply strings — no actual AI. Every reply is scripted.

## Requested Changes (Diff)

### Add
- A real AI engine function `callPriyaAI(userMessage, conversationHistory)` that calls the Gemini API (Google's free-tier LLM) directly from the browser via fetch
- A system prompt that defines Priya's personality, expertise (motor insurance expert, Hindi+English+Marathi), and rules (only answer insurance questions)
- Conversation history passed to the API so Priya has context across turns
- Graceful fallback message if API call fails

### Modify
- `generateSmartPriyaReply` → replaced by the real AI call
- `generateDynamicResponse` → removed entirely (no more static scripts)
- All hardcoded `buildXxxReply` functions → removed entirely
- All keyword arrays (MOTOR_INSURANCE_KEYWORDS etc.) → removed
- The `handleSend` flow → now calls async AI function, shows loading state while waiting

### Remove
- All ~1500 lines of static keyword-matching and hardcoded reply builders
- `ConversationContext` interface and related logic
- `isMotorInsuranceRelated` function (AI handles this via system prompt)

## Implementation Plan
1. Add `callPriyaAI` async function with Gemini API call, system prompt, and conversation history
2. Replace `generateSmartPriyaReply` call in `handleSend` with async `callPriyaAI` call
3. Remove all dead code (keyword matchers, reply builders, static scripts)
4. Keep voice/mic/TTS pipeline unchanged — only the response text generation changes
5. Keep workflow chips (App Dashboard Check, PB Portal Start, etc.) — these send their chip text as user messages and Priya answers dynamically
6. Add loading indicator (typing bubble) while AI is processing
