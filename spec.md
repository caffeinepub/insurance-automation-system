# PB Insurance AI – Branding Update (Logo + Identity Fix)

## Current State
- Logo used: `/assets/generated/pb-logo.png` (white rounded square, blue shield with "PB" inside)
- Logo appears in: LoginPage (centered, 80x80), Sidebar (52x52, inline with text), DashboardPage mobile header (36x36), CustomerTrackingPage
- Some locations have fallback `<Shield>` icon if logo fails to load
- No brand tagline below logo on Login/Sidebar — currently shows "AI Insurance Trainer 🚀" and "Train • Guide • Close Faster 💰"
- Mobile header shows logo (small) + "PB Insurance AI" text only
- No "Priya Insurance AI Employee" text anywhere
- Sidebar branding has logo inline with text (not centered)

## Requested Changes (Diff)

### Add
- Brand text "Priya Insurance AI Employee" below the logo on: LoginPage, Sidebar, and mobile header
  - Style: small-medium font, blue-to-purple gradient, center aligned

### Modify
- LoginPage: Keep logo centered, high-res, no blur/fade; remove Rocket icon next to tagline; replace subtitle with "Priya Insurance AI Employee" gradient text
- Sidebar: Make branding section show logo prominently (centered in its container), add "Priya Insurance AI Employee" below app name in gradient
- DashboardPage mobile header: Logo left-aligned with app name "PB Insurance AI"; add "Priya Insurance AI Employee" sub-text; remove any duplicate icons
- CustomerTrackingPage: Same logo treatment — single logo, no duplicates
- All locations: Ensure logo uses pb-logo.png, is clearly visible, no blur, properly sized

### Remove
- Any duplicate logo instances or secondary Shield icons that appear alongside the real logo
- Rocket icon from LoginPage header area (clean minimal look)
- Extra tagline lines that clutter the header (keep single clean identity)

## Implementation Plan
1. Update `LoginPage.tsx`: clean logo block, add "Priya Insurance AI Employee" gradient text below h1, remove Rocket icon
2. Update `Sidebar.tsx`: add "Priya Insurance AI Employee" gradient text below app name
3. Update `DashboardPage.tsx` mobile header: add "Priya Insurance AI Employee" sub-text, ensure single clean logo block
4. Verify CustomerTrackingPage uses single pb-logo.png logo with no duplicates
