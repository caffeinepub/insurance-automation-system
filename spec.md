# Insurance Automation System — Priya AI Assistant

## Current State
The app has a FloatingAIChat component (green bot button, bottom-right) providing basic keyword-based chat. It has a separate VoiceAssistant component (PB Portal step guide, Hindi TTS) accessible from Lead Detail page. No unified AI assistant named "Priya" exists.

## Requested Changes (Diff)

### Add
- New `PriyaAssistant` component: a floating AI assistant named "Priya" replacing the existing FloatingAIChat
- Voice-first UI with a female avatar ("Priya")
- Welcome TTS greeting on open: "Hello, main Priya hoon. Main aapki insurance assistant hoon. Aapko kis cheez mein madad chahiye?"
- Speech-to-text (Web Speech API SpeechRecognition) for mic input
- Text-to-speech (Web Speech API SpeechSynthesis) for all responses — Hindi voice preferred
- Voice ON/OFF toggle and Mic ON/OFF toggle
- Stop assistant button
- Command chips: Quotation, Lead Create, Payment Process, Help
- Smart Flow commands:
  - Quotation: asks vehicle number → guides PB portal steps → RC check → warning if mismatch → confirm before next step
  - Lead Create: opens New Lead Form
  - Payment Process: speaks payment stage message
  - Help: explains NCB, IDV, claim terms
- Document Check mode: asks for missing documents, confirms received documents
- Quote Stage speech: "Quotation aa gaya hai, sabhi options check karein, highest payout plan select karein"
- Payment Stage speech: "Main payment process mein madad karungi"
- Smart Answer System: answers insurance questions (NCB, IDV, claim explanations)
- Error Alert: voice + visible text warnings
- Typing indicator when "thinking"
- Chat history within session
- Pulse animation on mic when listening

### Modify
- App.tsx: replace `FloatingAIChat` import/usage with `PriyaAssistant`
- FloatingAIChat.tsx: keep file but no longer rendered in App.tsx (replaced by Priya)

### Remove
- FloatingAIChat button from App.tsx (replaced by PriyaAssistant)

## Implementation Plan
1. Create `src/frontend/src/components/PriyaAssistant.tsx`
   - Floating button: round purple/indigo gradient, female bot icon, "Priya" label
   - Panel: WhatsApp-style chat panel with Priya header and online indicator
   - TTS engine: usePriyaVoice hook (Web Speech SpeechSynthesis, hi-IN voice, rate 0.85, pitch 1.1)
   - STT engine: usePriyaSpeech hook (Web Speech SpeechRecognition, continuous=false, lang=hi-IN+en-IN)
   - Welcome: auto-speak greeting on first open
   - Command chips row: Quotation, Lead Create, Payment, Help, and topic chips
   - Smart flow state machine: idle → collecting_vehicle → pb_steps → rc_check → document_check → quote → payment
   - Insurance Q&A map: NCB, IDV, claim, premium, policy, renewal definitions in Hinglish
   - Voice controls: mic toggle button (pulsing when active), voice/TTS toggle button, stop button
   - Error handling: show voice error banner + speak error message
2. Update `src/frontend/src/App.tsx`
   - Replace FloatingAIChat with PriyaAssistant
   - Pass onOpenNewLead callback for Lead Create command
3. Update `src/frontend/src/pages/DashboardPage.tsx`
   - Expose openNewLead handler via prop or state lifting so Priya can trigger the new lead form
