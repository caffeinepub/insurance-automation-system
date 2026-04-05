# PB Insurance AI — Version 48 Final Frontend Setup

## Current State

- `PriyaAssistant` is rendered TWICE: once inline in `DashboardPage` (with `inline` prop) and once as a floating button in `App.tsx`. This creates a duplicate Priya UI.
- `FloatingAIChat.tsx` exists and is no longer used (removed in v33) but the file still exists — not rendered anywhere.
- Branding: logo is `pb-logo.png`, "Priya Insurance AI Employee" gradient text is already in sidebar and login page. No major duplication issues with logo.
- Chat input styles have `background: rgba(255,255,255,0.10)` and `color: #ffffff` in login — but the main Priya chat input inside `ChatBody` needs to be audited for visibility.
- Voice system states (Listening/Processing/Speaking) exist in `PriyaAssistant` — need to verify they show proper state labels.
- `VoiceStateIndicator` component exists but only shows when voiceState is not idle — correct behavior.
- Silence detection (2.5s delay before processing) is implemented.
- Currency uses `formatINR` utility and ₹ symbol — already correct in most places.
- `FormErrorBoundary` in `App.tsx` shows "Loading form..." with auto-retry — already implemented.
- `AppErrorBoundary` shows "System refreshing, please wait..." — already implemented.
- AI engine: calls Google Gemini with a comprehensive system prompt. System prompt includes language matching, insurance filtering, and dashboard data context.

## Requested Changes (Diff)

### Add
- Nothing new to add — all requested features exist or need fixing.

### Modify

1. **DUPLICATE PRIYA FIX**: Remove the floating `<PriyaAssistant />` from `App.tsx` (lines 115 and 131). The inline `<PriyaAssistant inline ... />` inside `DashboardPage` dashboard section is the single source. The floating version in `App.tsx` is the duplicate — REMOVE IT from `App.tsx`. Keep only the inline version in `DashboardPage`.
   - BUT: The floating version is needed for AdminControlPanel and other non-dashboard screens. Solution: Keep only ONE floating `<PriyaAssistant />` in `App.tsx` (one instance) and REMOVE the inline version from `DashboardPage`. The floating panel opens when clicked and is always accessible.
   - This is cleaner: one global floating Priya everywhere, no inline duplicate.

2. **PRIYA STATUS DISPLAY**: In the `ChatBody` header section of `PriyaAssistant.tsx`, ensure the avatar shows and the status text reads "Priya Active 🟢" (currently shows "Active 🟢" — need to verify exact text and add the name).

3. **CHAT INPUT VISIBILITY**: In `PriyaAssistant.tsx` `ChatBody` component, the input field at the bottom must have:
   - `background: #1E1E2F`
   - `color: #FFFFFF`
   - `placeholder` text visible (use `rgba(255,255,255,0.4)` or similar)
   - The input container background must also be `#1E1E2F` or darker so typed text contrasts well.

4. **CHAT BUBBLES**: Ensure bot bubbles are readable — light text on dark background. User bubbles should be clearly distinct (e.g., blue/purple gradient). No transparent or invisible text.

5. **VOICE STATE LABELS**: In `VoiceStateIndicator` or wherever voiceState is shown in the UI, ensure three visible states display:
   - `Listening...` (when voiceState === 'listening')
   - `Processing...` (when voiceState === 'processing')
   - `Speaking...` (when voiceState === 'speaking')
   These must be clearly visible inside the chat panel header or near the mic button.

6. **GEMINI SYSTEM PROMPT IMPROVEMENTS**: Enhance the system prompt in `callPriyaAI()` to explicitly include:
   - Language detection: detect Hindi/English/Hinglish/Marathi and respond in same language
   - Short step-by-step replies (not all info at once)
   - Example behavior: User says "Bike insurance karna hai" → Priya replies "Ji sir 👍 main aapki madad karti hoon\n\nSabse pehle RC copy ya vehicle number share kariye"
   - Insurance filter: if non-insurance question, reply "Sorry, main sirf motor insurance related help kar sakti hoon"
   - Dashboard queries: answer about total leads, pending leads, business amount with real data

7. **CURRENCY**: Audit all places for `\u20B9` unicode escape and replace with `₹` literal. Check `formatINR` utility and any hardcoded strings.

8. **BRANDING**: Verify single logo usage — `pb-logo.png` used in Sidebar, LoginPage, mobile header in DashboardPage. The mobile header (top bar) in DashboardPage needs the logo + "Priya Insurance AI Employee" text centered. Remove any duplicate Shield icons used in place of real logo.

### Remove

- Remove the duplicate `<PriyaAssistant />` rendering — keep only ONE instance (floating, in App.tsx). Remove inline usage from DashboardPage.
- Remove the old inline `PriyaAssistant` dashboard card section from DashboardPage (the section with `<PriyaAssistant inline onOpenNewLead... />`).

## Implementation Plan

1. **`src/frontend/src/App.tsx`**: Keep only ONE `<PriyaAssistant />` render, for the logged-in state. Remove the duplicate render at line 131 that appears in the main `return` block. Keep the one at line 115 (admin panel) and ensure the main flow also has exactly one.

2. **`src/frontend/src/pages/DashboardPage.tsx`**: Remove the inline `<PriyaAssistant inline onOpenNewLead={...} />` section from the dashboard content area. Remove the import of `PriyaAssistant` from this file since it's no longer used here.

3. **`src/frontend/src/components/PriyaAssistant.tsx`**:
   - Header: Update status text to show "Priya Active 🟢"
   - Chat input: Set `background: #1E1E2F`, `color: #FFFFFF`, `caretColor: #FFFFFF`
   - Input wrapper/footer area: Set `background: #1E1E2F` or `#16182a`
   - Bot message bubbles: dark background with white text
   - User message bubbles: blue/purple gradient with white text
   - VoiceStateIndicator: ensure Listening/Processing/Speaking labels are visible
   - `callPriyaAI` system prompt: Add explicit language detection, step-by-step reply instruction, insurance filter rule, dashboard data context
   - Silence delay: confirm 2.5s silence detection is active (already implemented)

4. **`src/frontend/src/pages/DashboardPage.tsx`** mobile header: Verify logo shows `pb-logo.png` with fallback to Shield icon. Add "Priya Insurance AI Employee" gradient subtitle in mobile header if missing.

5. **Currency audit**: Search for any remaining `\u20B9` literals or unicode escapes and replace with `₹`.
