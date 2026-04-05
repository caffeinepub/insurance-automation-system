# PB Insurance AI - Complete Insurance Automation System

## Current State

The app is a fully client-side insurance CRM (Version 23/24) with:
- Login system (Admin + 3 Agents) with role-based access
- Dashboard with Total Leads, Pending Leads, Completed Policies, Total Business, Commission
- Lead Management with a 10-step workflow modal
- New Lead Full Form wizard (3 steps: Contact, Vehicle Docs, KYC Docs)
- Document upload (RC Front/Back, Old Policy, PAN, Aadhaar Front/Back)
- Customer Tracking page (enter mobile, see status/payment link/policy)
- WhatsApp integration: prefilled messages, quick action buttons, follow-up reminder
- Agent performance dashboard with Today/Month/All Time filters
- Floating WhatsApp button with in-app AI chat panel
- PWA support (manifest, service worker, icons, splash)
- Update notification banner
- Workflow statuses: Docs Pending → Docs Received → Details Completed → Quotation Ready → PB Action Required → KYC Completed → Payment Sent → Completed

## Requested Changes (Diff)

### Add
- Status filter bar above the leads table (filter by: All, Docs Pending, Docs Received, Details Completed, Quotation Ready, PB Action Required, KYC Completed, Payment Sent, Completed)
- "Create Lead from WhatsApp Message" button + modal: paste WhatsApp message text, extract mobile number, detect insurance relevance, auto-create lead if valid
- Admin Control Panel page: add new agents, delete agents, view all leads, see total business summary
- Name/mobile search filter in leads list
- Clickable payment link icon in lead table row for quick access
- Status badge color improvements throughout
- KYC Pending status added to workflow flow

### Modify
- DashboardPage: add status filter bar component above LeadTable
- Lead table: add payment link quick-access icon column, add search/filter input
- AppContext: expose agentManagement functions (addAgent, removeAgent) for Admin Control Panel
- Sidebar: add Admin Control Panel nav item (admin only)
- App.tsx: wire Admin Control Panel page view

### Remove
- Nothing removed — all existing features preserved

## Implementation Plan

1. **types/index.ts**: Add `AdminAgent` type with id/name/email/password/whatsapp; add `KYC Pending` to WorkflowStatus union (already present as string but formalize).

2. **AppContext.tsx**: 
   - Add `agentList` state (dynamic list of agents initialized from AGENTS)
   - Add `addAgent(agent)` and `removeAgent(email)` functions
   - Add `createLeadFromMessage(message)` function that parses mobile number via regex and creates a lead
   - Expose these in context type

3. **DashboardPage.tsx**: 
   - Add status filter bar (horizontal scrollable chip row) above LeadTable
   - Add search input (by name or mobile) above the filter bar
   - Pass filtered leads to LeadTable

4. **LeadTable.tsx**: 
   - Add payment link quick-access icon in each row (link icon if paymentLink is set)

5. **New component: WhatsAppLeadModal.tsx**:
   - Modal with text area to paste WhatsApp message
   - Parse mobile number (regex for 10-digit Indian mobile)
   - Detect insurance keywords (insurance, policy, RC, vehicle, car, bike, renew)
   - If valid: show preview and "Create Lead" button
   - If invalid: show error message
   - On create: call addLeadFull with extracted data and close modal

6. **New component: AdminControlPanel.tsx**:
   - Tab 1: Agent Management — list agents, add agent form (name, email, password, whatsapp), delete button per agent
   - Tab 2: All Leads summary — total count, completed, business totals
   - Tab 3: Business Overview — chart/table of business per agent

7. **Sidebar.tsx**: Add "Admin Panel" nav item visible only to admin role

8. **App.tsx**: Add `admin-panel` view state and render AdminControlPanel when selected

9. **DashboardPage.tsx**: Add "Create Lead from WhatsApp Message" button in the header area next to "New Lead" button
