# PB Insurance AI — Final System Fix + Upgrade (Version 45)

## Current State

- App is a full-featured insurance CRM PWA (dark navy glassmorphism theme)
- Priya AI assistant is wired to Google Gemini 1.5 Flash via `VITE_GEMINI_API_KEY`
- PriyaAssistant.tsx is the single AI interface (floating button + chat panel)
- FloatingAIChat.tsx still exists as a second (duplicate) WhatsApp-style bot with its own floating button
- New Lead form is in `NewLeadFullForm.tsx` (3-step wizard, dialog-based)
- Currency is displayed in various places as `₹` but some legacy `\u20B9` escapes may remain
- Input fields in dark theme: CSS override in index.css sets `color: #ffffff` on all inputs
- WhatsAppLeadModal extracts mobile number and insurance keywords from pasted text
- AppContext provides live lead data (total, pending, completed, business amounts)
- Dashboard is `DashboardPage.tsx` with KPI cards
- No error boundary or self-healing system exists currently
- Heavy animations present (fadeInUp, shimmer, pulse glow on many elements)

## Requested Changes (Diff)

### Add
- Auto error boundary / self-healing wrapper around the main app that detects blank screens or component crashes, shows "System refreshing, please wait..." and auto-reloads the component
- `formatINR(amount)` utility function for Indian number formatting (e.g. ₹14,500)
- Fallback UI on NewLeadFullForm: if dialog fails to render, show "Loading form..." and retry after 1s
- WhatsApp lead modal: also extract customer name from message (look for common patterns like "My name is X" or "Main X hoon")
- Dashboard AI context: pass total leads, pending leads, today's leads, completed policies, total business ₹ as context to Priya's system prompt so she can answer "Aaj kitna business hua?"

### Modify
- **Currency**: Replace every hardcoded `\u20B9` Unicode escape in JSX/TSX with the literal `₹` character, and wrap all monetary values through `formatINR()`
- **Form Fix**: Ensure New Lead button's `onClick` correctly sets `showNewLeadForm = true`. Add a try/catch error boundary around `<NewLeadFullForm>` render so crashes don't show blank screen
- **UI Visibility**: Update `index.css` input override — dark mode inputs should have `background: #1E1E2F`, `color: #FFFFFF`. Light inputs (inside modals with white bg) need explicit `color: #000000` via a `.light-input` class or by overriding the dialog context. Chat input in PriyaAssistant must be clearly visible
- **FloatingAIChat**: Remove the entire FloatingAIChat component and its floating button from the app — keep only PriyaAssistant as the single AI interface. `FloatingAIChat.tsx` can remain as a file but must NOT be rendered anywhere in App.tsx or DashboardPage.tsx
- **PriyaAssistant**: 
  - Update Gemini system prompt to include live dashboard data (total leads, pending, business ₹)
  - Ensure the off-topic response rule is enforced: "Ye motor insurance se related nahi hai, main isme madad nahi kar paungi"
  - Voice: ensure `continuous=true`, `interimResults=true`, 2.5s silence detection before processing (already implemented — verify it is intact)
  - Remove any remaining static keyword-match fallback code; all responses must go through Gemini
- **WhatsAppLeadModal**: Extract name in addition to mobile. After extraction show name in result if found
- **Performance**: Remove `animate-fadeInUp` class from the main dashboard grid/cards (keep only on first load if needed). Reduce or eliminate `animate-shimmer` on non-loading elements. Remove `backdrop-filter: blur()` from `.glass-card` or reduce to 4px
- **Dashboard Priya card**: Update "Talk to Priya" to reliably open the Priya panel (not a no-op)

### Remove
- Remove `FloatingAIChat` render from all pages (App.tsx, DashboardPage.tsx wherever it is used)
- Remove all `\u20B9` Unicode escape strings; replace with literal `₹`
- Remove heavy multi-step shimmer animations on static loaded content

## Implementation Plan

1. **`src/utils/formatCurrency.ts`** — add `formatINR(amount: number): string` using `Intl.NumberFormat('en-IN')` with ₹ prefix
2. **`index.css`** — fix input visibility: dark inputs `bg:#1E1E2F text:#FFF`, add `.modal-input` class override for white-bg modals
3. **`App.tsx`** — add React `ErrorBoundary` class component wrapping the router output; on error show "System refreshing..." and `window.location.reload()` after 3s; remove FloatingAIChat import/usage
4. **`NewLeadFullForm.tsx`** — wrap render in try/catch error state; add loading fallback if `open` is true but content hasn't rendered within 500ms
5. **`PriyaAssistant.tsx`** — pass dashboard stats (from `useApp`) into system prompt; verify voice pipeline is intact; remove any leftover static keyword handlers; ensure single floating button only
6. **`WhatsAppLeadModal.tsx`** — add name extraction regex; show extracted name in parse result
7. **`DashboardPage.tsx`** — remove FloatingAIChat import; ensure "Talk to Priya" button works; reduce animation classes on KPI cards
8. **`AppContext.tsx`** / **`context`** — no changes needed; live lead data is already available
9. **Currency sweep** — replace `\u20B9` with `₹` in all files; wrap monetary display values through `formatINR()`
10. **Performance** — reduce `blur()` values in glass-card CSS, limit `animate-fadeInUp` to skeleton/initial load only
