# Insurance Automation System

## Current State
The DashboardPage has a stats row (Total Leads, Policies, Pending, Completed, Business, Commission) and, for Admin, a per-agent commission breakdown table. There is no dedicated "Agent Performance Dashboard" section and no time-based filtering (Today / This Month).

## Requested Changes (Diff)

### Add
- An "Agent Performance" section on the Dashboard (visible to both Admin and Agent roles).
  - For Admin: shows all agents in a card/row grid with each agent's metrics.
  - For Agent: shows their own personal performance metrics.
- Four KPI metrics per agent/view:
  1. Leads Handled (total leads assigned to agent)
  2. Completed Policies (workflowStatus === 'Completed')
  3. Total Business (sum of policyAmount for completed leads)
  4. Commission Earned (calculated: policyAmount × commissionPercent / 100)
- Time filter toggle: "Today" | "This Month" — filters which leads are counted for the four KPIs.
  - Today: leads where createdAt is today's date.
  - This Month: leads where createdAt is within the current calendar month.
  - Default: This Month.

### Modify
- DashboardPage.tsx: add performance section with time filter state and filtered stats computation.
- The existing Agent Commission Breakdown table (admin-only) remains but the new performance section replaces/complements it visually.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `perfFilter` state (`'today' | 'month'`) in DashboardPage.
2. Compute `filteredLeads` based on perfFilter (today = same calendar date, month = same year+month).
3. For Agent role: compute single-agent KPIs from filteredLeads scoped to currentUser.
4. For Admin role: compute per-agent KPIs from filteredLeads for each agent in AGENTS array.
5. Render a new "Agent Performance" card section below the stats grid:
   - Filter toggle buttons: "Today" / "This Month".
   - Agent role: 4 KPI metric cards in a 2×2 or 1×4 grid.
   - Admin role: table or card-grid showing all agents with 4 columns.
