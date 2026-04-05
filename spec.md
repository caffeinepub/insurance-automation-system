# Insurance Automation System — Priya Global Assistant + PB Portal Integration

## Current State

- `PriyaAssistant` component exists with two modes: `inline` (rendered inside DashboardPage) and floating popup.
- In `App.tsx`, `PriyaAssistant` is rendered **only** when `currentUser` is set and only inside the main view — **not** on admin-panel or customer-tracking views.
- On DashboardPage, `PriyaAssistant` is also rendered in `inline` mode inside the dashboard content — creating two instances.
- The inline Priya has always-visible behavior but is buried in the scroll content. The floating Priya is only visible on the dashboard/leads view.
- PB Portal (`https://www.pbpartners.com`) is opened via `<a target="_blank">` links. There is no event/callback fired when the portal opens.
- Current greeting when Priya opens: generic insurance welcome message.
- PB Portal step guidance exists (5 steps: vehicle entry, fuel check, variant check, RC match, quotation) but requires the user to manually type "PB Portal Start".
- Duplicate Priya: inline in dashboard + floating button in App.tsx = two instances.

## Requested Changes (Diff)

### Add
- **Global floating Priya on ALL screens**: Move the single floating `PriyaAssistant` to `App.tsx` so it renders on every authenticated view (dashboard, admin panel, lead detail, etc.).
- **PB Portal context detection**: When any "Open PB Portal" link/button is clicked, set a global context flag `pbPortalOpen: true`. Priya detects this and:
  - Automatically opens her floating panel.
  - Speaks and shows the PB Portal welcome message: "Hello 👋 Main Priya hoon, main aapki madad karungi step-by-step policy banane mein"
  - Immediately enters `pb_portal` workflow phase and starts Step 1 guidance.
- **Step-by-step PB Portal flow** (5 steps, shown one at a time):
  - Step 1: "Sabse pehle vehicle number enter kariye"
  - Step 2: "Ab details verify kariye"
  - Step 3: "Ab quotation nikaalte hain"
  - Step 4: "Ab best plan select kariye"
  - Step 5: "Ab payment link generate karein"
- **Context-aware greeting**: If `pbPortalOpen` context is active, greeting becomes the PB Portal welcome. If dashboard is open, greeting stays as lead guidance.
- **Fallback system**: If `window.speechSynthesis` is unavailable or throws, Priya silently falls back to text-only chat mode (no crash, no error shown to user).
- **`pbPortalOpen` global context**: New state in `AppContext` so any component can signal portal is open.

### Modify
- **App.tsx**: Move `<PriyaAssistant />` (floating mode) to render on ALL authenticated views — not just the main dashboard view. Remove the floating instance that was conditionally rendered.
- **DashboardPage.tsx**: Keep the `inline` `PriyaAssistant` on the dashboard content for the embedded chat card. Also update all PB Portal `<a>` buttons to call `setPbPortalOpen(true)` via context when clicked.
- **PriyaAssistant.tsx**:
  - Accept new optional prop `pbPortalJustOpened?: boolean` (or read from context `pbPortalOpen`).
  - When `pbPortalOpen` becomes `true`, auto-open the floating panel (if not already open), speak the PB Portal welcome message, and start `pb_portal` phase at Step 1.
  - Reset `pbPortalOpen` to `false` in context after handling (one-shot trigger).
  - Update the 5 PB Portal step messages to match exactly:
    - Step 1: "Sabse pehle vehicle number enter kariye"
    - Step 2: "Ab details verify kariye"
    - Step 3: "Ab quotation nikaalte hain"
    - Step 4: "Ab best plan select kariye"
    - Step 5: "Ab payment link generate karein"
  - Voice fallback: wrap all `speak()` calls in try/catch; if voice fails, ensure text still shows.
- **AppContext.tsx**: Add `pbPortalOpen: boolean` and `setPbPortalOpen: (v: boolean) => void` to context.

### Remove
- **Duplicate Priya in App.tsx**: The `{currentUser && <PriyaAssistant />}` line that only rendered on main view. Replace with a truly global render.
- The inline `PriyaAssistant` remains on dashboard only (it is the embedded chat card, not a duplicate of the floating one — these serve different UI purposes and should be kept separate).

## Implementation Plan

1. **AppContext.tsx**: Add `pbPortalOpen` boolean state + setter.
2. **App.tsx**: Render `<PriyaAssistant />` (floating) globally for ALL authenticated views (dashboard, admin panel, customer tracking is excluded as user is not logged in).
3. **DashboardPage.tsx**: Call `setPbPortalOpen(true)` from context on every PB Portal link/button click (there are two: desktop header and mobile header, and one in the lead detail section). Import `useApp` for this.
4. **PriyaAssistant.tsx**:
   - Read `pbPortalOpen` and `setPbPortalOpen` from `useApp()`.
   - Add `useEffect` watching `pbPortalOpen`: when it becomes `true`, auto-open panel, reset `pbPortalOpen` to `false`, fire the PB Portal greeting message + voice, set workflow to `pb_portal` phase step 0.
   - Update `buildPbPortalStepReply` step messages to the 5 exact user-specified steps.
   - Add try/catch voice fallback in `speak()` usage.
