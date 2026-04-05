# PB Insurance AI - Premium SaaS UI Upgrade

## Current State

The app has a functional but standard light-mode UI with:
- White card dashboard on gray background
- Flat sidebar with dark navy (`oklch(0.13-0.17 0.015 255)`) gradient
- Small KPI cards (3-column mobile, 6-column desktop) with light colored backgrounds (bg-blue-50, bg-purple-50, etc.)
- Standard shadcn buttons (gray-900 / blue-600)
- Lead cards: white border cards on white background
- StatusBadge: light pastel backgrounds (bg-orange-100, text-orange-800) — light-mode only
- PriyaAssistant floating button: purple/indigo gradient
- Login page: dark navy gradient background with white card form
- Footer: plain text "Powered by Prashant Chandratre | 7709446589"
- No glassmorphism, no glow effects, no animated shimmer
- Header subtitle says only "by Prashant" / "Insurance Automation System"

## Requested Changes (Diff)

### Add
- Full dark-mode premium theme: deep navy-to-indigo gradient background app-wide
- Glassmorphism cards: backdrop-blur, semi-transparent white/blue borders, frosted effect
- Large KPI cards on dashboard: Total Leads, Business ₹, Commission ₹, Conversion % — with gradient icon backgrounds and large readable numbers
- "Priya AI Assistant" card on dashboard: shows status Active 🟢, glowing animated voice/mic icon, pulsing ring
- Welcome text: "Welcome back! Priya is ready to help you close more deals 💰"
- Header branding upgrade: add subtitle "AI Insurance Trainer 🚀" and tagline "Train • Guide • Close Faster 💰"
- Gradient buttons with glow box-shadow effect (rounded-full or rounded-xl)
- Color-coded status badges redesigned for dark background (glow/neon effect)
- Loading shimmer animation using CSS keyframes on skeleton/placeholder elements
- Smooth entrance animations on cards (fade-up on mount, staggered)
- Footer: "Powered by Prashant Chandratre | 7709446589" styled prominently

### Modify
- `index.css`: Override CSS variables to switch to dark navy theme; add shimmer keyframe, glow utilities, glassmorphism utility class
- `LoginPage.tsx`: Upgrade to premium dark glass card design; enhance header with new tagline; keep all functionality intact
- `DashboardPage.tsx`: Replace small KPI cards with large premium KPI cards (4 primary: Total Leads, Business ₹, Commission ₹, Conversion %); add Priya AI Assistant card; update welcome text; add entrance animations
- `Sidebar.tsx`: Upgrade to glassmorphism panel with glowing active item, enhanced branding with new taglines
- `LeadCard.tsx`: Dark glass card style, animated hover, status badges with neon/glow colors for dark bg
- `StatusBadge.tsx`: Dark-mode aware badge colors with slight glow
- Mobile header: upgrade to match dark premium theme

### Remove
- All `bg-white`, `border-gray-200`, `bg-gray-50` styles on main dashboard surfaces (replace with glass/dark equivalents)
- Light pastel badge backgrounds from StatusBadge (replace with dark semi-transparent neon versions)

## Implementation Plan

1. **index.css**: Add dark theme CSS variables, shimmer keyframe (`@keyframes shimmer`), glow utility, glass utility class. Set body background to deep navy-indigo gradient.
2. **LoginPage.tsx**: Dark gradient background (already dark), upgrade card to glassmorphism (backdrop-blur, border-white/10, bg-white/5), enhance branding with new subtitle lines, gradient submit button with glow.
3. **Sidebar.tsx**: Add new taglines under logo ("AI Insurance Trainer 🚀" + "Train • Guide • Close Faster 💰"), glassmorphism panel, glowing active nav item.
4. **DashboardPage.tsx**:
   - Replace 6 small cards with 4 large premium KPI cards (Total Leads, Business ₹, Commission ₹, Conversion %). Conversion = (completed/totalLeads)*100.
   - Add "Priya AI Assistant" feature card (status Active 🟢, glowing pulse icon).
   - Update welcome/greeting text to: "Welcome back! Priya is ready to help you close more deals 💰"
   - All sections use glass card style.
   - Entrance animations (translate-y + opacity fade).
5. **LeadCard.tsx**: Glass dark card, smooth hover scale, status badge with glow colors.
6. **StatusBadge.tsx**: Dark-background-aware badge palette with neon accent colors.
7. **Buttons** throughout: gradient blue/indigo, rounded-xl, box-shadow glow.
