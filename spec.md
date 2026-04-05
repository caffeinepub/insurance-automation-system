# PB Insurance AI - AI Chat Logic

## Current State
App has an insurance lead management system with leads that have statuses (Docs Pending, KYC Pending, Payment Sent, etc.) and document upload fields (rcFront, rcBack, panCard, aadhaarFront, aadhaarBackData). There is no floating chat widget currently in App.tsx (the Version 23 floating WhatsApp button is not present in codebase).

## Requested Changes (Diff)

### Add
- A floating green WhatsApp-style chat button (fixed, bottom-right corner)
- An in-app AI chat panel that opens when the button is clicked
- AI chat bot logic with rule-based responses based on lead status and document state

### Modify
- App.tsx: Add the FloatingAIChat component so it renders globally on top of all pages (only when user is logged in)

### Remove
- Nothing

## Implementation Plan

1. Create `src/frontend/src/components/FloatingAIChat.tsx`
   - Floating green round button (fixed bottom-right, z-50)
   - Chat panel (WhatsApp-style bubbles) that opens/closes on button click
   - Header: "PB Insurance AI" with green dot (online)
   - AI bot logic:
     - If user types "hi" or "hello" (case-insensitive) → reply: "Please upload RC copy"
     - If user types/asks about RC or uploads → if rcFront or rcBack not uploaded → reply: "Please send RC front and back"
     - If user asks about documents or mentions missing docs → if panCardData is null or aadhaarFrontData is null → reply: "Please upload your PAN card and Aadhaar card (front and back)"
     - If user asks about payment or mentions pending → if paymentStatus is "Payment Pending" → reply: "Please complete payment using link: [paymentLink if available]"
     - Default fallback reply when no rule matches
   - The chat panel is standalone (not tied to a specific lead); uses a general context-aware response system
   - Chat messages have timestamps, user and bot bubbles styled like WhatsApp
   - The chat window has an input field and send button

2. Update `src/frontend/src/App.tsx`
   - Import and render `<FloatingAIChat />` inside AppInner, only when currentUser is truthy
