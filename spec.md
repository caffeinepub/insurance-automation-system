# Insurance Automation System

## Current State
- Lead detail panel (Sheet/drawer) opens when clicking a row
- Detail panel has: Mobile, Name, Claim, NCB%, Owner Change, Payment Link
- Workflow Status is only editable via a dropdown in the table row
- "Open PB Portal" button only exists in the top-right header
- Payment link saves on "Save Changes" click

## Requested Changes (Diff)

### Add
- Workflow Status dropdown inside the lead detail panel (syncs immediately to context)
- "Open PB Portal" button inside the lead detail panel (opens https://www.pbpartners.com)
- Status change toast notification triggered from within the detail panel

### Modify
- Lead detail panel to include the Workflow Status field near the top (after Name/Mobile)
- Payment Link section: keep existing behavior but ensure it's visually prominent and easy to fill
- Save Changes button should save all fields including status change
- Detail panel should read live lead from context (not stale props) so status shows current value

### Remove
- Nothing removed

## Implementation Plan
1. In `LeadDetailPanel.tsx`:
   - Add `workflowStatus` state initialized from `lead.workflowStatus`
   - Add a WorkflowStatus `<select>` dropdown (same styling as LeadTable) near top of form
   - Add "Open PB Portal" `<a>` button (styled like the header button) above the save/cancel buttons
   - Include `workflowStatus` in the `updateLead` call in `handleSave`
   - Also trigger an instant status update (call `updateLead` on status change) so table updates live
   - Sync from live lead: use `leads.find(l => l.id === lead.id)` inside the component to always read fresh data
